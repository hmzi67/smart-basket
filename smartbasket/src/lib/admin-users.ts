import bcrypt from 'bcryptjs'
import { isValidObjectId } from 'mongoose'
import { NextResponse } from 'next/server'
import User from '@/models/user.model'
import Order from '@/models/order.model'
import { validatePassword } from '@/lib/password'

const roles = ['user', 'deliveryBoy', 'shopkeeper', 'admin']
export const publicUserFields = 'name email mobile address role image isActive isOnline createdAt'
export class UserInputError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}
export async function userFields(input: unknown, creating = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new UserInputError('Invalid user details')
  const body = input as Record<string, unknown>
  const data: Record<string, unknown> = {}
  for (const field of ['name', 'email', 'mobile', 'address', 'role'] as const) {
    if (!(field in body) && !creating) continue
    const value = body[field] ?? (field === 'address' ? '' : undefined)
    if (typeof value !== 'string') throw new UserInputError(`${field} is required`)
    data[field] = field === 'email' ? value.trim().toLowerCase() : value.trim()
  }
  if ('name' in data && (String(data.name).length < 2 || String(data.name).length > 100)) throw new UserInputError('Name must be 2–100 characters')
  if ('email' in data && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) throw new UserInputError('Enter a valid email address')
  if ('mobile' in data && !/^\d{10,15}$/.test(String(data.mobile))) throw new UserInputError('Enter a mobile number with 10–15 digits')
  if ('role' in data && !roles.includes(String(data.role))) throw new UserInputError('Unknown role')
  if ('address' in data && String(data.address).length > 300) throw new UserInputError('Address must be under 300 characters')
  if ('isActive' in body) {
    if (typeof body.isActive !== 'boolean') throw new UserInputError('Account status must be true or false')
    data.isActive = body.isActive
  }
  if (creating || (body.password !== undefined && body.password !== '')) {
    const error = validatePassword(body.password)
    if (error) throw new UserInputError(error)
    data.password = await bcrypt.hash(body.password as string, 10)
    data.resetPasswordTokenHash = null
    data.resetPasswordExpiresAt = null
  }
  if (!Object.keys(data).length) throw new UserInputError('No user details supplied')
  return data
}
export function validateUserId(id: string) {
  if (!isValidObjectId(id)) throw new UserInputError('Invalid user ID')
}
export async function updateManagedUser(id: string, input: unknown, actorId: string) {
  validateUserId(id)
  const data = await userFields(input)
  const current = await User.findById(id)
  if (!current) throw new UserInputError('User not found', 404)
  if (id === actorId && (data.isActive === false || (data.role && data.role !== 'admin'))) {
    throw new UserInputError('You cannot deactivate or demote your own admin account', 409)
  }
  if (current.role === 'admin' && current.isActive !== false && (data.isActive === false || (data.role && data.role !== 'admin'))) {
    const others = await User.countDocuments({ role: 'admin', isActive: { $ne: false }, _id: { $ne: id } })
    if (!others) throw new UserInputError('Keep at least one active admin account', 409)
  }
  if (current.role === 'deliveryBoy' && (data.isActive === false || (data.role && data.role !== 'deliveryBoy'))) {
    if (await Order.exists({ assignedDeliveryBoy: id, status: { $in: ['pending', 'out of delivery'] } })) {
      throw new UserInputError('This rider has an active delivery. Complete or reassign it first.', 409)
    }
  }
  const user = await User.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true }).select(publicUserFields)
  if (!user) throw new UserInputError('User not found', 404)
  return user
}
export function userError(error: unknown) {
  if (error instanceof UserInputError) return NextResponse.json({ message: error.message }, { status: error.status })
  if (error instanceof SyntaxError) return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  if ((error as { code?: number })?.code === 11000) return NextResponse.json({ message: 'An account with this email already exists' }, { status: 409 })
  console.error('User management error:', error)
  return NextResponse.json({ message: 'Could not save these changes. Please try again.' }, { status: 500 })
}
