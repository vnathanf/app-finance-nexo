import PageContainer from "@/components/layout/PageContainer"

interface NexoPageProps {
  title?: string
  children?: React.ReactNode
}

export default function NexoPage({ title, children }: NexoPageProps) {
  return (
    <PageContainer>
      {title && <h1 className="mb-4 text-2xl font-semibold">{title}</h1>}
      {children}
    </PageContainer>
  )
}
