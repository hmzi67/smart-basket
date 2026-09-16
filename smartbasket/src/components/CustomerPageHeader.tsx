import Link from 'next/link'
import { ArrowLeft, ShoppingBasket } from 'lucide-react'

export default function CustomerPageHeader({ title, subtitle, backHref = '/', backLabel = 'Back to shop' }: { title: string; subtitle: string; backHref?: string; backLabel?: string }) {
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
    <div className="flex items-center gap-3 sm:gap-4"><Link href={backHref} aria-label={backLabel} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"><ArrowLeft size={20} /></Link><div><h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1><p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p></div></div>
    <Link href="/" className="hidden items-center gap-2 text-sm font-bold text-emerald-800 sm:inline-flex"><span className="rounded-xl bg-emerald-50 p-2"><ShoppingBasket size={20} /></span> SmartBasket</Link>
  </div></header>
}
