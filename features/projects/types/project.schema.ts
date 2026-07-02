import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Informe um nome para o projeto'),
  type: z.enum(['Pessoal', 'Imóvel', 'Negócios', 'Viagem', 'Outro']),
  imageUrl: z.string().url().optional().or(z.literal('')),
});
