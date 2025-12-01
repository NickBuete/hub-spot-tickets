# Enhancement Features Documentation

## 1. Pull User's Open Tickets by Company ID

### Overview
Users can now view all their open support tickets, regardless of which board or stage they're in. The system fetches tickets based on the company ID associated with the user's workspace.

### Implementation

#### API Endpoint: `/api/get-tickets`
- **Method:** GET
- **Query Parameter:** `companyId` (required)
- **Returns:** All tickets associated with the company, sorted by creation date (newest first)

#### Component: `MyTickets`
- Displays all tickets for a specific company
- Shows ticket subject, content, status, and creation date
- Color-coded status badges for easy identification
- Responsive design with hover effects

### Usage

```typescript
import MyTickets from '@/components/MyTickets'

// In your component
<MyTickets companyId="your-company-id" />
```

### Configuration

Add to your `.env.local`:
```bash
NEXT_PUBLIC_COMPANY_ID=your_company_id_here
```

To get your company ID from HubSpot:
1. Go to HubSpot > Contacts > Companies
2. Click on a company
3. The ID is in the URL: `https://app.hubspot.com/contacts/{portal-id}/company/{company-id}`

---

## 2. Embedded HubSpot Chat for Screenshare Requests

### Overview
When a user submits a "Request Screenshare" ticket, a live chat window powered by HubSpot automatically appears in an embedded iframe. This allows your support team to chat with the customer directly in the browser instead of calling.

### Implementation

#### Components Created:

1. **`HubSpotChat`** - Standard floating chat widget
2. **`HubSpotChatIframe`** - Embedded inline chat window

#### Enhanced Ticket Form
- Added request type selector with options:
  - General Support
  - Request Screenshare (triggers chat)
  - Technical Issue
  - Billing Question

#### Chat Behavior
- Chat window appears automatically after submitting a screenshare request
- Embedded inline (not floating) for better control
- Can be closed by the user
- Supports full HubSpot chat features (file uploads, emojis, etc.)

### Configuration

#### Step 1: Get Your HubSpot Portal ID

1. Go to HubSpot > Settings
2. Navigate to Account Defaults
3. Copy your Hub ID (Portal ID)

#### Step 2: Enable Chat in HubSpot

1. Go to Conversations > Chatflows
2. Create or enable a chat widget
3. Make sure it's active and published

#### Step 3: Update Environment Variables

Add to your `.env.local`:
```bash
NEXT_PUBLIC_HUBSPOT_PORTAL_ID=your_portal_id_here
```

### Usage Examples

#### Conditional Chat (appears after form submission):
```typescript
import HubSpotChatIframe from '@/components/HubSpotChatIframe'

{showChat && (
  <HubSpotChatIframe 
    portalId={process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || ''} 
    show={showChat} 
  />
)}
```

#### Always-on Floating Chat:
```typescript
import HubSpotChat from '@/components/HubSpotChat'

<HubSpotChat 
  portalId={process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || ''} 
/>
```

### Customization

#### Customize Request Types
Edit the dropdown in `components/TicketForm.tsx`:
```typescript
<select value={formData.requestType}>
  <option value="general">General Support</option>
  <option value="screenshare">Request Screenshare</option>
  // Add more options...
</select>
```

#### Customize Chat Trigger Conditions
Edit the condition in `components/TicketForm.tsx`:
```typescript
// Show chat for different request types
if (formData.requestType === 'screenshare' || formData.requestType === 'urgent') {
  setShowChat(true)
}
```

#### Style the Chat Container
Modify the styling in `components/HubSpotChatIframe.tsx`:
```typescript
<div className="w-full h-[600px] border border-gray-300 rounded-lg">
  {/* Adjust height, border, etc. */}
</div>
```

### Advanced Features

#### Associate Chat with Contact
The HubSpot chat will automatically identify users if they're logged into HubSpot or if you pass their email:

```javascript
window.hsConversationsSettings = {
  loadImmediately: true,
  identificationEmail: userEmail,
  identificationToken: token, // Optional
}
```

#### Chat Events
Listen to chat events:
```javascript
window.hsConversationsOnReady = [
  () => {
    window.HubSpotConversations.on('conversationStarted', (payload) => {
      console.log('Chat started', payload)
    })
  }
]
```

### Troubleshooting

**Chat not appearing?**
- Verify your Portal ID is correct
- Check that chat is enabled in HubSpot Conversations settings
- Make sure the script has loaded (check browser console)
- Ensure you're using HTTPS in production

**Chat appearing in wrong position?**
- Use `HubSpotChatIframe` for inline embedding
- Use `HubSpotChat` for floating widget

**Want to hide chat initially?**
```typescript
<HubSpotChat portalId="..." show={false} />
```

### Security Notes

- Portal ID is public and safe to expose in client-side code
- Access token should NEVER be exposed (it's only used server-side)
- Chat conversations are secured by HubSpot
- Consider implementing authentication for ticket viewing

---

## Complete Environment Variables

Update your `.env.local` with all required values:

```bash
# HubSpot Private App Token (server-side only)
HUBSPOT_ACCESS_TOKEN=pat-ap1-xxxxx

# HubSpot Portal ID (public, safe for client-side)
NEXT_PUBLIC_HUBSPOT_PORTAL_ID=12345678

# Company ID for fetching tickets (optional, can be dynamic)
NEXT_PUBLIC_COMPANY_ID=your_company_id
```

## Next Steps

1. Test the ticket viewing feature by adding your company ID
2. Submit a "Request Screenshare" ticket to see the chat appear
3. Customize the request types to match your support workflow
4. Style the components to match your brand
5. Consider adding authentication for production use
