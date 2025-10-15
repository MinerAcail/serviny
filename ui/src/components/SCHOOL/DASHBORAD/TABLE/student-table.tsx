"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Edit,
  Users,
  Trash2,
} from "lucide-react";
import type { Student } from "./student-dashboard";

interface StudentTableProps {
  students: Student[];
  onStudentClick: (student: Student) => void;
  onSort: (field: keyof Student) => void;
  sortField: keyof Student;
  sortDirection: "asc" | "desc";
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function StudentTable({
  students,
  onStudentClick,
  onSort,
  sortField,
  sortDirection,
  currentPage,
  totalPages,
  onPageChange,
}: StudentTableProps) {
  const getStatusColor = (status: Student["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Graduated":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: keyof Student;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(field)}
      className="h-auto p-0 font-semibold hover:bg-transparent"
    >
      {children}
      <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );

  const handleMenuAction = (
    action: string,
    student: Student,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent row click when menu is used

    switch (action) {
      case "view":
        onStudentClick(student);
        break;
      case "edit":
        console.log("Edit student:", student.name);
        break;
      case "parents":
        console.log("View parents for:", student.name);
        break;
      case "delete":
        console.log("Delete student:", student.name);
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border px-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Actions</TableHead>

              <TableHead>
                <SortButton field="id">Student ID</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="name">Student Name</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="grade">Grade/Class</SortButton>
              </TableHead>
              <TableHead>Parent Contact</TableHead>
              <TableHead>
                <SortButton field="status">Status</SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow
                key={student.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onStudentClick(student)}
              >
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem
                        onClick={(e) => handleMenuAction("view", student, e)}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleMenuAction("edit", student, e)}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Student
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleMenuAction("parents", student, e)}
                        className="cursor-pointer"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        View Parents
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleMenuAction("delete", student, e)}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Student
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="font-medium">{student.id}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.grade}</TableCell>
                <TableCell>{student.parentContact}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(student.status)}>
                    {student.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {students.length} of {students.length} students
        </p>
      </div>
    </div>
  );
}
