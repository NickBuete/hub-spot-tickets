'use client'

import { useEffect, useState } from 'react'
import HubSpotChatIframe from './HubSpotChatIframe'

interface SmartHubSpotChatProps {
  show?: boolean
  userEmail?: string
  companyId?: string
  workspaceId?: string
  requestType?: string
}

export default function SmartHubSpotChat({
  show = true,
  userEmail,
  companyId,
  workspaceId,
  requestType,
}: SmartHubSpotChatProps) {
  const [chatConfig, setChatConfig] = useState({
    portalId: '',
    chatflowId: '',
    shouldShow: false,
  })

  useEffect(() => {
    if (!show) return

    const hostname =
      typeof window !== 'undefined' ? window.location.hostname : ''
    const subdomain = hostname.split('.')[0]

    // Determine environment and chatflow
    let environment = 'unknown'
    let chatflowId = ''
    let shouldShow = true

    if (hostname.startsWith('cd-') || hostname.endsWith('.compound.direct')) {
      // Customer workspace - show embedded chat panel
      environment = 'customer_workspace'
      chatflowId = process.env.NEXT_PUBLIC_CHATFLOW_SUPPORT || ''
      shouldShow = true
    } else if (hostname === 'localhost' || hostname.startsWith('localhost:')) {
      // Development environment - test with support chatflow
      environment = 'development'
      chatflowId = process.env.NEXT_PUBLIC_CHATFLOW_SUPPORT || ''
      shouldShow = true
    } else {
      // Any other domain (compound.direct, admin, etc.) - no embedded chat
      // Admin team uses HubSpot inbox directly
      shouldShow = false
      environment = 'other'
    }

    // Extract workspace ID from subdomain if not provided
    const detectedWorkspaceId =
      workspaceId || (hostname.startsWith('cd-') ? subdomain : '')

    // Configure HubSpot with context
    if (typeof window !== 'undefined' && shouldShow) {
      window.hsConversationsSettings = {
        loadImmediately: true,
        identificationEmail: userEmail,
      }

      // Add custom fields for context
      const customFields: Array<{ name: string; value: string }> = [
        {
          name: 'environment',
          value: environment,
        },
        {
          name: 'hostname',
          value: hostname,
        },
      ]

      if (detectedWorkspaceId) {
        customFields.push({
          name: 'workspace_id',
          value: detectedWorkspaceId,
        })
      }

      if (companyId) {
        customFields.push({
          name: 'company_id',
          value: companyId,
        })
      }

      if (requestType) {
        customFields.push({
          name: 'request_type',
          value: requestType,
        })
      }

      // Merge custom fields into settings
      window.hsConversationsSettings = {
        ...window.hsConversationsSettings,
        ...customFields.reduce((acc, field) => {
          acc[field.name] = field.value
          return acc
        }, {} as Record<string, string>),
      }
    }

    setChatConfig({
      portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || '',
      chatflowId,
      shouldShow,
    })
  }, [show, userEmail, companyId, workspaceId, requestType])

  if (!chatConfig.shouldShow || !chatConfig.portalId) {
    return null
  }

  return <HubSpotChatIframe portalId={chatConfig.portalId} show={show} />
}
