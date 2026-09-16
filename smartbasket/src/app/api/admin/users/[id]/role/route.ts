import { auth } from '@/auth'
import connectDb from '@/lib/db'
import { updateManagedUser, userError, UserInputError } from '@/lib/admin-users'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'admin') return NextResponse.json({ message: 'Only admins can manage users' }, { status: 403 })
    await connectDb()
    const { id } = await context.params
    const body = await req.json()
    if (!body || !Object.hasOwn(body, 'role')) throw new UserInputError('role is required')
    const user = await updateManagedUser(id, { role: body.role }, session.user.id)
    return NextResponse.json({ user, message: 'User updated' })
  } catch (error) { return userError(error) }
}
