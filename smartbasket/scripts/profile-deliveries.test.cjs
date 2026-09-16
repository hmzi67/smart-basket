const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
function load(file, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, console, Blob, Uint8Array, Date, require: name => {
    if (name in mocks) return mocks[name]
    if (name.startsWith('@/lib/')) return load('src/' + name.slice(2) + '.ts', mocks)
    throw new Error('Unexpected import: ' + name)
  } })
  return exports
}
const response = { NextResponse: { json: (body, init) => Response.json(body, init) } }
const png = () => new Blob([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])], { type: 'image/png' })
function pictureHarness(role, uploadResult = 'https://example.com/avatar.png') {
  const state = { uploads: 0, writes: 0, image: 'old' }
  const route = load('src/app/api/user/profile/picture/route.ts', {
    '@/auth': { auth: async () => role ? { user: { id: 'self', role } } : null },
    '@/lib/db': async () => {},
    '@/lib/cloudinary': async () => { state.uploads++; return uploadResult },
    '@/models/user.model': {
      exists: async filter => { assert.equal(filter._id, 'self'); return true },
      findOneAndUpdate: (filter, change) => {
        assert.equal(filter._id, 'self'); assert.equal(filter.isActive.$ne, false)
        assert.deepEqual(Object.keys(change.$set), ['image'])
        state.writes++; state.image = change.$set.image
        return { select: async selection => { assert.equal(selection, '-password'); return { _id: 'self', image: state.image } } }
      },
    },
    'next/server': response,
  })
  return { route, state }
}
function imageRequest(image) {
  return { formData: async () => new Map([['image', image], ['userId', 'another-user'], ['role', 'admin']]) }
}
for (const role of ['user', 'deliveryBoy', 'shopkeeper', 'admin']) test(role + ' can change and remove only their own photo', async () => {
  const { route, state } = pictureHarness(role)
  assert.equal((await route.POST(imageRequest(png()))).status, 200)
  assert.equal(state.image, 'https://example.com/avatar.png')
  assert.equal((await route.DELETE()).status, 200)
  assert.equal(state.image, '')
})
test('anonymous photo writes are denied', async () => {
  const { route, state } = pictureHarness(null)
  assert.equal((await route.POST(imageRequest(png()))).status, 401)
  assert.equal((await route.DELETE()).status, 401)
  assert.equal(state.uploads + state.writes, 0)
})
for (const [name, file] of [
  ['missing', null], ['SVG', new Blob(['<svg/>'], { type: 'image/svg+xml' })],
  ['fake PNG', new Blob(['not an image'], { type: 'image/png' })],
  ['oversized', new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'image/png' })],
]) test('rejects ' + name + ' before uploading', async () => {
  const { route, state } = pictureHarness('user')
  assert.equal((await route.POST(imageRequest(file))).status, 400)
  assert.equal(state.uploads + state.writes, 0)
})
test('failed upload preserves saved picture', async () => {
  const { route, state } = pictureHarness('user', null)
  assert.equal((await route.POST(imageRequest(png()))).status, 502)
  assert.equal(state.image, 'old'); assert.equal(state.writes, 0)
})
function historyHarness(role) {
  const state = { filters: [] }
  const route = load('src/app/api/delivery/my-deliveries/route.ts', {
    '@/auth': { auth: async () => role ? { user: { id: 'rider-self', role } } : null },
    '@/lib/db': async () => {}, 'next/server': response,
    '@/models/order.model': {
      find: filter => {
        state.filters.push(filter)
        const chain = {
          select: value => { state.selection = value; return chain }, sort: () => chain,
          skip: value => { state.skip = value; return chain }, limit: () => chain,
          lean: async () => [{ status: 'delivered', deliveryOtpVerification: true }, { status: 'pending', deliveryOtpVerification: false }],
        }
        return chain
      },
      countDocuments: async filter => { state.filters.push(filter); return 3 },
    },
  })
  return { route, state }
}
const historyRequest = (query = '') => ({ nextUrl: new URL('https://example.com/api/delivery/my-deliveries?' + query) })
for (const role of [null, 'user', 'admin', 'shopkeeper']) test('history denies role ' + role, async () => {
  const { route, state } = historyHarness(role)
  assert.equal((await route.GET(historyRequest())).status, role ? 403 : 401)
  assert.equal(state.filters.length, 0)
})
test('history scopes every query to authenticated rider, paginates, and calculates verified earnings', async () => {
  const { route, state } = historyHarness('deliveryBoy')
  const result = await route.GET(historyRequest('status=delivered&page=2&userId=other-rider'))
  assert.equal(result.status, 200)
  const body = await result.json()
  assert.equal(state.filters.length, 5)
  for (const filter of state.filters) assert.equal(filter.assignedDeliveryBoy, 'rider-self')
  assert.equal(state.filters[0].status, 'delivered'); assert.equal(state.skip, 10)
  assert.ok(!state.selection.split(' ').includes('deliveryOtp'))
  assert.deepEqual(body.deliveries.map(item => item.earning), [40, 0])
  assert.equal(body.summary.totalEarnings, 120)
})
test('invalid history filter is rejected', async () => {
  const { route, state } = historyHarness('deliveryBoy')
  assert.equal((await route.GET(historyRequest('status=invalid'))).status, 400)
  assert.equal(state.filters.length, 0)
})
test('daily earnings use Pakistan midnight', () => {
  const { deliveryDayStart } = load('src/lib/delivery-summary.ts')
  assert.equal(deliveryDayStart(new Date('2026-09-16T20:00:00Z')).toISOString(), '2026-09-16T19:00:00.000Z')
})
