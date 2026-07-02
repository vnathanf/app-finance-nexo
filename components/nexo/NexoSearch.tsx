"use client"

import { Search as SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

interface NexoSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function NexoSearch({ value, onChange, placeholder }: NexoSearchProps) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Buscar..."}
        className="pl-9"
      />
    </div>
  )
}
