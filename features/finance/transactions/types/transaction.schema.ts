import { z } from 'zod';

export const transactionSchema = z.object({
  title: z.string().min(1, 'Informe um título'),
  type: z.enum(['Receita', 'Despesa']),
  projectId: z.string().min(1, 'Selecione um projeto'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  amount: z.number().positive('O valor deve ser maior que zero'),
  date: z.string().min(1, 'Informe uma data'),
});
