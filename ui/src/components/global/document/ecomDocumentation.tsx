import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {  ArrowRight, ExternalLink,} from "lucide-react"
import { VideoPlayer } from "../MEDIA/video"
import { getImageUrl } from "../formatPrice"

export  function EcommerceDocumentation() {

  return (
    <div className="min-h-screen bg-white">
     
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. Title Section */}
        <div className="mb-6">
          <Badge variant="secondary" className="mb-4 bg-red-100 text-red-800">
            E-COMMERCE SOLUTIONS
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Standard & Enterprise E-commerce Platform
          </h1>
        </div>

        {/* 2. Subtitle / Tagline */}
        <h2 className="text-xl md:text-2xl text-gray-600 font-medium mb-6 leading-relaxed">
          Complete online stores with built-in delivery intelligence and real-time order fulfillment
        </h2>

        {/* 3. Intro Paragraph */}
        <div className="text-lg text-gray-700 leading-relaxed mb-8 border-l-4 border-red-500 pl-6">
          <p>
            Want to sell online without worrying about order fulfillment? Or maybe you're running a large-scale 
            retail operation and need a store that talks directly to your delivery network? Winnemart brings you 
            the same smart technology that powers our <a href="delivery" className="text-red-600 underline hover:text-red-700">Delivery Solutions {""}</a>   
            now built directly into your e-commerce platform.
          </p>
        </div>

        {/* 4. Featured Video */}
        <div className="mb-12">
                 <VideoPlayer src={getImageUrl("/minio/gb-bucket/gb-bucket-video-58b803ed-2666-4a4e-ac35-cc3d8d6bb646")??""} thumbnail={getImageUrl("/minio/gb-bucket/gb-bucket-cover-c5d49e95-f63c-4666-bc32-8d65069c7059")??""} />
               </div>

        {/* 5. Main Content Area */}
        <div className="prose prose-lg max-w-none mb-12">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Standard E-commerce</h3>
              <p className="text-gray-600 text-sm font-medium mb-2">Get selling in days, not months</p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Perfect for SMEs who want a ready-to-launch store without complex setup. It comes with all the 
                essentials to manage products, take payments, and fulfill orders with ease.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  Customizable storefront themes
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  Inventory and product management
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  Secure payment gateways
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  Customer order tracking
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  <span>Integration with our <a href="delivery" className="text-red-600 underline hover:text-red-700">Standard Delivery</a> service</span>
                </div>
              </div>
              <img
                src="/placeholder.svg?height=200&width=400"
                alt="Standard E-commerce Storefront"
                className="w-full rounded-lg shadow-md"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise E-commerce</h3>
              <p className="text-gray-600 text-sm font-medium mb-2">Big business. Bigger control.</p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Combines everything from our Enterprise Delivery solution with a full-scale online commerce system. 
                When a customer clicks "Buy," your system instantly assigns the right rider and tracks orders in real time.
              </p>
              <div className="space-y-3 mb-4 text-sm text-gray-700">
                <div>
                  <strong>Full Rider Management</strong> — Riders have their own portal, linked to e-commerce orders
                </div>
                <div>
                  <strong>Auto Dispatch</strong> — Orders instantly trigger rider assignments based on location
                </div>
                <div>
                  <strong>Customer Analytics</strong> — Purchase trends, product preferences, repeat customer tracking
                </div>
                <div>
                  <strong>Clickstream Data</strong> — See where users navigate and what products they linger on
                </div>
                <div>
                  <strong>Unified Dashboard</strong> — Manage sales, deliveries, and analytics in one view
                </div>
              </div>
              <img
                src="/placeholder.svg?height=200&width=400"
                alt="Enterprise E-commerce Dashboard"
                className="w-full rounded-lg shadow-md"
              />
            </div>
          </div>

          <Card className="bg-blue-50 border border-blue-200 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Did you know?</h4>
                  <p className="text-gray-700">
                    Businesses using integrated delivery see up to 40% faster fulfillment times compared to 
                    manual order processing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border border-red-200 mb-8">
            <CardContent className="p-6 text-center">
              <h4 className="font-semibold text-gray-900 mb-3">Already running deliveries with Winnemart?</h4>
              <p className="text-gray-700 mb-4">Upgrade to Enterprise E-commerce in days.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                  Compare E-commerce Plans
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-0 mb-8">
            <CardContent className="p-6">
              <blockquote className="text-xl italic text-gray-800 border-l-4 border-red-500 pl-6">
                "Our online sales increased by 65% after integrating Winnemart's e-commerce platform. The automatic 
                order dispatch has been a game-changer for customer satisfaction."
              </blockquote>
              <cite className="text-sm text-gray-600 mt-4 block">
                — Jennifer Walsh, CEO at Urban Essentials
              </cite>
            </CardContent>
          </Card>

          <Card className="bg-gray-100 border-0 p-4 mb-8">
            <CardContent className="p-2">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <span className="text-lg">📌</span>
                <span>Want to know how our delivery engine works? Read our <a href="delivery" className="text-red-600 underline hover:text-red-700">Delivery Solutions Guide</a> to see the logistics tech behind our e-commerce system.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 6. Key Points / Highlights */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Platform Benefits</h3>
          <ul className="list-disc list-inside space-y-3 text-gray-700 ml-4">
            <li>Ready-to-launch storefronts with customizable themes and branding</li>
            <li>Automatic order dispatch with intelligent rider assignment</li>
            <li>Advanced customer analytics including purchase patterns and clickstream data</li>
            <li>Multi-location and multi-currency support for global operations</li>
            <li>Unified dashboard combining sales, inventory, and delivery management</li>
            <li>Seamless integration between e-commerce orders and delivery fulfillment</li>
          </ul>
        </div>

        {/* 7. Image Gallery */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Platform Screenshots</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Storefront Design", query: "modern e-commerce storefront with products" },
              { title: "Order Management", query: "e-commerce order management dashboard" },
              { title: "Customer Analytics", query: "customer behavior analytics dashboard" },
              { title: "Mobile Shopping", query: "mobile e-commerce shopping app interface" },
              { title: "Inventory System", query: "product inventory management interface" },
              { title: "Payment Gateway", query: "secure payment checkout interface" },
            ].map((image, index) => (
              <div key={index} className="group cursor-pointer">
                <img
                  src={`/placeholder.svg?height=200&width=300&query=${image.query}`}
                  alt={image.title}
                  className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                />
                <p className="text-sm text-gray-600 mt-2 text-center">{image.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 8. Closing / Call-to-Action */}
        <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white border-0">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Launch Your E-commerce Success?</h3>
            <p className="text-lg mb-6 opacity-90">
              From SMEs launching their first online store to global operations needing precision delivery, 
              Winnemart's e-commerce solutions adapt to your scale, speed, and strategy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-red-600 hover:bg-gray-100">
                Request E-commerce Demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-red-600 bg-transparent"
              >
                Start Your Store Today
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="mt-6 text-sm opacity-75">
              <p>Quick setup • Integrated delivery • 24/7 support</p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <a href="#" className="text-red-600 hover:text-red-700 flex items-center">
              Documentation <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <a href="#" className="text-red-600 hover:text-red-700 flex items-center">
              API Reference <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <a href="#" className="text-red-600 hover:text-red-700 flex items-center">
              Case Studies <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <a href="#" className="text-red-600 hover:text-red-700 flex items-center">
              Support Center <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}