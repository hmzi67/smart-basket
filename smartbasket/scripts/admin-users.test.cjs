const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const actorId = '507f1f77bcf86cd799439011'
const targetId = '507f1f77bcf86cd799439012'
const valid = { name: 'New Person', email: 'new@example.com', mobile: '03001234567', role: 'user', password: 'Secure123', isActive: true }
function harness(options = {}) {
  const records = new Map([
    [actorId, { _id: actorId, name: 'Admin', email: 'admin@example.com', role: 'admin', isActive: true }],
    [targetId, { _id: targetId, name: 'Person', email: 'person@example.com', role: options.targetRole || 'user', mobile: '03001234567', password: 'old-hash', isActive: true }],
  ])
  const safe = (value, fields) => value && Object.fromEntries(Object.entries(value).filter(([key]) => key === '_id' || fields.split(' ').includes(key)))
  const query = value => ({ select: async fields => safe(value, fields), then: (a, b) => Promise.resolve(value).then(a, b) })
  let writes = 0
  const User = {
    findById: id => query(records.get(id) ?? null),
    findByIdAndUpdate: (id, update) => {
      const old = records.get(id)
      if (!old) return query(null)
      if (update.$set.email && [...records.values()].some(u => u._id !== id && u.email === update.$set.email)) throw { code: 11000 }
      writes++; const next = { ...old, ...update.$set }; records.set(id, next); return query(next)
    },
    create: async data => {
      if ([...records.values()].some(u => u.email === data.email)) throw { code: 11000 }
      writes++; const user = { ...data, _id: '507f1f77bcf86cd799439013' }; records.set(user._id, user); return user
    },
    findByIdAndDelete: async id => { const user = records.get(id); if (!user) return null; records.delete(id); writes++; return user },
    countDocuments: async () => options.noOtherAdmins ? 0 : 1,
    find: () => { const chain = { select: () => chain, sort: () => chain, skip: () => chain, limit: () => chain, lean: async () => [...records.values()].map(u => safe(u, 'name email mobile role isActive')) }; return chain },
  }
  const mocks = {
    '@/auth': { auth: async () => options.role === null ? null : { user: { id: actorId, role: options.role ?? 'admin' } } },
    '@/lib/db': async () => {}, '@/models/user.model': User,
    '@/models/order.model': { exists: async () => options.hasOrders ?? false, aggregate: async () => [] },
    mongoose: { isValidObjectId: id => typeof id === 'string' && /^[a-f0-9]{24}$/.test(id) },
    bcryptjs: { hash: async password => `hashed:${password}` },
    'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } }, crypto: require('node:crypto'),
  }
  const cache = {}
  function load(relative) {
    if (cache[relative]) return cache[relative]
    const filename = path.join(__dirname, '..', relative)
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText
    const exports = {}; cache[relative] = exports
    vm.runInNewContext(code, { exports, console, Error, SyntaxError, Response, require: name => {
      if (name in mocks) return mocks[name]
      if (name.startsWith('@/lib/')) return load('src/' + name.slice(2) + '.ts')
      throw new Error(`Unexpected dependency: ${name}`)
    } })
    return exports
  }
  return { records, load, writes: () => writes }
}
const request = body => ({ json: async () => body, nextUrl: new URL('http://localhost/api/admin/users') })
const context = (id = targetId) => ({ params: Promise.resolve({ id }) })
for (const role of [null, 'user', 'deliveryBoy', 'shopkeeper']) {
  for (const [file, method] of [['users/route.ts', 'GET'], ['users/route.ts', 'POST'], ['users/[id]/route.ts', 'GET'], ['users/[id]/route.ts', 'PUT'], ['users/[id]/route.ts', 'DELETE'], ['users/[id]/role/route.ts', 'POST'], ['users/[id]/status/route.ts', 'POST']]) {
    test(`${role || 'anonymous'} cannot ${method} ${file}`, async () => {
      const h = harness({ role })
      const response = await h.load('src/app/api/admin/' + file)[method](request(valid), context())
      assert.equal(response.status, 403); assert.equal(h.writes(), 0)
    })
  }
}
test('admin creates, reads, updates and deletes an account without exposing passwords', async () => {
  const h = harness()
  const created = await h.load('src/app/api/admin/users/route.ts').POST(request(valid))
  assert.equal(created.status, 201)
  const body = await created.json()
  assert.equal(body.user.password, undefined)
  assert.equal(h.records.get(body.user._id).password, 'hashed:Secure123')
  const route = h.load('src/app/api/admin/users/[id]/route.ts')
  assert.equal((await route.GET(request(), context(body.user._id))).status, 200)
  const updated = await route.PUT(request({ name: 'Changed', role: 'shopkeeper', password: '' }), context(body.user._id))
  assert.equal(updated.status, 200)
  assert.equal(h.records.get(body.user._id).role, 'shopkeeper')
  assert.equal(h.records.get(body.user._id).password, 'hashed:Secure123')
  assert.equal((await route.DELETE(request(), context(body.user._id))).status, 200)
  assert.equal(h.records.has(body.user._id), false)
})
for (const change of [{ name: 'X' }, { email: 'invalid' }, { mobile: 'abc' }, { role: 'root' }, { isActive: 'false' }, { password: 'short' }]) {
  test(`reject invalid user input ${JSON.stringify(change)}`, async () => {
    const h = harness()
    const response = await h.load('src/app/api/admin/users/route.ts').POST(request({ ...valid, ...change }))
    assert.equal(response.status, 400); assert.equal(h.writes(), 0)
  })
}
test('duplicate email returns conflict', async () => {
  const h = harness()
  const response = await h.load('src/app/api/admin/users/route.ts').POST(request({ ...valid, email: 'ADMIN@example.com' }))
  assert.equal(response.status, 409)
})
for (const [method, body] of [['DELETE', {}], ['PUT', { role: 'user' }], ['PUT', { isActive: false }]]) {
  test(`cannot lock out own admin: ${method} ${JSON.stringify(body)}`, async () => {
    const h = harness()
    const response = await h.load('src/app/api/admin/users/[id]/route.ts')[method](request(body), context(actorId))
    assert.equal(response.status, 409); assert.equal(h.writes(), 0)
  })
}
test('user with order history cannot be deleted', async () => {
  const h = harness({ hasOrders: true })
  assert.equal((await h.load('src/app/api/admin/users/[id]/route.ts').DELETE(request(), context())).status, 409)
  assert.equal(h.writes(), 0)
})
test('active rider cannot be deactivated through the legacy status endpoint', async () => {
  const h = harness({ targetRole: 'deliveryBoy', hasOrders: true })
  assert.equal((await h.load('src/app/api/admin/users/[id]/status/route.ts').POST(request({ isActive: false }), context())).status, 409)
  assert.equal(h.writes(), 0)
})
test('last active admin cannot be deleted', async () => {
  const h = harness({ targetRole: 'admin', noOtherAdmins: true })
  assert.equal((await h.load('src/app/api/admin/users/[id]/route.ts').DELETE(request(), context())).status, 409)
})
for (const [id, expected] of [['bad-id', 400], ['507f1f77bcf86cd799439099', 404]]) {
  test(`user ID ${id} returns ${expected}`, async () => {
    const h = harness()
    assert.equal((await h.load('src/app/api/admin/users/[id]/route.ts').PUT(request({ name: 'Updated' }), context(id))).status, expected)
  })
}
