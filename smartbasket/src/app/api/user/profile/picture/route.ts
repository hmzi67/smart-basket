import { auth } from '@/auth'
import connectDb from '@/lib/db'
import uploadOnCloudinary from '@/lib/cloudinary'
import { validateProfileImage } from '@/lib/profile-image'
import User from '@/models/user.model'
import { NextRequest, NextResponse } from 'next/server'

// All roles may change their own picture. Never accept a target user ID or image URL.
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ message: 'Sign in to change your picture' }, { status: 401 })
    const form = await req.formData()
    const file = form.get('image')
    const error = await validateProfileImage(file)
    if (error) return NextResponse.json({ message: error }, { status: 400 })
    await connectDb()
    if (!await User.exists({ _id: session.user.id, isActive: { $ne: false } })) return NextResponse.json({ message: 'Account not found' }, { status: 404 })
    const image = await uploadOnCloudinary(file as Blob)
    if (!image) return NextResponse.json({ message: 'Image upload failed. Please try again.' }, { status: 502 })
    const user = await User.findOneAndUpdate({ _id: session.user.id, isActive: { $ne: false } }, { $set: { image } }, { returnDocument: 'after' }).select('-password')
    if (!user) return NextResponse.json({ message: 'Account not found' }, { status: 404 })
    return NextResponse.json({ user, message: 'Profile picture updated' })
  } catch (error) {
    console.error('Profile picture upload failed:', error)
    return NextResponse.json({ message: 'Could not update your picture. Please try again.' }, { status: 500 })
  }
}
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ message: 'Sign in to change your picture' }, { status: 401 })
    await connectDb()
    const user = await User.findOneAndUpdate({ _id: session.user.id, isActive: { $ne: false } }, { $set: { image: '' } }, { returnDocument: 'after' }).select('-password')
    if (!user) return NextResponse.json({ message: 'Account not found' }, { status: 404 })
    return NextResponse.json({ user, message: 'Profile picture removed' })
  } catch (error) {
    console.error('Remove profile picture failed:', error)
    return NextResponse.json({ message: 'Could not remove your picture. Please try again.' }, { status: 500 })
  }
}
