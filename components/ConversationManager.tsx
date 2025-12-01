'use client'

import { useEffect, useState } from 'react'

export default function ConversationManager() {
  const [hasActiveConversation, setHasActiveConversation] = useState(false)
  const [lastActivity, setLastActivity] = useState<Date | null>(null)

  useEffect(() => {
    const checkConversationStatus = () => {
      const isActive =
        localStorage.getItem('hubspot_conversation_active') === 'true'
      const lastActivityTime = localStorage.getItem('hubspot_last_activity')

      setHasActiveConversation(isActive)
      if (lastActivityTime) {
        setLastActivity(new Date(parseInt(lastActivityTime, 10)))
      } else {
        setLastActivity(null)
      }
    }

    // Check on mount
    checkConversationStatus()

    // Check periodically
    const interval = setInterval(checkConversationStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleResetConversation = () => {
    if (
      confirm(
        'Are you sure you want to end the current conversation and start fresh?'
      )
    ) {
      if (window.HubSpotConversations) {
        window.HubSpotConversations.clear({ resetWidget: true })
      }
      localStorage.removeItem('hubspot_conversation_active')
      localStorage.removeItem('hubspot_last_activity')
      setHasActiveConversation(false)
      setLastActivity(null)

      // Reload the page to reinitialize
      window.location.reload()
    }
  }

  if (!hasActiveConversation) {
    return null
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins === 1) return '1 minute ago'
    if (diffMins < 60) return `${diffMins} minutes ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return '1 hour ago'
    return `${diffHours} hours ago`
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-green-50 border-2 border-green-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Active Conversation
              </p>
              {lastActivity && (
                <p className="text-xs text-green-600 mt-1">
                  Last activity: {formatTime(lastActivity)}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <button
            onClick={handleResetConversation}
            className="w-full text-xs bg-white border border-green-300 text-green-700 px-3 py-2 rounded hover:bg-green-50 transition-colors"
          >
            End Conversation & Start Fresh
          </button>
        </div>
      </div>
    </div>
  )
}
