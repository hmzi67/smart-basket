import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json(
                { message: "user is not authenticated" },
                { status: 401 }
            );
        }

        await connectDb()
        const user = await User.findById(session.user.id).select("-password")
        if (!user) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            user,
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { message: `get me error : ${error}` },
            { status: 500 }
        );
    }
}
