import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { journeys, locations } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const locs = await db()
    .select()
    .from(locations)
    .where(eq(locations.journeyId, id))
    .orderBy(locations.order)

  return NextResponse.json(locs)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()

  if (!body.name || body.latitude == null || body.longitude == null) {
    return NextResponse.json(
      { error: "name, latitude, and longitude are required" },
      { status: 400 },
    )
  }

  const maxOrder = await db()
    .select({ max: locations.order })
    .from(locations)
    .where(eq(locations.journeyId, id))
    .then((rows) => Math.max(...rows.map((r) => r.max ?? 0), -1) + 1)

  const [location] = await db()
    .insert(locations)
    .values({
      journeyId: id,
      name: body.name,
      description: body.description ?? null,
      latitude: String(body.latitude),
      longitude: String(body.longitude),
      order: maxOrder,
    })
    .returning()

  return NextResponse.json(location, { status: 201 })
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const body = await request.json()

  const [journey] = await db()
    .select({ id: journeys.id })
    .from(journeys)
    .where(eq(journeys.id, id))

  if (!journey) {
    return NextResponse.json({ error: "Journey not found" }, { status: 404 })
  }

  if (!body.locations || !Array.isArray(body.locations)) {
    return NextResponse.json({ error: "locations array required" }, { status: 400 })
  }

  const updated = await Promise.all(
    body.locations.map(
      (loc: { id: string; order: number; name?: string; description?: string }) =>
        db()
          .update(locations)
          .set({ order: loc.order, name: loc.name, description: loc.description })
          .where(eq(locations.id, loc.id))
          .returning(),
    ),
  )

  return NextResponse.json(updated.flat())
}
