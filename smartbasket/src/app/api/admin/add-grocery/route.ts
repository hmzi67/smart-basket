import { auth } from '@/auth'
import connectDb from '@/lib/db'
import Grocery from '@/models/grocery.model'
import uploadOnCloudinary from '@/lib/cloudinary'
import { parseGroceryForm } from '@/lib/grocery-fields'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'shopkeeper') return NextResponse.json({ message: 'Only shopkeepers can add groceries' }, { status: 403 })
    const parsed = parseGroceryForm(await req.formData())
    if ('error' in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 })
    if (!parsed.file) return NextResponse.json({ message: 'A product image is required' }, { status: 400 })
    await connectDb()
    const image = await uploadOnCloudinary(parsed.file)
    if (!image) return NextResponse.json({ message: 'Image upload failed. Please try again.' }, { status: 502 })
    const grocery = await Grocery.create({ ...parsed.data, image })
    return NextResponse.json(grocery, { status: 201 })
  } catch (error) {
    console.error('Add grocery failed:', error)
    return NextResponse.json({ message: 'Could not add this grocery. Please try again.' }, { status: 500 })
  }
}
