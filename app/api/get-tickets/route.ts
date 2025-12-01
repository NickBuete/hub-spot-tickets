import { Client } from '@hubspot/api-client'
import { NextResponse } from 'next/server'

const hubspotClient = new Client({
  accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    // Search for tickets associated with the company
    const searchResult = await hubspotClient.crm.tickets.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'associations.company',
              operator: 'EQ',
              value: companyId,
            },
          ],
        },
      ],
      sorts: [
        {
          propertyName: 'createdate',
          direction: 'DESCENDING',
        },
      ],
      properties: [
        'subject',
        'content',
        'hs_pipeline_stage',
        'hs_pipeline',
        'hs_ticket_priority',
        'createdate',
        'hs_lastmodifieddate',
      ],
      limit: 100,
    })

    return NextResponse.json({
      success: true,
      tickets: searchResult.results,
      total: searchResult.total,
    })
  } catch (error: any) {
    console.error('HubSpot API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}
