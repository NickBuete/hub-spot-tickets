import TicketForm from '@/components/TicketForm'

export default function Home() {
  return (
    <main className="min-h-screen py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Submit a Support Ticket
        </h1>
        <div className="bg-white rounded-lg shadow-md">
          <TicketForm />
        </div>
      </div>
    </main>
  )
}
