# SmartBasket

SmartBasket is a grocery ordering and delivery platform built with Next.js. It supports customer shopping, product and order management, delivery assignment and tracking, realtime chat, authentication, reviews, and role-based dashboards.

## Project Structure

- `smartbasket/` - Next.js application and API routes
- `socketServer/` - Socket.IO server for realtime tracking, chat, and notifications

## Requirements

- Node.js 20 or newer
- npm
- MongoDB
- A configured email account for password reset and delivery OTP messages

## Setup

Install dependencies for the web app:

```bash
cd smartbasket
npm install
```

Install dependencies for the realtime server:

```bash
cd ../socketServer
npm install
```

Create the web app environment file:

```bash
cd ../smartbasket
cp .env.example .env.local
```

Fill in the values in `.env.local`. At minimum, configure MongoDB, `AUTH_SECRET`, and the Socket.IO URL. Cloudinary, Google sign-in, email, and Gemini settings enable their related features.

For local development, the default realtime URL is:

```env
NEXT_PUBLIC_SOCKET_SERVER=http://localhost:5000
```

The Socket.IO server also needs `NEXT_BASE_URL` in its environment so it can call the Next.js API:

```env
NEXT_BASE_URL=http://localhost:3000
```

## Run Locally

Start the Next.js application in one terminal:

```bash
cd smartbasket
npm run dev
```

Start the Socket.IO server in a second terminal:

```bash
cd socketServer
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The Socket.IO server listens on port `5000` by default and can be changed with `PORT`.

## Available Scripts

### Next.js app

- `npm run dev` - Start the development server
- `npm run build` - Create a production build
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

### Socket.IO server

- `npm run dev` - Start the server with Nodemon

## Technology

- Next.js and React
- TypeScript
- MongoDB with Mongoose
- Auth.js / NextAuth
- Redux Toolkit
- Socket.IO
- Leaflet and React Leaflet
- Cloudinary
- Nodemailer
- Tailwind CSS

## Notes

- Never commit `.env.local` or other files containing credentials.
- The map routing URL defaults to the public OSRM demo server and may be rate-limited.
- Realtime delivery tracking, chat, and assignment updates require the Socket.IO server to be running.
