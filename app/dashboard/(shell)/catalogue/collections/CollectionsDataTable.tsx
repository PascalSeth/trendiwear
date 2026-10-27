"use client";

import * as React from "react";
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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Edit, Trash2, ImageIcon, Layers, Star, Plus, Eye, Sun } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import CollectionSheet from "@/app/dashboard/components/sheet/Collections/CollectionSheet";



type Collection = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  season?: "SPRING" | "SUMMER" | "FALL" | "WINTER" | "ALL_SEASON";
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;

  _count: {
    products: number;
  };
};

export function CollectionsTable() {
  const [collections, setCollections] = React.useState<Collection[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingCollection, setEditingCollection] = React.useState<Collection | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const columns: ColumnDef<Collection>[] = [
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
          <ImageIcon className="h-4 w-4 text-slate-400 font-light" />
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
    cell: ({ row }) => (
      <div className="min-w-0">
        <span className="font-semibold text-xs sm:text-[13px] text-slate-900 truncate block">{row.getValue("name")}</span>
        {row.original.description && (
          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{row.original.description}</p>
        )}
      </div>
    ),
  },

  {
    accessorKey: "season",
    header: "Season",
    cell: ({ row }) => {
      const season = row.getValue("season") as string;
      return season ? (
        <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0.5">
          {season.toLowerCase().replace('_', ' ')}
        </Badge>
      ) : (
        <span className="text-xs text-slate-400">-</span>
      );
    },
  },
  {
    accessorKey: "_count",
    header: "Products",
    cell: ({ row }) => (
      <span className="text-xs font-semibold text-slate-700">{row.original._count.products}</span>
    ),
  },
  {
    accessorKey: "isFeatured",
    header: "Featured",
    cell: ({ row }) => (
      <Badge variant={row.getValue("isFeatured") ? "default" : "secondary"} className="text-[10px] px-1.5 py-0.5 font-medium">
        {row.getValue("isFeatured") ? "Featured" : "Regular"}
      </Badge>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.getValue("isActive") ? "default" : "destructive"} className="text-[10px] px-1.5 py-0.5 font-medium">
        {row.getValue("isActive") ? "Active" : "Inactive"}
      </Badge>
    ),
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
    cell: ({ row }) => <span className="text-xs text-slate-600 font-mono">{row.getValue("order")}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const collection = row.original;

      const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${collection.name}"?`)) {
          return;
        }

        try {
          const response = await fetch(`/api/collections/${collection.id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete collection");
          }

          // Remove from local state
          setCollections(prev => prev.filter(col => col.id !== collection.id));
        } catch (error) {
          console.error("Error deleting collection:", error);
          alert(error instanceof Error ? error.message : "Failed to delete collection");
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-7 w-7 p-0 text-slate-400">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(collection.id)}
            >
              Copy collection ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              setEditingCollection(collection);
              setIsSheetOpen(true);
            }}>
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

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch collections
        const collectionsResponse = await fetch("/api/collections");
        if (!collectionsResponse.ok) {
          const errorData = await collectionsResponse.json();
          throw new Error(errorData.error || `HTTP error! status: ${collectionsResponse.status}`);
        }
        const collectionsData = await collectionsResponse.json();
        setCollections(collectionsData || []);



        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch data");
        setCollections([]);
        setCollections([]);
        toast.error(error instanceof Error ? error.message : "Failed to fetch data", {
          description: "Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCollectionAdded = (newCollection: Collection) => {
    setCollections((prev) => [...prev, newCollection]);
    toast.success("Collection added", {
      description: `Collection "${newCollection.name}" has been added to the table.`,
    });
  };

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: collections,
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
            <p className="text-red-500 mb-2">Error loading collections</p>
            <p className="text-sm text-gray-500">{error}</p>
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
    <div className="w-full space-y-4 sm:space-y-5">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Featured Catalog</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Featured Collections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Group your products into seasonal styles, new arrivals, and popular showcases.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            onClick={() => {
              setEditingCollection(null);
              setIsSheetOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Collection
          </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {[
          { label: "Total Collections", value: collections.length, icon: Layers, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Active Drops", value: collections.filter(c => c.isActive).length, icon: Eye, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Featured Frontpage", value: collections.filter(c => c.isFeatured).length, icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Spring/Summer", value: collections.filter(c => c.season === "SPRING" || c.season === "SUMMER").length, icon: Sun, color: "text-blue-600", bg: "bg-blue-50" },
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

      <CollectionSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setEditingCollection(null);
        }}
        hideTrigger={true}
        onCollectionAdded={handleCollectionAdded}
        collectionToEdit={editingCollection || undefined}
        onCollectionUpdated={(updatedCollection) => {
          setCollections(prev => prev.map(col => col.id === updatedCollection.id ? updatedCollection : col));
          setEditingCollection(null);
          setIsSheetOpen(false);
        }}
      />
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <Input
          placeholder="Filter collections..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-9 max-w-xs text-xs rounded-lg border-slate-200 bg-white"
        />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs px-2.5 sm:px-3">
                <span className="hidden sm:inline">Columns</span>
                <ChevronDown className="h-3.5 w-3.5 sm:ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize text-xs"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id === "_count" ? "Products" : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
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
                    <span className="ml-2 text-xs font-medium">Loading collections...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50/50 transition-colors"
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
                    <Layers className="h-9 w-9 text-slate-200 mb-2" />
                    <span className="font-bold text-sm text-slate-900">No collections found.</span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      Create your first collection to showcase your catalog.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Mobile Card View for Collections */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900 mx-auto mb-2"></div>
              <span className="text-xs font-medium text-slate-500">Loading collections...</span>
            </div>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const col = row.original;
              return (
                <div key={row.id} className="p-2.5 sm:p-3 space-y-2 hover:bg-slate-50 transition-colors overflow-hidden">
                  <div className="flex items-start justify-between gap-2.5 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {col.imageUrl ? (
                        <div className="h-9 w-9 shrink-0 relative rounded-lg overflow-hidden shadow-xs ring-1 ring-black/5">
                          <Image src={col.imageUrl} alt={col.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-9 w-9 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center ring-1 ring-black/5">
                          <ImageIcon className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 leading-tight truncate">{col.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">{col.slug}</p>
                      </div>
                    </div>
                    <Badge variant={col.isActive ? "default" : "destructive"} className="text-[9px] font-bold uppercase px-1.5 py-0.5 whitespace-nowrap shrink-0">
                      {col.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[9px] font-medium py-0 h-4.5 whitespace-nowrap shrink-0">
                        {col._count.products} Products
                      </Badge>
                      {col.season && (
                        <Badge variant="secondary" className="text-[9px] font-medium py-0 h-4.5 bg-blue-50 text-blue-600 border-blue-100 whitespace-nowrap shrink-0 capitalize">
                          {col.season.toLowerCase().replace('_', ' ')}
                        </Badge>
                      )}
                      {col.isFeatured && (
                        <Badge variant="secondary" className="text-[9px] font-medium py-0 h-4.5 bg-amber-50 text-amber-600 border-amber-100 whitespace-nowrap shrink-0">
                          Featured
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingCollection(col);
                          setIsSheetOpen(true);
                        }} 
                        className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl">
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(col.id)}>Copy ID</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={async () => {
                            if (confirm(`Delete "${col.name}"?`)) {
                              const res = await fetch(`/api/collections/${col.id}`, { method: 'DELETE' });
                              if (res.ok) setCollections(prev => prev.filter(c => c.id !== col.id));
                            }
                          }} className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <Layers className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="font-bold text-xs text-slate-900">No collections found</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 py-2">
        <div className="text-xs text-muted-foreground text-center sm:text-left">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex justify-center sm:justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 text-xs px-3"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 text-xs px-3"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}