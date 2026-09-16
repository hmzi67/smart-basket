'use client'
import axios from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Eye, Loader2, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import ManagementDialog from '@/components/ManagementDialog'

type Role = 'user' | 'deliveryBoy' | 'shopkeeper' | 'admin'
type AdminUser = { _id: string; name: string; email: string; mobile?: string; address?: string; role: Role; isActive?: boolean; orderCount?: number; createdAt?: string }
const roles: { value: Role; label: string }[] = [{ value: 'user', label: 'Customer' }, { value: 'deliveryBoy', label: 'Delivery rider' }, { value: 'shopkeeper', label: 'Shopkeeper' }, { value: 'admin', label: 'Admin' }]
const emptyForm = { name: '', email: '', mobile: '', address: '', role: 'user' as Role, password: '', isActive: true }
const field = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-600'
const failure = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.message || 'The request failed. Please try again.' : 'The request failed. Please try again.'

export default function ManageUsers() {
  const { data: session, update } = useSession()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState<{ mode: 'create' | 'view' | 'edit' | 'delete'; user?: AdminUser } | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true); setError('')
      try {
        const { data } = await axios.get('/api/admin/users', { params: { q: search, role, page, limit: 20 }, signal: controller.signal })
        setUsers(data.users); setTotal(data.total)
      } catch (err) { if (!axios.isCancel(err)) setError(failure(err)) }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [search, role, page, revision])

  function open(mode: 'create' | 'view' | 'edit' | 'delete', user?: AdminUser) {
    setForm(user ? { name: user.name, email: user.email, mobile: user.mobile ?? '', address: user.address ?? '', role: user.role, isActive: user.isActive !== false, password: '' } : { ...emptyForm })
    setFormError(''); setDialog({ mode, user })
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!dialog || busy) return
    setBusy(true); setFormError('')
    try {
      if (dialog.mode === 'create') await axios.post('/api/admin/users', form)
      else await axios.put(`/api/admin/users/${dialog.user?._id}`, form)
      if (dialog.user?._id === session?.user?.id) await update()
      setNotice(dialog.mode === 'create' ? 'User created successfully.' : 'User updated successfully.')
      setDialog(null); setRevision(value => value + 1)
    } catch (err) { setFormError(failure(err)) }
    finally { setBusy(false) }
  }
  async function remove() {
    if (!dialog?.user || busy) return
    setBusy(true); setFormError('')
    try {
      await axios.delete(`/api/admin/users/${dialog.user._id}`)
      setNotice('User deleted successfully.'); setDialog(null)
      if (users.length === 1 && page > 1) setPage(value => value - 1)
      else setRevision(value => value + 1)
    } catch (err) { setFormError(failure(err)) }
    finally { setBusy(false) }
  }
  const readOnly = dialog?.mode === 'view'
  const self = dialog?.user?._id === session?.user?.id
  return <main className="min-h-screen bg-[#f6f8f7] px-4 py-8 sm:px-6">
    <div className="mx-auto max-w-6xl">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-700"><ArrowLeft size={17} /> Dashboard</Link>
      <header className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-700">Administration</p><h1 className="text-3xl font-bold tracking-tight text-slate-900">Manage users</h1><p className="mt-2 text-sm text-slate-500">Create accounts, review profiles, and manage roles and access.</p></div><button onClick={() => open('create')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"><Plus size={18} /> Add user</button></header>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"><Search size={18} className="text-slate-400" /><input aria-label="Search users" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder="Search name, email or mobile" className="min-w-0 flex-1 text-sm outline-none" /></label><select aria-label="Filter by role" value={role} onChange={event => { setRole(event.target.value); setPage(1) }} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"><option value="">All roles</option>{roles.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-700"><Users size={18} /> {total} accounts</div>
        {loading ? <p role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Loading users…</p> : !users.length ? <p className="py-16 text-center text-sm text-slate-500">No users match your search.</p> : <div className="divide-y divide-slate-100">{users.map(user => <article key={user._id} className="flex flex-wrap items-center gap-4 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">{user.name.charAt(0).toUpperCase()}</span>
          <div className="min-w-0 flex-1"><h2 className="font-semibold text-slate-800">{user.name} {user._id === session?.user?.id && <span className="text-xs font-normal text-slate-500">(you)</span>}</h2><p className="break-all text-sm text-slate-500">{user.email}</p><p className="mt-1 text-xs text-slate-400">{user.mobile || 'No mobile'} · {user.orderCount ?? 0} orders</p></div>
          <div className="flex gap-2 text-xs"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{roles.find(item => item.value === user.role)?.label}</span><span className={`rounded-full px-3 py-1.5 ${user.isActive === false ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{user.isActive === false ? 'Inactive' : 'Active'}</span></div>
          <div className="flex gap-2"><button aria-label={`View ${user.name}`} onClick={() => open('view', user)} className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"><Eye size={17} /></button><button aria-label={`Edit ${user.name}`} onClick={() => open('edit', user)} className="rounded-lg border border-emerald-200 p-2.5 text-emerald-700 hover:bg-emerald-50"><Pencil size={17} /></button><button aria-label={`Delete ${user.name}`} disabled={user._id === session?.user?.id} onClick={() => open('delete', user)} className="rounded-lg border border-red-200 p-2.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 size={17} /></button></div>
        </article>)}</div>}
        <footer className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500"><span>Page {page} of {Math.max(1, Math.ceil(total / 20))}</span><div className="flex gap-3"><button disabled={page === 1 || loading} onClick={() => setPage(value => value - 1)} className="disabled:opacity-30">Previous</button><button disabled={page * 20 >= total || loading} onClick={() => setPage(value => value + 1)} className="disabled:opacity-30">Next</button></div></footer>
      </section>
    </div>
    {dialog && <ManagementDialog title={dialog.mode === 'create' ? 'Create user' : dialog.mode === 'view' ? 'User details' : dialog.mode === 'delete' ? 'Delete user' : 'Edit user'} onClose={() => setDialog(null)} busy={busy}>
      {dialog.mode === 'delete' ? <div><p className="text-sm leading-6 text-slate-600">Delete <strong>{dialog.user?.name}</strong> permanently? This cannot be undone. Accounts with order history must be deactivated using Edit instead.</p>{formError && <p role="alert" className="mt-4 text-sm text-red-600">{formError}</p>}<div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={() => setDialog(null)} className="rounded-xl border border-slate-200 px-4 py-2">Cancel</button><button disabled={busy} onClick={remove} className="rounded-xl bg-red-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Deleting…' : 'Delete user'}</button></div></div> : <form onSubmit={save} className="space-y-4">
        <fieldset disabled={readOnly || busy} className="space-y-4">
          <label className="block text-sm font-medium">Name<input required minLength={2} maxLength={100} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className={field} /></label>
          <label className="block text-sm font-medium">Email<input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className={field} /></label>
          <label className="block text-sm font-medium">Mobile<input required type="tel" pattern="[0-9]{10,15}" title="10–15 digits" value={form.mobile} onChange={event => setForm({ ...form, mobile: event.target.value })} className={field} /></label>
          <div className="grid grid-cols-2 gap-4"><label className="block text-sm font-medium">Role<select disabled={self} value={form.role} onChange={event => setForm({ ...form, role: event.target.value as Role })} className={field}>{roles.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="block text-sm font-medium">Status<select disabled={self} value={String(form.isActive)} onChange={event => setForm({ ...form, isActive: event.target.value === 'true' })} className={field}><option value="true">Active</option><option value="false">Inactive</option></select></label></div>
          <label className="block text-sm font-medium">Address<textarea maxLength={300} rows={2} value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} className={field} /></label>
          {!readOnly && <label className="block text-sm font-medium">{dialog.mode === 'create' ? 'Password' : 'New password (optional)'}<input type="password" autoComplete="new-password" required={dialog.mode === 'create'} minLength={8} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} className={field} /><span className="mt-1 block text-xs font-normal text-slate-500">At least 8 characters, including a letter and a number.{dialog.mode === 'edit' && ' Leave blank to keep the current password.'}</span></label>}
        </fieldset>
        {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={busy} onClick={() => setDialog(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">{readOnly ? 'Close' : 'Cancel'}</button>{!readOnly && <button disabled={busy} type="submit" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : dialog.mode === 'create' ? 'Create user' : 'Save changes'}</button>}</div>
      </form>}
    </ManagementDialog>}
  </main>
}
