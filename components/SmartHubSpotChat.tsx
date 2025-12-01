'use client'

import { useEffect, useState } from 'react'
import HubSpotChatIframe from './HubSpotChatIframe'

declare global {
  interface Window {
    compoundDirectTenant?: {
      slug: string
      hostname: string
    }
    _hsq?: Array<any>
    hsConversationsSettings?: any
    hsConversationsOnReady?: Array<() => void>
    HubSpotConversations?: any
  }
}

interface SmartHubSpotChatProps {
  show?: boolean
  userEmail?: string
  userName?: string
  companyId?: string
  workspaceId?: string
  requestType?: string
}

export default function SmartHubSpotChat({
  show = true,
  userEmail,
  userName,
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
      // Set up tenant identification for multi-tenant support
      window.compoundDirectTenant = {
        slug: detectedWorkspaceId || subdomain,
        hostname: hostname,
      }

      // Initialize HubSpot tracking queue
      window._hsq = window._hsq || []

      // Identify the visitor with email and name
      if (userEmail) {
        const identificationData: any = {
          email: userEmail,
        }

        if (userName) {
          identificationData.firstname = userName.split(' ')[0]
          if (userName.split(' ').length > 1) {
            identificationData.lastname = userName.split(' ').slice(1).join(' ')
          }
        }

        // Add workspace context
        identificationData.workspace_slug = window.compoundDirectTenant.slug
        identificationData.workspace_hostname =
          window.compoundDirectTenant.hostname

        if (companyId) {
          identificationData.company = companyId
        }

        console.log('Identifying HubSpot visitor:', identificationData)
        window._hsq.push(['identify', identificationData])

        // Track page view with identification
        window._hsq.push(['trackPageView'])
      }

      // Configure chat widget settings
      window.hsConversationsSettings = {
        loadImmediately: true,
        identificationEmail: userEmail,
        identificationToken: userEmail, // Additional identification
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

      if (userName) {
        customFields.push({
          name: 'user_name',
          value: userName,
        })
      }

      if (requestType) {
        customFields.push({
          name: 'request_type',
          value: requestType,
        })
      }

      // Configure chat widget settings with custom properties
      // Must be set before the HubSpot script loads
      window.hsConversationsSettings = {
        loadImmediately: true,
        identificationEmail: userEmail,
        // Merge custom fields as top-level properties
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
  }, [show, userEmail, userName, companyId, workspaceId, requestType])

  // Additional effect to ensure identification happens when widget is ready
  useEffect(() => {
    if (!show || !userEmail || !userName) return

    const identifyWhenReady = () => {
      if (typeof window !== 'undefined' && window.HubSpotConversations) {
        console.log(
          'Re-identifying user in loaded widget:',
          userName,
          userEmail
        )

        // Force re-identification
        if (window._hsq) {
          const identificationData: any = {
            email: userEmail,
            firstname: userName.split(' ')[0],
          }

          if (userName.split(' ').length > 1) {
            identificationData.lastname = userName.split(' ').slice(1).join(' ')
          }

          if (companyId) {
            identificationData.company = companyId
          }

          window._hsq.push(['identify', identificationData])
        }
      }
    }

    // Try immediately
    identifyWhenReady()

    // Also try after a short delay to ensure widget is fully loaded
    const timeout = setTimeout(identifyWhenReady, 1000)

    return () => clearTimeout(timeout)
  }, [show, userEmail, userName, companyId])

  if (!chatConfig.shouldShow || !chatConfig.portalId) {
    return null
  }

  return <HubSpotChatIframe portalId={chatConfig.portalId} show={show} />
}
