# versaly

A modern, premium website foundation for a software development company that builds purpose-built business software for healthcare, finance, manufacturing, hospitality, and retail.

---

## 🚀 Quick Start & How to Run

The website is lightweight and requires **zero external build tools or heavy frameworks**.

### 1. Run with Node.js Server (Recommended for Full Form Submission)

```bash
# Start the local server
npm start

# Or run with Node directly:
node server.js
```

Then visit **`http://localhost:3000`** in your browser.

> [!NOTE]
> When running with `npm start` / `node server.js`, the enquiry and demo forms submit directly to the built-in API (`POST /api/submit`), save structured records to `data/submissions.json`, log formatted lead alerts in your terminal, and forward to SMTP/Webhooks if configured.

### 2. Static Only (Preview)

You can also open `index.html` directly in any browser or use:

```bash
# Python 3
python -m http.server 8000
```

---

## 📨 Functional Enquiry & Form Submission System

The **Request a Demo** (`request-demo.html`) and **Contact Us** (`contact.html`) pages are connected to a real, secure submission backend.

### Architecture Overview

```
Frontend (Vanilla JS)
  │
  ├──> POST /api/submit
  │       │
  │       ├── 1. Rate Limiting (15 req / 15 min per IP)
  │       ├── 2. Honeypot Filter (_hp_company)
  │       ├── 3. Time-to-Submit Check (_ts > 1.2s)
  │       ├── 4. Input Sanitization & Validation
  │       │
  │       ├── 5. Persistent Storage (data/submissions.json)
  │       ├── 6. Webhook Forwarder (Slack / Discord / Zapier / CRM)
  │       └── 7. SMTP Email Dispatcher (Optional)
  │
  └──< 200 OK + Ref ID / 400 Bad Request / 422 Unprocessable
```

---

## 🔒 Form Security & Bot Protection

1. **Honeypot Anti-Bot Field**: Invisible honeypots (`_hp_company`) trapped in forms. Any automated scraper that populates these fields is rejected immediately (HTTP 400).
2. **Time-to-Submit Verification**: A cryptographically random or high-resolution load timestamp (`_ts`) is generated on form mount. Submissions received faster than humanly possible (< 1.2s) are blocked.
3. **In-Flight Double-Submission Prevention**: The submission buttons are automatically disabled, show a loading spinner, and lock input state while the network request is processing.
4. **Input Sanitization**: ASCII control characters and dangerous tags are stripped, text lengths are clamped, and work email formats are strictly validated.
5. **No Secret Exposure**: Zero private API keys, SMTP passwords, or webhook secrets are exposed to the client-side JavaScript.

---

## ⚙️ Configuration & Environment Variables

Configuration is loaded from `.env` in the project root. Copy `.env.example` to get started:

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port for the HTTP server |
| `NOTIFICATION_EMAIL` | `leads@versaly.example.com` | Business inbox to receive leads |
| `STORAGE_FILE` | `data/submissions.json` | Path to persistent JSON submission file |
| `ADMIN_PASSWORD` | `versaly_admin_2026` | Password for accessing the internal admin portal |
| `RATE_LIMIT_MAX` | `15` | Max submissions per IP window |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15m) | Rate limiting sliding window duration |
| `WEBHOOK_URL` | *(empty)* | Optional webhook URL (Slack, Zapier, Make, CRM) |
| `SMTP_HOST` | *(empty)* | SMTP Host (e.g. `smtp.sendgrid.net`) |
| `SMTP_PORT` | `587` | SMTP Port |
| `SMTP_SECURE` | `false` | Enable TLS/SSL (`true` or `false`) |
| `SMTP_USER` | *(empty)* | SMTP Username |
| `SMTP_PASS` | *(empty)* | SMTP Password / App Token |
| `SMTP_FROM` | `"versaly Inquiries <no-reply@versaly.example.com>"` | Sender name & email |

---

## 🧪 Testing

