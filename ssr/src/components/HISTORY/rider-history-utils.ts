import { type ServiceData, type Stats, type FilteredData, type RawServiceDataFromAPI } from "./typesAndgql"

// Utility functions for payment information
export const getPaymentStatusColor = (paymentStatus: string): string => {
  switch (paymentStatus?.toUpperCase()) {
    case "PAID":
    case "COMPLETED":
    case "SUCCESS":
      return "bg-green-100 text-green-700 border-green-200"
    case "PENDING":
    case "PROCESSING":
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
    case "FAILED":
    case "DECLINED":
    case "CANCELLED":
      return "bg-red-100 text-red-700 border-red-200"
    case "REFUNDED":
      return "bg-blue-100 text-blue-700 border-blue-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export const getPaymentMethodIcon = (paymentMethod: string): string => {
  switch (paymentMethod?.toLowerCase()) {
    case "card":
    case "credit_card":
    case "debit_card":
      return "💳"
    case "cash":
    case "cash_on_delivery":
    case "cod":
      return "💵"
    case "mobile_money":
    case "momo":
    case "mobile":
      return "📱"
    case "bank_transfer":
    case "transfer":
      return "🏦"
    case "wallet":
    case "e_wallet":
      return "👛"
    default:
      return "💰"
  }
}



// Process raw GraphQL data into structured service data
export const processServiceData = (rawData: RawServiceDataFromAPI[]): {
  historyData: ServiceData[]
  groupedData: Map<string, ServiceData[]>
  standaloneServices: ServiceData[]
} => {
  const processedData = rawData
    .map((service: RawServiceDataFromAPI): ServiceData => {
      const isOrder = service.type === "ORDER"
      
      // Calculate service amount
      const serviceAmount = isOrder
        ? service.orderData?.deliveryMetaData?.price || service.orderData?.serviceFee || 0
        : Number.parseFloat(service.bookingData?.deliveryFee || "0")

      return {
        id: isOrder ? service.orderData?.orderId || service.id : service.bookingData?.bookingId || service.id,
        serviceId: service.id,
        type: service.type,
        date: new Date(service.createdAt).toLocaleDateString(),
        time: new Date(service.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        customer: service.customer.name,
        customerPhone: service.customer.number,
        vendor: service.vendor.name,
        vendorLocation: service.vendor.location,
        rider: service.rider?.name || "Unassigned",
        riderPhone: service.rider?.number || "-",
        pickup: isOrder ? service.vendor.location : service.bookingData?.pickUpAddress || service.vendor.location,
        delivery: isOrder ? service.orderData?.deliveryAddress || "" : service.bookingData?.deliveryAddress || "",
        status: isOrder
          ? service.orderData?.status || "Unknown"
          : service.bookingData?.status || (service.bookingData?.isConfirmed ? "Confirmed" : "Pending"),
        priority: "Normal",
        orderValue: `GH₵${serviceAmount.toFixed(2)}`,
        serviceAmount: serviceAmount,
        deliveryTime: isOrder
          ? service.orderData?.deliveryMetaData?.duration || "-"
          : service.bookingData?.duration || "-",
        rating: 4.8,
        distance: isOrder
          ? service.orderData?.deliveryMetaData?.distance || "-"
          : service.bookingData?.distance || "-",
        // Payment information
        paymentStatus: isOrder ? service.orderData?.paymentStatus : service.bookingData?.paymentStatus,
        paymentMethod: isOrder ? service.orderData?.paymentMethod : service.bookingData?.paymentMethod,
        // Additional booking info
        multiGroupId: service.bookingData?.multiGroupId,
        tableSize: service.bookingData?.tableSize,
        bookingDay: service.bookingData?.day,
        startTime: service.bookingData?.startTime,
        endTime: service.bookingData?.endTime,
        item: service.bookingData?.item,
        notes: service.bookingData?.notes,
        // Raw data for detailed view
        rawData: service,
      }
    })
    .sort((a: ServiceData, b: ServiceData) => 
      new Date(b.rawData.createdAt).getTime() - new Date(a.rawData.createdAt).getTime()
    )

  // Group multi-group bookings
  const groups = new Map<string, ServiceData[]>()
  const standalone: ServiceData[] = []

  processedData.forEach((service) => {
    if (service.multiGroupId && service.type === "BOOKING") {
      if (!groups.has(service.multiGroupId)) {
        groups.set(service.multiGroupId, [])
      }
      groups.get(service.multiGroupId)!.push(service)
    } else {
      standalone.push(service)
    }
  })

  return { historyData: processedData, groupedData: groups, standaloneServices: standalone }
}

// Generate search suggestions based on query and data
export const generateSearchSuggestions = (historyData: ServiceData[], searchQuery: string): string[] => {
  if (!historyData.length || !searchQuery.trim()) return []

  const suggestions = new Set<string>()
  const query = searchQuery.toLowerCase()

  historyData.forEach((item: ServiceData) => {
    // Customer names
    if (item.customer?.toLowerCase().includes(query)) {
      suggestions.add(`👤 ${item.customer}`)
    }

    // Vendor names
    if (item.vendor?.toLowerCase().includes(query)) {
      suggestions.add(`🏢 ${item.vendor}`)
    }

    // Rider names
    if (item.rider?.toLowerCase().includes(query) && item.rider !== "Unassigned") {
      suggestions.add(`🚴 ${item.rider}`)
    }

    // Payment methods
    if (item.paymentMethod?.toLowerCase().includes(query)) {
      suggestions.add(`💳 ${item.paymentMethod}`)
    }

    // Service IDs
    if (item.id?.toLowerCase().includes(query)) {
      suggestions.add(`📋 ${item.type} #${item.id.slice(-6)}`)
    }

    // Multi-group IDs
    if (item.multiGroupId?.toLowerCase().includes(query)) {
      suggestions.add(`🔗 Multi-Group #${item.multiGroupId.slice(-6)}`)
    }

    // Status
    if (item.status?.toLowerCase().includes(query)) {
      suggestions.add(`📊 Status: ${item.status}`)
    }

    // Booking items
    if (item.item?.toLowerCase().includes(query) && item.type === "BOOKING") {
      suggestions.add(`📝 ${item.item}`)
    }

    // Booking notes
    if (item.notes?.toLowerCase().includes(query) && item.type === "BOOKING") {
      suggestions.add(`📋 ${item.notes}`)
    }
  })

  return Array.from(suggestions).slice(0, 8)
}

// Filter services based on search and filter criteria
export const filterServices = (
  historyData: ServiceData[],
  standaloneServices: ServiceData[],
  groupedData: Map<string, ServiceData[]>,
  searchQuery: string,
  typeFilter: string,
  statusFilter: string,
  paymentStatusFilter: string
): FilteredData => {
  if (!historyData.length) return { 
    filteredHistory: [], 
    filteredGroups: new Map(), 
    filteredStandalone: [] 
  }

  // Filter standalone services
  const filteredStandaloneServices = standaloneServices.filter((item: ServiceData) => {
    // Search filter
    const matchesSearch =
      !searchQuery.trim() ||
      item.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase())

    // Type filter
    const matchesType = typeFilter === "all" || item.type === typeFilter

    // Status filter
    const matchesStatus = statusFilter === "all" || item.status?.toUpperCase() === statusFilter.toUpperCase()

    // Payment status filter
    const matchesPaymentStatus =
      paymentStatusFilter === "all" || item.paymentStatus?.toUpperCase() === paymentStatusFilter.toUpperCase()

    return matchesSearch && matchesType && matchesStatus && matchesPaymentStatus
  })

  // Filter multi-groups
  const filteredGroupsMap = new Map<string, ServiceData[]>()
  groupedData.forEach((groupServices, groupId) => {
    // Check if group matches search criteria
    const groupMatches =
      !searchQuery.trim() ||
      groupId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      groupId.slice(-6).toLowerCase().includes(searchQuery.toLowerCase()) ||
      searchQuery.toLowerCase().includes(groupId.slice(-6).toLowerCase()) ||
      `#${groupId.slice(-6)}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      groupServices.some(
        (service: ServiceData) =>
          service.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.rider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase()),
      )

    // Filter individual services within the group
    const filteredGroupServices = groupServices.filter((item: ServiceData) => {
      // Type filter (should be BOOKING for groups)
      const matchesType = typeFilter === "all" || item.type === typeFilter

      // Status filter
      const matchesStatus = statusFilter === "all" || item.status?.toUpperCase() === statusFilter.toUpperCase()

      // Payment status filter
      const matchesPaymentStatus =
        paymentStatusFilter === "all" || item.paymentStatus?.toUpperCase() === paymentStatusFilter.toUpperCase()

      return matchesType && matchesStatus && matchesPaymentStatus
    })

    // Include group if it matches search and has filtered services
    if (groupMatches && filteredGroupServices.length > 0) {
      filteredGroupsMap.set(groupId, filteredGroupServices)
    }
  })

  // Combine for total filtered history (for stats)
  const allFiltered = [...filteredStandaloneServices]
  filteredGroupsMap.forEach((groupServices) => {
    allFiltered.push(...groupServices)
  })

  return {
    filteredHistory: allFiltered,
    filteredGroups: filteredGroupsMap,
    filteredStandalone: filteredStandaloneServices,
  }
}

// Calculate statistics from history data
export const calculateStats = (historyData: ServiceData[], groupedData: Map<string, ServiceData[]>): Stats => {
  if (!historyData.length)
    return {
      total: 0,
      delivered: 0,
      revenue: "0",
      paidRevenue: "0",
      pendingRevenue: "0",
      avgRating: 0,
      successRate: "0",
      paymentRate: "0",
      orders: 0,
      bookings: 0,
      multiGroups: 0,
      paidServices: 0,
    }

  const total = historyData.length
  const orders = historyData.filter((item) => item.type === "ORDER").length
  const bookings = historyData.filter((item) => item.type === "BOOKING").length
  const multiGroups = groupedData.size

  const delivered = historyData.filter(
    (item: ServiceData) => item.status?.toUpperCase() === "DELIVERED" || item.status?.toUpperCase() === "CONFIRMED",
  ).length

  const revenue = historyData.reduce((sum: number, item: ServiceData) => sum + item.serviceAmount, 0)

  const paidServices = historyData.filter(
    (item) => item.paymentStatus?.toUpperCase() === "PAID" || item.paymentStatus?.toUpperCase() === "COMPLETED",
  )

  const paidRevenue = paidServices.reduce((sum: number, item: ServiceData) => sum + item.serviceAmount, 0)
  const pendingRevenue = revenue - paidRevenue

  const avgRating = 4.8

  return {
    total,
    orders,
    bookings,
    multiGroups,
    delivered,
    revenue: revenue.toFixed(2),
    paidRevenue: paidRevenue.toFixed(2),
    pendingRevenue: pendingRevenue.toFixed(2),
    avgRating,
    successRate: total > 0 ? ((delivered / total) * 100).toFixed(1) : "0",
    paymentRate: total > 0 ? ((paidServices.length / total) * 100).toFixed(1) : "0",
    paidServices: paidServices.length,
  }
}

// Get unique payment statuses for filter options
export const getUniquePaymentStatuses = (historyData: ServiceData[]): string[] => {
  const statuses = new Set<string>()
  historyData.forEach((item) => {
    if (item.paymentStatus) statuses.add(item.paymentStatus)
  })
  return Array.from(statuses)
}