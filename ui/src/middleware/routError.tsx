import { useRouteError, isRouteErrorResponse, Link } from "react-router"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ErrorPage() {
  const error = useRouteError()
  let errorMessage: string

  if (isRouteErrorResponse(error)) {
    // error is type `ErrorResponse`
    errorMessage = error.data?.message || error.statusText
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === "string") {
    errorMessage = error
  } else {
    console.error(error)
    errorMessage = "Unknown error"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Oops! Something went wrong</h2>
          <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
        </div>
        <div className="mt-8">
          <Link to="/">
            <Button className="w-full">Go back home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

