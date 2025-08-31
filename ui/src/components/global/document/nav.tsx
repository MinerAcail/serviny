import { Menu, X } from "lucide-react"
import { useState } from "react"
import { Outlet, Link, useLocation } from "react-router"

export function DocumentationLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navigationItems = [
    { key: "delivery", label: "Delivery Solutions", path: "/docs/delivery" },
    { key: "ecom", label: "E-commerce Platform", path: "/docs/ecom" },
    { key: "ship", label: "Global Import", path: "/docs/ship" },
  ]

  const getCurrentPageTitle = () => {
    const currentPath = location.pathname
    if (currentPath.includes('/delivery')) return "Delivery Solutions"
    if (currentPath.includes('/ecom')) return "E-commerce Platform"
    if (currentPath.includes('/ship')) return "Global Import"
    return "Documentation"
  }

  const isActivePath = (path) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Header Navigation */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/docs/delivery" 
                className="text-2xl font-bold text-red-600 hover:text-red-700 transition-colors"
              >
                winnemart
              </Link>
              <div className="text-sm text-gray-500">docs</div>
              <div className="hidden md:block text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                {getCurrentPageTitle()}
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath(item.path)
                      ? "bg-red-100 text-red-700"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <nav className="px-4 py-2 space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.key}
                    to={item.path}
                    className={`block py-3 px-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath(item.path)
                        ? "bg-red-100 text-red-700"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      <Outlet />
    </div>
  )
}