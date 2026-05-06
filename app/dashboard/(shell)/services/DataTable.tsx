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
import { MoreHorizontal, Eye, Edit, Trash2, Home, Clock, DollarSign, Layers } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";

import ServiceSheet, { type Service } from "@/app/dashboard/components/sheet/Service/ServiceSheet";
import { VariantSheet } from "@/app/components/services/VariantSheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

// Define the Service data type based on Prisma schema
type ServiceCategory = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    services: number;
  };
};

const getColumns = (
  setData: React.Dispatch<React.SetStateAction<Service[]>>,
  setEditingService: React.Dispatch<React.SetStateAction<Service | null>>,
  setVariantsService: React.Dispatch<React.SetStateAction<Service | null>>
): ColumnDef<Service>[] => [
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
    header: "Service",
    cell: ({ row }) => (
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
          {row.original.name[0].toUpperCase()}
        </div>
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-sm text-gray-500">{row.original.category.name}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <div className="font-medium flex items-center">
        <DollarSign className="w-4 h-4 mr-1" />
        GHS {row.getValue("price")}
      </div>
    ),
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => (
      <div className="flex items-center text-sm">
        <Clock className="w-4 h-4 mr-1" />
        {row.getValue("duration")} min
      </div>
    ),
  },
  {
    id: "variants",
    header: "Variants",
    cell: ({ row }) => {
      const variants = row.original.variants || [];
      return (
        <Badge variant="outline" className="flex items-center gap-1 w-fit">
          <Layers className="w-3 h-3" />
          {variants.length} tier{variants.length !== 1 ? 's' : ''}
        </Badge>
      );
    },
  },
  {
    id: "serviceType",
    header: "Type",
    cell: ({ row }) => (
      <div className="flex items-center">
        {row.original.isHomeService ? (
          <Badge variant="outline" className="flex items-center">
            <Home className="w-3 h-3 mr-1" />
            Home Service
          </Badge>
        ) : (
          <Badge variant="secondary">In-Store</Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "_count.bookings",
    header: "Bookings",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original._count.bookings}
      </Badge>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Visibility",
    cell: ({ row }) => {
      const service = row.original;
      const toggleActive = async () => {
        try {
          const response = await fetch(`/api/services/${service.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !service.isActive }),
          });
          if (response.ok) {
            const updated = await response.json();
            setData((prev) => prev.map((s) => s.id === service.id ? { ...s, isActive: updated.isActive } : s));
          }
        } catch (error) {
          console.error('Failed to toggle status:', error);
        }
      };

      return (
        <div className="flex items-center space-x-3">
          <Switch
            checked={row.original.isActive}
            onCheckedChange={toggleActive}
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
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const service = row.original;

      const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${service.name}"?`)) {
          return;
        }

        try {
          const response = await fetch(`/api/services/${service.id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete service");
          }

          setData((prev: Service[]) => prev.filter((s: Service) => s.id !== service.id));
        } catch (error) {
          console.error("Error deleting service:", error);
          alert(error instanceof Error ? error.message : "Failed to delete service");
        }
      };

      return (
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
            <DropdownMenuItem onClick={() => setEditingService(service)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Service
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVariantsService(service)}>
              <Layers className="mr-2 h-4 w-4" />
              Manage Variants
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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


type ServicesDataTableProps = {
  initialData?: Service[];
};

function ServicesDataTable({ initialData }: ServicesDataTableProps) {
  const [data, setData] = useState<Service[]>(initialData || []);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(!initialData);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [variantsService, setVariantsService] = useState<Service | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  useEffect(() => {
    if (!initialData) {
      fetchServices();
    }
    fetchCategories();
  }, [initialData]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/services?page=1&limit=50&dashboard=true');
      if (response.ok) {
        const result = await response.json();
        setData(result.services || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/service-categories');
      if (response.ok) {
        const result = await response.json();
        setCategories(result || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const columns = getColumns(setData, setEditingService, setVariantsService);

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
    return (
      <div className="space-y-8 pt-4">
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <div className="h-10 bg-gray-50 rounded-lg w-64 animate-pulse"></div>
            <div className="h-5 bg-gray-50 rounded-lg w-96 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-50 border border-gray-100 rounded-3xl animate-pulse"></div>
          ))}
        </div>
        <div className="h-20 bg-gray-50 border border-gray-100 rounded-3xl animate-pulse"></div>
        <div className="border border-gray-100 rounded-3xl overflow-hidden">
          <div className="h-12 bg-gray-50/50 animate-pulse"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 border-t border-gray-50 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

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

  return (
    <div className="w-full space-y-8 pb-10">
      <ServiceSheet
        categories={categories}
        onServiceAdded={(newService) => {
          setData(prev => [...prev, newService]);
        }}
        serviceToEdit={editingService || undefined}
        onServiceUpdated={(updatedService) => {
          setData(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
          setEditingService(null);
        }}
        onClose={() => setEditingService(null)}
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Service Catalog</h1>
          <p className="text-gray-500 font-medium">
            Manage your service offerings, pricing, and availability.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Services", value: data.length, icon: Layers, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Live", value: data.filter(s => s.isActive).length, icon: Eye, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Home Services", value: data.filter(s => s.isHomeService).length, icon: Home, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Total Bookings", value: data.reduce((t, s) => t + s._count.bookings, 0), icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
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
              <Input
                placeholder="Search services by name, category..."
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="pl-4 bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-xl h-11"
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
                      <p className="text-gray-500 font-medium text-lg">No services found</p>
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

      {/* Variant Management Sheet */}
      {variantsService && (
        <VariantSheet
          isOpen={!!variantsService}
          serviceId={variantsService.id}
          serviceName={variantsService.name}
          existingVariants={variantsService.variants || []}
          onClose={() => setVariantsService(null)}
          onSuccess={() => {
            // Refresh the service data
            fetchServices();
          }}
        />
      )}
    </div>
  );
}

export default ServicesDataTable;