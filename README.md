# Malloulinova - B2B IoT Consulting Platform

A modern, full-stack web application for showcasing B2B IoT consulting projects with advanced analytics, AI chatbot, and comprehensive content management.

## 🎯 What's New

- ✅ **Analytics Dashboard** - Real-time visitor tracking with click heatmap
- ✅ **Article Tagging System** - Multi-tag support with filtering
- ✅ **AI Chatbot** - Groq-powered assistant with lead qualification
- ✅ **SEO Optimization** - Complete sitemap, meta tags, and structured data
- ✅ **Admin Dashboard** - PowerBI-inspired analytics as default view

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Supabase account with configured database and storage
- Vercel account (for deployment)

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Set Environment Variables**
   Create a `.env` file in the root:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_MEDIA_BUCKET=articles
   PORT=3001
   
   # Optional: AI Chatbot (Groq API - free tier: 1,000 requests/day)
   GROQ_API_KEY=gsk_xxxxxxxxxxxxx
   GROQ_MODEL=llama-3.3-70b-versatile
   GROQ_MAX_TOKENS=500
   ```

3. **Run Database Migrations**
   In Supabase SQL Editor, run:
   ```sql
   -- 1. Tags system
   -- Run: database/add_tags_to_articles.sql
   
   -- 2. Chatbot
   -- Run: database/chat_conversations_schema.sql
   
   -- 3. Analytics & Heatmap
   -- Run: database/analytics_schema.sql
   ```

4. **Run Development Server**
   
   **Option A: Express Backend + Vite Frontend (Recommended)**
   ```bash
   # Terminal 1: Start backend
   node backend/server.js
   
   # Terminal 2: Start frontend
   cd frontend && npm run dev
   ```
   - Backend: `http://localhost:3001`
   - Frontend: `http://localhost:5173`
   - Admin: `http://localhost:5173/admin`

   **Option B: Vercel Dev**
   ```bash
   vercel dev
   ```
   Opens at `http://localhost:3000`

## 📁 Project Structure

```
/Malloulinova
├── api/                      # Vercel serverless functions
│   └── [...path].js         # API handler for all routes
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── data/           # Data management
│   └── dist/               # Build output
├── backend/                 # Express.js (local dev only)
│   └── server.js           # Local API server
├── assets/                  # Static assets
├── vercel.json             # Vercel configuration
├── INSTRUCTIONS.md         # Detailed setup guide
├── DEPLOYMENT.md           # Deployment instructions
└── MIGRATION_SUMMARY.md    # Migration details
```

## 🌐 Routes

### Public Routes
- `/` - Home page with featured projects
- `/projects` - All projects with tag filtering
- `/article/:id` - Individual article detail page
- `/contact` - Dedicated contact page
- `/admin` - Admin dashboard (authentication required)

### API Routes

**Articles:**
- `GET /api/health` - Health check
- `GET /api/articles` - Fetch all articles
- `POST /api/articles` - Create article (multipart/form-data)
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article
- `PUT /api/articles/featured` - Update featured articles

**Tags:**
- `GET /api/tags` - Fetch all tags
- `POST /api/tags` - Create tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

**Chatbot:**
- `POST /api/chat` - Send message to AI chatbot
- `GET /api/chat/conversations` - Get all conversations (admin)

**Analytics:**
- `POST /api/analytics/pageview` - Track page view
- `POST /api/analytics/click` - Track click for heatmap
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/heatmap` - Get heatmap clusters
- `POST /api/analytics/update-stats` - Run aggregation

**Contact:**
- `POST /api/contact` - Contact form submission

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **Styling**: Vanilla CSS + inline styles
- **Authentication**: Firebase Auth

### Backend
- **Production**: Vercel Serverless Functions
- **Local Dev**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **File Upload**: Formidable (multipart parsing)

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase
- **CDN**: Vercel Edge Network
- **SSL**: Automatic HTTPS

## 📦 Key Features

### Content Management
- ✅ **Article System**: Rich text articles with media support
- ✅ **Multi-Tag Support**: Articles can have multiple tags
- ✅ **Tag Filtering**: Filter projects by tags on Projects page
- ✅ **Featured Articles**: Highlight up to 3 articles on home page
- ✅ **Media Gallery**: Images, videos, and galleries per article
- ✅ **Admin Dashboard**: Full CRUD for articles and tags

### Analytics & Tracking
- ✅ **Real-Time Analytics**: Track page views, visitors, sessions
- ✅ **Click Heatmap**: Visual representation of user clicks
- ✅ **KPI Dashboard**: Views, visitors, growth, bounce rate
- ✅ **Device Breakdown**: Desktop/mobile/tablet statistics
- ✅ **Geographic Data**: Top visitor locations
- ✅ **Anonymous Tracking**: GDPR-friendly, no personal data

### AI Chatbot
- ✅ **Groq-Powered**: Free tier with 1,000 requests/day
- ✅ **Lead Qualification**: Captures visitor info and intent
- ✅ **Smart Routing**: Directs to projects, contact, or articles
- ✅ **FAQ Fallback**: Works without API key
- ✅ **Conversation Storage**: All chats saved in database

### SEO & Performance
- ✅ **Complete Sitemap**: All pages and tag-based URLs
- ✅ **Meta Tags**: Keywords, Open Graph, Twitter Cards
- ✅ **Structured Data**: Schema.org markup (3 types)
- ✅ **Robots.txt**: Optimized for search engines
- ✅ **Responsive Design**: Mobile-first, all devices
- ✅ **Fast Loading**: Optimized assets and code splitting

## 🚢 Deployment

### Deploy to Vercel

1. **Via Dashboard** (Recommended for first-time)
   - Connect your Git repository at [vercel.com/new](https://vercel.com/new)
   - Configure environment variables
   - Deploy

2. **Via CLI**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Environment Variables (Vercel)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_MEDIA_BUCKET=articles
GROQ_API_KEY=gsk_xxxxxxxxxxxxx (optional)
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_MAX_TOKENS=500
```

