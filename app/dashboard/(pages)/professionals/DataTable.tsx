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
import { ChevronDown, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ProfessionalCategorySheet from "../../components/sheet/ProfessionalCategory/page";

// Define the Professional data type
type Professional = {
  id: string;
  userId: string;
  professionId: string;
  businessName: string;
  isBusiness: boolean;
  experience: number;
  bio: string | null;
  portfolioUrl: string | null;
  location: string;
  availability: string | null;
  isVerified: boolean;
  rating: number;
  createdAt: string;
  updatedAt: string;
  hasStore: boolean;
  socialMedia: string[];
  documents: string[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  profession: {
    id: string;
    name: string;
    imageUrl: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
  store: []; // Assuming the store array can contain various objects or be empty
};

// Define the Metrics type
type Metrics = {
  total: number;       // Total number of professionals
  verified: number;    // Count of verified professionals
  hasStores: number;   // Count of professionals with stores
  business: number;    // Count of professionals who are a business
};


const columns: ColumnDef<Professional>[] = [
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
    accessorKey: "businessName",
    header: "Business Name",
    cell: ({ row }) => row.getValue("businessName"),
  },
  {
    accessorKey: "experience",
    header: "Experience",
    cell: ({ row }) => <div className="text-right">{row.getValue("experience")}</div>,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => <div className="text-right">{row.getValue("location")}</div>,
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => <div className="text-right">{row.getValue("rating")}</div>,
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.businessName)}>
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function ProfessionalsDataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [data, setData] = React.useState<Professional[]>([]);
  const [metrics, setMetrics] = React.useState<Metrics>();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/GET/getProfessionals");
        const result = await response.json();
      // Set the professionals data
      setData(result.professionals);

      // Set the metrics data
      setMetrics(result.metrics);      } catch (error) {
        console.error("Error fetching professionals:", error);
      }
    };

    fetchData();
  }, []);

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

  const handleFilter = (status: string) => {
    if (status === "All") {
      setColumnFilters((filters) => filters.filter((filter) => filter.id !== "status"));
    } else {
      setColumnFilters([
        {
          id: "status",
          value: status,
        },
      ]);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-yellow-50 to-gray-400 rounded-lg shadow-lg">
  <div className="bg-gradient-to-r from-blue-100 to-blue-300 p-6 rounded-lg shadow-lg mb-6">
  <div className="grid grid-cols-4 gap-4">
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold">{metrics?.total}</span>
      <span className="text-sm text-gray-700">Total</span>
    </div>
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold">{metrics?.verified}</span>
      <span className="text-sm text-gray-700">Verified</span>
    </div>
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold">{metrics?.hasStores}</span>
      <span className="text-sm text-gray-700">Has Stores</span>
    </div>
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold">{metrics?.business}</span>
      <span className="text-sm text-gray-700">Business</span>
    </div>
  </div>
</div>


     
     <ProfessionalCategorySheet/>
      <div className="mb-6 flex items-center gap-4">
        {/* Email Filter */}
        <Input
          placeholder="Filter products..."
          value={(table.getColumn("businessName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("businessName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        {/* Status Filter */}
        <div className="flex items-center space-x-4 py-4">
          {["All", "Active", "Disabled"].map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => handleFilter(status)}
            >
              {status}
            </Button>
          ))}
        </div>
        {/* Columns Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
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
                  onCheckedChange={(value) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
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
      </div>
    </div>
  );
}
