import { z } from 'zod';

export const assetSchema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  category: z.enum(['Imóvel', 'Investimentos', 'Veículos', 'Outros', 'Contas']),
  value: z.number().nonnegative('O valor não pode ser negativo'),
  projectId: z.string().min(1, 'Selecione um projeto'),
});