## 🗄️ Database Schema

### Core Tables

**articles** - Article content
```sql
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
  tags jsonb default '[]'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

**tags** - Tag definitions
```sql
create table public.tags (
  id text primary key,
  name text not null unique,
  description text,
  color text default '#447D9B',
  created_at timestamptz default now() not null
);
```

**chat_conversations** - Chatbot conversations
```sql
create table public.chat_conversations (
  id text primary key,
  session_id text not null unique,
  visitor_name text,
  visitor_email text,
  messages jsonb default '[]'::jsonb not null,
  lead_qualified boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

### Analytics Tables (6)

**page_views** - Page visit tracking
**click_events** - Click heatmap data
**sessions** - User sessions
**visitors** - Unique visitors
**daily_stats** - Aggregated metrics
**top_pages** - Most visited pages

See `database/analytics_schema.sql` for complete schema.

### Storage Bucket
- **Name**: `articles`
- **Access**: Public
- **Structure**: `{articleId}/{type}/{filename}`

## 📝 Scripts

```bash
# Development
npm run dev              # Run both backend and frontend
npm run dev:backend      # Run Express backend only
npm run dev:frontend     # Run Vite frontend only

# Build
npm run build            # Build frontend for production
npm run vercel-build     # Build for Vercel deployment

# Installation
npm run install:all      # Install all dependencies

# Testing
npm test                 # Run frontend tests
```

## 🔧 Configuration Files

- `vercel.json` - Vercel deployment configuration
- `vite.config.js` - Vite build configuration
- `package.json` - Project dependencies and scripts
- `.env` - Environment variables (local only, not committed)

## 📚 Documentation

- [INSTRUCTIONS.md](./INSTRUCTIONS.md) - Complete setup guide with all features
- `database/add_tags_to_articles.sql` - Tags system migration
- `database/chat_conversations_schema.sql` - Chatbot migration
- `database/analytics_schema.sql` - Analytics & heatmap migration

## 🐛 Troubleshooting

### Build Fails
- Ensure all dependencies are installed: `npm install && cd frontend && npm install`
- Check Node.js version: `node --version` (should be 18+)

### API Errors
- Verify environment variables are set correctly
- Check Supabase credentials are valid
- Test backend: `curl http://localhost:3001/api/health`
- Review backend logs in terminal

### Analytics Not Tracking
- Run database migration: `database/analytics_schema.sql`
- Verify tracking code in `PublicSite.jsx`
- Check browser console for errors
- Test: Check `click_events` table in Supabase

### Heatmap Not Showing
- Run aggregation: `curl -X POST http://localhost:3001/api/analytics/update-stats`
- Click around your site (10-15 clicks)
- Refresh admin dashboard
- Check `click_events` table has data

### Chatbot Not Responding
- Verify `GROQ_API_KEY` in `.env`
- Check Groq API quota (1,000 free requests/day)
- Falls back to FAQ if API key missing
- Check backend logs for errors

### Tags Not Showing
- Run migration: `database/add_tags_to_articles.sql`
- Verify `tags` table exists in Supabase
- Check `articles.tags` column is JSONB array
- Restart backend after migration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Team

Malloulinova Team

## 🎯 Quick Feature Guide

### Using the Analytics Dashboard
1. Login to admin: `http://localhost:5173/admin`
2. Dashboard tab opens by default
3. View KPIs, charts, and heatmap
4. Click around your public site to generate data
5. Refresh dashboard to see updates

### Managing Tags
1. Admin Dashboard → "Manage Tags" tab
2. Create new tags with name, description, color
3. Edit or delete existing tags
4. Assign tags when creating/editing articles
5. Tags appear as colored badges on article cards

### Using the Chatbot
1. Chatbot appears on all pages (bottom-right)
2. Auto-opens after 15 seconds on first visit
3. Ask questions about services, projects, etc.
4. Chatbot qualifies leads and suggests routes
5. All conversations saved in database

### Viewing Analytics
- **Today's Stats**: Top KPI cards
- **Trends**: 7-day or 30-day charts
- **Heatmap**: See where users click
- **Devices**: Desktop/mobile/tablet breakdown
- **Locations**: Top 5 visitor countries

## 🔗 Links

- **Production**: [Your Vercel URL]
- **Supabase Dashboard**: [Your Supabase Project]
- **Groq Console**: https://console.groq.com (for chatbot API)
- **Documentation**: See INSTRUCTIONS.md

---

**Built with** ❤️ **using React, Vite, Supabase, and Groq AI**

## 📊 Current Implementation Status

✅ **Complete Features:**
- Article management with rich media
- Multi-tag system with filtering
- AI chatbot with lead qualification
- Real-time analytics dashboard
- Click heatmap visualization
- SEO optimization (sitemap, meta tags, structured data)
- Contact form with SMTP
- Admin authentication
- Responsive design

🚀 **Ready for Production!**
