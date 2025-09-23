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
import { ChevronDown, MoreHorizontal, Plus, Edit, Trash2, Eye } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

// Define the Product data type based on Prisma schema
type Product = {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  images: string[];
  isActive: boolean;
  isInStock: boolean;
  viewCount: number;
  soldCount: number;
  createdAt: string;
  category: {
    name: string;
  };
  collection?: {
    name: string;
  };
  professional: {
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName: string;
    };
  };
  _count: {
    wishlistItems: number;
    cartItems: number;
    orderItems: number;
    reviews: number;
  };
};

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
    header: "Product",
    cell: ({ row }) => (
      <div className="flex items-center space-x-2 md:space-x-3">
        <Image
          src={row.original.images[0] || "/placeholder-product.jpg"}
          alt={row.getValue("name")}
          width={32}
          height={32}
          className="rounded-lg object-cover md:w-10 md:h-10"
        />
        <div>
          <div className="font-medium text-sm md:text-base">{row.getValue("name")}</div>
          <div className="text-xs md:text-sm text-gray-500">{row.original.category.name}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => <div className="font-medium">${row.getValue("price")}</div>,
  },
  {
    accessorKey: "stockQuantity",
    header: "Stock",
    cell: ({ row }) => {
      const stockQuantity = row.getValue("stockQuantity") as number;
      return (
        <Badge variant={stockQuantity > 0 ? "default" : "destructive"}>
          {stockQuantity}
        </Badge>
      );
    },
  },
  {
    accessorKey: "soldCount",
    header: "Sold",
    cell: ({ row }) => <div className="text-center hidden md:block">{row.getValue("soldCount")}</div>,
  },
  {
    accessorKey: "viewCount",
    header: "Views",
    cell: ({ row }) => <div className="text-center hidden md:block">{row.getValue("viewCount")}</div>,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex flex-col space-y-1">
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
        <Badge variant={row.original.isInStock ? "outline" : "destructive"}>
          {row.original.isInStock ? "In Stock" : "Out of Stock"}
        </Badge>
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Edit className="mr-2 h-4 w-4" />
            Edit Product
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

type ProductTableProps = {
  initialData?: Product[];
};

export function ProductTable({ initialData }: ProductTableProps) {
  const [data, setData] = useState<Product[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Fetch products data
  useEffect(() => {
    if (!initialData) {
      fetchProducts();
    }
  }, [initialData]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?dashboard=true&page=1&limit=50');
      if (response.ok) {
        const result = await response.json();
        setData(result.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleStatusFilter = (status: string) => {
    if (status === "All") {
      setColumnFilters((filters) =>
        filters.filter((filter) => filter.id !== "isActive")
      );
    } else {
      const isActive = status === "Active";
      setColumnFilters([
        {
          id: "isActive",
          value: isActive,
        },
      ]);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header with Add Product Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your product catalog and inventory
          </p>
        </div>
        <Link href='/dashboard/catalogue/products/add-product'>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4">
        <Input
          placeholder="Search products..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        {/* Status Filter and Column Visibility */}
        <div className="flex flex-wrap items-center gap-2">
          {["All", "Active", "Inactive"].map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => handleStatusFilter(status)}
              className="text-xs md:text-sm"
            >
              {status}
            </Button>
          ))}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <span className="hidden sm:inline">Columns</span>
                <ChevronDown className="h-4 w-4" />
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
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="w-full">
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
            {table.getRowModel().rows?.length ? (
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
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-0 sm:space-x-2 py-4">
        <div className="flex-1 text-xs md:text-sm text-muted-foreground text-center sm:text-left">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} product(s) selected.
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
  );
}
