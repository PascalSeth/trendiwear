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
import { ArrowUpDown, ChevronDown, FolderOpen, Package, MoreHorizontal, Edit, Trash2, Settings, Plus } from "lucide-react";
import * as React from "react";
import Image from "next/image";

import ProductCategorySheet from "@/app/dashboard/components/sheet/ProductCategory/ProductCategorySheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
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
          <div className="relative h-9 w-9 overflow-hidden rounded-lg">
            <Image
              src={imageUrl}
              alt={row.original.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center">
            <Package className="h-4 w-4 text-slate-400" />
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-semibold px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs sm:text-[13px] text-slate-900 truncate">{category.name}</span>
            <span className="text-[11px] text-slate-400 truncate">{category.slug}</span>
            {category.parent && (
              <span className="text-[10px] font-medium text-indigo-600 truncate">
                In: {category.parent.name}
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
          <span className="text-xs text-slate-500 line-clamp-1 max-w-xs">
            {description}
          </span>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        );
      },
    },
    {
      accessorKey: "order",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-semibold px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0.5">
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
          <div className="flex flex-col">
            {category.children.length > 0 ? (
              <div className="flex items-center text-xs font-medium text-emerald-600">
                <FolderOpen className="h-3 w-3 mr-1 shrink-0" />
                <span>{category.children.length} sub</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">-</span>
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
          <Badge variant={productCount > 0 ? "default" : "secondary"} className="text-[10px] px-1.5 py-0.5 font-medium">
            {productCount} items
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
          <Badge variant={isActive ? "default" : "destructive"} className="text-[10px] px-1.5 py-0.5 font-medium">
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
          className={`group flex items-center gap-2 p-2 hover:bg-slate-50 transition-colors rounded-xl overflow-hidden min-w-0 ${
            level > 0 ? `ml-0 border-l-2 border-slate-100 pl-2 sm:pl-6` : ''
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

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate text-xs sm:text-[13px]">{category.name}</span>
                <div className="flex items-center gap-1.5 whitespace-nowrap overflow-x-auto scrollbar-hide">
                  <Badge variant="outline" className="text-[9px] font-medium py-0 h-4 md:h-4.5 whitespace-nowrap shrink-0 px-1.5">
                    {category._count.products} Products
                  </Badge>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 truncate max-md:hidden">{category.description}</div>
            </div>

            <div className="flex items-center gap-1.5">
              <Badge variant={category.isActive ? "default" : "destructive"} className="text-[9px] font-bold uppercase px-1.5 py-0.5 whitespace-nowrap shrink-0 max-xs:hidden">
                {category.isActive ? "Active" : "Inactive"}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-7 w-7 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-3.5 w-3.5" />
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
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-5">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Product Taxonomy</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Categories &amp; Hierarchy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize product categories, parent/child taxonomy structures, and store display order.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            onClick={() => setEditingCategory({ id: '', name: '', slug: '', isActive: true, order: 0, children: [], _count: { products: 0 } } as Category)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add New Category
          </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {[
          { label: "Total Categories", value: categories.length, icon: FolderOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Active Listed", value: categories.filter(c => c.isActive).length, icon: Package, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Top-Level Parents", value: categories.filter(c => !c.parentId).length, icon: Settings, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Subcategories", value: categories.filter(c => c.parentId).length, icon: ArrowUpDown, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:border-indigo-300 transition-all">
            <div className={`p-2 sm:p-2.5 rounded-lg ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{stat.label}</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <ProductCategorySheet
        categories={categories}
        hideTrigger={true}
        onCategoryAdded={(newCategory) => {
          setCategories(prev => [...prev, newCategory]);
        }}
        categoryToEdit={editingCategory || undefined}
        onCategoryUpdated={(updatedCategory) => {
          setCategories(prev => prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
          setEditingCategory(null);
        }}
        onClose={() => setEditingCategory(null)} />

      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <Input
          placeholder="Search categories..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="w-full h-9 rounded-lg border-slate-200 focus:ring-blue-500 text-xs bg-white"
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 min-w-0">
             <Badge variant="outline" className="text-[9px] font-bold whitespace-nowrap shrink-0 px-1.5 py-0.5">
                Total: {categories.length}
             </Badge>
             <Badge variant="outline" className="text-[9px] font-bold whitespace-nowrap shrink-0 px-1.5 py-0.5">
                Active: {categories.filter(c => c.isActive).length}
             </Badge>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-white shadow-xs overflow-hidden min-w-0">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={`h-6.5 px-2 text-[9px] font-bold uppercase tracking-wider rounded ${viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className={`h-6.5 px-2 text-[9px] font-bold uppercase tracking-wider rounded ${viewMode === 'tree' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
              >
                Tree
              </Button>
            </div>

            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setEditingCategory({ id: '', name: '', slug: '', isActive: true, order: 0, children: [], _count: { products: 0 } } as Category)}
              className="bg-blue-600 hover:bg-blue-700 h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold shrink-0 items-center justify-center flex"
            >
              <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Add Category</span>
            </Button>
          </div>
        </div>
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
        <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <Table className="w-full hidden md:table">
            <TableHeader className="bg-slate-50/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-9 text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 sm:px-4 py-2">
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
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
                      <span className="ml-2 text-xs font-medium">Loading items...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={!row.original.isActive ? "opacity-60" : "hover:bg-slate-50/50 transition-colors"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs">
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
                    <div className="flex flex-col items-center justify-center py-12">
                      <Package className="h-9 w-9 text-slate-200 mb-2" />
                      <span className="font-bold text-sm text-slate-900">No categories found.</span>
                      <span className="text-xs text-slate-500 mt-0.5">
                        Create your first category to get started.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900 mx-auto mb-2"></div>
                <span className="text-xs font-medium text-slate-500">Loading categories...</span>
              </div>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const category = row.original;
                return (
                  <div key={row.id} className="p-2.5 sm:p-3 space-y-2 hover:bg-slate-50 transition-colors overflow-hidden">
                    <div className="flex items-start justify-between gap-2.5 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {category.imageUrl ? (
                          <div className="h-9 w-9 shrink-0 relative rounded-lg overflow-hidden shadow-xs ring-1 ring-black/5">
                            <Image src={category.imageUrl} alt={category.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="h-9 w-9 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center ring-1 ring-black/5">
                            <Package className="h-4 w-4 text-slate-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 leading-tight truncate">{category.name}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">{category.slug}</p>
                        </div>
                      </div>
                      <Badge variant={category.isActive ? "default" : "destructive"} className="text-[9px] font-bold uppercase px-1.5 py-0.5 whitespace-nowrap shrink-0">
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[9px] font-medium py-0 h-4.5 whitespace-nowrap shrink-0">
                          {category._count.products} Products
                        </Badge>
                        {category.parent && (
                          <Badge variant="secondary" className="text-[9px] font-medium py-0 h-4.5 bg-blue-50 text-blue-600 border-blue-100 whitespace-nowrap shrink-0">
                            In: {category.parent.name}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setEditingCategory(category)} className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl">
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(category.id)}>Copy ID</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              if (confirm(`Delete "${category.name}"?`)) {
                                fetch(`/api/categories/${category.id}`, { method: 'DELETE' })
                                  .then(() => setCategories(prev => prev.filter(c => c.id !== category.id)));
                              }
                            }} className="text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center">
                <Package className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="font-bold text-xs text-slate-900">No categories found</p>
              </div>
            )}
          </div>
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
        <div className="flex-1 text-xs md:text-sm text-muted-foreground text-center sm:text-left">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <div className="flex items-center space-x-2">
            <p className="text-xs md:text-sm font-medium hidden sm:block">Rows per page</p>
            <p className="text-xs md:text-sm font-medium sm:hidden">Rows:</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 w-[60px] md:w-[70px] rounded border border-input px-2 md:px-3 py-1 text-xs md:text-sm"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-center text-xs md:text-sm font-medium min-w-[80px] md:min-w-[100px]">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-1 md:space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="hidden md:flex"
            >
              {"<<"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="text-xs md:text-sm"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="hidden md:flex"
            >
              {">>"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}