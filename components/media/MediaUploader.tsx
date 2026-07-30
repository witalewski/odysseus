"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Upload } from "lucide-react"

interface MediaUploaderProps {
  locationId: string
  onUploadComplete: () => void
}

export default function MediaUploader({ locationId, onUploadComplete }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append("file", file)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (!uploadRes.ok) throw new Error("Upload failed")
        const blob = await uploadRes.json()

        const type = file.type.startsWith("video") ? "video" : "photo"

        const mediaRes = await fetch(`/api/locations/${locationId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: blob.url, type }),
        })
        if (!mediaRes.ok) throw new Error("Failed to save media")

        onUploadComplete()
      } catch (err) {
        console.error("Upload error:", err)
      } finally {
        setUploading(false)
      }
    },
    [locationId, onUploadComplete],
  )

  return (
    <label className="cursor-pointer">
      <Button
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => document.getElementById(`file-${locationId}`)?.click()}
        type="button"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? "Uploading..." : "Add Photo/Video"}
      </Button>
      <input
        id={`file-${locationId}`}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleUpload}
      />
    </label>
  )
}
