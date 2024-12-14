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
import { ShoppingBag, ShoppingBasket, Truck } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Order = {
    name: string;
    price: number;
    status: "Processed" | "Delivered" | "Completed" | "Returned" | "Cancelled";
    imageUrl: string;
  };
  
  const data: Order[] = [
    {
      name: "Sports Jacket",
      price: 120.99,
      status: "Processed",
      imageUrl: "https://www.paperplane.shop/cdn/shop/products/Paperplanes642ae447019e89642ae44701c76.93627729642ae44701c76.jpg?v=1680532702&width=1920",
    },
    {
      name: "Black T-Shirt",
      price: 64.99,
      status: "Processed",
      imageUrl: "data:image/jpeg;base64,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",
    },
    {
      name: "White Hoodie",
      price: 90.99,
      status: "Processed",
      imageUrl: "https://www.paperplane.shop/cdn/shop/products/Paperplanes642ae447019e89642ae44701c76.93627729642ae44701c76.jpg?v=1680532702&width=1920",
    },
    {
      name: "Black Boots",
      price: 110.99,
      status: "Delivered",
      imageUrl: "https://www.paperplane.shop/cdn/shop/products/Paperplanes642ae447019e89642ae44701c76.93627729642ae44701c76.jpg?v=1680532702&width=1920",
    },
    {
      name: "Black Jeans",
      price: 85.99,
      status: "Delivered",
      imageUrl: "https://www.paperplane.shop/cdn/shop/products/Paperplanes642ae447019e89642ae44701c76.93627729642ae44701c76.jpg?v=1680532702&width=1920",
    },
    {
      name: "Grey Backpack",
      price: 80.99,
      status: "Completed",
      imageUrl: "https://www.paperplane.shop/cdn/shop/products/Paperplanes642ae447019e89642ae44701c76.93627729642ae44701c76.jpg?v=1680532702&width=1920",
    },
    {
      name: "Fragrance Perfume",
      price: 230.99,
      status: "Completed",
      imageUrl: "https://www.paperplane.shop/cdn/shop/products/Paperplanes642ae447019e89642ae44701c76.93627729642ae44701c76.jpg?v=1680532702&width=1920rfume",
    },
    {
      name: "Beauty Body Wash",
      price: 10.99,
      status: "Completed",
      imageUrl: "https://www.paperplane.shop/cdn/shop/products/Paperplanes642ae447019e89642ae44701c76.93627729642ae44701c76.jpg?v=1680532702&width=1920",
    },
    {
      name: "Damaged Shoes",
      price: 50.99,
      status: "Returned",
      imageUrl: "https://www.paperplane.shop/cdn/shop/products/Paperplanes642ae447019e89642ae44701c76.93627729642ae44701c76.jpg?v=1680532702&width=1920",
    },
    {
      name: "Out of Stock Item",
      price: 0,
      status: "Cancelled",
      imageUrl: "https://www.paperplane.shop/cdn/shop/products/Paperplanes642ae447019e89642ae44701c76.93627729642ae44701c76.jpg?v=1680532702&width=1920",
    },
  ];
  

const columns: ColumnDef<Order>[] = [
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
    header: "Name",
    cell: ({ row }) => 
    
    <div className="flex items-center">
        <img src={row.original.imageUrl} alt={row.getValue("name")} className="w-12 h-12 rounded-full mr-2" />
        {row.getValue("name")}</div>,
  },
  {
    accessorKey: "price",
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 text-sm rounded-lg text-white ${
          row.getValue("status") === "Processed"
            ? "bg-yellow-500"
            : row.getValue("status") === "Delivered"
            ? "bg-blue-500"
            : row.getValue("status") === "Completed"
            ? "bg-green-500"
            : row.getValue("status") === "Returned"
            ? "bg-red-500"
            : "bg-gray-500"
        }`}
      >
        {row.getValue("status")}
      </span>
    ),
  },
];

function OrdersDataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    {}
  );
  const [rowSelection, setRowSelection] = React.useState({});

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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <p className="text-gray-600">Organize all the ordered products</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white flex items-center p-4 rounded-lg shadow-md ">
          <ShoppingBag/>
            <div className="ml-3">
               <h2 className="text-gray-600">Total orders</h2>
          <p className="text-2xl font-bold text-gray-800">579</p> 
          </div>
        </div>
        <div className="bg-white flex items-center p-4 rounded-lg shadow-md ">
          <Truck/>
            <div className="ml-3">
               <h2 className="text-gray-600">Delivered</h2>
          <p className="text-2xl font-bold text-gray-800">59</p> 
          </div>
        </div>
        <div className="bg-white flex items-center p-4 rounded-lg shadow-md ">
          <ShoppingBasket/>
            <div className="ml-3">
               <h2 className="text-gray-600">Returns</h2>
          <p className="text-2xl font-bold text-gray-800">9</p> 
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 py-4">
        {[
          "All",
          "Completed",
          "Processed",
          "Delivered",
          "Returned",
          "Cancelled",
        ].map((status) => (
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

      {/* Table */}
      <div className="bg-white shadow-md rounded-lg">
        <Table>
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
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
    </div>
  );
}

export default OrdersDataTable;
