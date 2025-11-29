# Malloulinova Database & Analytics Architecture

This document is the **single source of truth** for the Supabase Postgres schema used by the Malloulinova B2B IoT site.

It is designed to:

- Keep the current API contract and dashboard working. :contentReference[oaicite:0]{index=0}
- Make the schema **discoverable** and **maintainable** for humans (not just AI). :contentReference[oaicite:1]{index=1}
- Provide **idempotent SQL** you can paste into the Supabase SQL editor to fix / align the database.

---

## 1. Domains & Tables

We group tables into 4 domains:

1. **Content & Marketing**
   - `articles`
   - `tags`
   - `partners`
   - `team`
   - `faqs`
2. **Customer Engagement**
   - `contacts`
   - `chat_conversations`
3. **Analytics**
   - `page_views`
   - `click_events`
   - `sessions`
   - `visitors`
   - `daily_stats` (legacy)
   - `top_pages` (legacy)
   - `analytics_monthly` (canonical dashboard snapshots)
4. **System / Misc**
   - Future: `services`, `technologies` follow same pattern as `partners` / `team`.

The frontend and backend contracts described in `INSTRUCTIONS.md` and the existing backend docs remain valid.

See also: `../INSTRUCTIONS.md` for the API contract and developer setup. This file (database.md) is the database source of truth.

---

## 2. Global Conventions

- **Schema**: everything in `public`.
- **Primary keys**:
  - Analytics tables: `uuid` PK (generated via app or `gen_random_uuid()`).
  - Business entities: `text` PK (usually nanoid).
- **Timestamps**: `created_at`, `updated_at` (UTC, `timestamptz`).
- **Naming**: snake_case column names. Backend maps to camelCase for API responses. :contentReference[oaicite:3]{index=3}
- **RLS**:
  - Public read where needed (e.g. `faqs`, `partners`, `team`, `articles` list).
  - Inserts/updates through backend using the service role key.

---

## 3. Canonical Schema (DDL)

> 💡 All `CREATE TABLE` use `IF NOT EXISTS`, and most `ALTER` use `ADD COLUMN IF NOT EXISTS`, so you can run this whole section safely in Supabase. It will **fix missing columns / indexes** without dropping data.

### 3.1 Content & Marketing

#### 3.1.1 `articles`

```sql
create table if not exists public.articles (
  id text primary key,
  title text not null,
  short_description text not null default '',
  body text not null default '',
  category text not null default 'Uncategorized',
  thumbnail_url text,
  video_url text,
  gallery_image_urls jsonb not null default '[]'::jsonb,
  document_urls jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  tags jsonb not null default '[]'::jsonb, -- array of tag IDs
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure newer columns exist
alter table public.articles
  add column if not exists view_count int not null default 0,
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists document_urls jsonb not null default '[]'::jsonb;

-- Helpful indexes
create index if not exists idx_articles_created_at
  on public.articles (created_at);

create index if not exists idx_articles_category
  on public.articles (category);

create index if not exists idx_articles_is_featured
  on public.articles (is_featured);
```

---

## 4. Changelog

- 2025-11-21
  - Added `public.analytics_monthly` snapshot table for monthly dashboard caching (kpis, daily_stats, top_pages, top_articles, devices, locations).
  - Implemented `rebuild_analytics_month(month_text text)` SQL function to compute monthly snapshots from raw analytics tables.
  - Backend endpoints now accept `month=YYYY-MM` for `/api/analytics/dashboard` and `/api/analytics/heatmap`; they prefer `analytics_monthly` snapshots when present.
  - Fixed JSONB handling for tags (`public.articles.tags` JSONB array) and ensured camelCase mappings in API responses.
  - Standardized all backend queries to schema-qualified names (e.g., `public.articles`, `public.page_views`).
  - Likes tracked on `public.articles.likes_count`.

---

## 5. Analytics Metrics

### 5.1 Bounce Rate (Monthly)

- Definition used in the dashboard for any selected month (or days window):
  - views = sum of `public.page_views` in the selected period
  - likes = sum of `public.articles.likes_count` across all articles (cumulative, all-time)
  - bounce = views - likes
  - bounceRate% = max(0, round((1 - likes/views) * 100)) when views > 0, else 0

- Notes and caveats:
  - `likes_count` is cumulative by design; it is not restricted to the selected month. Therefore, the bounce rate is a simplified monthly signal that trends downward as total likes grow.
  - This keeps storage simple and avoids per-like event tables. If a period-accurate bounce is required later, introduce a per-window likes metric (e.g., `daily_stats.likes`) and compute with likes constrained to the same date range.
