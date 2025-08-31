import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {  ArrowRight, ExternalLink} from "lucide-react"
import { VideoPlayer } from "../MEDIA/video"
import { getImageUrl } from "../formatPrice"
import RegisterOptions from "@/app/checkUserCreateUI"
import { useNavigate } from "react-router"

export default function ShipmentDocumentation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
     

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. Title Section */}
        <div className="mb-6">
          <Badge variant="secondary" className="mb-4 bg-red-100 text-red-800">
            GLOBAL IMPORT SOLUTION
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Winnemart Global Import Tool
          </h1>
        </div>

        {/* 2. Subtitle / Tagline */}
        <h2 className="text-xl md:text-2xl text-gray-600 font-medium mb-6 leading-relaxed">
          Your gateway from overseas supplier to doorstep all in one system
        </h2>

        {/* 3. Intro Paragraph */}
        <div className="text-lg text-gray-700 leading-relaxed mb-8 border-l-4 border-red-500 pl-6">
          <p>
            Ever had customers ask for products you don't stock locally? With Winnemart's Global Import Tool, you can 
            source from platforms like Alibaba or other international suppliers and deliver directly to your customer's 
            door in Ghana. Powered by our <a href="delivery" className="text-red-600 underline hover:text-red-700">Enterprise Delivery Engine</a>, 
            the system manages everything from product requests to overseas procurement to final delivery.
          </p>
        </div>

        {/* 4. Featured Video */}
        {/* <div className="mb-12">
                 <VideoPlayer src={getImageUrl("/minio/gb-bucket/gb-bucket-video-58b803ed-2666-4a4e-ac35-cc3d8d6bb646")??""} thumbnail={getImageUrl("/minio/gb-bucket/gb-bucket-cover-c5d49e95-f63c-4666-bc32-8d65069c7059")??""} />
               </div> */}

        {/* 5. Main Content Area */}
        <div className="prose prose-lg max-w-none mb-12">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-red-100 text-red-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</div>
                  <h4 className="font-semibold text-gray-900">Customer Requests Item</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Customers paste a product link into your "Request Item" form, along with its name and price.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-red-100 text-red-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</div>
                  <h4 className="font-semibold text-gray-900">Apply Pricing Rules</h4>
                </div>
                <p className="text-sm text-gray-700">
                  System calculates final bill including product cost and shipment based on your custom rules.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-red-100 text-red-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">3</div>
                  <h4 className="font-semibold text-gray-900">Overseas Agent Portal</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Your overseas supplier gets their own login to see requests, confirm availability, and process orders.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-red-100 text-red-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">4</div>
                  <h4 className="font-semibold text-gray-900">Track Shipment</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Monitor the shipment from the overseas warehouse until it lands in Ghana.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-red-100 text-red-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">5</div>
                  <h4 className="font-semibold text-gray-900">Local Delivery</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Enterprise Delivery tools auto-assign riders, send tracking links, and update status in real time.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Key Features</h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  <span><strong>Request Item Tool</strong> Fast, customer-friendly product request submission</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  <span><strong>Automated Pricing</strong> Custom billing rules for products and shipping</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  <span><strong>Agent Portal</strong> Dedicated overseas fulfillment interface</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  <span><strong>Shipment Tracking</strong> Full visibility from source to doorstep</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  <span><strong>Enterprise Delivery Integration</strong> Local last-mile fulfillment at scale</span>
                </div>
              </div>
              {/* <img
                src="/placeholder.svg?height=200&width=400"
                alt="Global Import Dashboard"
                className="w-full rounded-lg shadow-md"
              /> */}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Why It Works</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                By combining international sourcing with our Enterprise E-commerce and Delivery Engine, 
                businesses can expand their offerings while maintaining complete control and transparency.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  Expand product offerings without stocking every item
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  Give customers transparency and trust in cross-border orders
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-600 mr-2">✅</span>
                  Reduce delays through connected overseas and local systems
                </div>
              </div>
              {/* <img
                src="/placeholder.svg?height=200&width=400"
                alt="Agent Portal Interface"
                className="w-full rounded-lg shadow-md"
              /> */}
            </div>
          </div>

          <Card className="bg-blue-50 border border-blue-200 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">📦</div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Example Use Case</h4>
                  <p className="text-gray-700">
                    A customer wants a specific electronic gadget only available on Alibaba. They submit the link 
                    through your store. Your overseas agent procures it, ships it, and updates the system. When it 
                    arrives in Ghana, a rider is instantly assigned and the customer receives live tracking updates 
                    without you making a single phone call.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-0 mb-8">
            <CardContent className="p-6">
              <blockquote className="text-xl italic text-gray-800 border-l-4 border-red-500 pl-6">
                "The Global Import Tool revolutionized our business model. We can now offer any product our customers 
                want from international suppliers, with complete transparency and automated fulfillment."
              </blockquote>
              <cite className="text-sm text-gray-600 mt-4 block">
                Founder of CHOICE MALL
              </cite>
            </CardContent>
          </Card>
        </div>

        {/* 6. Key Points / Highlights */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Platform Benefits</h3>
          <ul className="list-disc list-inside space-y-3 text-gray-700 ml-4">
            <li>Centralize international procurement and local delivery in one system</li>
            <li>Reduce manual coordination between overseas suppliers and local customers</li>
            <li>Provide complete transparency to customers, agents, and your team</li>
            <li>Speed up delivery from overseas warehouse to final customer</li>
            <li>Apply custom pricing rules for both products and international shipping</li>
            <li>Track full lifecycle from request to doorstep delivery</li>
          </ul>
        </div>

        {/* 7. Image Gallery */}
        {/* <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Platform Screenshots</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Request Item Form", query: "product request form with link input" },
              { title: "Agent Portal", query: "overseas agent management dashboard" },
              { title: "Shipment Tracking", query: "international shipment tracking interface" },
              { title: "Pricing Calculator", query: "automated pricing rules dashboard" },
              { title: "Import Dashboard", query: "global import management overview" },
              { title: "Local Delivery", query: "rider assignment and tracking interface" },
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
            <h3 className="text-2xl font-bold mb-4">Ready to Go Global with Local Delivery?</h3>
            <p className="text-lg mb-6 opacity-90">
              Connect international suppliers with local customers through one seamless system. 
              From Alibaba to your customer's doorstep in Ghana all automated and tracked.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => {
                  navigate("/all");
                }}
                size="lg"
                variant="secondary"
                className="bg-white text-red-600 hover:bg-gray-100"
              >
                Providers
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <div className=" text-black hover:bg-gray-100">
                <RegisterOptions />
              </div>
            </div>
            <div className="mt-6 text-sm opacity-75">
              <p>Global sourcing • Local delivery • Full tracking • 24/7 support</p>
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