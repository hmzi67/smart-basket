const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const jsx = (type, props) => ({ type, props })
function load(file, mocks) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, console, AbortController, require: name => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx }
    assert.ok(name in mocks, name)
    return mocks[name]
  } })
  return exports.default
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return
  if (predicate(node)) return node
  for (const child of [node.props?.children].flat(Infinity)) {
    const result = find(child, predicate)
    if (result) return result
  }
}

test('customer can send using the session while Redux profile is missing', () => {
  const emitted = []
  const page = load('app/user/track-order/[orderId]/page.tsx', {
    axios: {},
    react: { useEffect() {}, useState: value => [value === '' ? 'Hello rider' : value, () => {}], useRef: () => ({ current: null }) },
    'next-auth/react': { useSession: () => ({ data: { user: { id: 'customer-123' } } }) },
    'react-redux': { useSelector: () => ({ userData: undefined }) },
    'next/navigation': { useParams: () => ({ orderId: 'order-123' }), useRouter: () => ({}) },
    'lucide-react': {}, 'next/dynamic': () => 'Map',
    '@/components/OrderChatPanel': 'ChatPanel',
    '@/lib/socket': { getSocket: () => ({ emit: (...args) => emitted.push(args) }) },
  })
  const panel = find(page(), node => node.type === 'ChatPanel')
  assert.equal(panel.props.currentUserId, 'customer-123')
  panel.props.onSend()
  assert.equal(emitted[0][0], 'send-message')
  assert.equal(emitted[0][1].senderId, 'customer-123')
  assert.equal(emitted[0][1].text, 'Hello rider')
})

test('send button accepts authenticated text and blocks empty or unidentified sends', () => {
  const panel = load('components/OrderChatPanel.tsx', { 'lucide-react': {} })
  for (const [message, currentUserId, disabled] of [['Hello', 'customer-123', false], ['  ', 'customer-123', true], ['Hello', undefined, true]]) {
    let sends = 0
    const tree = panel({ title: 'Chat', messages: [], suggestions: [], message, currentUserId, onSend: () => sends++ })
    assert.equal(find(tree, node => node.props?.['aria-label'] === 'Send message').props.disabled, disabled)
    find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} })
    assert.equal(sends, disabled ? 0 : 1)
  }
})

test('profile reloads when session changes after login', async () => {
  let session = { status: 'unauthenticated', data: null }, effect, deps
  const actions = [], requests = []
  const hook = load('hooks/useGetMe.tsx', {
    axios: { get: async (...args) => { requests.push(args); return { data: { _id: 'customer-123' } } }, isAxiosError: () => false },
    react: { useEffect: (fn, dependencies) => { effect = fn; deps = dependencies } },
    'next-auth/react': { useSession: () => session },
    'react-redux': { useDispatch: () => action => actions.push(action) },
    '@/redux/userSlice': { setUserData: payload => ({ payload }) },
  })
  hook(); effect()
  assert.equal(requests.length, 0)
  session = { status: 'authenticated', data: { user: { id: 'customer-123' } } }
  hook()
  assert.equal(deps[1], 'authenticated')
  assert.equal(deps[2], 'customer-123')
  const cleanup = effect()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(requests[0][0], '/api/me')
  assert.equal(actions.at(-1).payload._id, 'customer-123')
  cleanup()
  assert.equal(requests[0][1].signal.aborted, true)
})
