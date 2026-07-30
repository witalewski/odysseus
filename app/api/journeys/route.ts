import { NextResponse } from "next/server"
import { db } from "@/db"
import { journeys } from "@/db/schema"
import { desc } from "drizzle-orm"

export async function GET() {
  const all = await db()
    .select()
    .from(journeys)
    .orderBy(desc(journeys.createdAt))
  return NextResponse.json(all)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { title, description } = body

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const [journey] = await db()
    .insert(journeys)
    .values({ title, description: description ?? null })
    .returning()

  return NextResponse.json(journey, { status: 201 })
}
