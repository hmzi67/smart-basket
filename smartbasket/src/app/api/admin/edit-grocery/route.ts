import { isValidObjectId } from 'mongoose'
import { auth } from '@/auth'
import connectDb from '@/lib/db'
import Grocery from '@/models/grocery.model'
import uploadOnCloudinary from '@/lib/cloudinary'
import { parseGroceryForm } from '@/lib/grocery-fields'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'shopkeeper') return NextResponse.json({ message: 'Only shopkeepers can edit groceries' }, { status: 403 })
    const form = await req.formData()
    const id = form.get('groceryId')
    if (typeof id !== 'string' || !isValidObjectId(id)) return NextResponse.json({ message: 'Invalid grocery ID' }, { status: 400 })
    const parsed = parseGroceryForm(form)
    if ('error' in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 })
    await connectDb()
    if (!await Grocery.exists({ _id: id })) return NextResponse.json({ message: 'Grocery not found' }, { status: 404 })
    const changes: Record<string, unknown> = { ...parsed.data }
    if (parsed.file) {
      const image = await uploadOnCloudinary(parsed.file)
      if (!image) return NextResponse.json({ message: 'Image upload failed. Your changes were not saved.' }, { status: 502 })
      changes.image = image
    }
    const grocery = await Grocery.findByIdAndUpdate(id, { $set: changes }, { returnDocument: 'after', runValidators: true })
    if (!grocery) return NextResponse.json({ message: 'Grocery not found' }, { status: 404 })
    return NextResponse.json(grocery)
  } catch (error) {
    console.error('Edit grocery failed:', error)
    return NextResponse.json({ message: 'Could not save this grocery. Please try again.' }, { status: 500 })
  }
}
