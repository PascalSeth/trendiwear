"use client";

import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
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
import { ChevronDown, MoreHorizontal, Plus, Edit, Trash2, Eye,  ShoppingBag, Heart, MessageCircle, ChevronLeft, ChevronRight, Package, Copy } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  price: number;
  currency: string;
  stockQuantity: number;
  images: string[];
  isActive: boolean;
  isInStock: boolean;
  viewCount: number;
  soldCount: number;
  isDeleted: boolean;
  createdAt: string;
  categories: {
    name: string;
  }[];
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

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="space-y-8 pt-4">
    {/* Header Skeleton */}
    <div className="flex justify-between items-center">
      <div className="space-y-3">
        <div className="h-10 bg-gray-100 rounded-lg w-64 animate-pulse"></div>
        <div className="h-5 bg-gray-100 rounded-lg w-96 animate-pulse"></div>
      </div>
      <div className="h-12 bg-gray-100 rounded-xl w-40 animate-pulse"></div>
    </div>

    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-50 border border-gray-100 rounded-3xl animate-pulse"></div>
      ))}
    </div>

    {/* Toolbar Skeleton */}
    <div className="h-20 bg-gray-50 border border-gray-100 rounded-3xl animate-pulse"></div>

    {/* Table Skeleton */}
    <div className="border border-gray-100 rounded-3xl overflow-hidden">
      <div className="h-12 bg-gray-50/50 animate-pulse"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 border-t border-gray-50 animate-pulse"></div>
      ))}
    </div>
  </div>
);

export function ProductTable({ initialData }: ProductTableProps) {
  const [data, setData] = useState<Product[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
  const [productToAddStock, setProductToAddStock] = useState<Product | null>(null);
  const [addStockAmount, setAddStockAmount] = useState("");

  useEffect(() => {
    if (!initialData) {
      fetchProducts();
    }
  }, [initialData]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Filter out deleted products and fetch dashboard data
      const response = await fetch('/api/products?dashboard=true&page=1&limit=50');
      if (response.ok) {
        const result = await response.json();
        // Ensure we only show non-deleted products
        const nonDeleted = (result.products || []).filter((p: Product) => !p.isDeleted);
        setData(nonDeleted);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductActive = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      });

      if (response.ok) {
        const updated = await response.json();
        setData((prev) => prev.map((p) => p.id === product.id ? { ...p, isActive: updated.isActive } : p));
        toast.success(`Product ${updated.isActive ? 'activated' : 'deactivated'}`);
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error('Failed to update product status');
    }
  };

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

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (product: Product) => {
    setDetailsLoading(true);
    setCurrentImageIndex(0);
    setSelectedProduct(product);
    setDetailsDialogOpen(true);
    // Simulate loading delay
    setTimeout(() => setDetailsLoading(false), 500);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setData((prev: Product[]) => prev.filter((product: Product) => product.id !== productToDelete.id));
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('An error occurred while deleting the product.');
    }
  };

  const handleAddStockClick = (product: Product) => {
    setProductToAddStock(product);
    setAddStockAmount("");
    setAddStockDialogOpen(true);
  };

  const handleAddStockConfirm = async () => {
    if (!productToAddStock || !addStockAmount) return;

    const amount = parseInt(addStockAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive number for stock amount.");
      return;
    }

    try {
      const response = await fetch(`/api/products/${productToAddStock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockQuantity: productToAddStock.stockQuantity + amount,
        }),
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        setData((prev: Product[]) =>
          prev.map((product: Product) =>
            product.id === productToAddStock.id
              ? { ...product, stockQuantity: updatedProduct.stockQuantity }
              : product
          )
        );
        setAddStockDialogOpen(false);
        setProductToAddStock(null);
        setAddStockAmount("");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('An error occurred while updating the stock.');
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}/duplicate`, {
        method: 'POST',
      });
      if (response.ok) {
        const duplicatedProduct = await response.json();
        setData((prev: Product[]) => [duplicatedProduct, ...prev]);
        alert('Product duplicated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert('An error occurred while duplicating the product.');
    }
  };

  const nextImage = () => {
    if (selectedProduct && currentImageIndex < selectedProduct.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const columns: ColumnDef<Product>[] = [
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
          className="border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-gray-300"
        />
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Product
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-4">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 shadow-sm">
            <Image
              src={row.original.images[0] || "/placeholder-product.jpg"}
              alt={row.getValue("name")}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="font-semibold text-gray-900 text-sm truncate max-w-[200px]">
              {row.getValue("name")}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {row.original.categories?.[0]?.name || "Uncategorized"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">
            {row.original.currency} {row.original.price.toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "stockQuantity",
      header: "Inventory",
      cell: ({ row }) => {
        const stock = row.getValue("stockQuantity") as number;
        return (
          <div className="flex flex-col space-y-1.5 w-24">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className={stock > 10 ? "text-emerald-600" : stock > 0 ? "text-amber-600" : "text-red-600"}>
                {stock > 0 ? `${stock} in stock` : "Out of stock"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  stock > 10 ? "bg-emerald-500" : stock > 0 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min((stock / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "soldCount",
      header: "Sales",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-700">
          {row.getValue("soldCount")} sold
        </div>
      ),
    },
    {
      id: "status",
      header: "Visibility",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <Switch
            checked={row.original.isActive}
            onCheckedChange={() => toggleProductActive(row.original)}
            className="data-[state=checked]:bg-emerald-500"
          />
          <Badge 
            variant="outline"
            className={`font-medium border-0 px-2 py-0.5 rounded-md ${
              row.original.isActive 
                ? "bg-emerald-50 text-emerald-700" 
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {row.original.isActive ? "Live" : "Draft"}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-2">
              <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Options
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem onClick={() => handleViewDetails(row.original)} className="rounded-md cursor-pointer">
                <Eye className="mr-2 h-4 w-4 text-gray-500" />
                <span>View Stats</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddStockClick(row.original)} className="rounded-md cursor-pointer">
                <Package className="mr-2 h-4 w-4 text-gray-500" />
                <span>Add Stock</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                <Link href={`/dashboard/catalogue/products/edit/${row.original.id}`}>
                  <Edit className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Edit Product</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicateProduct(row.original)} className="rounded-md cursor-pointer">
                <Copy className="mr-2 h-4 w-4 text-gray-500" />
                <span>Duplicate</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                className="rounded-md text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                onClick={() => handleDeleteClick(row.original)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Product</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

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

  if (loading) {
    return <SkeletonLoader />;
  }

  const stats = {
    total: data.length,
    active: data.filter(p => p.isActive).length,
    outOfStock: data.filter(p => p.stockQuantity === 0).length,
    lowStock: data.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length,
  };

  return (
    <div className="w-full space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Product Catalog</h1>
          <p className="text-gray-500 font-medium">
            Manage your inventory, pricing and visibility across the store.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex border-gray-200 text-gray-600 hover:bg-gray-50">
            Export CSV
          </Button>
          <Link href='/dashboard/catalogue/products/add-product'>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 px-6">
              <Plus className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: stats.total, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Live", value: stats.active, icon: Eye, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Out of Stock", value: stats.outOfStock, icon: ShoppingBag, color: "text-red-600", bg: "bg-red-50" },
          { label: "Low Inventory", value: stats.lowStock, icon: ChevronDown, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-gray-100 shadow-sm overflow-hidden group hover:border-indigo-200 transition-colors">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-gray-50 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative w-full lg:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400 rotate-90" />
              </div>
              <Input
                placeholder="Search by product name, SKU or category..."
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="pl-10 bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-xl h-11"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Tabs defaultValue="All" onValueChange={handleStatusFilter} className="w-full sm:w-auto">
                <TabsList className="bg-gray-100/80 p-1 h-11 rounded-xl">
                  {["All", "Active", "Inactive"].map((status) => (
                    <TabsTrigger 
                      key={status} 
                      value={status}
                      className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium"
                    >
                      {status}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11 border-gray-200 rounded-xl px-4 text-gray-600">
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-2">
                  <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Show/Hide Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1" />
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize rounded-md"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-12 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
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
                  <TableRow 
                    key={row.id} 
                    className="border-b border-gray-50 hover:bg-indigo-50/20 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <ShoppingBag className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium text-lg">No products found</p>
                      <p className="text-gray-400 text-sm max-w-xs">
                        Try adjusting your search or filters to find what you&apos;re looking for.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-500 font-medium">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-gray-200 rounded-lg h-9"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1 mx-2">
              <span className="text-sm font-semibold text-gray-900">
                {table.getState().pagination.pageIndex + 1}
              </span>
              <span className="text-sm text-gray-400 font-medium">of</span>
              <span className="text-sm font-semibold text-gray-900">
                {table.getPageCount()}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-gray-200 rounded-lg h-9"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {detailsLoading ? (
            <SkeletonLoader />
          ) : (
            selectedProduct && (
              <div className="space-y-6 p-6">
                {/* Product Header */}
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.categories?.map((cat, i) => (
                        <Badge key={i} className="bg-blue-100 text-blue-800 hover:bg-blue-100">{cat.name}</Badge>
                      ))}
                    </div>
                    {selectedProduct.collection && (
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{selectedProduct.collection.name}</Badge>
                    )}
                    <Badge className={selectedProduct.isActive ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}>
                      {selectedProduct.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {/* Product Image Gallery */}
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <div className="space-y-4">
                    <div className="relative w-full h-80 rounded-lg overflow-hidden bg-gray-100 group">
                      <Image
                        src={selectedProduct.images[currentImageIndex]}
                        alt={selectedProduct.name}
                        fill
                        className="w-full h-full object-cover"
                      />

                      {/* Navigation Arrows */}
                      {selectedProduct.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            disabled={currentImageIndex === 0}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full transition-all disabled:opacity-30"
                          >
                            <ChevronLeft className="h-5 w-5 text-gray-800" />
                          </button>
                          <button
                            onClick={nextImage}
                            disabled={currentImageIndex === selectedProduct.images.length - 1}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full transition-all disabled:opacity-30"
                          >
                            <ChevronRight className="h-5 w-5 text-gray-800" />
                          </button>
                        </>
                      )}

                      {/* Image Counter */}
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                        {currentImageIndex + 1} / {selectedProduct.images.length}
                      </div>
                    </div>

                    {/* Image Thumbnails */}
                    {selectedProduct.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {selectedProduct.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`relative w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden transition-all ${
                              idx === currentImageIndex ? "ring-2 ring-blue-500" : "opacity-60 hover:opacity-100"
                            }`}
                          >
                            <Image
                              src={img}
                              alt={`${selectedProduct.name} ${idx + 1}`}
                              fill
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-80 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-500">No images available</span>
                  </div>
                )}

                {/* Pricing Section */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-700 font-medium mb-1">Price</div>
                  <div className="text-3xl font-bold text-blue-900">{selectedProduct.currency} {selectedProduct.price}</div>
                </div>

                {/* Stock Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 font-medium uppercase mb-2">Stock Quantity</div>
                    <div className="text-2xl font-bold text-gray-900">{selectedProduct.stockQuantity}</div>
                    <div className={`text-xs mt-2 font-medium ${selectedProduct.isInStock ? "text-emerald-600" : "text-red-600"}`}>
                      {selectedProduct.isInStock ? "✓ In Stock" : "✗ Out of Stock"}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 font-medium uppercase mb-2">Status</div>
                    <div className="text-2xl font-bold text-gray-900">{selectedProduct.isActive ? "Active" : "Inactive"}</div>
                    <div className="text-xs mt-2 text-gray-600">
                      {new Date(selectedProduct.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                    <Eye className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">{selectedProduct.viewCount}</div>
                    <div className="text-xs text-gray-600">Views</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                    <ShoppingBag className="h-5 w-5 text-green-600 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">{selectedProduct.soldCount}</div>
                    <div className="text-xs text-gray-600">Sold</div>
                  </div>
                  <div className="bg-pink-50 p-3 rounded-lg border border-pink-200 text-center">
                    <Heart className="h-5 w-5 text-pink-600 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">{selectedProduct._count.wishlistItems}</div>
                    <div className="text-xs text-gray-600">Wishlist</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-center">
                    <MessageCircle className="h-5 w-5 text-orange-600 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">{selectedProduct._count.reviews}</div>
                    <div className="text-xs text-gray-600">Reviews</div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 font-medium uppercase mb-2">Cart Items</div>
                    <div className="text-2xl font-bold text-gray-900">{selectedProduct._count.cartItems}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 font-medium uppercase mb-2">Orders</div>
                    <div className="text-2xl font-bold text-gray-900">{selectedProduct._count.orderItems}</div>
                  </div>
                </div>

                {/* Professional/Seller Info */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-sm font-semibold text-gray-900 mb-3">Seller Information</div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Name: </span>
                      <span className="font-medium text-gray-900">
                        {selectedProduct.professional.professionalProfile?.businessName ||
                          `${selectedProduct.professional.firstName} ${selectedProduct.professional.lastName}`}
                      </span>
                    </div>
                    {selectedProduct.professional.professionalProfile?.businessName && (
                      <div>
                        <span className="text-gray-600">Personal: </span>
                        <span className="font-medium text-gray-900">{selectedProduct.professional.firstName} {selectedProduct.professional.lastName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4">
                  <Link href={`/dashboard/catalogue/products/edit/${selectedProduct.id}`} className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Product
                    </Button>
                  </Link>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Product</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete &apos;<span className="font-semibold text-gray-900">{productToDelete?.name}</span>&apos;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-gray-300 hover:bg-gray-50">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add Stock Dialog */}
      <Dialog open={addStockDialogOpen} onOpenChange={setAddStockDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-blue-600">Add Stock</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add stock to &apos;<span className="font-semibold text-gray-900">{productToAddStock?.name}</span>&apos;.
              Current stock: <span className="font-semibold">{productToAddStock?.stockQuantity}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="stockAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Add
            </label>
            <Input
              id="stockAmount"
              type="number"
              min="1"
              value={addStockAmount}
              onChange={(e) => setAddStockAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full"
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setAddStockDialogOpen(false)} className="border-gray-300 hover:bg-gray-50">
              Cancel
            </Button>
            <Button onClick={handleAddStockConfirm} className="bg-blue-600 hover:bg-blue-700">
              Add Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type ProductTableProps = {
  initialData?: Product[];
};