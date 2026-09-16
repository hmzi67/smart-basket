import { auth } from '@/auth'
import connectDb from '@/lib/db'
import User from '@/models/user.model'
import Order from '@/models/order.model'
import { publicUserFields, updateManagedUser, userError, UserInputError, validateUserId } from '@/lib/admin-users'
import { NextRequest, NextResponse } from 'next/server'

type Context = { params: Promise<{ id: string }> }
export async function GET(_req: NextRequest, context: Context) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'admin') return NextResponse.json({ message: 'Only admins can view users' }, { status: 403 })
    await connectDb()
    const { id } = await context.params
    validateUserId(id)
    const user = await User.findById(id).select(publicUserFields)
    if (!user) throw new UserInputError('User not found', 404)
    return NextResponse.json({ user })
  } catch (error) { return userError(error) }
}
export async function PUT(req: NextRequest, context: Context) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'admin') return NextResponse.json({ message: 'Only admins can edit users' }, { status: 403 })
    await connectDb()
    const { id } = await context.params
    const user = await updateManagedUser(id, await req.json(), session.user.id)
    return NextResponse.json({ user, message: 'User updated' })
  } catch (error) { return userError(error) }
}
export async function DELETE(_req: NextRequest, context: Context) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'admin') return NextResponse.json({ message: 'Only admins can delete users' }, { status: 403 })
    await connectDb()
    const { id } = await context.params
    validateUserId(id)
    if (id === session.user.id) throw new UserInputError('You cannot delete your own admin account', 409)
    const user = await User.findById(id)
    if (!user) throw new UserInputError('User not found', 404)
    if (user.role === 'admin' && user.isActive !== false && !await User.countDocuments({ _id: { $ne: id }, role: 'admin', isActive: { $ne: false } })) {
      throw new UserInputError('Keep at least one active admin account', 409)
    }
    // Keep customer/rider references intact for order history and deliveries.
    if (await Order.exists({ $or: [{ user: id }, { assignedDeliveryBoy: id }] })) {
      throw new UserInputError('This user has order history. Deactivate the account instead to preserve those records.', 409)
    }
    const deleted = await User.findByIdAndDelete(id)
    if (!deleted) throw new UserInputError('User not found', 404)
    return NextResponse.json({ message: 'User deleted' })
  } catch (error) { return userError(error) }
}
