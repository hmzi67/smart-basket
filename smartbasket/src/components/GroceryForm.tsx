'use client'
import axios from 'axios'
import Image from 'next/image'
import { useEffect, useState, type FormEvent } from 'react'
import type { IGrocery } from '@/models/grocery.model'
import { groceryCategories, groceryUnits, parseGroceryForm } from '@/lib/grocery-fields'

const field = 'mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
export default function GroceryForm({ initial, onSaved, onBusyChange }: { initial?: IGrocery; onSaved: (grocery: IGrocery) => void; onBusyChange?: (busy: boolean) => void }) {
  const [image, setImage] = useState(initial?.image ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => () => { if (image.startsWith('blob:')) URL.revokeObjectURL(image) }, [image])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const file = form.get('image')
    if (file instanceof File && !file.size) form.delete('image')
    form.set('isAvailable', form.get('isAvailable') === 'on' ? 'true' : 'false')
    const parsed = parseGroceryForm(form)
    if ('error' in parsed) { setError(parsed.error!); return }
    if (!initial && !parsed.file) { setError('Choose a product image'); return }
    if (initial?._id) form.set('groceryId', String(initial._id))
    setBusy(true); onBusyChange?.(true); setError('')
    try {
      const { data } = await axios.post(initial ? '/api/admin/edit-grocery' : '/api/admin/add-grocery', form)
      onSaved(data)
    } catch (err) { setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Could not save the product.' : 'Could not save the product.') }
    finally { setBusy(false); onBusyChange?.(false) }
  }
  return <form onSubmit={submit} className="space-y-5">
    <fieldset disabled={busy} className="space-y-4">
      <label className="block text-sm font-medium">Product name<input name="name" required maxLength={150} defaultValue={initial?.name} className={field} /></label>
      <div className="grid grid-cols-2 gap-4"><label className="block text-sm font-medium">Category<select name="category" required defaultValue={initial?.category ?? ''} className={field}><option value="">Select category</option>{groceryCategories.map(value => <option key={value}>{value}</option>)}</select></label><label className="block text-sm font-medium">Unit<select name="unit" required defaultValue={initial?.unit ?? ''} className={field}><option value="">Select unit</option>{groceryUnits.map(value => <option key={value}>{value}</option>)}</select></label></div>
      <div className="grid grid-cols-2 gap-4"><label className="block text-sm font-medium">Price (Rs.)<input name="price" type="number" min="0.01" step="0.01" required defaultValue={initial?.price} className={field} /></label><label className="block text-sm font-medium">Stock<input name="stock" type="number" min="0" step="1" required defaultValue={initial?.stock ?? 0} className={field} /></label></div>
      <label className="block text-sm font-medium">Description<textarea name="description" maxLength={2000} rows={3} defaultValue={initial?.description} className={field} /></label>
      <label className="block text-sm font-medium">Product image<input name="image" type="file" accept="image/*" required={!initial} onChange={event => { const file = event.target.files?.[0]; setImage(file ? URL.createObjectURL(file) : initial?.image ?? '') }} className="mt-2 block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-700" /><span className="mt-1 block text-xs font-normal text-slate-500">Up to 5 MB.{initial && ' Leave empty to keep the current image.'}</span></label>
      {image && <div className="relative h-36 overflow-hidden rounded-xl bg-slate-50"><Image src={image} alt="Product preview" fill sizes="400px" className="object-contain" /></div>}
      <label className="flex items-center gap-2 text-sm"><input name="isAvailable" type="checkbox" defaultChecked={initial?.isAvailable ?? true} className="h-4 w-4 accent-emerald-700" /> Available for sale</label>
      <p className="text-xs text-slate-500">Out-of-stock and unavailable products are hidden from the customer catalog.</p>
    </fieldset>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <button type="submit" disabled={busy} className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{busy ? 'Saving…' : initial ? 'Save changes' : 'Add grocery'}</button>
  </form>
}