An automated test suite is included to verify all API endpoints, validation logic, spam security, and storage persistence.

```bash
npm test
```

### What the test suite covers:
- `GET /api/health` &mdash; API health check
- `GET /` & static assets &mdash; MIME types and static file serving
- `POST /api/submit` (Demo Request) &mdash; Valid payload, product context, and reference ID generation
- `POST /api/submit` (Contact Enquiry) &mdash; Category tags, subject, and message persistence
- `data/submissions.json` &mdash; Verifying lead record disk storage
- **Honeypot protection** &mdash; Rejecting automated bots
- **Time verification** &mdash; Rejecting sub-second bot bursts
- **Validation rules** &mdash; Handling malformed emails and missing fields (422)

---

## 📦 Lead Submission Record Structure

When an enquiry or demo request is submitted, a structured JSON record is saved into `data/submissions.json`:

```json
{
  "ref_id": "versaly-2026-A1B2C3",
  "form_type": "demo_request",
  "submitted_at": "2026-09-10T04:30:00.000Z",
  "contact": {
    "name": "Sarah Connor",
    "email": "sarah@cyberdyne-health.com",
    "company": "Cyberdyne Health",
    "phone": "+1 555-019-2834"
  },
  "details": {
    "subject": "Demo Request: ClinicOS",
    "enquiry_type": "general",
    "product_id": "healthcare-pro",
    "product_name": "ClinicOS",
    "industry": "Healthcare & Medical",
    "goal": "Replacing existing legacy software",
    "message": "Looking to evaluate ClinicOS for our 4 outpatient clinics."
  },
  "meta": {
    "source_page": "/request-demo.html?product=healthcare-pro",
    "referrer": "http://localhost:3000/product.html?id=healthcare-pro",
    "client_ip_hash": "270cf5cbb54ca8e4",
    "user_agent": "Mozilla/5.0 ..."
  }
}
```

---

---

## 🔍 SEO, Metadata & Social Sharing

The entire website implements modern technical SEO and accessibility standards across every public page.

