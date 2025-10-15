"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Zap, Shield, Globe } from "lucide-react"

const features = [
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Designed with mobile users in mind, ensuring perfect performance across all devices.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed with cutting-edge technology that delivers instant results.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is protected with enterprise-grade security and privacy measures.",
  },
  {
    icon: Globe,
    title: "Global Scale",
    description: "Built to scale globally with infrastructure that grows with your needs.",
  },
]

export function FeaturesSection() {
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
    <section ref={sectionRef} id="features" className="py-24 bg-muted transition-all duration-1000">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className={`text-4xl md:text-5xl font-bold text-foreground mb-6 transition-all duration-800 ${
              isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
            } text-balance`}
          >
            Built for Excellence
          </h2>
          <p
            className={`text-xl text-muted-foreground max-w-3xl mx-auto transition-all duration-800 delay-200 ${
              isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
            } text-pretty`}
          >
            Every detail crafted with precision to deliver an unparalleled experience that exceeds expectations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className={`border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${
                isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
              }`}
              style={{ animationDelay: `${index * 0.1 + 0.4}s` }}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">{feature.title}</h3>
                <p className="text-muted-foreground text-pretty">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
