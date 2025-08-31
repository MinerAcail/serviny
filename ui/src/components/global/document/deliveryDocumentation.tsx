import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ExternalLink } from "lucide-react";
import { VideoPlayer } from "../MEDIA/video";
import { getImageUrl } from "../formatPrice";
import { useNavigate } from "react-router";
import RegisterOptions from "@/app/checkUserCreateUI.tsx";

export function DeliveryDocumentation() {
  const navigate = useNavigate();

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
          Uber-style rider assignment with real-time tracking, powerful data
          tools, and flexible pricing
        </h2>

        {/* 3. Intro Paragraph */}
        <div className="text-lg text-gray-700 leading-relaxed mb-8 border-l-4 border-red-500 pl-6">
          <p>
            From small businesses to full-scale logistics companies, Winnemart
            powers efficient deliveries with intelligent rider assignment,
            comprehensive tracking capabilities, and scalable solutions that
            grow with your business needs.
          </p>
        </div>

        {/* 4. Featured Video */}
        <div className="mb-12">
          <VideoPlayer
            src={
              getImageUrl(
                "/minio/gb-bucket/gb-bucket-video-d9382557-4501-40d9-847c-55001f92c97a"
              ) ?? ""
            }
            thumbnail={
              getImageUrl(
                "/minio/gb-bucket/gb-bucket-cover-ab5a34a5-7228-416d-b088-793d2c2128b2"
              ) ?? ""
            }
          />
        </div>

        {/* 5. Main Content Area */}
        <div className="prose prose-lg max-w-none mb-12">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Standard Delivery
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Perfect for businesses that want to manage their own deliveries
                without building a full logistics department. Get professional
                delivery capabilities with minimal setup and maximum efficiency.
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
                src={getImageUrl(
                  "/minio/gb-bucket/gb-bucket-image-bfe8541b-9543-4296-b494-68cef5233acd"
                )}
                alt="Standard Delivery Dashboard"
                className="w-full rounded-lg shadow-md"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Enterprise Delivery
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                For delivery companies needing complete control over operations,
                rider management, and expansion. Scale your business with
                powerful data insights and operational flexibility.
              </p>
              <div className="space-y-3 mb-4 text-sm text-gray-700">
                <div>
                  <strong>Rider Management</strong> Riders register and get
                  their own portal, linked to your system
                </div>
                <div>
                  <strong>Data Power</strong> Complete customer, rider, and
                  booking analytics
                </div>
                <div>
                  <strong>Scalability</strong> Works in any location you want
                  to expand
                </div>
                <div>
                  <strong>Operational Dashboard</strong> Real-time rider
                  locations and performance metrics
                </div>
                <div>
                  <strong>Custom Pricing</strong> Set location-based rates and
                  operational rules
                </div>
              </div>

              <div className="space-y-3 mb-4 text-sm text-gray-700">
                <div>
                  <strong>Quick Registration / Incoming Call Management</strong>{" "}
                  Add new customers with one click and store their details for
                  future interactions. when customers aren’t using the app,
                  register them instantly, send tracking links, and keep them
                  updated with important delivery information.
                </div>
                <div>
                  <strong>Automated Tracking Links</strong> Instantly send
                  delivery tracking to non-app customers via SMS
                </div>
                <div>
                  <strong>Bulk Messaging</strong> Send important announcements
                  or promotions to all or selected customers
                </div>
                <div>
                  <strong>History & Insights</strong> Access full call logs
                  and customer communication history
                </div>
              </div>
              <img
                src={getImageUrl(
                  "/minio/gb-bucket/gb-bucket-image-1c6efedb-c6fe-4047-9e00-608e1b252d4b"
                )}
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
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Special Case: Cargo Billing
                  </h4>
                  <p className="text-gray-700">
                    Cargo delivery rates can vary the platform includes a
                    built-in invoice builder so you can easily assign and
                    customize invoices for each cargo booking.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-0 mb-8">
            <CardContent className="p-6">
              <blockquote className="text-xl italic text-gray-800 border-l-4 border-red-500 pl-6">
                "Winnemart transformed our delivery operations. We've reduced
                coordination time by 80% and our customers love the real-time
                tracking features."
              </blockquote>
              <cite className="text-sm text-gray-600 mt-4 block">
                Operations Manager of EMBEUNICE Co.
              </cite>
            </CardContent>
          </Card>
        </div>

        {/* 6. Key Points / Highlights */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Platform Benefits
          </h3>
          <ul className="list-disc list-inside space-y-3 text-gray-700 ml-4">
            <li>
              Real-time rider tracking and automatic assignment based on
              proximity
            </li>
            <li>
              Comprehensive rider portals with instant system connectivity
            </li>
            <li>
              Built-in e-commerce support with seamless checkout integration
            </li>
            <li>
              Flexible pricing engine supporting distance-based and custom rules
            </li>
            <li>
              Advanced analytics for customer, rider, and delivery performance
            </li>
            <li>Scalable architecture supporting multi-location expansion</li>
          </ul>
        </div>

        {/* 8. Closing / Call-to-Action */}
        <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white border-0">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Transform Your Delivery Operations?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Whether you're delivering across town or scaling nationwide,
              Winnemart gives you the flexibility, control, and insights to make
              deliveries your way. Join businesses already optimizing their
              logistics.
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
              <p>No setup fees • Flexible pricing • 24/7 support</p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <a
              href="#"
              className="text-red-600 hover:text-red-700 flex items-center"
            >
              Documentation <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <a
              href="#"
              className="text-red-600 hover:text-red-700 flex items-center"
            >
              API Reference <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <a
              href="#"
              className="text-red-600 hover:text-red-700 flex items-center"
            >
              Case Studies <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <a
              href="#"
              className="text-red-600 hover:text-red-700 flex items-center"
            >
              Support Center <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
