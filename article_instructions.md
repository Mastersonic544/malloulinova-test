# Article Creation Instructions

This document describes the complete flow for creating an article across the frontend (Admin Dashboard) and backend (Express + Supabase), including validations, file field names, storage layout, and common errors.

## Roles and Components
- **Frontend Form**: `frontend/src/admin/ArticlesSection.jsx`
- **Frontend API Service**: `frontend/src/services/connectorService.js` (`saveArticle`)
- **Backend Route**: `backend/server.js` `POST /api/articles`
- **Storage**: Supabase Storage (bucket: `SUPABASE_MEDIA_BUCKET`, e.g., `articles`)
- **Database Table**: `articles` (columns documented below)

## Frontend: Form Fields and Constraints
- **Required fields**
  - `title`: non-empty string
  - `fullBody`: non-empty string (sent as `body`)
  - `thumbnailFile`: 1 image file (<= 5MB)
- **Optional fields**
  - `galleryFiles`: multiple image files (<= 5MB each, up to 12)
  - `videoFile`: single video file (<= 50MB)
  - `documentFiles`: multiple PDF files (<= 20MB each, up to 12)
  - `tags`: array of strings
- **Removed/Not used in Create (must not appear in New Article form submission)**
  - `shortDescription`: not sent; the preview is derived from `body` (see below)
  - `isFeatured`: controlled only from the Articles Modify page via the star (post-create)
  - `category`: removed; backend will apply default (e.g., `"Uncategorized"`)
- **File type restrictions**
  - Documents: PDF only (frontend `accept="application/pdf"`)

## Frontend: FormData Contract (saveArticle)
- Text fields (as strings):
  - `title`
  - `body`
  - `category`: may be omitted or empty; backend defaults
  - `tags`: JSON stringified array, e.g. `"[\"ai\",\"security\"]"`
  - Do NOT send `shortDescription` or `isFeatured` on create
- File fields (names must match backend `multer.fields`):
  - `thumbnail` (1)
  - `gallery` (0..12)
  - `video` (0..1)
  - `documents` (0..12, PDF only)

## Backend: Route and Multer Setup
- Route: `POST /api/articles`
- Multer fields (must match FormData keys):
  - `{ name: 'thumbnail', maxCount: 1 }
  - { name: 'video', maxCount: 1 }
  - { name: 'gallery', maxCount: 12 }
  - { name: 'documents', maxCount: 12 }`
- File extraction in handler:
  - `thumbFile = (req.files?.thumbnail || [])[0]`
  - `videoFile = (req.files?.video || [])[0]`
  - `galleryFiles = req.files?.gallery || []`
  - `documentFiles = req.files?.documents || []`

## Backend: Validations
- Sizes
  - `imageMax = 5MB`, `videoMax = 50MB`, `docMax = 20MB`
- Type guards
  - `isImage(f) => mimetype starts with 'image/'`
  - `isVideo(f) => mimetype starts with 'video/'`
  - `isDocument(f) => mimetype === 'application/pdf'`
- Required
  - `thumbFile` must exist and pass `isImage` and size check
- Optional files validated if present
- Reject with 400 + message on violation

## Storage Layout (Supabase Storage)
- A generated `id = nanoid()` creates a new folder per article
- Paths (examples):
  - Thumbnail: `${id}/thumbnail/${originalname || 'thumb'}`
  - Video: `${id}/video/${originalname || 'video'}`
  - Gallery images: `${id}/gallery/${index}-${originalname || 'image'}`
  - Documents: `${id}/documents/${index}-${originalname || 'document'}`
- Upload with `upsert: true`, and then resolve the public URL via `getPublicUrl`

## Database Upsert: `articles` Table
- Inserted/Upserted fields (example mapping):
  - `id`: nanoid
  - `title`
  - `body`
  - `category`: defaulted server-side (e.g., `"Uncategorized"`) if empty
  - `thumbnail_url`: public URL
  - `video_url`: public URL or null
  - `gallery_image_urls`: array of public URLs
  - `document_urls`: array of public URLs
  - `is_featured`: boolean (defaults false; not set by create endpoint)
  - `tags`: array
  - `view_count`: 0
  - `created_at`, `updated_at`: ISO string

### Short Description (Preview) Generation
- The preview shown on cards/pages is derived from `body`, not stored as a separate column.
- Recommended deterministic algorithm for UI rendering:
  1. Strip HTML tags from `body` if present.
  2. Normalize whitespace: collapse multiple spaces/newlines to a single space.
  3. If the first line/paragraph ends before 220 chars, use that; otherwise take the first 220 chars.
  4. Trim trailing punctuation/space, then append: `" … Read More >"`.
- This ensures the preview equals the beginning of the long description plus the call-to-action text.

## Success Response (201)
- Returns the inserted article mapped to client shape (no shortDescription field). Clients compute a preview from `body` as described above.

## Common Errors & Troubleshooting
- 400 Validations
  - Missing/invalid `thumbnail` (required, image, <=5MB)
  - `gallery` not images or size exceeded
  - `video` not video or size exceeded
  - `documents` not PDF or size exceeded
- 500 Server errors
  - Supabase Storage upload failure
  - DB upsert error
- Supabase StorageUnknownError / `UND_ERR_CONNECT_TIMEOUT`
  - Indicates connectivity timeout to `*.supabase.co:443`
  - Check:
    - Env vars present: `SUPABASE_URL`, `SUPABASE_ANON_KEY`/`SERVICE_ROLE`
    - Outbound internet allowed (firewall/proxy? VPN?)
    - Temporary regional outage; retry later
    - Node version and `undici` issues; try raising timeout or adding retry (exponential backoff)
    - Large uploads near limits on slow connections can time out—try smaller files first

## Manual Test Checklist
1. Create with required fields only (title, body, thumbnail) → 201, record visible in DB
2. Add gallery images (various sizes) → validate <= 5MB, all uploaded
3. Add video (<= 50MB) → uploaded and URL stored
4. Add PDFs docs (<= 20MB each) → uploaded and URLs stored
5. Empty `tags` acceptable (persisted correctly). Do not set `isFeatured` during create.
6. Try invalid types (non-image thumbnail, non-PDF doc) → 400 with clear message
7. Test on slow network/simulated latency → ensure no timeouts or surface meaningful errors

## Notes
- Frontend does NOT send `shortDescription`; preview is computed from `body` at render time. `category` is omitted and defaulted server-side.
- Documents are PDF-only by design to reduce complexity and ensure consistent previews.
- If serving frontend under a subpath, adjust any public asset URLs accordingly (not related to article flow, but impacts UI icons).
 - `is_featured` defaults to false on create and is only toggled from the Articles Modify page (star control).
