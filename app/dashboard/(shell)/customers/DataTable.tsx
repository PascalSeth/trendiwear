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
    cell: ({ row }) => <span className="font-semibold text-slate-900 text-xs">{row.getValue("profile")}</span>,
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => <span className="text-xs text-slate-600">{row.getValue("contact")}</span>,
  },
  {
    accessorKey: "company",
    header: "Company",
    cell: ({ row }) => <span className="text-xs text-slate-700">{row.getValue("company")}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
            status === "Accepted"
              ? "bg-emerald-50 text-emerald-700"
              : status === "Pending"
              ? "bg-amber-50 text-amber-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "estimateValue",
    header: "Estimate Value",
    cell: ({ row }) => <div className="text-right text-xs font-bold text-slate-900">{row.getValue("estimateValue")}</div>,
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
    <div className="w-full space-y-4 sm:space-y-5">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Client Directory &amp; Accounts</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage buyer profiles, purchase estimates, and account statuses.
          </p>
        </div>
      </div>

      {/* STATS CARDS - 2x2 on mobile, 4 cols on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {[
          { label: "Total Customers", value: "829", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Active Buyers", value: "16.2k", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Reviews", value: "2.5k", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Estimates", value: "GH₵ 32.1k", icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3 hover:border-indigo-300 transition-all">
            <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{stat.label}</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Input
            placeholder="Search customers..."
            value={(table.getColumn("profile")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("profile")?.setFilterValue(event.target.value)
            }
            className="w-full sm:max-w-xs h-9 text-xs pl-3 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-lg"
          />
          <div className="flex flex-wrap items-center gap-2">
            {["All", "Accepted", "Pending", "Cancelled"].map((status) => (
              <Button
                key={status}
                variant="outline"
                size="sm"
                onClick={() => handleFilter(status)}
                className="h-8 text-xs font-semibold px-2.5 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {status}
              </Button>
            ))}

            {/* Columns toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold px-2.5 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 ml-auto sm:ml-0">
                  <span>Columns</span>
                  <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 p-1.5">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs rounded py-1"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-slate-50/70 border-b border-slate-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-9 px-3 sm:px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <div
                        {...{
                          className: header.column.getCanSort() ? "cursor-pointer select-none flex items-center" : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() ? (
                          <ArrowUpDown className="ml-1.5 h-3 w-3" />
                        ) : null}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Section */}
        <div className="px-3 sm:px-4 py-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 text-xs font-semibold px-3 rounded-lg border-slate-200"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 text-xs font-semibold px-3 rounded-lg border-slate-200"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
