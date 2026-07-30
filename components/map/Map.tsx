"use client"

import { useEffect, useRef, useState } from "react"
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
  onLabelClick?: (locationIndex: number) => void
  onDotClick?: (locationIndex: number) => void
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
  onLabelClick,
  onDotClick,
  className = "h-80 w-full rounded-md",
  locations,
  activeLocationIndex = -1,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const onMapClickRef = useRef(onMapClick)
  const onLabelClickRef = useRef(onLabelClick)
  const onDotClickRef = useRef(onDotClick)

  const polylineRefs = useRef<L.Polyline[]>([])
  const circleRefs = useRef<L.CircleMarker[]>([])
  const labelRefs = useRef<L.Marker[]>([])
  const locationsDataRef = useRef<string>("")

  const initialFitDone = useRef(false)
  const locationsRef = useRef(locations)
  locationsRef.current = locations

  useEffect(() => {
    onMapClickRef.current = onMapClick
    onLabelClickRef.current = onLabelClick
    onDotClickRef.current = onDotClick
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

  const [version, setVersion] = useState(0)

  useEffect(() => {
    const map = mapRef.current
    if (!map || !locations || locations.length === 0) return

    const dataKey = locations.map((l) => l.id).join(",")
    if (dataKey === locationsDataRef.current && version > 0) return
    locationsDataRef.current = dataKey

    polylineRefs.current.forEach((p) => p.remove())
    circleRefs.current.forEach((c) => c.remove())
    labelRefs.current.forEach((l) => l.remove())
    polylineRefs.current = []
    circleRefs.current = []
    labelRefs.current = []

    for (let i = 0; i < locations.length - 1; i++) {
      const from = locations[i]
      const to = locations[i + 1]
      const pl = L.polyline(
        [[from.latitude, from.longitude], [to.latitude, to.longitude]],
        { color: "#6b7280", weight: 4, opacity: 0.7, dashArray: "8, 8", lineCap: "round", lineJoin: "round" },
      ).addTo(map)
      polylineRefs.current.push(pl)
    }

    locations.forEach((loc, i) => {
      const cm = L.circleMarker([loc.latitude, loc.longitude], {
        radius: 6,
        color: "#fff",
        fillColor: "#6b7280",
        fillOpacity: 1,
        weight: 3,
      }).addTo(map)
      cm.on("click", () => onDotClickRef.current?.(i))
      circleRefs.current.push(cm)

      const icon = L.divIcon({
        className: "",
        html: `<span style="background:white;border:1px solid #000;border-radius:6px;padding:8px 14px;font-family:var(--font-serif);font-size:16px;font-weight:500;color:#000;white-space:nowrap;">${loc.name}</span>`,
        iconAnchor: [-18, 14],
      })
      const lm = L.marker([loc.latitude, loc.longitude], { icon }).addTo(map)
      lm.on("click", () => onLabelClickRef.current?.(i))
      labelRefs.current.push(lm)
    })

    setVersion((v) => v + 1)
  }, [locations])

  useEffect(() => {
    const map = mapRef.current
    const locs = locationsRef.current
    if (!map || !locs || locs.length === 0) return
    if (version === 0) return

    const isFullMap = activeLocationIndex === -1

    polylineRefs.current.forEach((pl, i) => {
      const visited = !isFullMap && i < activeLocationIndex
      pl.setStyle({
        color: visited ? "#000000" : "#6b7280",
        weight: visited ? 5 : 4,
        opacity: visited ? 1 : 0.7,
        dashArray: visited ? undefined : "8, 8",
      })
    })

    circleRefs.current.forEach((cm, i) => {
      const isActive = i === activeLocationIndex

      let fillColor: string
      let radius: number
      if (isFullMap) {
        fillColor = "#6b7280"; radius = 6
      } else if (isActive) {
        fillColor = "#000000"; radius = 10
      } else if (i < activeLocationIndex) {
        fillColor = "#000000"; radius = 8
      } else {
        fillColor = "#6b7280"; radius = 6
      }

      cm.setStyle({ fillColor, radius })
    })

    labelRefs.current.forEach((lm, i) => {
      const show = !isFullMap && i === activeLocationIndex
      if (show && !map.hasLayer(lm)) {
        lm.addTo(map)
      } else if (!show && map.hasLayer(lm)) {
        lm.remove()
      }
    })

    let bounds: L.LatLngBounds | null = null
    if (activeLocationIndex === -1) {
      bounds = L.latLngBounds(locs.map((l) => [l.latitude, l.longitude] as [number, number]))
    } else if (activeLocationIndex === 0) {
      map.flyTo([locs[0].latitude, locs[0].longitude], 12, { duration: 1.5 })
    } else {
      const from = activeLocationIndex - 1
      const to = activeLocationIndex
      const pts: [number, number][] = []
      for (let i = from; i <= to; i++) {
        pts.push([locs[i].latitude, locs[i].longitude])
      }
      bounds = L.latLngBounds(pts)
    }

    if (bounds) {
      if (!initialFitDone.current) {
        initialFitDone.current = true
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: false })
      } else {
        map.flyToBounds(bounds, { padding: [60, 60], duration: 1.5, maxZoom: 15 })
      }
    }
  }, [activeLocationIndex, version])

  return <div ref={containerRef} className={className} style={{ isolation: "isolate" }} />
}
