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
import { ArrowUpDown, ChevronDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="w-full">
      {/* Card Section */}
      <div className="mb-6 grid grid-cols-1 p-5 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Total Estimates</CardTitle>
            <CardDescription>Estimate total value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">$32.1k</div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Total Customers</CardTitle>
            <CardDescription>Number of customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">829</div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Accepted</CardTitle>
            <CardDescription>Accepted status count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">16.23k</div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Pending</CardTitle>
            <CardDescription>Pending status count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-yellow-600">2.58k</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <Input
          placeholder="Filter profile..."
          value={(table.getColumn("profile")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("profile")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      <div className="flex items-center space-x-4 py-4">
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
          >
            {status}
          </Button>
        ))}
      </div>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
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

      {/* Table Section */}
      <Table>
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

      {/* Pagination Section */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
