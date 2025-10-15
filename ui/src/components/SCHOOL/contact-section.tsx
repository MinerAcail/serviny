"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

export function ContactSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="contact" className="py-24 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className={`text-4xl md:text-5xl font-bold mb-6 transition-all duration-800 ${
              isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
            } text-balance`}
          >
            Let's Create Something
            <span className="block text-accent">Amazing Together</span>
          </h2>
          <p
            className={`text-xl text-primary-foreground/80 max-w-3xl mx-auto transition-all duration-800 delay-200 ${
              isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
            } text-pretty`}
          >
            Ready to transform your ideas into reality? We'd love to hear from you.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card
            className={`bg-background/10 backdrop-blur-sm border-primary-foreground/20 transition-all duration-800 delay-400 ${
              isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
            }`}
          >
            <CardContent className="p-8">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      placeholder="Your Name"
                      className="bg-background/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Your Email"
                      className="bg-background/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60"
                    />
                  </div>
                </div>
                <div>
                  <Input
                    placeholder="Subject"
                    className="bg-background/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Your Message"
                    rows={6}
                    className="bg-background/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60 resize-none"
                  />
                </div>
                <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-3">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
