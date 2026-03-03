# Outer Image — RFP Portal

AI-powered RFP intake and proposal automation system for Outer Image LLC.

## Architecture

```
Portal (Next.js on Vercel)
  ├── /                    → Upload page (drag-and-drop RFP files)
  ├── /dashboard           → Proposal tracker (status, filters, stats)
  ├── /proposals/[id]      → Proposal view (AI draft + extracted data)
  ├── /api/upload          → File storage + Airtable record + n8n trigger
  ├── /api/proposals       → List all proposals from Airtable
  ├── /api/proposals/[id]  → Get single proposal details
  └── /api/webhook/status  → n8n callback for pipeline status updates
```

## Tech Stack

| Layer          | Technology         |
|----------------|--------------------|
| Frontend       | Next.js 14, React 18, Tailwind CSS |
| Hosting        | Vercel             |
| File Storage   | Vercel Blob        |
| Database       | Airtable           |
| Automation     | n8n (Cloud)        |
| Doc Parsing    | Google Gemini API  |
| AI Drafting    | OpenAI API         |

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd outer-image-portal
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your keys:

| Variable             | Source                          |
|----------------------|---------------------------------|
| `AIRTABLE_API_KEY`   | Airtable → Account → API       |
| `AIRTABLE_BASE_ID`   | Airtable → base URL (appXXX)   |
| `N8N_WEBHOOK_URL`    | n8n → Webhook node URL          |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob      |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL            |

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Deploy to Vercel

```bash
npx vercel
```

Or connect the GitHub repo to Vercel for automatic deployments.

**Important:** Add all environment variables in Vercel → Project Settings → Environment Variables before deploying.

## Data Flow

1. **Upload** → User drops PDF/Excel on portal
2. **Store** → File saved to Vercel Blob, record created in Airtable
3. **Trigger** → Portal fires n8n webhook with file URL + record ID
4. **Parse** → n8n sends file to Gemini for structured extraction
5. **Assemble** → n8n queries Airtable for matching content
6. **Draft** → n8n sends extracted data + content to OpenAI
7. **Deliver** → n8n writes draft to Airtable, updates status via webhook callback
8. **Review** → Portal displays draft on proposal view page

## Airtable Schema

The portal expects these tables in your Airtable base:

- **RFP Tracker** — Pipeline state (auto-populated by the system)
- **Team Bios** — Staff profiles
- **Client References** — Past project references
- **Portfolio** — Completed project summaries
- **Rate Schedules** — Pricing by service line
- **Boilerplate Content** — Reusable text blocks

See `lib/airtable.js` for the full field mapping.

## n8n Webhook Contract

### Outbound (Portal → n8n): `POST {N8N_WEBHOOK_URL}`

```json
{
  "recordId": "recXXXXXXXXXX",
  "fileUrl": "https://blob.vercel-storage.com/rfps/...",
  "fileName": "NYC-Parks-RFP.pdf",
  "fileType": "pdf",
  "callbackUrl": "https://your-app.vercel.app/api/webhook/status",
  "triggeredAt": "2026-03-02T10:00:00Z"
}
```

### Inbound (n8n → Portal): `POST /api/webhook/status`

```json
{
  "recordId": "recXXXXXXXXXX",
  "status": "Ready for Review",
  "extractedData": { ... },
  "generatedDraft": "## Cover Letter\n...",
  "serviceLine": "Design + Fabrication",
  "deadline": "2026-03-28"
}
```

Valid statuses: `Received`, `Parsing`, `Drafting`, `Ready for Review`, `Finalized`, `Error — Parsing`, `Error — Drafting`, `Error — Intake`
