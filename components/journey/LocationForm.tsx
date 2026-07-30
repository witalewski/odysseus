"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import MapWrapper from "@/components/map/MapWrapper"
import { MapPin, Search } from "lucide-react"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface LocationFormProps {
  onSubmit: (values: FormValues & { latitude: number; longitude: number }) => Promise<void>
  defaultValues?: Partial<FormValues & { latitude: number; longitude: number }>
  existingLocations?: Array<{ latitude: number; longitude: number }>
}

function computeCenter(locations: Array<{ latitude: number; longitude: number }>): [number, number] | null {
  if (locations.length === 0) return null
  const lat = locations.reduce((s, l) => s + l.latitude, 0) / locations.length
  const lng = locations.reduce((s, l) => s + l.longitude, 0) / locations.length
  return [lat, lng]
}

export default function LocationForm({
  onSubmit,
  defaultValues,
  existingLocations = [],
}: LocationFormProps) {
  const defaultCenter = existingLocations.length > 0 ? computeCenter(existingLocations) : null

  const [position, setPosition] = useState<[number, number] | null>(
    defaultValues?.latitude != null && defaultValues?.longitude != null
      ? [defaultValues.latitude, defaultValues.longitude]
      : null,
  )
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null)
  const userInteractedRef = useRef(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", ...defaultValues },
  })

  const nameValue = watch("name")

  useEffect(() => {
    if (userInteractedRef.current || !nameValue || nameValue.length < 3) return

    const timer = setTimeout(async () => {
      if (userInteractedRef.current) return
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(nameValue)}&format=json&limit=1`,
          { headers: { "Accept-Language": "en" } },
        )
        const data = await res.json()
        if (data.length > 0 && !userInteractedRef.current) {
          const lat = parseFloat(data[0].lat)
          const lng = parseFloat(data[0].lon)
          setPosition([lat, lng])
          setFlyTo([lat, lng])
        }
      } catch {
        // geocoding failed silently
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [nameValue])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    userInteractedRef.current = true
    setPosition([lat, lng])
  }, [])

  const onFormSubmit = (values: FormValues) => {
    if (!position) {
      alert("Please click on the map to select a location")
      return
    }
    onSubmit({ ...values, latitude: position[0], longitude: position[1] })
  }

  const center = position ?? defaultCenter ?? [20, 0]
  const zoom = position ? 10 : defaultCenter ? 5 : 2

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="loc-name">Location Name</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            id="loc-name"
            {...register("name")}
            placeholder="e.g., Eiffel Tower"
            className="pl-9"
          />
        </div>
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="loc-description">Description (optional)</Label>
        <Textarea
          id="loc-description"
          {...register("description")}
          placeholder="Notes about this location..."
        />
      </div>
      <div className="space-y-2">
        <Label>Pick on map</Label>
        <div className="h-60 overflow-hidden rounded-md">
          <MapWrapper
            key={defaultCenter ? defaultCenter.join() : "default"}
            center={center}
            zoom={zoom}
            markers={
              position
                ? [{ id: "preview", latitude: position[0], longitude: position[1], name: "Selected" }]
                : []
            }
            flyTo={flyTo}
            onMapClick={handleMapClick}
            className="h-full w-full"
          />
        </div>
        {position && (
          <p className="flex items-center gap-1 text-xs text-zinc-500">
            <MapPin className="h-3 w-3" />
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting || !position}>
        {isSubmitting ? "Saving..." : "Add Location"}
      </Button>
    </form>
  )
}
