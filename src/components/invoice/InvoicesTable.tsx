
import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  getSortedRowModel,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mission, missionStatusLabels, missionStatusColors } from '@/types/supabase';
import { ArrowUpDown, Eye, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMissionNumber } from '@/utils/missionUtils';
import GenerateInvoiceButton from './GenerateInvoiceButton';

interface InvoicesTableProps {
  missions: Mission[];
  clientsData?: Record<string, any>;
  isLoading?: boolean;
  userRole: 'admin' | 'client';
  onMissionStatusUpdate?: () => void;
}

interface PaymentStatusProps {
  status: string;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({ status }) => {
  return (
    <div className="flex items-center">
      <span className="mr-2">{status}</span>
    </div>
  );
};

const InvoicesTable: React.FC<InvoicesTableProps> = ({
  missions,
  clientsData = {},
  isLoading = false,
  userRole,
  onMissionStatusUpdate
}) => {
  const [sorting, setSorting] = React.useState([]);

  const table = useReactTable({
    data: missions,
    columns: [
      {
        accessorKey: 'mission_number',
        header: ({ column }: any) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Numéro
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }: any) => {
          const mission = row.original;
          return (
            <div>
              {formatMissionNumber(mission)}
            </div>
          );
        },
      },
      {
        accessorKey: 'completion_date',
        header: ({ column }: any) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }: any) => {
          const mission = row.original;
          const completionDate = mission.D2_LIV || mission.completion_date || mission.created_at;
          // Format the date - using a simple date formatter since formatDate is missing
          return new Date(completionDate).toLocaleDateString('fr-FR');
        },
      },
      {
        accessorKey: 'pickup_address',
        header: () => <div className="text-left">Départ</div>,
        cell: ({ row }: any) => {
          const mission = row.original;
          return (
            <div className="text-left">
              {mission.pickup_address?.city || mission.pickup_address?.formatted_address || 'N/A'}
            </div>
          );
        },
      },
      {
        accessorKey: 'delivery_address',
        header: () => <div className="text-left">Arrivée</div>,
        cell: ({ row }: any) => {
          const mission = row.original;
          return (
            <div className="text-left">
              {mission.delivery_address?.city || mission.delivery_address?.formatted_address || 'N/A'}
            </div>
          );
        },
      },
      {
        accessorKey: 'price_ttc',
        header: ({ column }: any) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Montant TTC
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }: any) => {
          const mission = row.original;
          return (
            <div>
              {mission.price_ttc?.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }) || 'N/A'}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }: any) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Statut
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }: any) => {
          const mission = row.original;
          return (
            <div className="flex items-center">
              <Badge className={`${missionStatusColors[mission.status]} px-2 py-1 rounded-full text-xs`}>
                {missionStatusLabels[mission.status]}
              </Badge>
            </div>
          );
        },
      },
      // Colonne Actions
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: any) => {
          const mission = row.original;
          const client = clientsData[mission.client_id];

          return (
            <div className="flex items-center gap-2">
              <GenerateInvoiceButton mission={mission} client={client} />
              <Button
                variant="ghost"
                size="icon"
                asChild
              >
                <Link to={`/${userRole}/missions/${mission.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          );
        },
      },
    ],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-4">Aucune mission trouvée.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                return (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
              {missions.length === 0 && 
                <tr>
                  <td colSpan={6} className="text-center py-4">Aucune mission trouvée.</td>
                </tr>
              }
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-end space-x-2 py-2 px-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesTable;
