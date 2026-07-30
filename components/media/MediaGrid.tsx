"use client"

import { useState } from "react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Trash2, GripVertical, Film } from "lucide-react"

interface MediaItem {
  id: string
  url: string
  type: "photo" | "video"
  caption: string | null
  order: number
}

interface MediaGridProps {
  items: MediaItem[]
  onReorder: (items: MediaItem[]) => void
  onDelete: (mediaId: string) => void
}

export default function MediaGrid({ items, onReorder, onDelete }: MediaGridProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const reordered = Array.from(items)
    const [removed] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, removed)

    onReorder(reordered.map((item, i) => ({ ...item, order: i })))
  }

  const handleDelete = async (mediaId: string) => {
    setDeleting(mediaId)
    try {
      await fetch(`/api/locations/${items[0]?.id ?? ""}/media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      })
      onDelete(mediaId)
    } catch (err) {
      console.error("Delete error:", err)
    } finally {
      setDeleting(null)
    }
  }

  if (items.length === 0) return null

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="media" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-wrap gap-2"
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <div
                      {...provided.dragHandleProps}
                      className="absolute left-0 top-0 z-10 hidden cursor-grab p-1 group-hover:block"
                    >
                      <GripVertical className="h-4 w-4 text-zinc-500" />
                    </div>

                    {item.type === "photo" ? (
                      <img
                        src={item.url}
                        alt={item.caption ?? ""}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Film className="h-8 w-8 text-zinc-400" />
                      </div>
                    )}

                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 hidden h-6 w-6 group-hover:flex"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      type="button"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>

                    {item.type === "video" && (
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-xs text-white">
                        Video
                      </span>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
