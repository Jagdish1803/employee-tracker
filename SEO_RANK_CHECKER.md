# SEO Rank Checker - Backend System

A production-ready backend for an SEO rank checking tool that serves as a lead generation and sales pitching platform. Users get FREE Google ranking checks, the system identifies SEO issues, and converts visitors into qualified sales leads.

## Project Structure

```
/
├── apps/
│   ├── api/          # Express.js API Server (port 3000)
│   └── worker/       # BullMQ Worker Process
├── packages/
│   ├── database/     # Prisma schema + client
│   └── shared/       # Shared constants
└── docker-compose.yml
```

## Quick Start

### 1. Start Infrastructure (Docker)

```bash
docker-compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 2. Configure Environment

```bash
# API Server
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your API keys

# Worker
cp apps/worker/.env.example apps/worker/.env
# Edit apps/worker/.env with your API keys
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SCRAPEDO_API_KEY` - Scrape.do API key for Google scraping
- `SENDGRID_API_KEY` - SendGrid for email sequences (optional)
- `SLACK_WEBHOOK_URL` - Slack for hot lead alerts (optional)

### 3. Install Dependencies

```bash
# API Server
cd apps/api && npm install

# Worker
cd apps/worker && npm install
```

### 4. Set Up Database

```bash
cd packages/database
npm install
npm run db:generate
npm run db:push
```

### 5. Start Services

**Development:**
```bash
# Terminal 1 - API Server
cd apps/api && npm run dev

# Terminal 2 - Worker
cd apps/worker && npm run dev
```

**Production (with PM2):**
```bash
# API Server
cd apps/api && npm run pm2:start

# Worker
cd apps/worker && npm run pm2:start
```

## API Endpoints

### Public Endpoints

#### POST /api/check-ranking
Create a new rank check job.

```json
// Request
{
  "keyword": "plumber london",
  "domain": "example.com",
  "location": "uk",
  "device": "desktop"
}

// Response
{
  "success": true,
  "data": {
    "checkId": "uuid",
    "status": "queued",
    "estimatedTime": 60
  }
}
```

#### GET /api/check-ranking/:checkId
Get check status and results.

```json
// Response (completed)
{
  "success": true,
  "data": {
    "checkId": "uuid",
    "status": "completed",
    "progress": 100,
    "result": {
      "position": 45,
      "estimatedTrafficLoss": 1250,
      "estimatedRevenueLoss": 30000,
      "topResults": [...],
      "competitors": [...],
      "seoIssues": [...]
    }
  }
}
```

#### POST /api/lead-capture
Capture lead contact info after showing results.

```json
// Request
{
  "checkId": "uuid",
  "email": "user@example.com",
  "name": "John Smith",
  "phone": "+1234567890"
}
```

#### POST /api/track
Track analytics events.

```json
// Request
{
  "event": "report_viewed",
  "checkId": "uuid",
  "sessionId": "session-123"
}
```

#### POST /api/book-consultation
Book a consultation call.

```json
// Request
{
  "leadId": "uuid",
  "preferredTime": "Monday 2pm GMT",
  "message": "Optional message"
}
```

### Internal Endpoints (Sales Team)

#### GET /api/internal/leads
Get all leads with filters.

Query params: `?status=hot&minScore=70&limit=50&page=1`

#### GET /api/internal/leads/:leadId
Get lead details with full history.

#### PATCH /api/internal/leads/:leadId
Update lead status and notes.

```json
{
  "leadStatus": "contacted",
  "assignedTo": "sarah@company.com",
  "notes": "Left voicemail",
  "nextFollowUpAt": "2024-01-15T10:00:00Z"
}
```

#### GET /api/internal/stats
Dashboard statistics.

### Health Check

#### GET /api/health
Returns service health status including database and Redis connectivity.

## Worker Flow

1. Pick job from BullMQ queue
2. Check Redis cache (`serp:{keyword}:{location}:{device}`)
3. If cached → use instantly (FREE, no scraping needed)
4. If not cached → scrape Google via Scrape.do → parse HTML → cache (1 hour TTL)
5. Find target domain position in results
6. Extract top 10 competitors
7. Scrape target domain homepage for SEO analysis
8. Detect SEO issues (title, meta, H1, content, mobile, etc.)
9. Calculate metrics (traffic loss, revenue loss)
10. Calculate lead score (0-100)
11. Save all data to PostgreSQL
12. If hot lead (score ≥ 80): Send Slack alert + trigger email sequence
13. Mark job as completed

## Lead Scoring Algorithm

| Factor | Max Points |
|--------|-----------|
| Position (not ranked = max) | 40 |
| Revenue loss (>$100k/year = max) | 30 |
| Domain quality (.com, no hyphens, short) | 15 |
| SEO issues count (>8 issues = max) | 10 |
| Engagement (report views, CTA clicks) | 5 |

- **Hot** (80+): Immediate Slack alert + hot email sequence
- **Warm** (60-79): Day-1 email sequence
- **Cold** (<60): No immediate action

## Database Schema

10 tables: `leads`, `rank_checks`, `serp_results`, `competitors`, `seo_issues`, `reports`, `lead_interactions`, `analytics_events`, `email_campaigns`, `campaign_emails`

See `packages/database/prisma/schema.prisma` for full schema.

## Security

- Rate limiting: 10 requests/minute per IP for rank checks, 5/minute for lead capture
- Input validation with Zod
- SQL injection prevention via Prisma ORM
- XSS protection via Helmet.js
- CORS configured for frontend only
- All secrets via environment variables

## Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js v4.18+
- **Database**: PostgreSQL v14+ with Prisma ORM v5+
- **Cache/Queue**: Redis v7+ with ioredis v5+ and BullMQ v4+
- **Scraping**: Scrape.do API
- **Parser**: Cheerio v1+
- **Email**: SendGrid
- **Notifications**: Slack Webhooks
- **Validation**: Zod v3+
- **Security**: Helmet.js, CORS, express-rate-limit
- **Logging**: Pino v8+
- **Process Manager**: PM2 v5+
