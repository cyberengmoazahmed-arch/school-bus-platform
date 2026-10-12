import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ count: 0 }, { status: 401 });
  const count = await prisma.notification.count({ where: { userId: session.id, readAt: null } });
  return NextResponse.json({ count });
}