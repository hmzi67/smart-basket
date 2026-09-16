'use client'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Eye, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { IGrocery } from '@/models/grocery.model'
import GroceryForm from '@/components/GroceryForm'
import ManagementDialog from '@/components/ManagementDialog'

export default function Inventory() {
  const { data: session } = useSession()
  const canManage = session?.user?.role === 'shopkeeper'
  const [groceries, setGroceries] = useState<IGrocery[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState<{ mode: 'view' | 'edit' | 'delete'; grocery: IGrocery } | null>(null)
  const [dialogError, setDialogError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try { const { data } = await axios.get('/api/admin/get-groceries', { signal: controller.signal }); setGroceries(data) }
      catch (err) { if (!axios.isCancel(err)) setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Could not load inventory.' : 'Could not load inventory.') }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [])
  function open(mode: 'view' | 'edit' | 'delete', grocery: IGrocery) { setDialog({ mode, grocery }); setDialogError('') }
  async function remove() {
    if (!dialog || !canManage || busy) return
    setBusy(true); setDialogError('')
    try {
      await axios.post('/api/admin/delete-grocery', { groceryId: dialog.grocery._id })
      setGroceries(items => items.filter(item => item._id !== dialog.grocery._id)); setDialog(null); setNotice('Grocery deleted.')
    } catch (err) { setDialogError(axios.isAxiosError(err) ? err.response?.data?.message || 'Could not delete grocery.' : 'Could not delete grocery.') }
    finally { setBusy(false) }
  }
  const filtered = groceries.filter(item => `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase()))
  return <main className="min-h-screen bg-[#f6f8f7] px-4 py-8 sm:px-6"><div className="mx-auto max-w-6xl">
    <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-700"><ArrowLeft size={17} /> Dashboard</Link>
    <header className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-700">Shared catalog</p><h1 className="text-3xl font-bold tracking-tight text-slate-900">{canManage ? 'Manage groceries' : 'View inventory'}</h1><p className="mt-2 text-sm text-slate-500">{canManage ? 'Create, update, and remove products from the store.' : 'Review products, stock, prices, and availability. Inventory changes are managed by shopkeepers.'}</p></div>{canManage && <Link href="/admin/add-grocery" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"><Plus size={18} /> Add grocery</Link>}</header>
    <label className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"><Search size={18} className="text-slate-400" /><input aria-label="Search inventory" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name or category" className="min-w-0 flex-1 text-sm outline-none" /><span className="text-xs text-slate-500">{filtered.length} products</span></label>
    {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}{error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <p role="status" className="flex items-center justify-center gap-2 py-16 text-slate-500"><Loader2 className="animate-spin" size={20} /> Loading inventory…</p> : !filtered.length ? <p className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">No products found.</p> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(item => <article key={String(item._id)} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-44 bg-slate-50">{item.image && <Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 100vw, 400px" className="object-contain p-4" />}</div>
      <div className="p-5"><p className="text-xs text-slate-500">{item.category}</p><h2 className="mt-1 font-semibold text-slate-900">{item.name}</h2><p className="mt-2 text-lg font-bold text-emerald-700">Rs. {item.price}<span className="text-xs font-normal text-slate-500"> / {item.unit}</span></p><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">Stock: {item.stock ?? 0}</span><span className={`rounded-full px-2.5 py-1 ${item.isAvailable && item.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{!item.isAvailable ? 'Hidden' : item.stock <= 0 ? 'Out of stock' : 'Available'}</span></div><div className="mt-5 flex gap-2 border-t border-slate-100 pt-4"><button onClick={() => open('view', item)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm text-slate-600"><Eye size={16} /> Details</button>{canManage && <><button aria-label={`Edit ${item.name}`} onClick={() => open('edit', item)} className="rounded-lg border border-emerald-200 p-2.5 text-emerald-700"><Pencil size={17} /></button><button aria-label={`Delete ${item.name}`} onClick={() => open('delete', item)} className="rounded-lg border border-red-200 p-2.5 text-red-600"><Trash2 size={17} /></button></>}</div></div>
    </article>)}</div>}
  </div>
  {dialog && <ManagementDialog title={dialog.mode === 'view' ? 'Product details' : dialog.mode === 'edit' ? 'Edit grocery' : 'Delete grocery'} busy={busy} onClose={() => setDialog(null)}>
    {dialog.mode === 'view' ? <div className="space-y-4">{dialog.grocery.image && <div className="relative h-48"><Image src={dialog.grocery.image} alt={dialog.grocery.name} fill sizes="480px" className="object-contain" /></div>}<h3 className="text-xl font-semibold">{dialog.grocery.name}</h3><p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{dialog.grocery.description || 'No description provided.'}</p><dl className="grid grid-cols-2 gap-3 text-sm"><dt className="text-slate-500">Category</dt><dd>{dialog.grocery.category}</dd><dt className="text-slate-500">Price</dt><dd>Rs. {dialog.grocery.price} / {dialog.grocery.unit}</dd><dt className="text-slate-500">Stock</dt><dd>{dialog.grocery.stock ?? 0}</dd><dt className="text-slate-500">Visible in store</dt><dd>{dialog.grocery.isAvailable && dialog.grocery.stock > 0 ? 'Yes' : 'No'}</dd></dl></div> : dialog.mode === 'edit' && canManage ? <GroceryForm initial={dialog.grocery} onBusyChange={setBusy} onSaved={saved => { setGroceries(items => items.map(item => item._id === saved._id ? saved : item)); setDialog(null); setNotice('Grocery updated.') }} /> : canManage ? <div><p className="text-sm leading-6 text-slate-600">Permanently delete <strong>{dialog.grocery.name}</strong>? This removes it from the catalog. Existing orders retain their product details.</p>{dialogError && <p role="alert" className="mt-4 text-sm text-red-600">{dialogError}</p>}<div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={() => setDialog(null)} className="rounded-xl border border-slate-200 px-4 py-2">Cancel</button><button disabled={busy} onClick={remove} className="rounded-xl bg-red-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Deleting…' : 'Delete grocery'}</button></div></div> : <p className="text-sm text-slate-500">Only shopkeepers can change inventory.</p>}
  </ManagementDialog>}
  </main>
}
