"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MapLocation {
  id: string
  latitude: number
  longitude: number
  name: string
}

interface MapProps {
  center?: [number, number]
  zoom?: number
  markers?: Array<MapLocation>
  flyTo?: [number, number] | null
  onMapClick?: (lat: number, lng: number) => void
  className?: string
  locations?: MapLocation[]
  activeLocationIndex?: number
}

const defaultIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function Map({
  center = [20, 0],
  zoom = 2,
  markers = [],
  flyTo,
  onMapClick,
  className = "h-80 w-full rounded-md",
  locations,
  activeLocationIndex = -1,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const onMapClickRef = useRef(onMapClick)
  const overlaysRef = useRef<L.Layer[]>([])

  useEffect(() => {
    onMapClickRef.current = onMapClick
  })

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>",
    }).addTo(map)

    map.on("click", (e: L.LeafletMouseEvent) => {
      onMapClickRef.current?.(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map

    if (locations && locations.length > 0) {
      map.whenReady(() => {
        const pts = locations.map((l) => [l.latitude, l.longitude] as [number, number])
        map.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 15, animate: false })
      })
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    if (locations && locations.length > 0) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    markers.forEach((marker) => {
      const m = L.marker([marker.latitude, marker.longitude], { icon: defaultIcon })
        .addTo(mapRef.current!)
        .bindPopup(marker.name)
      markersRef.current.push(m)
    })
  }, [markers, locations])

  useEffect(() => {
    if (!mapRef.current || !flyTo) return
    if (locations && locations.length > 0) return
    mapRef.current.flyTo(flyTo, mapRef.current.getZoom(), {
      duration: 1.5,
    })
  }, [flyTo, locations])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !locations || locations.length === 0) return

    overlaysRef.current.forEach((l) => l.remove())
    overlaysRef.current = []

    const isFullMap = activeLocationIndex === -1

    for (let i = 0; i < locations.length - 1; i++) {
      const from = locations[i]
      const to = locations[i + 1]

      const visited = !isFullMap && i < activeLocationIndex

      const pl = L.polyline(
        [[from.latitude, from.longitude], [to.latitude, to.longitude]],
        {
          color: visited ? "#3b82f6" : "#cbd5e1",
          weight: visited ? 5 : 4,
          opacity: visited ? 1 : 0.7,
          dashArray: visited ? undefined : "8, 8",
          lineCap: "round",
          lineJoin: "round",
        },
      ).addTo(map)
      overlaysRef.current.push(pl)
    }

    locations.forEach((loc, i) => {
      const isActive = i === activeLocationIndex

      let dotColor: string
      let dotR: number
      if (isFullMap) {
        dotColor = "#cbd5e1"; dotR = 6
      } else if (isActive) {
        dotColor = "#2563eb"; dotR = 10
      } else if (i < activeLocationIndex) {
        dotColor = "#3b82f6"; dotR = 8
      } else {
        dotColor = "#cbd5e1"; dotR = 6
      }

      const cm = L.circleMarker([loc.latitude, loc.longitude], {
        radius: dotR,
        color: "#fff",
        fillColor: dotColor,
        fillOpacity: 1,
        weight: 3,
      }).addTo(map)
      overlaysRef.current.push(cm)

      const labelIcon = L.divIcon({
        className: "",
        html: `<span style="background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);padding:3px 8px;border-radius:4px;border:1px solid rgba(255,255,255,0.15);font-size:14px;font-weight:600;color:white;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;white-space:nowrap;">${loc.name}</span>`,
        iconAnchor: [0, -(dotR + 4)],
      })
      const lm = L.marker([loc.latitude, loc.longitude], { icon: labelIcon }).addTo(map)
      overlaysRef.current.push(lm)
    })
  }, [locations, activeLocationIndex])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !locations || locations.length === 0) return

    if (locations.length === 1) {
      map.flyTo([locations[0].latitude, locations[0].longitude], 12, { duration: 1.5 })
      return
    }

    let bounds: L.LatLngBounds
    if (activeLocationIndex === -1) {
      bounds = L.latLngBounds(locations.map((l) => [l.latitude, l.longitude] as [number, number]))
    } else {
      const from = activeLocationIndex === 0 ? 0 : activeLocationIndex - 1
      const to = activeLocationIndex === 0
        ? Math.min(1, locations.length - 1)
        : activeLocationIndex
      const pts: [number, number][] = []
      for (let i = from; i <= to; i++) {
        pts.push([locations[i].latitude, locations[i].longitude])
      }
      bounds = L.latLngBounds(pts)
    }

    map.flyToBounds(bounds, { padding: [60, 60], duration: 1.5, maxZoom: 15 })
  }, [activeLocationIndex, locations])

  return <div ref={containerRef} className={className} style={{ isolation: "isolate" }} />
}
