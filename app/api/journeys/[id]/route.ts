import { NextResponse } from "next/server"
import { db } from "@/db"
import { journeys, locations, media } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const [journey] = await db()
    .select()
    .from(journeys)
    .where(eq(journeys.id, id))

  if (!journey) {
    return NextResponse.json({ error: "Journey not found" }, { status: 404 })
  }

  const locs = await db()
    .select()
    .from(locations)
    .where(eq(locations.journeyId, id))
    .orderBy(locations.order)

  const locationIds = locs.map((l) => l.id)
  const mediaByLocation = locationIds.length
    ? await Promise.all(
        locationIds.map((lid) =>
          db()
            .select()
            .from(media)
            .where(eq(media.locationId, lid))
            .orderBy(media.order),
        ),
      )
    : []

  const locationsWithMedia = locs.map((loc, i) => ({
    ...loc,
    media: mediaByLocation[i] || [],
  }))

  return NextResponse.json({ ...journey, locations: locationsWithMedia })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()

  const [journey] = await db()
    .update(journeys)
    .set({
      title: body.title,
      description: body.description,
      coverPhotoUrl: body.coverPhotoUrl,
    })
    .where(eq(journeys.id, id))
    .returning()

  if (!journey) {
    return NextResponse.json({ error: "Journey not found" }, { status: 404 })
  }

  return NextResponse.json(journey)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const [journey] = await db()
    .delete(journeys)
    .where(eq(journeys.id, id))
    .returning()

  if (!journey) {
    return NextResponse.json({ error: "Journey not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
