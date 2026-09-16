const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, mocks) {
  const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, process: { env: {} }, console: { error() {} }, require: name => {
    assert.ok(name in mocks, name)
    return mocks[name]
  } })
  return exports
}

const password = load('lib/password.ts', { crypto: require('node:crypto') })
const next = { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } }

function harness(user, failMail = false) {
  const sent = [], removed = []
  let saves = 0
  if (user) user.save = async () => { saves++ }
  const route = load('app/api/auth/forgot-password/route.ts', {
    '@/lib/db': async () => {},
    '@/models/user.model': {
      findOne: async ({ email }) => { assert.equal(email, 'test@example.com'); return user },
      updateOne: async (filter, update) => { removed.push({ filter, update }) },
    },
    '@/lib/mailer': { sendMail: async (...args) => {
      if (failMail) throw Object.assign(new Error('SMTP unavailable'), { code: 'ECONNECTION' })
      sent.push(args)
    } },
    '@/lib/password': password,
    'next/server': next,
  })
  return { sent, removed, saves: () => saves, run: () => route.POST({
    json: async () => ({ email: ' TEST@example.com ' }), nextUrl: { origin: 'http://localhost:3000' },
  }) }
}

for (const hasPassword of [false, true]) {
  test(`emails a hashed, expiring reset token for ${hasPassword ? 'password' : 'Google-only'} accounts`, async () => {
    const user = { _id: 'test-user', email: 'test@example.com', isActive: true, password: hasPassword ? 'existing-hash' : undefined }
    const h = harness(user)
    assert.equal((await h.run()).status, 200)
    assert.equal(h.sent.length, 1)
    assert.equal(h.sent[0][0], user.email)
    const token = h.sent[0][2].match(/reset-password\?token=([a-f0-9]{64})/)[1]
    assert.equal(user.resetPasswordTokenHash, password.hashResetToken(token))
    assert.notEqual(user.resetPasswordTokenHash, token)
    assert.ok(user.resetPasswordExpiresAt > Date.now())
    assert.ok(user.resetPasswordExpiresAt <= Date.now() + password.RESET_TOKEN_TTL_MS)
    assert.equal(h.saves(), 1)
  })
}

test('unknown and disabled accounts receive the same generic response without email', async () => {
  const unknown = harness(null), disabled = harness({ isActive: false })
  assert.equal(JSON.stringify(await unknown.run()), JSON.stringify(await disabled.run()))
  assert.equal(unknown.sent.length + disabled.sent.length, 0)
})

test('SMTP failures return a retryable error and invalidate only the failed request token', async () => {
  const user = { _id: 'test-user', email: 'test@example.com' }
  const h = harness(user, true)
  const response = await h.run()
  assert.equal(response.status, 503)
  assert.match(response.body.message, /try again/i)
  assert.equal(h.removed[0].filter._id, user._id)
  assert.equal(h.removed[0].filter.resetPasswordTokenHash, user.resetPasswordTokenHash)
})

test('Google account can redeem the emailed token once to set a password', async () => {
  const user = { _id: 'test-user', email: 'test@example.com' }
  const h = harness(user)
  await h.run()
  const token = h.sent[0][2].match(/token=([a-f0-9]{64})/)[1]
  const reset = load('app/api/auth/reset-password/route.ts', {
    '@/lib/db': async () => {},
    '@/models/user.model': { findOne: query => ({ select: async () =>
      user.resetPasswordTokenHash === query.resetPasswordTokenHash && user.resetPasswordExpiresAt > query.resetPasswordExpiresAt.$gt ? user : null,
    }) },
    bcryptjs: require('bcryptjs'), '@/lib/password': password, 'next/server': next,
  })
  const request = { json: async () => ({ token, password: 'ExamplePass123' }) }
  assert.equal((await reset.POST(request)).status, 200)
  assert.ok(await require('bcryptjs').compare('ExamplePass123', user.password))
  assert.equal(user.resetPasswordTokenHash, null)
  assert.equal((await reset.POST(request)).status, 400)
})
