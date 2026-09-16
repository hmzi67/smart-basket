import connectDb from "../../../lib/db";
import User from "../../../models/user.model";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/password";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { name, email, password } = await req.json();
    const existUser = await User.findOne({ email });
    if (existUser) {
      return NextResponse.json({ message: "User already exists!" }, { status: 400 });
    }
    const strengthError = validatePassword(password);
    if (strengthError) {
      return NextResponse.json({ message: strengthError }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `register error ${error}` }, { status: 500 });
  }
}
