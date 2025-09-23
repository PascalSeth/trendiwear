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
import { ShoppingBag, ShoppingBasket, Truck, Eye, Package } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define the Order data type based on Prisma schema
type Order = {
  id: string;
  customerId: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    size?: string;
    color?: string;
    price: number;
    product: {
      name: string;
      images: string[];
    };
  }>;
  deliveryConfirmation?: {
    status: string;
  };
  paymentEscrow?: {
    status: string;
  };
};
  

export const columns: ColumnDef<Order>[] = [
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
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }: { row: { getValue: (key: string) => unknown; original: Order } }) => (
      <div className="font-medium text-sm">#{(row.getValue("id") as string).slice(-8)}</div>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }: { row: { getValue: (key: string) => unknown; original: Order } }) => (
      <div className="flex items-center space-x-2 md:space-x-3">
        <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs md:text-sm">
          {row.original.customer.firstName[0]}{row.original.customer.lastName[0]}
        </div>
        <div>
          <div className="font-medium text-sm">
            {row.original.customer.firstName} {row.original.customer.lastName}
          </div>
          <div className="text-xs md:text-sm text-gray-500 hidden sm:block">{row.original.customer.email}</div>
        </div>
      </div>
    ),
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }: { row: { getValue: (key: string) => unknown; original: Order } }) => (
      <div className="space-y-1 hidden md:block">
        {row.original.items.slice(0, 2).map((item: Order['items'][0], index: number) => (
          <div key={index} className="text-sm">
            {item.quantity}x {item.product.name}
          </div>
        ))}
        {row.original.items.length > 2 && (
          <div className="text-xs text-gray-500">
            +{row.original.items.length - 2} more items
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "totalPrice",
    header: "Total",
    cell: ({ row }: { row: { getValue: (key: string) => unknown; original: Order } }) => (
      <div className="font-medium text-sm md:text-base">${(row.getValue("totalPrice") as number).toFixed(2)}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: { getValue: (key: string) => unknown; original: Order } }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "DELIVERED" ? "default" :
            status === "SHIPPED" ? "secondary" :
            status === "PROCESSING" ? "outline" :
            status === "PENDING" ? "outline" :
            status === "CANCELLED" ? "destructive" :
            "default"
          }
          className="text-xs"
        >
          {status.length > 10 ? status.substring(0, 8) + '...' : status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }: { row: { getValue: (key: string) => unknown; original: Order } }) => {
      const status = row.getValue("paymentStatus") as string;
      return (
        <Badge
          variant={
            status === "PAID" ? "default" :
            status === "PENDING" ? "outline" :
            status === "FAILED" ? "destructive" :
            "secondary"
          }
          className="text-xs hidden sm:inline-flex"
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }: { row: { getValue: (key: string) => unknown; original: Order } }) => (
      <div className="text-xs md:text-sm hidden md:block">
        {new Date(row.getValue("createdAt") as string).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
];

type OrdersDataTableProps = {
  initialData?: Order[];
};

function OrdersDataTable({ initialData }: OrdersDataTableProps) {
  const [data, setData] = useState<Order[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Fetch orders data
  useEffect(() => {
    if (!initialData) {
      fetchOrders();
    }
  }, [initialData]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders?page=1&limit=50');
      if (response.ok) {
        const result = await response.json();
        setData(result.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleStatusFilter = (status: string) => {
    if (status === "All") {
      setColumnFilters((filters) =>
        filters.filter((filter) => filter.id !== "status")
      );
    } else {
      setColumnFilters([
        {
          id: "status",
          value: status,
        },
      ]);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">
            Manage and track all your customer orders
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{data.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.filter(order => order.status === "DELIVERED").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.filter(order => order.status === "PROCESSING").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ShoppingBasket className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.filter(order => order.status === "CANCELLED").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {["All", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => handleStatusFilter(status)}
              className="text-xs md:text-sm"
            >
              {status === "All" ? status : status.charAt(0) + status.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-0 sm:space-x-2 py-4">
        <div className="flex-1 text-xs md:text-sm text-muted-foreground text-center sm:text-left">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} order(s) selected.
        </div>
        <div className="flex justify-center sm:justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-xs md:text-sm"
          >
            Previous
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
        </div>
      </div>
    </div>
  );
}

export default OrdersDataTable;
