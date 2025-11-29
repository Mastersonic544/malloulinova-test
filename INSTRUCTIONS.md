MALLOULINOVA Full-Stack Project Setup

This document outlines the architecture and setup steps for the B2B IoT consulting site, ensuring a clean separation of concerns and maintainability (Clean Architecture approach).

1. Core Architecture (Current)

The project is a monorepo with a React frontend and a JavaScript backend. Articles are persisted in Supabase (Postgres + Storage). No Python is required.

- frontend/: React app (public site + Admin UI)
- backend/: Node/Express API server (local dev) and shared backend bits
- api/: Vercel serverless API functions using the same logic
- assets/: Lottie animations and static images

2. Technology Stack

- Frontend: React + Vite (vanilla CSS + inline styles in components)
- Backend (local dev): Express.js + @supabase/supabase-js
- Backend (serverless option): Vercel Serverless Functions + @supabase/supabase-js
- Database: Supabase Postgres (tables: articles, faqs, partners, team). For full schema and migrations, see `doc/database.md` (source of truth).
- Media: Supabase Storage bucket (public) for thumbnails, gallery images, videos

3. Project Structure (Current)

/Malloulinova
├── backend/
│   ├── server.js                  # Express API (local dev backend)
│   ├── firebase.js                # Frontend login helper (kept for Admin auth UI)
│   └── firebase-config.js         # Frontend login config (kept)
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── PublicSite.jsx     # Public marketing site
│       │   ├── Contact.jsx        # Dedicated contact page with form & social links
│       │   ├── AdminLogin.jsx     # Admin login (frontend-only auth)
│       │   └── ArticleView.jsx    # Full article page
│       ├── admin/
│       │   ├── MainDashboard.jsx   # Admin workspace (analytics + content CRUD)
│       │   ├── AnalyticsSection.jsx# Analytics tab UI
│       │   ├── ArticlesSection.jsx # Articles (new/manage/edit)
│       │   ├── TagsSection.jsx     # Tag management
│       │   ├── PartnersSection.jsx # Partners CRUD & ordering
│       │   ├── TeamSection.jsx     # Team CRUD & ordering
│       │   ├── ServicesSection.jsx # Services CRUD & ordering
│       │   └── FaqsSection.jsx     # FAQs CRUD & ordering
│       ├── services/
│       │   ├── connectorService.js# Articles/media, analytics, etc.
│       │   ├── faqService.js       # FAQs CRUD
│       │   ├── partnerService.js   # Partners CRUD
│       │   ├── teamService.js      # Team CRUD
│       │   ├── serviceService.js   # Services CRUD
│       │   ├── tagService.js       # Tags CRUD
│       │   └── analyticsService.js # Analytics tracking & dashboard data
│       └── components/AppRouter.jsx
├── api/
│   └── [...path].js               # Vercel serverless API (same contract)
├── vercel.json                    # Vercel configuration
├── assets/
│   ├── lottie/
│   └── images/
└── INSTRUCTIONS.md (this file)

4. API Contract (Stable)

See `doc/database.md` for canonical table names/columns and monthly analytics schema (`analytics_monthly`). This file summarizes the API behavior.

- GET /api/health → { status: "ok" }
- GET /api/articles → Article[]
- POST /api/articles (multipart/form-data)
  - Required fields: title (text), thumbnail (file)
  - Optional fields: body (text), category (text), isFeatured (text 'true'|'false'), gallery (files[]), video (file)
  - Returns: created Article JSON

Article shape:
{
  id: string,
  title: string,
  shortDescription: string, // unused in UI; kept for compatibility
  body: string,
  category: string,
  thumbnailUrl: string | null,
  videoUrl: string | null,
  galleryImageUrls: string[],
  isFeatured: boolean,
  tags: string[], // Array of tag IDs (e.g., ['tag_embedded', 'tag_iot'])
  createdAt: string (ISO),
  updatedAt: string (ISO)
}

FAQs
- GET /api/faqs → Faq[]
- POST /api/faqs → create FAQ
- PUT /api/faqs/:id → update FAQ
- DELETE /api/faqs/:id → delete FAQ
- PUT /api/faqs/order → update ordering

Partners
- GET /api/partners → Partner[]
- POST /api/partners → create partner
- PUT /api/partners/:id → update partner
- DELETE /api/partners/:id → delete partner
- PUT /api/partners/order → update ordering

