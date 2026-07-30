import type { journeys, locations, media } from "@/db/schema"

export type Journey = typeof journeys.$inferSelect
export type NewJourney = typeof journeys.$inferInsert

export type Location = typeof locations.$inferSelect
export type NewLocation = typeof locations.$inferInsert

export type Media = typeof media.$inferSelect
export type NewMedia = typeof media.$inferInsert

export type LocationWithMedia = Location & { media: Media[] }
export type JourneyWithLocations = Journey & {
  locations: LocationWithMedia[]
}
