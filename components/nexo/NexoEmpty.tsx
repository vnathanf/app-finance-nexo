interface NexoEmptyProps {
  title?: string
  description?: string
}

export default function NexoEmpty({ title = "Nada por aqui ainda", description }: NexoEmptyProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center py-10 text-center">
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
