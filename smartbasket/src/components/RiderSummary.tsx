import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function RiderSummary({ earning, completed, today }: { earning: number; completed: number; today: number }) {
  return <section className="rounded-xl border border-gray-400 bg-white p-5 text-center shadow-xl sm:p-6">
    <h2 className="mb-3 text-sm font-medium text-green-700">Today’s Performance</h2>
    <div role="img" aria-label={`${today} deliveries and Rs. ${earning} earned today`}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={[{ name: 'Today', deliveries: today, earnings: earning }]}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="deliveries" name="Deliveries" fill="#16a34a" />
          <Bar dataKey="earnings" name="Earnings (Rs.)" fill="#15803d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <p className="mt-4 font-bold text-green-700">Rs. {earning.toLocaleString('en-PK')} Earned Today</p>
    <button onClick={() => window.location.reload()} className="mt-4 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700">Refresh Earnings</button>
    <Link href="/delivery/my-deliveries" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-green-700">My deliveries ({completed}) <ArrowUpRight size={16} /></Link>
  </section>
}
