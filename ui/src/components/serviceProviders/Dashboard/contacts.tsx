// import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Search, Star } from "lucide-react"
import { Link } from "react-router"

export default function ContactsPage() {
  return (
    <div className="container py-10">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Button asChild>
          <Link to="/contacts/new" className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Add Contact
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <CardTitle>All Contacts</CardTitle>
          <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search contacts..." className="pl-8 md:w-[300px]" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
                <SelectItem value="recent">Recently Contacted</SelectItem>
                <SelectItem value="clients">Clients</SelectItem>
                <SelectItem value="vendors">Vendors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {contacts.map((contact) => (
              <Link
                key={contact.id}
                to={`/contacts/${contact.id}`}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg font-medium text-primary">{contact.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                 
                      <span>{contact.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {contact.category}
                  </span>
                  {contact.isFavorite && <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const contacts = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    category: "Client",
    isFavorite: true,
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "+1 (555) 987-6543",
    category: "Client",
    isFavorite: true,
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael.b@example.com",
    phone: "+1 (555) 456-7890",
    category: "Vendor",
    isFavorite: false,
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.d@example.com",
    phone: "+1 (555) 789-0123",
    category: "Client",
    isFavorite: false,
  },
  {
    id: "5",
    name: "David Wilson",
    email: "david.w@example.com",
    phone: "+1 (555) 234-5678",
    category: "Partner",
    isFavorite: true,
  },
  {
    id: "6",
    name: "Jennifer Lee",
    email: "jennifer.l@example.com",
    phone: "+1 (555) 345-6789",
    category: "Vendor",
    isFavorite: false,
  },
  {
    id: "7",
    name: "Robert Taylor",
    email: "robert.t@example.com",
    phone: "+1 (555) 456-7890",
    category: "Client",
    isFavorite: true,
  },
  {
    id: "8",
    name: "Lisa Anderson",
    email: "lisa.a@example.com",
    phone: "+1 (555) 567-8901",
    category: "Partner",
    isFavorite: false,
  },
]
