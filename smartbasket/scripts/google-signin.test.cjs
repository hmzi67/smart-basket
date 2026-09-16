const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function buttonHarness(signIn, queryError = null) {
  const states = []
  let destination
  const jsx = (type, props) => ({ type, props })
  const mocks = {
    react: { Suspense: 'Suspense', useRef: value => ({ current: value }), useState: initial => {
      const index = states.push(initial) - 1
      return [initial, value => { states[index] = value }]
    } },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/image': () => {},
    'next/navigation': { useSearchParams: () => ({ get: () => queryError }) },
    'next-auth/react': { signIn },
    'lucide-react': { Loader2: () => {} },
    '@/assets/google.png': {},
  }
  const source = fs.readFileSync(path.join(__dirname, '../src/components/GoogleSignInButton.tsx'), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => {
    assert.ok(name in mocks, name)
    return mocks[name]
  }, window: { location: { assign: url => { destination = url } } } })
  const content = exports.default().props.children.type()
  return { click: content.props.children[0].props.onClick, states, content, destination: () => destination }
}

test('starts Google OAuth and explicitly returns to the dashboard', async () => {
  const harness = buttonHarness(async (provider, options) => {
    assert.equal(provider, 'google')
    assert.equal(options.redirectTo, '/')
    assert.equal(options.redirect, false)
    return { ok: true, url: 'https://accounts.google.com/test' }
  })
  await harness.click()
  assert.equal(harness.destination(), 'https://accounts.google.com/test')
  assert.equal(harness.states[0], true)
})
test('provider errors are visible and allow retry', async () => {
  const harness = buttonHarness(async () => ({ ok: true, error: 'Configuration', url: null }))
  await harness.click()
  assert.match(harness.states[1], /configuration/)
  assert.equal(harness.states[0], false)
  assert.equal(harness.destination(), undefined)
})
test('network failures are visible and allow retry', async () => {
  const harness = buttonHarness(async () => { throw new Error('offline') })
  await harness.click()
  assert.match(harness.states[1], /connection/)
  assert.equal(harness.states[0], false)
})
test('duplicate clicks start only one OAuth request', async () => {
  let calls = 0
  const harness = buttonHarness(async () => { calls++; return { ok: true, url: 'https://accounts.google.com/test' } })
  await Promise.all([harness.click(), harness.click()])
  assert.equal(calls, 1)
})
test('OAuth callback errors on the login URL are displayed', () => {
  const harness = buttonHarness(async () => {}, 'AccessDenied')
  const alert = harness.content.props.children[1]
  assert.equal(alert.props.role, 'alert')
  assert.match(alert.props.children, /not allowed/)
})

for (const scenario of ['new account', 'existing account', 'disabled account']) {
  test(`Google callback: ${scenario}`, async () => {
    let config
    let creates = 0
    const dbUser = { _id: { toString: () => '507f1f77bcf86cd799439011' }, name: 'Test', role: 'user', isActive: scenario !== 'disabled account' }
    const mocks = {
      'next-auth': options => { config = options; return {} },
      'next-auth/providers/credentials': () => ({}),
      'next-auth/providers/google': () => ({}),
      './lib/db': async () => {},
      bcryptjs: {},
      './models/user.model': {
        findOne: async () => scenario === 'new account' ? null : dbUser,
        create: async data => { creates++; assert.equal(data.email, 'test@example.com'); return dbUser },
        findById: id => {
          assert.equal(id, dbUser._id.toString())
          return { select: async () => dbUser }
        },
      },
    }
    const source = fs.readFileSync(path.join(__dirname, '../src/auth.ts'), 'utf8')
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText
    vm.runInNewContext(code, { exports: {}, process: { env: {} }, require: name => {
      assert.ok(name in mocks, name)
      return mocks[name]
    } })
    const user = { name: 'Test', email: 'test@example.com', image: null }
    const allowed = await config.callbacks.signIn({ user, account: { provider: 'google' } })
    assert.equal(allowed, scenario !== 'disabled account')
    assert.equal(creates, scenario === 'new account' ? 1 : 0)
    if (allowed) {
      const token = await config.callbacks.jwt({ user, token: {} })
      const session = config.callbacks.session({ session: { user: {} }, token })
      assert.equal(session.user.id, dbUser._id.toString())
      assert.equal(session.user.role, 'user')
    }
  })
}
