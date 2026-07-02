export type AssetCategory = 'Imóvel' | 'Investimentos' | 'Veículos' | 'Outros' | 'Contas';

export interface AssetDocument {
  name: string;
  size: string;
  url?: string;
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
