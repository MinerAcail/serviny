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
// import { ServiceProviderForm } from "@/components/service-provider-form"
import { Badge } from "@/components/ui/badge"
import { ServiceProviderForm } from "../components/service/service-provider-form"
import { gql } from "@apollo/client"
const LIST_SERVICES = gql`
  query listServices($search: String, $limit: Int, $offset: Int) {
    listServices(search: $search, limit: $limit, offset: $offset) {
      id
      name
      type
      number
      dpfile
      email
      businessType
      location
      subDomain
      createdAt
    }
  }
`;
const GENERATE_SUBDOMAIN = gql`

    mutation generateSubdomain($serviceId: String!, $tryName: String) {
        generateSubdomain(serviceId: $serviceId, tryName: $tryName) {
        id
        subDomain
        }
    }
    `;
// updateBookingType mutation
const UPDATE_BOOKING_TYPE = gql`
  mutation updateBookingTypeByAdmin($serviceId: String!, $bookingType: BookingType!) {
    updateBookingTypeByAdmin(serviceId: $serviceId, bookingType: $bookingType) {
      id
      bookingType
    }
  }
`;
type ServiceProvider = {
  id: string
  name: string
  email: string
  phone: string
  subdomain: string
  status: "Active" | "Inactive" | "Pending"
  otherDetails: string
}

const initialServiceProviders: ServiceProvider[] = [
  {
    id: "sp1",
    name: "Acme Services Inc.",
    email: "contact@acme.com",
    phone: "123-456-7890",
    subdomain: "acme",
    status: "Active",
    otherDetails: "Specializes in plumbing and electrical services.",
  },
  {
    id: "sp2",
    name: "Global Solutions Ltd.",
    email: "info@global.com",
    phone: "987-654-3210",
    subdomain: "global",
    status: "Pending",
    otherDetails: "Offers IT consulting and software development.",
  },
  {
    id: "sp3",
    name: "City Movers",
    email: "move@citymovers.com",
    phone: "555-123-4567",
    subdomain: "citymovers",
    status: "Active",
    otherDetails: "Local and long-distance moving services.",
  },
  {
    id: "sp4",
    name: "Green Gardeners",
    email: "garden@greengarden.com",
    phone: "111-222-3333",
    subdomain: "greengarden",
    status: "Inactive",
    otherDetails: "Landscaping and garden maintenance.",
  },
]

export default function ServiceProvidersPage() {
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>(initialServiceProviders)
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSave = (updatedProvider: ServiceProvider) => {
    setServiceProviders((prev) =>
      prev.map((provider) => (provider.id === updatedProvider.id ? updatedProvider : provider)),
    )
    setIsDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Service Providers</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Service Providers</CardTitle>
          <CardDescription>View and update service provider information and subdomain assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden md:table-cell">Subdomain</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell>{provider.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{provider.phone}</TableCell>
                    <TableCell className="hidden md:table-cell">{provider.subdomain}.yourdomain.com</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={
                          provider.status === "Active"
                            ? "default"
                            : provider.status === "Pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {provider.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog
                        open={isDialogOpen && selectedProvider?.id === provider.id}
                        onOpenChange={setIsDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProvider(provider)
                              setIsDialogOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Edit Service Provider</DialogTitle>
                            <DialogDescription>
                              Make changes to {provider.name}'s profile here. Click save when you're done.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedProvider && <ServiceProviderForm provider={selectedProvider} onSave={handleSave} />}
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
