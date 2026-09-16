import Link from 'next/link'
import { ArrowLeft, ShoppingBasket } from 'lucide-react'

export default function CustomerPageHeader({ title, subtitle, backHref = '/', backLabel = 'Back to shop' }: { title: string; subtitle: string; backHref?: string; backLabel?: string }) {
  return <header className="border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
    <div className="flex items-center gap-3 sm:gap-4"><Link href={backHref} aria-label={backLabel} className="rounded-full bg-gray-100 p-2.5 text-green-700 transition hover:bg-gray-200 active:scale-95"><ArrowLeft size={22} /></Link><div><h1 className="text-xl font-bold text-gray-800 sm:text-2xl">{title}</h1>{subtitle && <p className="mt-1 text-xs text-gray-500 sm:text-sm">{subtitle}</p>}</div></div>
    <Link href="/" className="hidden items-center gap-2 text-sm font-bold text-green-700 sm:inline-flex"><span className="rounded-full bg-green-100 p-2"><ShoppingBasket size={20} /></span> SmartBasket</Link>
  </div></header>
}
