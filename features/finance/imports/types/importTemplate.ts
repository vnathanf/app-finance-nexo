import type { ColumnMapping } from '@/features/finance/imports/utils/csv';

export interface ImportTemplate {
  id: string;
  projectId: string;
  name: string;
  headerRowIndex: number;
  columnMapping: ColumnMapping;
}
