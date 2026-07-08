import { ArrowLeft } from "lucide-react"
import PageContainer from "@/components/layout/PageContainer"

interface NexoPageProps {
  title?: string
  onBack?: () => void
  children?: React.ReactNode
}

export default function NexoPage({ title, onBack, children }: NexoPageProps) {
  return (
    <PageContainer>
      {(title || onBack) && (
        <div className="mb-4 flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Voltar"
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          {title && <h1 className="text-2xl font-semibold">{title}</h1>}
        </div>
      )}
      {children}
    </PageContainer>
  )
}
