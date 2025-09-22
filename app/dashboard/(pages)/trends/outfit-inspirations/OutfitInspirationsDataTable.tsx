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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Edit, Trash2, Shirt, Heart, Star } from "lucide-react";
import * as React from "react";
import Image from "next/image";

import OutfitInspirationSheet, { type OutfitInspiration } from "@/app/dashboard/components/sheet/OutfitInspiration/OutfitInspirationSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type Event = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  dressCodes: string[];
  seasonality: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    outfitInspirations: number;
  };
};


export function OutfitInspirationsDataTable() {
  const [outfits, setOutfits] = React.useState<OutfitInspiration[]>([]);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingOutfit, setEditingOutfit] = React.useState<OutfitInspiration | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch outfit inspirations
        const outfitsResponse = await fetch("/api/outfit-inspirations");
        if (!outfitsResponse.ok) {
          throw new Error(`Failed to fetch outfit inspirations: ${outfitsResponse.statusText}`);
        }
        const outfitsData = await outfitsResponse.json();
        setOutfits(outfitsData.outfits || []);

        // Fetch events for the sheet
        const eventsResponse = await fetch("/api/events");
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setEvents(eventsData || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch data";
        setError(errorMessage);
        setOutfits([]);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const columns: ColumnDef<OutfitInspiration>[] = [
    {
      accessorKey: "outfitImageUrl",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl = row.getValue("outfitImageUrl") as string;
        return imageUrl ? (
          <Image
            src={imageUrl}
            alt={row.original.title}
            width={48}
            height={48}
            className="h-12 w-12 object-cover rounded-md"
          />
        ) : (
          <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center">
            <Shirt className="h-4 w-4 text-gray-400" />
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("title")}</div>
      ),
    },
    {
      accessorKey: "event.name",
      header: "Event",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.event.name}</Badge>
      ),
    },
    {
      accessorKey: "stylist",
      header: "Stylist",
      cell: ({ row }) => {
        const stylist = row.original.stylist;
        const name = `${stylist.firstName} ${stylist.lastName}`;
        const businessName = stylist.professionalProfile?.businessName;
        return (
          <div className="text-sm">
            <div className="font-medium">{name}</div>
            {businessName && (
              <div className="text-gray-500">{businessName}</div>
            )}
          </div>
        );
      },
    },
    {
      id: "products",
      header: "Products",
      cell: ({ row }) => {
        const products = row.original.products;
        return (
          <div className="flex flex-col space-y-1">
            <Badge variant="secondary" className="text-xs w-fit">
              {products.length} products
            </Badge>
            {products.length > 0 && (
              <div className="text-xs text-gray-500">
                Total: ${products.reduce((sum, p) => sum + p.product.price, 0).toFixed(2)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "tags",
      header: "Tags",
      cell: ({ row }) => {
        const tags = row.original.tags;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "likes",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <Heart className="h-4 w-4 mr-1" />
          Likes
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <Heart className="h-4 w-4 mr-1 text-red-500" />
          {row.getValue("likes")}
        </div>
      ),
    },
    {
      accessorKey: "isFeatured",
      header: "Featured",
      cell: ({ row }) => {
        const isFeatured = row.getValue("isFeatured") as boolean;
        return isFeatured ? (
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
        ) : null;
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
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as string;
        return (
          <div className="text-sm text-gray-500">
            {new Date(createdAt).toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const outfit = row.original;

        const handleDelete = async () => {
          if (!confirm(`Are you sure you want to delete "${outfit.title}"?`)) {
            return;
          }

          try {
            const response = await fetch(`/api/outfit-inspirations/${outfit.id}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to delete outfit inspiration");
            }

            // Remove from local state
            setOutfits(prev => prev.filter(o => o.id !== outfit.id));
          } catch (error) {
            console.error("Error deleting outfit inspiration:", error);
            alert(error instanceof Error ? error.message : "Failed to delete outfit inspiration");
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
                onClick={() => navigator.clipboard.writeText(outfit.id)}
              >
                Copy outfit ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditingOutfit(outfit)}>
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

  const table = useReactTable({
    data: outfits,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error loading outfit inspirations</div>
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
      <OutfitInspirationSheet
        events={events}
        onOutfitAdded={(newOutfit) => {
          setOutfits(prev => [...prev, newOutfit]);
        }}
        outfitToEdit={editingOutfit || undefined}
        onOutfitUpdated={(updatedOutfit) => {
          setOutfits(prev => prev.map(o => o.id === updatedOutfit.id ? updatedOutfit : o));
          setEditingOutfit(null);
        }}
        onClose={() => setEditingOutfit(null)}
      />

      <div className="flex items-center py-4 space-x-4">
        <Input
          placeholder="Filter outfit inspirations..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Total: {outfits.length}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Active: {outfits.filter(o => o.isActive).length}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Featured: {outfits.filter(o => o.isFeatured).length}
          </Badge>
        </div>

        <div className="flex items-center gap-2 ml-auto">
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
                    <span className="ml-2">Loading outfit inspirations...</span>
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
                    <Shirt className="h-8 w-8 text-gray-400 mb-2" />
                    <span>No outfit inspirations found.</span>
                    <span className="text-sm text-gray-500 mt-1">
                      Create your first outfit inspiration to get started.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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