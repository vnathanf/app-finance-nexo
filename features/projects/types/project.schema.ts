import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Informe um nome para o projeto'),
  type: z.enum(['Pessoal', 'Negócios', 'Planejamento']),
  imageUrl: z.string().url().optional().or(z.literal('')),
});
