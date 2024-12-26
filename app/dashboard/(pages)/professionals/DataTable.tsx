"use client";

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ProfessionalCategorySheet from "../../components/sheet/ProfessionalCategory/page";

type People = {
  name: string;
  imageUrl: string,
  jobTitle: string;
  department: string;
  site: string;
  salary: string;
  startDate: string;
  lifecycle: string;
  status: string;
};

const data: People[] = [
  {
    name: "Anatoly Belik",
    imageUrl: 'https://i.pinimg.com/236x/03/eb/d6/03ebd625cc0b9d636256ecc44c0ea324.jpg',
    jobTitle: "Head of Design",
    department: "Product",
    site: "Stockholm",
    salary: "$1,350",
    startDate: "Mar 13, 2023",
    lifecycle: "Hired",
    status: "Invited",
  },
  {
    name: "Ksenia Bator",
    imageUrl: 'https://i.pinimg.com/236x/03/eb/d6/03ebd625cc0b9d636256ecc44c0ea324.jpg',
    jobTitle: "Fullstack Engineer",
    department: "Engineering",
    site: "Miami",
    salary: "$1,500",
    startDate: "Oct 13, 2023",
    lifecycle: "Hired",
    status: "Absent",
  },
  {
    name: "Bogdan Niktin",
    imageUrl: 'https://i.pinimg.com/236x/03/eb/d6/03ebd625cc0b9d636256ecc44c0ea324.jpg',
    jobTitle: "Mobile Lead",
    department: "Product",
    site: "Kyiv",
    salary: "$2,600",
    startDate: "Nov 4, 2023",
    lifecycle: "Employed",
    status: "Absent",
  },
  {
    name: "Arsen Yatsenko",
    imageUrl: 'https://i.pinimg.com/236x/03/eb/d6/03ebd625cc0b9d636256ecc44c0ea324.jpg',
    jobTitle: "Sales Manager",
    department: "Operations",
    site: "Ottawa",
    salary: "$900",
    startDate: "Sep 4, 2024",
    lifecycle: "Employed",
    status: "Invited",
  },
  {
    name: "Daria Yurchenko",
    imageUrl: 'https://i.pinimg.com/236x/03/eb/d6/03ebd625cc0b9d636256ecc44c0ea324.jpg',
    jobTitle: "Network Engineer",
    department: "IT",
    site: "Sao Paulo",
    salary: "$1,700",
    startDate: "Feb 21, 2023",
    lifecycle: "Hired",
    status: "Absent",
  },
];

export const columns: ColumnDef<People>[] = [
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
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <img
          src={row.original.imageUrl}
          alt={row.getValue("name")}
          className="h-8 w-8 rounded-full object-cover"
        />
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "jobTitle",
    header: "Job Title",
    cell: ({ row }) => row.getValue("jobTitle"),
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => row.getValue("department"),
  },
  {
    accessorKey: "site",
    header: "Site",
    cell: ({ row }) => row.getValue("site"),
  },
  {
    accessorKey: "salary",
    header: "Salary",
    cell: ({ row }) => row.getValue("salary"),
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => row.getValue("startDate"),
  },
  {
    accessorKey: "lifecycle",
    header: "Lifecycle",
    cell: ({ row }) => row.getValue("lifecycle"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`rounded-full px-3 py-1 text-sm font-medium border border-transparent ${
          row.getValue("status") === "Invited"
            ? "bg-blue-100 text-blue-700"
            : row.getValue("status") === "Absent"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        {row.getValue("status")}
      </span>
    ),
  },
];

export function ProfessionalsDataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredData = data.filter((person) =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-yellow-50 to-gray-400 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
                <h1 className="font-medium text-3xl">Professionals</h1>
    <ProfessionalCategorySheet/>
      </div>
          {/* Header Metrics */}
          <div className="grid grid-cols-4 items-center gap-4 mb-6">
        <div className="w-full">
          <h2 className="text-lg font-medium">Interviews</h2>
          <div className="bg-gray-200 w-full h-8 rounded-full overflow-hidden">
            <div className="bg-black w-[25%] h-full"></div>
          </div>
          <p className="text-gray-700">25%</p>
        </div>
        <div className="w-full">
          <h2 className="text-lg font-medium">Hired</h2>
          <div className="bg-gray-200 w-full h-8 rounded-full overflow-hidden">
            <div className="bg-yellow-500 w-[51%] h-full"></div>
          </div>
          <p className="text-gray-700">51%</p>
        </div>
        <div className="w-full">
          <h2 className="text-lg font-medium">Project Time</h2>
          <div className="bg-gray-200 w-full h-8 rounded-full overflow-hidden">
            <div className="bg-gray-500 w-[100%] h-full"></div>
          </div>
          <p className="text-gray-700">100%</p>
        </div>
        <div className="w-full">
          <h2 className="text-lg font-medium">Output</h2>
          <div className="bg-gray-200 w-full h-8 rounded-full overflow-hidden">
            <div className="bg-gray-400 w-[14%] h-full"></div>
          </div>
          <p className="text-gray-700">14%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search People"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-72 border-gray-300 shadow-sm rounded-lg"
        />
        <div className="flex gap-4">
          <Select>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="it">IT</SelectItem>
            </SelectContent>
          </Select>
          <Select>
          <SelectTrigger className="w-36">
              <SelectValue placeholder="Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stockholm">Stockholm</SelectItem>
              <SelectItem value="miami">Miami</SelectItem>
              <SelectItem value="kyiv">Kyiv</SelectItem>
              <SelectItem value="ottawa">Ottawa</SelectItem>
              <SelectItem value="sao-paulo">Sao Paulo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="shadow-sm">
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-gray-700">
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2">
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
                  <TableCell colSpan={columns.length} className="text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
        </CardContent>
      </Card>
    </div>
  );
}
