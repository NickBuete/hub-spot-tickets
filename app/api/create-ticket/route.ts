import { Client } from '@hubspot/api-client'
import { NextResponse } from 'next/server'
import type { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/contacts'
import type { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/associations/v4'

const hubspotClient = new Client({
  accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
})

export async function POST(request: Request) {
  try {
    const { customerName, phone, email, issue } = await request.json()

    const ticketProperties = {
      subject: `Support Request from ${customerName}`,
      content: issue,
      hs_pipeline_stage: '1',
      hs_pipeline: '0',
    }

    // Create the ticket
    const ticket = await hubspotClient.crm.tickets.basicApi.create({
      properties: ticketProperties,
      associations: [],
    })

    // Create or find contact
    let contactId
    try {
      const contact = await hubspotClient.crm.contacts.basicApi.create({
        properties: {
          firstname: customerName.split(' ')[0],
          lastname: customerName.split(' ').slice(1).join(' ') || '',
          email: email,
          phone: phone,
        },
      })
      contactId = contact.id
    } catch (error: any) {
      // Contact might already exist
      if (error.code === 409) {
        const searchResult =
          await hubspotClient.crm.contacts.searchApi.doSearch({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: 'email',
                    operator: 'EQ' as FilterOperatorEnum,
                    value: email,
                  },
                ],
              },
            ],
          })
        contactId = searchResult.results[0]?.id
      }
    }

    // Associate ticket with contact
    if (contactId) {
      await hubspotClient.crm.associations.v4.batchApi.create(
        'tickets',
        'contacts',
        {
          inputs: [
            {
              _from: { id: ticket.id },
              to: { id: contactId },
              types: [
                {
                  associationCategory:
                    'HUBSPOT_DEFINED' as AssociationSpecAssociationCategoryEnum,
                  associationTypeId: 16,
                },
              ],
            },
          ],
        }
      )
    }

    return NextResponse.json({ success: true, ticketId: ticket.id })
  } catch (error: any) {
    console.error('HubSpot API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    )
  }
}
