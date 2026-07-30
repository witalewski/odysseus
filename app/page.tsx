import Link from "next/link"
import { db } from "@/db"
import { journeys } from "@/db/schema"
import { desc } from "drizzle-orm"
import JourneyCard from "@/components/journey/JourneyCard"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function Home() {
  let allJourneys: typeof journeys.$inferSelect[] = []
  try {
    allJourneys = await db()
      .select()
      .from(journeys)
      .orderBy(desc(journeys.createdAt))
  } catch {
    // Database not available during build
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Journeys</h1>
          <p className="mt-1 text-zinc-500">
            Create and share slideshows of your travels
          </p>
        </div>
        <Link href="/journeys/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" /> New Journey
          </Button>
        </Link>
      </div>

      {allJourneys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-20 dark:border-zinc-600">
          <h2 className="text-xl font-semibold text-zinc-500">No journeys yet</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Create your first travel slideshow to get started.
          </p>
          <Link href="/journeys/new" className="mt-6">
            <Button>Create Your First Journey</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allJourneys.map((journey) => (
            <JourneyCard key={journey.id} journey={journey} />
          ))}
        </div>
      )}
    </div>
  )
}
