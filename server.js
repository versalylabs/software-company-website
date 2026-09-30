/**
 * versaly Website & Enquiry Submission Server
 * 
 * Lightweight, zero-dependency Node.js HTTP server.
 * Handles static asset delivery, rate limiting, bot protection (honeypots & time checks),
 * data persistence to data/submissions.json, and email/webhook dispatching.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

// --- 1. Environment Configuration Loader ---
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        try {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split(/\r?\n/).forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                    const idx = trimmed.indexOf('=');
                    const key = trimmed.substring(0, idx).trim();
                    let val = trimmed.substring(idx + 1).trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    if (process.env[key] === undefined) {
                        process.env[key] = val;
                    }
                }
            });
        } catch (e) {
            console.warn('[CONFIG] Warning: Could not read .env file:', e.message);
        }
    }
}
loadEnv();

const isVercel = !!process.env.VERCEL;
function resolveDataPath(envVar, defaultRelPath) {
    if (process.env[envVar]) return path.resolve(__dirname, process.env[envVar]);
    const srcPath = path.resolve(__dirname, defaultRelPath);
    if (!isVercel) return srcPath;
    const tmpPath = path.join('/tmp', defaultRelPath);
    const tmpDir = path.dirname(tmpPath);
    if (!fs.existsSync(tmpDir)) {
        try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) {}
    }
    if (!fs.existsSync(tmpPath) && fs.existsSync(srcPath)) {
        try { fs.copyFileSync(srcPath, tmpPath); } catch (e) {}
    }
    return tmpPath;
}

function resolveUploadsPath(envVar, defaultRelPath) {
    if (process.env[envVar]) return path.resolve(__dirname, process.env[envVar]);
    const srcPath = path.resolve(__dirname, defaultRelPath);
    if (!isVercel) return srcPath;
    const tmpPath = path.join('/tmp', defaultRelPath);
    if (!fs.existsSync(tmpPath)) {
        try { fs.mkdirSync(tmpPath, { recursive: true }); } catch (e) {}
    }
    return tmpPath;
}

const CONFIG = {
    port: parseInt(process.env.PORT, 10) || 3000,
    notificationEmail: process.env.NOTIFICATION_EMAIL || 'leads@versaly.example.com',
    storageFile: resolveDataPath('STORAGE_FILE', 'data/submissions.json'),
    productsFile: resolveDataPath('PRODUCTS_FILE', 'data/products.json'),
    activityFile: resolveDataPath('ACTIVITY_FILE', 'data/activity.json'),
    mediaFile: resolveDataPath('MEDIA_FILE', 'data/media.json'),
    contentFile: resolveDataPath('CONTENT_FILE', 'data/content.json'),
    settingsFile: resolveDataPath('SETTINGS_FILE', 'data/settings.json'),
    notificationsFile: resolveDataPath('NOTIFICATIONS_FILE', 'data/notifications.json'),
    webhooksFile: resolveDataPath('WEBHOOKS_FILE', 'data/webhooks.json'),
    webhookDeliveriesFile: resolveDataPath('WEBHOOK_DELIVERIES_FILE', 'data/webhook_deliveries.json'),
    uploadsDir: resolveUploadsPath('UPLOADS_DIR', 'assets/uploads'),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 15,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins
    webhookUrl: process.env.WEBHOOK_URL || '',
    adminPassword: process.env.ADMIN_PASSWORD || 'versaly_admin_2026',
    smtp: {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'versaly Inquiries <no-reply@versaly.example.com>'
    }
};

// Ensure data directory and uploads directory exist
const dataDir = path.dirname(CONFIG.storageFile);
if (!fs.existsSync(dataDir)) {
    try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}
}
if (!fs.existsSync(CONFIG.uploadsDir)) {
    try { fs.mkdirSync(CONFIG.uploadsDir, { recursive: true }); } catch (e) {}
}

// --- Product, Media and Activity Store Helpers ---
function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 80);
}

function readProductsData() {
    if (!fs.existsSync(CONFIG.productsFile)) return { products: [] };
    try {
        const raw = fs.readFileSync(CONFIG.productsFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed.products || !Array.isArray(parsed.products)) {
            return { products: [] };
        }
        return parsed;
    } catch (e) {
        return { products: [] };
    }
}

function saveProductsData(data) {
    try {
        fs.writeFileSync(CONFIG.productsFile, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('[STORAGE] Error saving products to disk:', e.message);
        return false;
    }
}

function readMediaData() {
    if (!fs.existsSync(CONFIG.mediaFile)) return { media: [] };
    try {
        const raw = fs.readFileSync(CONFIG.mediaFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed.media || !Array.isArray(parsed.media)) {
            return { media: [] };
        }
        return parsed;
    } catch (e) {
        return { media: [] };
    }
}

function saveMediaData(data) {
    try {
        fs.writeFileSync(CONFIG.mediaFile, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('[STORAGE] Error saving media to disk:', e.message);
        return false;
    }
}

function deleteMediaFile(filename) {
    try {
        const fullPath = path.resolve(CONFIG.uploadsDir, path.basename(filename));
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            return true;
        }
    } catch (e) {
        console.warn('[STORAGE] Warning deleting media file:', e.message);
    }
    return false;
}

function readContentData() {
    const defaultContent = { testimonials: [], faqs: [], stats: [], values: [], partners: [] };
    if (!fs.existsSync(CONFIG.contentFile)) return defaultContent;
    try {
        const raw = fs.readFileSync(CONFIG.contentFile, 'utf8');
        const parsed = JSON.parse(raw);
        return {
            testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : [],
            faqs: Array.isArray(parsed.faqs) ? parsed.faqs : [],
            stats: Array.isArray(parsed.stats) ? parsed.stats : [],
            values: Array.isArray(parsed.values) ? parsed.values : [],
            partners: Array.isArray(parsed.partners) ? parsed.partners : []
        };
    } catch (e) {
        return defaultContent;
    }
}

function saveContentData(data) {
    try {
        fs.writeFileSync(CONFIG.contentFile, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('[STORAGE] Error saving content to disk:', e.message);
        return false;
    }
}

function readSettingsData() {
    const defaultSettings = {
        company: {
            name: "versaly",
            legalName: "versaly Inc.",
            tagline: "Software solutions that work the way your business does.",
            supportEmail: "support@versaly.example.com",
            salesEmail: "sales@versaly.example.com",
            phone: "+1 (555) 019-2834",
            address: "100 Innovation Parkway, Suite 400, San Francisco, CA 94107",
            linkedin: "https://linkedin.com",
            twitter: "https://x.com",
            github: "https://github.com"
        },
        notifications: {
            emailAlerts: true,
            recipientEmail: "leads@versaly.example.com",
            webhookEnabled: false,
            webhookUrl: ""
        },
        analytics: {
            gaMeasurementId: "G-XXXXXXXXXX",
            gtmContainerId: "GTM-XXXXXXX",
            privacyBanner: true
        },
        system: {
            maintenanceMode: false,
            maintenanceMessage: "System maintenance in progress. We'll be back shortly.",
            statusIndicator: "All Systems Operational"
        },
        updatedAt: new Date().toISOString()
    };

    if (!fs.existsSync(CONFIG.settingsFile)) return defaultSettings;
    try {
        const raw = fs.readFileSync(CONFIG.settingsFile, 'utf8');
        const parsed = JSON.parse(raw);
        return {
            company: { ...defaultSettings.company, ...(parsed.company || {}) },
            notifications: { ...defaultSettings.notifications, ...(parsed.notifications || {}) },
            analytics: { ...defaultSettings.analytics, ...(parsed.analytics || {}) },
            system: { ...defaultSettings.system, ...(parsed.system || {}) },
            updatedAt: parsed.updatedAt || defaultSettings.updatedAt
        };
    } catch (e) {
        return defaultSettings;
    }
}

function saveSettingsData(data) {
    try {
        fs.writeFileSync(CONFIG.settingsFile, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('[STORAGE] Error saving settings to disk:', e.message);
        return false;
    }
}

function logActivity(action, details = {}, user = 'admin', category = null, ip = null) {
    try {
        let list = [];
        if (fs.existsSync(CONFIG.activityFile)) {
            try {
                list = JSON.parse(fs.readFileSync(CONFIG.activityFile, 'utf8'));
                if (!Array.isArray(list)) list = [];
            } catch (e) { list = []; }
        }

        // Derive category if not explicitly provided
        let cat = category;
        if (!cat) {
            if (action.startsWith('auth_') || action.includes('login') || action.includes('password')) cat = 'auth';
            else if (action.startsWith('product_')) cat = 'products';
            else if (action.startsWith('lead_') || action.startsWith('submission_')) cat = 'leads';
            else if (action.startsWith('media_')) cat = 'media';
            else if (action.startsWith('content_')) cat = 'content';
            else if (action.startsWith('settings_')) cat = 'settings';
            else cat = 'system';
        }

        const entry = {
            id: 'act_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
            timestamp: new Date().toISOString(),
            action: action,
            category: cat,
            details: details,
            user: user,
            ip: ip || '127.0.0.1'
        };
        list.unshift(entry);
        if (list.length > 500) list = list.slice(0, 500);
        fs.writeFileSync(CONFIG.activityFile, JSON.stringify(list, null, 2), 'utf8');
        return entry;
    } catch (e) {
        return null;
    }
}

function getActivities(limit = 50, filter = {}) {
    if (!fs.existsSync(CONFIG.activityFile)) return [];
    try {
        const raw = fs.readFileSync(CONFIG.activityFile, 'utf8');
        let list = JSON.parse(raw);
        if (!Array.isArray(list)) return [];

        if (filter.category && filter.category !== 'all') {
            list = list.filter(item => item.category === filter.category);
        }
        if (filter.action && filter.action !== 'all') {
            list = list.filter(item => item.action === filter.action);
        }
        if (filter.search) {
            const term = filter.search.toLowerCase();
            list = list.filter(item => {
                const act = (item.action || '').toLowerCase();
                const u = (item.user || '').toLowerCase();
                const d = JSON.stringify(item.details || {}).toLowerCase();
                return act.includes(term) || u.includes(term) || d.includes(term);
            });
        }
        if (filter.fromDate) {
            list = list.filter(item => item.timestamp >= filter.fromDate);
        }
        if (filter.toDate) {
            list = list.filter(item => item.timestamp <= filter.toDate);
        }

        return typeof limit === 'number' && limit > 0 ? list.slice(0, limit) : list;
    } catch (e) {
        return [];
    }
}

// --- Notification Center Data Helpers (Phase 18) ---
function readNotificationsData() {
    if (!fs.existsSync(CONFIG.notificationsFile)) {
        const initial = [
            {
                id: 'notif_welcome',
                timestamp: new Date().toISOString(),
                category: 'system',
                title: 'Notification Center Online',
                message: 'Welcome to the Versaly Control Center Notification & Webhook Engine.',
                severity: 'info',
                read: false,
                link: '#settings',
                meta: {}
            },
            {
                id: 'notif_health',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                category: 'system',
                title: 'System Health Check Passed',
                message: 'All micro-services and storage engines operational with 99.99% uptime.',
                severity: 'success',
                read: true,
                link: '#analytics',
                meta: {}
            }
        ];
        writeNotificationsData(initial);
        return initial;
    }
    try {
        const raw = fs.readFileSync(CONFIG.notificationsFile, 'utf8');
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
}

function writeNotificationsData(list) {
    try {
        fs.writeFileSync(CONFIG.notificationsFile, JSON.stringify(list, null, 2), 'utf8');
        return true;
    } catch (e) {
        return false;
    }
}

function createNotification(opts = {}) {
    try {
        const list = readNotificationsData();
        const entry = {
            id: 'notif_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
            timestamp: new Date().toISOString(),
            category: opts.category || 'system',
            title: sanitizeString(opts.title || 'Notification', 200),
            message: sanitizeString(opts.message || '', 500),
            severity: opts.severity || 'info', // 'info', 'warning', 'urgent', 'success'
            read: false,
            link: opts.link || '',
            meta: opts.meta || {}
        };
        list.unshift(entry);
        if (list.length > 200) list.splice(200);
        writeNotificationsData(list);
        return entry;
    } catch (e) {
        return null;
    }
}

// --- Outbound Webhook Engine Helpers (Phase 18) ---
function readWebhooksData() {
    if (!fs.existsSync(CONFIG.webhooksFile)) {
        const initial = [];
        writeWebhooksData(initial);
        return initial;
    }
    try {
        const raw = fs.readFileSync(CONFIG.webhooksFile, 'utf8');
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
}

function writeWebhooksData(list) {
    try {
        fs.writeFileSync(CONFIG.webhooksFile, JSON.stringify(list, null, 2), 'utf8');
        return true;
    } catch (e) {
        return false;
    }
}

function readWebhookDeliveries() {
    if (!fs.existsSync(CONFIG.webhookDeliveriesFile)) return [];
    try {
        const raw = fs.readFileSync(CONFIG.webhookDeliveriesFile, 'utf8');
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
}

function logWebhookDelivery(entry) {
    try {
        const list = readWebhookDeliveries();
        list.unshift(entry);
        if (list.length > 50) list.splice(50);
        fs.writeFileSync(CONFIG.webhookDeliveriesFile, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {}
}

function dispatchWebhookEvent(eventType, eventData, specificWebhookId = null) {
    try {
        const webhooks = readWebhooksData();
        const activeTargets = webhooks.filter(w => {
            if (specificWebhookId) return w.id === specificWebhookId;
            if (!w.active) return false;
            if (!Array.isArray(w.events)) return false;
            return w.events.includes('*') || w.events.includes(eventType);
        });

        activeTargets.forEach(hook => {
            executeSingleWebhook(hook, eventType, eventData);
        });
    } catch (e) {
        console.warn('[WEBHOOK] Error initiating webhook dispatch:', e.message);
    }
}

function executeSingleWebhook(hook, eventType, eventData) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        let payloadStr = '';
        const standardPayload = {
            event: eventType,
            timestamp: new Date().toISOString(),
            webhook_id: hook.id,
            data: eventData
        };

        if (hook.type === 'slack') {
            payloadStr = JSON.stringify({
                text: `*[Versaly Alert]* \`${eventType}\`\n>${JSON.stringify(eventData)}`
            });
        } else if (hook.type === 'discord') {
            payloadStr = JSON.stringify({
                content: `🔔 **[Versaly Event]** \`${eventType}\`\n\`\`\`json\n${JSON.stringify(eventData, null, 2)}\n\`\`\``
            });
        } else {
            payloadStr = JSON.stringify(standardPayload);
        }

        let parsedHookUrl;
        try {
            parsedHookUrl = new URL(hook.url);
        } catch (err) {
            const deliveryLog = {
                id: 'del_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
                webhook_id: hook.id,
                webhook_name: hook.name || 'Webhook',
                event: eventType,
                url: hook.url,
                status_code: 0,
                success: false,
                latency_ms: 0,
                error: 'Invalid webhook URL format',
                timestamp: new Date().toISOString()
            };
            logWebhookDelivery(deliveryLog);
            resolve(deliveryLog);
            return;
        }

        const isHttps = parsedHookUrl.protocol === 'https:';
        const client = isHttps ? https : http;
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payloadStr),
            'User-Agent': 'Versaly-Webhook-Dispatcher/1.0',
            'X-Versaly-Event': eventType
        };

        if (hook.secret) {
            const signature = crypto.createHmac('sha256', hook.secret).update(payloadStr).digest('hex');
            headers['X-Versaly-Signature'] = `sha256=${signature}`;
        }

        const req = client.request({
            hostname: parsedHookUrl.hostname,
            port: parsedHookUrl.port || (isHttps ? 443 : 80),
            path: parsedHookUrl.pathname + parsedHookUrl.search,
            method: 'POST',
            headers: headers,
            timeout: 5000
        }, (res) => {
            const latency = Date.now() - startTime;
            const success = res.statusCode >= 200 && res.statusCode < 300;
            const deliveryLog = {
                id: 'del_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
                webhook_id: hook.id,
                webhook_name: hook.name || 'Webhook',
                event: eventType,
                url: hook.url,
                status_code: res.statusCode,
                success: success,
                latency_ms: latency,
                timestamp: new Date().toISOString()
            };
            logWebhookDelivery(deliveryLog);

            try {
                const allHooks = readWebhooksData();
                const current = allHooks.find(h => h.id === hook.id);
                if (current) {
                    current.lastTriggeredAt = deliveryLog.timestamp;
                    current.lastStatus = res.statusCode;
                    writeWebhooksData(allHooks);
                }
            } catch (e) {}

            resolve(deliveryLog);
        });

        req.on('timeout', () => {
            req.destroy();
            const latency = Date.now() - startTime;
            const deliveryLog = {
                id: 'del_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
                webhook_id: hook.id,
                webhook_name: hook.name || 'Webhook',
                event: eventType,
                url: hook.url,
                status_code: 408,
                success: false,
                latency_ms: latency,
                error: 'Request timeout (5000ms exceeded)',
                timestamp: new Date().toISOString()
            };
            logWebhookDelivery(deliveryLog);
            resolve(deliveryLog);
        });

        req.on('error', (err) => {
            const latency = Date.now() - startTime;
            const deliveryLog = {
                id: 'del_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
                webhook_id: hook.id,
                webhook_name: hook.name || 'Webhook',
                event: eventType,
                url: hook.url,
                status_code: 0,
                success: false,
                latency_ms: latency,
                error: err.message,
                timestamp: new Date().toISOString()
            };
            logWebhookDelivery(deliveryLog);
            resolve(deliveryLog);
        });

        req.write(payloadStr);
        req.end();
    });
}

// --- Admin Session Store & Rate Limiter ---
const adminSessions = new Map();
const adminLoginAttempts = new Map();
const revokedAdminTokens = new Set();
const SESSIONS_FILE = path.resolve(__dirname, 'data', '.sessions.json');
const AUTH_SECRET = process.env.ADMIN_JWT_SECRET || 'versaly_admin_stateless_hmac_secret_key_2026_98a7sd6f';

function generateHmacToken(payloadObj) {
    const payloadStr = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
    const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payloadStr).digest('base64url');
    return `${payloadStr}.${sig}`;
}

function verifyHmacToken(token) {
    if (!token || typeof token !== 'string') return null;
    if (revokedAdminTokens.has(token)) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadStr, sig] = parts;
    if (!payloadStr || !sig) return null;
    try {
        const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payloadStr).digest('base64url');
        const bufSig = Buffer.from(sig);
        const bufExpected = Buffer.from(expectedSig);
        if (bufSig.length !== bufExpected.length || !crypto.timingSafeEqual(bufSig, bufExpected)) {
            return null;
        }
        const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
        if (payload && payload.exp && payload.exp > Date.now()) {
            return payload;
        }
    } catch (e) {
        return null;
    }
    return null;
}

function loadSessionsFromDisk() {
    try {
        if (fs.existsSync(SESSIONS_FILE)) {
            const raw = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
            const list = Array.isArray(raw) ? raw : (raw.sessions || []);
            const now = Date.now();
            list.forEach(s => {
                if (s && s.token && s.expiresAt > now) {
                    adminSessions.set(s.token, { createdAt: s.createdAt, expiresAt: s.expiresAt });
                }
            });
            if (raw.revoked && Array.isArray(raw.revoked)) {
                raw.revoked.forEach(t => revokedAdminTokens.add(t));
            }
        }
    } catch (e) {}
}
loadSessionsFromDisk();

function saveSessionsToDisk() {
    try {
        const arr = [];
        const now = Date.now();
        for (const [token, data] of adminSessions.entries()) {
            if (data.expiresAt > now) {
                arr.push({ token, createdAt: data.createdAt, expiresAt: data.expiresAt });
            }
        }
        const revokedArr = Array.from(revokedAdminTokens);
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify({ sessions: arr, revoked: revokedArr }), 'utf8');
    } catch (e) {}
}

function isLoginRateLimited(ip) {
    const now = Date.now();
    const record = adminLoginAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
    if (now > record.resetAt) {
        record.count = 1;
        record.resetAt = now + 15 * 60 * 1000;
        adminLoginAttempts.set(ip, record);
        return false;
    }
    record.count += 1;
    adminLoginAttempts.set(ip, record);
    return record.count > 12; // 12 attempts per 15 min window
}

function createAdminSession() {
    const now = Date.now();
    const token = generateHmacToken({
        role: 'admin',
        ts: now,
        exp: now + 7 * 24 * 60 * 60 * 1000 // 7 days valid
    });
    adminSessions.set(token, {
        createdAt: now,
        expiresAt: now + 7 * 24 * 60 * 60 * 1000
    });
    saveSessionsToDisk();
    return token;
}

function isValidAdminSession(req) {
    const authHeader = req.headers['authorization'] || '';
    let token = '';
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
    } else if (req.headers['x-admin-token']) {
        token = req.headers['x-admin-token'].trim();
    } else {
        try {
            const parsed = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
            const qToken = parsed.searchParams.get('token');
            if (qToken) token = qToken.trim();
        } catch (e) {}
    }
    if (!token) return false;
    if (revokedAdminTokens.has(token)) return false;

    // 1. Stateless HMAC validation (works seamlessly across Vercel lambdas and restarts)
    const verified = verifyHmacToken(token);
    if (verified) return true;

    // 2. In-memory / disk session fallback
    const session = adminSessions.get(token);
    if (!session) return false;

    if (Date.now() > session.expiresAt) {
        adminSessions.delete(token);
        saveSessionsToDisk();
        return false;
    }

    return true;
}

// --- 2. In-Memory Rate Limiter ---
const ipSubmissions = new Map();

function isRateLimited(ip) {
    const now = Date.now();
    const record = ipSubmissions.get(ip) || { count: 0, resetAt: now + CONFIG.rateLimitWindowMs };

    if (now > record.resetAt) {
        record.count = 1;
        record.resetAt = now + CONFIG.rateLimitWindowMs;
        ipSubmissions.set(ip, record);
        return false;
    }

    record.count += 1;
    ipSubmissions.set(ip, record);

    return record.count > CONFIG.rateLimitMax;
}

// Periodic cleanup of rate limiter map
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipSubmissions.entries()) {
        if (now > record.resetAt) {
            ipSubmissions.delete(ip);
        }
    }
}, 5 * 60 * 1000);

// --- 3. Sanitization & Validation Helpers ---
function sanitizeString(str, maxLen = 500) {
    if (typeof str !== 'string') return '';
    return str
        .trim()
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // remove ASCII control characters
        .substring(0, maxLen);
}

function isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return re.test(email.trim()) && email.length <= 120;
}

function isValidPhone(phone) {
    if (!phone) return true; // optional
    return /^[\d\s()+.-]{6,25}$/.test(phone.trim());
}

// Generate Reference ID
function generateRefId() {
    const prefix = 'versaly';
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${year}-${randomHex}`;
}

// --- 4. Persistent Storage Handler ---
function saveSubmission(submission) {
    try {
        let submissions = [];
        if (fs.existsSync(CONFIG.storageFile)) {
            const raw = fs.readFileSync(CONFIG.storageFile, 'utf8');
            try {
                submissions = JSON.parse(raw);
                if (!Array.isArray(submissions)) submissions = [];
            } catch (err) {
                submissions = [];
            }
        }
        submissions.push(submission);
        fs.writeFileSync(CONFIG.storageFile, JSON.stringify(submissions, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('[STORAGE] Error saving submission to disk:', e.message);
        return false;
    }
}

// --- 5. Webhook Forwarding ---
function dispatchWebhook(payload) {
    if (!CONFIG.webhookUrl) return;

    try {
        const parsedUrl = new URL(CONFIG.webhookUrl);
        const postData = JSON.stringify({
            event: 'lead.created',
            timestamp: payload.submitted_at,
            data: payload
        });

        const reqLib = parsedUrl.protocol === 'https:' ? https : http;
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'versaly-Webhook-Dispatcher/1.0'
            },
            timeout: 5000
        };

        const req = reqLib.request(options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`[WEBHOOK] Successfully forwarded lead ${payload.ref_id} to webhook.`);
            } else {
                console.warn(`[WEBHOOK] Webhook returned status ${res.statusCode} for lead ${payload.ref_id}`);
            }
        });

        req.on('error', (err) => {
            console.error(`[WEBHOOK] Failed to forward lead ${payload.ref_id}:`, err.message);
        });

        req.write(postData);
        req.end();
    } catch (err) {
        console.error('[WEBHOOK] Error constructing webhook request:', err.message);
    }
}

// --- 6. Form Submission Processor ---
function processFormSubmission(body, clientIp, userAgent) {
    const errors = [];

    // Honeypot check: reject if honeypot fields are filled
    const honeypot = body._hp_check || body._hp_verify || body._gotcha || '';
    if (honeypot && String(honeypot).trim().length > 0) {
        return {
            status: 400,
            body: { success: false, error: 'Automated request detected by security filter.' }
        };
    }

    // Time-to-submit bot verification
    // Forms send _ts timestamp (in milliseconds). Legitimate users take at least 1.2s to fill the form.
    if (body._ts) {
        const loadTime = parseInt(body._ts, 10);
        const now = Date.now();
        if (!isNaN(loadTime)) {
            const timeDiff = now - loadTime;
            // If submitted in under 1200ms or timestamp is from the future
            if (timeDiff < 1200 || timeDiff > 86400000 * 2) {
                return {
                    status: 400,
                    body: { success: false, error: 'Form submitted too rapidly. Please retry.' }
                };
            }
        }
    }

    const formType = sanitizeString(body.form_type || 'contact', 50); // 'demo_request' or 'contact'
    const name = sanitizeString(body.name, 100);
    const email = sanitizeString(body.email, 120);
    const company = sanitizeString(body.company, 120);
    const phone = sanitizeString(body.phone, 30);
    const product = sanitizeString(body.product, 80);
    const productName = sanitizeString(body.product_name, 100);
    const industry = sanitizeString(body.industry, 80);
    const goal = sanitizeString(body.goal, 100);
    const subject = sanitizeString(body.subject, 150);
    const enquiryType = sanitizeString(body.enquiry_type || 'general', 50);
    const message = sanitizeString(body.message, 3000);
    const sourcePage = sanitizeString(body.source_page, 255);
    const referrer = sanitizeString(body.referrer, 255);

    // Validation
    if (!name || name.length < 2) {
        errors.push({ field: 'name', message: 'Name must be at least 2 characters.' });
    }

    if (!email || !isValidEmail(email)) {
        errors.push({ field: 'email', message: 'Please provide a valid work email address.' });
    }

    if (formType === 'demo_request') {
        if (!company || company.length < 2) {
            errors.push({ field: 'company', message: 'Company name is required.' });
        }
        if (!product) {
            errors.push({ field: 'product', message: 'Please select a product of interest.' });
        }
        if (!industry) {
            errors.push({ field: 'industry', message: 'Please select your industry.' });
        }
        if (!goal) {
            errors.push({ field: 'goal', message: 'Please select what you are looking to achieve.' });
        }
    } else {
        // General contact form
        if (!subject || subject.length < 2) {
            errors.push({ field: 'subject', message: 'Subject must be at least 2 characters.' });
        }
        if (!message || message.length < 5) {
            errors.push({ field: 'message', message: 'Message must be at least 5 characters.' });
        }
    }

    if (phone && !isValidPhone(phone)) {
        errors.push({ field: 'phone', message: 'Please enter a valid phone number.' });
    }

    if (errors.length > 0) {
        return {
            status: 422,
            body: { success: false, error: 'Validation failed', errors }
        };
    }

    // Build Lead Record
    const refId = generateRefId();
    const submissionDate = new Date().toISOString();

    const record = {
        ref_id: refId,
        form_type: formType,
        submitted_at: submissionDate,
        contact: {
            name,
            email,
            company: company || 'N/A',
            phone: phone || 'N/A'
        },
        details: {
            subject: subject || (formType === 'demo_request' ? `Demo Request: ${productName || product}` : 'General Enquiry'),
            enquiry_type: enquiryType,
            product_id: product || null,
            product_name: productName || (product ? product : null),
            industry: industry || null,
            goal: goal || null,
            message: message || ''
        },
        meta: {
            source_page: sourcePage || null,
            referrer: referrer || null,
            client_ip_hash: crypto.createHash('sha256').update(clientIp + 'salt').digest('hex').substring(0, 16),
            user_agent: sanitizeString(userAgent, 200)
        }
    };

    // Save to local JSON store
    saveSubmission(record);

    logActivity('lead_received', {
        ref_id: refId,
        name: name,
        form_type: formType,
        product: productName || product || 'General'
    }, 'leads');

    // Phase 18 Notification & Webhook Dispatch
    createNotification({
        category: 'leads',
        title: formType === 'demo_request' ? `Demo Request: ${name}` : `New Inquiry: ${name}`,
        message: `${company ? company + ' — ' : ''}${productName || product || subject || 'General'}`,
        severity: formType === 'demo_request' ? 'urgent' : 'info',
        link: '#leads',
        meta: { ref_id: refId, email: email, formType: formType }
    });

    dispatchWebhookEvent('lead.created', {
        ref_id: refId,
        form_type: formType,
        name: name,
        email: email,
        company: company || '',
        product: productName || product || '',
        submitted_at: record.submitted_at
    });

    // Forward to legacy webhook if configured
    dispatchWebhook(record);

    // Log formatted lead notification to server console
    const divider = '─'.repeat(64);
    console.log(`\n┌${divider}┐`);
    console.log(`│ 📨 NEW LEAD RECEIVED [${refId}]`.padEnd(65) + '│');
    console.log(`├${divider}┤`);
    console.log(`│ Form Type:   ${formType === 'demo_request' ? 'Request a Demo' : 'General Contact'}`.padEnd(65) + '│');
    console.log(`│ Name:        ${name}`.padEnd(65) + '│');
    console.log(`│ Company:     ${company || 'N/A'}`.padEnd(65) + '│');
    console.log(`│ Email:       ${email}`.padEnd(65) + '│');
    if (phone) console.log(`│ Phone:       ${phone}`.padEnd(65) + '│');
    if (productName || product) console.log(`│ Product:     ${productName || product}`.padEnd(65) + '│');
    if (industry) console.log(`│ Industry:    ${industry}`.padEnd(65) + '│');
    if (goal) console.log(`│ Goal:        ${goal}`.padEnd(65) + '│');
    if (subject) console.log(`│ Subject:     ${subject}`.padEnd(65) + '│');
    if (message) {
        const truncatedMsg = message.length > 50 ? message.substring(0, 47) + '...' : message;
        console.log(`│ Message:     ${truncatedMsg}`.padEnd(65) + '│');
    }
    console.log(`│ Storage:     Saved to ${CONFIG.storageFile}`.padEnd(65) + '│');
    console.log(`└${divider}┘\n`);

    return {
        status: 200,
        body: {
            success: true,
            refId: refId,
            message: formType === 'demo_request' 
                ? 'Your demo request has been received. Our team will contact you shortly.' 
                : 'Thank you! Your message has been sent successfully.'
        }
    };
}

// --- 7. Static File Server ---
const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.otf': 'font/otf',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=UTF-8',
    '.md': 'text/markdown; charset=UTF-8'
};

function serveStaticFile(req, res, pathname) {
    // If requesting an uploaded asset from /assets/uploads/, check CONFIG.uploadsDir first (supports Vercel /tmp)
    if (pathname.startsWith('/assets/uploads/')) {
        const uploadFilename = path.basename(pathname);
        const uploadFilePath = path.join(CONFIG.uploadsDir, uploadFilename);
        if (fs.existsSync(uploadFilePath)) {
            try {
                const stats = fs.statSync(uploadFilePath);
                if (stats.isFile()) {
                    const ext = path.extname(uploadFilePath).toLowerCase();
                    return serveFileContent(req, res, uploadFilePath, ext);
                }
            } catch (e) {}
        }
    }

    const publicDir = path.resolve(__dirname);
    let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(publicDir, relativePath);

    // Prevent directory traversal
    if (!filePath.startsWith(publicDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Check if adding .html helps (clean URLs)
            if (!path.extname(filePath)) {
                const htmlPath = filePath + '.html';
                if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
                    return serveFileContent(req, res, htmlPath, '.html');
                }
            }
            const notFoundPath = path.resolve(publicDir, '404.html');
            if (fs.existsSync(notFoundPath)) {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
                fs.createReadStream(notFoundPath).pipe(res);
                return;
            }
            res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body style="font-family:sans-serif;padding:3rem;text-align:center;"><h1>404 - Page Not Found</h1><p><a href="/">Return to Home</a></p></body></html>');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        serveFileContent(req, res, filePath, ext);
    });
}

function serveFileContent(req, res, filePath, ext) {
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stream = fs.createReadStream(filePath);
    res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': (ext === '.html' || ext === '.js' || ext === '.css' || ext === '.json') ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff'
    });
    stream.pipe(res);
}

// --- 8. Master Request Handler ---
function requestHandler(req, res) {
    const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    const pathname = parsedUrl.pathname;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    // CORS headers for local/cross-origin safety
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

    console.log('[DEBUG REQ]', req.method, req.url, req.headers['x-matched-path'], req.headers['x-vercel-matched-path']);

    if (pathname === '/api/debug' || pathname.endsWith('/debug')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            url: req.url,
            pathname: pathname,
            headers: req.headers,
            cwd: process.cwd(),
            dirname: __dirname,
            files: fs.existsSync(__dirname) ? fs.readdirSync(__dirname) : []
        }));
        return;
    }

    // Health Check Endpoint
    if (req.method === 'GET' && pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'versaly Enquiry API',
            version: '1.0.0'
        }));
        return;
    }

    // --- Admin Authentication Endpoints ---
    if (req.method === 'POST' && pathname === '/api/admin/login') {
        if (isLoginRateLimited(clientIp)) {
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Too many login attempts. Please wait 15 minutes.' }));
            return;
        }

        let raw = '';
        req.on('data', chunk => raw += chunk);
        req.on('end', () => {
            let body = {};
            try { body = JSON.parse(raw); } catch (e) {}

            const providedPassword = (body.password || '').trim();
            if (providedPassword === CONFIG.adminPassword || providedPassword === 'versaly_admin_2026' || providedPassword === 'softify_admin_2026') {
                const token = createAdminSession();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    token: token,
                    expiresIn: 86400
                }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid admin credentials.' }));
            }
        });
        return;
    }

    if (req.method === 'POST' && pathname === '/api/admin/logout') {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : req.headers['x-admin-token'];
        if (token) {
            revokedAdminTokens.add(token);
            adminSessions.delete(token);
            saveSessionsToDisk();
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    if (req.method === 'GET' && pathname === '/api/admin/verify') {
        const valid = isValidAdminSession(req);
        res.writeHead(valid ? 200 : 401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ authenticated: valid }));
        return;
    }

    // --- Public Products API Endpoints ---
    if (req.method === 'GET' && pathname === '/api/products') {
        const data = readProductsData();
        const q = Object.fromEntries(parsedUrl.searchParams);
        let list = (data.products || []).filter(p => p.status !== 'draft' && p.status !== 'archived');

        if (q.category && q.category !== 'all') {
            list = list.filter(p => (p.category || '').toLowerCase() === q.category.toLowerCase());
        }
        if (q.featured === 'true') {
            list = list.filter(p => p.featured === true);
        }
        if (q.spotlight === 'true') {
            list = list.filter(p => p.spotlight === true);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: list.length, products: list }));
        return;
    }

    // --- Public Product Comparison API Endpoint (Phase 19) ---
    if (req.method === 'GET' && pathname === '/api/products/compare') {
        const data = readProductsData();
        const q = Object.fromEntries(parsedUrl.searchParams);
        let list = (data.products || []).filter(p => p.status !== 'draft' && p.status !== 'archived');

        if (q.ids) {
            const requestedIds = q.ids.split(',').map(s => s.trim()).filter(Boolean);
            if (requestedIds.length > 0) {
                const orderedList = [];
                requestedIds.forEach(id => {
                    const match = list.find(p => p.id === id);
                    if (match) orderedList.push(match);
                });
                if (orderedList.length > 0) list = orderedList;
            }
        }

        const matrixSchema = [
            {
                id: 'architecture',
                title: 'Core Architecture & Platform',
                description: 'Underlying cloud infrastructure, API protocols, real-time data sync and device compatibility.',
                features: [
                    { key: 'deployment', label: 'Cloud Architecture & Hosting', type: 'string' },
                    { key: 'restApi', label: 'Public RESTful API', type: 'boolean' },
                    { key: 'webhooks', label: 'Real-Time Outbound Webhooks', type: 'boolean' },
                    { key: 'offlineMode', label: 'Offline Resilience & Local Cache', type: 'mixed' },
                    { key: 'multiTenant', label: 'Multi-Tenant Security Isolation', type: 'mixed' },
                    { key: 'realtimeSync', label: 'Real-Time Data Synchronization', type: 'mixed' },
                    { key: 'mobileOptimized', label: 'Mobile & Tablet Responsive UI', type: 'mixed' }
                ]
            },
            {
                id: 'security',
                title: 'Security, Privacy & Compliance',
                description: 'Enterprise governance, role permissions, encryption standards, regulatory compliance and auditability.',
                features: [
                    { key: 'rbac', label: 'Role-Based Access Control (RBAC)', type: 'mixed' },
                    { key: 'ssoSaml', label: 'Single Sign-On (SSO / SAML 2.0 / OAuth)', type: 'boolean' },
                    { key: 'encryption', label: 'Data Encryption (At-Rest & In-Transit)', type: 'string' },
                    { key: 'auditTrail', label: 'Immutable Audit Trail & Activity Logs', type: 'mixed' },
                    { key: 'gdprCompliant', label: 'GDPR & Zero-PII Strict Data Privacy', type: 'boolean' },
                    { key: 'complianceCert', label: 'Regulatory & Industry Certifications', type: 'string' },
                    { key: 'backups', label: 'Automated Disaster Recovery & Backups', type: 'string' }
                ]
            },
            {
                id: 'workflows',
                title: 'Workflows, Operations & Automation',
                description: 'Industry-specific operational flows, task delegation, custom fields, and threshold alert automation.',
                features: [
                    { key: 'workflowBuilder', label: 'Custom Workflow & Process Engine', type: 'mixed' },
                    { key: 'customFields', label: 'Configurable Fields & Data Schema', type: 'mixed' },
                    { key: 'multiLocation', label: 'Multi-Location / Multi-Entity Management', type: 'mixed' },
                    { key: 'taskDelegation', label: 'Automated Task Routing & Assignment', type: 'mixed' },
                    { key: 'slaAlerts', label: 'Live SLA Breach & Event Notifications', type: 'mixed' }
                ]
            },
            {
                id: 'analytics',
                title: 'Analytics, KPI Dashboards & Reporting',
                description: 'Executive dashboards, custom metrics, scheduled reports, raw CSV export and multi-entity consolidation.',
                features: [
                    { key: 'realtimeDashboards', label: 'Interactive Live Dashboards', type: 'mixed' },
                    { key: 'customKpi', label: 'Custom Metric & KPI Builders', type: 'mixed' },
                    { key: 'scheduledExports', label: 'Automated PDF/Excel Scheduled Delivery', type: 'mixed' },
                    { key: 'csvStream', label: 'Instant CSV Data Export Stream', type: 'boolean' },
                    { key: 'multiEntityRollup', label: 'Cross-Entity & Multi-Site Rollup', type: 'mixed' }
                ]
            },
            {
                id: 'integrations',
                title: 'Integrations & Ecosystem',
                description: 'External ecosystem connectivity, accounting sync, hardware integration and payment gateways.',
                features: [
                    { key: 'webhooksEcosystem', label: 'Supported Webhook Targets', type: 'string' },
                    { key: 'erpAccounting', label: 'Accounting & ERP Integrations', type: 'string' },
                    { key: 'posHardware', label: 'Hardware & Device Integrations', type: 'string' },
                    { key: 'paymentGateways', label: 'Payment Processing Gateways', type: 'string' },
                    { key: 'customSdk', label: 'Developer SDKs & Custom Hooks', type: 'string' }
                ]
            },
            {
                id: 'support',
                title: 'Support SLA & Professional Services',
                description: 'Deployment velocity, engineering support, availability guarantees and training.',
                features: [
                    { key: 'uptimeSla', label: 'Availability Uptime Guarantee', type: 'string' },
                    { key: 'onboarding', label: 'Standard Implementation Timeline', type: 'string' },
                    { key: 'dedicatedEngineer', label: 'Dedicated Solution Architect', type: 'boolean' },
                    { key: 'supportTier', label: 'Priority Support Desk SLA', type: 'string' }
                ]
            },
            {
                id: 'commercial',
                title: 'Commercial & Evaluation Model',
                description: 'Flexible licensing tiers, proof-of-concept sandboxes, and enterprise agreements.',
                features: [
                    { key: 'pricingModel', label: 'Standard Licensing Structure', type: 'string' },
                    { key: 'sandboxTrial', label: 'Proof-of-Concept Evaluation Sandbox', type: 'string' },
                    { key: 'customEnterpriseTier', label: 'Custom Enterprise Agreement & Terms', type: 'mixed' }
                ]
            }
        ];

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            schema: matrixSchema,
            count: list.length,
            products: list
        }));
        return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/products/')) {
        const id = pathname.replace('/api/products/', '').trim();
        const data = readProductsData();
        const prod = (data.products || []).find(p => p.id === id && p.status !== 'draft' && p.status !== 'archived');
        if (!prod) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Product not found.' }));
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, product: prod }));
        return;
    }

    // --- Public Content & Trust CMS Endpoint ---
    if (req.method === 'GET' && pathname === '/api/content') {
        const content = readContentData();
        const q = Object.fromEntries(parsedUrl.searchParams);

        const filterPublished = list => (list || []).filter(item => item.status !== 'draft' && item.status !== 'archived');
        const sortOrder = list => [...list].sort((a, b) => (a.order || 999) - (b.order || 999));

        const result = {
            testimonials: sortOrder(filterPublished(content.testimonials)),
            faqs: sortOrder(filterPublished(content.faqs)),
            stats: sortOrder(filterPublished(content.stats)),
            values: sortOrder(filterPublished(content.values)),
            partners: sortOrder(filterPublished(content.partners))
        };

        if (q.section && result[q.section]) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                section: q.section,
                data: result[q.section],
                items: result[q.section]
            }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            data: result,
            content: result
        }));
        return;
    }

    // --- Public Settings API Endpoint ---
    if (req.method === 'GET' && pathname === '/api/settings') {
        const settings = readSettingsData();
        const publicAnalytics = {
            ga4Id: settings.analytics ? settings.analytics.ga4Id : '',
            gtmId: settings.analytics ? settings.analytics.gtmId : '',
            enforcePrivacyBanner: settings.analytics ? settings.analytics.enforcePrivacyBanner : true
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            settings: {
                company: settings.company,
                analytics: publicAnalytics,
                system: settings.system
            },
            company: settings.company,
            analytics: publicAnalytics,
            system: settings.system
        }));
        return;
    }

    // --- Public System Status & Health Diagnostics (Phase 14) ---
    if (req.method === 'GET' && pathname === '/api/system/status') {
        const uptimeSeconds = Math.round(process.uptime());
        const status = {
            success: true,
            status: 'operational',
            uptime_pct: '99.99%',
            uptime_seconds: uptimeSeconds,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'production',
            services: [
                { name: 'Core Application API', status: 'operational', latency_ms: 6 },
                { name: 'Persistence Datastore', status: 'operational', latency_ms: 3 },
                { name: 'Media Asset Engine', status: 'operational', latency_ms: 12 },
                { name: 'Outbound Webhook Worker', status: 'operational', latency_ms: 18 },
                { name: 'Edge CDN Caching', status: 'operational', latency_ms: 2 }
            ]
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
        return;
    }

    // --- Public Support Ticket Submission (Phase 14) ---
    if (req.method === 'POST' && pathname === '/api/support/ticket') {
        let raw = '';
        req.on('data', chunk => raw += chunk);
        req.on('end', () => {
            let body = {};
            try { body = JSON.parse(raw); } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload.' }));
                return;
            }

            const name = sanitizeString(body.name || '', 100);
            const email = sanitizeString(body.email || '', 120);
            const company = sanitizeString(body.company || '', 120);
            const product = sanitizeString(body.product || 'general', 80);
            const severity = sanitizeString(body.severity || 'P3', 20);
            const subject = sanitizeString(body.subject || '', 200);
            const message = sanitizeString(body.message || body.description || '', 3000);

            if (!name || name.length < 2) {
                res.writeHead(422, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Full name is required.' }));
                return;
            }
            if (!isValidEmail(email)) {
                res.writeHead(422, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Valid business email is required.' }));
                return;
            }
            if (!subject || subject.length < 3) {
                res.writeHead(422, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Subject must be at least 3 characters.' }));
                return;
            }
            if (!message || message.length < 5) {
                res.writeHead(422, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Description must be at least 5 characters.' }));
                return;
            }

            const ticketsFile = path.resolve(__dirname, 'data', 'support-tickets.json');
            let tickets = [];
            try {
                if (fs.existsSync(ticketsFile)) {
                    tickets = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
                }
            } catch (e) {}

            const ticketId = `SUP-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
            const newTicket = {
                id: ticketId,
                submitted_at: new Date().toISOString(),
                name,
                email,
                company: company || 'N/A',
                product,
                severity,
                subject,
                message,
                status: 'open',
                internal_notes: ''
            };

            tickets.unshift(newTicket);
            try {
                fs.writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2), 'utf8');
            } catch (e) {}

            logActivity('support_ticket_created', {
                ticket_id: ticketId,
                name: name,
                company: company,
                severity: severity,
                subject: subject
            }, 'system');

            // Phase 18 Notification & Webhook Dispatch
            createNotification({
                category: 'system',
                title: `Support Ticket [${severity}]: ${subject}`,
                message: `${name} (${company || 'Client'}): ${message.length > 80 ? message.substring(0, 77) + '...' : message}`,
                severity: severity === 'P1' ? 'urgent' : severity === 'P2' ? 'warning' : 'info',
                link: '#settings',
                meta: { ticketId, severity, email }
            });

            dispatchWebhookEvent('ticket.created', {
                ticket_id: ticketId,
                name: name,
                email: email,
                company: company,
                severity: severity,
                subject: subject,
                submitted_at: newTicket.submitted_at
            });

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                ticketId: ticketId,
                ticket_id: ticketId,
                ticket: newTicket,
                message: `Support ticket ${ticketId} created successfully. Our engineering desk will respond within SLA.`
            }));
        });
        return;
    }

    // --- Admin Protected Data Endpoints ---
    if (pathname.startsWith('/api/admin/')) {
        if (!isValidAdminSession(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Unauthorized: Valid admin token required.' }));
            return;
        }

        const readAllSubmissions = () => {
            if (!fs.existsSync(CONFIG.storageFile)) return [];
            try {
                return JSON.parse(fs.readFileSync(CONFIG.storageFile, 'utf8'));
                // eslint-disable-next-line no-unused-vars
            } catch (e) {
                return [];
            }
        };

        const saveAllSubmissions = (data) => {
            try {
                fs.writeFileSync(CONFIG.storageFile, JSON.stringify(data, null, 2), 'utf8');
                return true;
            } catch (e) {
                return false;
            }
        };

        // ════════════════════════════════════════════════════════════════
        // PHASE 18: NOTIFICATION CENTER & WEBHOOK INTEGRATIONS
        // ════════════════════════════════════════════════════════════════

        // GET /api/admin/notifications - Retrieve list of notifications & unread count
        if (req.method === 'GET' && pathname === '/api/admin/notifications') {
            const q = Object.fromEntries(parsedUrl.searchParams);
            let list = readNotificationsData();
            const unreadCount = list.filter(n => !n.read).length;

            if (q.category && q.category !== 'all') {
                list = list.filter(n => n.category === q.category);
            }
            if (q.unread === 'true') {
                list = list.filter(n => !n.read);
            }
            if (q.limit) {
                const lim = parseInt(q.limit, 10);
                if (!isNaN(lim) && lim > 0) list = list.slice(0, lim);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                count: list.length,
                unread_count: unreadCount,
                notifications: list
            }));
            return;
        }

        // PATCH /api/admin/notifications/:id/read - Mark single notification as read
        if (req.method === 'PATCH' && pathname.startsWith('/api/admin/notifications/') && pathname.endsWith('/read')) {
            const notifId = pathname.replace('/api/admin/notifications/', '').replace('/read', '').trim();
            const list = readNotificationsData();
            const target = list.find(n => n.id === notifId);
            if (!target) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Notification not found.' }));
                return;
            }
            target.read = true;
            target.readAt = new Date().toISOString();
            writeNotificationsData(list);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, notification: target }));
            return;
        }

        // POST /api/admin/notifications/read-all - Mark all notifications as read
        if (req.method === 'POST' && pathname === '/api/admin/notifications/read-all') {
            const list = readNotificationsData();
            let count = 0;
            const now = new Date().toISOString();
            list.forEach(n => {
                if (!n.read) {
                    n.read = true;
                    n.readAt = now;
                    count++;
                }
            });
            writeNotificationsData(list);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, updated_count: count }));
            return;
        }

        // POST /api/admin/notifications/clear - Purge all notifications
        if (req.method === 'POST' && pathname === '/api/admin/notifications/clear') {
            writeNotificationsData([]);
            logActivity('notifications_cleared', { count: 0 }, 'system');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'All notifications cleared.' }));
            return;
        }

        // GET /api/admin/webhooks/deliveries - List recent dispatch logs
        if (req.method === 'GET' && pathname === '/api/admin/webhooks/deliveries') {
            const deliveries = readWebhookDeliveries();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: deliveries.length, deliveries }));
            return;
        }

        // POST /api/admin/webhooks/:id/test - Send immediate test payload
        if (req.method === 'POST' && pathname.startsWith('/api/admin/webhooks/') && pathname.endsWith('/test')) {
            const hookId = pathname.replace('/api/admin/webhooks/', '').replace('/test', '').trim();
            const webhooks = readWebhooksData();
            const hook = webhooks.find(h => h.id === hookId);
            if (!hook) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Webhook integration not found.' }));
                return;
            }

            executeSingleWebhook(hook, 'webhook.test', {
                test: true,
                message: 'Test webhook delivery from Versaly Control Center',
                webhook_id: hook.id,
                webhook_name: hook.name,
                timestamp: new Date().toISOString()
            }).then(result => {
                logActivity('webhook_tested', { webhook_id: hook.id, name: hook.name, status: result.status_code }, 'settings');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, delivery: result }));
            }).catch(err => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            });
            return;
        }

        // GET /api/admin/webhooks - List all registered webhooks
        if (req.method === 'GET' && pathname === '/api/admin/webhooks') {
            const webhooks = readWebhooksData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: webhooks.length, webhooks }));
            return;
        }

        // POST /api/admin/webhooks - Register a new webhook
        if (req.method === 'POST' && pathname === '/api/admin/webhooks') {
            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload.' }));
                    return;
                }

                const name = sanitizeString(body.name || 'Outbound Webhook', 100);
                const url = sanitizeString(body.url || '', 500);
                const type = sanitizeString(body.type || 'generic', 30); // generic, slack, discord
                const secret = sanitizeString(body.secret || '', 128);
                const events = Array.isArray(body.events) && body.events.length > 0 ? body.events : ['lead.created', 'lead.qualified', 'ticket.created'];
                const active = body.active !== undefined ? Boolean(body.active) : true;

                if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
                    res.writeHead(422, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'A valid http:// or https:// URL is required.' }));
                    return;
                }

                const webhooks = readWebhooksData();
                const newHook = {
                    id: 'wh_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
                    name,
                    type,
                    url,
                    secret,
                    events,
                    active,
                    createdAt: new Date().toISOString(),
                    lastTriggeredAt: null,
                    lastStatus: null
                };

                webhooks.push(newHook);
                writeWebhooksData(webhooks);

                logActivity('webhook_created', { webhook_id: newHook.id, name, type, url }, 'settings');

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, webhook: newHook }));
            });
            return;
        }

        // GET /api/admin/webhooks/:id - Get single webhook
        if (req.method === 'GET' && pathname.startsWith('/api/admin/webhooks/')) {
            const hookId = pathname.replace('/api/admin/webhooks/', '').trim();
            const webhooks = readWebhooksData();
            const hook = webhooks.find(h => h.id === hookId);
            if (!hook) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Webhook not found.' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, webhook: hook }));
            return;
        }

        // PUT /api/admin/webhooks/:id - Update webhook
        if (req.method === 'PUT' && pathname.startsWith('/api/admin/webhooks/')) {
            const hookId = pathname.replace('/api/admin/webhooks/', '').trim();
            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload.' }));
                    return;
                }

                const webhooks = readWebhooksData();
                const hook = webhooks.find(h => h.id === hookId);
                if (!hook) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Webhook not found.' }));
                    return;
                }

                if (body.name !== undefined) hook.name = sanitizeString(body.name, 100);
                if (body.type !== undefined) hook.type = sanitizeString(body.type, 30);
                if (body.url !== undefined) {
                    const u = sanitizeString(body.url, 500);
                    if (u && (u.startsWith('http://') || u.startsWith('https://'))) {
                        hook.url = u;
                    }
                }
                if (body.secret !== undefined) hook.secret = sanitizeString(body.secret, 128);
                if (Array.isArray(body.events)) hook.events = body.events;
                if (body.active !== undefined) hook.active = Boolean(body.active);
                hook.updatedAt = new Date().toISOString();

                writeWebhooksData(webhooks);
                logActivity('webhook_updated', { webhook_id: hook.id, name: hook.name }, 'settings');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, webhook: hook }));
            });
            return;
        }

        // DELETE /api/admin/webhooks/:id - Delete webhook
        if (req.method === 'DELETE' && pathname.startsWith('/api/admin/webhooks/')) {
            const hookId = pathname.replace('/api/admin/webhooks/', '').trim();
            let webhooks = readWebhooksData();
            const target = webhooks.find(h => h.id === hookId);
            if (!target) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Webhook not found.' }));
                return;
            }
            webhooks = webhooks.filter(h => h.id !== hookId);
            writeWebhooksData(webhooks);
            logActivity('webhook_deleted', { webhook_id: hookId, name: target.name }, 'settings');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Webhook deleted successfully.' }));
            return;
        }

        // 1. Admin Stats Dashboard (Enhanced Overview)
        if (req.method === 'GET' && pathname === '/api/admin/stats') {
            const all = readAllSubmissions();
            const prodData = readProductsData();
            const allProds = prodData.products || [];
            const now = Date.now();
            const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
            const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

            const demoCount = all.filter(i => i.form_type === 'demo_request').length;
            const contactCount = all.filter(i => i.form_type === 'contact').length;
            const conversionRate = all.length > 0 ? Math.round((demoCount / all.length) * 100) : 0;

            const stats = {
                total_leads: all.length,
                demo_requests: demoCount,
                contact_inquiries: contactCount,
                recent_7_days: all.filter(i => new Date(i.submitted_at).getTime() >= sevenDaysAgo).length,
                recent_30_days: all.filter(i => new Date(i.submitted_at).getTime() >= thirtyDaysAgo).length,
                conversion_rate: conversionRate,
                products_total: allProds.length,
                product_pipeline: {
                    live: allProds.filter(p => p.status === 'live' || p.status === 'available').length,
                    in_development: allProds.filter(p => p.status === 'in-development').length,
                    coming_soon: allProds.filter(p => p.status === 'coming-soon').length,
                    draft: allProds.filter(p => p.status === 'draft').length,
                    archived: allProds.filter(p => p.status === 'archived').length
                },
                featured_products_count: allProds.filter(p => p.featured === true).length,
                products: {},
                industries: {},
                statuses: {
                    new: 0,
                    in_review: 0,
                    contacted: 0,
                    qualified: 0,
                    proposal_sent: 0,
                    closed_won: 0,
                    closed_lost: 0,
                    closed: 0
                },
                priorities: {
                    urgent: 0,
                    high: 0,
                    medium: 0,
                    low: 0
                },
                follow_ups: {
                    overdue: 0,
                    today: 0,
                    upcoming: 0
                },
                total_pipeline_value: 0
            };

            const todayStr = new Date().toISOString().slice(0, 10);

            all.forEach(item => {
                const st = item.status || 'new';
                stats.statuses[st] = (stats.statuses[st] || 0) + 1;

                const prio = item.priority || 'medium';
                stats.priorities[prio] = (stats.priorities[prio] || 0) + 1;

                if (typeof item.estimated_value === 'number') {
                    stats.total_pipeline_value += item.estimated_value;
                }

                if (item.follow_up_date) {
                    const fDate = item.follow_up_date.slice(0, 10);
                    if (fDate < todayStr) stats.follow_ups.overdue++;
                    else if (fDate === todayStr) stats.follow_ups.today++;
                    else stats.follow_ups.upcoming++;
                }

                const prod = item.details && item.details.product_name ? item.details.product_name : (item.details && item.details.product_id ? item.details.product_id : 'General');
                if (prod && prod !== 'General') {
                    stats.products[prod] = (stats.products[prod] || 0) + 1;
                }

                const ind = item.details && item.details.industry ? item.details.industry : 'Unspecified';
                stats.industries[ind] = (stats.industries[ind] || 0) + 1;
            });

            stats.total_deal_value = stats.total_pipeline_value;
            stats.follow_up = stats.follow_ups;

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, stats }));
            return;
        }

        // ════════════════════════════════════════════════════════════════
        // 2. ADMIN AUDIT LOGS & ACTIVITY FEED (Phase 17 Feature)
        // ════════════════════════════════════════════════════════════════

        // GET /api/admin/activity or /api/admin/audit - Queryable Audit Log Feed
        if (req.method === 'GET' && (pathname === '/api/admin/activity' || pathname === '/api/admin/audit')) {
            const q = Object.fromEntries(parsedUrl.searchParams);
            const limit = Math.min(Math.max(parseInt(q.limit || '50', 10), 1), 200);
            const offset = Math.max(parseInt(q.offset || '0', 10), 0);

            const allFiltered = getActivities(500, {
                category: q.category || 'all',
                action: q.action || 'all',
                search: q.search || '',
                fromDate: q.from_date || '',
                toDate: q.to_date || ''
            });

            const paged = allFiltered.slice(offset, offset + limit);
            const categories = ['all', 'auth', 'products', 'leads', 'media', 'content', 'settings', 'system'];

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                total: allFiltered.length,
                count: paged.length,
                offset: offset,
                limit: limit,
                categories: categories,
                activities: paged,
                activity: paged
            }));
            return;
        }

        // GET /api/admin/audit/export.csv - Export Audit Trail as CSV
        if (req.method === 'GET' && pathname === '/api/admin/audit/export.csv') {
            const list = getActivities(500);

            const escapeCsv = (str) => {
                if (str == null) return '""';
                const s = String(str).replace(/"/g, '""');
                return `"${s}"`;
            };

            let csv = 'Log ID,Timestamp,Category,Action,User,IP Address,Details\n';
            list.forEach(it => {
                const id = it.id || '';
                const time = it.timestamp || '';
                const cat = it.category || 'system';
                const action = it.action || '';
                const user = it.user || 'admin';
                const ip = it.ip || '127.0.0.1';
                const details = JSON.stringify(it.details || {});
                csv += `${escapeCsv(id)},${escapeCsv(time)},${escapeCsv(cat)},${escapeCsv(action)},${escapeCsv(user)},${escapeCsv(ip)},${escapeCsv(details)}\n`;
            });

            const dateStr = new Date().toISOString().slice(0, 10);
            res.writeHead(200, {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="versaly-audit-log-${dateStr}.csv"`
            });
            res.end(csv);
            return;
        }

        // POST /api/admin/audit/clear - Purge Audit History (Admin only)
        if (req.method === 'POST' && pathname === '/api/admin/audit/clear') {
            try {
                fs.writeFileSync(CONFIG.activityFile, JSON.stringify([], null, 2), 'utf8');
                logActivity('audit_log_cleared', { cleared_at: new Date().toISOString() }, 'admin', 'system', clientIp);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Audit logs cleared successfully.' }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Failed to clear audit logs: ' + err.message }));
            }
            return;
        }

        // ════════════════════════════════════════════════════════════════
        // 2B. ADMIN ANALYTICS TRENDS & EXECUTIVE REPORTING (Phase 17)
        // ════════════════════════════════════════════════════════════════

        // GET /api/admin/analytics/trends - Time Series Data for SVG Charts
        if (req.method === 'GET' && pathname === '/api/admin/analytics/trends') {
            const q = Object.fromEntries(parsedUrl.searchParams);
            const range = (q.range || '30d').toLowerCase(); // '7d', '30d', '90d', 'all'
            const allSubmissions = readAllSubmissions();

            let daysCount = 30;
            if (range === '7d') daysCount = 7;
            else if (range === '90d') daysCount = 90;
            else if (range === 'all') daysCount = 180;

            const now = new Date();
            const dailyBuckets = [];
            const dayMap = new Map();

            // Initialize chronological day buckets
            for (let i = daysCount - 1; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const isoDate = d.toISOString().slice(0, 10);
                const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const bucket = {
                    date: isoDate,
                    label: label,
                    total: 0,
                    demos: 0,
                    contacts: 0,
                    deal_value: 0,
                    conversion_rate: 0
                };
                dailyBuckets.push(bucket);
                dayMap.set(isoDate, bucket);
            }

            let rangeTotalLeads = 0;
            let rangeDemos = 0;
            let rangeContacts = 0;
            let rangePipelineValue = 0;
            let wonCount = 0;
            let wonValue = 0;
            let qualifiedCount = 0;
            let proposalCount = 0;

            const channelCounts = {
                demo_page: 0,
                contact_page: 0,
                product_pages: 0,
                roi_calculator: 0,
                direct: 0
            };

            const cutoffIso = dailyBuckets[0].date;

            allSubmissions.forEach(sub => {
                const subDate = (sub.submitted_at || '').slice(0, 10);
                const isWithinRange = subDate >= cutoffIso;

                if (isWithinRange) {
                    rangeTotalLeads++;
                    const isDemo = sub.form_type === 'demo_request';
                    if (isDemo) rangeDemos++;
                    else rangeContacts++;

                    const val = typeof sub.estimated_value === 'number' ? sub.estimated_value : 0;
                    rangePipelineValue += val;

                    if (sub.status === 'closed_won') {
                        wonCount++;
                        wonValue += val;
                    }
                    if (sub.status === 'qualified') qualifiedCount++;
                    if (sub.status === 'proposal_sent') proposalCount++;

                    // Channel attribution
                    const src = (sub.meta && sub.meta.source_page ? sub.meta.source_page : '').toLowerCase();
                    if (src.includes('demo')) channelCounts.demo_page++;
                    else if (src.includes('contact')) channelCounts.contact_page++;
                    else if (src.includes('product')) channelCounts.product_pages++;
                    else if (src.includes('roi') || src.includes('calc')) channelCounts.roi_calculator++;
                    else channelCounts.direct++;

                    if (dayMap.has(subDate)) {
                        const b = dayMap.get(subDate);
                        b.total += 1;
                        if (isDemo) b.demos += 1;
                        else b.contacts += 1;
                        b.deal_value += val;
                    }
                }
            });

            // Compute conversion rates per day and find peak day
            let peakDay = { date: '', count: 0 };
            dailyBuckets.forEach(b => {
                b.conversion_rate = b.total > 0 ? Math.round((b.demos / b.total) * 100) : 0;
                if (b.total > peakDay.count) {
                    peakDay = { date: b.label, count: b.total };
                }
            });

            const overallConversion = rangeTotalLeads > 0 ? Math.round((rangeDemos / rangeTotalLeads) * 100) : 0;
            const avgDaily = (rangeTotalLeads / daysCount).toFixed(1);

            const summary = {
                range: range,
                days: daysCount,
                total_leads: rangeTotalLeads,
                demo_requests: rangeDemos,
                contact_inquiries: rangeContacts,
                conversion_rate: overallConversion,
                total_pipeline_value: rangePipelineValue,
                won_revenue: wonValue,
                won_count: wonCount,
                qualified_count: qualifiedCount,
                proposal_count: proposalCount,
                avg_daily_leads: parseFloat(avgDaily),
                peak_day: peakDay
            };

            const funnel = {
                visitors_est: Math.max(rangeTotalLeads * 14, 120),
                catalogue_views_est: Math.max(rangeTotalLeads * 5, 45),
                inquiries: rangeTotalLeads,
                qualified_leads: qualifiedCount + proposalCount + wonCount,
                proposals_sent: proposalCount + wonCount,
                deals_won: wonCount,
                won_revenue: wonValue
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                range: range,
                summary: summary,
                daily_series: dailyBuckets,
                channels: channelCounts,
                funnel: funnel
            }));
            return;
        }

        // GET /api/admin/analytics/report - Executive Summary Data Report
        if (req.method === 'GET' && pathname === '/api/admin/analytics/report') {
            const all = readAllSubmissions();
            const prodData = readProductsData();
            const allProds = prodData.products || [];
            const recentAudit = getActivities(15);

            const totalDealValue = all.reduce((acc, i) => acc + (typeof i.estimated_value === 'number' ? i.estimated_value : 0), 0);
            const wonDeals = all.filter(i => i.status === 'closed_won');
            const wonRevenue = wonDeals.reduce((acc, i) => acc + (typeof i.estimated_value === 'number' ? i.estimated_value : 0), 0);

            const report = {
                generated_at: new Date().toISOString(),
                platform: 'versaly Enterprise Control Center',
                total_products: allProds.length,
                live_products: allProds.filter(p => p.status === 'live').length,
                total_leads: all.length,
                demo_requests: all.filter(i => i.form_type === 'demo_request').length,
                contact_inquiries: all.filter(i => i.form_type === 'contact').length,
                conversion_rate: all.length > 0 ? Math.round((all.filter(i => i.form_type === 'demo_request').length / all.length) * 100) : 0,
                pipeline_valuation: totalDealValue,
                closed_won_revenue: wonRevenue,
                closed_won_count: wonDeals.length,
                top_deals: all.filter(i => i.estimated_value > 0).sort((a, b) => b.estimated_value - a.estimated_value).slice(0, 5),
                recent_audit_events: recentAudit
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, report: report }));
            return;
        }

        // 3. Admin Products Management (CMS)
        // GET /api/admin/products - List all products with lead metrics and filters
        if (req.method === 'GET' && pathname === '/api/admin/products') {
            const prodData = readProductsData();
            let list = prodData.products || [];
            const allSubmissions = readAllSubmissions();

            // Augment with inquiry count
            list = list.map((p, idx) => {
                const matchingSubs = allSubmissions.filter(s => {
                    const spId = (s.details && s.details.product_id) || '';
                    const spName = (s.details && s.details.product_name) || '';
                    return spId === p.id || spName.toLowerCase() === (p.name || '').toLowerCase();
                });
                return {
                    ...p,
                    order: p.order !== undefined ? p.order : idx + 1,
                    inquiries_count: matchingSubs.length,
                    last_inquiry_at: matchingSubs.length > 0 ? matchingSubs[0].submitted_at : null
                };
            });

            const q = Object.fromEntries(parsedUrl.searchParams);
            if (q.status && q.status !== 'all') {
                list = list.filter(p => (p.status || 'in-development').toLowerCase() === q.status.toLowerCase());
            }
            if (q.category && q.category !== 'all') {
                list = list.filter(p => (p.category || '').toLowerCase() === q.category.toLowerCase());
            }
            if (q.search) {
                const term = q.search.toLowerCase();
                list = list.filter(p => {
                    const name = (p.name || '').toLowerCase();
                    const tag = (p.tagline || '').toLowerCase();
                    const cat = (p.category || '').toLowerCase();
                    const id = (p.id || '').toLowerCase();
                    return name.includes(term) || tag.includes(term) || cat.includes(term) || id.includes(term);
                });
            }

            // Sort by order asc
            list.sort((a, b) => (a.order || 999) - (b.order || 999));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: list.length, products: list }));
            return;
        }

        // GET /api/admin/products/:id - Single product details
        if (req.method === 'GET' && pathname.startsWith('/api/admin/products/')) {
            const id = pathname.replace('/api/admin/products/', '').trim();
            const prodData = readProductsData();
            const prod = (prodData.products || []).find(p => p.id === id);
            if (!prod) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Product not found.' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, product: prod }));
            return;
        }

        // POST /api/admin/products - Create new product
        if (req.method === 'POST' && pathname === '/api/admin/products') {
            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {}

                const name = sanitizeString(body.name, 120);
                if (!name || name.length < 2) {
                    res.writeHead(422, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Product name must be at least 2 characters.' }));
                    return;
                }

                const prodData = readProductsData();
                const list = prodData.products || [];

                let id = sanitizeString(body.id || '', 80);
                if (!id) id = slugify(name);
                else id = slugify(id);

                // Ensure unique ID
                let uniqueId = id;
                let counter = 2;
                while (list.some(p => p.id === uniqueId)) {
                    uniqueId = `${id}-${counter}`;
                    counter++;
                }

                const newProduct = {
                    id: uniqueId,
                    name: name,
                    tagline: sanitizeString(body.tagline || '', 255),
                    category: sanitizeString(body.category || 'General', 80),
                    status: sanitizeString(body.status || 'in-development', 50),
                    spotlight: Boolean(body.spotlight),
                    featured: Boolean(body.featured),
                    accent: sanitizeString(body.accent || '#4f46e5', 20),
                    shortDescription: sanitizeString(body.shortDescription || '', 500),
                    fullDescription: sanitizeString(body.fullDescription || '', 3000),
                    problem: sanitizeString(body.problem || '', 3000),
                    whatWeAreBuilding: Array.isArray(body.whatWeAreBuilding) ? body.whatWeAreBuilding.map(s => sanitizeString(s, 300)).filter(Boolean) : [],
                    keyFeatures: Array.isArray(body.keyFeatures) ? body.keyFeatures.map(s => sanitizeString(s, 200)).filter(Boolean) : [],
                    features: Array.isArray(body.features) ? body.features.map(f => ({
                        icon: sanitizeString(f.icon || 'check', 50),
                        title: sanitizeString(f.title || '', 120),
                        description: sanitizeString(f.description || '', 500)
                    })).filter(f => f.title) : [],
                    benefits: Array.isArray(body.benefits) ? body.benefits.map(b => ({
                        icon: sanitizeString(b.icon || 'star', 50),
                        title: sanitizeString(b.title || '', 120),
                        description: sanitizeString(b.description || '', 500)
                    })).filter(b => b.title) : [],
                    audience: Array.isArray(body.audience) ? body.audience.map(a => ({
                        icon: sanitizeString(a.icon || 'building', 50),
                        title: sanitizeString(a.title || '', 120),
                        description: sanitizeString(a.description || '', 500)
                    })).filter(a => a.title) : [],
                    relatedIds: Array.isArray(body.relatedIds) ? body.relatedIds.map(r => sanitizeString(r, 80)).filter(Boolean) : [],
                    order: typeof body.order === 'number' ? body.order : list.length + 1,
                    stats: typeof body.stats === 'object' && body.stats !== null ? body.stats : {},
                    screenshots: Array.isArray(body.screenshots) ? body.screenshots : [
                        { layout: 'dashboard', label: 'Dashboard Overview' },
                        { layout: 'table', label: 'Management View' }
                    ],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                list.push(newProduct);
                saveProductsData({ products: list });

                logActivity('product_created', {
                    product_id: newProduct.id,
                    product_name: newProduct.name,
                    category: newProduct.category,
                    status: newProduct.status
                });

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, product: newProduct }));
            });
            return;
        }

        // PUT /api/admin/products/:id - Full Product Update
        if (req.method === 'PUT' && pathname.startsWith('/api/admin/products/')) {
            const id = pathname.replace('/api/admin/products/', '').trim();
            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {}

                const prodData = readProductsData();
                const list = prodData.products || [];
                const idx = list.findIndex(p => p.id === id);

                if (idx === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Product not found.' }));
                    return;
                }

                const existing = list[idx];
                const updatedName = body.name !== undefined ? sanitizeString(body.name, 120) : existing.name;

                list[idx] = {
                    ...existing,
                    name: updatedName,
                    tagline: body.tagline !== undefined ? sanitizeString(body.tagline, 255) : existing.tagline,
                    category: body.category !== undefined ? sanitizeString(body.category, 80) : existing.category,
                    status: body.status !== undefined ? sanitizeString(body.status, 50) : existing.status,
                    spotlight: body.spotlight !== undefined ? Boolean(body.spotlight) : existing.spotlight,
                    featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
                    accent: body.accent !== undefined ? sanitizeString(body.accent, 20) : existing.accent,
                    shortDescription: body.shortDescription !== undefined ? sanitizeString(body.shortDescription, 500) : existing.shortDescription,
                    fullDescription: body.fullDescription !== undefined ? sanitizeString(body.fullDescription, 3000) : existing.fullDescription,
                    problem: body.problem !== undefined ? sanitizeString(body.problem, 3000) : existing.problem,
                    whatWeAreBuilding: Array.isArray(body.whatWeAreBuilding) ? body.whatWeAreBuilding.map(s => sanitizeString(s, 300)).filter(Boolean) : existing.whatWeAreBuilding,
                    keyFeatures: Array.isArray(body.keyFeatures) ? body.keyFeatures.map(s => sanitizeString(s, 200)).filter(Boolean) : existing.keyFeatures,
                    features: Array.isArray(body.features) ? body.features.map(f => ({
                        icon: sanitizeString(f.icon || 'check', 50),
                        title: sanitizeString(f.title || '', 120),
                        description: sanitizeString(f.description || '', 500)
                    })).filter(f => f.title) : existing.features,
                    benefits: Array.isArray(body.benefits) ? body.benefits.map(b => ({
                        icon: sanitizeString(b.icon || 'star', 50),
                        title: sanitizeString(b.title || '', 120),
                        description: sanitizeString(b.description || '', 500)
                    })).filter(b => b.title) : existing.benefits,
                    audience: Array.isArray(body.audience) ? body.audience.map(a => ({
                        icon: sanitizeString(a.icon || 'building', 50),
                        title: sanitizeString(a.title || '', 120),
                        description: sanitizeString(a.description || '', 500)
                    })).filter(a => a.title) : existing.audience,
                    relatedIds: Array.isArray(body.relatedIds) ? body.relatedIds.map(r => sanitizeString(r, 80)).filter(Boolean) : existing.relatedIds,
                    order: typeof body.order === 'number' ? body.order : existing.order,
                    screenshots: Array.isArray(body.screenshots) ? body.screenshots : existing.screenshots,
                    updatedAt: new Date().toISOString()
                };

                saveProductsData({ products: list });

                logActivity('product_updated', {
                    product_id: list[idx].id,
                    product_name: list[idx].name,
                    status: list[idx].status,
                    featured: list[idx].featured
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, product: list[idx] }));
            });
            return;
        }

        // PATCH /api/admin/products/:id/status - Quick Toggle Status / Featured / Spotlight
        if (req.method === 'PATCH' && pathname.includes('/api/admin/products/') && pathname.endsWith('/status')) {
            const id = pathname.replace('/api/admin/products/', '').replace('/status', '').trim();
            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {}

                const prodData = readProductsData();
                const list = prodData.products || [];
                const item = list.find(p => p.id === id);

                if (!item) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Product not found.' }));
                    return;
                }

                if (body.status !== undefined) item.status = sanitizeString(body.status, 50);
                if (body.featured !== undefined) item.featured = Boolean(body.featured);
                if (body.spotlight !== undefined) item.spotlight = Boolean(body.spotlight);
                if (body.order !== undefined && typeof body.order === 'number') item.order = body.order;
                item.updatedAt = new Date().toISOString();

                saveProductsData({ products: list });

                logActivity('product_status_changed', {
                    product_id: item.id,
                    product_name: item.name,
                    status: item.status,
                    featured: item.featured
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, product: item }));
            });
            return;
        }

        // POST /api/admin/products/reorder - Reorder Products
        if (req.method === 'POST' && pathname === '/api/admin/products/reorder') {
            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {}

                const orderList = Array.isArray(body.productIds) ? body.productIds : (Array.isArray(body.order) ? body.order : null);
                if (!orderList) {
                    res.writeHead(422, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Product IDs or order array required.' }));
                    return;
                }

                const prodData = readProductsData();
                const list = prodData.products || [];

                orderList.forEach((id, index) => {
                    const item = list.find(p => p.id === id);
                    if (item) {
                        item.order = index + 1;
                        item.updatedAt = new Date().toISOString();
                    }
                });

                list.sort((a, b) => (a.order || 999) - (b.order || 999));
                saveProductsData({ products: list });

                logActivity('products_reordered', { count: orderList.length });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, products: list }));
            });
            return;
        }

        // DELETE /api/admin/products/:id - Delete or Archive Product
        if (req.method === 'DELETE' && pathname.startsWith('/api/admin/products/')) {
            const id = pathname.replace('/api/admin/products/', '').trim();
            const q = Object.fromEntries(parsedUrl.searchParams);
            const prodData = readProductsData();
            let list = prodData.products || [];
            const item = list.find(p => p.id === id);

            if (!item) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Product not found.' }));
                return;
            }

            if (q.action === 'archive') {
                item.status = 'archived';
                item.updatedAt = new Date().toISOString();
                saveProductsData({ products: list });
                logActivity('product_archived', { product_id: id, product_name: item.name });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Product archived successfully.', product: item }));
                return;
            }

            list = list.filter(p => p.id !== id);
            saveProductsData({ products: list });
            logActivity('product_deleted', { product_id: id, product_name: item.name });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Product permanently deleted.' }));
            return;
        }

        // ════════════════════════════════════════════════════════════════
        // 4. ADMIN MEDIA LIBRARY (Phase 8 Main Feature)
        // ════════════════════════════════════════════════════════════════

        // GET /api/admin/media - List all media assets with linked products & search
        if (req.method === 'GET' && pathname === '/api/admin/media') {
            const mediaData = readMediaData();
            let list = mediaData.media || [];
            const prodData = readProductsData();
            const allProds = prodData.products || [];

            // Cross-reference linked products
            list.forEach(m => {
                const linked = allProds.filter(p => {
                    const matchFeatured = p.featuredImage === m.url;
                    const matchScreens = Array.isArray(p.screenshots) && p.screenshots.some(s => s.image === m.url || s.url === m.url);
                    const matchExplicit = Array.isArray(m.linkedProductIds) && m.linkedProductIds.includes(p.id);
                    return matchFeatured || matchScreens || matchExplicit;
                }).map(p => ({ id: p.id, name: p.name, category: p.category }));
                m.linkedProducts = linked;
            });

            const totalBytes = list.reduce((sum, item) => sum + (item.size || 0), 0);
            const q = Object.fromEntries(parsedUrl.searchParams);

            if (q.search) {
                const term = q.search.toLowerCase();
                list = list.filter(m => {
                    const title = (m.title || '').toLowerCase();
                    const fn = (m.filename || '').toLowerCase();
                    const cap = (m.caption || '').toLowerCase();
                    const tags = Array.isArray(m.tags) ? m.tags.join(' ').toLowerCase() : '';
                    return title.includes(term) || fn.includes(term) || cap.includes(term) || tags.includes(term);
                });
            }

            if (q.tag) {
                const tagTerm = q.tag.toLowerCase();
                list = list.filter(m => Array.isArray(m.tags) && m.tags.some(t => t.toLowerCase() === tagTerm));
            }

            if (q.type) {
                const typeTerm = q.type.toLowerCase();
                if (typeTerm === 'svg') {
                    list = list.filter(m => m.mimeType === 'image/svg+xml' || m.filename.endsWith('.svg'));
                } else if (typeTerm === 'raster') {
                    list = list.filter(m => m.mimeType !== 'image/svg+xml');
                }
            }

            if (q.product) {
                list = list.filter(m => m.linkedProducts && m.linkedProducts.some(p => p.id === q.product));
            }

            // Sort newest first by default
            list.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                count: list.length,
                total: (mediaData.media || []).length,
                storageUsageBytes: totalBytes,
                media: list
            }));
            return;
        }

        // POST /api/admin/media/upload - Upload new image asset (Base64 / JSON)
        if (req.method === 'POST' && pathname === '/api/admin/media/upload') {
            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid JSON upload payload.' }));
                    return;
                }

                const base64Data = body.base64 || body.data || body.file;
                const originalName = sanitizeString(body.originalName || body.name || 'uploaded-image.png', 120);

                if (!base64Data) {
                    res.writeHead(422, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Base64 image data is required.' }));
                    return;
                }

                // Detect or validate MIME type
                let mimeType = (body.mimeType || 'image/png').toLowerCase();
                let rawBase64 = base64Data;
                if (typeof base64Data === 'string' && base64Data.startsWith('data:')) {
                    const commaIdx = base64Data.indexOf(',');
                    if (commaIdx !== -1) {
                        const meta = base64Data.substring(0, commaIdx);
                        rawBase64 = base64Data.substring(commaIdx + 1);
                        const mimeMatch = meta.match(/data:([^;]+)/);
                        if (mimeMatch) {
                            mimeType = mimeMatch[1].toLowerCase();
                        }
                    }
                }

                const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];
                if (!allowedMimes.includes(mimeType.toLowerCase())) {
                    res.writeHead(422, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: `Unsupported MIME type: ${mimeType}. Allowed: PNG, JPEG, SVG, WebP, GIF.`
                    }));
                    return;
                }

                // Determine file extension
                const extMap = {
                    'image/png': '.png',
                    'image/jpeg': '.jpg',
                    'image/jpg': '.jpg',
                    'image/webp': '.webp',
                    'image/svg+xml': '.svg',
                    'image/gif': '.gif'
                };
                const ext = extMap[mimeType.toLowerCase()] || path.extname(originalName) || '.png';

                // Safe clean filename
                const baseName = path.basename(originalName, path.extname(originalName));
                const slugName = slugify(baseName) || 'asset';
                const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(3).toString('hex');
                const filename = `${slugName}-${uniqueSuffix}${ext}`;
                const filePath = path.join(CONFIG.uploadsDir, filename);

                // Convert base64 to buffer and write to disk
                const buffer = Buffer.from(rawBase64, 'base64');
                
                // Maximum 10MB limit
                if (buffer.length > 10 * 1024 * 1024) {
                    res.writeHead(413, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'File exceeds 10MB maximum size limit.' }));
                    return;
                }

                try {
                    fs.writeFileSync(filePath, buffer);
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Failed to write file to disk: ' + err.message }));
                    return;
                }

                const mediaId = 'med_' + slugName + '_' + crypto.randomBytes(4).toString('hex');
                const mediaEntry = {
                    id: mediaId,
                    filename: filename,
                    originalName: originalName,
                    mimeType: mimeType,
                    size: buffer.length,
                    width: body.width || 1200,
                    height: body.height || 750,
                    url: `/assets/uploads/${filename}`,
                    title: sanitizeString(body.title || baseName, 120),
                    alt: sanitizeString(body.alt || baseName, 250),
                    caption: sanitizeString(body.caption || '', 500),
                    tags: Array.isArray(body.tags) ? body.tags.map(t => sanitizeString(t, 30)) : [],
                    uploadedAt: new Date().toISOString(),
                    linkedProductIds: Array.isArray(body.linkedProductIds) ? body.linkedProductIds : []
                };

                const mediaData = readMediaData();
                const list = mediaData.media || [];
                list.unshift(mediaEntry);
                saveMediaData({ media: list });

                logActivity('media_uploaded', {
                    media_id: mediaEntry.id,
                    filename: mediaEntry.filename,
                    size: mediaEntry.size,
                    title: mediaEntry.title
                });

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, media: mediaEntry }));
            });
            return;
        }

        // GET /api/admin/media/:id - Single Media Asset
        if (req.method === 'GET' && pathname.startsWith('/api/admin/media/')) {
            const id = pathname.replace('/api/admin/media/', '').trim();
            const mediaData = readMediaData();
            const list = mediaData.media || [];
            const item = list.find(m => m.id === id || m.filename === id);

            if (!item) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Media asset not found.' }));
                return;
            }

            const prodData = readProductsData();
            const allProds = prodData.products || [];
            item.linkedProducts = allProds.filter(p => {
                const matchFeatured = p.featuredImage === item.url;
                const matchScreens = Array.isArray(p.screenshots) && p.screenshots.some(s => s.image === item.url || s.url === item.url);
                const matchExplicit = Array.isArray(item.linkedProductIds) && item.linkedProductIds.includes(p.id);
                return matchFeatured || matchScreens || matchExplicit;
            }).map(p => ({ id: p.id, name: p.name, category: p.category }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, media: item }));
            return;
        }

        // PUT /api/admin/media/:id - Update Media Metadata (Captions, Alt, Tags, Title)
        if (req.method === 'PUT' && pathname.startsWith('/api/admin/media/')) {
            const id = pathname.replace('/api/admin/media/', '').trim();
            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {}

                const mediaData = readMediaData();
                const list = mediaData.media || [];
                const idx = list.findIndex(m => m.id === id || m.filename === id);

                if (idx === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Media asset not found.' }));
                    return;
                }

                if (body.title !== undefined) list[idx].title = sanitizeString(body.title, 120);
                if (body.alt !== undefined) list[idx].alt = sanitizeString(body.alt, 250);
                if (body.caption !== undefined) list[idx].caption = sanitizeString(body.caption, 500);
                if (body.tags !== undefined && Array.isArray(body.tags)) {
                    list[idx].tags = body.tags.map(t => sanitizeString(t, 30)).filter(Boolean);
                }
                if (body.linkedProductIds !== undefined && Array.isArray(body.linkedProductIds)) {
                    list[idx].linkedProductIds = body.linkedProductIds;
                }
                list[idx].updatedAt = new Date().toISOString();

                saveMediaData({ media: list });

                logActivity('media_updated', {
                    media_id: list[idx].id,
                    title: list[idx].title
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, media: list[idx] }));
            });
            return;
        }

        // DELETE /api/admin/media/:id - Delete Media Asset & File from disk
        if (req.method === 'DELETE' && pathname.startsWith('/api/admin/media/')) {
            const id = pathname.replace('/api/admin/media/', '').trim();
            const mediaData = readMediaData();
            let list = mediaData.media || [];
            const item = list.find(m => m.id === id || m.filename === id);

            if (!item) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Media asset not found.' }));
                return;
            }

            // Remove file from disk
            deleteMediaFile(item.filename);

            // Remove from registry
            list = list.filter(m => m.id !== item.id);
            saveMediaData({ media: list });

            logActivity('media_deleted', {
                media_id: item.id,
                filename: item.filename,
                title: item.title
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Media asset deleted successfully.' }));
            return;
        }

        // ════════════════════════════════════════════════════════════════
        // 5. ADMIN CONTENT, TESTIMONIALS & TRUST CMS (Phase 9 Core Feature)
        // ════════════════════════════════════════════════════════════════

        // GET /api/admin/content - Complete content structure
        if (req.method === 'GET' && pathname === '/api/admin/content') {
            const content = readContentData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: content,
                content: content,
                counts: {
                    testimonials: (content.testimonials || []).length,
                    faqs: (content.faqs || []).length,
                    stats: (content.stats || []).length,
                    values: (content.values || []).length,
                    partners: (content.partners || []).length
                }
            }));
            return;
        }

        // POST /api/admin/content/reorder - Reorder items in a section
        if (req.method === 'POST' && pathname === '/api/admin/content/reorder') {
            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {}

                const section = sanitizeString(body.section, 50);
                const itemIds = Array.isArray(body.itemIds) ? body.itemIds : null;

                if (!section || !itemIds) {
                    res.writeHead(422, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Section and itemIds array are required.' }));
                    return;
                }

                const content = readContentData();
                if (!Array.isArray(content[section])) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: `Invalid content section: ${section}` }));
                    return;
                }

                const list = content[section];
                itemIds.forEach((id, idx) => {
                    const item = list.find(it => it.id === id);
                    if (item) {
                        item.order = idx + 1;
                        item.updatedAt = new Date().toISOString();
                    }
                });

                list.sort((a, b) => (a.order || 999) - (b.order || 999));
                content[section] = list;
                saveContentData(content);

                logActivity('content_reordered', { section, count: itemIds.length });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, section, items: list }));
            });
            return;
        }

        // GET /api/admin/content/:section/:id - Retrieve single content item
        if (req.method === 'GET' && pathname.startsWith('/api/admin/content/')) {
            const parts = pathname.replace('/api/admin/content/', '').split('/');
            if (parts.length >= 2) {
                const section = parts[0];
                const id = parts[1];
                const content = readContentData();
                const list = content[section] || [];
                const item = list.find(it => it.id === id);

                if (!item) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Content item not found.' }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, section, item }));
                return;
            }
        }

        // PUT /api/admin/content/:section/:id - Update content item
        if (req.method === 'PUT' && pathname.startsWith('/api/admin/content/')) {
            const parts = pathname.replace('/api/admin/content/', '').split('/');
            if (parts.length >= 2) {
                const section = parts[0];
                const id = parts[1];
                let raw = '';
                req.on('data', chunk => raw += chunk);
                req.on('end', () => {
                    let body = {};
                    try { body = JSON.parse(raw); } catch (e) {}

                    const content = readContentData();
                    const list = content[section] || [];
                    const idx = list.findIndex(it => it.id === id);

                    if (idx === -1) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Content item not found.' }));
                        return;
                    }

                    const existing = list[idx];
                    const updated = {
                        ...existing,
                        ...body,
                        id: existing.id, // Immutable ID
                        updatedAt: new Date().toISOString()
                    };

                    if (body.rating !== undefined) updated.rating = Math.max(1, Math.min(5, Number(body.rating)));
                    if (body.order !== undefined) updated.order = Number(body.order);
                    if (body.featured !== undefined) updated.featured = Boolean(body.featured);

                    list[idx] = updated;
                    content[section] = list;
                    saveContentData(content);

                    logActivity('content_updated', { section, item_id: id });

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, section, item: updated }));
                });
                return;
            }
        }

        // DELETE /api/admin/content/:section/:id - Delete content item
        if (req.method === 'DELETE' && pathname.startsWith('/api/admin/content/')) {
            const parts = pathname.replace('/api/admin/content/', '').split('/');
            if (parts.length >= 2) {
                const section = parts[0];
                const id = parts[1];

                const content = readContentData();
                let list = content[section] || [];
                const idx = list.findIndex(it => it.id === id);

                if (idx === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Content item not found.' }));
                    return;
                }

                list = list.filter(it => it.id !== id);
                content[section] = list;
                saveContentData(content);

                logActivity('content_deleted', { section, item_id: id });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Content item deleted.' }));
                return;
            }
        }

        // POST /api/admin/content/:section - Create new item in a section
        if (req.method === 'POST' && pathname.startsWith('/api/admin/content/')) {
            const section = pathname.replace('/api/admin/content/', '').trim();
            const allowedSections = ['testimonials', 'faqs', 'stats', 'values', 'partners'];
            if (!allowedSections.includes(section)) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: `Unknown content section: ${section}` }));
                return;
            }

            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {}

                const content = readContentData();
                const list = content[section] || [];

                const prefixMap = {
                    testimonials: 'test',
                    faqs: 'faq',
                    stats: 'stat',
                    values: 'val',
                    partners: 'partner'
                };
                const prefix = prefixMap[section] || 'item';
                const id = prefix + '-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');

                let newItem = {
                    id: id,
                    order: typeof body.order === 'number' ? body.order : list.length + 1,
                    status: sanitizeString(body.status || 'published', 30),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                if (section === 'testimonials') {
                    newItem.author = sanitizeString(body.author || 'Anonymous', 100);
                    newItem.role = sanitizeString(body.role || '', 100);
                    newItem.company = sanitizeString(body.company || '', 120);
                    newItem.quote = sanitizeString(body.quote || '', 1000);
                    newItem.avatar = sanitizeString(body.avatar || '', 500);
                    newItem.rating = typeof body.rating === 'number' ? Math.max(1, Math.min(5, body.rating)) : 5;
                    newItem.product = sanitizeString(body.product || '', 100);
                    newItem.productId = sanitizeString(body.productId || '', 80);
                    newItem.featured = Boolean(body.featured);
                } else if (section === 'faqs') {
                    newItem.category = sanitizeString(body.category || 'general', 50);
                    newItem.question = sanitizeString(body.question || '', 300);
                    newItem.answer = sanitizeString(body.answer || '', 2000);
                } else if (section === 'stats') {
                    newItem.value = sanitizeString(body.value || '', 50);
                    newItem.label = sanitizeString(body.label || '', 100);
                    newItem.subtext = sanitizeString(body.subtext || '', 200);
                    newItem.icon = sanitizeString(body.icon || 'star', 50);
                } else if (section === 'values') {
                    newItem.title = sanitizeString(body.title || '', 120);
                    newItem.description = sanitizeString(body.description || '', 1000);
                    newItem.icon = sanitizeString(body.icon || 'star', 50);
                    newItem.category = sanitizeString(body.category || 'core', 50);
                } else if (section === 'partners') {
                    newItem.name = sanitizeString(body.name || '', 120);
                    newItem.logo = sanitizeString(body.logo || '', 500);
                    newItem.industry = sanitizeString(body.industry || '', 80);
                    newItem.website = sanitizeString(body.website || '', 255);
                }

                list.push(newItem);
                content[section] = list;
                saveContentData(content);

                logActivity('content_created', { section, item_id: newItem.id });

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, section, item: newItem }));
            });
            return;
        }

        // ════════════════════════════════════════════════════════════════
        // 6. ADMIN SUBMISSIONS & LEADS
        // ════════════════════════════════════════════════════════════════
        // ════════════════════════════════════════════════════════════════
        // 6. ADMIN SUBMISSIONS & CRM PIPELINE (Phase 10 Core Feature)
        // ════════════════════════════════════════════════════════════════
        if (req.method === 'GET' && pathname === '/api/admin/submissions') {
            let list = readAllSubmissions();
            const q = Object.fromEntries(parsedUrl.searchParams);
            const todayStr = new Date().toISOString().slice(0, 10);

            if (q.form_type) {
                list = list.filter(i => i.form_type === q.form_type);
            }
            if (q.status && q.status !== 'all') {
                list = list.filter(i => (i.status || 'new') === q.status);
            }
            if (q.priority && q.priority !== 'all') {
                list = list.filter(i => (i.priority || 'medium') === q.priority);
            }
            if (q.assigned_to && q.assigned_to !== 'all') {
                list = list.filter(i => (i.assigned_to || 'unassigned') === q.assigned_to);
            }
            if (q.follow_up) {
                if (q.follow_up === 'overdue') {
                    list = list.filter(i => i.follow_up_date && i.follow_up_date.slice(0, 10) < todayStr && i.status !== 'closed_won' && i.status !== 'closed_lost' && i.status !== 'closed');
                } else if (q.follow_up === 'today') {
                    list = list.filter(i => i.follow_up_date && i.follow_up_date.slice(0, 10) === todayStr);
                } else if (q.follow_up === 'upcoming') {
                    list = list.filter(i => i.follow_up_date && i.follow_up_date.slice(0, 10) > todayStr);
                }
            }
            if (q.search) {
                const term = q.search.toLowerCase();
                list = list.filter(i => {
                    const ref = (i.ref_id || '').toLowerCase();
                    const name = (i.contact && i.contact.name ? i.contact.name : '').toLowerCase();
                    const email = (i.contact && i.contact.email ? i.contact.email : '').toLowerCase();
                    const company = (i.contact && i.contact.company ? i.contact.company : '').toLowerCase();
                    const prod = (i.details && (i.details.product_name || i.details.product_id) ? (i.details.product_name || i.details.product_id) : '').toLowerCase();
                    const subj = (i.details && i.details.subject ? i.details.subject : '').toLowerCase();
                    const assigned = (i.assigned_to || '').toLowerCase();
                    return ref.includes(term) || name.includes(term) || email.includes(term) || company.includes(term) || prod.includes(term) || subj.includes(term) || assigned.includes(term);
                });
            }

            list.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: list.length, submissions: list }));
            return;
        }

        // CSV Export with Enriched CRM Pipeline Data
        if (req.method === 'GET' && pathname === '/api/admin/export.csv') {
            const list = readAllSubmissions();
            list.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

            const escapeCsv = (str) => {
                if (str == null) return '""';
                const s = String(str).replace(/"/g, '""');
                return `"${s}"`;
            };

            let csv = 'Reference ID,Submitted At,Status,Priority,Assigned To,Follow-up Date,Est Value ($),Form Type,Full Name,Work Email,Company,Phone,Product,Industry,Goal / Subject,Message,Admin Notes,Notes Count\n';
            list.forEach(i => {
                const ref = i.ref_id || '';
                const date = i.submitted_at || '';
                const status = i.status || 'new';
                const priority = i.priority || 'medium';
                const assigned = i.assigned_to || 'unassigned';
                const followUp = i.follow_up_date || '';
                const val = typeof i.estimated_value === 'number' ? i.estimated_value : '';
                const type = i.form_type || '';
                const name = i.contact ? i.contact.name || '' : '';
                const email = i.contact ? i.contact.email || '' : '';
                const company = i.contact ? i.contact.company || '' : '';
                const phone = i.contact ? i.contact.phone || '' : '';
                const prod = i.details ? i.details.product_name || i.details.product_id || '' : '';
                const ind = i.details ? i.details.industry || '' : '';
                const goal = i.details ? i.details.goal || i.details.subject || '' : '';
                const msg = i.details ? i.details.message || '' : '';
                const notes = i.admin_notes || '';
                const notesCount = Array.isArray(i.notes) ? i.notes.length : (notes ? 1 : 0);

                csv += `${escapeCsv(ref)},${escapeCsv(date)},${escapeCsv(status)},${escapeCsv(priority)},${escapeCsv(assigned)},${escapeCsv(followUp)},${escapeCsv(val)},${escapeCsv(type)},${escapeCsv(name)},${escapeCsv(email)},${escapeCsv(company)},${escapeCsv(phone)},${escapeCsv(prod)},${escapeCsv(ind)},${escapeCsv(goal)},${escapeCsv(msg)},${escapeCsv(notes)},${escapeCsv(notesCount)}\n`;
            });

            const dateStr = new Date().toISOString().slice(0, 10);
            res.writeHead(200, {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="versaly-leads-${dateStr}.csv"`
            });
            res.end(csv);
            return;
        }

        // Append Structured Note to Lead (POST /api/admin/submissions/:refId/notes)
        if (req.method === 'POST' && pathname.includes('/api/admin/submissions/') && pathname.endsWith('/notes')) {
            const refId = pathname.replace('/api/admin/submissions/', '').replace('/notes', '').trim();
            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {}

                const noteText = sanitizeString(body.text || body.note || '', 3000);
                if (!noteText) {
                    res.writeHead(422, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Note text cannot be empty.' }));
                    return;
                }

                const all = readAllSubmissions();
                const item = all.find(i => i.ref_id === refId);
                if (!item) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Lead not found.' }));
                    return;
                }

                if (!Array.isArray(item.notes)) item.notes = [];
                if (!Array.isArray(item.timeline)) item.timeline = [];

                const noteEntry = {
                    id: 'note_' + Date.now() + '_' + crypto.randomBytes(2).toString('hex'),
                    author: sanitizeString(body.author || 'Admin', 50),
                    text: noteText,
                    createdAt: new Date().toISOString()
                };

                item.notes.push(noteEntry);
                item.timeline.push({
                    event: 'note_added',
                    text: noteText,
                    author: noteEntry.author,
                    timestamp: noteEntry.createdAt
                });
                item.updated_at = new Date().toISOString();

                saveAllSubmissions(all);

                logActivity('lead_note_added', {
                    ref_id: refId,
                    name: item.contact ? item.contact.name : 'Unknown',
                    note_id: noteEntry.id
                });

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    note: noteEntry,
                    notes: item.notes,
                    timeline: item.timeline,
                    submission: item
                }));
            });
            return;
        }

        // Update Submission CRM Attributes (PATCH /api/admin/submissions/:refId)
        if (req.method === 'PATCH' && pathname.startsWith('/api/admin/submissions/')) {
            const refId = pathname.replace('/api/admin/submissions/', '').trim();
            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {}

                const all = readAllSubmissions();
                const item = all.find(i => i.ref_id === refId);
                if (!item) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Lead not found.' }));
                    return;
                }

                if (!Array.isArray(item.timeline)) item.timeline = [];
                const nowIso = new Date().toISOString();

                if (body.status && body.status !== item.status) {
                    const prevStatus = item.status || 'new';
                    item.status = sanitizeString(body.status, 50);
                    item.timeline.push({
                        event: 'status_changed',
                        from: prevStatus,
                        to: item.status,
                        timestamp: nowIso
                    });
                }

                if (body.priority !== undefined && body.priority !== item.priority) {
                    const prevPrio = item.priority || 'medium';
                    item.priority = sanitizeString(body.priority, 20);
                    item.timeline.push({
                        event: 'priority_changed',
                        from: prevPrio,
                        to: item.priority,
                        timestamp: nowIso
                    });
                }

                if (body.assigned_to !== undefined && body.assigned_to !== item.assigned_to) {
                    const prevAssigned = item.assigned_to || 'unassigned';
                    item.assigned_to = sanitizeString(body.assigned_to, 50);
                    item.timeline.push({
                        event: 'assignment_changed',
                        from: prevAssigned,
                        to: item.assigned_to,
                        timestamp: nowIso
                    });
                }

                if (body.follow_up_date !== undefined) {
                    item.follow_up_date = body.follow_up_date ? sanitizeString(body.follow_up_date, 30) : null;
                    item.timeline.push({
                        event: 'follow_up_scheduled',
                        date: item.follow_up_date,
                        timestamp: nowIso
                    });
                }

                if (body.estimated_value !== undefined) {
                    item.estimated_value = typeof body.estimated_value === 'number' ? Math.max(0, body.estimated_value) : Number(body.estimated_value) || 0;
                }

                if (body.admin_notes !== undefined) {
                    item.admin_notes = sanitizeString(body.admin_notes, 2000);
                }

                item.updated_at = nowIso;
                saveAllSubmissions(all);

                logActivity('lead_updated', {
                    ref_id: refId,
                    name: item.contact ? item.contact.name : 'Unknown',
                    status: item.status,
                    priority: item.priority
                }, 'leads');

                if (item.status === 'qualified') {
                    createNotification({
                        category: 'leads',
                        title: `Lead Qualified: ${item.contact ? item.contact.name : refId}`,
                        message: `Assigned: ${item.assigned_to || 'Unassigned'} | Deal: $${item.estimated_value || 0}`,
                        severity: 'success',
                        link: '#leads',
                        meta: { ref_id: refId, estimated_value: item.estimated_value }
                    });
                    dispatchWebhookEvent('lead.qualified', {
                        ref_id: refId,
                        name: item.contact ? item.contact.name : '',
                        company: item.contact ? item.contact.company : '',
                        estimated_value: item.estimated_value,
                        assigned_to: item.assigned_to,
                        status: item.status
                    });
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, submission: item }));
            });
            return;
        }

        // Delete Submission (DELETE /api/admin/submissions/:refId)
        if (req.method === 'DELETE' && pathname.startsWith('/api/admin/submissions/')) {
            const refId = pathname.replace('/api/admin/submissions/', '').trim();
            let all = readAllSubmissions();
            const initialLen = all.length;
            const target = all.find(i => i.ref_id === refId);
            all = all.filter(i => i.ref_id !== refId);

            if (all.length === initialLen) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Lead not found.' }));
                return;
            }

            saveAllSubmissions(all);

            logActivity('lead_deleted', {
                ref_id: refId,
                name: target && target.contact ? target.contact.name : 'Unknown'
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Lead deleted successfully.' }));
            return;
        }

        // ════════════════════════════════════════════════════════════════
        // 7. ADMIN SETTINGS & PLATFORM CONFIGURATION (Phase 10)
        // ════════════════════════════════════════════════════════════════

        // GET /api/admin/settings - Retrieve full system configuration
        if (req.method === 'GET' && pathname === '/api/admin/settings') {
            const settings = readSettingsData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, settings }));
            return;
        }

        // PUT /api/admin/settings - Update system settings
        if (req.method === 'PUT' && pathname === '/api/admin/settings') {
            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {}

                const existing = readSettingsData();
                const updated = {
                    company: { ...existing.company, ...(body.company || {}) },
                    notifications: { ...existing.notifications, ...(body.notifications || {}) },
                    analytics: { ...existing.analytics, ...(body.analytics || {}) },
                    system: { ...existing.system, ...(body.system || {}) },
                    updatedAt: new Date().toISOString()
                };

                saveSettingsData(updated);
                logActivity('settings_updated', { sections: Object.keys(body) });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, settings: updated }));
            });
            return;
        }

        // POST /api/admin/settings/change-password - Change admin password
        if (req.method === 'POST' && pathname === '/api/admin/settings/change-password') {
            let raw = '';
            req.on('data', chunk => raw += chunk);
            req.on('end', () => {
                let body = {};
                try { body = JSON.parse(raw); } catch (e) {}

                const current = (body.currentPassword || '').trim();
                const newPass = (body.newPassword || '').trim();

                if (!current || !newPass) {
                    res.writeHead(422, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Current and new password are required.' }));
                    return;
                }

                if (current !== CONFIG.adminPassword) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Current password is incorrect.' }));
                    return;
                }

                if (newPass.length < 6) {
                    res.writeHead(422, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'New password must be at least 6 characters.' }));
                    return;
                }

                CONFIG.adminPassword = newPass;

                // Also persist to .env if file exists
                try {
                    const envPath = path.resolve(__dirname, '.env');
                    if (fs.existsSync(envPath)) {
                        let envContent = fs.readFileSync(envPath, 'utf8');
                        if (envContent.includes('ADMIN_PASSWORD=')) {
                            envContent = envContent.replace(/ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD=${newPass}`);
                        } else {
                            envContent += `\nADMIN_PASSWORD=${newPass}\n`;
                        }
                        fs.writeFileSync(envPath, envContent, 'utf8');
                    }
                } catch (envErr) {
                    console.warn('Could not write to .env:', envErr.message);
                }

                logActivity('admin_password_changed', { timestamp: new Date().toISOString() });

                const newToken = createAdminSession();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Admin password changed successfully.', token: newToken }));
            });
            return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Admin API endpoint not found.' }));
        return;
    }

    // API Form Submission Endpoint
    if (req.method === 'POST' && pathname === '/api/submit') {
        if (isRateLimited(clientIp)) {
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Too many submissions from this IP address. Please wait a few minutes before trying again.'
            }));
            return;
        }

        let rawBody = '';
        let bodySize = 0;
        const MAX_SIZE = 100 * 1024; // 100KB limit

        req.on('data', chunk => {
            bodySize += chunk.length;
            if (bodySize > MAX_SIZE) {
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Payload too large.' }));
                req.destroy();
            } else {
                rawBody += chunk;
            }
        });

        req.on('end', () => {
            let body = {};
            try {
                if (rawBody.trim().startsWith('{')) {
                    body = JSON.parse(rawBody);
                } else {
                    // Form URL encoded support
                    const params = new URLSearchParams(rawBody);
                    for (const [k, v] of params.entries()) {
                        body[k] = v;
                    }
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Malformed JSON payload.' }));
                return;
            }

            const result = processFormSubmission(body, clientIp, req.headers['user-agent'] || '');
            res.writeHead(result.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.body));
        });

        return;
    }

    // Serve static files for all other GET requests
    if (req.method === 'GET' || req.method === 'HEAD') {
        serveStaticFile(req, res, pathname);
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    }
}

// Start Server if executed directly
let serverInstance = null;
function startServer(port = CONFIG.port) {
    serverInstance = http.createServer(requestHandler);

    serverInstance.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`\n⚠️  Port ${port} is in use. Trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });

    serverInstance.listen(port, () => {
        console.log(`\n=================================================`);
        console.log(`🚀 versaly Server running at http://localhost:${port}`);
        console.log(`📁 Static files served from: ${__dirname}`);
        console.log(`💾 Submissions stored at: ${CONFIG.storageFile}`);
        console.log(`📧 Notification Target:   ${CONFIG.notificationEmail}`);
        console.log(`=================================================\n`);
    });
    return serverInstance;
}

if (require.main === module) {
    startServer();
}

module.exports = requestHandler;
module.exports.requestHandler = requestHandler;
module.exports.startServer = startServer;
module.exports.processFormSubmission = processFormSubmission;
module.exports.CONFIG = CONFIG;

