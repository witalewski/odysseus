import { NextResponse } from "next/server"
import { db } from "@/db"
import { media, locations } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const items = await db()
    .select()
    .from(media)
    .where(eq(media.locationId, id))
    .orderBy(media.order)

  return NextResponse.json(items)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: locationId } = await params
  const body = await request.json()

  const [location] = await db()
    .select()
    .from(locations)
    .where(eq(locations.id, locationId))

  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 })
  }

  if (!body.url || !body.type) {
    return NextResponse.json(
      { error: "url and type are required" },
      { status: 400 },
    )
  }

  const maxOrder = await db()
    .select({ max: media.order })
    .from(media)
    .where(eq(media.locationId, locationId))
    .then((rows) => Math.max(...rows.map((r) => r.max ?? 0), -1) + 1)

  const [item] = await db()
    .insert(media)
    .values({
      locationId,
      url: body.url,
      type: body.type,
      caption: body.caption ?? null,
      order: maxOrder,
    })
    .returning()

  return NextResponse.json(item, { status: 201 })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()

  if (body.mediaId) {
    const [mediaItem] = await db()
      .select()
      .from(media)
      .where(eq(media.id, body.mediaId))

    if (!mediaItem || mediaItem.locationId !== id) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    await db()
      .delete(media)
      .where(eq(media.id, body.mediaId))

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "mediaId required" }, { status: 400 })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: locationId } = await params
  const body = await request.json()

  const [location] = await db()
    .select()
    .from(locations)
    .where(eq(locations.id, locationId))

  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 })
  }

  if (!body.media || !Array.isArray(body.media)) {
    return NextResponse.json({ error: "media array required" }, { status: 400 })
  }

  const updated = await Promise.all(
    body.media.map(
      (item: { id: string; order: number; caption?: string }) =>
        db()
          .update(media)
          .set({ order: item.order, caption: item.caption })
          .where(eq(media.id, item.id))
          .returning(),
    ),
  )

  return NextResponse.json(updated.flat())
}
