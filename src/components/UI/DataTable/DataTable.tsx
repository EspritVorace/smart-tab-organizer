import React, { useState, useMemo, useEffect } from 'react';
import { 
  Table, 
  TextField, 
  Box, 
  Flex, 
  Button, 
  Text, 
  Checkbox,
  Badge,
  Separator 
} from '@radix-ui/themes';
import { Search, AlertCircle } from 'lucide-react';
import { DataTableProps, DataTableState } from './types';
import { getMessage } from '../../../utils/i18n';

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchableFields,
  rowActions = [],
  bulkActions = [],
  onRowSelect,
  selectionMode = 'none',
  searchPlaceholder,
  emptyStateMessage,
  loading = false,
  keyField = 'id' as keyof T,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  // Nettoyer la sélection quand les données changent (après suppression par exemple)
  useEffect(() => {
    const dataKeys = new Set(data.map(row => row[keyField]));
    const validSelectedRows = selectedRows.filter(row => dataKeys.has(row[keyField]));
    if (validSelectedRows.length !== selectedRows.length) {
      setSelectedRows(validSelectedRows);
    }
  }, [data, keyField, selectedRows]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row =>
      searchableFields.some(field => {
        const value = row[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, searchableFields]);

  const handleRowSelect = (row: T, checked: boolean) => {
    let newSelectedRows: T[];
    
    if (selectionMode === 'single') {
      newSelectedRows = checked ? [row] : [];
    } else {
      newSelectedRows = checked
        ? [...selectedRows, row]
        : selectedRows.filter(selectedRow => selectedRow[keyField] !== row[keyField]);
    }
    
    setSelectedRows(newSelectedRows);
    onRowSelect?.(newSelectedRows);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelectedRows = checked ? [...filteredData] : [];
    setSelectedRows(newSelectedRows);
    onRowSelect?.(newSelectedRows);
  };

  const isRowSelected = (row: T) => 
    selectedRows.some(selectedRow => selectedRow[keyField] === row[keyField]);

  const isAllSelected = filteredData.length > 0 && selectedRows.length === filteredData.length;
  const isIndeterminate = selectedRows.length > 0 && selectedRows.length < filteredData.length;

  const getVisibleRowActions = (row: T) => 
    rowActions.filter(action => !action.hidden?.(row));

  const getEnabledBulkActions = () => 
    bulkActions.filter(action => !action.disabled?.(selectedRows));

  if (loading) {
    return (
      <Box p="4">
        <Text>{getMessage('dataTableLoading')}</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search Bar */}
      <Box mb="4">
        <TextField.Root
          placeholder={searchPlaceholder || getMessage('dataTableSearch')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
        </TextField.Root>
      </Box>

      {/* Bulk Actions Bar */}
      {selectionMode === 'multiple' && selectedRows.length > 0 && (
        <Box mb="4">
          <Flex align="center" gap="2" p="2" style={{ backgroundColor: 'var(--accent-3)' }}>
            <Text size="2" weight="medium">
              {selectedRows.length === 1 
                ? getMessage('dataTableSelectedCountSingular')
                : getMessage('dataTableSelectedCountPlural').replace('{count}', selectedRows.length.toString())
              }
            </Text>
            <Separator orientation="vertical" />
            <Flex gap="2" align="center">
              {getEnabledBulkActions().map((action, index) => (
                <Button
                  key={index}
                  size="1"
                  variant={action.variant || 'secondary'}
                  color={action.color}
                  onClick={() => action.handler(selectedRows)}
                >
                  <action.icon size={14} />
                  {action.label}
                </Button>
              ))}
            </Flex>
          </Flex>
        </Box>
      )}

      {/* Table */}
      {filteredData.length === 0 ? (
        <Box p="8" style={{ textAlign: 'center' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--gray-8)' }} />
          <Text color="gray">{emptyStateMessage || getMessage('dataTableEmptyState')}</Text>
        </Box>
      ) : (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              {selectionMode !== 'none' && (
                <Table.ColumnHeaderCell width="40px">
                  {selectionMode === 'multiple' && (
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      {...(isIndeterminate && { 'data-indeterminate': true })}
                    />
                  )}
                </Table.ColumnHeaderCell>
              )}
              {columns.map((column) => (
                <Table.ColumnHeaderCell 
                  key={String(column.key)}
                  width={column.width}
                  align={column.align}
                >
                  {column.label}
                </Table.ColumnHeaderCell>
              ))}
              {rowActions.length > 0 && (
                <Table.ColumnHeaderCell width="120px">
                  {getMessage('dataTableActions')}
                </Table.ColumnHeaderCell>
              )}
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {filteredData.map((row, rowIndex) => (
              <Table.Row key={String(row[keyField]) || rowIndex}>
                {selectionMode !== 'none' && (
                  <Table.Cell>
                    <Checkbox
                      checked={isRowSelected(row)}
                      onCheckedChange={(checked) => handleRowSelect(row, checked as boolean)}
                    />
                  </Table.Cell>
                )}
                {columns.map((column) => (
                  <Table.Cell key={String(column.key)} align={column.align}>
                    {column.render 
                      ? column.render(row[column.key], row)
                      : String(row[column.key] || '')
                    }
                  </Table.Cell>
                ))}
                {rowActions.length > 0 && (
                  <Table.Cell>
                    <Flex gap="1" align="center">
                      {getVisibleRowActions(row).map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          size="1"
                          variant={action.variant || 'ghost'}
                          color={action.color}
                          onClick={() => action.handler(row)}
                          disabled={action.disabled?.(row)}
                        >
                          <action.icon size={14} />
                        </Button>
                      ))}
                    </Flex>
                  </Table.Cell>
                )}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  );
}