import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface ColumnDefinition<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface Action<T> {
  label: string;
  icon: LucideIcon;
  handler: (data: T) => void;
  variant?: 'classic' | 'outline' | 'solid' | 'soft' | 'surface' | 'ghost';
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'pink' | 'gray';
  disabled?: (data: T) => boolean;
  hidden?: (data: T) => boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  searchableFields: (keyof T)[];
  rowActions?: Action<T>[];
  bulkActions?: Action<T[]>[];
  onRowSelect?: (selectedRows: T[]) => void;
  selectionMode?: 'single' | 'multiple' | 'none';
  searchPlaceholder?: string;
  emptyStateMessage?: string;
  loading?: boolean;
  keyField?: keyof T;
}

export interface DataTableState<T> {
  searchTerm: string;
  selectedRows: T[];
  filteredData: T[];
}