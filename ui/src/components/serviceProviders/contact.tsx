import { Send, Calendar, CreditCard, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ContactForm() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Get in Touch</h2>
        <p className="mt-2 text-muted-foreground">
          Have a project in mind? Let's discuss how I can help bring your vision to life.
        </p>
      </div>

      <Card className="overflow-hidden border-none bg-background/60 shadow-md">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-5">
            <div className="bg-primary/5 p-6 md:col-span-2">
              <h3 className="text-lg font-semibold">How It Works</h3>
              <div className="mt-6 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">1. Initial Consultation</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We'll discuss your needs, preferences, and budget to understand your vision.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">2. Project Planning</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      I'll create a detailed plan and timeline based on our discussion.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">3. Proposal & Quote</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      You'll receive a detailed proposal with pricing and scope of work.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:col-span-3">
              <form className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Your name" className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Your email address" className="rounded-lg" />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="Your phone number" className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service">Service Interested In</Label>
                    <Select>
                      <SelectTrigger id="service" className="rounded-lg">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential Design</SelectItem>
                        <SelectItem value="commercial">Commercial Design</SelectItem>
                        <SelectItem value="consultation">Design Consultation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget Range</Label>
                  <Select>
                    <SelectTrigger id="budget" className="rounded-lg">
                      <SelectValue placeholder="Select your budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under5k">Under $5,000</SelectItem>
                      <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                      <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                      <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                      <SelectItem value="over50k">Over $50,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Project Details</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your project, timeline, and any specific requirements"
                    rows={4}
                    className="rounded-lg"
                  />
                </div>

                <Button type="submit" className="w-full gap-2 rounded-lg">
                  <Send className="h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

