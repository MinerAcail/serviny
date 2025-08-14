import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {  ArrowRight, ExternalLink, } from "lucide-react"
import { VideoPlayer } from "../MEDIA/video"
import { getImageUrl } from "../formatPrice"

export  function DeliveryDocumentation() {

  return (
    <div className="min-h-screen w-full bg-white">
    
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. Title Section */}
        <div className="mb-6">
          <Badge variant="secondary" className="mb-4 bg-red-100 text-red-800">
            DELIVERY SOLUTIONS
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Standard & Enterprise Delivery Platform
          </h1>
        </div>

        {/* 2. Subtitle / Tagline */}
        <h2 className="text-xl md:text-2xl text-gray-600 font-medium mb-6 leading-relaxed">
          Uber-style rider assignment with real-time tracking, powerful data tools, and flexible pricing
        </h2>

        {/* 3. Intro Paragraph */}
        <div className="text-lg text-gray-700 leading-relaxed mb-8 border-l-4 border-red-500 pl-6">
          <p>
            From small businesses to full-scale logistics companies, Winnemart powers efficient deliveries with 
            intelligent rider assignment, comprehensive tracking capabilities, and scalable solutions that grow 
            with your business needs.
          </p>
        </div>

        {/* 4. Featured Video */}
        <div className="mb-12">
          <VideoPlayer src={getImageUrl("/minio/gb-bucket/gb-bucket-video-b2cbf982-0333-43a2-b1b8-a8419f4ab477")??""} thumbnail={getImageUrl("/minio/gb-bucket/gb-bucket-cover-f9ad8d71-fd66-437e-ae8e-8180a0c27989")??""} />
        </div>

        {/* 5. Main Content Area */}
        <div className="prose prose-lg max-w-none mb-12">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Standard Delivery</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Perfect for businesses that want to manage their own deliveries without building a full logistics 
                department. Get professional delivery capabilities with minimal setup and maximum efficiency.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  Auto-assign riders based on location
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  Live tracking for you and customers
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  E-commerce support in dashboard
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  Flexible pricing rules
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  Automated client billing
                </div>
              </div>
              <img
               src={getImageUrl("/minio/gb-bucket/gb-bucket-image-94c94379-d034-4167-ade0-25eebce0baee")}

                alt="Standard Delivery Dashboard"
                className="w-full rounded-lg shadow-md"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise Delivery</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                For delivery companies needing complete control over operations, rider management, and expansion. 
                Scale your business with powerful data insights and operational flexibility.
              </p>
              <div className="space-y-3 mb-4 text-sm text-gray-700">
                <div>
                  <strong>Rider Management</strong> — Riders register and get their own portal, linked to your system
                </div>
                <div>
                  <strong>Data Power</strong> — Complete customer, rider, and booking analytics
                </div>
                <div>
                  <strong>Scalability</strong> — Works in any location you want to expand
                </div>
                <div>
                  <strong>Operational Dashboard</strong> — Real-time rider locations and performance metrics
                </div>
                <div>
                  <strong>Custom Pricing</strong> — Set location-based rates and operational rules
                </div>
              </div>
              <img
                src={getImageUrl("/minio/gb-bucket/gb-bucket-image-6a274411-80aa-4f1c-8019-868da363d7e8")}
                alt="Enterprise Operations Dashboard"
                className="w-full rounded-lg shadow-md"
              />
            </div>
          </div>

          <Card className="bg-blue-50 border border-blue-200 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">📦</div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Special Case: Cargo Billing</h4>
                  <p className="text-gray-700">
                    Cargo delivery rates can vary — the platform includes a built-in invoice builder so you can 
                    easily assign and customize invoices for each cargo booking.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-0 mb-8">
            <CardContent className="p-6">
              <blockquote className="text-xl italic text-gray-800 border-l-4 border-red-500 pl-6">
                "Winnemart transformed our delivery operations. We've reduced coordination time by 80% and our 
                customers love the real-time tracking features."
              </blockquote>
              <cite className="text-sm text-gray-600 mt-4 block">
                — Marcus Rodriguez, Operations Manager at QuickDelivery Co.
              </cite>
            </CardContent>
          </Card>
        </div>

        {/* 6. Key Points / Highlights */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Platform Benefits</h3>
          <ul className="list-disc list-inside space-y-3 text-gray-700 ml-4">
            <li>Real-time rider tracking and automatic assignment based on proximity</li>
            <li>Comprehensive rider portals with instant system connectivity</li>
            <li>Built-in e-commerce support with seamless checkout integration</li>
            <li>Flexible pricing engine supporting distance-based and custom rules</li>
            <li>Advanced analytics for customer, rider, and delivery performance</li>
            <li>Scalable architecture supporting multi-location expansion</li>
          </ul>
        </div>

        {/* 7. Image Gallery */}
        {/* <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Platform Screenshots</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Operations Dashboard", query: "delivery operations dashboard with rider tracking" },
              { title: "Rider Portal", query: "mobile app interface for delivery riders" },
              { title: "Live Tracking", query: "real-time delivery tracking map interface" },
              { title: "Order Management", query: "delivery order management system interface" },
              { title: "Analytics Reports", query: "delivery performance analytics dashboard" },
              { title: "Billing System", query: "automated billing and invoice management interface" },
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
        </div> */}

        {/* 8. Closing / Call-to-Action */}
        <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white border-0">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Delivery Operations?</h3>
            <p className="text-lg mb-6 opacity-90">
              Whether you're delivering across town or scaling nationwide, Winnemart gives you the flexibility, 
              control, and insights to make deliveries your way. Join businesses already optimizing their logistics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-red-600 hover:bg-gray-100">
                Request Demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-red-600 bg-transparent"
              >
                Get Started Today
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="mt-6 text-sm opacity-75">
              <p>No setup fees • Flexible pricing • 24/7 support</p>
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