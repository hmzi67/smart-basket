'use client'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Eye, Loader2, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
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
  return <main className="min-h-screen px-4 py-8 sm:px-6"><div className="mx-auto max-w-6xl">
    <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
      <Link href="/" className="flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-4 py-2 rounded-full transition w-full sm:w-auto"><ArrowLeft size={18} /> Dashboard</Link>
      <h1 className="text-2xl md:text-3xl font-extrabold text-green-700 flex items-center justify-center gap-2"><Package size={20} /> {canManage ? 'Manage Groceries' : 'View Inventory'}</h1>
      {canManage ? <Link href="/admin/add-grocery" className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-green-700 transition w-full sm:w-auto"><Plus size={18} /> Add Grocery</Link> : <span className="hidden sm:block w-24" />}
    </div>
    <label className="mb-10 mx-auto flex max-w-lg items-center gap-3 rounded-full border border-gray-200 bg-white px-5 py-3 shadow-sm hover:shadow-lg transition-all"><Search size={18} className="text-gray-500" /><input aria-label="Search inventory" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name or category..." className="min-w-0 flex-1 text-sm text-gray-700 outline-none placeholder:text-gray-400" /><span className="text-xs text-gray-500">{filtered.length}</span></label>
    {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}{error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <p role="status" className="flex items-center justify-center gap-2 py-16 text-gray-600"><Loader2 className="animate-spin" size={20} /> Loading inventory...</p> : !filtered.length ? <p className="rounded-2xl bg-white py-16 text-center text-sm text-gray-500 shadow-md">No products found.</p> : <div className="space-y-4">{filtered.map(item => <article key={String(item._id)} className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 transition-all">
      <div className="relative w-full sm:w-44 aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">{item.image && <Image src={item.image} alt={item.name} fill sizes="176px" className="object-contain p-3 hover:scale-105 transition-transform duration-500" />}</div>
      <div className="flex-1 w-full"><p className="text-gray-500 text-sm capitalize">{item.category}</p><h2 className="font-semibold text-gray-800 text-lg truncate">{item.name}</h2><p className="mt-2 text-green-700 font-bold text-lg">Rs. {item.price}<span className="text-gray-500 text-sm font-medium ml-1">/ {item.unit}</span></p><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">Stock: {item.stock ?? 0}</span><span className={`rounded-full px-2.5 py-1 ${item.isAvailable && item.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>{!item.isAvailable ? 'Hidden' : item.stock <= 0 ? 'Out of stock' : 'Available'}</span></div><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => open('view', item)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"><Eye size={16} /> Details</button>{canManage && <><button aria-label={`Edit ${item.name}`} onClick={() => open('edit', item)} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"><Pencil size={17} /> Edit</button><button aria-label={`Delete ${item.name}`} onClick={() => open('delete', item)} className="rounded-lg bg-red-50 p-2.5 text-red-600 hover:bg-red-100"><Trash2 size={17} /></button></>}</div></div>
    </article>)}</div>}
  </div>
  {dialog && <ManagementDialog title={dialog.mode === 'view' ? 'Product details' : dialog.mode === 'edit' ? 'Edit grocery' : 'Delete grocery'} busy={busy} onClose={() => setDialog(null)}>
    {dialog.mode === 'view' ? <div className="space-y-4">{dialog.grocery.image && <div className="relative h-48"><Image src={dialog.grocery.image} alt={dialog.grocery.name} fill sizes="480px" className="object-contain" /></div>}<h3 className="text-xl font-semibold">{dialog.grocery.name}</h3><p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{dialog.grocery.description || 'No description provided.'}</p><dl className="grid grid-cols-2 gap-3 text-sm"><dt className="text-slate-500">Category</dt><dd>{dialog.grocery.category}</dd><dt className="text-slate-500">Price</dt><dd>Rs. {dialog.grocery.price} / {dialog.grocery.unit}</dd><dt className="text-slate-500">Stock</dt><dd>{dialog.grocery.stock ?? 0}</dd><dt className="text-slate-500">Visible in store</dt><dd>{dialog.grocery.isAvailable && dialog.grocery.stock > 0 ? 'Yes' : 'No'}</dd></dl></div> : dialog.mode === 'edit' && canManage ? <GroceryForm initial={dialog.grocery} onBusyChange={setBusy} onSaved={saved => { setGroceries(items => items.map(item => item._id === saved._id ? saved : item)); setDialog(null); setNotice('Grocery updated.') }} /> : canManage ? <div><p className="text-sm leading-6 text-slate-600">Permanently delete <strong>{dialog.grocery.name}</strong>? This removes it from the catalog. Existing orders retain their product details.</p>{dialogError && <p role="alert" className="mt-4 text-sm text-red-600">{dialogError}</p>}<div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={() => setDialog(null)} className="rounded-xl border border-slate-200 px-4 py-2">Cancel</button><button disabled={busy} onClick={remove} className="rounded-xl bg-red-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Deleting…' : 'Delete grocery'}</button></div></div> : <p className="text-sm text-slate-500">Only shopkeepers can change inventory.</p>}
  </ManagementDialog>}
  </main>
}
