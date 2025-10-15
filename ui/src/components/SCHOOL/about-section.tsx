"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export function AboutSection() {
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
    <section ref={sectionRef} id="about" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div
            className={`transition-all duration-800 ${isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8 text-balance">
              Crafting Tomorrow's
              <span className="block text-accent">Experiences</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed text-pretty">
              We believe in the power of thoughtful design and innovative technology to create experiences that not only
              meet today's needs but anticipate tomorrow's possibilities. Our approach combines aesthetic excellence
              with functional precision.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-foreground">User-centered design philosophy</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-foreground">Cutting-edge technology stack</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-foreground">Continuous innovation mindset</span>
              </div>
            </div>
            <Button size="lg" className="text-lg px-8 py-3">
              Learn More
            </Button>
          </div>

          <div
            className={`transition-all duration-800 delay-300 ${
              isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="relative">
              <img src="/modern-minimalist-workspace-with-apple-devices.png" alt="Modern workspace" className="rounded-2xl shadow-2xl w-full" />
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
