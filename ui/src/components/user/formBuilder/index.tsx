import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-20">
        <div className="flex flex-col items-center justify-center space-y-8 text-center max-w-3xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl font-semibold tracking-tight text-gray-900 sm:text-6xl">Form Builder</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Create beautiful forms with signature capabilities. Simple, powerful, and designed for everyone.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium"
            >
              <Link to="/builder">Create New Form</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-medium"
            >
              <Link to="/forms">View My Forms</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
