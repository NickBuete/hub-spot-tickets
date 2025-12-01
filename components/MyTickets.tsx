'use client'

import { useState, useEffect } from 'react'

interface Ticket {
  id: string
  properties: {
    subject: string
    content: string
    hs_pipeline_stage: string
    hs_pipeline: string
    hs_ticket_priority?: string
    createdate: string
    hs_lastmodifieddate: string
  }
}

interface MyTicketsProps {
  companyId: string
}

export default function MyTickets({ companyId }: MyTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!companyId) return

    const fetchTickets = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/get-tickets?companyId=${companyId}`)
        const data = await response.json()

        if (response.ok) {
          setTickets(data.tickets || [])
        } else {
          setError(data.error || 'Failed to fetch tickets')
        }
      } catch (err) {
        setError('Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [companyId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (stage: string) => {
    // Customize based on your pipeline stages
    const stageColors: { [key: string]: string } = {
      '1': 'bg-blue-100 text-blue-800',
      '2': 'bg-yellow-100 text-yellow-800',
      '3': 'bg-green-100 text-green-800',
      '4': 'bg-gray-100 text-gray-800',
    }
    return stageColors[stage] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (stage: string) => {
    // Customize based on your pipeline stages
    const stageLabels: { [key: string]: string } = {
      '1': 'New',
      '2': 'In Progress',
      '3': 'Resolved',
      '4': 'Closed',
    }
    return stageLabels[stage] || `Stage ${stage}`
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600">Loading your tickets...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No support tickets found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        My Support Tickets
      </h2>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 flex-1">
                {ticket.properties.subject}
              </h3>
              <span
                className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  ticket.properties.hs_pipeline_stage
                )}`}
              >
                {getStatusLabel(ticket.properties.hs_pipeline_stage)}
              </span>
            </div>

            {ticket.properties.content && (
              <p className="text-gray-600 mb-3 line-clamp-2">
                {ticket.properties.content}
              </p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Created: {formatDate(ticket.properties.createdate)}</span>
              {ticket.properties.hs_ticket_priority && (
                <span className="capitalize">
                  Priority: {ticket.properties.hs_ticket_priority}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
