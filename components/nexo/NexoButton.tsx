import { Button } from "@/components/ui/button"

/**
 * NexoButton
 *   ↓
 * Button (shadcn)
 *
 * Ponto único de customização visual dos botões do app.
 */
export default function NexoButton(props: React.ComponentProps<typeof Button>) {
  return <Button {...props} />
}
