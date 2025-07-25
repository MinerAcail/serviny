"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
// import { UserForm } from "@/components/user-form"
import { Badge } from "@/components/ui/badge"
import { UserForm } from "../components/user/user-form"

type User = {
  id: string
  name: string
  email: string
  phone: string
  status: "Active" | "Inactive" | "Suspended"
  otherDetails: string
}

const initialUsers: User[] = [
  {
    id: "u1",
    name: "Emily White",
    email: "emily.w@example.com",
    phone: "999-888-7777",
    status: "Active",
    otherDetails: "Frequent user, premium subscription.",
  },
  {
    id: "u2",
    name: "David Green",
    email: "david.g@example.com",
    phone: "666-555-4444",
    status: "Inactive",
    otherDetails: "Last login 3 months ago.",
  },
  {
    id: "u3",
    name: "Sarah Black",
    email: "sarah.b@example.com",
    phone: "333-222-1111",
    status: "Suspended",
    otherDetails: "Account suspended due to policy violation.",
  },
  {
    id: "u4",
    name: "Michael Blue",
    email: "michael.b@example.com",
    phone: "000-999-8888",
    status: "Active",
    otherDetails: "New user, signed up last week.",
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSave = (updatedUser: User) => {
    setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
    setIsDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Users (Customers)</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>View and update user/customer accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.phone}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={
                          user.status === "Active"
                            ? "default"
                            : user.status === "Suspended"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={isDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsDialogOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                              Make changes to {user.name}'s profile here. Click save when you're done.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedUser && <UserForm user={selectedUser} onSave={handleSave} />}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
