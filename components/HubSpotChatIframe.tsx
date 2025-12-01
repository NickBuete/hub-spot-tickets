'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    hsConversationsSettings?: any
    hsConversationsOnReady?: Array<() => void>
    HubSpotConversations?: any
  }
}

interface HubSpotChatIframeProps {
  portalId: string
  show?: boolean
}

export default function HubSpotChatIframe({
  portalId,
  show = true,
}: HubSpotChatIframeProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [chatOpened, setChatOpened] = useState(false)
  const CONVERSATION_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds

  // Check if we should reset the conversation based on timeout
  const shouldResetConversation = () => {
    const lastActivity = localStorage.getItem('hubspot_last_activity')
    if (!lastActivity) return false

    const timeSinceActivity = Date.now() - parseInt(lastActivity, 10)
    return timeSinceActivity > CONVERSATION_TIMEOUT
  }

  // Update last activity timestamp
  const updateLastActivity = () => {
    localStorage.setItem('hubspot_last_activity', Date.now().toString())
  }

  useEffect(() => {
    if (!show) return

    // Check if conversation should be reset due to timeout
    if (shouldResetConversation()) {
      console.log('Conversation timeout exceeded, resetting...')
      // Clear HubSpot cookies and reset widget
      if (window.HubSpotConversations) {
        window.HubSpotConversations.clear({ resetWidget: true })
      }
      localStorage.removeItem('hubspot_last_activity')
      localStorage.removeItem('hubspot_conversation_active')
    }

    // Define the callback to execute when HubSpot Conversations API is ready
    const onConversationsAPIReady = () => {
      console.log('HubSpot Conversations API ready')
      setIsLoaded(true)

      // Listen for conversation started event
      window.HubSpotConversations.on('conversationStarted', (payload: any) => {
        console.log(
          `Conversation started: ${payload.conversation.conversationId}`
        )
        localStorage.setItem('hubspot_conversation_active', 'true')
        updateLastActivity()
      })

      // Listen for conversation closed event from inbox
      window.HubSpotConversations.on('conversationClosed', (payload: any) => {
        console.log(
          `Conversation closed: ${payload.conversation.conversationId}`
        )
        // Reset the widget to start fresh next time
        setTimeout(() => {
          window.HubSpotConversations.clear({ resetWidget: true })
          localStorage.removeItem('hubspot_conversation_active')
          localStorage.removeItem('hubspot_last_activity')
        }, 1000)
      })

      // Listen for user interactions to update activity timestamp
      window.HubSpotConversations.on('userInteractedWithWidget', () => {
        updateLastActivity()
      })

      // Listen for widget loaded event
      window.HubSpotConversations.on('widgetLoaded', () => {
        console.log('Widget loaded, opening chat...')
        // Open the widget
        window.HubSpotConversations.widget.open()
        setChatOpened(true)
        updateLastActivity()
      })

      // If loadImmediately is true, the widget will auto-load
      // Otherwise, manually call load
      if (!window.hsConversationsSettings?.loadImmediately) {
        window.HubSpotConversations.widget.load()
      }
    }

    // Configure HubSpot settings BEFORE loading the script
    // This must be set before the script loads for proper initialization
    if (!window.hsConversationsSettings) {
      window.hsConversationsSettings = {}
    }

    // Merge with existing settings (set by SmartHubSpotChat)
    window.hsConversationsSettings = {
      ...window.hsConversationsSettings,
      loadImmediately: true,
    }

    // Check if API is already available
    if (window.HubSpotConversations) {
      onConversationsAPIReady()
      return
    }

    // Set up the callback for when API becomes ready
    window.hsConversationsOnReady = window.hsConversationsOnReady || []
    window.hsConversationsOnReady.push(onConversationsAPIReady)

    // Load HubSpot chat script if not already loaded
    const existingScript = document.getElementById('hs-script-loader')

    if (!existingScript) {
      const script = document.createElement('script')
      script.src = `//js-ap1.hs-scripts.com/${portalId}.js`
      script.async = true
      script.defer = true
      script.id = 'hs-script-loader'

      document.body.appendChild(script)
    }

    // Update activity on page unload
    const handleBeforeUnload = () => {
      if (localStorage.getItem('hubspot_conversation_active') === 'true') {
        updateLastActivity()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [portalId, show])

  if (!show) return null

  return (
    <div className="w-full p-8 bg-blue-50 border-2 border-blue-200 rounded-lg">
      <div className="text-center">
        {!isLoaded && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading chat widget...</p>
          </>
        )}
        {isLoaded && !chatOpened && (
          <>
            <div className="animate-pulse mb-4">
              <svg
                className="w-16 h-16 mx-auto text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">Opening chat...</p>
          </>
        )}
        {chatOpened && (
          <>
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-bold text-lg mb-2">
              Chat opened! 💬
            </p>
            <p className="text-gray-600">
              Look for the chat widget in the bottom right corner of your
              screen.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
