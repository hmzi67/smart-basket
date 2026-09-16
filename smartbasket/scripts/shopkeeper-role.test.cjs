const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Execute the real handlers with isolated auth/database adapters; no live data changes.
function load(relativePath, mocks) {
  const filename = path.join(__dirname, '..', relativePath)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports, console, Response, URL, Blob,
    process: { env: {} },
    require: (name) => {
      if (name in mocks) return mocks[name]
      throw new Error(`Unexpected dependency: ${name}`)
    },
  }, { filename })
  return exports
}
const responseMock = { NextResponse: { json: (body, init) => Response.json(body, init) } }
const id = '507f1f77bcf86cd799439011'
const session = (role) => role ? { user: { id, email: 'test@example.com', role } } : null

for (const role of [null, 'user', 'deliveryBoy', 'shopkeeper', 'admin']) {
  for (const action of ['add-grocery', 'edit-grocery', 'get-groceries', 'delete-grocery']) {
    test(`${role || 'anonymous'}: ${action} authorization`, async () => {
      let writes = 0
      const grocery = { name: 'Apples', price: '10' }
      const model = {
        create: async () => { writes++; return grocery },
        exists: async () => true,
        findByIdAndUpdate: async () => { writes++; return grocery },
        findByIdAndDelete: async () => { writes++; return grocery },
        find: () => ({ sort: async () => { writes++; return [grocery] } }),
      }
      const upload = async () => 'https://example.com/apple.png'
      upload.uploadOnCloudinary = upload
      const handler = load(`src/app/api/admin/${action}/route.ts`, {
        '@/auth': { auth: async () => session(role) },
        '@/lib/db': async () => {}, '@/models/grocery.model': model,
        '@/lib/cloudinary': upload, 'next/server': responseMock,
        mongoose: require('mongoose'),
        '@/lib/grocery-fields': load('src/lib/grocery-fields.ts', {}),
      })
      const form = new FormData()
      for (const [key, value] of Object.entries({ groceryId: id, name: 'Apples', category: 'Fruits & Vegetables', unit: 'kg', price: '10', stock: '5', isAvailable: 'true' })) form.set(key, value)
      form.set('image', new Blob(['image'], { type: 'image/png' }), 'apple.png')
      const result = await (handler.POST || handler.GET)({ formData: async () => form, json: async () => ({ groceryId: id }) })
      const allowed = role === 'shopkeeper' || (role === 'admin' && action === 'get-groceries')
      assert.equal(result.status, allowed ? (action === 'add-grocery' ? 201 : 200) : 403)
      assert.equal(writes, allowed ? 1 : 0)
    })
  }
}

function authConfig(dbUser) {
  let config
  const provider = () => ({})
  load('src/auth.ts', {
    'next-auth': (options) => { config = options; return {} },
    'next-auth/providers/credentials': provider, 'next-auth/providers/google': provider,
    './lib/db': async () => {}, bcryptjs: {},
    './models/user.model': { findById: () => ({ select: async () => dbUser }) },
  })
  return config
}
test('existing shopkeeper JWT adopts an admin-assigned demotion', async () => {
  const config = authConfig({ role: 'user', name: 'Test', isActive: true })
  const token = await config.callbacks.jwt({ token: { id, role: 'shopkeeper' } })
  assert.equal(token.role, 'user')
})
test('client session update cannot grant admin', async () => {
  const config = authConfig({ role: 'shopkeeper', name: 'Test', isActive: true })
  const token = await config.callbacks.jwt({ token: { id, role: 'shopkeeper' }, trigger: 'update', session: { role: 'admin' } })
  assert.equal(token.role, 'shopkeeper')
})
for (const user of [null, { role: 'shopkeeper', isActive: false }]) {
  test(`reject ${user ? 'deactivated' : 'deleted'} account's existing JWT`, async () => {
    assert.equal(await authConfig(user).callbacks.jwt({ token: { id, role: 'shopkeeper' } }), null)
  })
}

