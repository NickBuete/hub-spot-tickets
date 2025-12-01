import TicketForm from '@/components/TicketForm'
import MyTickets from '@/components/MyTickets'
import ConversationManager from '@/components/ConversationManager'

export default function Home() {
  // In a real app, you'd get the companyId from authentication/session
  // For now, you can pass it as a query parameter or hardcode for testing
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || ''

  return (
    <main className="min-h-screen py-12 bg-gray-50">
      <ConversationManager />
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Submit a Support Ticket
        </h1>
        <div className="bg-white rounded-lg shadow-md mb-8">
          <TicketForm />
        </div>

        {/* Show tickets if companyId is available */}
        {companyId && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <MyTickets companyId={companyId} />
          </div>
        )}
      </div>
    </main>
  )
}
