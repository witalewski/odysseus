"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import MapWrapper from "@/components/map/MapWrapper"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface Location {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  media: Array<{
    id: string
    url: string
    type: "photo" | "video"
    caption: string | null
  }>
}

interface SlideshowPlayerProps {
  locations: Location[]
  journeyTitle: string
  onClose: () => void
}

interface Slide {
  type: "full-map" | "location-map" | "location-media"
  locationIndex: number
  mediaIndex: number
}

function buildSlides(locations: Location[]): Slide[] {
  const slides: Slide[] = []
  slides.push({ type: "full-map", locationIndex: -1, mediaIndex: -1 })
  for (let i = 0; i < locations.length; i++) {
    slides.push({ type: "location-map", locationIndex: i, mediaIndex: -1 })
    for (let j = 0; j < locations[i].media.length; j++) {
      slides.push({ type: "location-media", locationIndex: i, mediaIndex: j })
    }
  }
  slides.push({ type: "full-map", locationIndex: -1, mediaIndex: -1 })
  return slides
}

export default function SlideshowPlayer({ locations, journeyTitle, onClose }: SlideshowPlayerProps) {
  const slides = useMemo(() => buildSlides(locations), [locations])
  const [slideIndex, setSlideIndex] = useState(0)
  const slideIndexRef = useRef(slideIndex)
  slideIndexRef.current = slideIndex
  const slidesRef = useRef(slides)
  slidesRef.current = slides

  const currentSlide = slides[slideIndex]
  const currentLocation = currentSlide && currentSlide.locationIndex >= 0
    ? locations[currentSlide.locationIndex]
    : null

  const advance = useCallback(() => {
    setSlideIndex((i) => Math.min(i + 1, slides.length - 1))
  }, [slides.length])

  const goBack = useCallback(() => {
    setSlideIndex((i) => Math.max(i - 1, 0))
  }, [])

  const handleLabelClick = useCallback((locationIndex: number) => {
    const allSlides = slidesRef.current
    const mediaSlideIdx = allSlides.findIndex(
      (s) => s.type === "location-media" && s.locationIndex === locationIndex && s.mediaIndex === 0,
    )
    if (mediaSlideIdx >= 0) {
      setSlideIndex(mediaSlideIdx)
      return
    }
    const mapSlideIdx = allSlides.findIndex(
      (s) => s.type === "location-map" && s.locationIndex === locationIndex,
    )
    if (mapSlideIdx >= 0) {
      setSlideIndex(mapSlideIdx)
    }
  }, [])

  const handleDotClick = useCallback((locationIndex: number) => {
    const allSlides = slidesRef.current
    const mapSlideIdx = allSlides.findIndex(
      (s) => s.type === "location-map" && s.locationIndex === locationIndex,
    )
    if (mapSlideIdx >= 0) {
      setSlideIndex(mapSlideIdx)
    }
  }, [])

  const handleCloseOrBack = useCallback(() => {
    const idx = slideIndexRef.current
    const allSlides = slidesRef.current
    const slide = allSlides[idx]
    if (!slide) { onClose(); return }
    if (slide.type === "location-media") {
      const mapSlideIdx = allSlides.findIndex(
        (s) => s.type === "location-map" && s.locationIndex === slide.locationIndex,
      )
      if (mapSlideIdx >= 0) {
        setSlideIndex(mapSlideIdx)
        return
      }
    }
    onClose()
  }, [onClose])

  const advanceRef = useRef(advance)
  advanceRef.current = advance
  const goBackRef = useRef(goBack)
  goBackRef.current = goBack
  const closeRef = useRef(handleCloseOrBack)
  closeRef.current = handleCloseOrBack

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); advanceRef.current() }
      if (e.key === "ArrowLeft") { e.preventDefault(); goBackRef.current() }
      if (e.key === "Escape") { e.preventDefault(); closeRef.current() }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  if (locations.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <p className="text-white">No locations to display</p>
        <Button
          variant="ghost"
          className="absolute top-4 right-4 text-white"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  const totalSlides = slides.length
  const currentSlideNum = slideIndex + 1
  const isMapSlide = currentSlide.type === "full-map" || currentSlide.type === "location-map"
  const isVirtualStart = slideIndex === 0
  const isVirtualEnd = slideIndex === slides.length - 1

  const mapLocations = locations.map((loc) => ({
    id: loc.id,
    latitude: loc.latitude,
    longitude: loc.longitude,
    name: loc.name,
  }))
  const mapActiveIndex = currentSlide.type === "full-map" ? -1 : currentSlide.locationIndex

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <Button
        variant="ghost"
        size="icon"
        className={`absolute top-4 right-4 z-20 focus-visible:ring-0 ${isMapSlide ? "text-black" : "text-white"}`}
        onClick={handleCloseOrBack}
      >
        <X className="h-6 w-6" />
      </Button>

      <div
        className={`absolute inset-0 flex flex-col bg-white transition-opacity duration-500 ${!isMapSlide ? "pointer-events-none opacity-0" : ""}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-center px-6">
          <h1 className="font-[family-name:var(--font-serif)] text-2xl font-semibold tracking-tight text-black">
            {journeyTitle}
          </h1>
        </div>
        <div className="flex-1 px-3 pb-3">
          <MapWrapper
            locations={mapLocations}
            activeLocationIndex={mapActiveIndex}
            onMapClick={advance}
            onMapRightClick={goBack}
            onLabelClick={handleLabelClick}
            onDotClick={handleDotClick}
            className="h-full w-full rounded-lg border border-black"
          />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <div
          className={`flex items-center gap-4 rounded-full px-4 py-2 ${isMapSlide ? "border border-black bg-white" : "bg-white/10 backdrop-blur"}`}
        >
          <Button variant="ghost" size="icon" className={`focus-visible:ring-0 ${isMapSlide ? "text-black" : "text-white"}`} onClick={goBack}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <span
            className={`min-w-[120px] text-center text-base font-[family-name:var(--font-serif)] ${isMapSlide ? "text-black" : "text-white"}`}
          >
            {currentSlideNum} / {totalSlides}
          </span>
          <Button variant="ghost" size="icon" className={`focus-visible:ring-0 ${isMapSlide ? "text-black" : "text-white"}`} onClick={advance}>
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {currentSlide.type === "location-media" && currentLocation && (
        <div className="absolute inset-0" onClick={advance} onContextMenu={(e) => { e.preventDefault(); goBack() }}>
          {currentLocation.media[currentSlide.mediaIndex]?.type === "photo" ? (
            <>
              <img
                src={currentLocation.media[currentSlide.mediaIndex].url}
                alt=""
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
              />
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <img
                  src={currentLocation.media[currentSlide.mediaIndex].url}
                  alt={currentLocation.media[currentSlide.mediaIndex].caption ?? ""}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center p-4">
              <video
                src={currentLocation.media[currentSlide.mediaIndex].url}
                controls
                autoPlay
                className="max-h-full max-w-full"
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {currentLocation.media[currentSlide.mediaIndex]?.caption && (
            <div className="absolute bottom-4 left-4 z-20 rounded-lg bg-black/60 px-4 py-2 backdrop-blur">
              <p className="text-sm text-white">
                {currentLocation.media[currentSlide.mediaIndex].caption}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
