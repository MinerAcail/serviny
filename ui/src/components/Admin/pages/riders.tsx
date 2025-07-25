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
// import { RiderForm } from "@/components/rider-form"
import { Badge } from "@/components/ui/badge"
import { RiderForm } from "../components/rider/rider-form"

type Rider = {
  id: string
  name: string
  email: string
  phone: string
  status: "Active" | "Inactive" | "On Duty"
  otherDetails: string
}

const initialRiders: Rider[] = [
  {
    id: "r1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "111-222-3333",
    status: "On Duty",
    otherDetails: "Bike rider, available for deliveries.",
  },
  {
    id: "r2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "444-555-6666",
    status: "Active",
    otherDetails: "Car driver, covers wider area.",
  },
  {
    id: "r3",
    name: "Peter Jones",
    email: "peter.j@example.com",
    phone: "777-888-9999",
    status: "Inactive",
    otherDetails: "Currently on leave.",
  },
  {
    id: "r4",
    name: "Alice Brown",
    email: "alice.b@example.com",
    phone: "000-111-2222",
    status: "On Duty",
    otherDetails: "Scooter rider, fast in city traffic.",
  },
]

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>(initialRiders)
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSave = (updatedRider: Rider) => {
    setRiders((prev) => prev.map((rider) => (rider.id === updatedRider.id ? updatedRider : rider)))
    setIsDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Riders</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Riders</CardTitle>
          <CardDescription>View and update rider profiles.</CardDescription>
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
                {riders.map((rider) => (
                  <TableRow key={rider.id}>
                    <TableCell className="font-medium">{rider.name}</TableCell>
                    <TableCell>{rider.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{rider.phone}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={
                          rider.status === "On Duty"
                            ? "default"
                            : rider.status === "Active"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {rider.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={isDialogOpen && selectedRider?.id === rider.id} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRider(rider)
                              setIsDialogOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Edit Rider</DialogTitle>
                            <DialogDescription>
                              Make changes to {rider.name}'s profile here. Click save when you're done.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedRider && <RiderForm rider={selectedRider} onSave={handleSave} />}
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
