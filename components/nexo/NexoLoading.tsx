import { Skeleton } from "@/components/ui/skeleton"

export default function NexoLoading() {
  return (
    <div className="flex w-full flex-col gap-3 py-6">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  )
}
