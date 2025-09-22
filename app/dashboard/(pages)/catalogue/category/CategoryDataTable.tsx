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
import { ArrowUpDown, ChevronDown, FolderOpen, Package, MoreHorizontal, Edit, Trash2, Settings } from "lucide-react";
import * as React from "react";
import Image from "next/image";

import ProductCategorySheet from "@/app/dashboard/components/sheet/ProductCategory/page";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive: boolean;
  order: number;
  parent?: {
    id: string;
    name: string;
  };
  children: Array<{
    id: string;
    name: string;
  }>;
  collections: Array<{
    id: string;
    name: string;
  }>;
  _count: {
    products: number;
  };
};

export function CategoryTable() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all categories (both parent and child categories)
        const response = await fetch("/api/categories");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCategories(data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch categories";
        setError(errorMessage);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "order", desc: false }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [bulkActionLoading, setBulkActionLoading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'table' | 'tree'>('tree');

  const handleBulkChangeParent = async (newParentId: string | null) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;

    if (!confirm(`Change parent category for ${selectedRows.length} selected categories?`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const updatePromises = selectedRows.map(async (row) => {
        const category = row.original;
        const response = await fetch(`/api/categories/${category.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId: newParentId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update ${category.name}`);
        }

        return response.json();
      });

      await Promise.all(updatePromises);

      // Refresh categories
      const response = await fetch("/api/categories");
      const updatedCategories = await response.json();
      setCategories(updatedCategories);

      setRowSelection({});
      alert(`Successfully updated ${selectedRows.length} categories`);
    } catch (error) {
      console.error("Bulk update error:", error);
      alert("Failed to update some categories. Please try again.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const columns: ColumnDef<Category>[] = [
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
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "imageUrl",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl = row.getValue("imageUrl") as string;
        return imageUrl ? (
          <Image
            src={imageUrl}
            alt={row.original.name}
            width={48}
            height={48}
            className="h-12 w-12 object-cover rounded-md"
          />
        ) : (
          <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center">
            <Package className="h-4 w-4 text-gray-400" />
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{category.name}</span>
            <span className="text-sm text-gray-500">{category.slug}</span>
            {category.parent && (
              <span className="text-xs text-blue-600">
                Parent: {category.parent.name}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return description ? (
          <span className="text-sm text-gray-600 line-clamp-2 max-w-xs">
            {description}
          </span>
        ) : (
          <span className="text-sm text-gray-400">No description</span>
        );
      },
    },
    {
      accessorKey: "order",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.getValue("order")}
        </Badge>
      ),
    },
    {
      id: "hierarchy",
      header: "Hierarchy",
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex flex-col space-y-1">
            {category.children.length > 0 && (
              <div className="flex items-center text-sm text-green-600">
                <FolderOpen className="h-3 w-3 mr-1" />
                {category.children.length} subcategories
              </div>
            )}
            {category.collections.length > 0 && (
              <div className="flex items-center text-sm text-purple-600">
                <Package className="h-3 w-3 mr-1" />
                {category.collections.length} collections
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "products",
      header: "Products",
      cell: ({ row }) => {
        const productCount = row.original._count.products;
        return (
          <Badge variant={productCount > 0 ? "default" : "secondary"}>
            {productCount} products
          </Badge>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "destructive"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const category = row.original;

        const handleDelete = async () => {
          if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
            return;
          }

          try {
            const response = await fetch(`/api/categories/${category.id}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to delete category");
            }

            // Remove from local state
            setCategories(prev => prev.filter(cat => cat.id !== category.id));
          } catch (error) {
            console.error("Error deleting category:", error);
            alert(error instanceof Error ? error.message : "Failed to delete category");
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(category.id)}
              >
                Copy category ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Tree View Component
  const CategoryTreeNode = ({
    category,
    level = 0,
    allCategories
  }: {
    category: Category;
    level?: number;
    allCategories: Category[]
  }) => {
    const [isExpanded, setIsExpanded] = React.useState(level < 2);
    const children = allCategories.filter(cat => cat.parentId === category.id);

    return (
      <div>
        <div
          className={`flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg ${
            level > 0 ? 'ml-6 border-l border-gray-200 pl-4' : ''
          }`}
        >
          {children.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
            </Button>
          )}
          {children.length === 0 && <div className="w-6" />}

          <div className="flex items-center gap-3 flex-1">
            {category.imageUrl ? (
              <div className="h-8 w-8 relative">
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover rounded"
                />
              </div>
            ) : (
              <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                <Package className="h-4 w-4 text-gray-400" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{category.name}</span>
                <Badge variant="outline" className="text-xs">
                  {category._count.products} products
                </Badge>
                {category.collections.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {category.collections.length} collections
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">{category.description}</div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={category.isActive ? "default" : "destructive"} className="text-xs">
                {category.isActive ? "Active" : "Inactive"}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(category.id)}
                  >
                    Copy category ID
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
                        return;
                      }

                      try {
                        const response = await fetch(`/api/categories/${category.id}`, {
                          method: "DELETE",
                        });

                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.error || "Failed to delete category");
                        }

                        setCategories(prev => prev.filter(cat => cat.id !== category.id));
                      } catch (error) {
                        console.error("Error deleting category:", error);
                        alert(error instanceof Error ? error.message : "Failed to delete category");
                      }
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {isExpanded && children.map((child) => (
          <CategoryTreeNode
            key={child.id}
            category={child}
            level={level + 1}
            allCategories={allCategories}
          />
        ))}
      </div>
    );
  };

  const table = useReactTable({
    data: categories,
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

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error loading categories</div>
            <div className="text-sm text-gray-500">{error}</div>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
            <ProductCategorySheet
        categories={categories}
  onCategoryAdded={(newCategory) => {
    setCategories(prev => [...prev, newCategory]);
  }}
  categoryToEdit={editingCategory || undefined}
  onCategoryUpdated={(updatedCategory) => {
    setCategories(prev => prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
    setEditingCategory(null);
  }}
  onClose={() => setEditingCategory(null)}  />
      
      <div className="flex items-center py-4 space-x-4">
        <Input
          placeholder="Filter categories..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Total: {categories.length}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Active: {categories.filter(c => c.isActive).length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-3"
            >
              Table View
            </Button>
            <Button
              variant={viewMode === 'tree' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tree')}
              className="h-8 px-3"
            >
              Tree View
            </Button>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bulk Actions */}
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <span className="text-sm font-medium text-blue-900">
            {table.getFilteredSelectedRowModel().rows.length} categories selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkChangeParent(null)}
              disabled={bulkActionLoading}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              <Settings className="h-4 w-4 mr-2" />
              Make Top Level
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkActionLoading}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Change Parent
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Move to Parent Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories
                  .filter(cat => !cat.parentId) // Only show top-level categories
                  .filter(cat => !table.getFilteredSelectedRowModel().rows.some(row => row.original.id === cat.id)) // Exclude selected categories
                  .map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => handleBulkChangeParent(category.id)}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRowSelection({})}
              className="text-gray-600"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {viewMode === 'table' ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      <span className="ml-2">Loading categories...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={!row.original.isActive ? "opacity-60" : ""}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400 mb-2" />
                      <span>No categories found.</span>
                      <span className="text-sm text-gray-500 mt-1">
                        Create your first category to get started.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-md border bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading categories...</span>
            </div>
          ) : categories.filter(cat => !cat.parentId).length > 0 ? (
            <div className="p-4 space-y-2">
              {categories
                .filter(cat => !cat.parentId)
                .sort((a, b) => a.order - b.order)
                .map((category) => (
                  <CategoryTreeNode
                    key={category.id}
                    category={category}
                    allCategories={categories}
                  />
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <Package className="h-8 w-8 text-gray-400 mb-2" />
              <span>No categories found.</span>
              <span className="text-sm text-gray-500 mt-1">
                Create your first category to get started.
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 w-[70px] rounded border border-input px-3 py-1 text-sm"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {"<<"}
            </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {">>"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}