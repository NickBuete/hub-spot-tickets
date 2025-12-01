# User Authentication & Identification

## Overview

This application uses environment variables to identify logged-in users for HubSpot chat and ticket creation. In production, these values should come from your authentication system.

## Environment Variables

### Current Setup (Development)

```env
NEXT_PUBLIC_USER_ID=Nick Buete
NEXT_PUBLIC_USER_EMAIL=nick@compounddirect.com
NEXT_PUBLIC_COMPANY_ID=193433675244
```

### Production Implementation

In production, these values should be dynamically set based on the authenticated user's session:

#### Option 1: Server-Side Session (Recommended)

```typescript
// app/page.tsx or layout.tsx
import { getServerSession } from 'next-auth' // or your auth provider

export default async function Home() {
  const session = await getServerSession()

  return (
    <main>
      <TicketForm
        userName={session.user.name}
        userEmail={session.user.email}
        companyId={session.user.companyId}
      />
    </main>
  )
}
```

#### Option 2: Client-Side Context

```typescript
// context/UserContext.tsx
'use client'

import { createContext, useContext } from 'react'

interface UserContextType {
  userName: string
  userEmail: string
  companyId: string
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({
  children,
  user,
}: {
  children: React.ReactNode
  user: UserContextType
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within UserProvider')
  return context
}
```

## HubSpot Identification

When a user interacts with the chat widget or creates a ticket, the system:

1. **Identifies the visitor** using HubSpot's tracking code (`_hsq.identify()`)
2. **Creates or updates a contact** in HubSpot CRM with:

   - First Name (parsed from userName)
   - Last Name (parsed from userName)
   - Email Address
   - Company ID (for association)

3. **Associates tickets** with the contact record
4. **Personalizes the chat** - HubSpot will greet the user as "Hi {firstName}"

## Expected User Experience

### When User is Known (Has HubSpot Contact Record)

1. User logs into Compound Direct workspace
2. Chat widget loads and identifies user via email
3. HubSpot recognizes the contact and shows: **"Hi Nick! 👋"**
4. Previous conversation history is available
5. Support agents see full contact context

### When User is New (No HubSpot Contact Record)

1. User creates first ticket or opens chat
2. Contact record is automatically created in HubSpot
3. Subsequent interactions will recognize them
4. HubSpot shows: **"Hi Nick! 👋"** after identification

## Contact Matching

HubSpot matches contacts based on **email address**. The system:

- Creates a new contact if email doesn't exist
- Updates existing contact if email is found (409 conflict)
- Associates all tickets with the matching contact
- Preserves conversation history across sessions

## Multi-Workspace Support

For SaaS platforms with multiple customer workspaces:

```typescript
// Workspace-specific identification
window._hsq.push([
  'identify',
  {
    email: user.email,
    firstname: user.firstName,
    lastname: user.lastName,
    company: workspace.companyId,
    workspace_slug: workspace.slug,
    workspace_hostname: workspace.hostname,
  },
])
```

This allows support agents to see which workspace the user is contacting from.

## Migration from Current Setup

### Step 1: Update TicketForm Component

```typescript
// components/TicketForm.tsx
interface TicketFormProps {
  userName: string
  userEmail: string
  companyId: string
}

export default function TicketForm({
  userName,
  userEmail,
  companyId,
}: TicketFormProps) {
  // Remove process.env reads, use props instead
  // ...
}
```

### Step 2: Pass User Data from Parent

```typescript
// app/page.tsx
export default function Home() {
  const user = getCurrentUser() // Your auth system

  return (
    <TicketForm
      userName={user.name}
      userEmail={user.email}
      companyId={user.companyId}
    />
  )
}
```

### Step 3: Remove Environment Variables

Remove these from production `.env.local`:

- ~~NEXT_PUBLIC_USER_ID~~
- ~~NEXT_PUBLIC_USER_EMAIL~~
- ~~NEXT_PUBLIC_COMPANY_ID~~

Keep these (they're global config):

- `NEXT_PUBLIC_HUBSPOT_PORTAL_ID`
- `NEXT_PUBLIC_CHATFLOW_SUPPORT`
- `HUBSPOT_ACCESS_TOKEN` (server-side only)

## Testing

To test user identification:

1. Set real email in `.env.local`: `NEXT_PUBLIC_USER_EMAIL=your.email@company.com`
2. Clear HubSpot cookies: Run `window.HubSpotConversations.clear({ resetWidget: true })` in console
3. Refresh page
4. Open chat widget
5. Verify HubSpot shows: "Hi {YourFirstName}!"

## Troubleshooting

### Chat doesn't recognize user

1. Check console for "Identifying HubSpot visitor:" log
2. Verify email format is valid
3. Ensure contact exists in HubSpot CRM
4. Clear cookies and try again: `window.HubSpotConversations.clear({ resetWidget: true })`

### Wrong name appears

1. Check HubSpot contact record has correct firstname/lastname
2. Update contact via API or HubSpot UI
3. Refresh page after update

### Contact not associating with company

1. Verify `NEXT_PUBLIC_COMPANY_ID` is correct
2. Check HubSpot company record exists
3. Ensure associations are created in ticket API
