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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Edit, Trash2, Calendar } from "lucide-react";
import * as React from "react";
import Image from "next/image";

import EventSheet from "@/app/dashboard/components/sheet/Event/page";
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
  _count?: {
    outfitInspirations: number;
  };
};

export function EventsDataTable() {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingEvent, setEditingEvent] = React.useState<Event | null>(null);

  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/events");

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`);
        }

        const data = await response.json();
        setEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch events";
        setError(errorMessage);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "name", desc: false }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const columns: ColumnDef<Event>[] = [
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
            <Calendar className="h-4 w-4 text-gray-400" />
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
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
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
      id: "dressCodes",
      header: "Dress Codes",
      cell: ({ row }) => {
        const dressCodes = row.original.dressCodes;
        return (
          <div className="flex flex-wrap gap-1">
            {dressCodes.slice(0, 2).map((code, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {code}
              </Badge>
            ))}
            {dressCodes.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{dressCodes.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "seasonality",
      header: "Seasonality",
      cell: ({ row }) => {
        const seasonality = row.original.seasonality;
        return (
          <div className="flex flex-wrap gap-1">
            {seasonality.slice(0, 2).map((season, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {season}
              </Badge>
            ))}
            {seasonality.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{seasonality.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "outfitInspirations",
      header: "Outfits",
      cell: ({ row }) => {
        const count = row.original._count?.outfitInspirations || 0;
        return (
          <Badge variant={count > 0 ? "default" : "secondary"}>
            {count} outfits
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
        const event = row.original;

        const handleDelete = async () => {
          if (!confirm(`Are you sure you want to delete "${event.name}"?`)) {
            return;
          }

          try {
            const response = await fetch(`/api/events/${event.id}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to delete event");
            }

            // Remove from local state
            setEvents(prev => prev.filter(evt => evt.id !== event.id));
          } catch (error) {
            console.error("Error deleting event:", error);
            alert(error instanceof Error ? error.message : "Failed to delete event");
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
                onClick={() => navigator.clipboard.writeText(event.id)}
              >
                Copy event ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditingEvent(event)}>
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
    data: events,
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
            <div className="text-red-500 mb-2">Error loading events</div>
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
      <EventSheet
        onEventAdded={(newEvent) => {
          setEvents(prev => [...prev, newEvent]);
        }}
        eventToEdit={editingEvent || undefined}
        onEventUpdated={(updatedEvent) => {
          setEvents(prev => prev.map(evt => evt.id === updatedEvent.id ? updatedEvent : evt));
          setEditingEvent(null);
        }}
        onClose={() => setEditingEvent(null)}
      />

      <div className="flex items-center py-4 space-x-4">
        <Input
          placeholder="Filter events..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Total: {events.length}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Active: {events.filter(e => e.isActive).length}
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
                    <span className="ml-2">Loading events...</span>
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
                    <Calendar className="h-8 w-8 text-gray-400 mb-2" />
                    <span>No events found.</span>
                    <span className="text-sm text-gray-500 mt-1">
                      Create your first event to get started.
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