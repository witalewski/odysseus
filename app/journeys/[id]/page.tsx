"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SlideshowPlayer from "@/components/slideshow/SlideshowPlayer"
import Link from "next/link"
import { Play, Edit, ArrowLeft, MapPin } from "lucide-react"
import type { LocationWithMedia } from "@/types"

interface JourneyData {
  id: string
  title: string
  description: string | null
  locations: LocationWithMedia[]
}

export default function JourneyPage() {
  const params = useParams()
  const [journey, setJourney] = useState<JourneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSlideshow, setShowSlideshow] = useState(false)

  useEffect(() => {
    fetch(`/api/journeys/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setJourney(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    )
  }

  if (!journey) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Journey not found</p>
      </div>
    )
  }

  const totalMedia = journey.locations.reduce(
    (sum, loc) => sum + loc.media.length,
    0,
  )

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Journeys
        </Link>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{journey.title}</h1>
            {journey.description && (
              <p className="mt-2 text-zinc-500">{journey.description}</p>
            )}
            <div className="mt-3 flex gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {journey.locations.length} locations
              </span>
              <span>
                {totalMedia} photo{totalMedia !== 1 ? "s" : ""}
                {totalMedia > 0 ? "/videos" : ""}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowSlideshow(true)} disabled={journey.locations.length === 0}>
              <Play className="mr-1 h-4 w-4" /> Start Slideshow
            </Button>
            <Link href={`/journeys/${journey.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-1 h-4 w-4" /> Edit
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {journey.locations.map((location, i) => (
            <Card key={location.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium dark:bg-zinc-800">
                    {i + 1}
                  </span>
                  {location.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {location.description && (
                  <p className="mb-3 text-sm text-zinc-500">{location.description}</p>
                )}
                {location.media.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {location.media.map((m) => (
                      <div
                        key={m.id}
                        className="h-20 w-20 overflow-hidden rounded-md bg-zinc-100"
                      >
                        {m.type === "photo" ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={m.url}
                            alt={m.caption ?? ""}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                            Video
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {showSlideshow && (
        <SlideshowPlayer
          locations={journey.locations.map((loc) => ({
            ...loc,
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
          }))}
          onClose={() => setShowSlideshow(false)}
        />
      )}
    </>
  )
}
