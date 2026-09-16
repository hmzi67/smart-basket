import { auth } from '@/auth'
import AdminDashboard from '@/components/AdminDashboard'
import ShopkeeperDashboard from '@/components/ShopkeeperDashboard'
import DeliveryBoy from '@/components/DeliveryBoy'
import EditRoleMobile from '@/components/EditRoleMobile'
import GeoUpdater from '@/components/GeoUpdater'
import Nav from '@/components/Nav'
import UserDashboard from '@/components/UserDashboard'
import Footer from "@/components/Footer";
import connectDb from '@/lib/db'
import Grocery from '@/models/grocery.model'
import { DEFAULT_PAGE_SIZE, sellableFilter } from '@/lib/grocery'
import User from '@/models/user.model'
import { redirect } from 'next/navigation'
import React from 'react'

async function Home(props: {
    searchParams: Promise<{
        q?: string
        category?: string
    }>
}) {
    const searchParams = await props.searchParams

    await connectDb()
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const user = await User.findById(session.user.id).lean()

    if (!user) {
        redirect("/login")
    }

    const inComplete = !user.mobile || !user.role || (!user.mobile && user.role === "user")

    if (inComplete) {
        return <EditRoleMobile assignedRole={user.role} />
    }

    const plainUser = JSON.parse(JSON.stringify(user))
    const NavComponent = Nav as React.ComponentType<any>

    const q = searchParams?.q?.trim() || undefined
    const category = searchParams?.category?.trim() || undefined

    let groceryList: any[] = []
    let total = 0

    if (user.role === "user") {
        // Same filter the API uses: unavailable and out-of-stock items are never listed.
        const filter: Record<string, any> = { ...sellableFilter }
        if (category) {
            filter.category = category
        }
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { category: { $regex: q, $options: "i" } },
            ]
        }

        // first page only; GroceryList fetches the rest from /api/groceries
        const [rawGroceryList, count] = await Promise.all([
            Grocery.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .limit(DEFAULT_PAGE_SIZE)
                .lean(),
            Grocery.countDocuments(filter),
        ])

        groceryList = JSON.parse(JSON.stringify(rawGroceryList))
        total = count
    }

    return (
        <>
            <NavComponent user={plainUser} />
            <GeoUpdater userId={plainUser?._id} />
            {user.role === "user" ? (
                <UserDashboard
                    groceryList={groceryList}
                    hasMore={total > groceryList.length}
                    total={total}
                    q={q}
                    category={category}
                />
            ) : user.role === "admin" ? (
                <AdminDashboard />
            ) : user.role === "shopkeeper" ? (
                <ShopkeeperDashboard />
            ) : (
                <DeliveryBoy />
            )}
            <Footer />
        </>
    )
}

export default Home
