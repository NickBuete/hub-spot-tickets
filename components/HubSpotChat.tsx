'use client'

import { useEffect } from 'react'

interface HubSpotChatProps {
  portalId: string
  show?: boolean
}

// Window types are defined in SmartHubSpotChat.tsx

export default function HubSpotChat({
  portalId,
  show = true,
}: HubSpotChatProps) {
  useEffect(() => {
    if (!show) return

    // Load HubSpot chat script
    const script = document.createElement('script')
    script.src = `//js.hs-scripts.com/${portalId}.js`
    script.async = true
    script.defer = true
    script.id = 'hs-script-loader'

    // Check if script already exists
    const existingScript = document.getElementById('hs-script-loader')
    if (!existingScript) {
      document.body.appendChild(script)
    }

    // Cleanup function
    return () => {
      if (window.HubSpotConversations?.widget) {
        try {
          window.HubSpotConversations.widget.remove()
        } catch (error) {
          console.error('Error removing HubSpot chat:', error)
        }
      }
    }
  }, [portalId, show])

  useEffect(() => {
    if (show && window.HubSpotConversations?.widget) {
      try {
        window.HubSpotConversations.widget.open()
      } catch (error) {
        console.error('Error opening HubSpot chat:', error)
      }
    }
  }, [show])

  return null // Chat widget is injected by HubSpot script
}