### 1. Per-Page Metadata
- **Page Titles**: Unique, descriptive titles with consistent brand suffix (`Page Title — versaly`).
- **Meta Descriptions**: Compelling, human-written descriptions tailored to each page's specific purpose without generic filler.
- **Canonical URLs**: Explicit `<link rel="canonical">` tags configured for production indexing (`https://versaly.example.com`).
- **Robots Directives**: Standard `index, follow` across public pages; `noindex, follow` on error pages (`404.html`).
- **Open Graph & Twitter / X Cards**: Full social sharing cards (`og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) using a high-resolution SVG preview card (`assets/images/og-preview.svg`).

### 2. Structured Data (Schema.org JSON-LD)
Rich semantic schemas are embedded on relevant pages:
- **Homepage (`index.html`)**: `Organization` and `WebSite` schema with search action directives.
- **About Page (`about.html`)**: `AboutPage` schema with organization credentials.
- **Catalogue (`products.html`)**: `CollectionPage` schema referencing software catalogue.
- **Product Details (`product.html`)**: Dynamic `SoftwareApplication` schema injected via `js/products.js` with category, operating system (`Cloud-native`), and application suite data.
- **Enquiry Pages (`contact.html`, `request-demo.html`)**: `ContactPage` schema.

### 3. Favicon & Web Manifest
- Modern SVG favicon with versaly brand gradient (`assets/icons/favicon.svg`).
- Apple touch icon (`assets/icons/apple-touch-icon.svg`).
- PWA Web Manifest (`site.webmanifest`) with `#4f46e5` theme color and responsive icon declarations (192px and 512px).

### 4. Search Engine Discoverability
- **`sitemap.xml`**: Standard XML sitemap containing all key public routes, change frequencies, and priority weights.
- **`robots.txt`**: Declares search bot crawl rules, disallows sensitive internal directories (`/data/`, `/test/`, `/api/`), and references the sitemap location.

---

## ♿ Accessibility & Performance

- **Semantic HTML**: Proper landmark hierarchy (`<header>`, `<nav>`, `<main id="main">`, `<section>`, `<article>`, `<footer>`).
- **Skip Links**: Keyboard navigation jump link (`Skip to content`) provided at top of every page.
- **WCAG Compliant Contrast**: Tested contrast ratios exceeding WCAG AA standards.
- **Focus Rings**: High-visibility `:focus-visible` outline rings with offset for accessible keyboard navigation.
- **ARIA & Assistive Tech**: Decorative SVGs marked with `aria-hidden="true"`, dynamic state attributes (`aria-invalid`, `aria-busy`, `aria-expanded`).
- **Reduced Motion Support**: `@media (prefers-reduced-motion: reduce)` rules disable disruptive animations for sensitive users.
- **Performance**: Zero external render-blocking scripts, asynchronous font loading, lazy-loaded media (`loading="lazy"`), explicit aspect ratio reservations to prevent Cumulative Layout Shift (CLS).

---

## 📊 Analytics, Conversion Tracking & Privacy

versaly includes a built-in, lightweight analytics and conversion tracking engine (`js/analytics.js`) designed for Google Analytics 4 (GA4) or custom tracking providers with **strict zero-PII guarantees**.

### 1. Zero-PII Guarantee
The engine features a parameter sanitizer that blocks all personally identifiable information:
- ❌ **NEVER Tracked**: Names, email addresses, phone numbers, free-form message contents, addresses, passwords.
- ✅ **Safely Tracked**: Anonymous metrics (`product_id`, `product_name`, `product_category`, `product_status`, `cta_name`, `cta_location`, `industry`, `goal`, `enquiry_type`, `search_query_tier`).

### 2. Conversion Funnel Stages
```
Page Visit ──> Product/Category Interest ──> CTA Click ──> Form Started ──> Form Submitted
```

| Event Name | Trigger | Safe Parameters |
|---|---|---|
| `page_view` | Page navigation | `page_path`, `page_title`, `page_category` |
| `catalogue_viewed` | Products catalogue load | `total_products` |
| `product_category_filtered` | Industry filter selected | `category_filter` |
| `product_search` | Search input entered | `search_query_tier` (`short`, `medium`, `long`) |
| `product_view` | Single product detail view | `product_id`, `product_name`, `product_category`, `product_status` |
| `product_demo_click` | Demo clicked for a product | `product_id`, `product_name`, `cta_location` |
| `cta_click` | Button / Link clicked | `cta_name`, `cta_location`, `product_id` (optional) |
| `form_started` | First field focus in demo/contact form | `form_type`, `product_id` (optional) |
| `form_submitted` | Successful API submission | `form_type`, `product_id`, `product_name`, `industry`, `goal`, `enquiry_type` |
| `enquiry_category_selected` | Tab switched on contact form | `enquiry_type` |

### 3. Production GA4 Configuration Guide

By default, analytics is disabled with placeholder configuration so local development runs with **zero network errors and zero external requests**.

To activate Google Analytics 4 in production:
1. Open [`js/analytics.js`](file:///c:/Users/HP/Downloads/Software_Company_Website-Phase-8-Clean/Software%20Company%20Website/js/analytics.js).
2. Set your production Measurement ID and enable tracking:
```js
var DEFAULT_CONFIG = {
    measurementId: 'G-XXXXXXXXXX', // Replace with your real GA4 Measurement ID
    enabled: true,                  // Set to true
    debug: false,                  // Set true to log events to browser console
    requireConsent: false,         // Set true if your jurisdiction requires explicit opt-in
    respectDoNotTrack: true        // Respects browser DNT: 1 header
};
```
3. Or configure dynamically via `window.versalyAnalyticsConfig` before script load.

### 4. Privacy & Consent Control
- **Do Not Track (DNT)**: If the user's browser has `Do Not Track` enabled (`DNT: 1`), external tracking scripts are blocked by default.
- **Consent API**: If operating under GDPR/ePrivacy, set `requireConsent: true` and call `versalyAnalytics.setConsent(true)` upon receiving user opt-in through your consent management platform (CMP).

---

## 🚢 Deployment

### 1. Node.js Production Server (VPS / Cloud VM / PM2)

```bash
# Using PM2 process manager
npm install -g pm2
pm2 start server.js --name "versaly-site"
pm2 save
```

### 2. Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔐 Internal Admin Dashboard & Lead Management Console

Access the administrative interface at **`http://localhost:3000/admin.html`** (or click the admin route in production).

### Default Credentials
- **Password**: `versaly_admin_2026` *(Configurable via `ADMIN_PASSWORD` in `.env`)*

### Admin Capabilities
1. **Conversion Analytics & KPIs**:
   - Total Inquiries count
   - High-intent Demo Requests vs Contact Messages breakdown
   - 7-Day Velocity tracking
2. **Visual Pipeline & Market Breakdown**:
   - Product demand distribution
   - Lead status pipeline progress bars (`new`, `in_review`, `contacted`, `closed`)
   - Industry target distribution
3. **Filterable Lead Management Table**:
   - Real-time text search across contact names, emails, companies, products, subjects, and Ref IDs
   - Fast filter buttons for form type and status stages
4. **Slide-over Lead Detail Drawer**:
   - Complete contact info and submission parameters
   - Editable status selector to move leads through the sales funnel
   - Internal notes editor for sales/deal logs
   - One-click deletion with confirmation
5. **CSV Lead Export**:
   - One-click sanitized CSV download formatted for direct import into CRM systems (HubSpot, Salesforce, Notion, Excel)

---

## 📂 Project Structure

```
Software Company Website/
├── index.html            # Homepage (editorial & product-led)
├── about.html            # About, 5-step approach, Why Us, FAQ accordion
├── products.html         # Product catalogue with filter bar
├── product.html          # Individual product detail template (Dynamic SEO)
├── request-demo.html     # Real demo request & lead generation form
├── contact.html          # Real contact & partnership enquiry form
├── admin.html            # Internal admin dashboard & conversion analytics
├── 404.html              # Branded 404 error page
├── sitemap.xml           # Production XML Sitemap
├── robots.txt            # Search crawler directives
├── site.webmanifest      # PWA & mobile web manifest
├── server.js             # Zero-dependency Node.js static & API server (with Auth & Admin API)
├── package.json          # Node scripts (start, dev, test)
├── .env.example          # Environment variables template
├── .env                  # Local environment configuration
├── assets/
│   ├── icons/
│   │   ├── favicon.svg   # Vector SVG favicon
│   │   ├── icon-192.svg  # PWA manifest 192px icon
│   │   ├── icon-512.svg  # PWA manifest 512px icon
│   │   └── apple-touch-icon.svg
│   └── images/
│       └── og-preview.svg# 1200x630 Social sharing card
├── css/
│   ├── style.css         # Global token design system & accessibility rules
│   ├── home.css          # Homepage & About page styles
│   ├── forms.css         # Form design system & state styles
│   ├── products.css      # Product catalogue styles
│   └── admin.css         # Admin dashboard theme, charts, cards & drawer styles
├── js/
│   ├── admin.js          # Admin dashboard controller, auth token management, table & charts
│   ├── analytics.js      # Zero-PII analytics, GA4 loader, funnel & CTA tracking
│   ├── main.js           # Navigation & scroll interactions
│   └── products.js       # Dynamic product renderer & JSON-LD generator
├── data/
│   ├── products.json     # Product specifications database
│   └── submissions.json  # Stored lead submissions
└── test/
    └── api-test.js       # Automated test suite (Forms, 404, SEO, Analytics, Admin API)
```

