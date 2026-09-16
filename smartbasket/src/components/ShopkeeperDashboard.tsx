import connectDb from "@/lib/db"
import Grocery from "@/models/grocery.model"
import ShopkeeperDashboardClient from "./ShopkeeperDashboardClient"

async function ShopkeeperDashboard() {
    await connectDb()
    const groceries = await Grocery.find({}).select("stock isAvailable").lean<any[]>()

    const totalProducts = groceries.length
    const outOfStock = groceries.filter((g) => g.stock <= 0).length
    const lowStock = groceries.filter((g) => g.stock > 0 && g.stock <= 5).length
    const hidden = groceries.filter((g) => !g.isAvailable).length

    const stats = [
        { title: "Total Products", value: totalProducts },
        { title: "Out of Stock", value: outOfStock },
        { title: "Low Stock (≤5)", value: lowStock },
        { title: "Hidden From Store", value: hidden },
    ]

    return <ShopkeeperDashboardClient stats={stats} />
}

export default ShopkeeperDashboard
