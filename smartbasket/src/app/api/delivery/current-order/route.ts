
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDb()
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ message: "Sign in to view deliveries" }, { status: 401 })
        if (session.user.role !== "deliveryBoy") return NextResponse.json({ message: "Only delivery riders can view deliveries" }, { status: 403 })
        const deliveryBoyId = session.user.id
        const activeAssignment = await DeliveryAssignment.findOne({
            assignedTo: deliveryBoyId,
            status: "assigned"
        }).populate("order").lean()
        if(!activeAssignment){
        return NextResponse.json({ active:false}, { status: 200 })
    } 
     return NextResponse.json({active :true,assignment:activeAssignment}, { status: 200 })
}
    catch (error) {
        return NextResponse.json({message:`current order error ${error}`},
             { status: 500 })
    }
}