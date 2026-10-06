import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
  type OnChangeFn,
} from '@tanstack/react-table';
import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { ConfirmModal } from './ConfirmModal';
import { METTRE_CORBEILLE, type TrashType } from '@/graphql/trash';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  total?: number;
  limit?: number;
  offset?: number;
  onPageChange?: (offset: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  trashType?: TrashType;
  canSelectRow?: (row: T) => boolean;
}

export function DataTable<T>({
  data,
  columns,
  total = 0,
  limit = 20,
  offset = 0,
  onPageChange,
  isLoading = false,
  emptyMessage = 'Aucun élément trouvé.',
  enableRowSelection = false,
  rowSelection = {},
  onRowSelectionChange,
  trashType,
  canSelectRow,
}: DataTableProps<T>) {
  const [internalSelection, setInternalSelection] = useState<RowSelectionState>({});
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [putInTrash, { loading: deleting }] = useMutation(METTRE_CORBEILLE);
  const selection = onRowSelectionChange ? rowSelection : internalSelection;
  const changeSelection = onRowSelectionChange ?? setInternalSelection;
  const generatedSelection = Boolean(trashType && !enableRowSelection);
  const table = useReactTable({
    data,
    columns,
    getRowId: (row, index) => (row as { id?: string }).id ?? String(index),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
    state: {
      rowSelection: selection,
    },
    enableRowSelection: (row) => (enableRowSelection || Boolean(trashType)) && (canSelectRow?.(row.original) ?? true),
    onRowSelectionChange: changeSelection,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => (row.original as { id?: string }).id).filter((id): id is string => Boolean(id));
  const moveSelectedToTrash = async () => {
    if (!trashType || selectedIds.length === 0) return;
    try {
      await putInTrash({ variables: { type: trashType, ids: selectedIds }, refetchQueries: 'active', awaitRefetchQueries: true });
      changeSelection({});
      setConfirmTrash(false);
      toast.success(`${selectedIds.length} élément(s) placé(s) dans la corbeille`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'La mise à la corbeille a échoué');
    }
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages  = Math.ceil(total / limit);
  const isInitialLoad = isLoading && data.length === 0;
  const isRefetching = isLoading && data.length > 0;

  return (
    <div className="w-full">
      {trashType && selectedIds.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3">
          <span className="text-xs font-semibold text-accent-700">{selectedIds.length} élément(s) sélectionné(s) sur cette page</span>
          <Button type="button" variant="danger" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => setConfirmTrash(true)}>
            Mettre à la corbeille
          </Button>
        </div>
      )}
      <div className="relative overflow-x-auto rounded-lg border border-accent-200 bg-surface">
        {isRefetching && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/75 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-accent-200 shadow-sm">
              <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
              <span className="text-xs font-medium text-accent-600">Mise à jour…</span>
            </div>
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-accent-200 bg-accent-50">
                {generatedSelection && <th className="px-4 py-2.5"><input type="checkbox" aria-label="Sélectionner toutes les lignes visibles" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} /></th>}
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-accent-600 uppercase tracking-wide whitespace-nowrap"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isInitialLoad ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-accent-100 last:border-0">
                  {generatedSelection && <td className="px-4 py-3" />}
                  {columns.map((col, j) => (
                    <td key={col.id ?? j} className="px-4 py-3">
                      <div className="h-3.5 bg-accent-100 rounded animate-pulse" style={{ width: `${55 + (j * 11) % 35}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (generatedSelection ? 1 : 0)}
                  className="px-4 py-10 text-center text-xs text-accent-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-accent-100 last:border-0 hover:bg-accent-50 transition-colors"
                >
                  {generatedSelection && <td className="px-4 py-2.5"><input type="checkbox" aria-label="Sélectionner cette ligne" checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} /></td>}
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5 text-accent-800 text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 0 && onPageChange && (
        <div className="flex items-center justify-between mt-4 px-1">
          <div className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">
            Page <span className="text-accent-900">{currentPage}</span> sur <span className="text-accent-900">{totalPages || 1}</span>
            <span className="mx-2 text-accent-200">|</span>
            <span className="text-accent-600">{total} résultat{total > 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              iconOnly
              onClick={() => { changeSelection({}); onPageChange(Math.max(0, offset - limit)); }}
              disabled={offset === 0 || isLoading}
              title="Page précédente"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconOnly
              onClick={() => { changeSelection({}); onPageChange(offset + limit); }}
              disabled={offset + limit >= total || isLoading}
              title="Page suivante"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
      <ConfirmModal isOpen={confirmTrash} title="Mettre à la corbeille" message={`Placer ${selectedIds.length} élément(s) dans la corbeille ? Ils pourront être restaurés.`} confirmLabel={deleting ? 'En cours…' : 'Mettre à la corbeille'} isProcessing={deleting} onConfirm={() => { if (!deleting) void moveSelectedToTrash(); }} onCancel={() => setConfirmTrash(false)} />
    </div>
  );
}
