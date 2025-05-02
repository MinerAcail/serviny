
import type React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

interface ContactDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  message: string
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSend: () => void
}

export function ContactDialog({
  isOpen,
  onOpenChange,
  userName,
  message,
  onMessageChange,
  onSend,
}: ContactDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contact {userName}</DialogTitle>
          <DialogDescription>Send a message to the user regarding their appointment.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={onMessageChange}
              className="min-h-[120px]"
              placeholder="Type your message here..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSend} disabled={!message.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
