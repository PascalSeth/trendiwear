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
import { ChevronDown, MoreHorizontal, Plus, Edit, Trash2, Eye,  ShoppingBag, Heart, MessageCircle, ChevronLeft, ChevronRight, Package, Copy, LayoutGrid, List } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
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
        <div className="flex items-center space-x-3">
          <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
            <Image
              src={row.original.images[0] || "/placeholder-product.jpg"}
              alt={row.getValue("name")}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="font-semibold text-slate-900 text-xs sm:text-[13px] truncate max-w-[160px] sm:max-w-[240px]">
              {row.getValue("name")}
            </span>
            <span className="text-[10px] text-slate-400 font-normal truncate">
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
          <span className="font-bold text-slate-900 text-xs sm:text-[13px]">
            GH₵ {row.original.price.toFixed(2)}
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
          <div className="flex flex-col space-y-1 w-20 sm:w-24">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className={stock > 10 ? "text-emerald-600" : stock > 0 ? "text-amber-600" : "text-rose-600"}>
                {stock > 0 ? `${stock} left` : "Out"}
              </span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  stock > 10 ? "bg-emerald-500" : stock > 0 ? "bg-amber-500" : "bg-rose-500"
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
        <div className="text-xs font-medium text-slate-700">
          {row.getValue("soldCount")} sold
        </div>
      ),
    },
    {
      id: "status",
      header: "Visibility",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Switch
            checked={row.original.isActive}
            onCheckedChange={() => toggleProductActive(row.original)}
            className="scale-90 data-[state=checked]:bg-emerald-500"
          />
          <Badge 
            variant="outline"
            className={`font-semibold border-0 text-[10px] px-1.5 py-0.5 rounded ${
              row.original.isActive 
                ? "bg-emerald-50 text-emerald-700" 
                : "bg-slate-100 text-slate-600"
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
    <div className="w-full space-y-4 sm:space-y-5 pb-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-600">Catalogue Management</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Products &amp; Inventory
          </h1>
          <p className="text-[11px] sm:text-xs font-normal text-slate-500 mt-0.5">
            Manage your store products, live stock, pricing, and variants.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href='/dashboard/catalogue/products/add-product'>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {[
          { label: "Total Products", value: stats.total, icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Active Live", value: stats.active, icon: Eye, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Out of Stock", value: stats.outOfStock, icon: ShoppingBag, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Low Inventory", value: stats.lowStock, icon: ChevronDown, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:border-indigo-200 transition-all">
            <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">{stat.label}</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mt-0.5 leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
            <div className="relative w-full lg:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 rotate-90" />
              </div>
              <Input
                placeholder="Search products, SKU or category..."
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="pl-9 bg-slate-50/60 border-slate-200 focus:bg-white text-xs sm:text-[13px] transition-all rounded-lg h-9"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Tabs defaultValue="All" onValueChange={handleStatusFilter} className="w-full sm:w-auto">
                <TabsList className="bg-slate-100 p-0.5 h-9 rounded-lg">
                  {["All", "Active", "Inactive"].map((status) => (
                    <TabsTrigger 
                      key={status} 
                      value={status}
                      className="rounded-md px-3 h-8 data-[state=active]:bg-white data-[state=active]:shadow-xs text-xs font-medium"
                    >
                      {status}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg h-9 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                  title="Table View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 border-slate-200 rounded-lg px-3 text-xs text-slate-600">
                    <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl text-xs">
                  <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Show/Hide Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1" />
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize rounded-md text-xs py-1.5"
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

        {/* View Content (Grid vs Table) */}
        {viewMode === 'grid' ? (
          <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const p = row.original;
                return (
                  <div key={p.id} className="group bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col">
                    {/* Card Image */}
                    <div className="relative aspect-square bg-slate-50 overflow-hidden">
                      <Image
                        src={p.images[0] || "/placeholder-product.jpg"}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Status pill */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-white/95 backdrop-blur-md rounded-full shadow-2xs text-[9px] font-bold border border-slate-200">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {p.isActive ? 'Live' : 'Draft'}
                      </div>
                      {/* Quick Actions Dropdown */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs hover:bg-white transition-colors">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 p-1 rounded-lg border-slate-200 shadow-lg text-xs">
                            <DropdownMenuItem onClick={() => handleViewDetails(p)} className="rounded-md text-xs cursor-pointer py-1.5">
                              <Eye className="mr-2 h-3.5 w-3.5 text-slate-500" /> View Stats
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddStockClick(p)} className="rounded-md text-xs cursor-pointer py-1.5">
                              <Package className="mr-2 h-3.5 w-3.5 text-slate-500" /> Add Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateProduct(p)} className="rounded-md text-xs cursor-pointer py-1.5">
                              <Copy className="mr-2 h-3.5 w-3.5 text-slate-500" /> Duplicate
                            </DropdownMenuItem>
                            <Link href={`/dashboard/catalogue/products/edit/${p.id}`}>
                              <DropdownMenuItem className="rounded-md text-xs cursor-pointer py-1.5">
                                <Edit className="mr-2 h-3.5 w-3.5 text-slate-500" /> Edit Details
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem onClick={() => handleDeleteClick(p)} className="rounded-md text-xs font-semibold text-rose-600 cursor-pointer py-1.5">
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-2.5 sm:p-3 flex flex-col flex-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 mb-0.5 truncate">
                        {p.categories?.[0]?.name || "Uncategorized"}
                      </span>
                      <h3 className="font-semibold text-slate-900 text-xs sm:text-[13px] line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {p.name}
                      </h3>
                      <div className="mt-auto pt-2.5 flex items-center justify-between border-t border-slate-100">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          GH₵ {p.price.toFixed(2)}
                        </span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${p.stockQuantity > 10 ? 'bg-emerald-50 text-emerald-700' : p.stockQuantity > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                          {p.stockQuantity > 0 ? `${p.stockQuantity} in stock` : 'Out'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center">
                <p className="text-slate-500 text-xs font-medium">No products match your filter criteria.</p>
              </div>
            )}
          </div>
        ) : (
          /* Table Content */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-slate-100">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="h-9 px-3 sm:px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
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
                      className="border-b border-slate-100/70 hover:bg-slate-50/70 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-3 sm:px-4 py-2 sm:py-2.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 bg-slate-50 rounded-full">
                          <ShoppingBag className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-slate-700 font-semibold text-sm">No products found</p>
                        <p className="text-slate-400 text-xs max-w-xs">
                          Try adjusting your search or filters to find what you&apos;re looking for.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-3 sm:px-4 py-2.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500 font-normal">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected
          </p>
          <div className="flex items-center space-x-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-slate-200 rounded-md h-8 text-xs px-2.5"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1 mx-2">
              <span className="text-xs font-bold text-slate-900">
                {table.getState().pagination.pageIndex + 1}
              </span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs font-bold text-slate-900">
                {table.getPageCount()}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-slate-200 rounded-md h-8 text-xs px-2.5"
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