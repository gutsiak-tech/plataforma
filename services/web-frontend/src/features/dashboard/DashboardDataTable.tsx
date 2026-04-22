import { useMemo, useRef, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { DashboardTableRow } from "../../lib/api/schemas";
import type { EmptyAwareRows } from "../../lib/api/client";
import { Input } from "../../components/ui/input";
import { TableContainer, Table, TBody, TD, TH, THead, TR } from "../../components/ui/table";
import { EmptyState } from "../../components/common/EmptyState";

interface DashboardDataTableProps {
  tableRows: EmptyAwareRows<DashboardTableRow> | null;
}

function brNumber(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR");
}

function brCurrency(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const helper = createColumnHelper<DashboardTableRow>();

export function DashboardDataTable({ tableRows }: DashboardDataTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => [
      helper.accessor("municipio", {
        header: "Município",
        cell: (info) => info.getValue(),
      }),
      helper.accessor("saldo_sum", {
        header: "Saldo",
        cell: (info) => brNumber(info.getValue()),
      }),
      helper.accessor("salario_medio", {
        header: "Salário médio",
        cell: (info) => brCurrency(info.getValue()),
      }),
      helper.accessor("registros", {
        header: "Registros",
        cell: (info) => brNumber(info.getValue()),
      }),
    ],
    []
  );

  const rows = tableRows?.rows ?? [];
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const virtualRowsEnabled = rows.length > 200;
  const rowVirtualizer = useVirtualizer({
    count: virtualRowsEnabled ? table.getRowModel().rows.length : 0,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 44,
    overscan: 8,
  });

  if (!tableRows) return null;
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Tabela sem dados"
        message="A consulta não retornou linhas para estes filtros."
        missingFields={tableRows.missing_fields}
      />
    );
  }

  return (
    <div className="space-y-3">
      <Input
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Filtrar por município..."
        aria-label="Filtrar tabela por município"
        className="max-w-sm"
      />
      <TableContainer className="max-h-[520px]" ref={tableContainerRef}>
        <Table>
          <THead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TR key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TH
                    key={header.id}
                    className="cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TH>
                ))}
              </TR>
            ))}
          </THead>
          <TBody>
            {virtualRowsEnabled ? (
              <>
                <tr>
                  <td style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }} colSpan={columns.length}>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const row = table.getRowModel().rows[virtualRow.index];
                      return (
                        <div
                          key={row.id}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <Table className="table-fixed">
                            <tbody>
                              <TR>
                                {row.getVisibleCells().map((cell) => (
                                  <TD key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TD>
                                ))}
                              </TR>
                            </tbody>
                          </Table>
                        </div>
                      );
                    })}
                  </td>
                </tr>
              </>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TR key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TD key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TD>
                  ))}
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </TableContainer>
      {tableRows.missing_fields.length > 0 ? (
        <EmptyState
          title="Tabela com dados parciais"
          message="Alguns campos necessários para análise estão incompletos."
          missingFields={tableRows.missing_fields}
        />
      ) : null}
    </div>
  );
}
