
import { useState, useEffect, useRef } from "react"
import { Bell, X, Check, MessageSquare, Package, Clock, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

type NotificationType = "message" | "item-update" | "service-status" | "info"

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  itemId?: string
  itemName?: string
  senderId?: string
  senderName?: string
  timestamp: Date
  read: boolean
}




export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([])

    const [isOpen, setIsOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)
  
    // Simulate fetching notifications
    useEffect(() => {
      // Mock data - in a real app, this would come from an API
      const mockNotifications: Notification[] = [
        {
          id: "1",
          type: "message",
          title: "New message",
          message: "Hi, is this product still available?",
          itemId: "prod-123",
          itemName: "Wireless Headphones",
          senderId: "user-456",
          senderName: "Alex Johnson",
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          read: false,
        },
        {
          id: "2",
          type: "item-update",
          title: "Price update",
          message: "The price for an item you're watching has changed.",
          itemId: "prod-789",
          itemName: "Smart Watch",
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          read: false,
        },
        {
          id: "3",
          type: "service-status",
          title: "Service completed",
          message: "Your service request has been completed.",
          itemId: "serv-101",
          itemName: "Website Design",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
          read: true,
        },
        {
          id: "4",
          type: "info",
          title: "Welcome!",
          message: "Welcome to our platform. Start by exploring products and services.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          read: true,
        },
      ]
  
      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter(n => !n.read).length)
    }, [])
  
    // Handle dropdown positioning
    useEffect(() => {
      // Function to adjust position on screen size changes
      const handleResize = () => {
        if (isOpen && dropdownRef.current) {
          adjustDropdownPosition()
        }
      }
  
      const adjustDropdownPosition = () => {
        if (!dropdownRef.current) return
        
        const dropdown = dropdownRef.current
        const rect = dropdown.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        
        // Check if dropdown extends beyond right viewport edge
        if (rect.right > viewportWidth) {
          // Calculate how much we need to adjust
          const rightOverflow = rect.right - viewportWidth
          dropdown.style.transform = `translateX(-${rightOverflow + 10}px)`
        } else {
          dropdown.style.transform = 'translateX(0)'
        }
      }
  
      window.addEventListener('resize', handleResize)
      
      // Adjust position when the dropdown opens
      if (isOpen) {
        // Use setTimeout to ensure the dropdown is rendered
        setTimeout(adjustDropdownPosition, 10)
      }
  
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }, [isOpen])
  
    const markAllAsRead = () => {
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
      setUnreadCount(0)
    }
  
    const getNotificationIcon = (type: NotificationType) => {

      switch (type) {
        case "message":
          return <MessageSquare className="h-5 w-5 text-blue-500" />
        case "item-update":
          return <Package className="h-5 w-5 text-purple-500" />
        case "service-status":
          return <Clock className="h-5 w-5 text-green-500" />
        case "info":
          return <Info className="h-5 w-5 text-gray-500" />
        default:
          return <Bell className="h-5 w-5 text-gray-500" />
      }
    }
  
    const formatTime = (date: Date) => {

      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      
      if (diffInMinutes < 1) return "Just now"
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) return `${diffInHours}h ago`
      
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  
    // Close the dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
            !event.target.closest('button[aria-label="Notifications"]')) {
          setIsOpen(false)
        }
      }
  
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])
  
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full h-10 w-10"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-5 w-5 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
  
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed sm:absolute right-0 left-0 sm:left-auto mt-2 mx-2 sm:mx-0 w-auto sm:w-96 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50"
              style={{ maxWidth: 'calc(100vw - 16px)' }}
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <h3 className="font-medium">Notifications</h3>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <Bell className="h-6 w-6 text-gray-400" />
                    </div>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={cn(
                        "p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors relative",
                        !notification.read && "bg-blue-50/50"
                      )}
                    >
                      <div className="flex">
                        <div className="mr-3 mt-0.5 flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                          {notification.itemName && (
                            <div className="mt-2 text-xs inline-block bg-gray-100 rounded-full px-2.5 py-1 truncate max-w-full">
                              {notification.itemName}
                            </div>
                          )}
                          {notification.type === "message" && notification.senderName && (
                            <div className="mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs rounded-full h-7"
                              >
                                Reply to {notification.senderName}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 bg-gradient-to-b from-white to-gray-50 text-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-gray-500 hover:text-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }