import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * NexoButton
 *   ↓
 * Button (shadcn)
 *
 * Ponto único de customização visual dos botões do app.
 */
export default function NexoButton({
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  )
}
