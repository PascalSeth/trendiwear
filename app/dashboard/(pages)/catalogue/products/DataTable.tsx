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
import { ChevronDown, MoreHorizontal, Plus, Edit, Trash2, Eye,  ShoppingBag, Heart, MessageCircle, ChevronLeft, ChevronRight, Package } from "lucide-react";
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

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="space-y-6 pt-4">
    {/* Header Skeleton */}
    <div className="space-y-3">
      <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      <div className="flex gap-2">
        <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
    </div>

    {/* Image Skeleton */}
    <div className="relative w-full h-80 rounded-lg overflow-hidden bg-gray-200 animate-pulse"></div>

    {/* Price Skeleton */}
    <div className="bg-gray-100 p-4 rounded-lg">
      <div className="h-4 bg-gray-200 rounded w-16 mb-3 animate-pulse"></div>
      <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
    </div>

    {/* Info Grid Skeleton */}
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="h-3 bg-gray-200 rounded w-24 mb-3 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-12 animate-pulse"></div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="h-3 bg-gray-200 rounded w-20 mb-3 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
      </div>
    </div>

    {/* Metrics Skeleton */}
    <div className="grid grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="h-5 bg-gray-200 rounded mx-auto mb-2 w-6 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
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
          <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <Image
              src={row.original.images[0] || "/placeholder-product.jpg"}
              alt={row.getValue("name")}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm md:text-base truncate">{row.getValue("name")}</div>
            <div className="text-xs md:text-sm text-gray-500 truncate">{row.original.category.name}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => <div className="font-semibold text-green-600">{row.original.currency} {row.getValue("price")}</div>,
    },
    {
      accessorKey: "stockQuantity",
      header: "Stock",
      cell: ({ row }) => {
        const stockQuantity = row.getValue("stockQuantity") as number;
        return (
          <Badge className={stockQuantity > 0 ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>
            {stockQuantity}
          </Badge>
        );
      },
    },
    {
      accessorKey: "soldCount",
      header: "Sold",
      cell: ({ row }) => <div className="text-center hidden md:block font-medium">{row.getValue("soldCount")}</div>,
    },
    {
      accessorKey: "viewCount",
      header: "Views",
      cell: ({ row }) => <div className="text-center hidden md:block font-medium">{row.getValue("viewCount")}</div>,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex flex-col space-y-1">
          <Badge className={row.original.isActive ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge className={row.original.isInStock ? "bg-sky-100 text-sky-800 hover:bg-sky-100" : "bg-orange-100 text-orange-800 hover:bg-orange-100"}>
            {row.original.isInStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs font-semibold">Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleViewDetails(row.original)} className="cursor-pointer">
              <Eye className="mr-2 h-4 w-4" />
              <span>View Details</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddStockClick(row.original)} className="cursor-pointer">
              <Package className="mr-2 h-4 w-4" />
              <span>Add Stock</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/dashboard/catalogue/products/edit/${row.original.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Product</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
              onClick={() => handleDeleteClick(row.original)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

  return (
    <div className="w-full space-y-6">
      {/* Header with Add Product Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Products</h2>
          <p className="text-gray-500 text-sm md:text-base mt-1">
            Manage your product catalog and inventory
          </p>
        </div>
        <Link href='/dashboard/catalogue/products/add-product'>
          <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
        <Input
          placeholder="Search products by name, category..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm bg-gray-50 border-gray-300"
        />

        {/* Status Filter and Column Visibility */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-600 font-semibold">Status:</span>
          {["All", "Active", "Inactive"].map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => handleStatusFilter(status)}
              className="text-xs md:text-sm border-gray-300 hover:bg-gray-50"
            >
              {status}
            </Button>
          ))}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto border-gray-300 hover:bg-gray-50">
                <span className="hidden sm:inline">Columns</span>
                <ChevronDown className="h-4 w-4 ml-1" />
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
                      className="capitalize cursor-pointer"
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
      <div className="rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
        <Table className="w-full bg-white">
          <TableHeader className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-gray-50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-gray-700 font-semibold">
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
                <TableRow key={row.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 sm:gap-0 sm:space-x-2 py-4">
        <div className="flex-1 text-xs md:text-sm text-gray-600 text-center sm:text-left">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} product(s) selected.
        </div>
        <div className="flex justify-center sm:justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-xs md:text-sm border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="text-xs md:text-sm border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </Button>
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
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{selectedProduct.category.name}</Badge>
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