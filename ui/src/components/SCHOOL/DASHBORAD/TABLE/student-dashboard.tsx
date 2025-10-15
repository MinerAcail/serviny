"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentTable } from "./student-table";
import { StudentModal } from "./student-modal";
import {
  Plus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface Student {
  id: string;
  name: string;
  grade: string;
  age: number;
  parentName: string;
  parentContact: string;
  address: string;
  enrollmentDate: string;
  status: "Active" | "Graduated" | "Inactive";
}

// Mock student data
const mockStudents: Student[] = [
  {
    id: "STU001",
    name: "Emma Johnson",
    grade: "Grade 10",
    age: 15,
    parentName: "Sarah Johnson",
    parentContact: "(555) 123-4567",
    address: "123 Oak Street, Springfield, IL 62701",
    enrollmentDate: "2023-08-15",
    status: "Active",
  },
  {
    id: "STU002",
    name: "Liam Smith",
    grade: "Grade 9",
    age: 14,
    parentName: "Michael Smith",
    parentContact: "(555) 234-5678",
    address: "456 Pine Avenue, Springfield, IL 62702",
    enrollmentDate: "2023-08-16",
    status: "Active",
  },
  {
    id: "STU003",
    name: "Olivia Brown",
    grade: "Grade 11",
    age: 16,
    parentName: "Jennifer Brown",
    parentContact: "(555) 345-6789",
    address: "789 Maple Drive, Springfield, IL 62703",
    enrollmentDate: "2022-08-20",
    status: "Active",
  },
  {
    id: "STU004",
    name: "Noah Davis",
    grade: "Grade 12",
    age: 17,
    parentName: "David Davis",
    parentContact: "(555) 456-7890",
    address: "321 Elm Street, Springfield, IL 62704",
    enrollmentDate: "2021-08-18",
    status: "Active",
  },
  {
    id: "STU005",
    name: "Ava Wilson",
    grade: "Grade 10",
    age: 15,
    parentName: "Lisa Wilson",
    parentContact: "(555) 567-8901",
    address: "654 Cedar Lane, Springfield, IL 62705",
    enrollmentDate: "2023-08-17",
    status: "Active",
  },
  {
    id: "STU006",
    name: "William Garcia",
    grade: "Grade 9",
    age: 14,
    parentName: "Carlos Garcia",
    parentContact: "(555) 678-9012",
    address: "987 Birch Road, Springfield, IL 62706",
    enrollmentDate: "2023-08-19",
    status: "Active",
  },
  {
    id: "STU007",
    name: "Sophia Martinez",
    grade: "Grade 11",
    age: 16,
    parentName: "Maria Martinez",
    parentContact: "(555) 789-0123",
    address: "147 Walnut Street, Springfield, IL 62707",
    enrollmentDate: "2022-08-22",
    status: "Active",
  },
  {
    id: "STU008",
    name: "James Anderson",
    grade: "Grade 12",
    age: 17,
    parentName: "Robert Anderson",
    parentContact: "(555) 890-1234",
    address: "258 Cherry Avenue, Springfield, IL 62708",
    enrollmentDate: "2021-08-25",
    status: "Graduated",
  },
  {
    id: "STU009",
    name: "Isabella Taylor",
    grade: "Grade 10",
    age: 15,
    parentName: "Amanda Taylor",
    parentContact: "(555) 901-2345",
    address: "369 Hickory Drive, Springfield, IL 62709",
    enrollmentDate: "2023-08-21",
    status: "Active",
  },
  {
    id: "STU010",
    name: "Benjamin Thomas",
    grade: "Grade 9",
    age: 14,
    parentName: "Christopher Thomas",
    parentContact: "(555) 012-3456",
    address: "741 Ash Lane, Springfield, IL 62710",
    enrollmentDate: "2023-08-23",
    status: "Active",
  },
  {
    id: "STU011",
    name: "Mia Jackson",
    grade: "Grade 11",
    age: 16,
    parentName: "Michelle Jackson",
    parentContact: "(555) 123-4567",
    address: "852 Poplar Street, Springfield, IL 62711",
    enrollmentDate: "2022-08-24",
    status: "Active",
  },
  {
    id: "STU012",
    name: "Lucas White",
    grade: "Grade 12",
    age: 17,
    parentName: "Steven White",
    parentContact: "(555) 234-5678",
    address: "963 Sycamore Road, Springfield, IL 62712",
    enrollmentDate: "2021-08-26",
    status: "Active",
  },
];

export function StudentDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Student>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const studentsPerPage = 7;

  // Filter students based on search term
  const filteredStudents = mockStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Paginate students
  const totalPages = Math.ceil(sortedStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const paginatedStudents = sortedStudents.slice(
    startIndex,
    startIndex + studentsPerPage
  );

  const handleSort = (field: keyof Student) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="container mx-auto p-6 mt-12 space-y-6">
      {/* Header */}
      {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
          <p className="text-muted-foreground">Manage and view student information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add New Student
          </Button>
        </div>
      </div> */}

      {/* Search Bar */}

      {/* Students Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <CardTitle>Students ({filteredStudents.length})</CardTitle>

          <div className=" flex flex-col sm:flex-row sm:justify-between gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, ID, or grade..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StudentTable
            students={paginatedStudents}
            onStudentClick={setSelectedStudent}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
