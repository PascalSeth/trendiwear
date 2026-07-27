"use client";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Users, UserCheck, Clock, DollarSign } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";

// Define the Customer data type
type Customer = {
  profile: string;
  contact: string;
  company: string;
  status: string;
  estimateValue: string;
};

// Sample data
const data: Customer[] = [
  {
    profile: "Oriana Anderson",
    contact: "oriana.anderson@example.com",
    company: "Tech Wire",
    status: "Accepted",
    estimateValue: "$2,146.00",
  },
  {
    profile: "Benjamin Ramirez",
    contact: "benjamin.ramirez@example.com",
    company: "Green Eco",
    status: "Pending",
    estimateValue: "$1,224.00",
  },
  {
    profile: "Sophia Mitchell",
    contact: "sophia.mitchell@example.com",
    company: "Blue Wave",
    status: "Accepted",
    estimateValue: "$1,987.00",
  },
  {
    profile: "Liam Walker",
    contact: "liam.walker@example.com",
    company: "Innova Corp",
    status: "Cancelled",
    estimateValue: "$987.00",
  },
  {
    profile: "Ava Bennett",
    contact: "ava.bennett@example.com",
    company: "SW High",
    status: "Pending",
    estimateValue: "$2,245.00",
  },
];

export const columns: ColumnDef<Customer>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "profile",
    header: "Profile",
    cell: ({ row }) => row.getValue("profile"),
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => row.getValue("contact"),
  },
  {
    accessorKey: "company",
    header: "Company",
    cell: ({ row }) => row.getValue("company"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div
        className={`text-center ${
          row.getValue("status") === "Accepted"
            ? "text-green-500"
            : row.getValue("status") === "Pending"
            ? "text-yellow-500"
            : "text-red-500"
        }`}
      >
        {row.getValue("status")}
      </div>
    ),
  },
  {
    accessorKey: "estimateValue",
    header: "Estimate Value",
    cell: ({ row }) => <div className="text-right">{row.getValue("estimateValue")}</div>,
  },
];

export function CustomerDataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleFilter = (status: string) => {
    if (status === "All") {
      setColumnFilters((filters) =>
        filters.filter((filter) => filter.id !== "status")
      );
    } else {
      setColumnFilters([
        {
          id: "status",
          value: status,
        },
      ]);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Client CRM &amp; Accounts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Manage buyer profiles, purchase estimates, account statuses, and customer inquiries.
          </p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Customers", value: "829", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Active Accepted", value: "16.23k", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Verification", value: "2.58k", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Estimates", value: "$32.1k", icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-300 transition-all">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4">
        <Input
          placeholder="Filter profile..."
          value={(table.getColumn("profile")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("profile")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          {[
            "All",
            "Accepted",
            "Pending",
            "Cancelled",
          ].map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => handleFilter(status)}
              className="text-xs md:text-sm"
            >
              {status}
            </Button>
          ))}

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <span className="hidden sm:inline">Columns</span>
                <ChevronDown className="h-4 w-4 sm:ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  <div
                    {...{
                      className: header.column.getCanSort() ? "cursor-pointer select-none" : "",
                      onClick: header.column.getToggleSortingHandler(),
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() ? (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    ) : null}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>

      {/* Pagination Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-0 sm:space-x-2 py-4">
        <div className="flex-1 text-xs md:text-sm text-muted-foreground text-center sm:text-left">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex justify-center sm:justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-xs md:text-sm"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="text-xs md:text-sm"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  </div>
);
}