for (const scenario of [
  { name: 'new user selects shopkeeper', current: 'user', requested: 'shopkeeper', expected: 'shopkeeper', status: 200 },
  { name: 'new user selects admin', current: 'user', requested: 'admin', expected: 'admin', status: 200 },
  { name: 'unknown role is rejected', current: 'user', requested: 'superadmin', status: 403 },
  { name: 'completed profile cannot self-assign admin', current: 'user', mobile: '03001234567', requested: 'admin', status: 403 },
  { name: 'completed profile cannot restore revoked shopkeeper role', current: 'user', mobile: '03001234567', requested: 'shopkeeper', status: 403 },
  { name: 'preserves assigned shopkeeper role', current: 'shopkeeper', requested: 'user', expected: 'shopkeeper', status: 200 },
  { name: 'preserves assigned admin role', current: 'admin', requested: 'user', expected: 'admin', status: 200 },
]) {
  test(scenario.name, async () => {
    let saved
    const handler = load('src/app/api/user/edit-role-mobile/route.ts', {
      '@/auth': { auth: async () => session(scenario.current) },
      '@/lib/db': async () => {}, 'next/server': responseMock,
      '@/models/user.model': {
        findById: async () => ({ _id: id, role: scenario.current, mobile: scenario.mobile }),
        findOneAndUpdate: (_filter, update) => { saved = update; return { select: async () => update } },
      },
    })
    const response = await handler.POST({ json: async () => ({ role: scenario.requested, mobile: '03001234567' }) })
    assert.equal(response.status, scenario.status)
    assert.equal(saved?.role, scenario.expected)
  })
}

for (const [pathname, allowed] of [
  ['/admin/add-grocery', true], ['/admin/view-grocery', true],
  ['/admin/view-grocery/', true], ['/admin/view-grocery-secret', false],
  ['/admin/manage-orders', false], ['/admin/users', false],
  ['/user/cart', false], ['/delivery/current-order', false],
]) {
  test(`shopkeeper page access: ${pathname}`, async () => {
    const handler = load('src/proxy.ts', {
      './auth': { auth: async () => session('shopkeeper') },
      'next/server': { NextResponse: {
        next: () => ({ allowed: true }),
        redirect: () => ({ allowed: false }),
      } },
    })
    // URL must be supplied across the VM boundary for redirect construction.
    const response = await handler.proxy({ nextUrl: { pathname }, url: 'http://localhost:3000' + pathname })
    assert.equal(response.allowed, allowed)
  })
}

for (const [pathname, allowed] of [['/admin/add-grocery', false], ['/admin/add-grocery/', false], ['/admin/view-grocery', true], ['/admin/users', true]]) {
  test(`admin page permissions: ${pathname}`, async () => {
    const handler = load('src/proxy.ts', {
      './auth': { auth: async () => session('admin') },
      'next/server': { NextResponse: { next: () => true, redirect: () => false } },
    })
    assert.equal(await handler.proxy({ nextUrl: { pathname }, url: 'http://localhost:3000' + pathname }), allowed)
  })
}
const parseGroceryForm = load('src/lib/grocery-fields.ts', {}).parseGroceryForm
for (const [field, value] of [['price', '-1'], ['price', 'NaN'], ['stock', '-1'], ['stock', '1.5'], ['category', 'unknown'], ['unit', 'unknown'], ['isAvailable', 'yes']]) {
  test(`invalid grocery ${field}=${value} is rejected`, () => {
    const form = new FormData()
    for (const [key, entry] of Object.entries({ name: 'Apples', price: '10', stock: '2', category: 'Fruits & Vegetables', unit: 'kg', isAvailable: 'true' })) form.set(key, entry)
    form.set(field, value)
    assert.ok(parseGroceryForm(form).error)
  })
}

for (const scenario of [
  { title: 'keeps the old image when none is uploaded', file: false, exists: true, expected: 200, writes: 1 },
  { title: 'rejects an upload failure without saving', file: true, exists: true, expected: 502, writes: 0 },
  { title: 'returns 404 for a missing product', file: false, exists: false, expected: 404, writes: 0 },
]) {
  test(`grocery edit ${scenario.title}`, async () => {
    let writes = 0
    const handler = load('src/app/api/admin/edit-grocery/route.ts', {
      '@/auth': { auth: async () => session('shopkeeper') }, '@/lib/db': async () => {},
      '@/models/grocery.model': {
        exists: async () => scenario.exists,
        findByIdAndUpdate: async (_id, update) => { writes++; assert.equal('image' in update.$set, false); return { _id: id, ...update.$set } },
      },
      '@/lib/cloudinary': async () => null, 'next/server': responseMock,
      mongoose: require('mongoose'), '@/lib/grocery-fields': load('src/lib/grocery-fields.ts', {}),
    })
    const form = new FormData()
    for (const [key, value] of Object.entries({ groceryId: id, name: 'Apples', price: '10', stock: '2', category: 'Fruits & Vegetables', unit: 'kg', isAvailable: 'true' })) form.set(key, value)
    if (scenario.file) form.set('image', new Blob(['image'], { type: 'image/png' }), 'apple.png')
    assert.equal((await handler.POST({ formData: async () => form })).status, scenario.expected)
    assert.equal(writes, scenario.writes)
  })
}
