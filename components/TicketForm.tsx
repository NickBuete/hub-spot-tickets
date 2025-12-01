'use client'

import { useState } from 'react'
import HubSpotChatIframe from './HubSpotChatIframe'

export default function TicketForm() {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
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
      const response = await fetch('/api/create-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Ticket created successfully!')

        // Show chat if it's a screenshare request
        if (formData.requestType === 'screenshare') {
          setShowChat(true)
        }

        setFormData({
          customerName: '',
          phone: '',
          email: '',
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

        <div className="mb-4">
          <label className="block mb-2 font-medium">Customer Name *</label>
          <input
            type="text"
            required
            value={formData.customerName}
            onChange={(e) =>
              setFormData({ ...formData, customerName: e.target.value })
            }
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium">Phone *</label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium">Email *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium">Issue Description *</label>
          <textarea
            required
            value={formData.issue}
            onChange={(e) =>
              setFormData({ ...formData, issue: e.target.value })
            }
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Ticket'}
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
              screenshare request.
            </p>
            <HubSpotChatIframe
              portalId={process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || ''}
              show={showChat}
            />
          </div>
        </div>
      )}
    </>
  )
}
