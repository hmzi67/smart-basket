import connectDb from "@/lib/db"
import Order from "@/models/order.model"
import User from "@/models/user.model"
import AdminDashboardClient from "./AdminDashboardClient"


async function AdminDashboard() {
    await connectDb()
    const orders=await Order.find({}).lean<any[]>()
    const totalCustomers=await User.countDocuments({role:"user"})

    const totalOrders=orders.length
    const pendingDeliveries=orders.filter((o)=>o.status=="pending").length
    const amount=(o:any)=>Number(o.totalAmount) || 0
    const totalRevenue=orders.reduce((sum,o)=>sum+amount(o),0)

    const today=new Date()
const startOfToday=new Date(today)
startOfToday.setHours(0,0,0,0)

const sevenDaysAgo=new Date()
sevenDaysAgo.setDate(today.getDate() - 6)

const todayOrders=orders.filter((o)=>new Date(o.createdAt)>=startOfToday)
const todayRevenue=todayOrders.reduce((sum,o)=>sum+amount(o),0)

const sevenDaysOrders=orders.filter((o)=>new Date(o.createdAt)>=sevenDaysAgo)
const sevenDaysRevenue = sevenDaysOrders.reduce((sum, o) => sum + amount(o), 0)


const stats = [
    { title: "Total Orders", value: totalOrders },
    { title: "Total Customers", value: totalCustomers },
    { title: "Pending Deliveries", value: pendingDeliveries },
     { title: "Total Revenue", value: totalRevenue },
];

const chartData:{day:string,orders:number}[]=[]

for (let i = 6; i >=0; i--) {

    const date=new Date()
    date.setDate(date.getDate()-i)
    date.setHours(0,0,0,0)

    const nextDay=new Date(date)
    nextDay.setDate(nextDay.getDate()+1)

    const ordersCount=orders.filter((o)=>new Date(o.createdAt)>=date && new Date(o.createdAt)<nextDay).length

chartData.push({
  day:date.toLocaleString("en-US",{weekday:"short"}),
  orders:ordersCount
})
}
return (
  <>
    <AdminDashboardClient
        earning={{
            today: todayRevenue,
            sevenDays: sevenDaysRevenue,
            total: totalRevenue
        }}
        stats={stats}
     chartData={chartData}

    />
    </>
)
}
export default AdminDashboard

