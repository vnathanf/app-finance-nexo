import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Informe um nome para o projeto'),
  type: z.enum(['Pessoal', 'Imóvel', 'Negócios', 'Viagem', 'Outro']),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const transactionSchema = z.object({
  title: z.string().min(1, 'Informe um título'),
  type: z.enum(['Receita', 'Despesa']),
  projectId: z.string().min(1, 'Selecione um projeto'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  amount: z.number().positive('O valor deve ser maior que zero'),
  date: z.string().min(1, 'Informe uma data'),
});

export const assetSchema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  category: z.enum(['Imóvel', 'Investimentos', 'Veículos', 'Outros', 'Contas']),
  value: z.number().nonnegative('O valor não pode ser negativo'),
  projectId: z.string().min(1, 'Selecione um projeto'),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
});
