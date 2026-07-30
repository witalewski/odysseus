import dynamic from "next/dynamic"

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 w-full items-center justify-center rounded-md bg-zinc-100 text-sm text-zinc-500">
      Loading map...
    </div>
  ),
})

export default Map
