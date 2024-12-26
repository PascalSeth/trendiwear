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
import { ChevronDown, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

// Define the Product data type
type Product = {
  name: string;
  purchaseUnitPrice: string;
  products: number;
  views: number;
  status: string;
  category: string;
  store: string;
};

// Sample data
const data: Product[] = [
  {
    name: "Gabriela Cashmere Blazer",
    purchaseUnitPrice: "$113.99",
    products: 1113,
    views: 14012,
    status: "Active",
    category: "Jackets",
    store: "Store A",
  },
  {
    name: "Loewe Blend Jacket - Blue",
    purchaseUnitPrice: "$113.99",
    products: 721,
    views: 13121,
    status: "Active",
    category: "Jackets",
    store: "Store B",
  },
  {
    name: "Sandro - Jacket - Black",
    purchaseUnitPrice: "$113.99",
    products: 407,
    views: 1520,
    status: "Active",
    category: "Jackets",
    store: "Store A",
  },
  {
    name: "Adidas By Stella McCartney",
    purchaseUnitPrice: "$113.99",
    products: 1203,
    views: 1002,
    status: "Disabled",
    category: "Jackets",
    store: "Store C",
  },
  {
    name: "Meteo Hooded Wool Jacket",
    purchaseUnitPrice: "$113.99",
    products: 306,
    views: 807,
    status: "Disabled",
    category: "Jackets",
    store: "Store B",
  },
];

export const columns: ColumnDef<Product>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
    accessorKey: "name",
    header: "Product Name",
    cell: ({ row }) => (
      <div className="flex items-center">
        <img src="https://via.placeholder.com/40" alt={row.getValue("name")} className="w-10 h-10 rounded-full mr-2" />
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "purchaseUnitPrice",
    header: "Purchase Unit Price",
    cell: ({ row }) => <div className="text-right">{row.getValue("purchaseUnitPrice")}</div>,
  },
  {
    accessorKey: "products",
    header: "Products",
    cell: ({ row }) => <div className="text-right">{row.getValue("products")}</div>,
  },
  {
    accessorKey: "views",
    header: "Views",
    cell: ({ row }) => <div className="text-right">{row.getValue("views")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className={`text-center ${row.getValue("status") === "Active" ? "text-green-500" : "text-red-500"}`}>
        {row.getValue("status")}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.name)}>
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function ProductTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
 
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
  })

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
      <Link href='/dashboard/catalogue/products/add-product'> Add</Link>
     <div className="mb-6 flex items-center gap-4">
  {/* Email Filter */}
  <Input
    placeholder="Filter products..."
    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
    onChange={(event) =>
      table.getColumn("name")?.setFilterValue(event.target.value)
    }
    className="max-w-sm"
  />
  
  {/* Status Filter */}
   <div className="flex items-center space-x-4 py-4">
          {[
            "All",
            "Active",
            "Disabled",
    
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
        
      

 
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
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
  );
}
