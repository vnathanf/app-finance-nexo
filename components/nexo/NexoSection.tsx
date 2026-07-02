interface NexoSectionProps {
  title?: string
  children: React.ReactNode
}

export default function NexoSection({ title, children }: NexoSectionProps) {
  return (
    <section className="mb-6">
      {title && <h2 className="mb-2 text-lg font-medium">{title}</h2>}
      {children}
    </section>
  )
}
