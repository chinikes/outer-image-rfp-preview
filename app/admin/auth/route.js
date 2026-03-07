export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";

export async function POST(req) {
  const { password } = await req.json();
  if (password === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function POST(req) {
  const { password } = await req.json();
  console.log("Expected:", process.env.ADMIN_PASSWORD ? "SET" : "NOT SET");
  console.log("Match:", password === process.env.ADMIN_PASSWORD);
  if (password === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
