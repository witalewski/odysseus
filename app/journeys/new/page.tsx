"use client"

import { useRouter } from "next/navigation"
import JourneyForm from "@/components/journey/JourneyForm"

export default function NewJourneyPage() {
  const router = useRouter()

  const handleSubmit = async (values: { title: string; description?: string }) => {
    const res = await fetch("/api/journeys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (!res.ok) throw new Error("Failed to create journey")

    const journey = await res.json()
    router.push(`/journeys/${journey.id}/edit`)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">New Journey</h1>
      <JourneyForm
        onSubmit={handleSubmit}
        submitLabel="Create Journey"
      />
    </div>
  )
}
