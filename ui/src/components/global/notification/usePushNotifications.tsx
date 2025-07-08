// Add these debugging improvements to your usePushNotifications hook

"use client"

import { useState, useEffect } from "react"
import { useMutation } from "@apollo/client"
import { gql } from "@apollo/client"

export const SAVE_PUSH_SUBSCRIPTION = gql`
  mutation SavePushSubscription($input: PushSubscriptionInput!) {
    savePushSubscription(input: $input) {
      id
      endpoint
      createdAt
    }
  }
`

export const DELETE_PUSH_SUBSCRIPTION = gql`
  mutation DeletePushSubscription($endpoint: String!) {
    deletePushSubscription(endpoint: $endpoint)
  }
`


export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
const PUBLIC_VAPID_KEY = "BD2ECGHRLC4G8XpuFS2DKakMf0e3vwA6HpOHDsZvO9oIUb3rzp3U8_Hs0Pd-Pf2GG7vU8FYjbENG0KGOD2QeD6Y";

  const [savePushSubscription] = useMutation(SAVE_PUSH_SUBSCRIPTION)
  const [deletePushSubscription] = useMutation(DELETE_PUSH_SUBSCRIPTION)

  useEffect(() => {
    // Check if push notifications are supported
    const supported = "serviceWorker" in navigator && "PushManager" in window
    setIsSupported(supported)

    if (supported) {
      checkSubscription()
    }
  }, [])
console.log("PUBLIC_VAPID_KEY",PUBLIC_VAPID_KEY);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()

      if (existingSubscription) {
        setIsSubscribed(true)
        setSubscription(existingSubscription)
      }
    } catch (error) {
      console.error("Error checking subscription:", error)
    }
  }

  const requestPermission = async () => {
    if (!isSupported) {
      throw new Error("Push notifications are not supported")
    }
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  const subscribe = async () => {
    console.log("🔔 Starting subscription process...")
    setIsLoading(true)

    try {
      // Step 1: Check VAPID key
      if (!PUBLIC_VAPID_KEY) {
        throw new Error("VAPID public key is not configured")
      }
      console.log("✅ VAPID key found")

      // Step 2: Request permission
      console.log("🔒 Requesting permission...")
      const hasPermission = await requestPermission()
      if (!hasPermission) {
        throw new Error("Notification permission denied")
      }
      console.log("✅ Permission granted")

      // Step 3: Get service worker registration
      console.log("🔧 Getting service worker registration...")
      const registration = await navigator.serviceWorker.ready
      console.log("✅ Service worker ready")

      // Step 4: Subscribe to push manager
      console.log("📡 Subscribing to push manager...")
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      })
      console.log("✅ Push subscription created:", pushSubscription.endpoint)

      // Step 5: Prepare subscription data
      const p256dhKey = pushSubscription.getKey("p256dh")
      const authKey = pushSubscription.getKey("auth")
      
      if (!p256dhKey || !authKey) {
        throw new Error("Failed to get subscription keys")
      }

      const subscriptionData = {
        endpoint: pushSubscription.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
        auth: btoa(String.fromCharCode(...new Uint8Array(authKey))),
      }
      
      console.log("📦 Subscription data prepared:", {
        endpoint: subscriptionData.endpoint,
        hasP256dh: !!subscriptionData.p256dh,
        hasAuth: !!subscriptionData.auth
      })

      // Step 6: Save to backend
      console.log("💾 Saving to backend...")
      const result = await savePushSubscription({
        variables: {
          input: subscriptionData,
        },
      })
      console.log("✅ Saved to backend:", result.data)

      // Step 7: Update state
      setIsSubscribed(true)
      setSubscription(pushSubscription)
      localStorage.setItem("pushNotificationStatus", "granted")
      
      console.log("🎉 Subscription process completed successfully")
      return true
    } catch (error) {
      console.error("❌ Error in subscription process:", error)
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      
      // Check if it's a GraphQL error
      if (error.graphQLErrors) {
        console.error("GraphQL errors:", error.graphQLErrors)
      }
      
      // Check if it's a network error
      if (error.networkError) {
        console.error("Network error:", error.networkError)
      }
      
      localStorage.setItem("pushNotificationStatus", "denied")
      throw error
    } finally {
      console.log("🔄 Setting loading to false")
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    if (!subscription) return
    setIsLoading(true)

    try {
      await subscription.unsubscribe()

      // Remove from backend
      await deletePushSubscription({
        variables: {
          endpoint: subscription.endpoint,
        },
      })
      setIsSubscribed(false)
      setSubscription(null)
      localStorage.removeItem("pushNotificationStatus")

      return true
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getNotificationStatus = () => {
    return localStorage.getItem("pushNotificationStatus")
  }

  const shouldShowPrompt = () => {
    const status = getNotificationStatus()
    return !status && isSupported
  }

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscription,
    subscribe,
    unsubscribe,
    shouldShowPrompt,
    requestPermission,
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export const useNotificationDialog = () => {
  const { shouldShowPrompt, isSupported } = usePushNotifications()
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    const checkAndShowDialog = () => {
      const dismissed = localStorage.getItem("pushNotificationStatus") === "dismissed"
      if (shouldShowPrompt() && !dismissed && isSupported) {
        const timer = setTimeout(() => {
          setShowDialog(true)
        }, 5000) // 5 seconds delay
        return () => clearTimeout(timer)
      }
    }
    checkAndShowDialog()
  }, [shouldShowPrompt, isSupported])

  const closeDialog = () => {
    setShowDialog(false)
  }

  return {
    showDialog,
    closeDialog,
    isSupported,
    setShowDialog
  }
}