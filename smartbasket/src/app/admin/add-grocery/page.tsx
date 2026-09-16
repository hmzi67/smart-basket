'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import GroceryForm from '@/components/GroceryForm'
export default function AddGrocery() {
  const router = useRouter()
  return <main className="min-h-screen bg-linear-to-br from-green-50 to-white px-4 py-8 sm:py-12"><div className="mx-auto max-w-xl"><Link href="/admin/view-grocery" className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-200"><ArrowLeft size={17} /> Back to inventory</Link><section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl sm:mt-12 sm:p-8"><h1 className="text-center text-3xl font-extrabold text-green-700">Add Grocery Item</h1><p className="mb-8 mt-2 text-center text-sm text-gray-500">Fill out the details below to add a new grocery item.</p><GroceryForm onSaved={() => { router.push('/admin/view-grocery'); router.refresh() }} /></section></div></main>
}