Team
- GET /api/team → TeamMember[]
- POST /api/team → create member
- PUT /api/team/:id → update member
- DELETE /api/team/:id → delete member
- PUT /api/team/order → update ordering

5. Supabase Setup

- Storage bucket (public): SUPABASE_MEDIA_BUCKET = "articles"
- Table public.articles:

  create table public.articles (
    id text primary key,
    title text not null,
    short_description text default '' not null,
    body text default '' not null,
    category text default 'Uncategorized' not null,
    thumbnail_url text,
    video_url text,
    gallery_image_urls jsonb default '[]'::jsonb not null,
    is_featured boolean default false not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
  );

// FAQs table

  create table if not exists public.faqs (
    id text primary key,
    question text not null,
    answer text not null,
    position integer not null default 0,
    created_at timestamptz default now() not null
  );

  create policy if not exists "Enable read access for all" on public.faqs for select using (true);

// Partners table

  create table if not exists public.partners (
    id text primary key,
    name text not null,
    description text default '' not null,
    link_url text default '' not null,
    logo_url text default '' not null,
    bg_color text default '#FFFFFF' not null,
    visible boolean default true not null,
    position integer default 0 not null,
    created_at timestamptz default now() not null
  );

  create policy if not exists "Enable read access for all" on public.partners for select using (true);

// Team table

  create table if not exists public.team (
    id text primary key,
    name text not null,
    title text not null default '',
    bio text not null default '',
    linkedin text not null default '',
    image_url text not null default '',
    visible boolean not null default true,
    position integer not null default 0,
    created_at timestamptz not null default now()
  );

  create policy if not exists "Enable read access for all" on public.team for select using (true);

- Table public.contacts (optional, for contact form):

  create table public.contacts (
    id text primary key,
    name text not null,
    email text not null,
    company text default '',
    message text not null,
    created_at timestamptz default now() not null,
    ip text,
    user_agent text
  );

6. How to Run Locally (Recommended: Express backend + Vite)

