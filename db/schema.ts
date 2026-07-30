import { pgTable, uuid, text, numeric, integer, timestamp } from "drizzle-orm/pg-core"

export const journeys = pgTable("journeys", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coverPhotoUrl: text("cover_photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  journeyId: uuid("journey_id")
    .notNull()
    .references(() => journeys.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  type: text("type", { enum: ["photo", "video"] }).notNull(),
  caption: text("caption"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
