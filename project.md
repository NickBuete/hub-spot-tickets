# HubSpot Ticket Form with Next.js

This guide shows how to create a Next.js form that posts tickets to HubSpot with customer details.

## 1. Install the HubSpot Client Library

```bash
npm install @hubspot/api-client
```

## 2. Set Up Environment Variables

Create a `.env.local` file:

```
HUBSPOT_ACCESS_TOKEN=your_access_token_here
```

## 3. Create an API Route

Create `app/api/create-ticket/route.ts` (App Router) or `pages/api/create-ticket.ts` (Pages Router):

**App Router (`app/api/create-ticket/route.ts`):**

```typescript
import { Client } from '@hubspot/api-client';
import { NextResponse } from 'next/server';

const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

export async function POST(request: Request) {
  try {
    const { customerName, phone, email, issue } = await request.json();

    const ticketProperties = {
      subject: `Support Request from ${customerName}`,
      content: issue,
      hs_pipeline_stage: 'YOUR_PIPELINE_STAGE_ID', // e.g., '1' for 'New'
      hs_pipeline: 'YOUR_PIPELINE_ID', // Get this from HubSpot settings
    };

    // Create the ticket
    const ticket = await hubspotClient.crm.tickets.basicApi.create({
      properties: ticketProperties,
      associations: []
    });

    // Create or find contact
    let contactId;
    try {
      const contact = await hubspotClient.crm.contacts.basicApi.create({
        properties: {
          firstname: customerName.split(' ')[0],
          lastname: customerName.split(' ').slice(1).join(' ') || '',
          email: email,
          phone: phone,
        }
      });
      contactId = contact.id;
    } catch (error: any) {
      // Contact might already exist
      if (error.code === 409) {
        const searchResult = await hubspotClient.crm.contacts.searchApi.doSearch({
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: email
            }]
          }]
        });
        contactId = searchResult.results[0]?.id;
      }
    }

    // Associate ticket with contact
    if (contactId) {
      await hubspotClient.crm.tickets.associationsApi.create(
        ticket.id,
        'contacts',
        contactId,
        [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 16 }]
      );
    }

    return NextResponse.json({ success: true, ticketId: ticket.id });
  } catch (error: any) {
    console.error('HubSpot API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
```

**Pages Router (`pages/api/create-ticket.ts`):**

```typescript
import { Client } from '@hubspot/api-client';
import type { NextApiRequest, NextApiResponse } from 'next';

const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerName, phone, email, issue } = req.body;

    const ticketProperties = {
      subject: `Support Request from ${customerName}`,
      content: issue,
      hs_pipeline_stage: 'YOUR_PIPELINE_STAGE_ID',
      hs_pipeline: 'YOUR_PIPELINE_ID',
    };

    // Create the ticket
    const ticket = await hubspotClient.crm.tickets.basicApi.create({
      properties: ticketProperties,
      associations: []
    });

    // Create or find contact
    let contactId;
    try {
      const contact = await hubspotClient.crm.contacts.basicApi.create({
        properties: {
          firstname: customerName.split(' ')[0],
          lastname: customerName.split(' ').slice(1).join(' ') || '',
          email: email,
          phone: phone,
        }
      });
      contactId = contact.id;
    } catch (error: any) {
      if (error.code === 409) {
        const searchResult = await hubspotClient.crm.contacts.searchApi.doSearch({
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: email
            }]
          }]
        });
        contactId = searchResult.results[0]?.id;
      }
    }

    // Associate ticket with contact
    if (contactId) {
      await hubspotClient.crm.tickets.associationsApi.create(
        ticket.id,
        'contacts',
        contactId,
        [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 16 }]
      );
    }

    return res.status(200).json({ success: true, ticketId: ticket.id });
  } catch (error: any) {
    console.error('HubSpot API Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create ticket' });
  }
}
```

## 4. Create the Form Component

**`components/TicketForm.tsx`:**

```typescript
'use client';

import { useState } from 'react';

export default function TicketForm() {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    issue: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/create-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Ticket created successfully!');
        setFormData({ customerName: '', phone: '', email: '', issue: '' });
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
      <div className="mb-4">
        <label className="block mb-2 font-medium">Customer Name *</label>
        <input
          type="text"
          required
          value={formData.customerName}
          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-medium">Phone *</label>
        <input
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-medium">Email *</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-medium">Issue Description *</label>
        <textarea
          required
          value={formData.issue}
          onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
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
        <p className={`mt-4 text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </p>
      )}
    </form>
  );
}
```

## 5. Use the Component in Your Page

**App Router (`app/page.tsx`):**

```typescript
import TicketForm from '@/components/TicketForm';

export default function Home() {
  return (
    <main className="min-h-screen py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Submit a Support Ticket</h1>
      <TicketForm />
    </main>
  );
}
```

## Key Configuration Steps

### Finding Your Pipeline and Stage IDs

1. Go to HubSpot Settings > Objects > Tickets
2. Click on "Pipelines"
3. Click on your pipeline name
4. The URL will contain your pipeline ID
5. Each stage has an ID visible in the pipeline settings

### Alternative: Use HubSpot API to Get Pipeline IDs

```typescript
// Add this to your API route temporarily to log pipeline info
const pipelines = await hubspotClient.crm.pipelines.pipelinesApi.getAll('tickets');
console.log('Pipelines:', JSON.stringify(pipelines, null, 2));
```

## Important Notes

- **Replace placeholders**: Update `YOUR_PIPELINE_ID` and `YOUR_PIPELINE_STAGE_ID` with actual values
- **Security**: Never expose your HubSpot access token in client-side code
- **Error handling**: The code handles existing contacts by searching for them
- **Association**: Tickets are automatically associated with contacts using association type ID 16
- **Validation**: Add additional validation as needed for your use case

## Optional Enhancements

### Add Custom Properties

```typescript
const ticketProperties = {
  subject: `Support Request from ${customerName}`,
  content: issue,
  hs_pipeline_stage: 'YOUR_PIPELINE_STAGE_ID',
  hs_pipeline: 'YOUR_PIPELINE_ID',
  // Add custom properties
  priority: 'medium',
  category: 'technical_support',
  // Add any custom properties you've created in HubSpot
};
```

### Add Loading State UI

```typescript
{loading && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg">
      <p>Creating ticket...</p>
    </div>
  </div>
)}
```