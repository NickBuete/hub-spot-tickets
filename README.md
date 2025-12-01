# HubSpot Ticket Form with Next.js

A Next.js application that creates support tickets in HubSpot with customer details.

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure HubSpot:**

   - Copy `.env.example` to `.env.local`
   - Add your HubSpot access token
   - Update pipeline and stage IDs in `app/api/create-ticket/route.ts`

3. **Find your HubSpot Pipeline and Stage IDs:**

   - Go to HubSpot Settings > Objects > Tickets > Pipelines
   - Click on your pipeline name
   - The URL will contain your pipeline ID
   - Each stage has an ID visible in the pipeline settings

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Features

- ✅ Create support tickets in HubSpot
- ✅ Automatically create or find contacts by email
- ✅ Associate tickets with contacts
- ✅ Modern, responsive form with Tailwind CSS
- ✅ Error handling and loading states
- ✅ TypeScript for type safety

## Configuration

Edit `app/api/create-ticket/route.ts` to customize:

- Pipeline and stage IDs
- Ticket properties
- Contact fields
- Error handling

## Project Structure

```
├── app/
│   ├── api/
│   │   └── create-ticket/
│   │       └── route.ts          # API endpoint for creating tickets
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   └── TicketForm.tsx            # Main form component
├── .env.local                    # Environment variables (not in git)
├── .env.example                  # Example environment file
└── package.json
```

## Important Notes

- **Security:** Never expose your HubSpot access token in client-side code
- **Error Handling:** The API handles existing contacts by searching for them
- **Associations:** Tickets are automatically associated with contacts using association type ID 16
- **Pipeline IDs:** Make sure to replace `YOUR_PIPELINE_ID` and `YOUR_PIPELINE_STAGE_ID` with actual values from your HubSpot account

## Next Steps

1. Add your HubSpot access token to `.env.local`
2. Update the pipeline and stage IDs in the API route
3. Test the form by submitting a ticket
4. Customize the form fields and styling as needed

## Optional Enhancements

- Add more custom fields to the ticket
- Implement file upload for attachments
- Add client-side form validation
- Create a confirmation page after submission
- Add priority and category fields
