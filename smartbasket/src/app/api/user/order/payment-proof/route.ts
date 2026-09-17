import { auth } from '@/auth'
import uploadOnCloudinary from '@/lib/cloudinary'
import { validatePaymentProof } from '@/lib/payment-proof'
import { NextRequest, NextResponse } from 'next/server'

// Uploads the customer's transaction screenshot so it can be attached to the order.
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ message: 'Sign in to upload a screenshot' }, { status: 401 })
    const form = await req.formData()
    const file = form.get('image')
    const error = await validatePaymentProof(file)
    if (error) return NextResponse.json({ message: error }, { status: 400 })
    const url = await uploadOnCloudinary(file as Blob)
    if (!url) return NextResponse.json({ message: 'Upload failed. Please try again.' }, { status: 502 })
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Payment proof upload failed:', error)
    return NextResponse.json({ message: 'Could not upload the screenshot. Please try again.' }, { status: 500 })
  }
}
