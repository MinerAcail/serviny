
import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Send,
  ImageIcon,
  Paperclip,
  ChevronLeft,
  MoreVertical,
  Package,
  Phone,
  Video,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: Date
  status: "sending" | "sent" | "delivered" | "read"
  attachments?: {
    type: "image" | "file"
    url: string
    name?: string
  }[]
}

interface ChatContact {
  id: string
  name: string
  avatar?: string
  lastSeen: Date
  online: boolean
  unreadCount: number
}

interface ItemDetails {
  id: string
  name: string
  image: string
  price: string
  type: "product" | "service"
}

export default function ChatSystem() {
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [itemDetails, setItemDetails] = useState<Record<string, ItemDetails>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Simulate fetching contacts and messages
  useEffect(() => {
    // Mock contacts
    const mockContacts: ChatContact[] = [
      {
        id: "user-1",
        name: "Sarah Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        lastSeen: new Date(),
        online: true,
        unreadCount: 2,
      },
      {
        id: "user-2",
        name: "Michael Chen",
        avatar: "/placeholder.svg?height=40&width=40",
        lastSeen: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        online: false,
        unreadCount: 0,
      },
      {
        id: "user-3",
        name: "Emma Williams",
        avatar: "/placeholder.svg?height=40&width=40",
        lastSeen: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        online: false,
        unreadCount: 1,
      },
    ]

    // Mock item details
    const mockItemDetails: Record<string, ItemDetails> = {
      "item-1": {
        id: "item-1",
        name: "Wireless Headphones",
        image: "/placeholder.svg?height=80&width=80",
        price: "$129.99",
        type: "product",
      },
      "item-2": {
        id: "item-2",
        name: "Website Design Service",
        image: "/placeholder.svg?height=80&width=80",
        price: "$499",
        type: "service",
      },
      "item-3": {
        id: "item-3",
        name: "Smart Watch",
        image: "/placeholder.svg?height=80&width=80",
        price: "$249.99",
        type: "product",
      },
    }

    // Mock messages
    const mockMessages: Record<string, Message[]> = {
      "user-1": [
        {
          id: "msg-1",
          senderId: "user-1",
          text: "Hi there! I'm interested in your Wireless Headphones. Are they still available?",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          status: "read",
        },
        {
          id: "msg-2",
          senderId: "current-user",
          text: "Yes, they're still available! They're in excellent condition.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5), // 1.5 hours ago
          status: "read",
        },
        {
          id: "msg-3",
          senderId: "user-1",
          text: "Great! Do they come with a warranty?",
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          status: "read",
        },
        {
          id: "msg-4",
          senderId: "user-1",
          text: "Also, would you be willing to negotiate on the price a bit?",
          timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
          status: "delivered",
        },
      ],
      "user-2": [
        {
          id: "msg-5",
          senderId: "current-user",
          text: "Hi Michael, I wanted to follow up on the Website Design Service we discussed.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          status: "read",
        },
        {
          id: "msg-6",
          senderId: "user-2",
          text: "Hi! Yes, I've been working on the mockups. I'll send them over tomorrow.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23), // 23 hours ago
          status: "read",
        },
        {
          id: "msg-7",
          senderId: "current-user",
          text: "That sounds great! Looking forward to seeing them.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22), // 22 hours ago
          status: "read",
        },
      ],
      "user-3": [
        {
          id: "msg-8",
          senderId: "user-3",
          text: "Hello! Is the Smart Watch water resistant?",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
          status: "read",
        },
        {
          id: "msg-9",
          senderId: "current-user",
          text: "Yes, it's water resistant up to 50 meters!",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          status: "read",
        },
        {
          id: "msg-10",
          senderId: "user-3",
          text: "Perfect! I'll take it. How can we arrange the payment?",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          status: "delivered",
        },
      ],
    }

    setContacts(mockContacts)
    setMessages(mockMessages)
    setItemDetails(mockItemDetails)
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, activeChat])

  const handleSendMessage = () => {
    if (!message.trim() || !activeChat) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: "current-user",
      text: message,
      timestamp: new Date(),
      status: "sending",
    }

    setMessages((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMessage],
    }))

    setMessage("")

    // Simulate message being sent and delivered
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [activeChat]: prev[activeChat].map((msg) => (msg.id === newMessage.id ? { ...msg, status: "sent" } : msg)),
      }))
    }, 500)

    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [activeChat]: prev[activeChat].map((msg) => (msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg)),
      }))
    }, 1500)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatLastSeen = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    return date.toLocaleDateString()
  }

  const getContactItemId = (contactId: string): string => {
    // This is a simplified mapping - in a real app, you'd have a proper relationship
    switch (contactId) {
      case "user-1":
        return "item-1" // Sarah - Wireless Headphones
      case "user-2":
        return "item-2" // Michael - Website Design
      case "user-3":
        return "item-3" // Emma - Smart Watch
      default:
        return ""
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-lg bg-white h-[600px] flex">
      {/* Contacts sidebar */}
      <div
        className={cn("w-full md:w-80 border-r border-gray-100 flex flex-col", activeChat ? "hidden md:flex" : "flex")}
      >
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="font-medium text-lg">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setActiveChat(contact.id)}
              className={cn(
                "p-4 border-b border-gray-100 flex items-center cursor-pointer hover:bg-gray-50 transition-colors",
                activeChat === contact.id && "bg-blue-50/50",
              )}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                  <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {contact.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                )}
              </div>

              <div className="ml-3 flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{contact.name}</h3>
                  <span className="text-xs text-gray-500">{formatLastSeen(contact.lastSeen)}</span>
                </div>

                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-600 truncate max-w-[120px]">
                    {messages[contact.id]?.[messages[contact.id]?.length - 1]?.text || "No messages yet"}
                  </p>
                  {contact.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className={cn("flex-1 flex flex-col", !activeChat ? "hidden md:flex" : "flex")}>
        {activeChat ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2 md:hidden rounded-full"
                  onClick={() => setActiveChat(null)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={contacts.find((c) => c.id === activeChat)?.avatar || "/placeholder.svg"}
                    alt={contacts.find((c) => c.id === activeChat)?.name || ""}
                  />
                  <AvatarFallback>{(contacts.find((c) => c.id === activeChat)?.name || "").charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="ml-3">
                  <h3 className="font-medium">{contacts.find((c) => c.id === activeChat)?.name}</h3>
                  <p className="text-xs text-gray-500">
                    {contacts.find((c) => c.id === activeChat)?.online
                      ? "Online"
                      : `Last seen ${formatLastSeen(contacts.find((c) => c.id === activeChat)?.lastSeen || new Date())}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Item details */}
            {itemDetails[getContactItemId(activeChat)] && (
              <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center">
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center mr-3">
                  <img
                    src={itemDetails[getContactItemId(activeChat)].image || "/placeholder.svg"}
                    alt={itemDetails[getContactItemId(activeChat)].name}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <Package className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                    <span className="text-xs text-gray-500">
                      {itemDetails[getContactItemId(activeChat)].type === "product" ? "Product" : "Service"}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm">{itemDetails[getContactItemId(activeChat)].name}</h4>
                </div>
                <div className="text-right">
                  <span className="font-medium text-sm">{itemDetails[getContactItemId(activeChat)].price}</span>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50/30 to-white/30">
              <div className="space-y-4">
                {messages[activeChat]?.map((msg ) => (
                  <div
                    key={msg.id}
                    className={cn("flex", msg.senderId === "current-user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl p-3 px-4",
                        msg.senderId === "current-user"
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-100 text-gray-800 rounded-bl-none",
                      )}
                    >
                      <p>{msg.text}</p>
                      <div
                        className={cn(
                          "text-xs mt-1 flex items-center",
                          msg.senderId === "current-user" ? "text-blue-100 justify-end" : "text-gray-500",
                        )}
                      >
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message input */}
            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex items-end space-x-2">
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                  <Paperclip className="h-5 w-5 text-gray-500" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                  <ImageIcon className="h-5 w-5 text-gray-500" />
                </Button>

                <div className="flex-1 relative">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="resize-none pr-10 py-2.5 min-h-[44px] max-h-32 rounded-2xl border-gray-200 focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50"
                  />
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="rounded-full h-10 w-10 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50/50">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-800 mb-1">Your Messages</h3>
              <p className="text-gray-500 text-sm max-w-xs">
                Select a conversation or start a new one to chat about products and services
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
