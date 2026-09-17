# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

`node_modules` is not installed yet. Install dependencies before following the AGENTS.md rule to read `node_modules/next/dist/docs/`.

## Layout

SmartBasket is a grocery delivery app with four roles: `user`, `deliveryBoy`, `shopkeeper` and `admin`. It is made of two processes:

- `smartbasket/smartbasket/` (this directory): Next.js 16 App Router, React 19, TypeScript, Tailwind v4, MongoDB/Mongoose, Auth.js v5 (`next-auth` beta).
- `smartbasket/socketServer/`: Express 5 + Socket.IO relay (`index.js`, ESM). It is part of the same git repo (the git root is `smartbasket/`).

The `smartbasketFolder/socketServer/` directory outside the git repo is an older stub with no event handlers. Don't edit it; use `smartbasket/socketServer/`.

## Scripts

```bash
node scripts/make-admin.mjs <email>          # promote a user to admin (first admin)
node scripts/backfill-product-fields.mjs     # add stock/isAvailable/rating to old documents
node scripts/clear-delivery-assignments.mjs  # clear every rider's current order, keep the orders
```

## Commands

```bash
# Next app (this directory). pnpm-workspace.yaml exists, but package-lock.json is also present
pnpm dev          # http://localhost:3000
pnpm build
pnpm lint         # eslint (flat config, eslint.config.mjs)

# Socket server (../socketServer)
npm run dev       # nodemon index.js, PORT defaults to 5000
```

There is no test suite.

## Environment

