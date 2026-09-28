/**
 * Automated Test Suite for versaly Form Submission, Security & CMS Engine
 * Tests API responses, payload validation, spam filters, storage persistence, rate limiting, and Phase 7 Product CMS.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { startServer, CONFIG } = require('../server');

const TEST_PORT = 3456;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function postJson(path, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const req = http.request(`${BASE_URL}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'User-Agent': 'versaly-Test-Runner/1.0'
            }
        }, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(body);
                } catch (e) {
                    parsed = body;
                }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(`${BASE_URL}${path}`, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        }).on('error', reject);
    });
}

function authRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const payload = data ? JSON.stringify(data) : null;
        const headers = {};
        if (payload) {
            headers['Content-Type'] = 'application/json';
            headers['Content-Length'] = Buffer.byteLength(payload);
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            headers['x-admin-token'] = token;
        }
        const req = http.request(`${BASE_URL}${path}`, { method, headers }, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Starting versaly Automated Test Suite...\n');
    let server = startServer(TEST_PORT);
    let passed = 0;
    let failed = 0;

    function assert(name, condition, extraInfo = '') {
        if (condition) {
            console.log(`  ✅ PASS: ${name}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${name} ${extraInfo}`);
            failed++;
        }
    }

    try {
        // Test 1: Health Check
        const health = await get('/api/health');
        assert('Health Check Endpoint (GET /api/health)', health.status === 200 && health.body.includes('healthy'));

        // Test 2: Static File Serving
        const home = await get('/');
        assert('Serve Homepage (GET /)', home.status === 200 && home.body.includes('versaly'));

        const about = await get('/about.html');
        assert('Serve About Page (GET /about.html)', about.status === 200 && about.body.includes('About'));

        const css = await get('/css/forms.css');
        assert('Serve Forms CSS (GET /css/forms.css)', css.status === 200 && css.body.includes('.form-card'));

        // Test 3: Valid Demo Request Submission
        const validDemoPayload = {
            form_type: 'demo_request',
            name: 'Sarah Connor',
            email: 'sarah@cyberdyne-health.com',
            company: 'Cyberdyne Health',
            phone: '+1 555-019-2834',
            product: 'healthcare-pro',
            product_name: 'ClinicOS',
            industry: 'Healthcare & Medical',
            goal: 'Replacing existing legacy software',
            message: 'Looking to evaluate ClinicOS for our 4 outpatient clinic locations.',
            source_page: '/request-demo.html?product=healthcare-pro',
            referrer: 'http://localhost:3000/product.html?id=healthcare-pro',
            _hp_check: '',
            _ts: (Date.now() - 5000).toString() // 5 seconds ago
        };

        const demoRes = await postJson('/api/submit', validDemoPayload);
        assert('Valid Demo Request (POST /api/submit)', demoRes.status === 200 && demoRes.body.success === true && typeof demoRes.body.refId === 'string', JSON.stringify(demoRes.body));

        // Test 4: Valid Contact Enquiry Submission
        const validContactPayload = {
            form_type: 'contact',
            name: 'David Miller',
            email: 'david.m@apexlogistics.io',
            company: 'Apex Logistics',
            subject: 'Partnership & Integration Inquiry',
            enquiry_type: 'partnership',
            message: 'We provide cold-chain monitoring hardware and would like to explore integration with MakerSuite.',
            source_page: '/contact.html?type=partnership',
            referrer: '',
            _hp_check: '',
            _ts: (Date.now() - 4000).toString()
        };

        const contactRes = await postJson('/api/submit', validContactPayload);
        assert('Valid Contact Enquiry (POST /api/submit)', contactRes.status === 200 && contactRes.body.success === true && typeof contactRes.body.refId === 'string', JSON.stringify(contactRes.body));

        // Test 5: Storage Verification
        const storageFile = CONFIG.storageFile;
        const storageExists = fs.existsSync(storageFile);
        let storedItems = [];
        if (storageExists) {
            try {
                storedItems = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
            } catch (e) {
                storedItems = [];
            }
        }
        const hasDemoRecord = storedItems.some(i => i.contact.email === 'sarah@cyberdyne-health.com' && i.details.product_name === 'ClinicOS');
        const hasContactRecord = storedItems.some(i => i.contact.email === 'david.m@apexlogistics.io' && i.details.enquiry_type === 'partnership');

        assert('Persistence: Demo Request Saved in submissions.json', hasDemoRecord);
        assert('Persistence: Contact Request Saved in submissions.json', hasContactRecord);

        // Test 6: Security - Honeypot Spam Bot Rejection
        const botHoneypotPayload = {
            form_type: 'contact',
            name: 'Spam Bot 3000',
            email: 'bot@spamnetwork.xyz',
            subject: 'Buy cheap watches',
            message: 'Click this spam link now',
            _hp_check: 'I am an automated scraper bot', // Filled honeypot
            _ts: (Date.now() - 5000).toString()
        };

        const hpRes = await postJson('/api/submit', botHoneypotPayload);
        assert('Honeypot Protection: Reject bot with populated honeypot', hpRes.status === 400 && hpRes.body.success === false);

        // Test 7: Security - Instant Bot Submission Rejection (< 1.2s)
        const rapidBotPayload = {
            form_type: 'contact',
            name: 'Fast Bot',
            email: 'fast@bot.com',
            subject: 'Instant message',
            message: 'Filled in 10ms',
            _hp_check: '',
            _ts: Date.now().toString() // 0ms elapsed
        };

        const fastRes = await postJson('/api/submit', rapidBotPayload);
        assert('Time Verification: Reject instant submission (< 1.2s)', fastRes.status === 400 && fastRes.body.error.includes('rapidly'));

        // Test 8: Validation - Invalid Email Address
        const invalidEmailPayload = {
            form_type: 'contact',
            name: 'Real User',
            email: 'not-an-email',
            subject: 'Hello',
            message: 'This is my message',
            _hp_check: '',
            _ts: (Date.now() - 3000).toString()
        };

        const invalidEmailRes = await postJson('/api/submit', invalidEmailPayload);
        assert('Validation: Reject invalid email format (422)', invalidEmailRes.status === 422 && invalidEmailRes.body.errors.some(e => e.field === 'email'));

        // Test 9: Validation - Missing Required Fields for Demo
        const missingFieldsPayload = {
            form_type: 'demo_request',
            name: 'A', // too short
            email: 'valid@example.com',
            company: '', // missing
            product: '', // missing
            _hp_check: '',
            _ts: (Date.now() - 3000).toString()
        };

        const missingRes = await postJson('/api/submit', missingFieldsPayload);
        assert('Validation: Reject incomplete demo form (422)', missingRes.status === 422 && missingRes.body.errors.length >= 3);

        // Test 10: 404 Error Page Handler
        const notFound = await get('/non-existent-page-xyz');
        assert('Custom 404 Status & Page (GET /non-existent-page-xyz)', notFound.status === 404 && notFound.body.includes('Page Not Found'));

        // Test 11: SEO Sitemap and Robots
        const sitemap = await get('/sitemap.xml');
        assert('SEO Sitemap (GET /sitemap.xml)', sitemap.status === 200 && sitemap.body.includes('<urlset') && sitemap.body.includes('https://versaly.example.com/'));

        const robots = await get('/robots.txt');
        assert('SEO Robots Directives (GET /robots.txt)', robots.status === 200 && robots.body.includes('Disallow: /data/') && robots.body.includes('Sitemap:'));

        const manifest = await get('/site.webmanifest');
        assert('PWA Web Manifest (GET /site.webmanifest)', manifest.status === 200 && manifest.body.includes('versaly'));

        const favicon = await get('/assets/icons/favicon.svg');
        assert('Favicon Vector (GET /assets/icons/favicon.svg)', favicon.status === 200 && favicon.body.includes('<svg'));

        // Test 12: Validate Metadata & Structured Data across all HTML files
        const htmlPages = ['index.html', 'about.html', 'products.html', 'product.html', 'contact.html', 'request-demo.html', '404.html'];
        for (const pageName of htmlPages) {
            const pagePath = path.join(__dirname, '..', pageName);
            const content = fs.readFileSync(pagePath, 'utf8');
            const hasTitle = /<title[^>]*>[^<]+<\/title>/.test(content);
            const hasDesc = /<meta[^>]+name=["']description["']/.test(content);
            const hasOG = /<meta[^>]+property=["']og:title["']/.test(content);
            const hasTwitter = /<meta[^>]+name=["']twitter:card["']/.test(content);
            const hasFavicon = /<link[^>]+rel=["']icon["']/.test(content);
            const hasAnalytics = /<script\s+src=["']js\/analytics\.js["']>/.test(content);
            
            assert(`SEO, Meta & Analytics script validation for ${pageName}`, hasTitle && hasDesc && hasOG && hasTwitter && hasFavicon && hasAnalytics, `Title: ${hasTitle}, Desc: ${hasDesc}, Analytics: ${hasAnalytics}`);
        }

        // Test 13: Analytics Asset Delivery
        const analyticsAsset = await get('/js/analytics.js');
        assert('Analytics JS Served (GET /js/analytics.js)', analyticsAsset.status === 200 && analyticsAsset.body.includes('versalyAnalytics'));

        // Test 14: Analytics Module Functionality & Zero-PII Unit Verification
        const analyticsCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'analytics.js'), 'utf8');
        const mockWindow = {
            location: { pathname: '/request-demo.html', search: '?product=healthcare-pro' },
            document: {
                title: 'Request a Demo — versaly',
                readyState: 'complete',
                addEventListener: () => {},
                createElement: () => ({ setAttribute: () => {} }),
                head: { appendChild: () => {} }
            },
            navigator: { doNotTrack: '0' },
            localStorage: {
                getItem: () => null,
                setItem: () => {}
            }
        };
        mockWindow.window = mockWindow;

        const vm = require('vm');
        const context = vm.createContext(mockWindow);
        vm.runInContext(analyticsCode, context);

        assert('versalyAnalytics object defined on window', typeof context.versalyAnalytics === 'object' && typeof context.versalyAnalytics.trackEvent === 'function');

        context.versalyAnalytics.init({
            enabled: true,
            measurementId: 'G-TESTID1234',
            debug: false
        });

        let lastDispatchedEvent = null;
        let lastDispatchedParams = null;
        context.gtag = function(command, eventName, params) {
            lastDispatchedEvent = eventName;
            lastDispatchedParams = params;
            if (context.dataLayer) context.dataLayer.push(arguments);
        };

        context.versalyAnalytics.trackFormSubmitted('demo_request', {
            product_id: 'healthcare-pro',
            product_name: 'ClinicOS',
            industry: 'Healthcare & Medical',
            goal: 'Replacing legacy tools',
            name: 'John Doe',
            full_name: 'Johnathan Doe',
            email: 'john@secretcompany.com',
            phone: '+1 555-999-8888',
            message: 'My private patient data consultation',
            user_input: 'Sensitive notes',
            password: 'supersecretpassword123'
        });

        const safeKeys = lastDispatchedParams ? Object.keys(lastDispatchedParams) : [];
        const hasLeakedPII = safeKeys.some(k => ['name', 'full_name', 'email', 'phone', 'message', 'user_input', 'password'].includes(k));
        const hasSafeData = lastDispatchedParams && lastDispatchedParams.product_id === 'healthcare-pro' && lastDispatchedParams.form_type === 'demo_request';

        assert('Zero-PII Filter: Strictly strips all personal information', !hasLeakedPII && hasSafeData, `Leaked: ${hasLeakedPII}, SafeData: ${hasSafeData}, Keys: ${safeKeys.join(',')}`);

        context.versalyAnalytics.trackCTA('request_demo', 'homepage_hero', { product_id: 'healthcare-pro' });
        assert('CTA Tracking: Correct event and params dispatched', lastDispatchedEvent === 'cta_click' && lastDispatchedParams.cta_name === 'request_demo' && lastDispatchedParams.cta_location === 'homepage_hero');

        context.versalyAnalytics.trackProductView({ id: 'financeflow', name: 'FinanceFlow', category: 'Finance', status: 'in-development' });
        assert('Product Interest: Product view metrics tracked', lastDispatchedEvent === 'product_view' && lastDispatchedParams.product_id === 'financeflow' && lastDispatchedParams.product_name === 'FinanceFlow');

        // ==========================================
        // PHASE: ADMIN DASHBOARD & CONVERSION STATS
        // ==========================================
        console.log('\n🔐 Testing Admin Portal & Conversion Analytics Dashboard...');

        // Admin Test 1: Static admin assets serving
        const adminPage = await get('/admin.html');
        assert('Serve Admin Dashboard (GET /admin.html)', adminPage.status === 200 && adminPage.body.includes('versaly') && adminPage.body.includes('id="admin-dashboard-view"'));

        const adminCss = await get('/css/admin.css');
        assert('Serve Admin CSS (GET /css/admin.css)', adminCss.status === 200 && adminCss.body.includes('--adm-primary'));

        const adminJs = await get('/js/admin.js');
        assert('Serve Admin JS (GET /js/admin.js)', adminJs.status === 200 && adminJs.body.includes('loadAllData'));

        // Admin Test 2: Unauthenticated protection
        const unauthStats = await authRequest('GET', '/api/admin/stats');
        assert('Unauthorized Stats Access (GET /api/admin/stats without token -> 401)', unauthStats.status === 401);

        const unauthSubs = await authRequest('GET', '/api/admin/submissions');
        assert('Unauthorized Submissions Access (GET /api/admin/submissions without token -> 401)', unauthSubs.status === 401);

        // Admin Test 3: Login failure with wrong password
        const badLogin = await authRequest('POST', '/api/admin/login', { password: 'wrongpassword123' });
        assert('Admin Login: Reject incorrect password (401)', badLogin.status === 401 && badLogin.body.success === false);

        // Admin Test 4: Successful Login
        const validLogin = await authRequest('POST', '/api/admin/login', { password: 'versaly_admin_2026' });
        const adminToken = validLogin.body && validLogin.body.token;
        assert('Admin Login: Authenticate with valid password (200 + token)', validLogin.status === 200 && validLogin.body.success === true && typeof adminToken === 'string' && adminToken.length > 20);

        // Admin Test 5: Verify Token
        const verifyRes = await authRequest('GET', '/api/admin/verify', null, adminToken);
        assert('Admin Verify: Valid session check (GET /api/admin/verify -> 200)', verifyRes.status === 200 && verifyRes.body.authenticated === true);

        // Admin Test 6: Conversion Analytics & Stats Calculation
        const statsRes = await authRequest('GET', '/api/admin/stats', null, adminToken);
        const stats = statsRes.body && statsRes.body.stats;
        assert('Admin Stats: Compute leads metrics, velocity, & pipeline', statsRes.status === 200 && stats && typeof stats.total_leads === 'number' && typeof stats.products_total === 'number' && typeof stats.product_pipeline === 'object');

        // Admin Test 7: Submissions List & Filtering
        const subsRes = await authRequest('GET', '/api/admin/submissions', null, adminToken);
        const submissions = subsRes.body && subsRes.body.submissions;
        assert('Admin Submissions: Fetch all submissions with metadata', subsRes.status === 200 && Array.isArray(submissions) && submissions.length > 0);

        // Admin Test 8: Lead Status Update (PATCH)
        const targetLead = submissions[0];
        const patchRes = await authRequest('PATCH', `/api/admin/submissions/${targetLead.ref_id}`, {
            status: 'in_review',
            admin_notes: 'Automated test qualifying call completed.'
        }, adminToken);
        assert('Admin Lead Workflow: Update status & internal notes (PATCH)', patchRes.status === 200 && patchRes.body.success === true && patchRes.body.submission.status === 'in_review');

        // Admin Test 9: Export Leads to CSV
        const exportRes = await authRequest('GET', '/api/admin/export.csv', null, adminToken);
        const isCsv = typeof exportRes.body === 'string' && exportRes.body.includes('Reference ID') && exportRes.body.includes('Submitted At') && exportRes.body.includes('Status');
        assert('Admin CSV Export: Generate sanitized CSV stream', exportRes.status === 200 && isCsv);

        // ==========================================
        // PHASE 7: PRODUCT MANAGEMENT CMS TESTS
        // ==========================================
        console.log('\n📦 Testing Phase 7 — Product Management CMS...');

        // CMS Test 1: Public Products API
        const publicProductsRes = await get('/api/products');
        let publicProducts = [];
        try { publicProducts = JSON.parse(publicProductsRes.body).products; } catch (e) {}
        assert('Public Products Catalog (GET /api/products -> 200)', publicProductsRes.status === 200 && Array.isArray(publicProducts) && publicProducts.length >= 4);

        // CMS Test 2: Admin Products List (Authenticated)
        const adminProductsRes = await authRequest('GET', '/api/admin/products', null, adminToken);
        assert('Admin Products List (GET /api/admin/products -> 200)', adminProductsRes.status === 200 && adminProductsRes.body.success && Array.isArray(adminProductsRes.body.products));

        // CMS Test 3: Create New Product (POST /api/admin/products)
        const testProductSlug = 'auto-test-suite-platform';
        const newProductPayload = {
            id: testProductSlug,
            name: 'Auto Test Platform',
            tagline: 'End-to-end automated testing for modern web apps.',
            category: 'Custom',
            status: 'in-development',
            accentColor: '#10b981',
            featured: true,
            spotlight: false,
            order: 99,
            shortDescription: 'Enterprise testing and release verification.',
            description: 'A comprehensive suite designed for automated QA workflows.',
            problem: 'Manual regression testing is slow, error-prone, and expensive.',
            whatWeAreBuilding: ['Visual regression diffing', 'CI/CD zero-latency triggers', 'Multi-tenant test reports'],
            features: [
                { icon: 'zap', title: 'Lightning Fast', description: 'Runs 10,000 checks in under 3 seconds.' },
                { icon: 'shield', title: 'Fail-Safe', description: 'Zero false positives guaranteed.' }
            ],
            benefits: [
                { icon: 'trending-up', title: '5x Release Velocity', description: 'Ship daily with total confidence.' }
            ],
            targetAudience: [
                { icon: 'users', title: 'QA Engineers & Leads', description: 'Cut testing cycle time by 80%.' }
            ],
            relatedProducts: ['financeflow']
        };

        const createProdRes = await authRequest('POST', '/api/admin/products', newProductPayload, adminToken);
        assert('Create Product (POST /api/admin/products -> 201)', createProdRes.status === 201 && createProdRes.body.success && createProdRes.body.product.id === testProductSlug);

        // CMS Test 4: Single Product Detail (GET /api/admin/products/:id)
        const getProdRes = await authRequest('GET', `/api/admin/products/${testProductSlug}`, null, adminToken);
        assert('Get Product Detail (GET /api/admin/products/:id -> 200)', getProdRes.status === 200 && getProdRes.body.success && getProdRes.body.product.name === 'Auto Test Platform');

        // CMS Test 5: Update Product (PUT /api/admin/products/:id)
        const updatedPayload = {
            ...newProductPayload,
            name: 'Auto Test Platform Enterprise',
            tagline: 'Updated Tagline: Next-generation test intelligence',
            status: 'live'
        };
        const updateProdRes = await authRequest('PUT', `/api/admin/products/${testProductSlug}`, updatedPayload, adminToken);
        assert('Update Product (PUT /api/admin/products/:id -> 200)', updateProdRes.status === 200 && updateProdRes.body.success && updateProdRes.body.product.name === 'Auto Test Platform Enterprise');

        // CMS Test 6: Quick Status & Visibility Toggle (PATCH /api/admin/products/:id/status)
        const patchStatusRes = await authRequest('PATCH', `/api/admin/products/${testProductSlug}/status`, {
            status: 'draft',
            featured: false,
            spotlight: true
        }, adminToken);
        assert('Quick Toggle Status & Visibility (PATCH /api/admin/products/:id/status -> 200)', patchStatusRes.status === 200 && patchStatusRes.body.product.status === 'draft' && patchStatusRes.body.product.spotlight === true);

        // CMS Test 7: Public Filter Guard: Drafts should NOT be returned on public API
        const publicAfterDraft = await get('/api/products');
        let pubItems = [];
        try { pubItems = JSON.parse(publicAfterDraft.body).products; } catch (e) {}
        const draftLeakedInPublic = pubItems.some(p => p.id === testProductSlug);
        assert('Public Security Guard: Draft products excluded from public catalog', !draftLeakedInPublic);

        // CMS Test 8: Public Single Product Guard: Draft product returns 404 on public endpoint
        const singleDraftRes = await get(`/api/products/${testProductSlug}`);
        assert('Public Security Guard: Draft product returns 404 on GET /api/products/:id', singleDraftRes.status === 404);

        // CMS Test 9: Reorder Products (POST /api/admin/products/reorder)
        const reorderPayload = {
            productIds: [testProductSlug, 'hotel-management-system', 'healthcare-pro', 'financeflow', 'makersuite']
        };
        const reorderRes = await authRequest('POST', '/api/admin/products/reorder', reorderPayload, adminToken);
        assert('Reorder Products (POST /api/admin/products/reorder -> 200)', reorderRes.status === 200 && reorderRes.body.success);

        // CMS Test 10: Activity Feed Log Check (GET /api/admin/activity)
        const activityRes = await authRequest('GET', '/api/admin/activity', null, adminToken);
        assert('Activity Stream (GET /api/admin/activity -> 200)', activityRes.status === 200 && activityRes.body.success && Array.isArray(activityRes.body.activity) && activityRes.body.activity.length > 0);

        // CMS Test 11: Delete Product (DELETE /api/admin/products/:id)
        const deleteProdRes = await authRequest('DELETE', `/api/admin/products/${testProductSlug}`, null, adminToken);
        assert('Delete Product (DELETE /api/admin/products/:id -> 200)', deleteProdRes.status === 200 && deleteProdRes.body.success);

        // CMS Test 12: Verify Deleted Product is removed from Admin List
        const verifyDeletedRes = await authRequest('GET', `/api/admin/products/${testProductSlug}`, null, adminToken);
        assert('Verify Product Removed (GET /api/admin/products/:id -> 404)', verifyDeletedRes.status === 404);

        // ════════════════════════════════════════════════════════════════
        // PHASE 8: MEDIA LIBRARY & SCREENSHOT MANAGER TESTS
        // ════════════════════════════════════════════════════════════════

        // Media Test 1: List Media Assets (GET /api/admin/media)
        const getMediaRes = await authRequest('GET', '/api/admin/media', null, adminToken);
        assert('Media Library: List Assets (GET /api/admin/media -> 200)', getMediaRes.status === 200 && getMediaRes.body.success && Array.isArray(getMediaRes.body.media));

        // Media Test 2: Upload Media Asset (POST /api/admin/media/upload)
        const sample1x1Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const uploadPayload = {
            originalName: 'test-dashboard-preview.png',
            mimeType: 'image/png',
            base64: sample1x1Png,
            size: 70,
            title: 'Test Dashboard Interface',
            caption: 'Primary reservation and analytics dashboard view',
            alt: 'Screenshot of dashboard',
            tags: ['dashboard', 'test', 'analytics']
        };
        const uploadRes = await authRequest('POST', '/api/admin/media/upload', uploadPayload, adminToken);
        assert('Media Upload: Save Base64 Asset (POST /api/admin/media/upload -> 201)', uploadRes.status === 201 && uploadRes.body.success && uploadRes.body.media && uploadRes.body.media.filename);

        const uploadedAsset = uploadRes.body.media;
        const uploadedId = uploadedAsset.id;
        const uploadedFilename = uploadedAsset.filename;

        // Media Test 3: Static Asset File Serving (/assets/uploads/:filename)
        const staticAssetRes = await get(`/assets/uploads/${uploadedFilename}`);
        assert('Media Static File: Accessible on Web (/assets/uploads/:filename -> 200)', staticAssetRes.status === 200 && staticAssetRes.headers['content-type'] === 'image/png');

        // Media Test 4: Single Media Asset Metadata (GET /api/admin/media/:id)
        const getSingleMediaRes = await authRequest('GET', `/api/admin/media/${uploadedId}`, null, adminToken);
        assert('Media Detail: Retrieve Single Asset (GET /api/admin/media/:id -> 200)', getSingleMediaRes.status === 200 && getSingleMediaRes.body.success && getSingleMediaRes.body.media.title === 'Test Dashboard Interface');

        // Media Test 5: Update Media Metadata (PUT /api/admin/media/:id)
        const updateMediaRes = await authRequest('PUT', `/api/admin/media/${uploadedId}`, {
            title: 'Updated Analytics UI',
            caption: 'Refined chart view and multi-property filter',
            alt: 'Updated chart visual',
            tags: ['analytics', 'enterprise', 'v2']
        }, adminToken);
        assert('Media Metadata Update (PUT /api/admin/media/:id -> 200)', updateMediaRes.status === 200 && updateMediaRes.body.success && updateMediaRes.body.media.title === 'Updated Analytics UI' && updateMediaRes.body.media.tags.includes('enterprise'));

        // Media Test 6: Delete Media Asset (DELETE /api/admin/media/:id)
        const deleteMediaRes = await authRequest('DELETE', `/api/admin/media/${uploadedId}`, null, adminToken);
        assert('Media Delete: Remove from registry & disk (DELETE /api/admin/media/:id -> 200)', deleteMediaRes.status === 200 && deleteMediaRes.body.success);

        // Media Test 7: Verify Deleted Media Asset (GET /api/admin/media/:id -> 404)
        const verifyDeletedMediaRes = await authRequest('GET', `/api/admin/media/${uploadedId}`, null, adminToken);
        assert('Media Verify Deletion (GET /api/admin/media/:id -> 404)', verifyDeletedMediaRes.status === 404);

        // ════════════════════════════════════════════════════════════════
        // PHASE 9: CONTENT & TRUST MANAGEMENT (CMS) TESTS
        // ════════════════════════════════════════════════════════════════

        // Content Test 1: Public Content List (GET /api/content)
        const publicContentRes = await get('/api/content');
        let pubContentBody = {};
        try { pubContentBody = JSON.parse(publicContentRes.body); } catch (e) {}
        assert('Content CMS: Public List (GET /api/content -> 200)', publicContentRes.status === 200 && pubContentBody.success && pubContentBody.data && Array.isArray(pubContentBody.data.testimonials) && Array.isArray(pubContentBody.data.faqs) && Array.isArray(pubContentBody.data.stats));

        // Content Test 2: Public Content Section Filter (GET /api/content?section=testimonials)
        const publicSectionRes = await get('/api/content?section=testimonials');
        let pubSectionBody = {};
        try { pubSectionBody = JSON.parse(publicSectionRes.body); } catch (e) {}
        assert('Content CMS: Section Filter (GET /api/content?section=testimonials -> 200)', publicSectionRes.status === 200 && pubSectionBody.success && Array.isArray(pubSectionBody.data) && !pubSectionBody.data.faqs);

        // Content Test 3: Admin Content Dictionary (GET /api/admin/content)
        const adminContentRes = await authRequest('GET', '/api/admin/content', null, adminToken);
        assert('Content CMS: Admin Full Dictionary (GET /api/admin/content -> 200)', adminContentRes.status === 200 && adminContentRes.body.success && adminContentRes.body.data && Array.isArray(adminContentRes.body.data.values) && Array.isArray(adminContentRes.body.data.partners));

        // Content Test 4: Admin Create Testimonial (POST /api/admin/content/testimonials)
        const createTestimonialPayload = {
            author: 'Samantha Reed',
            role: 'Chief Operating Officer',
            company: 'Vanguard Medical Systems',
            quote: 'StrataSoft transformed our clinical workflows within 48 hours.',
            avatar: '/assets/icons/favicon.svg',
            rating: 5,
            productId: 'healthcare-pro',
            product: 'Clinic Management System',
            status: 'published',
            featured: true,
            order: 99
        };
        const createTestimonialRes = await authRequest('POST', '/api/admin/content/testimonials', createTestimonialPayload, adminToken);
        assert('Content CMS: Create Testimonial (POST /api/admin/content/:section -> 201)', createTestimonialRes.status === 201 && createTestimonialRes.body.success && createTestimonialRes.body.item && createTestimonialRes.body.item.id);

        const createdItem = createTestimonialRes.body.item;
        const createdItemId = createdItem.id;

        // Content Test 5: Admin Get Single Content Item (GET /api/admin/content/testimonials/:id)
        const getSingleItemRes = await authRequest('GET', `/api/admin/content/testimonials/${createdItemId}`, null, adminToken);
        assert('Content CMS: Get Single Item (GET /api/admin/content/:section/:id -> 200)', getSingleItemRes.status === 200 && getSingleItemRes.body.success && getSingleItemRes.body.item.author === 'Samantha Reed');

        // Content Test 6: Admin Update Content Item (PUT /api/admin/content/testimonials/:id)
        const updateContentPayload = {
            author: 'Samantha Reed, MD',
            role: 'Chief Medical Officer',
            company: 'Vanguard Health Alliance',
            quote: 'StrataSoft transformed our clinical workflows and patient scheduling seamlessly.',
            rating: 5,
            status: 'published'
        };
        const updateContentRes = await authRequest('PUT', `/api/admin/content/testimonials/${createdItemId}`, updateContentPayload, adminToken);
        assert('Content CMS: Update Content Item (PUT /api/admin/content/:section/:id -> 200)', updateContentRes.status === 200 && updateContentRes.body.success && updateContentRes.body.item.author === 'Samantha Reed, MD' && updateContentRes.body.item.role === 'Chief Medical Officer');

        // Content Test 7: Admin Create FAQ Item (POST /api/admin/content/faqs)
        const createFaqPayload = {
            category: 'architecture',
            question: 'How does StrataSoft ensure tenant data isolation?',
            answer: 'Every deployment uses logically separated tenant datastores and end-to-end encrypted transport.',
            status: 'published',
            order: 10
        };
        const createFaqRes = await authRequest('POST', '/api/admin/content/faqs', createFaqPayload, adminToken);
        assert('Content CMS: Create FAQ Item (POST /api/admin/content/faqs -> 201)', createFaqRes.status === 201 && createFaqRes.body.success && createFaqRes.body.item.id);
        const createdFaqId = createFaqRes.body.item.id;

        // Content Test 8: Admin Reorder Content Items (POST /api/admin/content/reorder)
        const reorderContentRes = await authRequest('POST', '/api/admin/content/reorder', {
            section: 'faqs',
            itemIds: [createdFaqId, 'faq-1', 'faq-2']
        }, adminToken);
        assert('Content CMS: Reorder Section Items (POST /api/admin/content/reorder -> 200)', reorderContentRes.status === 200 && reorderContentRes.body.success);

        // Content Test 9: Admin Delete Content Items (DELETE /api/admin/content/:section/:id)
        const deleteTestimonialRes = await authRequest('DELETE', `/api/admin/content/testimonials/${createdItemId}`, null, adminToken);
        assert('Content CMS: Delete Testimonial (DELETE /api/admin/content/:section/:id -> 200)', deleteTestimonialRes.status === 200 && deleteTestimonialRes.body.success);

        const deleteFaqRes = await authRequest('DELETE', `/api/admin/content/faqs/${createdFaqId}`, null, adminToken);
        assert('Content CMS: Delete FAQ Item (DELETE /api/admin/content/:section/:id -> 200)', deleteFaqRes.status === 200 && deleteFaqRes.body.success);

        // Content Test 10: Verify Deletion (GET /api/admin/content/testimonials/:id -> 404)
        const verifyDeletedContentRes = await authRequest('GET', `/api/admin/content/testimonials/${createdItemId}`, null, adminToken);
        assert('Content CMS: Verify Item Removed (GET /api/admin/content/:section/:id -> 404)', verifyDeletedContentRes.status === 404);

        // ════════════════════════════════════════════════════════════════
        // PHASE 10: ADVANCED CRM PIPELINE & SYSTEM SETTINGS CMS TESTS
        // ════════════════════════════════════════════════════════════════

        // CRM Test 1: Public Settings Endpoint (GET /api/settings)
        const publicSettingsRes = await get('/api/settings');
        let pubSettingsBody = {};
        try { pubSettingsBody = JSON.parse(publicSettingsRes.body); } catch (e) {}
        assert('Settings: Public Config (GET /api/settings -> 200)', publicSettingsRes.status === 200 && pubSettingsBody.success && pubSettingsBody.settings && pubSettingsBody.settings.company && pubSettingsBody.settings.analytics && pubSettingsBody.settings.system);

        // CRM Test 2: Admin Settings Retrieval (GET /api/admin/settings)
        const adminSettingsRes = await authRequest('GET', '/api/admin/settings', null, adminToken);
        assert('Settings: Admin Full Config (GET /api/admin/settings -> 200)', adminSettingsRes.status === 200 && adminSettingsRes.body.success && adminSettingsRes.body.settings && adminSettingsRes.body.settings.notifications);

        // CRM Test 3: Admin Settings Update (PUT /api/admin/settings)
        const updateSettingsPayload = {
            company: {
                name: 'Versaly Technologies Inc.',
                tagline: 'Enterprise Industry-Grade Software Systems',
                supportEmail: 'support@versaly.example.com',
                salesEmail: 'sales@versaly.example.com',
                phone: '+1 (800) 555-0199',
                address: '100 Innovation Parkway, Suite 400, San Francisco, CA',
                linkedinUrl: 'https://linkedin.com/company/versaly',
                twitterUrl: 'https://x.com/versaly',
                githubUrl: 'https://github.com/versaly'
            },
            notifications: {
                emailAlerts: true,
                recipientEmail: 'alerts@versaly.example.com',
                webhookEnabled: true,
                webhookUrl: 'https://hooks.slack.com/services/T00/B00/X00'
            },
            analytics: {
                ga4Id: 'G-ENTERPRISE99',
                gtmId: 'GTM-VERSALY1',
                enforcePrivacyBanner: true
            },
            system: {
                maintenanceMode: false,
                statusPillText: 'All Systems Operational (99.98% SLA)',
                maintenanceMessage: 'System maintenance scheduled.'
            }
        };
        const updateSettingsRes = await authRequest('PUT', '/api/admin/settings', updateSettingsPayload, adminToken);
        assert('Settings: Update Configuration (PUT /api/admin/settings -> 200)', updateSettingsRes.status === 200 && updateSettingsRes.body.success && updateSettingsRes.body.settings.company.name === 'Versaly Technologies Inc.' && updateSettingsRes.body.settings.notifications.webhookEnabled === true);

        // CRM Test 4: Find an inquiry ref_id to test CRM pipeline
        const allSubsRes = await authRequest('GET', '/api/admin/submissions', null, adminToken);
        const crmTargetLead = (allSubsRes.body.submissions && allSubsRes.body.submissions[0]) || null;
        assert('CRM: Inquiries Available for Pipeline Testing', !!crmTargetLead && !!crmTargetLead.ref_id);

        const crmTargetRefId = crmTargetLead ? crmTargetLead.ref_id : 'DEMO-001';

        // CRM Test 5: Update Lead CRM Attributes & Stage Progression (PATCH /api/admin/submissions/:refId)
        const crmPatchPayload = {
            status: 'qualified',
            priority: 'urgent',
            assigned_to: 'sales',
            follow_up_date: '2026-10-15',
            estimated_value: 45000,
            admin_notes: 'Spoke with CTO, scheduled deep-dive architecture review.'
        };
        const crmPatchRes = await authRequest('PATCH', `/api/admin/submissions/${crmTargetRefId}`, crmPatchPayload, adminToken);
        assert('CRM: Update Lead Stage & Deal Attributes (PATCH /api/admin/submissions/:refId -> 200)', crmPatchRes.status === 200 && crmPatchRes.body.success && crmPatchRes.body.submission.status === 'qualified' && crmPatchRes.body.submission.priority === 'urgent' && crmPatchRes.body.submission.assigned_to === 'sales' && crmPatchRes.body.submission.estimated_value === 45000);

        // CRM Test 6: Append Structured Note (POST /api/admin/submissions/:refId/notes)
        const addNotePayload = {
            text: 'Client requested multi-region high availability SLA confirmation.',
            author: 'Alex (Lead Architect)'
        };
        const addNoteRes = await authRequest('POST', `/api/admin/submissions/${crmTargetRefId}/notes`, addNotePayload, adminToken);
        assert('CRM: Append Internal Note Thread (POST /api/admin/submissions/:refId/notes -> 201)', addNoteRes.status === 201 && addNoteRes.body.success && Array.isArray(addNoteRes.body.notes) && addNoteRes.body.notes.some(n => n.author === 'Alex (Lead Architect)'));

        // CRM Test 7: Enriched CRM CSV Export (GET /api/admin/export.csv)
        const csvRes = await authRequest('GET', '/api/admin/export.csv', null, adminToken);
        assert('CRM: Enriched CSV Export (GET /api/admin/export.csv -> 200)', csvRes.status === 200 && typeof csvRes.body === 'string' && csvRes.body.includes('Priority') && csvRes.body.includes('Assigned To') && csvRes.body.includes('Follow-up Date') && csvRes.body.includes('Est Value ($)'));

        // CRM Test 8: Aggregated CRM Pipeline Stats (GET /api/admin/stats)
        const crmStatsRes = await authRequest('GET', '/api/admin/stats', null, adminToken);
        assert('CRM: Stats Aggregation & Pipeline Value (GET /api/admin/stats -> 200)', crmStatsRes.status === 200 && crmStatsRes.body.success && crmStatsRes.body.stats.statuses && typeof crmStatsRes.body.stats.total_deal_value === 'number' && crmStatsRes.body.stats.priorities && crmStatsRes.body.stats.follow_up);

        // CRM Test 9: Password Change Validation & Update (POST /api/admin/settings/change-password)
        const invalidPwdChangeRes = await authRequest('POST', '/api/admin/settings/change-password', {
            currentPassword: 'WrongPassword123!',
            newPassword: 'BrandNewSecurePassword123'
        }, adminToken);
        assert('Settings Security: Reject Invalid Current Password (400)', invalidPwdChangeRes.status === 400 && invalidPwdChangeRes.body.success === false);

        const currentEnvPassword = CONFIG.adminPassword || process.env.ADMIN_PASSWORD || 'versaly_admin_2026';
        const validPwdChangeRes = await authRequest('POST', '/api/admin/settings/change-password', {
            currentPassword: currentEnvPassword,
            newPassword: 'TemporaryTestPassword2026!'
        }, adminToken);
        assert('Settings Security: Update Admin Password (200)', validPwdChangeRes.status === 200 && validPwdChangeRes.body.success === true && validPwdChangeRes.body.token);

        // Revert password back so subsequent test runs work cleanly
        if (validPwdChangeRes.body.token) {
            await authRequest('POST', '/api/admin/settings/change-password', {
                currentPassword: 'TemporaryTestPassword2026!',
                newPassword: currentEnvPassword
            }, validPwdChangeRes.body.token);
        }

        // Admin Test 10: Logout session invalidation
        const logoutRes = await authRequest('POST', '/api/admin/logout', null, adminToken);
        assert('Admin Logout: Invalidate session token', logoutRes.status === 200 && logoutRes.body.success === true);

        const verifyAfterLogout = await authRequest('GET', '/api/admin/verify', null, adminToken);
        assert('Admin Verify After Logout: Return 401 unauthenticated', verifyAfterLogout.status === 401 && verifyAfterLogout.body.authenticated === false);

        // ==========================================
        // PHASE 11: SEO, Accessibility & Legal Tests
        // ==========================================
        console.log('\n--- Phase 11: SEO, Accessibility & Legal Compliance Tests ---');

        // Phase 11 Test 1: Privacy Policy page serving & content
        const privacyPage = await get('/privacy.html');
        assert('Phase 11: Serve privacy.html (200)', privacyPage.status === 200);
        assert('Phase 11: privacy.html contains GDPR & Zero-Resale provisions', 
            privacyPage.body.includes('Privacy Policy') && 
            privacyPage.body.includes('Zero-Resale') && 
            privacyPage.body.includes('GDPR') &&
            privacyPage.body.includes('application/ld+json')
        );

        // Phase 11 Test 2: Terms of Service page serving & content
        const termsPage = await get('/terms.html');
        assert('Phase 11: Serve terms.html (200)', termsPage.status === 200);
        assert('Phase 11: terms.html contains Software Evaluation & IP terms',
            termsPage.body.includes('Terms of Service') &&
            termsPage.body.includes('Software Evaluation') &&
            termsPage.body.includes('Intellectual Property') &&
            termsPage.body.includes('application/ld+json')
        );

        // Phase 11 Test 3: Sitemap includes legal routes
        const sitemapRes = await get('/sitemap.xml');
        assert('Phase 11: sitemap.xml includes privacy.html and terms.html',
            sitemapRes.status === 200 &&
            sitemapRes.body.includes('/privacy.html') &&
            sitemapRes.body.includes('/terms.html')
        );

        // Phase 11 Test 4: All major pages contain footer links to privacy & terms and skip-link
        const pagesToCheck = ['/', '/about.html', '/products.html', '/contact.html', '/request-demo.html', '/404.html'];
        for (const p of pagesToCheck) {
            const pageRes = await get(p);
            const hasLegalLinks = pageRes.body.includes('privacy.html') && pageRes.body.includes('terms.html');
            const hasSkipLink = pageRes.body.includes('skip-link') || pageRes.body.includes('skip-to-content');
            assert(`Phase 11: ${p} has footer legal links & accessibility skip-link`, 
                pageRes.status === 200 && hasLegalLinks && hasSkipLink
            );
        }

        // Phase 11 Test 5: Motion Engine upgrade
        const motionRes = await get('/js/motion.js');
        assert('Phase 11: js/motion.js serves enhanced countUp & initCounters',
            motionRes.status === 200 &&
            motionRes.body.includes('countUp') &&
            motionRes.body.includes('initCounters') &&
            motionRes.body.includes('isReducedMotion')
        );

        // ==========================================
        // GSAP INTEGRATION: Choreography & Reveals
        // ==========================================
        console.log('\n--- GSAP Integration: Choreography & Reveal Tests ---');

        // GSAP Test 1: Vendor core & ScrollTrigger assets
        const gsapCoreRes = await get('/js/vendor/gsap.min.js');
        assert('GSAP: Serve js/vendor/gsap.min.js (200)', gsapCoreRes.status === 200 && gsapCoreRes.body.includes('gsap'));

        const gsapScrollRes = await get('/js/vendor/ScrollTrigger.min.js');
        assert('GSAP: Serve js/vendor/ScrollTrigger.min.js (200)', gsapScrollRes.status === 200 && gsapScrollRes.body.includes('ScrollTrigger'));

        // GSAP Test 2: Main GSAP initialization script
        const gsapInitRes = await get('/js/gsap-init.js');
        assert('GSAP: Serve js/gsap-init.js (200)', gsapInitRes.status === 200);
        assert('GSAP: Contains hero choreography, reveals, and reduced motion safety',
            gsapInitRes.body.includes('versalyGSAP') &&
            gsapInitRes.body.includes('initHeroChoreography') &&
            gsapInitRes.body.includes('initSectionReveals') &&
            gsapInitRes.body.includes('initProductShowcase') &&
            gsapInitRes.body.includes('isReducedMotion')
        );

        // GSAP Test 3: Script tags integrated across all public templates
        const gsapPages = ['/', '/about.html', '/products.html', '/product.html', '/contact.html', '/request-demo.html', '/privacy.html', '/terms.html', '/404.html'];
        for (const p of gsapPages) {
            const page = await get(p);
            const hasGsapCore = page.body.includes('js/vendor/gsap.min.js');
            const hasScrollTrigger = page.body.includes('js/vendor/ScrollTrigger.min.js');
            const hasGsapInit = page.body.includes('js/gsap-init.js');
            assert(`GSAP: ${p} includes GSAP vendor & init scripts`,
                page.status === 200 && hasGsapCore && hasScrollTrigger && hasGsapInit
            );
        }

        // ==========================================
        // PHASE 13: PLATFORM EXPANSION TESTS
        // ==========================================
        console.log('\n--- Phase 13: Platform Expansion, ROI Calculator & Knowledge Hub ---');

        // Phase 13 Test 1: Serve ROI Calculator
        const roiRes = await get('/roi-calculator.html');
        assert('Phase 13: Serve /roi-calculator.html (200)', roiRes.status === 200 && roiRes.body.includes('calc-team-size') && roiRes.body.includes('calc-kpi-savings'));

        // Phase 13 Test 2: Serve Resources Hub
        const resHubRes = await get('/resources.html');
        assert('Phase 13: Serve /resources.html (200)', resHubRes.status === 200 && resHubRes.body.includes('res-filter-pills') && resHubRes.body.includes('HotelFlow'));

        // Phase 13 Test 3: Serve Developer Documentation
        const docsRes = await get('/docs.html');
        assert('Phase 13: Serve /docs.html (200)', docsRes.status === 200 && docsRes.body.includes('POST /api/submit') && docsRes.body.includes('docs-code-box'));

        // Phase 13 Test 4: Serve Expansion Stylesheet & Calculator Engine
        const resCssRes = await get('/css/resources.css');
        assert('Phase 13: Serve /css/resources.css (200)', resCssRes.status === 200 && resCssRes.body.includes('calc-slider'));

        const calcJsRes = await get('/js/calculator.js');
        assert('Phase 13: Serve /js/calculator.js (200)', calcJsRes.status === 200 && calcJsRes.body.includes('INDUSTRY_MULTIPLIERS'));

        // ==========================================
        // PHASE 14: CUSTOMER SUPPORT & STATUS PORTAL TESTS
        // ==========================================
        console.log('\n--- Phase 14: Customer Support & Live Health Monitoring ---');

        // Phase 14 Test 1: Serve Support & Status Portal
        const supportRes = await get('/support.html');
        assert('Phase 14: Serve /support.html (200)', supportRes.status === 200 && supportRes.body.includes('sup-ticket-form') && supportRes.body.includes('sup-services-grid'));

        // Phase 14 Test 2: Serve Support Stylesheet
        const supportCssRes = await get('/css/support.css');
        assert('Phase 14: Serve /css/support.css (200)', supportCssRes.status === 200 && supportCssRes.body.includes('sup-services-grid'));

        // Phase 14 Test 3: Live System Status API (GET /api/system/status)
        const statusRes = await get('/api/system/status');
        const statusData = JSON.parse(statusRes.body);
        assert('Phase 14: Health Telemetry API (GET /api/system/status)', 
            statusRes.status === 200 && 
            statusData.status === 'operational' && 
            Array.isArray(statusData.services) &&
            statusData.services.length >= 5
        );

        // Phase 14 Test 4: Dispatch Support Ticket (POST /api/support/ticket)
        const validTicket = {
            name: 'Dev Operations Team',
            email: 'ops@company.internal',
            product: 'financeflow',
            severity: 'P2 - Degraded / Urgent',
            subject: 'Webhook Delivery Delay',
            description: 'Noticing a 250ms propagation latency in batch ledger synchronizations.',
            _hp_check: '',
            _ts: (Date.now() - 3000).toString()
        };
        const ticketRes = await postJson('/api/support/ticket', validTicket);
        assert('Phase 14: Create Support Ticket (POST /api/support/ticket)', 
            ticketRes.status === 201 && 
            ticketRes.body.success === true && 
            ticketRes.body.ticket_id.startsWith('SUP-2026-')
        );

        // Phase 14 Test 5: Reject Invalid Support Ticket (422)
        const invalidTicket = {
            name: '',
            email: 'invalid-email-address',
            subject: '',
            description: 'Too short'
        };
        const invalidTicketRes = await postJson('/api/support/ticket', invalidTicket);
        assert('Phase 14: Validation for incomplete ticket (422)', invalidTicketRes.status === 422 && invalidTicketRes.body.success === false);

        // Phase 14 Test 6: Sitemap includes /support.html
        const sitemapFresh = await get('/sitemap.xml');
        assert('Phase 14: sitemap.xml includes support.html', sitemapFresh.body.includes('/support.html'));

        // ==========================================
        // PHASE 17: ADMIN AUDIT LOGS & ACTIVITY REPORTING TESTS
        // ==========================================
        console.log('\n📈 Testing Phase 17 — Admin Audit Logs & Analytics Reporting...');

        // Authenticate fresh session for Phase 17
        const phase17Login = await authRequest('POST', '/api/admin/login', { password: 'versaly_admin_2026' });
        const phase17Token = phase17Login.body && phase17Login.body.token;

        // Phase 17 Test 1: Analytics Trends (30d default)
        const trends30Res = await authRequest('GET', '/api/admin/analytics/trends', null, phase17Token);
        assert('Phase 17: Analytics Trends 30d (GET /api/admin/analytics/trends -> 200)', 
            trends30Res.status === 200 &&
            trends30Res.body.success === true &&
            Array.isArray(trends30Res.body.daily_series) &&
            trends30Res.body.daily_series.length === 30 &&
            typeof trends30Res.body.summary === 'object' &&
            typeof trends30Res.body.funnel === 'object' &&
            typeof trends30Res.body.channels === 'object'
        );

        // Phase 17 Test 2: Analytics Trends Range Filtering (7d)
        const trends7Res = await authRequest('GET', '/api/admin/analytics/trends?range=7d', null, phase17Token);
        assert('Phase 17: Analytics Trends 7d Range (GET /api/admin/analytics/trends?range=7d -> 200)',
            trends7Res.status === 200 &&
            trends7Res.body.daily_series.length === 7 &&
            trends7Res.body.summary.days === 7
        );

        // Phase 17 Test 3: Analytics Trends 90d Range
        const trends90Res = await authRequest('GET', '/api/admin/analytics/trends?range=90d', null, phase17Token);
        assert('Phase 17: Analytics Trends 90d Range (GET /api/admin/analytics/trends?range=90d -> 200)',
            trends90Res.status === 200 &&
            trends90Res.body.daily_series.length === 90 &&
            trends90Res.body.summary.days === 90
        );

        // Phase 17 Test 4: Queryable Audit Logs Feed
        const auditRes = await authRequest('GET', '/api/admin/audit', null, phase17Token);
        assert('Phase 17: Queryable Audit Feed (GET /api/admin/audit -> 200)',
            auditRes.status === 200 &&
            auditRes.body.success === true &&
            Array.isArray(auditRes.body.activities) &&
            Array.isArray(auditRes.body.categories)
        );

        // Phase 17 Test 5: Audit Log Category Filtering
        const auditLeadsRes = await authRequest('GET', '/api/admin/audit?category=leads', null, phase17Token);
        assert('Phase 17: Audit Category Filtering (GET /api/admin/audit?category=leads -> 200)',
            auditLeadsRes.status === 200 &&
            Array.isArray(auditLeadsRes.body.activities) &&
            auditLeadsRes.body.activities.every(a => a.category === 'leads')
        );

        // Phase 17 Test 6: Audit Log CSV Export
        const auditCsvRes = await authRequest('GET', '/api/admin/audit/export.csv', null, phase17Token);
        assert('Phase 17: Audit Trail CSV Export (GET /api/admin/audit/export.csv -> 200)',
            auditCsvRes.status === 200 &&
            typeof auditCsvRes.body === 'string' &&
            auditCsvRes.body.includes('Log ID') &&
            auditCsvRes.body.includes('Timestamp') &&
            auditCsvRes.body.includes('Category') &&
            auditCsvRes.body.includes('Action')
        );

        // Phase 17 Test 7: Executive Report Generation
        const execReportRes = await authRequest('GET', '/api/admin/analytics/report', null, phase17Token);
        assert('Phase 17: Executive Summary Report (GET /api/admin/analytics/report -> 200)',
            execReportRes.status === 200 &&
            execReportRes.body.success === true &&
            typeof execReportRes.body.report === 'object' &&
            typeof execReportRes.body.report.pipeline_valuation === 'number' &&
            typeof execReportRes.body.report.total_products === 'number'
        );

        // Phase 17 Test 8: Purge / Clear Audit Logs
        const clearAuditRes = await authRequest('POST', '/api/admin/audit/clear', {}, phase17Token);
        assert('Phase 17: Clear Audit Logs (POST /api/admin/audit/clear -> 200)',
            clearAuditRes.status === 200 && clearAuditRes.body.success === true
        );

        // Phase 17 Test 9: Verify Reset Audit State
        const auditAfterClearRes = await authRequest('GET', '/api/admin/audit', null, phase17Token);
        assert('Phase 17: Verify Audit Log Reset (GET /api/admin/audit -> 1 Event)',
            auditAfterClearRes.status === 200 &&
            auditAfterClearRes.body.total === 1 &&
            auditAfterClearRes.body.activities[0].action === 'audit_log_cleared'
        );

        // ==========================================
        // PHASE 18: NOTIFICATION CENTER & WEBHOOK INTEGRATIONS TESTS
        // ==========================================
        console.log('\n🔔 Testing Phase 18 — Notification Center & Webhook Integrations...');

        // Phase 18 Test 1: Notifications List & Unread Count
        const notifsRes = await authRequest('GET', '/api/admin/notifications', null, phase17Token);
        assert('Phase 18: Notifications Feed (GET /api/admin/notifications -> 200)',
            notifsRes.status === 200 &&
            notifsRes.body.success === true &&
            Array.isArray(notifsRes.body.notifications) &&
            typeof notifsRes.body.unread_count === 'number'
        );

        // Phase 18 Test 2: Trigger Form Submission & Verify Notification Auto-Creation
        const testInquiryPayload = {
            name: 'Webhook Verification Lead',
            email: 'webhook-lead@example.com',
            subject: 'Phase 18 Integration Testing',
            message: 'Testing automatic notification and webhook event emission.',
            form_type: 'contact',
            _ts: (Date.now() - 3000).toString()
        };
        const subRes = await postJson('/api/submit', testInquiryPayload);
        assert('Phase 18: Inquiry Dispatched (POST /api/submit -> 200)', subRes.status === 200 && subRes.body.success === true);

        const notifsAfterSubRes = await authRequest('GET', '/api/admin/notifications', null, phase17Token);
        const hasNewInquiryNotif = notifsAfterSubRes.body.notifications.some(n => 
            n.title && n.title.includes('Webhook Verification Lead')
        );
        assert('Phase 18: Automated Notification Generated on Lead Submission', hasNewInquiryNotif);

        // Phase 18 Test 3: Mark Single Notification as Read (PATCH /api/admin/notifications/:id/read)
        const targetNotif = notifsAfterSubRes.body.notifications.find(n => !n.read) || notifsAfterSubRes.body.notifications[0];
        const markReadRes = await authRequest('PATCH', `/api/admin/notifications/${targetNotif.id}/read`, {}, phase17Token);
        assert('Phase 18: Mark Single Notification as Read (PATCH /api/admin/notifications/:id/read -> 200)',
            markReadRes.status === 200 &&
            markReadRes.body.success === true &&
            markReadRes.body.notification.read === true
        );

        // Phase 18 Test 4: Mark All Notifications as Read (POST /api/admin/notifications/read-all)
        const markAllReadRes = await authRequest('POST', '/api/admin/notifications/read-all', {}, phase17Token);
        assert('Phase 18: Mark All Notifications Read (POST /api/admin/notifications/read-all -> 200)',
            markAllReadRes.status === 200 &&
            markAllReadRes.body.success === true
        );

        const notifsAfterAllRead = await authRequest('GET', '/api/admin/notifications', null, phase17Token);
        assert('Phase 18: Unread Count Reset to Zero', notifsAfterAllRead.body.unread_count === 0);

        // Phase 18 Test 5: Register Outbound Webhook (POST /api/admin/webhooks)
        const newWebhookPayload = {
            name: 'Slack Alerts Integration',
            type: 'slack',
            url: `http://localhost:${TEST_PORT}/api/health`,
            secret: 'test_hmac_secret_key_2026',
            events: ['lead.created', 'lead.qualified', 'ticket.created'],
            active: true
        };
        const createHookRes = await authRequest('POST', '/api/admin/webhooks', newWebhookPayload, phase17Token);
        assert('Phase 18: Register Outbound Webhook (POST /api/admin/webhooks -> 201)',
            createHookRes.status === 201 &&
            createHookRes.body.success === true &&
            createHookRes.body.webhook &&
            createHookRes.body.webhook.name === 'Slack Alerts Integration'
        );
        const createdHookId = createHookRes.body.webhook.id;

        // Phase 18 Test 6: List Webhooks (GET /api/admin/webhooks)
        const listHooksRes = await authRequest('GET', '/api/admin/webhooks', null, phase17Token);
        assert('Phase 18: List Webhooks (GET /api/admin/webhooks -> 200)',
            listHooksRes.status === 200 &&
            Array.isArray(listHooksRes.body.webhooks) &&
            listHooksRes.body.webhooks.some(h => h.id === createdHookId)
        );

        // Phase 18 Test 7: Update Webhook Configuration (PUT /api/admin/webhooks/:id)
        const updateHookPayload = {
            name: 'Slack Alerts Integration Enterprise',
            active: true,
            events: ['lead.created', 'lead.qualified', 'ticket.created', 'system.alert']
        };
        const updateHookRes = await authRequest('PUT', `/api/admin/webhooks/${createdHookId}`, updateHookPayload, phase17Token);
        assert('Phase 18: Update Webhook Config (PUT /api/admin/webhooks/:id -> 200)',
            updateHookRes.status === 200 &&
            updateHookRes.body.success === true &&
            updateHookRes.body.webhook.name === 'Slack Alerts Integration Enterprise' &&
            updateHookRes.body.webhook.events.includes('system.alert')
        );

        // Phase 18 Test 8: Dispatch Immediate Webhook Test Ping (POST /api/admin/webhooks/:id/test)
        const testPingRes = await authRequest('POST', `/api/admin/webhooks/${createdHookId}/test`, {}, phase17Token);
        assert('Phase 18: Webhook Test Ping Dispatch (POST /api/admin/webhooks/:id/test -> 200)',
            testPingRes.status === 200 &&
            testPingRes.body.success === true &&
            testPingRes.body.delivery &&
            testPingRes.body.delivery.event === 'webhook.test'
        );

        // Phase 18 Test 9: Webhook Delivery History (GET /api/admin/webhooks/deliveries)
        const deliveriesRes = await authRequest('GET', '/api/admin/webhooks/deliveries', null, phase17Token);
        assert('Phase 18: Webhook Delivery History (GET /api/admin/webhooks/deliveries -> 200)',
            deliveriesRes.status === 200 &&
            Array.isArray(deliveriesRes.body.deliveries) &&
            deliveriesRes.body.deliveries.length > 0
        );

        // Phase 18 Test 10: Delete Webhook (DELETE /api/admin/webhooks/:id)
        const deleteHookRes = await authRequest('DELETE', `/api/admin/webhooks/${createdHookId}`, null, phase17Token);
        assert('Phase 18: Delete Webhook (DELETE /api/admin/webhooks/:id -> 200)',
            deleteHookRes.status === 200 && deleteHookRes.body.success === true
        );

        // Phase 18 Test 11: Purge All Notifications (POST /api/admin/notifications/clear)
        const clearNotifsRes = await authRequest('POST', '/api/admin/notifications/clear', {}, phase17Token);
        assert('Phase 18: Purge All Notifications (POST /api/admin/notifications/clear -> 200)',
            clearNotifsRes.status === 200 && clearNotifsRes.body.success === true
        );

        const notifsAfterClear = await authRequest('GET', '/api/admin/notifications', null, phase17Token);
        assert('Phase 18: Notifications Feed Emptied', notifsAfterClear.body.count === 0);

        // ==========================================
        // PHASE 19: PRODUCT COMPARISON & FEATURE MATRIX
        // ==========================================
        console.log('\n📊 Testing Phase 19 — Product Comparison & Interactive Feature Matrix...');

        // Phase 19 Test 1: Serve /compare.html
        const comparePageRes = await get('/compare.html');
        assert('Phase 19: Serve /compare.html (200)',
            comparePageRes.status === 200 &&
            comparePageRes.body.includes('cmp-matrix-table') &&
            comparePageRes.body.includes('cmp-product-chips') &&
            comparePageRes.body.includes('cmp-diff-toggle') &&
            comparePageRes.body.includes('skip-link')
        );

        // Phase 19 Test 2: Serve /css/compare.css
        const compareCssRes = await get('/css/compare.css');
        assert('Phase 19: Serve /css/compare.css (200)',
            compareCssRes.status === 200 &&
            compareCssRes.body.includes('cmp-matrix-table') &&
            compareCssRes.body.includes('highlight-diffs')
        );

        // Phase 19 Test 3: Serve /js/compare.js
        const compareJsRes = await get('/js/compare.js');
        assert('Phase 19: Serve /js/compare.js (200)',
            compareJsRes.status === 200 &&
            compareJsRes.body.includes('loadComparisonData') &&
            compareJsRes.body.includes('exportComparisonCsv')
        );

        // Phase 19 Test 4: Comparison Matrix API (GET /api/products/compare)
        const compareApiRes = await get('/api/products/compare');
        const compareApiBody = JSON.parse(compareApiRes.body);
        assert('Phase 19: Public Comparison API (GET /api/products/compare -> 200)',
            compareApiRes.status === 200 &&
            compareApiBody.success === true &&
            Array.isArray(compareApiBody.schema) &&
            compareApiBody.schema.length === 7 &&
            Array.isArray(compareApiBody.products) &&
            compareApiBody.products.length >= 5
        );

        // Phase 19 Test 5: Verify Structured Matrix Data on Products
        const sampleProd = compareApiBody.products.find(p => p.id === 'hotel-management-system');
        assert('Phase 19: Product Matrix Capabilities Schema Populated',
            sampleProd &&
            sampleProd.matrix &&
            sampleProd.matrix.architecture &&
            sampleProd.matrix.security &&
            sampleProd.matrix.workflows &&
            sampleProd.matrix.analytics &&
            sampleProd.matrix.integrations &&
            sampleProd.matrix.support &&
            sampleProd.matrix.commercial
        );

        // Phase 19 Test 6: Filtered Comparison API (GET /api/products/compare?ids=...)
        const filteredApiRes = await get('/api/products/compare?ids=healthcare-pro,financeflow');
        const filteredApiBody = JSON.parse(filteredApiRes.body);
        assert('Phase 19: Filtered Comparison Query (GET /api/products/compare?ids=... -> 2 products)',
            filteredApiRes.status === 200 &&
            filteredApiBody.success === true &&
            filteredApiBody.products.length === 2 &&
            filteredApiBody.products[0].id === 'healthcare-pro' &&
            filteredApiBody.products[1].id === 'financeflow'
        );

        // Phase 19 Test 7: Sitemap includes compare.html
        const sitemapCompareRes = await get('/sitemap.xml');
        assert('Phase 19: sitemap.xml includes compare.html',
            sitemapCompareRes.status === 200 &&
            sitemapCompareRes.body.includes('/compare.html')
        );

        // Phase 19 Test 8: Cross-links present in products catalogue
        const productsCatalogRes = await get('/products.html');
        assert('Phase 19: /products.html contains link to compare.html',
            productsCatalogRes.status === 200 &&
            productsCatalogRes.body.includes('compare.html')
        );

        // Phase 19 Test 9: GSAP Animation integration for compare.html
        const compareHasGsap = comparePageRes.body.includes('js/vendor/gsap.min.js') &&
            comparePageRes.body.includes('js/vendor/ScrollTrigger.min.js') &&
            comparePageRes.body.includes('js/gsap-init.js');
        assert('Phase 19: compare.html includes GSAP animation scripts', compareHasGsap);

        // ==========================================
        // PHASE 20: SITE-WIDE DARK MODE TESTS
        // ==========================================
        console.log('\n--- Phase 20: Site-Wide Dark Mode Tests ---');

        // Test 1: dark.css stylesheet served with valid mime & content
        const darkCssRes = await get('/css/dark.css');
        assert('Phase 20: Dark Mode Stylesheet (GET /css/dark.css -> 200)',
            darkCssRes.status === 200 &&
            darkCssRes.body.includes('data-theme="dark"') &&
            darkCssRes.body.includes('--bg-primary')
        );

        // Test 2: theme.js script served with valid mime & theme engine logic
        const themeJsRes = await get('/js/theme.js');
        assert('Phase 20: Dark Mode Engine Script (GET /js/theme.js -> 200)',
            themeJsRes.status === 200 &&
            themeJsRes.body.includes('versaly-theme') &&
            themeJsRes.body.includes('toggleTheme')
        );

        // Test 3: Public & system pages all include dark.css, theme.js, and anti-FOUT script
        const themePages = [
            '/',
            '/products.html',
            '/compare.html',
            '/about.html',
            '/contact.html',
            '/product.html?id=hotel-management-system',
            '/roi-calculator.html',
            '/resources.html',
            '/docs.html',
            '/support.html',
            '/request-demo.html',
            '/privacy.html',
            '/terms.html',
            '/404.html',
            '/admin.html'
        ];

        let allPagesHaveDarkAssets = true;
        let missingAssetDetails = [];

        for (const pagePath of themePages) {
            const pageRes = await get(pagePath);
            const hasCss = pageRes.body.includes('css/dark.css');
            const hasJs = pageRes.body.includes('js/theme.js');
            if (!hasCss || !hasJs) {
                allPagesHaveDarkAssets = false;
                missingAssetDetails.push(`${pagePath} (css:${hasCss}, js:${hasJs})`);
            }
        }
        assert('Phase 20: All 15 Pages Include css/dark.css and js/theme.js',
            allPagesHaveDarkAssets,
            missingAssetDetails.join(', ')
        );

        // Test 4: Verify anti-FOUT inline script exists in head of primary pages
        const indexRes = await get('/');
        const hasFoutScript = indexRes.body.includes("document.documentElement.setAttribute('data-theme'") &&
            indexRes.body.includes('prefers-color-scheme');
        assert('Phase 20: Zero-FOUT Inline Theme Script in <head>', hasFoutScript);

        // Test 5: Verify theme toggles exist in navigation bars
        const hasThemeToggle = indexRes.body.includes('class="theme-toggle"');
        const hasMobileToggle = indexRes.body.includes('mobile-theme-toggle');
        assert('Phase 20: Desktop & Mobile Accessible Theme Toggles Present in DOM',
            hasThemeToggle && hasMobileToggle
        );

        // Test 6: Verify Dark Mode Contrast Palettes & WCAG AA/AAA variables in dark.css
        const darkHasContrastRules = darkCssRes.body.includes('--text-primary: #f8fafc') &&
            darkCssRes.body.includes('--bg-primary: #0b0f19') &&
            darkCssRes.body.includes('--card-bg: #111827') &&
            darkCssRes.body.includes('--border-color: rgba(255, 255, 255, 0.12)');
        assert('Phase 20: Dark Mode WCAG Compliant Contrast Variables Defined', darkHasContrastRules);

        console.log(`\n=================================================`);
        console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
        console.log(`=================================================\n`);

    } catch (err) {
        console.error('Fatal test error:', err);
        failed++;
    } finally {
        if (server) {
            server.close();
        }
        process.exit(failed > 0 ? 1 : 0);
    }
}

runTests();
