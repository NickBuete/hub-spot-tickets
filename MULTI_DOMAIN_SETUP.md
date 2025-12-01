# Multi-Domain Setup Guide

## Architecture Overview

### User-Facing (Customer Workspaces Only)
- **Domains:** `cd-{customer}.compound.direct` (e.g., `cd-nick.compound.direct`, `cd-acme.compound.direct`)
- **Chat Display:** Embedded side panel in the customer's workspace application
- **Purpose:** Direct support access for customers while using their workspace
- **HubSpot Chatflow:** "Customer Support"

### Admin Team (No Embedded Chat)
- **Access Method:** HubSpot inbox at `app.hubspot.com/conversations/inbox`
- **View:** All customer chats from all workspaces in one unified inbox
- **Respond:** Through HubSpot interface (desktop or mobile app)
- **No embedded chat on admin portals** - admins don't need it, they use HubSpot directly

---

## How It Works

```
Customer (cd-nick.compound.direct)          Admin Team (HubSpot)
┌─────────────────────────────┐            ┌──────────────────────┐
│                             │            │                      │
│  [Customer Workspace]       │            │  HubSpot Inbox       │
│                             │   Chat     │                      │
│  ┌─────────────────────┐   │ ────────> │  • All chats         │
│  │                     │   │            │  • Full context      │
│  │  Main Content       │   │  Messages  │  • Customer info     │
│  │                     │   │ <──────── │  • Quick responses   │
│  │                     │   │            │                      │
│  └─────────────────────┘   │            └──────────────────────┘
│                             │
│  ┌──────────────────┐      │
│  │ Embedded Chat    │      │
│  │ Side Panel       │      │
│  │                  │      │
│  │ [💬 Support]     │      │
│  └──────────────────┘      │
└─────────────────────────────┘
```

---

## Implementation

### 1. Add Chat to Customer Workspace Layout

```typescript
// app/layout.tsx (for customer workspaces)
import SmartHubSpotChat from '@/components/SmartHubSpotChat'

export default function CustomerWorkspaceLayout({ children }) {
  const user = getCurrentUser() // Your auth logic
  
  return (
    <div className="flex h-screen">
      {/* Main workspace content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      
      {/* Embedded chat side panel */}
      <aside className="w-96 border-l border-gray-200 bg-white">
        <div className="p-4 border-b">
          <h3 className="font-bold text-lg">Support Chat</h3>
          <p className="text-sm text-gray-600">We're here to help!</p>
        </div>
        <SmartHubSpotChat
          show={true}
          userEmail={user.email}
          companyId={user.companyId}
          workspaceId={user.workspaceId}
        />
      </aside>
    </div>
  )
}
```

### 2. Conditional Chat (Show on Request)

For screenshare or specific support requests:

```typescript
'use client'

import { useState } from 'react'
import SmartHubSpotChat from '@/components/SmartHubSpotChat'

export default function SupportPage() {
  const [showChat, setShowChat] = useState(false)
  const user = getCurrentUser()

  return (
    <div className="relative">
      {/* Main content */}
      <div className="p-8">
        <h1>Need Help?</h1>
        <button
          onClick={() => setShowChat(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg"
        >
          Start Live Chat
        </button>
      </div>

      {/* Sliding chat panel */}
      {showChat && (
        <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-2xl z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold">Live Support</h3>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <SmartHubSpotChat
            show={showChat}
            userEmail={user.email}
            companyId={user.companyId}
            workspaceId={user.workspaceId}
            requestType="screenshare"
          />
        </div>
      )}
    </div>
  )
}
```


### 3. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_HUBSPOT_PORTAL_ID=12345678
NEXT_PUBLIC_CHATFLOW_SUPPORT=your-support-chatflow-id
```

### 4. Tenant Identification & HubSpot Session Context

To support multiple customer subdomains with a single shared chatflow, we pass tenant metadata into HubSpot via JavaScript.

Add the following to your root layout (or a global script) so it runs on every customer workspace page. This keeps the chat embedded in the **right-hand side panel** but gives HubSpot full tenant context.

```html
<script>
  // Extract the workspace slug from the subdomain (e.g. cd-nick → cd-nick)
  window.compoundDirectTenant = {
    slug: window.location.hostname.split('.')[0],
    hostname: window.location.hostname
  };
</script>

<script>
  // Attach tenant metadata to the HubSpot session
  window._hsq = window._hsq || [];
  window._hsq.push([
    'identify',
    {
      workspace_slug: window.compoundDirectTenant.slug,
      workspace_hostname: window.compoundDirectTenant.hostname
    }
  ]);
