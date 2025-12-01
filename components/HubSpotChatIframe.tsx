'use client'

import { useEffect, useRef } from 'react'

interface HubSpotChatIframeProps {
  portalId: string
  show?: boolean
}

export default function HubSpotChatIframe({
  portalId,
  show = true,
}: HubSpotChatIframeProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!show || !containerRef.current) return

    // Configure HubSpot to embed inline
    window.hsConversationsSettings = {
      loadImmediately: true,
      inlineEmbedSelector: '#hubspot-chat-container',
    }

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

    // Open chat when ready
    window.hsConversationsOnReady = [
      () => {
        if (window.HubSpotConversations?.widget) {
          window.HubSpotConversations.widget.load()
        }
      },
    ]

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

  if (!show) return null

  return (
    <div className="w-full h-full">
      <div
        id="hubspot-chat-container"
        ref={containerRef}
        className="w-full h-[600px] border border-gray-300 rounded-lg overflow-hidden"
      />
    </div>
  )
}
