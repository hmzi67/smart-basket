import { isValidObjectId } from 'mongoose'
import { auth } from '@/auth'
import connectDb from '@/lib/db'
import Grocery from '@/models/grocery.model'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'shopkeeper') return NextResponse.json({ message: 'Only shopkeepers can delete groceries' }, { status: 403 })
    const { groceryId } = await req.json()
    if (typeof groceryId !== 'string' || !isValidObjectId(groceryId)) return NextResponse.json({ message: 'Invalid grocery ID' }, { status: 400 })
    await connectDb()
    const grocery = await Grocery.findByIdAndDelete(groceryId)
    if (!grocery) return NextResponse.json({ message: 'Grocery not found' }, { status: 404 })
    return NextResponse.json(grocery)
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
    console.error('Delete grocery failed:', error)
    return NextResponse.json({ message: 'Could not delete this grocery. Please try again.' }, { status: 500 })
  }
}