</script>
```

This ensures every embedded chat panel on the **RHS of the workspace UI** is associated with:
- The correct workspace/tenant (`workspace_slug`)
- The exact hostname (`workspace_hostname`)

These properties can be used in HubSpot for:
- Inbox filters
- Workflows and routing
- Reporting per workspace/tenant

---

## HubSpot Configuration

### Step 1: Create Customer Support Chatflow

1. Log into HubSpot
2. Go to **Conversations** → **Chatflows**
3. Click **Create chatflow** → **Website**
4. Name: "Customer Support - Workspaces"

**Build Tab:**
- Welcome message: "Hi! How can we help you today?"
- Type: **Live chat** (direct to agents, no bot needed)
- Routing: Round robin or specific team members
- Add quick reply options:
  - "I need help with..."
  - "Request screenshare"
  - "Technical issue"
  - "Billing question"


**Target Tab (multi-domain aware):**
- **Include** → Website URL **matches wildcard**: `https://*.compound.direct/*`  
  This will show the chatflow on all customer workspace subdomains (e.g. `cd-nick.compound.direct`, `cd-acme.compound.direct`).
- **Exclude** → Website URL **matches wildcard**: `https://compound.direct/*`  
  This prevents the customer-support chatflow from appearing on the main marketing site (`compound.direct`), where you may have a separate sales/marketing chatflow.

With this setup:
- A single shared “Customer Support” chatflow powers all tenant workspaces.
- You **do not** need to create or maintain separate chatflows per customer domain.
- Routing, SLAs, and reporting can instead key off `workspace_slug` / `workspace_hostname` properties passed from the embedded RHS chat code.

**Display Tab:**
- Position: Will be controlled by your code (embedded)
- Color: Match your brand colors
- Avatar: Your support team photo
- Language: English (or your preferred language)

**Options Tab:**
- **Business hours**: Set your support availability
  - Example: Monday-Friday, 9am-6pm EST
