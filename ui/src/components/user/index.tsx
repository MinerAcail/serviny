// import NotificationCenter from "@/components/notification-center"
// import ChatSystem from "@/components/chat-system"
// import ItemChatWidget from "@/components/item-chat-widget"

import ChatSystem from "./chat-system";
import ItemChatWidget from "./item-chat-widget";
import NotificationCenter from "./notification-center";

export default function ExamplePage() {
  return (
    <div className="container mx-auto p-4">
      {/* Notification Center (typically in header) */}
      <div className="flex justify-end mb-6">
        <NotificationCenter />
      </div>

      {/* Main Chat System */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Messages</h2>
        <ChatSystem />
      </div>

      {/* Item Chat Widget (appears on product pages) */}
      <ItemChatWidget
        itemId="product-123"
        itemName="Wireless Headphones"
        itemImage="/placeholder.svg?height=40&width=40"
        sellerName="John Smith"
      />
    </div>
  )
}
