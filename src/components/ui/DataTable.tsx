import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from './Button';

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
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (updater: any) => void;
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
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
    state: {
      rowSelection,
    },
    enableRowSelection,
    onRowSelectionChange,
  });

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages  = Math.ceil(total / limit);
  const isInitialLoad = isLoading && data.length === 0;
  const isRefetching = isLoading && data.length > 0;

  return (
    <div className="w-full">
      <div className="relative overflow-x-auto rounded-lg border border-accent-300 bg-surface shadow-sm">
        {isRefetching && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/75 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-accent-200 shadow-sm">
              <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
              <span className="text-xs font-medium text-accent-600">Mise à jour…</span>
            </div>
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-accent-200 bg-accent-50">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-accent-500 uppercase tracking-wide whitespace-nowrap"
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
                  colSpan={columns.length}
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
            Page <span className="text-accent-800">{currentPage}</span> sur <span className="text-accent-800">{totalPages || 1}</span>
            <span className="mx-2 text-accent-300">|</span>
            <span className="text-accent-600">{total} résultat{total > 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              iconOnly
              onClick={() => onPageChange(Math.max(0, offset - limit))}
              disabled={offset === 0 || isLoading}
              title="Page précédente"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconOnly
              onClick={() => onPageChange(offset + limit)}
              disabled={offset + limit >= total || isLoading}
              title="Page suivante"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