The Next app reads `.env.local`:
- `MONGODB_URI`, `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_SOCKET_SERVER`: URL of the socket server, used by both the browser and API routes
- `EMAIL`, `PASS`: Gmail credentials for the delivery OTP mail (`src/lib/mailer.ts`)
- `GEMINI_API_Key`: note the casing (`src/app/api/chat/ai-suggestions/route.ts`)
- `NEXT_PUBLIC_APP_URL`: origin used to build password-reset links (falls back to the request origin)
- `NEXT_PUBLIC_OSRM_URL`: routing server for the delivery map (defaults to OSRM's public demo server)

`.env.example` (and `../socketServer/.env.example`) list every variable with the file
that reads it. `EMAIL`, `PASS` and `GEMINI_API_Key` are still missing from `.env.local`,
so the delivery OTP mail, the password-reset mail and the AI chat suggestions cannot work
until they are filled in.

The socket server reads `.env`:
- `NEXT_BASE_URL`: the Next app URL, used for CORS and for calling back into the API
- `PORT`

## Architecture

### Auth and routing
- `src/auth.ts` sets up Auth.js with Credentials (bcrypt against `User.password`) and Google. Google sign-in creates the `User` document on first login.
- Sessions use JWT. `role` is copied into the token and session (typed in `src/next-auth.d.ts`). A client can change its role via `useSession().update({ role })`, which the `jwt` callback's `trigger === "update"` branch picks up.
- `src/proxy.ts` is the Next 16 replacement for `middleware.ts`. It redirects unauthenticated users to `/login` and guards `/user`, `/admin` and `/delivery` by role.
- The proxy matcher **excludes `/api`**, so every API route must call `auth()` itself if it needs protection. Many routes currently don't.
- `src/app/page.tsx` is the single role-based entry point. It is a server component that loads the user from Mongo:
  - If the profile has no `mobile` or `role`, it renders `EditRoleMobile`.
  - Otherwise it renders `UserDashboard`, `AdminDashboard` or `DeliveryBoy`, plus `GeoUpdater`.
  - There are no `/delivery/*` pages; the delivery UI lives under `components/`.
- Next 16 conventions used throughout: `params` and `searchParams` are Promises and must be awaited.

### Data
- Use `@/lib/db` (a connection cached on `global.mongoose`) and call `await connectDb()` at the top of every route or server component.
- `src/app/lib/db.ts` and `src/lib/db/connectDb.ts` are unused duplicates.
- Models live in `src/models/*.model.ts` and use the `mongoose.models.X || mongoose.model(...)` pattern to survive HMR.
  **Do not add a dev-only `mongoose.deleteModel(...)` before it.** That hack (drop the model so
  schema edits apply without a restart) re-registers the model on every module evaluation and
  left the React Server Component graph querying a model whose collection never flushed its
  buffer, so `/` failed with `Operation \`users.findOne()\` buffering timed out after 10000ms`
  while the API routes were fine. Restart `pnpm dev` after a schema edit instead.
- `connectDb` only reuses a handle whose `readyState` is 1. Returning the cached handle
  unconditionally hands out a dead socket after an idle timeout or a laptop sleep, and every
  query then buffers for 10s before failing.
- Server components pass Mongo documents to client components via `JSON.parse(JSON.stringify(doc))`.
- Groceries: prices and totals are stored as **strings**. `category` and `unit` are enums in `grocery.model.ts`. Images are uploaded through `uploadOnCloudinary` (`src/lib/cloudinary.ts`) from `FormData`.
- Client state: Redux Toolkit (`src/redux/`, with `user` and `cart` slices). Provider order in `layout.tsx` is `SessionProvider` > redux `StoreProvider` > `InitUser`.

### Realtime flow (both processes are involved)
Messages travel in two directions:
- **Browser to server:** `getSocket()` (`src/lib/socket.ts`, a singleton client) emits to the socket server. The socket server then persists the data by POSTing back to Next API routes:
  - `identity` → `/api/socket/connect`, which stores `User.socketId` and `isOnline`
  - `update-location` → `/api/socket/update-location`, then broadcasts `update-deliveryboy-location`
  - `join-room` (room id = orderId)
  - `send-message` → `/api/chat/save`, then emits `send-message` to the room
- **API route to browser:** routes call `emitEventHandler(event, data, socketId?)` (`src/lib/emitEventHandler.ts`). It POSTs to the socket server's `/notify`, which emits to one socket or broadcasts to all. Events sent this way: `new-order`, `order-status-update`, `new-assignment`, `order-assigned`.

When adding an event, update the emitter (a route or a component), the socket server, and every listener.

### Order lifecycle
1. `POST /api/user/order` creates the order (`pending`, `cod` or `online`).
2. Admin sets the status to `out of delivery` (`/api/admin/update-order-status/[orderId]`). This finds delivery boys within 10 km via a `$near` query on `User.location` (GeoJSON `[lng, lat]`), creates a `DeliveryAssignment`, and sends `new-assignment` to each delivery boy's socket.
3. A delivery boy accepts (`/api/delivery/assignment/[id]/accept-assignment`), which sets `order.assignedDeliveryBoy` and removes that boy from other broadcasts.
4. `/api/delivery/otp/send` emails a 4-digit OTP to the customer, and `/otp/verify` marks the order delivered.

Order chat uses `Message` documents whose `roomId` is the order id. `/api/chat/ai-suggestions` calls Gemini over REST to suggest replies.

## Catalogue, cart and reviews

- `Grocery` carries `stock`, `isAvailable`, `description`, `rating` and `numReviews`.
  `src/lib/grocery.ts` exports `sellableFilter` (`isAvailable: true, stock > 0`) - the
  single definition of "a customer may see and buy this". Spread it into every
  customer-facing query. `/api/groceries` is the public listing (search, `category`,
  `page`/`limit`); `/api/admin/get-groceries` is the admin view and returns everything.
- `src/lib/stock.ts` re-prices a cart from the database and reserves stock with a
  conditional `$inc` (no transactions - this Mongo may be standalone), rolling back on
  partial failure. `releaseStock` also backs order cancellation.
- `src/lib/cart.ts` holds the delivery-fee rule, shared by the Redux cart slice and
  the order route so client and server agree on the total.
- `Cart` stores `{ grocery, quantity }` per user; name/price/image are read back from
  `Grocery`. `/api/user/cart` (GET/PUT/DELETE) drives it, and `useCartSync` (mounted via
  `InitUser`) loads it on login, merges a guest cart, and debounce-saves changes.
- `Review` is one document per (grocery, user). The API only accepts a review when the
  caller has a `delivered` order containing the item, then recomputes
  `Grocery.rating`/`numReviews`.
- Products created before these fields existed need
  `node scripts/backfill-product-fields.mjs`, or the sellable filter hides the whole shop.

## Roles and accounts

- `/api/user/edit-role-mobile` accepts `user`, `deliveryBoy`, `shopkeeper` and `admin` (self-serve,
  picked once during onboarding at `EditRoleMobile`). All four roles, including full admin access, are self-selectable during initial setup.
  Subsequent role changes use `/api/admin/users/[id]/role` (admins only).
- `shopkeeper` manages the single shared grocery catalogue (no per-shopkeeper ownership)
  through the same pages as admin, `/admin/add-grocery` and `/admin/view-grocery` -
  `src/proxy.ts` lets shopkeepers into just those two `/admin/*` paths, and
  `get-groceries` accepts `admin` or `shopkeeper`; `add-grocery`, `edit-grocery`, and
  `delete-grocery` are shopkeeper-only. Admins can only view inventory and cannot open the add page. Everything
  else under `/admin` (orders, users, the dashboard) stays admin-only. Landing page for a
  shopkeeper is `ShopkeeperDashboard`.
- The `jwt` callback re-reads the role and active status from MongoDB on every session check.
  Never copy a role out of the `session` payload there - that is a client-controlled value.
- `User.isActive` gates sign-in (`src/auth.ts`) and delivery dispatch. Admins toggle it
  at `/admin/users`. Existing JWTs are rejected on their next session check when the account is inactive or deleted.
- Password rules live in `src/lib/password.ts` and are shared by register, reset and
  profile change. Reset tokens are stored as a sha256 hash with a 1-hour expiry.

## Dispatch, tracking and OTP

- `src/lib/dispatch.ts` (`dispatchOrder`) owns finding nearby, non-busy, active delivery
  boys and broadcasting to them. Both the admin "out of delivery" transition and
  `reject-assignment` call it; rejections are recorded on `DeliveryAssignment.rejectedBy`
  so a re-broadcast skips them.
- `DeliveryTracking` stores a throttled breadcrumb trail per order, written by
  `/api/socket/update-location`. `User.location` remains the single current position that
  the `$near` dispatch query needs.
- The delivery OTP expires after 10 minutes, locks after 5 wrong tries, is cleared on
  success, and only the assigned rider can send or verify it.
- `LiveMap` draws a real road route from OSRM (`useRoute`, `NEXT_PUBLIC_OSRM_URL`,
  defaulting to the free public demo server) and falls back to a dashed straight line.
  Leaflet touches `window` on import, so load `LiveMap` with `next/dynamic({ ssr: false })`.

## Known inconsistencies

Check these before debugging "nothing happens" issues in the realtime and delivery flow:

- **Socket event names don't match:**
  - Chat clients listen for `send-messages`, but the server emits `send-message`.
- **Duplicate register routes:** both `/api/register` and `/api/auth/register` exist
  (they now share the same password rules, but one should go).
- **Easypaisa route:** `src/app/api/easypaisa/direct-pay/` has hardcoded sandbox
  credentials and never creates an `Order`, so online payment does not place an order.
- **`/api/chat/messages` returns 500** and `DeliveryChat` crashes on
  `suggestions.map` when the AI suggestion call fails (`GEMINI_API_Key` unset).
- `src/app/lib/db.ts` and `src/lib/db/connectDb.ts` are still unused duplicates.

### Management CRUD

- Admin user management supports POST `/api/admin/users` and GET/PUT/DELETE
  `/api/admin/users/[id]`, plus paginated search. User fields are validated, passwords
  are hashed and omitted from responses, and duplicate emails return 409.
- Admins cannot delete, deactivate, or demote their own account. Rider role/status
  changes are blocked during active deliveries. Users with order history must be
  deactivated instead of deleted, preserving order references.
- Shopkeepers have full CRUD on the shared grocery catalog. Admin inventory is read-only
  in both the UI and the APIs. Product forms share validation for price, stock, category,
  availability, and image uploads.
