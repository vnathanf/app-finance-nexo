export type AssetCategory = 'Imóvel' | 'Investimentos' | 'Veículos' | 'Outros' | 'Contas';

export interface AssetDocument {
  name: string;
  size: string;
  /** URL pública direta — documentos enviados antes da migração pro bucket privado (0009). */
  url?: string;
  /** Path no bucket privado `documents` — gera uma signed URL sob demanda pra baixar (docs novos). */
  path?: string;
}

export interface AssetCustomField {
  label: string;
  value: string;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  subCategory: string;
  value: number;
  description: string;
  city?: string;
  customFields: AssetCustomField[];
  documents: AssetDocument[];
  imageUrl?: string;
  projectId: string;
}
