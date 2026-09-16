import connectDb from "@/lib/db";
import User from "@/models/user.model";

import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const { userId, socketId } = await req.json()
        
        const user = await User.findByIdAndUpdate(userId, {
            socketId,
            isOnline: true
        }, { returnDocument: "after" })
        
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 400 })
        }

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error("Error updating user online status:", error)
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
    }
}