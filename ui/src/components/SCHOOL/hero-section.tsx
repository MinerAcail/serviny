import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
// Import video
import videoSur from "../../../public/teens.mp4"

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay failed (expected in some browsers)
      })
    }
  }, [])

  return (
    <section
      id="home"
      className="relative h-screen  flex items-center justify-center overflow-hidden"
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={videoSur} type="video/mp4" />
      </video>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#3544838c] via-[#4710287e] to-[#59295ea8]" />

      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up text-balance">
          Welcome to
          <span className="block text-accent">Future International School</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-white/90 animate-fade-in-up [animation-delay:0.2s]  text-pretty">
          Where curiosity is nurtured, creativity is celebrated, and every student is inspired to reach their fullest potential.
Discover a community that values excellence in academics, innovation in learning, and a supportive environment for growth
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center ">
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-3">
            Get Started
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-3 bg-transparent"
          >
            <Play className="mr-2 h-5 w-5" />
            Watch Demo
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  )
}