- **After hours message**: "We'll respond within 24 hours"
- **Email capture**: Optional (since you'll pass it via code)
- **GDPR**: Enable if required

5. Click **Publish**
6. **Copy the chatflow ID** from the URL (you'll need this)

### Step 2: Get Your Portal ID

1. Go to **Settings** (gear icon in top nav)
2. Click **Account Defaults**
3. Find and copy your **Hub ID** (this is your Portal ID)
4. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_HUBSPOT_PORTAL_ID=12345678
   ```

### Step 3: Configure Team Inbox Access

1. Go to **Settings** → **Conversations** → **Inbox**
2. **Add team members** who will respond to chats:
   - Click "Add user"
   - Select support team members
   - Set their roles (Admin, User, etc.)

3. **Configure availability**:
   - Each team member can set their status
   - Available, Away, Busy
   - Offline (chats queued for later)

4. **Set up notifications**:
   - Email: Get notified of new chats
   - Desktop: Browser notifications
   - Mobile: Download HubSpot mobile app for on-the-go support
   - Slack (optional): Integrate with Slack for team notifications

### Step 4: Set Up Routing Rules

For intelligent routing based on request type:

1. Go to **Settings** → **Conversations** → **Routing**
2. Create routing rules:
   ```
   If request_type = "screenshare"
     → Route to: Screen Share Specialists
     → Priority: High
   
   If request_type = "technical"
     → Route to: Technical Support Team
   
   If request_type = "billing"
     → Route to: Billing Team
   ```

3. **Create custom properties** (if needed):
   - Go to **Settings** → **Properties** → **Contact Properties**
   - Create: `workspace_id`, `company_id`, `request_type`
   - These will be auto-populated from the chat

---

## What Your Team Sees in HubSpot

When a customer on `cd-nick.compound.direct` starts a chat, your team sees:

### Chat Notification:
```
New conversation from nick@customer.com
Workspace: cd-nick
Company ID: 12345
Request Type: screenshare
```

### Full Context Panel:
- Customer email and name
- Company/account information
- Workspace ID (which subdomain they're on)
- Request type
- Recent tickets and conversations
- Contact timeline and activity

### Quick Actions:
- Send canned responses
- Assign to team member
- Create ticket from chat
- Schedule follow-up
- Send meeting link for screenshare

---

## Customer Experience Flow

### Example: Screenshare Request

1. **Customer** is on `cd-nick.compound.direct`
2. They click "Request Screenshare" button
3. Chat panel slides in from the right
4. They see: "Thanks for requesting support! An agent will connect shortly."
5. Message is sent to your team in HubSpot
6. **Team member** sees notification in HubSpot inbox
7. Opens chat, sees full context (workspace: cd-nick, request: screenshare)
8. Responds: "Hi Nick! I'm ready to help. Here's the screenshare link: [link]"
9. Customer receives message in embedded chat panel
10. They continue working in their workspace while chatting
11. Screenshare begins, issue resolved
12. Chat transcript auto-saves to their contact record

---

## Styling Options

### Fixed Side Panel (Always Visible)

```typescript
<div className="fixed right-0 top-0 h-screen w-96 bg-white border-l shadow-lg z-40">
  <div className="p-4 border-b bg-blue-500 text-white">
    <h3 className="font-bold">Live Support</h3>
  </div>
  <div className="h-[calc(100%-60px)]">
    <SmartHubSpotChat show={true} userEmail={user.email} />
  </div>
</div>
```

### Collapsible Chat Button

```typescript
const [isOpen, setIsOpen] = useState(false)

return (
  <>
    {/* Floating chat button */}
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 bg-blue-500 text-white w-16 h-16 rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center text-2xl"
    >
      💬
    </button>

    {/* Sliding panel */}
    <div className={`
      fixed right-0 top-0 h-screen w-96 bg-white shadow-2xl z-50 
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-bold text-lg">Support Chat</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>
      </div>
      <SmartHubSpotChat show={isOpen} userEmail={user.email} />
    </div>
  </>
)
```

### Modal Overlay

```typescript
{showChat && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div className="bg-white rounded-xl shadow-2xl w-[600px] h-[700px] overflow-hidden">
      <div className="p-4 bg-blue-500 text-white flex items-center justify-between">
        <h3 className="font-bold text-lg">Live Support</h3>
        <button onClick={() => setShowChat(false)} className="text-white/80 hover:text-white">
          ✕
        </button>
      </div>
      <div className="h-[calc(100%-60px)]">
        <SmartHubSpotChat show={showChat} userEmail={user.email} />
      </div>
    </div>
  </div>
)}
```

---

## Testing

### Local Development

Add to your `/etc/hosts`:
```
127.0.0.1 cd-test.localhost
127.0.0.1 cd-demo.localhost
```

Then test:
- `http://cd-test.localhost:3000` - Should show chat
- `http://localhost:3000` - Should show chat (dev mode)

### Verify Context Passing

Open browser console:
```javascript
console.log(window.hsConversationsSettings)
// Should show: workspace_id, company_id, email, etc.
```

### Test in HubSpot

1. Open chat on a test workspace
2. Send a message
3. Check HubSpot inbox - should see the conversation
4. Verify all context fields are populated

---

## Advanced Features

### Auto-Open for Urgent Issues

```typescript
useEffect(() => {
  // If user has critical issue, auto-show chat
  if (user.hasCriticalIssue) {
    setShowChat(true)
  }
}, [user])
```

### Proactive Support Offers

```typescript
useEffect(() => {
  // After 60 seconds on billing page, offer help
  const timer = setTimeout(() => {
    if (window.location.pathname === '/billing' && !chatShown) {
      setShowChatOffer(true)
    }
  }, 60000)
  
  return () => clearTimeout(timer)
}, [])
```

### Context-Based Greeting

The component automatically passes context, but you can customize:

```typescript
<SmartHubSpotChat
  show={true}
  userEmail={user.email}
  companyId={user.companyId}
  workspaceId={user.workspaceId}
  requestType={
    isOnBillingPage ? 'billing' :
    needsScreenshare ? 'screenshare' :
    'general'
  }
/>
```

---

## Security & Privacy

### Data Isolation
- Each customer only accesses their workspace chat
- No cross-workspace data leakage
- HubSpot handles data security

### Authentication Required
```typescript
// Protect chat access
if (!isAuthenticated) {
  return <LoginPrompt />
}

return <SmartHubSpotChat ... />
```

### Rate Limiting
Implement on your backend to prevent abuse:
```typescript
// Limit chat initiations per workspace per hour
const limit = rateLimiter.check(workspaceId)
if (limit.exceeded) {
  return <RateLimitMessage />
}
```

---

## Troubleshooting

**Chat not appearing?**
- ✅ Check Portal ID in `.env.local`
- ✅ Verify chatflow is published in HubSpot
- ✅ Ensure domain is whitelisted in chatflow settings
- ✅ Check browser console for errors
- ✅ Try clearing cache and reloading

**Wrong workspace detected?**
- ✅ Verify subdomain starts with `cd-`
- ✅ Check `workspaceId` prop is passed correctly
- ✅ Console log `window.location.hostname`

**Team not getting notifications?**
- ✅ Check team member is added to inbox
- ✅ Verify notification settings are enabled
- ✅ Ensure chatflow routing is configured
- ✅ Check availability status (not offline)

**Chat showing on wrong domains?**
- ✅ Review `SmartHubSpotChat` logic
- ✅ Ensure only customer workspaces (`cd-*.compound.direct`) show chat
- ✅ Admin/marketing sites should not load the component

---

## Summary

**✅ Customers:** See embedded chat panel in their workspace (`cd-*.compound.direct`)

**✅ Admin Team:** Responds from HubSpot inbox (no embedded chat needed)

**✅ Context:** Automatically identifies workspace, company, and request type

**✅ Seamless:** Chat while working, no phone calls needed for screenshare

**✅ Unified:** All chats from all workspaces in one HubSpot inbox

This setup provides real-time support directly in the customer's workspace while keeping your team workflow centralized in HubSpot!