- From repo root:
  - npm install
  - npm install express cors multer nanoid @supabase/supabase-js
  - Create .env file in root with:
    ```
    SUPABASE_URL=https://<your>.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
    SUPABASE_MEDIA_BUCKET=articles
    PORT=3001
    
    # Optional: Chatbot with Groq API (free tier: 1,000 requests/day)
    GROQ_API_KEY=gsk_xxxxxxxxxxxxx
    GROQ_MODEL=llama-3.3-70b-versatile
    GROQ_MAX_TOKENS=500
    ```
  - Start backend: node backend/server.js (runs on http://localhost:3001)
  - Start frontend (in new terminal):
    - cd frontend && npm install && npm run dev (runs on http://localhost:3000)
  - Vite proxy automatically forwards /api requests to backend on port 3001
  - Open browser at http://localhost:3000

7. Alternative Local Run (Vercel Functions + Vite)

- npm install @supabase/supabase-js @vercel/node nanoid
- npx vercel dev
- Env vars must be available to Vercel dev (use local .env or vercel env add).
- Frontend will call http://localhost:3000/api automatically.

8. Frontend Data Flow

- connectorService.js uses BASE_URL = '/api'
- In local development:
  - Frontend runs on http://localhost:3000 (Vite)
  - Backend runs on http://localhost:3001 (Express)
  - Vite proxy forwards /api → http://localhost:3001/api
- In production:
  - /api routes to Vercel serverless functions automatically
- Admin dashboard UI (implemented in `frontend/src/admin/MainDashboard.jsx`) tabs:
  - Dashboard (analytics)
  - New / Manage posts (articles)
  - Manage Tags
  - Manage Partners (CRUD)
  - Manage Team (CRUD)
  - Manage FAQs (CRUD)
- PublicSite dynamic sections:
  - Our Key Features (3D circular carousel, implemented in `frontend/src/components/public/KeyFeaturesSection.jsx`)
  - Featured articles (up to 3)
  - Partners (from DB, visible=true)
  - Team (from DB, visible=true; falls back to static list if empty)
  - FAQs (from DB)
- Contact page (/contact) → dedicated contact form with SMTP integration and social media links
- ArticleView shows only existing media (title always; thumbnail required; body/gallery/video optional)

9. Common Issues & Fixes

- **Placeholder data showing instead of backend data**: 
  - Check that backend is running on port 3001: `node backend/server.js`
  - Check that frontend is running on port 3000: `cd frontend && npm run dev`
  - Verify .env file is in the root directory with PORT=3001
  - Check browser console for fetch errors (F12 → Console tab)
  - Check browser Network tab for /api/articles request
  - Verify database tables exist with correct schema (snake_case columns)
  - Test backend directly:
    - http://localhost:3001/api/articles
    - http://localhost:3001/api/faqs
    - http://localhost:3001/api/partners
    - http://localhost:3001/api/team
  - Restart both frontend and backend after making changes
  
- **Opening backend root (http://localhost:3001) shows nothing**: 
  - This is normal. Use /api/health or /api/articles endpoints.
  - Test: http://localhost:3001/api/health should return {"status":"ok"}
  
- **404 on /api/articles**: 
  - Ensure backend is running: `node backend/server.js`
  - Verify env vars are set correctly in .env file
  - Check that Supabase table and bucket exist
  - Verify table name is exactly "articles" (lowercase)
  
- **CORS errors**: 
  - Should not occur with Vite proxy setup
  - Express backend has cors() enabled for all origins
  - Verify Vite proxy is configured in vite.config.js
  - Check that both servers are running on correct ports
  
- **Database column errors**: 
  - Ensure your Supabase table uses snake_case columns (short_description, not shortDescription)
  - Backend maps snake_case DB columns to camelCase API responses
  
- **RLS/Policies**:
  - If lists (FAQs/Partners/Team) are empty on the public site, ensure SELECT policies exist as above.
  - Restart backend after adding new routes.

- **Service role key exposure**: 
  - Never commit .env file
  - Keep service role key in local env and host env settings only
  - Add .env to .gitignore (already done)

10. Contact Page

- **Dedicated Route**: `/contact` - Full-page contact experience
- **Contact Form**: Name, email, company (optional), message with SMTP integration
- **Contact Methods**: Email, phone (Tunisia & Germany), physical address with Google Maps link
- **Social Media**: LinkedIn, GitHub, Twitter, Instagram links
- **Office Hours**: Display business hours
- **Success Modal**: Confetti animation on successful submission
- **Responsive Design**: Mobile-optimized layout matching site theme

Files:
- `frontend/src/pages/Contact.jsx` - Contact page component
- Uses `submitContact()` from `connectorService.js` for form submission

11. Chatbot Feature

- **AI-Powered Assistant**: Uses Groq API (free tier: 1,000 requests/day) with FAQ fallback
- **Lead Qualification**: Captures visitor info and tracks conversation intent
- **Smart Routing**: Directs users to projects, contact form, or articles based on conversation
- **Theme Integration**: Matches site colors (#447D9B, #273F4F, #FE7743)

Setup:
1. Sign up at https://console.groq.com (free, no credit card)
2. Generate API key and add to .env: `GROQ_API_KEY=gsk_xxxxx`
3. Create chat_conversations table in Supabase (see schema above)
4. Chatbot appears on all pages automatically
5. Auto-opens after 15 seconds on first visit

Files:
- `backend/chatbot/` - AI logic (Groq client, FAQ matcher, intent detector)
- `frontend/src/components/ChatWidget.jsx` - Chat UI component
- `frontend/src/services/chatService.js` - API communication
- See `chatbot_instructions.md` for detailed documentation

12. Deployment Options

- Vercel (Recommended): deploy frontend + serverless functions (api/[...path].js). Set env vars in Vercel dashboard or CLI.
  - Automatic deployments from Git
  - Built-in serverless functions
  - Environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_MEDIA_BUCKET, GROQ_API_KEY (optional)
- Render/Fly.io/Railway: deploy backend/server.js as a service; set env vars; point frontend to that URL.

13. Tags System

- **Article Tagging**: Articles can have multiple tags for better organization and filtering
- **Tag Management**: Admin dashboard includes full CRUD for tags (create, edit, delete)
- **Tag Filtering**: Projects page has filter buttons to show articles by tag
- **Visual Tags**: Colored tag badges display on article cards throughout the site

Database Tables:
- `tags` table: Stores tag definitions (id, name, description, color)
- `articles.tags` column: JSONB array of tag IDs

Default Tags (5):
1. Embedded Systems (#447D9B)
2. IoT Solutions (#273F4F)
3. Wireless Protocols (#FE7743)
4. Cloud Integration (#64748B)
5. Case Studies (#10B981)

Files:
- `database/add_tags_to_articles.sql` - Migration to add tags
- `frontend/src/services/tagService.js` - Tag API calls
- Admin Dashboard includes "Manage Tags" tab with full UI

14. Analytics & Heatmap System

- **Real-Time Analytics**: Track page views, visitors, sessions, and clicks
- **Click Heatmap**: Visual representation of where users click on your site
- **Dashboard KPIs**: Today's views/visitors, 30-day totals, growth percentages, bounce rate
- **Device Breakdown**: Desktop/mobile/tablet usage statistics
- **Geographic Data**: Top visitor locations
- **Anonymous Tracking**: GDPR-friendly, no personal data collected

14.1 Bounce Rate (Monthly)

- Definition used in the dashboard for any selected month (or days window):
  - views = sum of page views (`public.page_views`) within the selected period
  - likes = sum of `public.articles.likes_count` across all articles (cumulative, all-time)
  - bounce = views - likes
  - bounceRate% = max(0, round((1 - likes/views) * 100)) when views > 0, else 0

- Notes:
  - `likes_count` is cumulative by design; it’s not restricted to the selected month. This keeps storage simple and provides a simplified monthly bounce signal that trends downward as total likes grow.
  - For period-accurate bounce later, track likes per window (e.g., add `daily_stats.likes`) and compute with likes constrained to the same date range.

Database Tables (analytics): see `doc/database.md` for full details.
- `page_views` - Every page visit with device/session info
- `click_events` - Click coordinates for heatmap (X/Y as percentages)
- `sessions` - User session tracking
- `visitors` - Unique visitor tracking (anonymous)
- `daily_stats` - Aggregated daily metrics (legacy)
- `top_pages` - Most visited pages (legacy)
- `analytics_monthly` - Canonical monthly dashboard snapshots
- `page_views` - Every page visit with device/session info
- `click_events` - Click coordinates for heatmap (X/Y as percentages)
- `sessions` - User session tracking
- `visitors` - Unique visitor tracking (anonymous)
- `daily_stats` - Aggregated daily metrics
- `top_pages` - Most visited pages

API Endpoints (see also `doc/database.md`):
- POST /api/analytics/pageview - Track page visits
- POST /api/analytics/click - Track clicks for heatmap
- GET /api/analytics/dashboard - Get all analytics data (supports `month=YYYY-MM`, uses `analytics_monthly` cache when present)
- GET /api/analytics/heatmap - Get heatmap clusters (supports `month=YYYY-MM`)
- POST /api/analytics/update-stats - Run aggregation

Admin Dashboard:
- Opens to Analytics Dashboard by default
- 4 gradient KPI cards (views, visitors, 30-day total, bounce rate)
- Page views trend chart (monthly filter via dropdown)
- Top pages widget
- **Click Heatmap** - Visual dots showing where users click
- Device breakdown with progress bars
- Top 5 locations list

Setup:
1. Run `database/analytics_schema.sql` in Supabase
2. Tracking code added to `PublicSite.jsx` (tracks page views and clicks)
3. Set up cron job to run `/api/analytics/update-stats` hourly
4. View real-time data in Admin Dashboard

Files:
- `database/analytics_schema.sql` - Complete analytics schema
- `frontend/src/services/analyticsService.js` - Tracking functions
- `frontend/src/pages/PublicSite.jsx` - Tracking implementation
- `frontend/src/admin/MainDashboard.jsx` - Admin shell (tabs, layout)
- `frontend/src/admin/AnalyticsSection.jsx` - Analytics display (charts, KPIs, heatmap)

15. SEO Optimization

- **Sitemap**: Complete sitemap.xml with all pages and tag-based URLs
- **Robots.txt**: Optimized for search engines, protects admin routes
- **Meta Tags**: Comprehensive meta tags with keywords, Open Graph, Twitter Cards
- **Structured Data**: 3 types of Schema.org markup (Organization, ProfessionalService, Website)
- **Keywords**: Targeted IoT, embedded systems, LoRaWAN, WMBUS, MIOTY keywords

Files:
- `frontend/public/sitemap.xml` - Updated with all pages
- `frontend/public/robots.txt` - Search engine directives
- `frontend/index.html` - Enhanced meta tags and structured data

16. Cleanup State

- Python stack has been removed from the active flow. Do not run uvicorn.
- Keep backend/firebase*.js only if the Admin UI login leverages Firebase. Otherwise, remove when auth is replaced.
- All .md documentation files can be deleted except INSTRUCTIONS.md and README.md
