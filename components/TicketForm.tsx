'use client'

import { useState } from 'react'
import SmartHubSpotChat from './SmartHubSpotChat'

export default function TicketForm() {
  const userName = process.env.NEXT_PUBLIC_USER_ID || ''
  const userEmail = process.env.NEXT_PUBLIC_USER_EMAIL || ''
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || ''

  const [formData, setFormData] = useState({
    issue: '',
    requestType: 'general',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showChat, setShowChat] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // For screenshare requests, skip ticket creation and go straight to chat
      if (formData.requestType === 'screenshare') {
        setShowChat(true)
        setLoading(false)
        return
      }

      // Create ticket with userName and userEmail from env
      const response = await fetch('/api/create-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: userName,
          email: userEmail,
          phone: '000-000-0000', // Placeholder phone (can be added to env if needed)
          issue: formData.issue,
          requestType: formData.requestType,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Ticket created successfully!')

        setFormData({
          issue: '',
          requestType: 'general',
        })
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Failed to submit ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
        {/* Display user info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">Logged in as:</p>
          <p className="font-semibold text-gray-900">{userName}</p>
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium">Request Type *</label>
          <select
            required
            value={formData.requestType}
            onChange={(e) =>
              setFormData({ ...formData, requestType: e.target.value })
            }
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="general">General Support</option>
            <option value="screenshare">Request Screenshare</option>
            <option value="technical">Technical Issue</option>
            <option value="billing">Billing Question</option>
          </select>
        </div>

        {formData.requestType !== 'screenshare' && (
          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Issue Description *
            </label>
            <textarea
              required
              value={formData.issue}
              onChange={(e) =>
                setFormData({ ...formData, issue: e.target.value })
              }
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Describe your issue or question..."
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
        >
          {loading
            ? formData.requestType === 'screenshare'
              ? 'Starting chat...'
              : 'Submitting...'
            : formData.requestType === 'screenshare'
            ? 'Start Chat'
            : 'Submit Ticket'}
        </button>

        {message && (
          <p
            className={`mt-4 text-center ${
              message.includes('Error') ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {message}
          </p>
        )}
      </form>

      {/* Show chat iframe for screenshare requests */}
      {showChat && (
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Live Chat Support
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Hide chat panel (conversation continues in widget)"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              A support agent will connect with you shortly to help with your
              screenshare request. The floating chat widget will remain in the
              bottom right corner.
            </p>
            <SmartHubSpotChat
              show={showChat}
              userEmail={userEmail}
              userName={userName}
              companyId={companyId}
              requestType={formData.requestType}
            />
          </div>
        </div>
      )}
    </>
  )
}
