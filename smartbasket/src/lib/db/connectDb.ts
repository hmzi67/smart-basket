// @ts-ignore
import mongoose from 'mongoose'

async function connectDb() {
  // @ts-ignore
  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables.')
  }

  try {
    await mongoose.connect(mongoUri as string)
    console.log('Database connected successfully')
  } catch (error) {
    console.error('Database connection failed:', error)
    throw error
  }
}

export default connectDb