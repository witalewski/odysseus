"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import JourneyForm from "@/components/journey/JourneyForm"
import LocationList from "@/components/journey/LocationList"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"

interface JourneyData {
  id: string
  title: string
  description: string | null
  locations: Array<{
    id: string
    name: string
    description: string | null
    latitude: string
    longitude: string
    order: number
    media: Array<{
      id: string
      url: string
      type: "photo" | "video"
      caption: string | null
      order: number
    }>
  }>
}

export default function EditJourneyPage() {
  const params = useParams()
  const router = useRouter()
  const [journey, setJourney] = useState<JourneyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/journeys/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setJourney(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) router.push("/")
      })
    return () => { cancelled = true }
  }, [params.id, router])

  const handleUpdate = async (values: { title: string; description?: string }) => {
    await fetch(`/api/journeys/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const res = await fetch(`/api/journeys/${params.id}`)
    if (res.ok) setJourney(await res.json())
  }

  const handleDelete = async () => {
    if (!confirm("Delete this journey? This cannot be undone.")) return
    await fetch(`/api/journeys/${params.id}`, { method: "DELETE" })
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    )
  }

  if (!journey) return null

  const locations = journey.locations.map((loc) => ({
    ...loc,
    latitude: Number(loc.latitude),
    longitude: Number(loc.longitude),
  }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href={`/journeys/${journey.id}`}
        className="mb-6 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Journey</h1>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-1 h-4 w-4" /> Delete
        </Button>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Details</h2>
        <JourneyForm
          defaultValues={{
            title: journey.title,
            description: journey.description ?? undefined,
          }}
          onSubmit={handleUpdate}
          submitLabel="Update Details"
        />
      </section>

      <section>
        <LocationList
          journeyId={journey.id}
          locations={locations}
          onLocationsChange={async () => {
            const res = await fetch(`/api/journeys/${params.id}`)
            if (res.ok) setJourney(await res.json())
          }}
        />
      </section>
    </div>
  )
}
