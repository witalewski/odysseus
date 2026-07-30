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
  const prevActiveRef = useRef(activeLocationIndex)
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
      keyboard: false,
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
        html: `<span style="background:white;border:1px solid #000;border-radius:6px;padding:8px 14px;font-family:var(--font-serif);font-size:16px;font-weight:600;color:#000;white-space:nowrap;">${loc.name}</span>`,
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

    const targetIndex = activeLocationIndex
    const prevIndex = prevActiveRef.current
    prevActiveRef.current = targetIndex
    const isFullMap = targetIndex === -1

    const updateDotsAndLabels = () => {
      circleRefs.current.forEach((cm, i) => {
        const isActive = i === targetIndex
        let fillColor: string
        let radius: number
        if (isFullMap) {
          fillColor = "#6b7280"; radius = 6
        } else if (isActive) {
          fillColor = "#000000"; radius = 10
        } else if (i < targetIndex) {
          fillColor = "#000000"; radius = 8
        } else {
          fillColor = "#6b7280"; radius = 6
        }
        cm.setStyle({ fillColor, radius, fillOpacity: 1, opacity: 1 })
      })

      labelRefs.current.forEach((lm, i) => {
        const show = !isFullMap && i === targetIndex
        if (show && !map.hasLayer(lm)) {
          lm.addTo(map)
        } else if (!show && map.hasLayer(lm)) {
          lm.remove()
        }
      })
    }

    const applyStyles = () => {
      polylineRefs.current.forEach((pl, i) => {
        const visited = !isFullMap && i < targetIndex
        pl.setStyle({
          color: visited ? "#000000" : "#6b7280",
          weight: visited ? 5 : 4,
          opacity: visited ? 1 : 0.7,
          dashArray: visited ? undefined : "8, 8",
        })
      })
      updateDotsAndLabels()
    }

    const computeBounds = () => {
      if (isFullMap) {
        return L.latLngBounds(locs.map((l) => [l.latitude, l.longitude] as [number, number]))
      }
      if (targetIndex === 0) return null

      const pts: [number, number][] = []
      for (let i = targetIndex - 1; i <= targetIndex; i++) {
        pts.push([locs[i].latitude, locs[i].longitude])
      }
      return L.latLngBounds(pts)
    }

    const fly = () => {
      if (locs.length === 1) {
        map.flyTo([locs[0].latitude, locs[0].longitude], 12, { duration: 1.5 })
        return
      }
      if (targetIndex === 0) {
        map.flyTo([locs[0].latitude, locs[0].longitude], 12, { duration: 1.5 })
        return
      }
      const bounds = computeBounds()
      if (bounds) map.flyToBounds(bounds, { padding: [60, 60], duration: 1.5, maxZoom: 15 })
    }

    const jump = () => {
      if (locs.length === 1) {
        map.setView([locs[0].latitude, locs[0].longitude], 12)
        return
      }
      if (targetIndex === 0) {
        map.setView([locs[0].latitude, locs[0].longitude], 12)
        return
      }
      const bounds = computeBounds()
      if (bounds) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: false })
    }

    if (!initialFitDone.current) {
      initialFitDone.current = true
      applyStyles()
      jump()
      return
    }

    if (!isFullMap) {
      labelRefs.current.forEach((lm, i) => {
        if (i === targetIndex && !map.hasLayer(lm)) {
          lm.addTo(map)
        }
      })
    }
    polylineRefs.current.forEach((pl) => pl.setStyle({ opacity: 0 }))
    circleRefs.current.forEach((cm) => cm.setStyle({ fillOpacity: 0, opacity: 0 }))

    map.once("moveend", () => {
      updateDotsAndLabels()

      const shouldAnimate = locs.length > 1 && targetIndex > 0 && prevIndex >= 0
      if (!shouldAnimate) {
        applyStyles()
        return
      }

      const goingForward = targetIndex > prevIndex
      const segIndex = goingForward ? targetIndex - 1 : targetIndex

      polylineRefs.current.forEach((pl, i) => {
        const before = i < segIndex
        const after = i > segIndex
        if (goingForward && before) {
          pl.setStyle({ color: "#000000", weight: 5, opacity: 1, dashArray: undefined })
        } else if (!goingForward && after) {
          pl.setStyle({ color: "#6b7280", weight: 4, opacity: 0.7, dashArray: "8, 8" })
        } else {
          pl.setStyle({ opacity: 0 })
        }
      })

      const animPl = polylineRefs.current[segIndex]
      if (!animPl) { applyStyles(); return }

      const fromLatLng: [number, number] = goingForward
        ? [locs[segIndex].latitude, locs[segIndex].longitude]
        : [locs[segIndex + 1].latitude, locs[segIndex + 1].longitude]
      const toLatLng: [number, number] = goingForward
        ? [locs[segIndex + 1].latitude, locs[segIndex + 1].longitude]
        : [locs[segIndex].latitude, locs[segIndex].longitude]

      const p1 = map.latLngToLayerPoint(fromLatLng)
      const p2 = map.latLngToLayerPoint(toLatLng)
      const lineLen = Math.max(p1.distanceTo(p2), 1)

      if (goingForward) {
        animPl.setStyle({
          color: "#000000", weight: 5, opacity: 1,
          dashArray: `${lineLen}`, dashOffset: `${lineLen}`,
        })
      } else {
        animPl.setStyle({
          color: "#6b7280", weight: 4, opacity: 0.7,
          dashArray: `${lineLen}`, dashOffset: `${lineLen}`,
        })
      }

      const duration = 400
      const startTime = performance.now()
      ;(function frame(time: number) {
        const t = Math.min((time - startTime) / duration, 1)
        animPl.setStyle({ dashOffset: `${lineLen * (1 - t)}` })

        if (t < 1) {
          requestAnimationFrame(frame)
        } else {
          animPl.setStyle({
            dashArray: goingForward ? undefined : "8, 8",
            dashOffset: undefined,
          })

          polylineRefs.current.forEach((pl, i) => {
            if (goingForward && i > segIndex) {
              pl.setStyle({ color: "#6b7280", weight: 4, opacity: 0.7, dashArray: "8, 8" })
            } else if (!goingForward && i < segIndex) {
              pl.setStyle({ color: "#000000", weight: 5, opacity: 1, dashArray: undefined })
            }
          })
        }
      })(performance.now())
    })

    fly()
  }, [activeLocationIndex, version])

  return <div ref={containerRef} className={className} style={{ isolation: "isolate" }} />
}
