"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {  MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    status: "Inactive",
    category: "Jackets",
    store: "Store C",
  },
  {
    name: "Meteo Hooded Wool Jacket",
    purchaseUnitPrice: "$113.99",
    products: 306,
    views: 807,
    status: "Inactive",
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
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("All Products");
  const [statusFilter, setStatusFilter] = React.useState("All Status");
  const [priceFilter, setPriceFilter] = React.useState("$50 - $100");
  const [storeFilter, setStoreFilter] = React.useState("All Store");

  const filteredData = data.filter((product) => {
    return (
      (categoryFilter === "All Products" || product.category === categoryFilter) &&
      (statusFilter === "All Status" || product.status === statusFilter) &&
      (priceFilter === "$50 - $100" || (parseFloat(product.purchaseUnitPrice.replace("$", "")) >= 50 && parseFloat(product.purchaseUnitPrice.replace("$", "")) <= 100)) &&
      (storeFilter === "All Store" || product.store === storeFilter) &&
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  });

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-1/4"
        />
        <Button variant="outline" className="h-8">
          Add Product
        </Button>
      </div>
      <div className="mb-4 flex space-x-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Products">All Products</SelectItem>
            <SelectItem value="Jackets">Jackets</SelectItem>
            {/* Add more categories as needed */}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Status">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priceFilter} onValueChange={setPriceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="$50 - $100">$50 - $100</SelectItem>
            <SelectItem value="$100 - $200">$100 - $200</SelectItem>
          </SelectContent>
        </Select>

        <Select value={storeFilter} onValueChange={setStoreFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Store" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Store">All Store</SelectItem>
            <SelectItem value="Store A">Store A</SelectItem>
            <SelectItem value="Store B">Store B</SelectItem>
            <SelectItem value="Store C">Store C</SelectItem>
          </SelectContent>
        </Select>
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
