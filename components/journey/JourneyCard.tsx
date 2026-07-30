import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Journey } from "@/types"
import { format } from "date-fns"

export default function JourneyCard({ journey }: { journey: Journey }) {
  return (
    <Link href={`/journeys/${journey.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        {journey.coverPhotoUrl && (
          <div className="relative h-40 overflow-hidden rounded-t-xl">
            <Image
              src={journey.coverPhotoUrl}
              alt={journey.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        )}
        <CardHeader>
          <CardTitle>{journey.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {journey.description && (
            <p className="mb-2 text-sm text-zinc-500 line-clamp-2">
              {journey.description}
            </p>
          )}
          <p className="text-xs text-zinc-400">
            {format(new Date(journey.createdAt), "MMM d, yyyy")}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
