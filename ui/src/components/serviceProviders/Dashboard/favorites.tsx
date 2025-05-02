// import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Star } from "lucide-react"
import { Link } from "react-router"

export default function FavoritesPage() {
  // Filter only favorite contacts
  const favoriteContacts = contacts.filter((contact) => contact.isFavorite)

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/contacts" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to All Contacts
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            Favorite Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {favoriteContacts.length > 0 ? (
              favoriteContacts.map((contact) => (
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
                        <span>{contact.email}</span>
                        <span>•</span>
                        <span>{contact.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {contact.category}
                    </span>
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Star className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Favorites Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You haven't added any contacts to your favorites yet.
                </p>
                <Button asChild className="mt-4">
                  <Link to="/contacts">Browse All Contacts</Link>
                </Button>
              </div>
            )}
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
    id: "5",
    name: "David Wilson",
    email: "david.w@example.com",
    phone: "+1 (555) 234-5678",
    category: "Partner",
    isFavorite: true,
  },
  {
    id: "7",
    name: "Robert Taylor",
    email: "robert.t@example.com",
    phone: "+1 (555) 456-7890",
    category: "Client",
    isFavorite: true,
  },
]
