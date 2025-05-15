
import { useState } from "react"
import { MessageSquare, X, Send, Minimize, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

interface ItemChatWidgetProps {
  itemId: string
  itemName: string
  itemImage: string
  sellerName: string
  sellerAvatar?: string
}

export default function ItemChatWidget({ itemId, itemName, itemImage, sellerName, sellerAvatar }: ItemChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState("")

  const handleSendMessage = () => {
    if (!message.trim()) return

    // In a real app, you would send this message to your backend
    console.log("Sending message about item:", itemId, message)

    // Clear the input after sending
    setMessage("")

    // Show a success message or update UI
    alert("Message sent! The seller will respond soon.")
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 bg-blue-500 hover:bg-blue-600 text-white shadow-lg flex items-center justify-center"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Chat widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={
              isMinimized
                ? { opacity: 1, y: 0, scale: 1, height: "auto" }
                : { opacity: 1, y: 0, scale: 1, height: "auto" }
            }
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden",
              isMinimized ? "w-72" : "w-80 sm:w-96",
            )}
          >
            {/* Header */}
            <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center mr-3">
                  <img
                    src={itemImage || "/placeholder.svg?height=40&width=40"}
                    alt={itemName}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{itemName}</h3>
                  <p className="text-xs text-gray-500">Chat with seller</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat content */}
            {!isMinimized && (
              <>
                <div className="p-4 h-64 overflow-y-auto bg-gradient-to-b from-gray-50/30 to-white/30">
                  <div className="flex items-center mb-4">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={sellerAvatar || "/placeholder.svg"} alt={sellerName} />
                      <AvatarFallback>{sellerName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3 text-sm">
                      <p>Hi there! I'm {sellerName}, the seller of this item. How can I help you?</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-gray-100">
                  <div className="flex items-end space-x-2">
                    <div className="flex-1 relative">
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="resize-none pr-10 py-2 min-h-[40px] max-h-32 rounded-2xl border-gray-200 focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50 text-sm"
                      />
                    </div>

                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className="rounded-full h-9 w-9 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
