'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import GroceryForm from '@/components/GroceryForm'
export default function AddGrocery() {
  const router = useRouter()
  return <main className="min-h-screen bg-[#f6f8f7] px-4 py-8"><div className="mx-auto max-w-2xl"><Link href="/admin/view-grocery" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-700"><ArrowLeft size={17} /> Back to inventory</Link><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h1 className="text-2xl font-bold text-slate-900">Add grocery</h1><p className="mb-6 mt-2 text-sm text-slate-500">Add a product to the shared store catalog.</p><GroceryForm onSaved={() => { router.push('/admin/view-grocery'); router.refresh() }} /></section></div></main>
}
