/**
 * versaly Admin Control Center
 * Phase 7 — Product Management CMS & Conversion Intelligence
 */

(function () {
    'use strict';

    const TOKEN_KEY = 'versaly_admin_token';

    // App State
    let currentSubmissions = [];
    let currentProducts = [];
    let currentStats = null;
    let selectedLead = null;
    let activeTab = 'dashboard';
    let leadFilter = { type: 'all', status: 'all', priority: 'all', followup: 'all' };
    let productFilter = { status: 'all', category: 'all', search: '' };
    let editingProduct = null;
    let currentSettings = null;
    let currentAnalyticsRange = '30d';
    let currentAuditCategory = 'all';
    let currentAuditSearch = '';

    // --- DOM Elements ---
    // Auth & Views
    const loginView = document.getElementById('admin-login-view');
    const dashboardView = document.getElementById('admin-dashboard-view');
    const loginForm = document.getElementById('admin-login-form');
    const loginPassword = document.getElementById('admin-password');
    const loginError = document.getElementById('login-error');
    const loginSubmitBtn = document.getElementById('login-submit-btn');

    // Header & Sidebar
    const btnRefresh = document.getElementById('btn-refresh');
    const btnLogout = document.getElementById('btn-logout');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const adminSidebar = document.getElementById('admin-sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebarCloseMobile = document.getElementById('sidebar-close-mobile');
    const currentTabTitle = document.getElementById('admin-current-tab-title');

    // Sidebar Links & Badges
    const sidebarLinks = document.querySelectorAll('.admin-sidebar__link');
    const badgeProductsCount = document.getElementById('badge-products-count');
    const badgeLeadsCount = document.getElementById('badge-leads-count');

    // Tab 1: Dashboard Overview Elements
    const analyticsRangeGroup = document.getElementById('analytics-range-group');
    const btnExportExecReport = document.getElementById('btn-export-exec-report');
    const btnRefreshAnalytics = document.getElementById('btn-refresh-analytics');
    const metricProductsTotal = document.getElementById('metric-products-total');
    const metricProductsSub = document.getElementById('metric-products-sub');
    const metricTotal = document.getElementById('metric-total');
    const metricLeadsSub = document.getElementById('metric-leads-sub');
    const metricConversionRate = document.getElementById('metric-conversion-rate');
    const metricDealValue = document.getElementById('metric-deal-value');
    const metricVelocity = document.getElementById('metric-velocity');
    const metricVelocitySub = document.getElementById('metric-velocity-sub');
    const chartRangeLabel = document.getElementById('chart-range-label');
    const trendChartContainer = document.getElementById('trend-chart-container');
    const funnelContainer = document.getElementById('funnel-container');
    const funnelWonRevenue = document.getElementById('funnel-won-revenue');
    const channelsContainer = document.getElementById('channels-container');
    const pipelineProductCount = document.getElementById('pipeline-product-count');
    const insightsProductPipeline = document.getElementById('insights-product-pipeline');
    const insightsStatuses = document.getElementById('insights-statuses');
    const insightsProducts = document.getElementById('insights-products');
    const insightsIndustries = document.getElementById('insights-industries');
    const activityFeedList = document.getElementById('activity-feed-list');
    const auditFilterGroup = document.getElementById('audit-filter-group');
    const auditSearchInput = document.getElementById('audit-search-input');
    const auditTotalCount = document.getElementById('audit-total-count');
    const btnExportAuditCsv = document.getElementById('btn-export-audit-csv');
    const btnClearAuditLogs = document.getElementById('btn-clear-audit-logs');

    // Quick Actions
    const btnQuickAddProduct = document.getElementById('btn-quick-add-product');
    const btnQuickViewDemos = document.getElementById('btn-quick-view-demos');
    const btnQuickPublicCatalog = document.getElementById('btn-quick-public-catalog');

    // Tab 2: Products CMS Elements
    const btnAddProduct = document.getElementById('btn-add-product');
    const productFilterGroup = document.getElementById('product-filter-group');
    const productCategoryFilter = document.getElementById('product-category-filter');
    const productSearchInput = document.getElementById('product-search-input');
    const productsTbody = document.getElementById('products-tbody');

    // Product Editor Modal Elements
    const productModalBackdrop = document.getElementById('product-modal-backdrop');
    const productModalTitle = document.getElementById('product-modal-title');
    const productModalSlugPreview = document.getElementById('product-modal-slug-preview');
    const productModalCloseBtn = document.getElementById('product-modal-close-btn');
    const productModalCancelBtn = document.getElementById('prod-modal-cancel-btn');
    const productModalDraftBtn = document.getElementById('prod-modal-draft-btn');
    const productModalSaveBtn = document.getElementById('prod-modal-save-btn');
    const productModalDeleteBtn = document.getElementById('prod-modal-delete-btn');

    // Product Form Fields
    const prodOriginalId = document.getElementById('prod-original-id');
    const prodName = document.getElementById('prod-name');
    const prodId = document.getElementById('prod-id');
    const prodCategory = document.getElementById('prod-category');
    const prodStatus = document.getElementById('prod-status');
    const prodAccent = document.getElementById('prod-accent');
    const prodAccentPicker = document.getElementById('prod-accent-picker');
    const prodTagline = document.getElementById('prod-tagline');
    const prodFeatured = document.getElementById('prod-featured');
    const prodSpotlight = document.getElementById('prod-spotlight');
    const prodOrder = document.getElementById('prod-order');
    const prodShortDesc = document.getElementById('prod-short-desc');
    const prodFullDesc = document.getElementById('prod-full-desc');
    const prodProblem = document.getElementById('prod-problem');

    // Dynamic Form Containers
    const buildingItemsContainer = document.getElementById('building-items-container');
    const btnAddBuildingItem = document.getElementById('btn-add-building-item');
    const featuresContainer = document.getElementById('features-container');
    const btnAddFeature = document.getElementById('btn-add-feature');
    const benefitsContainer = document.getElementById('benefits-container');
    const btnAddBenefit = document.getElementById('btn-add-benefit');
    const audienceContainer = document.getElementById('audience-container');
    const btnAddAudience = document.getElementById('btn-add-audience');
    const relatedProductsCheckboxes = document.getElementById('related-products-checkboxes');

    // Product Modal Media & Screenshot Elements
    const prodFeaturedImage = document.getElementById('prod-featured-image');
    const prodFeaturedPreviewImg = document.getElementById('prod-featured-preview-img');
    const prodFeaturedPreviewEmpty = document.getElementById('prod-featured-preview-empty');
    const btnUploadFeaturedMedia = document.getElementById('btn-upload-featured-media');
    const prodFeaturedFileInput = document.getElementById('prod-featured-file-input');
    const btnPickFeaturedMedia = document.getElementById('btn-pick-featured-media');
    const btnClearFeaturedMedia = document.getElementById('btn-clear-featured-media');
    const screenshotsContainer = document.getElementById('screenshots-container');
    const btnUploadGalleryMedia = document.getElementById('btn-upload-gallery-media');
    const prodGalleryFileInput = document.getElementById('prod-gallery-file-input');
    const btnAddScreenshot = document.getElementById('btn-add-screenshot');
    const btnPickGalleryMedia = document.getElementById('btn-pick-gallery-media');

    // Tab 3: Leads & CRM Elements (Phase 10)
    const leadsCountBadge = document.getElementById('leads-count-badge');
    const btnLeadsExportCsv = document.getElementById('btn-leads-export-csv');
    const leadFilterGroup = document.getElementById('filter-group');
    const leadStageFilterGroup = document.getElementById('lead-stage-filter-group');
    const leadPriorityFilter = document.getElementById('lead-priority-filter');
    const leadFollowupFilter = document.getElementById('lead-followup-filter');
    const leadSearchInput = document.getElementById('admin-search');
    const leadsTbody = document.getElementById('leads-tbody');

    // Leads Drawer Elements
    const leadDrawerBackdrop = document.getElementById('lead-drawer-backdrop');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');
    const drawerRefId = document.getElementById('drawer-ref-id');
    const drawerBtnQuickEmail = document.getElementById('drawer-btn-quick-email');
    const drawerBtnAdvanceStage = document.getElementById('drawer-btn-advance-stage');
    const drawerName = document.getElementById('drawer-name');
    const drawerEmail = document.getElementById('drawer-email');
    const drawerCompany = document.getElementById('drawer-company');
    const drawerPhone = document.getElementById('drawer-phone');
    const drawerType = document.getElementById('drawer-type');
    const drawerDate = document.getElementById('drawer-date');
    const drawerProduct = document.getElementById('drawer-product');
    const drawerIndustry = document.getElementById('drawer-industry');
    const drawerGoal = document.getElementById('drawer-goal');
    const drawerMessage = document.getElementById('drawer-message');
    const drawerStatusSelect = document.getElementById('drawer-status-select');
    const drawerPrioritySelect = document.getElementById('drawer-priority-select');
    const drawerAssignedSelect = document.getElementById('drawer-assigned-select');
    const drawerFollowupInput = document.getElementById('drawer-followup-input');
    const drawerValueInput = document.getElementById('drawer-value-input');
    const drawerNotesThread = document.getElementById('drawer-notes-thread');
    const drawerNotesCount = document.getElementById('drawer-notes-count');
    const drawerNewNoteText = document.getElementById('drawer-new-note-text');
    const drawerBtnAddNote = document.getElementById('drawer-btn-add-note');
    const drawerTimelineEvents = document.getElementById('drawer-timeline-events');
    const drawerSource = document.getElementById('drawer-source');
    const drawerIp = document.getElementById('drawer-ip');
    const drawerSaveBtn = document.getElementById('drawer-save-btn');
    const drawerDeleteBtn = document.getElementById('drawer-delete-btn');

    // Tab 4: Media Library Elements (Phase 8)
    let currentMedia = [];
    let mediaFilter = { type: 'all', product: 'all', search: '' };
    let selectedMediaDetail = null;
    let mediaPickerCallback = null;
    let selectedPickerItem = null;

    const badgeMediaCount = document.getElementById('badge-media-count');
    const btnUploadMedia = document.getElementById('btn-upload-media');
    const mediaFileInput = document.getElementById('media-file-input');
    const metricMediaTotal = document.getElementById('metric-media-total');
    const metricMediaTotalSub = document.getElementById('metric-media-total-sub');
    const metricMediaStorage = document.getElementById('metric-media-storage');
    const metricMediaLinked = document.getElementById('metric-media-linked');
    const mediaDropzone = document.getElementById('media-dropzone');
    const mediaUploadProgress = document.getElementById('media-upload-progress');
    const mediaProgressFill = document.getElementById('media-progress-fill');
    const mediaProgressText = document.getElementById('media-progress-text');
    const mediaFilterGroup = document.getElementById('media-filter-group');
    const mediaProductFilter = document.getElementById('media-product-filter');
    const mediaSearchInput = document.getElementById('media-search-input');
    const mediaGridContainer = document.getElementById('media-grid-container');

    // Media Detail Modal Elements
    const mediaDetailBackdrop = document.getElementById('media-detail-backdrop');
    const mediaModalCloseBtn = document.getElementById('media-modal-close-btn');
    const mediaModalFilename = document.getElementById('media-modal-filename');
    const medDetailId = document.getElementById('med-detail-id');
    const medDetailImg = document.getElementById('med-detail-img');
    const medDetailFormatPill = document.getElementById('med-detail-format-pill');
    const medDetailSizePill = document.getElementById('med-detail-size-pill');
    const medDetailDimPill = document.getElementById('med-detail-dim-pill');
    const medDetailOpenLink = document.getElementById('med-detail-open-link');
    const medDetailTitle = document.getElementById('med-detail-title');
    const medDetailCaption = document.getElementById('med-detail-caption');
    const medDetailAlt = document.getElementById('med-detail-alt');
    const medDetailTags = document.getElementById('med-detail-tags');
    const medDetailLinkedProducts = document.getElementById('med-detail-linked-products');
    const medDetailDeleteBtn = document.getElementById('med-detail-delete-btn');
    const medDetailCopyUrlBtn = document.getElementById('med-detail-copy-url-btn');
    const medDetailCancelBtn = document.getElementById('med-detail-cancel-btn');
    const medDetailSaveBtn = document.getElementById('med-detail-save-btn');

    // Media Picker Modal Elements
    const mediaPickerBackdrop = document.getElementById('media-picker-backdrop');
    const mediaPickerCloseBtn = document.getElementById('media-picker-close-btn');
    const pickerFilterGroup = document.getElementById('picker-filter-group');
    const pickerSearchInput = document.getElementById('picker-search-input');
    const pickerGridContainer = document.getElementById('picker-grid-container');
    const pickerSelectionInfo = document.getElementById('picker-selection-info');
    const pickerCancelBtn = document.getElementById('picker-cancel-btn');
    const pickerConfirmBtn = document.getElementById('picker-confirm-btn');
    const pickerUploadBtn = document.getElementById('picker-upload-btn');
    const pickerFileInput = document.getElementById('picker-file-input');
    const pickerUploadStatus = document.getElementById('picker-upload-status');

    // Tab 5: Content & Trust CMS Elements (Phase 9)
    let currentContent = { testimonials: [], faqs: [], stats: [], values: [], partners: [] };
    let activeContentSubTab = 'testimonials';
    let contentFilter = { status: 'all', search: '' };
    let editingContentItem = null;

    const badgeContentCount = document.getElementById('badge-content-count');
    const badgeSubtabTestimonials = document.getElementById('badge-subtab-testimonials');
    const badgeSubtabFaqs = document.getElementById('badge-subtab-faqs');
    const badgeSubtabStats = document.getElementById('badge-subtab-stats');
    const badgeSubtabValues = document.getElementById('badge-subtab-values');
    const badgeSubtabPartners = document.getElementById('badge-subtab-partners');

    const btnAddContentItem = document.getElementById('btn-add-content-item');
    const btnAddContentText = document.getElementById('btn-add-content-text');
    const contentSubnavBtns = document.querySelectorAll('.admin-subnav-btn');
    const contentFilterGroup = document.getElementById('content-filter-group');
    const contentSearchInput = document.getElementById('content-search-input');
    const contentListContainer = document.getElementById('content-list-container');

    // Content Item Modal Elements
    const contentModalBackdrop = document.getElementById('content-modal-backdrop');
    const contentModalTitle = document.getElementById('content-modal-title');
    const contentModalSectionBadge = document.getElementById('content-modal-section-badge');
    const contentModalCloseBtn = document.getElementById('content-modal-close-btn');
    const contentModalCancelBtn = document.getElementById('content-modal-cancel-btn');
    const contentModalSaveBtn = document.getElementById('content-modal-save-btn');
    const contentModalDeleteBtn = document.getElementById('content-modal-delete-btn');

    // Form inputs
    const contentItemId = document.getElementById('content-item-id');
    const contentItemSection = document.getElementById('content-item-section');
    const contentItemStatus = document.getElementById('content-item-status');
    const contentItemOrder = document.getElementById('content-item-order');

    // Panels
    const panelFormTestimonials = document.getElementById('panel-form-testimonials');
    const panelFormFaqs = document.getElementById('panel-form-faqs');
    const panelFormStats = document.getElementById('panel-form-stats');
    const panelFormValues = document.getElementById('panel-form-values');
    const panelFormPartners = document.getElementById('panel-form-partners');

    // Testimonial fields
    const testAuthor = document.getElementById('test-author');
    const testRole = document.getElementById('test-role');
    const testCompany = document.getElementById('test-company');
    const testProduct = document.getElementById('test-product');
    const testRatingVal = document.getElementById('test-rating-val');
    const testRatingStars = document.getElementById('test-rating-stars');
    const testQuote = document.getElementById('test-quote');
    const testAvatar = document.getElementById('test-avatar');
    const btnPickTestAvatar = document.getElementById('btn-pick-test-avatar');
    const testFeatured = document.getElementById('test-featured');

    // FAQ fields
    const faqCategory = document.getElementById('faq-category');
    const faqQuestion = document.getElementById('faq-question');
    const faqAnswer = document.getElementById('faq-answer');

    // Stat fields
    const statVal = document.getElementById('stat-val');
    const statLabel = document.getElementById('stat-label');
    const statSubtext = document.getElementById('stat-subtext');
    const statIcon = document.getElementById('stat-icon');

    // Value fields
    const valTitle = document.getElementById('val-title');
    const valCategory = document.getElementById('val-category');
    const valDesc = document.getElementById('val-desc');
    const valIcon = document.getElementById('val-icon');

    // Partner fields
    const partnerName = document.getElementById('partner-name');
    const partnerIndustry = document.getElementById('partner-industry');
    const partnerLogo = document.getElementById('partner-logo');
    const btnPickPartnerLogo = document.getElementById('btn-pick-partner-logo');
    const partnerWebsite = document.getElementById('partner-website');

    // Tab 6: Settings & Health CMS Elements (Phase 10)
    const btnSaveSettings = document.getElementById('btn-save-settings');
    const setCompanyName = document.getElementById('set-company-name');
    const setCompanyTagline = document.getElementById('set-company-tagline');
    const setSupportEmail = document.getElementById('set-support-email');
    const setSalesEmail = document.getElementById('set-sales-email');
    const setCompanyPhone = document.getElementById('set-company-phone');
    const setCompanyAddress = document.getElementById('set-company-address');
    const setLinkedin = document.getElementById('set-linkedin');
    const setTwitter = document.getElementById('set-twitter');
    const setGithub = document.getElementById('set-github');
    const setEmailAlerts = document.getElementById('set-email-alerts');
    const setRecipientEmail = document.getElementById('set-recipient-email');
    const setWebhookEnabled = document.getElementById('set-webhook-enabled');
    const setWebhookUrl = document.getElementById('set-webhook-url');
    const setGaId = document.getElementById('set-ga-id');
    const setGtmId = document.getElementById('set-gtm-id');
    const setPrivacyBanner = document.getElementById('set-privacy-banner');
    const setMaintenanceMode = document.getElementById('set-maintenance-mode');
    const setStatusText = document.getElementById('set-status-text');
    const setMaintenanceMsg = document.getElementById('set-maintenance-msg');
    const pwdCurrent = document.getElementById('pwd-current');
    const pwdNew = document.getElementById('pwd-new');
    const pwdConfirm = document.getElementById('pwd-confirm');

    // Phase 18: Notification Center Elements
    const btnNotificationBell = document.getElementById('btn-notification-bell');
    const notificationBadge = document.getElementById('notification-badge');
    const notificationDrawer = document.getElementById('notification-drawer');
    const notifHeaderUnreadCount = document.getElementById('notif-header-unread-count');
    const btnMarkAllRead = document.getElementById('btn-mark-all-read');
    const btnClearAllNotifs = document.getElementById('btn-clear-all-notifs');
    const notificationList = document.getElementById('notification-list');
    const notifTabs = document.querySelectorAll('.admin-notif-tab');
    let currentNotifFilter = 'all';
    let currentNotifications = [];

    // Phase 18: Webhook Integrations Elements
    const btnAddWebhook = document.getElementById('btn-add-webhook');
    const webhooksListContainer = document.getElementById('webhooks-list-container');
    const webhookDeliveriesContainer = document.getElementById('webhook-deliveries-container');
    const btnRefreshDeliveries = document.getElementById('btn-refresh-deliveries');
    const webhookModal = document.getElementById('webhook-modal');
    const webhookModalBackdrop = document.getElementById('webhook-modal-backdrop');
    const webhookModalCloseBtn = document.getElementById('webhook-modal-close-btn');
    const webhookModalCancelBtn = document.getElementById('webhook-modal-cancel-btn');
    const webhookModalSaveBtn = document.getElementById('webhook-modal-save-btn');
    const webhookModalDeleteBtn = document.getElementById('webhook-modal-delete-btn');
    const webhookModalTitle = document.getElementById('webhook-modal-title');
    const webhookForm = document.getElementById('webhook-form');
    const hookEditId = document.getElementById('hook-edit-id');
    const hookName = document.getElementById('hook-name');
    const hookType = document.getElementById('hook-type');
    const hookActive = document.getElementById('hook-active');
    const hookUrl = document.getElementById('hook-url');
    const hookSecret = document.getElementById('hook-secret');
    const btnGenerateSecret = document.getElementById('btn-generate-secret');
    let currentWebhooks = [];

    // --- API & Auth Helpers ---
    function getApiUrl(path) {
        if (!path.startsWith('/')) path = '/' + path;
        if (window.location.protocol === 'file:') {
            return 'http://localhost:3005' + path;
        }
        return path;
    }

    function getToken() {
        try {
            return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
        } catch (e) {
            return null;
        }
    }

    function setToken(token) {
        if (token) {
            try { sessionStorage.setItem(TOKEN_KEY, token); } catch (e) {}
            try { localStorage.setItem(TOKEN_KEY, token); } catch (e) {}
        } else {
            try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
            try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
        }
    }

    async function authFetch(url, options = {}) {
        const token = getToken();
        if (!token) throw new Error('Unauthenticated');

        const targetUrl = getApiUrl(url);
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'x-admin-token': token,
            ...(options.headers || {})
        };

        const response = await fetch(targetUrl, { ...options, headers });
        if (response.status === 401) {
            setToken(null);
            showLogin();
            throw new Error('Session expired. Please log in again.');
        }
        return response;
    }

    // --- View Switching ---
    function showLogin() {
        if (loginView) loginView.style.display = 'flex';
        if (dashboardView) {
            dashboardView.classList.remove('is-visible');
            dashboardView.style.display = 'none';
        }
    }

    function showDashboard() {
        if (loginView) loginView.style.display = 'none';
        if (dashboardView) {
            dashboardView.classList.add('is-visible');
            dashboardView.style.display = 'flex';
        }
    }

    function switchTab(tabId) {
        activeTab = tabId;

        // Update sidebar links
        sidebarLinks.forEach(link => {
            if (link.dataset.tab === tabId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Update tab panes
        document.querySelectorAll('.admin-tab-pane').forEach(pane => {
            if (pane.id === 'tab-' + tabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        // Update Title
        const titles = {
            dashboard: 'Overview Dashboard',
            products: 'Product Management (CMS)',
            leads: 'Client Inquiries & Leads',
            media: 'Media Library & Assets',
            content: 'Trust & Content Management',
            settings: 'Settings & System Health'
        };
        if (currentTabTitle) {
            currentTabTitle.textContent = titles[tabId] || 'Admin Center';
        }

        // Close mobile sidebar if open
        if (adminSidebar) adminSidebar.classList.remove('is-open');
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('is-open');

        // Trigger tab specific data load if needed
        if (tabId === 'products') {
            renderProductsTable();
        } else if (tabId === 'leads') {
            renderLeadsTable();
        } else if (tabId === 'media') {
            renderMediaGrid();
        } else if (tabId === 'content') {
            renderContentSection();
        } else if (tabId === 'settings') {
            loadSettings();
        }
    }

    // --- Login Handlers ---
    async function handleLogin(e) {
        if (e && e.preventDefault) e.preventDefault();
        const password = (loginPassword ? loginPassword.value : '').trim();
        if (!password) {
            if (loginError) {
                loginError.textContent = 'Please enter the admin password.';
                loginError.classList.add('is-visible');
            }
            if (loginPassword) loginPassword.focus();
            return;
        }

        if (loginError) {
            loginError.textContent = '';
            loginError.classList.remove('is-visible');
        }
        if (loginSubmitBtn) {
            loginSubmitBtn.disabled = true;
            loginSubmitBtn.innerHTML = '<span>Verifying...</span>';
        }

        try {
            const loginUrl = getApiUrl('/api/admin/login');
            const res = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();

            if (res.ok && data.success && data.token) {
                setToken(data.token);
                if (loginPassword) loginPassword.value = '';
                showDashboard();
                await loadAllData();
            } else {
                if (loginError) {
                    loginError.textContent = data.error || 'Invalid password.';
                    loginError.classList.add('is-visible');
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            if (loginError) {
                loginError.textContent = 'Cannot connect to backend server. Make sure the server is running.';
                loginError.classList.add('is-visible');
            }
        } finally {
            if (loginSubmitBtn) {
                loginSubmitBtn.disabled = false;
                loginSubmitBtn.innerHTML = '<span>Unlock Control Center</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
            }
        }
    }

    // --- Data Loading ---
    async function loadAllData() {
        try {
            await Promise.all([
                loadStats(),
                loadProducts(),
                loadSubmissions(),
                loadMedia(),
                loadContent(),
                loadSettings(),
                loadAnalyticsTrends(currentAnalyticsRange),
                loadAuditLogs(currentAuditCategory, currentAuditSearch),
                loadNotifications(currentNotifFilter),
                loadWebhooks(),
                loadWebhookDeliveries()
            ]);
        } catch (err) {
            console.error('Error loading admin data:', err);
        }
    }

    async function loadStats() {
        try {
            const res = await authFetch('/api/admin/stats');
            const data = await res.json();
            if (data.success && data.stats) {
                currentStats = data.stats;
                renderDashboardMetrics(currentStats);
                renderInsights(currentStats);
            }
        } catch (e) {
            console.error('Stats error:', e);
        }
    }

    async function loadAnalyticsTrends(range = '30d') {
        currentAnalyticsRange = range;
        if (chartRangeLabel) {
            const labels = { '7d': 'Past 7 Days', '30d': 'Past 30 Days', '90d': 'Past 90 Days', 'all': 'All Time History' };
            chartRangeLabel.textContent = labels[range] || 'Past 30 Days';
        }

        try {
            const res = await authFetch(`/api/admin/analytics/trends?range=${encodeURIComponent(range)}`);
            const data = await res.json();
            if (data.success) {
                renderTrendChart(data.daily_series, data.summary);
                renderFunnel(data.funnel);
                renderChannels(data.channels, data.summary.total_leads);

                // Update Overview KPIs dynamically based on timeframe
                if (metricTotal) metricTotal.textContent = data.summary.total_leads || 0;
                if (metricLeadsSub) {
                    metricLeadsSub.textContent = `${data.summary.demo_requests || 0} demos • ${data.summary.contact_inquiries || 0} contact inquiries`;
                }
                if (metricConversionRate) {
                    metricConversionRate.textContent = (data.summary.conversion_rate || 0) + '%';
                }
                if (metricDealValue) {
                    metricDealValue.textContent = '$' + (data.summary.total_pipeline_value || 0).toLocaleString();
                }
                if (metricVelocitySub) {
                    metricVelocitySub.textContent = `${data.summary.won_count || 0} won deals ($${(data.summary.won_revenue || 0).toLocaleString()})`;
                }
            }
        } catch (e) {
            console.error('Analytics trends error:', e);
            if (trendChartContainer) {
                trendChartContainer.innerHTML = '<div class="admin-empty-table" style="padding: 2rem;">Could not load trend data.</div>';
            }
        }
    }

    async function loadAuditLogs(category = 'all', search = '') {
        currentAuditCategory = category;
        currentAuditSearch = search;
        if (!activityFeedList) return;

        try {
            const url = `/api/admin/audit?category=${encodeURIComponent(category)}&search=${encodeURIComponent(search)}&limit=50`;
            const res = await authFetch(url);
            const data = await res.json();
            if (data.success && data.activities) {
                renderAuditLogView(data.activities, data.total);
            }
        } catch (e) {
            console.error('Audit logs load error:', e);
            activityFeedList.innerHTML = '<div class="admin-empty-table" style="padding: 1.5rem;">Could not load audit log stream.</div>';
        }
    }

    async function loadProducts() {
        try {
            const res = await authFetch('/api/admin/products');
            const data = await res.json();
            if (data.success && data.products) {
                currentProducts = data.products;
                if (badgeProductsCount) badgeProductsCount.textContent = currentProducts.length;
                renderProductsTable();
            }
        } catch (e) {
            console.error('Products load error:', e);
        }
    }

    async function loadSubmissions() {
        try {
            const res = await authFetch('/api/admin/submissions');
            const data = await res.json();
            if (data.success && data.submissions) {
                currentSubmissions = data.submissions;
                if (badgeLeadsCount) badgeLeadsCount.textContent = currentSubmissions.length;
                renderLeadsTable();
            }
        } catch (e) {
            console.error('Submissions load error:', e);
        }
    }

    async function loadActivity() {
        await loadAuditLogs(currentAuditCategory, currentAuditSearch);
    }

    // ════════════════════════════════════════════════════════════════
    // PHASE 8: MEDIA LIBRARY & SCREENSHOT MANAGER CONTROLLER
    // ════════════════════════════════════════════════════════════════

    async function loadMedia() {
        try {
            const res = await authFetch('/api/admin/media');
            const data = await res.json();
            if (data.success && data.media) {
                currentMedia = data.media;
                if (badgeMediaCount) badgeMediaCount.textContent = currentMedia.length;
                if (metricMediaTotal) metricMediaTotal.textContent = data.total || currentMedia.length;
                if (metricMediaTotalSub) {
                    const svgCount = currentMedia.filter(m => m.mimeType === 'image/svg+xml' || (m.filename && m.filename.endsWith('.svg'))).length;
                    const rasterCount = currentMedia.length - svgCount;
                    metricMediaTotalSub.textContent = `${svgCount} SVGs • ${rasterCount} raster images`;
                }
                if (metricMediaStorage) {
                    const kb = Math.round((data.storageUsageBytes || 0) / 1024);
                    metricMediaStorage.textContent = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
                }
                if (metricMediaLinked) {
                    const linkedCount = currentMedia.filter(m => Array.isArray(m.linkedProducts) && m.linkedProducts.length > 0).length;
                    metricMediaLinked.textContent = linkedCount;
                }
                populateMediaProductFilter();
                renderMediaGrid();
            }
        } catch (e) {
            console.error('Media load error:', e);
        }
    }

    function populateMediaProductFilter() {
        if (!mediaProductFilter) return;
        const currentVal = mediaProductFilter.value;
        const prods = currentProducts || [];
        mediaProductFilter.innerHTML = '<option value="all">All Linked Products</option>' + prods.map(p => {
            return `<option value="${p.id}" ${currentVal === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`;
        }).join('');
    }

    function renderMediaGrid() {
        if (!mediaGridContainer) return;

        let filtered = [...currentMedia];

        // 1. Type Filter
        if (mediaFilter.type === 'svg') {
            filtered = filtered.filter(m => m.mimeType === 'image/svg+xml' || (m.filename && m.filename.endsWith('.svg')));
        } else if (mediaFilter.type === 'raster') {
            filtered = filtered.filter(m => m.mimeType !== 'image/svg+xml' && (!m.filename || !m.filename.endsWith('.svg')));
        } else if (mediaFilter.type === 'linked') {
            filtered = filtered.filter(m => Array.isArray(m.linkedProducts) && m.linkedProducts.length > 0);
        }

        // 2. Product Filter
        if (mediaFilter.product && mediaFilter.product !== 'all') {
            filtered = filtered.filter(m => Array.isArray(m.linkedProducts) && m.linkedProducts.some(p => p.id === mediaFilter.product));
        }

        // 3. Search Filter
        if (mediaFilter.search) {
            const q = mediaFilter.search.toLowerCase();
            filtered = filtered.filter(m => {
                const title = (m.title || '').toLowerCase();
                const fn = (m.filename || '').toLowerCase();
                const cap = (m.caption || '').toLowerCase();
                const tags = Array.isArray(m.tags) ? m.tags.join(' ').toLowerCase() : '';
                return title.includes(q) || fn.includes(q) || cap.includes(q) || tags.includes(q);
            });
        }

        if (filtered.length === 0) {
            mediaGridContainer.innerHTML = `
                <div class="admin-empty-table" style="grid-column: 1 / -1; padding: 3rem;">
                    <div style="font-size:2rem; margin-bottom:0.5rem;">🖼️</div>
                    <div style="font-weight:600; color:var(--adm-text); margin-bottom:0.25rem;">No media assets found</div>
                    <div style="font-size:0.85rem; color:var(--adm-text-subtle);">Try changing your search terms or upload new visual assets above.</div>
                </div>
            `;
            return;
        }

        mediaGridContainer.innerHTML = filtered.map(m => {
            const isSvg = m.mimeType === 'image/svg+xml' || (m.filename && m.filename.endsWith('.svg'));
            const extLabel = isSvg ? 'SVG' : (m.mimeType ? m.mimeType.split('/')[1].toUpperCase() : 'IMG');
            const sizeLabel = m.size ? (m.size > 1024 * 1024 ? `${(m.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(m.size / 1024)} KB`) : '-';
            const linkedBadges = (m.linkedProducts || []).map(p => {
                return `<span class="admin-linked-prod-pill">${escapeHtml(p.name)}</span>`;
            }).join('');
            const tagsHtml = (m.tags || []).slice(0, 3).map(t => `<span class="admin-tag-pill">#${escapeHtml(t)}</span>`).join('');

            return `
                <div class="admin-media-card" data-media-id="${m.id}">
                    <div class="admin-media-card__thumb-wrap" data-action="view-media" data-id="${m.id}">
                        <img src="${escapeHtml(m.url)}" alt="${escapeHtml(m.alt || m.title)}" class="admin-media-card__thumb" loading="lazy">
                        <span class="admin-media-card__badge-ext">${extLabel}</span>
                        <span class="admin-media-card__badge-size">${sizeLabel}</span>
                    </div>
                    <div class="admin-media-card__body">
                        <div class="admin-media-card__title" title="${escapeHtml(m.title || m.originalName)}">${escapeHtml(m.title || m.originalName)}</div>
                        <div class="admin-media-card__filename" title="${escapeHtml(m.filename)}">${escapeHtml(m.filename)}</div>
                        <div class="admin-media-card__caption">${escapeHtml(m.caption || 'No caption provided.')}</div>
                        ${tagsHtml ? `<div class="admin-media-card__tags">${tagsHtml}</div>` : ''}
                        ${linkedBadges ? `<div class="admin-linked-prods-list" style="margin-top:0.35rem;">${linkedBadges}</div>` : ''}
                    </div>
                    <div class="admin-media-card__footer">
                        <button type="button" class="admin-btn-icon" data-action="copy-url" data-url="${escapeHtml(m.url)}" title="Copy asset URL">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            <span>Copy URL</span>
                        </button>
                        <div style="display:flex; gap:0.35rem;">
                            <button type="button" class="admin-btn-icon" data-action="edit-media" data-id="${m.id}" title="Edit metadata & captions">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button type="button" class="admin-btn-icon danger" data-action="delete-media" data-id="${m.id}" title="Delete media asset">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- File Upload Processing ---
    async function uploadSingleFile(file) {
        const base64 = await readFileAsBase64(file);
        const payload = {
            originalName: file.name,
            mimeType: file.type || 'image/png',
            base64: base64,
            size: file.size,
            title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
        };

        const res = await authFetch('/api/admin/media/upload', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success && data.media) {
            const idx = currentMedia.findIndex(m => m.id === data.media.id);
            if (idx !== -1) currentMedia[idx] = data.media;
            else currentMedia.unshift(data.media);
            if (badgeMediaCount) badgeMediaCount.textContent = currentMedia.length;
            if (metricMediaTotal) metricMediaTotal.textContent = currentMedia.length;
            return data.media;
        } else {
            throw new Error((data && data.error) || 'Upload error');
        }
    }

    async function uploadFiles(files) {
        if (!files || files.length === 0) return;

        if (mediaUploadProgress) mediaUploadProgress.style.display = 'block';
        if (mediaProgressFill) mediaProgressFill.style.width = '10%';
        if (mediaProgressText) mediaProgressText.textContent = `Uploading ${files.length} visual asset${files.length > 1 ? 's' : ''}...`;

        let uploadedCount = 0;
        let errors = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                await uploadSingleFile(file);
                uploadedCount++;
            } catch (err) {
                errors.push(`${file.name}: ${err.message}`);
            }

            if (mediaProgressFill) {
                const pct = Math.round(((i + 1) / files.length) * 100);
                mediaProgressFill.style.width = pct + '%';
            }
        }

        setTimeout(async () => {
            if (mediaUploadProgress) mediaUploadProgress.style.display = 'none';
            if (mediaProgressFill) mediaProgressFill.style.width = '0%';
            if (errors.length > 0) {
                alert('Upload finished with errors:\n' + errors.join('\n'));
            }
            await loadAllData();
        }, 500);
    }

    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // --- Media Asset Details Modal ---
    function openMediaDetailModal(mediaId) {
        const item = currentMedia.find(m => m.id === mediaId);
        if (!item) return;

        selectedMediaDetail = item;
        if (medDetailId) medDetailId.value = item.id;
        if (mediaModalFilename) mediaModalFilename.textContent = item.filename;
        if (medDetailImg) {
            medDetailImg.src = item.url;
            medDetailImg.alt = item.alt || item.title;
        }
        if (medDetailOpenLink) medDetailOpenLink.href = item.url;
        if (medDetailFormatPill) {
            const isSvg = item.mimeType === 'image/svg+xml' || (item.filename && item.filename.endsWith('.svg'));
            medDetailFormatPill.textContent = isSvg ? 'SVG Vector' : (item.mimeType ? item.mimeType.split('/')[1].toUpperCase() : 'Image');
        }
        if (medDetailSizePill) {
            const kb = Math.round((item.size || 0) / 1024);
            medDetailSizePill.textContent = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
        }
        if (medDetailDimPill) {
            medDetailDimPill.textContent = `${item.width || 1200} x ${item.height || 750} px`;
        }
        if (medDetailTitle) medDetailTitle.value = item.title || '';
        if (medDetailCaption) medDetailCaption.value = item.caption || '';
        if (medDetailAlt) medDetailAlt.value = item.alt || '';
        if (medDetailTags) medDetailTags.value = Array.isArray(item.tags) ? item.tags.join(', ') : '';

        // Linked Products List
        if (medDetailLinkedProducts) {
            if (Array.isArray(item.linkedProducts) && item.linkedProducts.length > 0) {
                medDetailLinkedProducts.innerHTML = item.linkedProducts.map(p => {
                    return `<span class="admin-linked-prod-pill">${escapeHtml(p.name)} (${escapeHtml(p.category)})</span>`;
                }).join('');
            } else {
                medDetailLinkedProducts.innerHTML = '<span style="font-size:0.8rem; color:var(--adm-text-subtle);">Not linked to any products currently.</span>';
            }
        }

        if (mediaDetailBackdrop) {
            mediaDetailBackdrop.classList.add('is-open');
            mediaDetailBackdrop.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeMediaDetailModal() {
        if (mediaDetailBackdrop) {
            mediaDetailBackdrop.classList.remove('is-open');
            mediaDetailBackdrop.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
        selectedMediaDetail = null;
    }

    async function saveMediaDetail() {
        if (!selectedMediaDetail) return;
        const id = selectedMediaDetail.id;

        const payload = {
            title: medDetailTitle ? medDetailTitle.value.trim() : '',
            caption: medDetailCaption ? medDetailCaption.value.trim() : '',
            alt: medDetailAlt ? medDetailAlt.value.trim() : '',
            tags: medDetailTags ? medDetailTags.value.split(',').map(t => t.trim()).filter(Boolean) : []
        };

        if (medDetailSaveBtn) medDetailSaveBtn.disabled = true;

        try {
            const res = await authFetch(`/api/admin/media/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                closeMediaDetailModal();
                await loadAllData();
            } else {
                alert('Error saving media metadata: ' + (data.error || 'Server error'));
            }
        } catch (err) {
            alert('Connection error: ' + err.message);
        } finally {
            if (medDetailSaveBtn) medDetailSaveBtn.disabled = false;
        }
    }

    async function deleteMediaItem(mediaId) {
        const item = currentMedia.find(m => m.id === mediaId);
        const name = item ? (item.title || item.filename) : 'this asset';
        const confirmed = confirm(`Are you sure you want to permanently delete "${name}"? This file will be removed from disk.`);
        if (!confirmed) return;

        try {
            const res = await authFetch(`/api/admin/media/${mediaId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                closeMediaDetailModal();
                await loadAllData();
            } else {
                alert('Error deleting media asset: ' + (data.error || 'Server error'));
            }
        } catch (err) {
            alert('Connection error: ' + err.message);
        }
    }

    // --- Reusable Media Picker Modal ---
    function openMediaPicker(callback) {
        mediaPickerCallback = callback;
        selectedPickerItem = null;
        if (pickerConfirmBtn) pickerConfirmBtn.disabled = true;
        if (pickerSelectionInfo) pickerSelectionInfo.textContent = 'No asset selected';
        renderPickerGrid('all', '');

        if (mediaPickerBackdrop) {
            mediaPickerBackdrop.classList.add('is-open');
            mediaPickerBackdrop.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeMediaPicker() {
        if (mediaPickerBackdrop) {
            mediaPickerBackdrop.classList.remove('is-open');
            mediaPickerBackdrop.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
        mediaPickerCallback = null;
        selectedPickerItem = null;
    }

    function renderPickerGrid(filterType = 'all', searchQuery = '') {
        if (!pickerGridContainer) return;
        let list = [...currentMedia];

        if (filterType === 'svg') {
            list = list.filter(m => m.mimeType === 'image/svg+xml' || (m.filename && m.filename.endsWith('.svg')));
        } else if (filterType === 'raster') {
            list = list.filter(m => m.mimeType !== 'image/svg+xml' && (!m.filename || !m.filename.endsWith('.svg')));
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(m => {
                const title = (m.title || '').toLowerCase();
                const fn = (m.filename || '').toLowerCase();
                return title.includes(q) || fn.includes(q);
            });
        }

        if (list.length === 0) {
            pickerGridContainer.innerHTML = '<div class="admin-empty-table" style="grid-column: 1 / -1; padding: 2rem;">No visual assets found</div>';
            return;
        }

        pickerGridContainer.innerHTML = list.map(m => {
            const isSelected = selectedPickerItem && selectedPickerItem.id === m.id;
            return `
                <div class="admin-picker-item ${isSelected ? 'selected' : ''}" data-picker-id="${m.id}">
                    <img src="${escapeHtml(m.url)}" alt="${escapeHtml(m.title)}" class="admin-picker-thumb">
                    <div class="admin-picker-label">${escapeHtml(m.title || m.filename)}</div>
                </div>
            `;
        }).join('');

        pickerGridContainer.querySelectorAll('.admin-picker-item').forEach(item => {
            item.addEventListener('click', () => {
                pickerGridContainer.querySelectorAll('.admin-picker-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                const id = item.dataset.pickerId;
                selectedPickerItem = currentMedia.find(m => m.id === id);
                if (pickerConfirmBtn) pickerConfirmBtn.disabled = false;
                if (pickerSelectionInfo && selectedPickerItem) {
                    pickerSelectionInfo.textContent = `Selected: ${selectedPickerItem.title || selectedPickerItem.filename}`;
                }
            });
        });
    }

    function confirmMediaPicker() {
        if (selectedPickerItem && typeof mediaPickerCallback === 'function') {
            mediaPickerCallback(selectedPickerItem);
        }
        closeMediaPicker();
    }

    // ════════════════════════════════════════════════════════════════
    // PHASE 9: CONTENT, TESTIMONIALS & TRUST CMS CONTROLLER
    // ════════════════════════════════════════════════════════════════

    async function loadContent() {
        try {
            const res = await authFetch('/api/admin/content');
            const data = await res.json();
            if (data.success && data.content) {
                currentContent = data.content;

                const tests = (currentContent.testimonials || []).length;
                const faqs = (currentContent.faqs || []).length;
                const stats = (currentContent.stats || []).length;
                const vals = (currentContent.values || []).length;
                const partners = (currentContent.partners || []).length;
                const total = tests + faqs + stats + vals + partners;

                if (badgeContentCount) badgeContentCount.textContent = total;
                if (badgeSubtabTestimonials) badgeSubtabTestimonials.textContent = tests;
                if (badgeSubtabFaqs) badgeSubtabFaqs.textContent = faqs;
                if (badgeSubtabStats) badgeSubtabStats.textContent = stats;
                if (badgeSubtabValues) badgeSubtabValues.textContent = vals;
                if (badgeSubtabPartners) badgeSubtabPartners.textContent = partners;

                populateTestimonialProductDropdown();
                renderContentSection();
            }
        } catch (e) {
            console.error('Content load error:', e);
        }
    }

    function switchContentSubTab(subTab) {
        activeContentSubTab = subTab;

        if (contentSubnavBtns) {
            contentSubnavBtns.forEach(btn => {
                const bSub = btn.dataset.contentSubtab || btn.dataset.subnav;
                if (bSub === subTab) btn.classList.add('active');
                else btn.classList.remove('active');
            });
        }

        const addLabels = {
            testimonials: 'Add Testimonial',
            faqs: 'Add FAQ',
            stats: 'Add Metric Stat',
            values: 'Add Pillar Value',
            partners: 'Add Partner Logo'
        };
        if (btnAddContentText) {
            btnAddContentText.textContent = addLabels[subTab] || 'Add Item';
        }

        renderContentSection();
    }

    function renderContentSection() {
        if (!contentListContainer) return;

        const rawList = currentContent[activeContentSubTab] || [];
        let filtered = [...rawList];

        // Status filter
        if (contentFilter.status && contentFilter.status !== 'all') {
            filtered = filtered.filter(item => (item.status || 'published') === contentFilter.status);
        }

        // Search filter
        if (contentFilter.search) {
            const q = contentFilter.search.toLowerCase();
            filtered = filtered.filter(item => {
                const author = (item.author || '').toLowerCase();
                const company = (item.company || '').toLowerCase();
                const quote = (item.quote || '').toLowerCase();
                const question = (item.question || '').toLowerCase();
                const answer = (item.answer || '').toLowerCase();
                const title = (item.title || '').toLowerCase();
                const label = (item.label || '').toLowerCase();
                const name = (item.name || '').toLowerCase();
                return author.includes(q) || company.includes(q) || quote.includes(q) || question.includes(q) || answer.includes(q) || title.includes(q) || label.includes(q) || name.includes(q);
            });
        }

        // Sort by order asc
        filtered.sort((a, b) => (a.order || 999) - (b.order || 999));

        if (filtered.length === 0) {
            contentListContainer.innerHTML = `
                <div class="admin-empty-table" style="padding: 3rem;">
                    <div style="font-size:2rem; margin-bottom:0.5rem;">📄</div>
                    <div style="font-weight:600; color:var(--adm-text); margin-bottom:0.25rem;">No items found in this section</div>
                    <div style="font-size:0.85rem; color:var(--adm-text-subtle);">Click "Add Item" above to create content for this section.</div>
                </div>
            `;
            return;
        }

        if (activeContentSubTab === 'testimonials') {
            renderTestimonialsList(filtered);
        } else if (activeContentSubTab === 'faqs') {
            renderFaqsList(filtered);
        } else if (activeContentSubTab === 'stats') {
            renderStatsList(filtered);
        } else if (activeContentSubTab === 'values') {
            renderValuesList(filtered);
        } else if (activeContentSubTab === 'partners') {
            renderPartnersList(filtered);
        }
    }

    // --- Sub-section Renderers ---
    function renderTestimonialsList(list) {
        contentListContainer.innerHTML = `
            <div class="admin-content-grid">
                ${list.map((item, idx) => {
                    const stars = '★'.repeat(item.rating || 5) + '☆'.repeat(Math.max(0, 5 - (item.rating || 5)));
                    const avatarUrl = item.avatar || '/assets/icons/favicon.svg';
                    const isDraft = item.status === 'draft';
                    return `
                        <div class="admin-content-card" data-content-id="${item.id}">
                            <div class="admin-content-card__header">
                                <div style="display:flex; align-items:center; gap:0.5rem;">
                                    <span class="admin-status-badge ${isDraft ? 'status-draft' : 'status-live'}">${isDraft ? 'Draft' : 'Published'}</span>
                                    ${item.featured ? '<span class="admin-tag-pill" style="color:#fbbf24; border-color:#fbbf24;">★ Spotlight</span>' : ''}
                                </div>
                                <div style="display:flex; gap:0.25rem;">
                                    <button type="button" class="admin-order-arrow-btn" data-action="order-content-up" data-id="${item.id}" ${idx === 0 ? 'disabled' : ''} title="Move up">▲</button>
                                    <button type="button" class="admin-order-arrow-btn" data-action="order-content-down" data-id="${item.id}" ${idx === list.length - 1 ? 'disabled' : ''} title="Move down">▼</button>
                                </div>
                            </div>
                            <div class="admin-content-card__stars">${stars}</div>
                            <div class="admin-content-card__quote">"${escapeHtml(item.quote)}"</div>
                            <div class="admin-content-card__author">
                                <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(item.author)}" class="admin-content-card__avatar">
                                <div style="flex:1;">
                                    <div class="admin-content-card__meta-name">${escapeHtml(item.author)}</div>
                                    <div class="admin-content-card__meta-role">${escapeHtml(item.role)}${item.company ? ' • ' + escapeHtml(item.company) : ''}</div>
                                </div>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--adm-border-subtle);">
                                <span style="font-size:0.75rem; color:var(--adm-text-subtle);">${escapeHtml(item.product || 'General')}</span>
                                <div style="display:flex; gap:0.35rem;">
                                    <button type="button" class="admin-btn-icon" data-action="edit-content" data-id="${item.id}" title="Edit testimonial">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button type="button" class="admin-btn-icon danger" data-action="delete-content" data-id="${item.id}" title="Delete testimonial">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderFaqsList(list) {
        contentListContainer.innerHTML = `
            <div class="admin-faq-accordion-list">
                ${list.map((item, idx) => {
                    const isDraft = item.status === 'draft';
                    return `
                        <div class="admin-faq-item-row" data-content-id="${item.id}">
                            <div style="display:flex; flex-direction:column; gap:0.25rem;">
                                <button type="button" class="admin-order-arrow-btn" data-action="order-content-up" data-id="${item.id}" ${idx === 0 ? 'disabled' : ''} title="Move up">▲</button>
                                <button type="button" class="admin-order-arrow-btn" data-action="order-content-down" data-id="${item.id}" ${idx === list.length - 1 ? 'disabled' : ''} title="Move down">▼</button>
                            </div>
                            <div style="flex:1;">
                                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
                                    <span class="admin-faq-cat-badge">${escapeHtml(item.category || 'General')}</span>
                                    <span class="admin-status-badge ${isDraft ? 'status-draft' : 'status-live'}">${isDraft ? 'Draft' : 'Published'}</span>
                                </div>
                                <div class="admin-faq-item-question">${escapeHtml(item.question)}</div>
                                <div class="admin-faq-item-answer">${escapeHtml(item.answer)}</div>
                            </div>
                            <div style="display:flex; gap:0.35rem;">
                                <button type="button" class="admin-btn-icon" data-action="edit-content" data-id="${item.id}" title="Edit FAQ">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button type="button" class="admin-btn-icon danger" data-action="delete-content" data-id="${item.id}" title="Delete FAQ">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderStatsList(list) {
        contentListContainer.innerHTML = `
            <div class="admin-content-grid">
                ${list.map((item, idx) => {
                    const isDraft = item.status === 'draft';
                    return `
                        <div class="admin-content-card" data-content-id="${item.id}">
                            <div class="admin-content-card__header">
                                <span class="admin-status-badge ${isDraft ? 'status-draft' : 'status-live'}">${isDraft ? 'Draft' : 'Published'}</span>
                                <div style="display:flex; gap:0.25rem;">
                                    <button type="button" class="admin-order-arrow-btn" data-action="order-content-up" data-id="${item.id}" ${idx === 0 ? 'disabled' : ''} title="Move up">▲</button>
                                    <button type="button" class="admin-order-arrow-btn" data-action="order-content-down" data-id="${item.id}" ${idx === list.length - 1 ? 'disabled' : ''} title="Move down">▼</button>
                                </div>
                            </div>
                            <div class="admin-stat-card-val">${escapeHtml(item.value)}</div>
                            <div style="font-weight:700; color:var(--adm-text); font-size:1rem; margin-bottom:0.25rem;">${escapeHtml(item.label)}</div>
                            <div style="font-size:0.8rem; color:var(--adm-text-subtle); flex:1;">${escapeHtml(item.subtext || '')}</div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--adm-border-subtle);">
                                <span class="admin-tag-pill">Icon: ${escapeHtml(item.icon || 'star')}</span>
                                <div style="display:flex; gap:0.35rem;">
                                    <button type="button" class="admin-btn-icon" data-action="edit-content" data-id="${item.id}" title="Edit metric">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button type="button" class="admin-btn-icon danger" data-action="delete-content" data-id="${item.id}" title="Delete metric">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderValuesList(list) {
        contentListContainer.innerHTML = `
            <div class="admin-content-grid">
                ${list.map((item, idx) => {
                    const isDraft = item.status === 'draft';
                    return `
                        <div class="admin-content-card" data-content-id="${item.id}">
                            <div class="admin-content-card__header">
                                <div style="display:flex; align-items:center; gap:0.5rem;">
                                    <span class="admin-status-badge ${isDraft ? 'status-draft' : 'status-live'}">${isDraft ? 'Draft' : 'Published'}</span>
                                    <span class="admin-tag-pill">${escapeHtml(item.category || 'core')}</span>
                                </div>
                                <div style="display:flex; gap:0.25rem;">
                                    <button type="button" class="admin-order-arrow-btn" data-action="order-content-up" data-id="${item.id}" ${idx === 0 ? 'disabled' : ''} title="Move up">▲</button>
                                    <button type="button" class="admin-order-arrow-btn" data-action="order-content-down" data-id="${item.id}" ${idx === list.length - 1 ? 'disabled' : ''} title="Move down">▼</button>
                                </div>
                            </div>
                            <div style="font-weight:700; color:var(--adm-text); font-size:1.05rem; margin-bottom:0.5rem;">${escapeHtml(item.title)}</div>
                            <div style="font-size:0.85rem; color:var(--adm-text-muted); line-height:1.55; flex:1;">${escapeHtml(item.description)}</div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--adm-border-subtle);">
                                <span class="admin-tag-pill">Icon: ${escapeHtml(item.icon || 'star')}</span>
                                <div style="display:flex; gap:0.35rem;">
                                    <button type="button" class="admin-btn-icon" data-action="edit-content" data-id="${item.id}" title="Edit value">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button type="button" class="admin-btn-icon danger" data-action="delete-content" data-id="${item.id}" title="Delete value">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderPartnersList(list) {
        contentListContainer.innerHTML = `
            <div class="admin-content-grid">
                ${list.map((item, idx) => {
                    const isDraft = item.status === 'draft';
                    const logoUrl = item.logo || '/assets/icons/favicon.svg';
                    return `
                        <div class="admin-content-card" data-content-id="${item.id}">
                            <div class="admin-content-card__header">
                                <span class="admin-status-badge ${isDraft ? 'status-draft' : 'status-live'}">${isDraft ? 'Draft' : 'Published'}</span>
                                <div style="display:flex; gap:0.25rem;">
                                    <button type="button" class="admin-order-arrow-btn" data-action="order-content-up" data-id="${item.id}" ${idx === 0 ? 'disabled' : ''} title="Move up">▲</button>
                                    <button type="button" class="admin-order-arrow-btn" data-action="order-content-down" data-id="${item.id}" ${idx === list.length - 1 ? 'disabled' : ''} title="Move down">▼</button>
                                </div>
                            </div>
                            <div class="admin-partner-logo-box">
                                <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(item.name)}">
                            </div>
                            <div style="font-weight:700; color:var(--adm-text); font-size:1rem; margin-bottom:0.25rem;">${escapeHtml(item.name)}</div>
                            <div style="font-size:0.8rem; color:var(--adm-text-subtle); flex:1;">${escapeHtml(item.industry || 'Industry Partner')}</div>
                            ${item.website ? `<a href="${escapeHtml(item.website)}" target="_blank" style="font-size:0.75rem; color:#818cf8; text-decoration:none; margin-top:0.25rem; display:inline-block;">Visit Website ↗</a>` : ''}
                            <div style="display:flex; justify-content:flex-end; align-items:center; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--adm-border-subtle);">
                                <div style="display:flex; gap:0.35rem;">
                                    <button type="button" class="admin-btn-icon" data-action="edit-content" data-id="${item.id}" title="Edit partner">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button type="button" class="admin-btn-icon danger" data-action="delete-content" data-id="${item.id}" title="Delete partner">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function populateTestimonialProductDropdown() {
        if (!testProduct) return;
        const currentVal = testProduct.value;
        const prods = currentProducts || [];
        testProduct.innerHTML = '<option value="">General (All Products)</option>' + prods.map(p => {
            return `<option value="${p.id}" ${currentVal === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`;
        }).join('');
    }

    function setRatingStarsValue(val = 5) {
        if (testRatingVal) testRatingVal.value = val;
        if (testRatingStars) {
            const btns = testRatingStars.querySelectorAll('.star-btn');
            btns.forEach(btn => {
                const r = parseInt(btn.dataset.rating, 10);
                if (r <= val) btn.classList.add('active');
                else btn.classList.remove('active');
            });
        }
    }

    // --- Content Item Modal (Open / Save / Delete) ---
    function openContentModal(section = 'testimonials', item = null) {
        editingContentItem = item;
        const isEdit = !!item;

        if (contentItemSection) contentItemSection.value = section;
        if (contentItemId) contentItemId.value = isEdit ? item.id : '';

        const sectionNames = {
            testimonials: 'Testimonial',
            faqs: 'FAQ Knowledge Item',
            stats: 'Conversion Stat',
            values: 'Pillar Value',
            partners: 'Partner / Client Logo'
        };
        const sectionLabel = sectionNames[section] || 'Item';

        if (contentModalTitle) contentModalTitle.textContent = isEdit ? `Edit ${sectionLabel}` : `Add New ${sectionLabel}`;
        if (contentModalSectionBadge) contentModalSectionBadge.textContent = sectionLabel;

        // Hide all panels, show active panel
        const panels = [panelFormTestimonials, panelFormFaqs, panelFormStats, panelFormValues, panelFormPartners];
        panels.forEach(p => { if (p) p.style.display = 'none'; });

        if (section === 'testimonials' && panelFormTestimonials) panelFormTestimonials.style.display = 'block';
        if (section === 'faqs' && panelFormFaqs) panelFormFaqs.style.display = 'block';
        if (section === 'stats' && panelFormStats) panelFormStats.style.display = 'block';
        if (section === 'values' && panelFormValues) panelFormValues.style.display = 'block';
        if (section === 'partners' && panelFormPartners) panelFormPartners.style.display = 'block';

        // Shared fields
        if (contentItemStatus) contentItemStatus.value = isEdit ? (item.status || 'published') : 'published';
        if (contentItemOrder) contentItemOrder.value = isEdit ? (item.order || 1) : ((currentContent[section] || []).length + 1);

        // Section specific values
        if (section === 'testimonials') {
            populateTestimonialProductDropdown();
            if (testAuthor) testAuthor.value = isEdit ? (item.author || '') : '';
            if (testRole) testRole.value = isEdit ? (item.role || '') : '';
            if (testCompany) testCompany.value = isEdit ? (item.company || '') : '';
            if (testProduct) testProduct.value = isEdit ? (item.productId || '') : '';
            if (testQuote) testQuote.value = isEdit ? (item.quote || '') : '';
            if (testAvatar) testAvatar.value = isEdit ? (item.avatar || '') : '';
            if (testFeatured) testFeatured.checked = isEdit ? Boolean(item.featured) : false;
            setRatingStarsValue(isEdit ? (item.rating || 5) : 5);
        } else if (section === 'faqs') {
            if (faqCategory) faqCategory.value = isEdit ? (item.category || 'general') : 'general';
            if (faqQuestion) faqQuestion.value = isEdit ? (item.question || '') : '';
            if (faqAnswer) faqAnswer.value = isEdit ? (item.answer || '') : '';
        } else if (section === 'stats') {
            if (statVal) statVal.value = isEdit ? (item.value || '') : '';
            if (statIcon) statIcon.value = isEdit ? (item.icon || 'star') : 'star';
            if (statLabel) statLabel.value = isEdit ? (item.label || '') : '';
            if (statSubtext) statSubtext.value = isEdit ? (item.subtext || '') : '';
        } else if (section === 'values') {
            if (valTitle) valTitle.value = isEdit ? (item.title || '') : '';
            if (valIcon) valIcon.value = isEdit ? (item.icon || 'star') : 'star';
            if (valCategory) valCategory.value = isEdit ? (item.category || 'core') : 'core';
            if (valDesc) valDesc.value = isEdit ? (item.description || '') : '';
        } else if (section === 'partners') {
            if (partnerName) partnerName.value = isEdit ? (item.name || '') : '';
            if (partnerIndustry) partnerIndustry.value = isEdit ? (item.industry || '') : '';
            if (partnerLogo) partnerLogo.value = isEdit ? (item.logo || '') : '';
            if (partnerWebsite) partnerWebsite.value = isEdit ? (item.website || '') : '';
        }

        if (contentModalDeleteBtn) {
            contentModalDeleteBtn.style.display = isEdit ? 'inline-flex' : 'none';
        }

        if (contentModalBackdrop) {
            contentModalBackdrop.classList.add('is-open');
            contentModalBackdrop.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeContentModal() {
        if (contentModalBackdrop) {
            contentModalBackdrop.classList.remove('is-open');
            contentModalBackdrop.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
        editingContentItem = null;
    }

    async function saveContentItem() {
        const section = contentItemSection ? contentItemSection.value : 'testimonials';
        const isEdit = !!contentItemId.value;
        const payload = {
            status: contentItemStatus ? contentItemStatus.value : 'published',
            order: contentItemOrder ? parseInt(contentItemOrder.value, 10) || 1 : 1
        };

        if (section === 'testimonials') {
            if (!testAuthor.value.trim() || !testQuote.value.trim()) {
                alert('Author name and testimonial quote are required.');
                return;
            }
            payload.author = testAuthor.value.trim();
            payload.role = testRole.value.trim();
            payload.company = testCompany.value.trim();
            payload.quote = testQuote.value.trim();
            payload.avatar = testAvatar.value.trim();
            payload.rating = testRatingVal ? parseInt(testRatingVal.value, 10) || 5 : 5;
            payload.productId = testProduct ? testProduct.value : '';
            if (testProduct && testProduct.selectedIndex >= 0) {
                payload.product = testProduct.options[testProduct.selectedIndex].text.replace(/ \(.*\)$/, '');
            }
            payload.featured = testFeatured ? testFeatured.checked : false;
        } else if (section === 'faqs') {
            if (!faqQuestion.value.trim() || !faqAnswer.value.trim()) {
                alert('Question and answer are required.');
                return;
            }
            payload.category = faqCategory ? faqCategory.value : 'general';
            payload.question = faqQuestion.value.trim();
            payload.answer = faqAnswer.value.trim();
        } else if (section === 'stats') {
            if (!statVal.value.trim() || !statLabel.value.trim()) {
                alert('Metric value and label are required.');
                return;
            }
            payload.value = statVal.value.trim();
            payload.label = statLabel.value.trim();
            payload.subtext = statSubtext.value.trim();
            payload.icon = statIcon ? statIcon.value.trim() || 'star' : 'star';
        } else if (section === 'values') {
            if (!valTitle.value.trim() || !valDesc.value.trim()) {
                alert('Value title and description are required.');
                return;
            }
            payload.title = valTitle.value.trim();
            payload.description = valDesc.value.trim();
            payload.icon = valIcon ? valIcon.value.trim() || 'star' : 'star';
            payload.category = valCategory ? valCategory.value : 'core';
        } else if (section === 'partners') {
            if (!partnerName.value.trim()) {
                alert('Partner name is required.');
                return;
            }
            payload.name = partnerName.value.trim();
            payload.industry = partnerIndustry.value.trim();
            payload.logo = partnerLogo.value.trim();
            payload.website = partnerWebsite.value.trim();
        }

        const url = isEdit ? `/api/admin/content/${section}/${contentItemId.value}` : `/api/admin/content/${section}`;
        const method = isEdit ? 'PUT' : 'POST';

        if (contentModalSaveBtn) contentModalSaveBtn.disabled = true;

        try {
            const res = await authFetch(url, {
                method,
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                closeContentModal();
                await loadContent();
            } else {
                alert('Error saving content: ' + (data.error || 'Server error'));
            }
        } catch (err) {
            alert('Connection error: ' + err.message);
        } finally {
            if (contentModalSaveBtn) contentModalSaveBtn.disabled = false;
        }
    }

    async function deleteContentItem(section, id) {
        const confirmed = confirm('Are you sure you want to delete this content item?');
        if (!confirmed) return;

        try {
            const res = await authFetch(`/api/admin/content/${section}/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                closeContentModal();
                await loadContent();
            } else {
                alert('Error deleting item: ' + (data.error || 'Server error'));
            }
        } catch (err) {
            alert('Connection error: ' + err.message);
        }
    }

    async function moveContentOrder(section, id, direction) {
        const list = [...(currentContent[section] || [])].sort((a, b) => (a.order || 999) - (b.order || 999));
        const index = list.findIndex(it => it.id === id);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            const temp = list[index];
            list[index] = list[index - 1];
            list[index - 1] = temp;
        } else if (direction === 'down' && index < list.length - 1) {
            const temp = list[index];
            list[index] = list[index + 1];
            list[index + 1] = temp;
        } else {
            return;
        }

        const itemIds = list.map(it => it.id);
        try {
            const res = await authFetch('/api/admin/content/reorder', {
                method: 'POST',
                body: JSON.stringify({ section, itemIds })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                await loadContent();
            }
        } catch (e) {
            console.error('Reorder error:', e);
        }
    }

    // --- Dashboard Overview Rendering ---
    // --- Dashboard Overview & Analytics Rendering ---
    function renderDashboardMetrics(stats) {
        if (!stats) return;

        // Products Metric
        if (metricProductsTotal) metricProductsTotal.textContent = stats.products_total || 0;
        if (metricProductsSub) {
            const live = (stats.product_pipeline && stats.product_pipeline.live) || 0;
            const dev = (stats.product_pipeline && stats.product_pipeline['in-development']) || 0;
            metricProductsSub.textContent = `${live} live • ${dev} in development`;
        }

        // Inquiries Metric
        if (metricTotal) metricTotal.textContent = stats.total_leads || 0;
        if (metricLeadsSub) {
            metricLeadsSub.textContent = `${stats.demo_requests || 0} demos • ${stats.contact_inquiries || 0} contact inquiries`;
        }

        // Conversion / Intent Rate
        if (metricConversionRate) metricConversionRate.textContent = (stats.conversion_rate || 0) + '%';

        // Deal Value Metric
        if (metricDealValue) {
            const val = stats.total_pipeline_value || stats.total_deal_value || 0;
            metricDealValue.textContent = '$' + val.toLocaleString();
        }

        // 30-Day Velocity
        if (metricVelocity) metricVelocity.textContent = stats.recent_30_days || 0;
        if (metricVelocitySub) {
            const won = (stats.statuses && (stats.statuses.closed_won || stats.statuses.closed)) || 0;
            metricVelocitySub.textContent = `${won} won deals in pipeline`;
        }
    }

    function renderTrendChart(series, summary) {
        if (!trendChartContainer) return;
        if (!series || series.length === 0) {
            trendChartContainer.innerHTML = '<div class="admin-empty-table" style="padding: 2.5rem;">No trend data available for this timeframe.</div>';
            return;
        }

        const width = 760;
        const height = 200;
        const padX = 40;
        const padTop = 20;
        const padBottom = 30;
        const chartW = width - padX * 2;
        const chartH = height - padTop - padBottom;

        const maxVal = Math.max(...series.map(s => s.total), 4);
        const count = series.length;
        const stepX = chartW / Math.max(count - 1, 1);

        // Points for Total Leads
        const pointsTotal = series.map((s, idx) => {
            const x = padX + idx * stepX;
            const y = padTop + chartH - (s.total / maxVal) * chartH;
            return { x, y, data: s };
        });

        // Points for Demo Requests
        const pointsDemos = series.map((s, idx) => {
            const x = padX + idx * stepX;
            const y = padTop + chartH - (s.demos / maxVal) * chartH;
            return { x, y, data: s };
        });

        const lineTotalD = pointsTotal.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
        const areaTotalD = lineTotalD + ` L ${pointsTotal[pointsTotal.length - 1].x} ${padTop + chartH} L ${pointsTotal[0].x} ${padTop + chartH} Z`;

        const lineDemosD = pointsDemos.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

        // Gridlines
        const gridYSteps = [0, 0.5, 1];
        const gridLines = gridYSteps.map(ratio => {
            const y = padTop + chartH - ratio * chartH;
            const val = Math.round(ratio * maxVal);
            return `
                <line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="rgba(148, 163, 184, 0.25)" stroke-dasharray="3,3" stroke-width="1" />
                <text x="${padX - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--adm-text-subtle, #94a3b8)">${val}</text>
            `;
        }).join('');

        // X Labels
        const labelInterval = count <= 8 ? 1 : count <= 32 ? Math.ceil(count / 7) : Math.ceil(count / 10);
        const xLabels = series.map((s, idx) => {
            if (idx % labelInterval === 0 || idx === count - 1) {
                const x = padX + idx * stepX;
                return `<text x="${x}" y="${height - 8}" text-anchor="middle" font-size="10" fill="var(--adm-text-subtle, #94a3b8)">${s.label}</text>`;
            }
            return '';
        }).join('');

        // Hover Dots
        const interactiveDots = pointsTotal.map((p, idx) => {
            const d = p.data;
            const demoY = pointsDemos[idx].y;
            return `
                <g class="chart-point-marker">
                    <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#6366f1" stroke="#ffffff" stroke-width="1.5" />
                    <circle cx="${p.x}" cy="${demoY}" r="3" fill="#10b981" stroke="#ffffff" stroke-width="1.5" />
                    <title>${d.label}: ${d.total} Inquiries (${d.demos} Demos, ${d.contacts} Contacts) | Value: $${(d.deal_value || 0).toLocaleString()}</title>
                </g>
            `;
        }).join('');

        trendChartContainer.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" class="admin-trend-svg" style="width:100%; height:auto; display:block;" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="leadAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.22" />
                        <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0" />
                    </linearGradient>
                </defs>
                ${gridLines}
                <path d="${areaTotalD}" fill="url(#leadAreaGradient)" />
                <path d="${lineTotalD}" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="${lineDemosD}" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                ${xLabels}
                ${interactiveDots}
            </svg>
        `;
    }

    function renderFunnel(funnel) {
        if (!funnelContainer) return;
        if (!funnel) {
            funnelContainer.innerHTML = '<div class="admin-empty-table" style="padding: 1.5rem;">No funnel metrics</div>';
            return;
        }

        if (funnelWonRevenue && typeof funnel.won_revenue === 'number') {
            funnelWonRevenue.textContent = '$' + funnel.won_revenue.toLocaleString() + ' Won';
        }

        const stages = [
            { label: 'Website Visitors (Est.)', count: funnel.visitors_est || 0, color: '#94a3b8' },
            { label: 'Catalogue Views (Est.)', count: funnel.catalogue_views_est || 0, color: '#38bdf8' },
            { label: 'Inbound Inquiries', count: funnel.inquiries || 0, color: '#6366f1' },
            { label: 'Qualified Leads', count: funnel.qualified_leads || 0, color: '#8b5cf6' },
            { label: 'Proposals Sent', count: funnel.proposals_sent || 0, color: '#f59e0b' },
            { label: 'Closed / Won Deals', count: funnel.deals_won || 0, color: '#10b981' }
        ];

        const baseMax = Math.max(stages[0].count, 1);

        funnelContainer.innerHTML = stages.map(st => {
            const pct = Math.max(Math.round((st.count / baseMax) * 100), st.count > 0 ? 5 : 0);
            return `
                <div class="admin-funnel-item" style="margin-bottom:0.75rem;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.25rem;">
                        <span style="font-weight:600; display:flex; align-items:center; gap:0.4rem;">
                            <span style="width:8px; height:8px; border-radius:50%; background:${st.color}; display:inline-block;"></span>
                            ${st.label}
                        </span>
                        <span style="color:var(--adm-text-muted); font-weight:600;">${st.count.toLocaleString()}</span>
                    </div>
                    <div class="admin-bar-track" style="height:7px;">
                        <div class="admin-bar-fill" style="width: ${pct}%; background: ${st.color}; height:100%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderChannels(channels, total) {
        if (!channelsContainer) return;
        if (!channels) {
            channelsContainer.innerHTML = '<div class="admin-empty-table" style="padding: 1.5rem;">No channel data</div>';
            return;
        }

        const list = [
            { key: 'demo_page', label: 'Demo Request Portal', count: channels.demo_page || 0, color: '#10b981' },
            { key: 'product_pages', label: 'Product Detail Pages', count: channels.product_pages || 0, color: '#6366f1' },
            { key: 'contact_page', label: 'General Contact Us', count: channels.contact_page || 0, color: '#3b82f6' },
            { key: 'roi_calculator', label: 'Interactive ROI Calculator', count: channels.roi_calculator || 0, color: '#f59e0b' },
            { key: 'direct', label: 'Direct / Organic Navigation', count: channels.direct || 0, color: '#8b5cf6' }
        ];

        const maxCh = Math.max(...list.map(l => l.count), 1);

        channelsContainer.innerHTML = list.map(ch => {
            const pct = Math.round((ch.count / maxCh) * 100);
            return `
                <div class="admin-bar-item">
                    <div class="admin-bar-info">
                        <span class="admin-bar-name" style="display:flex;align-items:center;gap:0.4rem;">
                            <span style="width:8px; height:8px; border-radius:50%; background:${ch.color}; display:inline-block;"></span>
                            ${ch.label}
                        </span>
                        <span class="admin-bar-val">${ch.count} lead${ch.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="admin-bar-track">
                        <div class="admin-bar-fill" style="width: ${pct}%; background: ${ch.color};"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderAuditLogView(items, total) {
        if (!activityFeedList) return;
        if (auditTotalCount) auditTotalCount.textContent = (total !== undefined ? total : (items ? items.length : 0)) + ' Events';

        if (!items || items.length === 0) {
            activityFeedList.innerHTML = '<div class="admin-empty-table" style="padding: 1.5rem;">No matching audit events logged.</div>';
            return;
        }

        const categoryPills = {
            auth: { label: 'Auth', bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6' },
            products: { label: 'Products', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
            leads: { label: 'Leads', bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
            media: { label: 'Media', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
            content: { label: 'Content', bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4' },
            settings: { label: 'Settings', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
            system: { label: 'System', bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' }
        };

        activityFeedList.innerHTML = items.map(act => {
            const cat = act.category || 'system';
            const pill = categoryPills[cat] || categoryPills.system;
            const timeAgo = formatTimeAgo(act.timestamp);
            const exactTime = formatDateTime(act.timestamp);

            let desc = (act.action || 'Action').replace(/_/g, ' ');
            desc = desc.charAt(0).toUpperCase() + desc.slice(1);

            let detailsSnippet = '';
            if (act.details && typeof act.details === 'object') {
                const keys = Object.keys(act.details).filter(k => k !== 'timestamp');
                if (keys.length > 0) {
                    detailsSnippet = keys.slice(0, 3).map(k => `${escapeHtml(k)}: <strong>${escapeHtml(String(act.details[k]))}</strong>`).join(' • ');
                }
            }

            return `
                <div class="admin-activity-item" style="padding: 0.85rem 1rem; border-bottom: 1px solid var(--adm-border, rgba(148,163,184,0.15)); display: flex; align-items: flex-start; gap: 0.85rem;">
                    <span class="admin-audit-badge" style="background:${pill.bg}; color:${pill.text}; font-size:0.7rem; font-weight:700; padding:0.2rem 0.55rem; border-radius:999px; white-space:nowrap; text-transform:uppercase; margin-top:0.15rem;">
                        ${pill.label}
                    </span>
                    <div class="admin-activity-content" style="flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                            <div class="admin-activity-title" style="font-weight:600; font-size:0.87rem; color:var(--adm-text);">
                                ${escapeHtml(desc)}
                            </div>
                            <div class="admin-activity-time" style="font-size:0.75rem; color:var(--adm-text-subtle);" title="${exactTime}">
                                ${timeAgo}
                            </div>
                        </div>
                        ${detailsSnippet ? `<div style="font-size:0.78rem; color:var(--adm-text-muted); margin-top:0.25rem;">${detailsSnippet}</div>` : ''}
                        <div style="font-size:0.72rem; color:var(--adm-text-subtle); margin-top:0.2rem;">User: <code>${escapeHtml(act.user || 'admin')}</code> • IP: <code>${escapeHtml(act.ip || '127.0.0.1')}</code></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderInsights(stats) {
        if (!stats) return;

        // 1. Product Pipeline Breakdown
        if (insightsProductPipeline) {
            const pipe = stats.product_pipeline || {};
            const totalProd = Math.max(stats.products_total || 1, 1);
            const stages = [
                { key: 'live', label: 'Live & Available', color: '#10b981', count: pipe.live || 0 },
                { key: 'in-development', label: 'In Development', color: '#3b82f6', count: pipe['in-development'] || 0 },
                { key: 'coming-soon', label: 'Coming Soon', color: '#f59e0b', count: pipe['coming-soon'] || 0 },
                { key: 'draft', label: 'Drafts', color: '#94a3b8', count: pipe.draft || 0 },
                { key: 'archived', label: 'Archived', color: '#ef4444', count: pipe.archived || 0 }
            ];

            if (pipelineProductCount) pipelineProductCount.textContent = (stats.products_total || 0) + ' items';

            insightsProductPipeline.innerHTML = stages.map(s => {
                const pct = Math.round((s.count / totalProd) * 100);
                return `
                    <div class="admin-bar-item">
                        <div class="admin-bar-info">
                            <span class="admin-bar-name" style="display:flex;align-items:center;gap:0.4rem;">
                                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};"></span>
                                ${s.label}
                            </span>
                            <span class="admin-bar-val">${s.count} (${pct}%)</span>
                        </div>
                        <div class="admin-bar-track">
                            <div class="admin-bar-fill" style="width: ${pct}%; background: ${s.color};"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 2. Lead Pipeline Stages
        if (insightsStatuses) {
            const statusMap = [
                { key: 'new', label: 'New (Uncontacted)', color: '#06b6d4', count: (stats.statuses && stats.statuses.new) || 0 },
                { key: 'in_review', label: 'In Review', color: '#f59e0b', count: (stats.statuses && stats.statuses.in_review) || 0 },
                { key: 'contacted', label: 'Contacted', color: '#7c3aed', count: (stats.statuses && stats.statuses.contacted) || 0 },
                { key: 'closed', label: 'Closed / Won', color: '#10b981', count: (stats.statuses && stats.statuses.closed) || 0 }
            ];
            const totalStatus = stats.total_leads || 1;
            insightsStatuses.innerHTML = statusMap.map(item => {
                const pct = stats.total_leads ? Math.round((item.count / totalStatus) * 100) : 0;
                return `
                    <div class="admin-bar-item">
                        <div class="admin-bar-info">
                            <span class="admin-bar-name" style="display:flex;align-items:center;gap:0.4rem;">
                                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${item.color};"></span>
                                ${item.label}
                            </span>
                            <span class="admin-bar-val">${item.count} (${pct}%)</span>
                        </div>
                        <div class="admin-bar-track">
                            <div class="admin-bar-fill" style="width: ${pct}%; background: ${item.color};"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 3. Product Demand from Leads
        if (insightsProducts) {
            const prodEntries = Object.entries(stats.products || {}).sort((a, b) => b[1] - a[1]);
            if (prodEntries.length === 0) {
                insightsProducts.innerHTML = '<div class="admin-empty-table" style="padding: 1.5rem;">No product inquiries yet</div>';
            } else {
                const maxProd = Math.max(...prodEntries.map(e => e[1]), 1);
                insightsProducts.innerHTML = prodEntries.map(([name, count]) => {
                    const pct = Math.round((count / maxProd) * 100);
                    return `
                        <div class="admin-bar-item">
                            <div class="admin-bar-info">
                                <span class="admin-bar-name">${escapeHtml(name)}</span>
                                <span class="admin-bar-val">${count} lead${count > 1 ? 's' : ''}</span>
                            </div>
                            <div class="admin-bar-track">
                                <div class="admin-bar-fill" style="width: ${pct}%"></div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // 4. Target Industries
        if (insightsIndustries) {
            const indEntries = Object.entries(stats.industries || {}).sort((a, b) => b[1] - a[1]);
            if (indEntries.length === 0) {
                insightsIndustries.innerHTML = '<div class="admin-empty-table" style="padding: 1.5rem;">No industry data yet</div>';
            } else {
                const maxInd = Math.max(...indEntries.map(e => e[1]), 1);
                insightsIndustries.innerHTML = indEntries.map(([name, count]) => {
                    const pct = Math.round((count / maxInd) * 100);
                    const prettyName = name.charAt(0).toUpperCase() + name.slice(1);
                    return `
                        <div class="admin-bar-item">
                            <div class="admin-bar-info">
                                <span class="admin-bar-name">${escapeHtml(prettyName)}</span>
                                <span class="admin-bar-val">${count} lead${count > 1 ? 's' : ''}</span>
                            </div>
                            <div class="admin-bar-track">
                                <div class="admin-bar-fill" style="width: ${pct}%; background: linear-gradient(90deg, #06b6d4, #3b82f6);"></div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    // --- Products CMS Table Rendering ---
    function renderProductsTable() {
        if (!productsTbody) return;

        const searchTerm = (productSearchInput ? productSearchInput.value : '').toLowerCase().trim();
        const selectedCat = productCategoryFilter ? productCategoryFilter.value : 'all';

        let filtered = currentProducts.filter(p => {
            if (productFilter.status !== 'all' && p.status !== productFilter.status) return false;
            if (selectedCat !== 'all' && (p.category || '').toLowerCase() !== selectedCat.toLowerCase()) return false;
            if (searchTerm) {
                const name = (p.name || '').toLowerCase();
                const id = (p.id || '').toLowerCase();
                const tag = (p.tagline || '').toLowerCase();
                const cat = (p.category || '').toLowerCase();
                if (!name.includes(searchTerm) && !id.includes(searchTerm) && !tag.includes(searchTerm) && !cat.includes(searchTerm)) {
                    return false;
                }
            }
            return true;
        });

        // Sort by order ascending
        filtered.sort((a, b) => (a.order || 99) - (b.order || 99));

        if (filtered.length === 0) {
            productsTbody.innerHTML = '<tr><td colspan="7" class="admin-empty-table">No matching products found.</td></tr>';
            return;
        }

        productsTbody.innerHTML = filtered.map((prod, index) => {
            const accent = prod.accent || prod.accentColor || '#4f46e5';
            const status = prod.status || 'in-development';
            const statusClass = 'status-' + status;
            const featuredBadge = prod.featured ? '<span title="Featured on Homepage" style="cursor:help; margin-right:4px;">⭐</span>' : '';
            const spotlightBadge = prod.spotlight ? '<span title="Spotlight Hero" style="cursor:help;">🎯</span>' : '';
            const visText = (!prod.featured && !prod.spotlight) ? '<span style="color:var(--adm-text-subtle); font-size:0.75rem;">Standard</span>' : `${featuredBadge}${spotlightBadge}`;
            const leadsCount = prod.inquiries_count || 0;

            return `
                <tr data-product-id="${prod.id}">
                    <td style="text-align:center;">
                        <div class="admin-order-btns">
                            <button class="admin-order-btn" data-action="order-up" data-id="${prod.id}" title="Move Up" ${index === 0 ? 'disabled' : ''}>▲</button>
                            <span style="font-size:0.75rem; font-weight:700; color:var(--adm-text-subtle);">${prod.order || (index + 1)}</span>
                            <button class="admin-order-btn" data-action="order-down" data-id="${prod.id}" title="Move Down" ${index === filtered.length - 1 ? 'disabled' : ''}>▼</button>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; gap:0.65rem;">
                            <span style="width:10px; height:10px; border-radius:50%; background:${accent}; flex-shrink:0;"></span>
                            <div>
                                <div style="font-weight: 600; color: var(--adm-text);">${escapeHtml(prod.name)}</div>
                                <span class="admin-ref-id" style="font-size: 0.72rem;">/${escapeHtml(prod.id)}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="admin-badge-cat">${escapeHtml(prod.category || 'General')}</span>
                    </td>
                    <td>
                        <select class="admin-status-select-inline" data-action="change-status" data-id="${prod.id}">
                            <option value="live" ${status === 'live' ? 'selected' : ''}>Live</option>
                            <option value="in-development" ${status === 'in-development' ? 'selected' : ''}>In Development</option>
                            <option value="coming-soon" ${status === 'coming-soon' ? 'selected' : ''}>Coming Soon</option>
                            <option value="draft" ${status === 'draft' ? 'selected' : ''}>Draft</option>
                            <option value="archived" ${status === 'archived' ? 'selected' : ''}>Archived</option>
                        </select>
                    </td>
                    <td>
                        <div style="font-size: 0.85rem;">${visText}</div>
                    </td>
                    <td>
                        <span style="font-weight: 600; color: ${leadsCount > 0 ? '#38bdf8' : 'var(--adm-text-subtle)'}; font-size: 0.82rem;">
                            ${leadsCount} inquiry${leadsCount === 1 ? '' : 'ies'}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        <button class="admin-view-btn" data-action="edit-product" data-id="${prod.id}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            <span>Edit</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // --- Product Editor Modal Logic ---
    function openProductModal(product = null) {
        editingProduct = product;

        if (product) {
            productModalTitle.textContent = 'Edit Product: ' + product.name;
            if (productModalSlugPreview) productModalSlugPreview.textContent = '/' + product.id;
            prodOriginalId.value = product.id;
            prodName.value = product.name || '';
            prodId.value = product.id || '';
            prodId.disabled = true; // slug locked when editing
            prodCategory.value = product.category || 'Hospitality';
            prodStatus.value = product.status || 'in-development';
            prodAccent.value = product.accent || product.accentColor || '#4f46e5';
            prodAccentPicker.value = product.accent || product.accentColor || '#4f46e5';
            prodTagline.value = product.tagline || '';
            prodFeatured.checked = !!product.featured;
            prodSpotlight.checked = !!product.spotlight;
            prodOrder.value = product.order || 1;
            prodShortDesc.value = product.shortDescription || '';
            prodFullDesc.value = product.fullDescription || product.description || '';
            prodProblem.value = product.problem || '';

            // Featured Image & Screenshot Gallery
            if (prodFeaturedImage) prodFeaturedImage.value = product.featuredImage || '';
            updateFeaturedPreview(product.featuredImage || '');
            populateScreenshotCards(product.screenshots || []);

            // Dynamic sections
            populateBuildingItems(product.whatWeAreBuilding || []);
            populateFeatureCards(product.features || []);
            populateBenefitCards(product.benefits || []);
            populateAudienceCards(product.audience || product.targetAudience || []);
            populateRelatedProducts(product.relatedIds || product.relatedProducts || [], product.id);

            if (productModalDeleteBtn) productModalDeleteBtn.style.display = 'inline-flex';
        } else {
            productModalTitle.textContent = 'Add New Product';
            if (productModalSlugPreview) productModalSlugPreview.textContent = 'New Product';
            prodOriginalId.value = '';
            prodName.value = '';
            prodId.value = '';
            prodId.disabled = false;
            prodCategory.value = 'Hospitality';
            prodStatus.value = 'in-development';
            prodAccent.value = '#4f46e5';
            prodAccentPicker.value = '#4f46e5';
            prodTagline.value = '';
            prodFeatured.checked = false;
            prodSpotlight.checked = false;
            prodOrder.value = (currentProducts.length + 1);
            prodShortDesc.value = '';
            prodFullDesc.value = '';
            prodProblem.value = '';

            if (prodFeaturedImage) prodFeaturedImage.value = '';
            updateFeaturedPreview('');
            populateScreenshotCards([
                { layout: 'dashboard', label: 'Dashboard Overview', caption: '', skin: 'browser' }
            ]);

            populateBuildingItems(['']);
            populateFeatureCards([{ icon: 'star', title: '', description: '' }]);
            populateBenefitCards([{ icon: 'zap', title: '', description: '' }]);
            populateAudienceCards([{ icon: 'users', title: '', description: '' }]);
            populateRelatedProducts([], null);

            if (productModalDeleteBtn) productModalDeleteBtn.style.display = 'none';
        }

        if (productModalBackdrop) {
            productModalBackdrop.classList.add('is-open');
            productModalBackdrop.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeProductModal() {
        if (productModalBackdrop) {
            productModalBackdrop.classList.remove('is-open');
            productModalBackdrop.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
        editingProduct = null;
    }

    // Auto slug generation for new products
    if (prodName) {
        prodName.addEventListener('input', function () {
            if (!prodOriginalId.value) { // only auto-slug if creating
                const slug = prodName.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
                prodId.value = slug;
                if (productModalSlugPreview) productModalSlugPreview.textContent = slug ? '/' + slug : '';
            }
        });
    }
    if (prodId) {
        prodId.addEventListener('input', function () {
            const cleanSlug = prodId.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (productModalSlugPreview) productModalSlugPreview.textContent = cleanSlug ? '/' + cleanSlug : '';
        });
    }

    // Accent color sync
    if (prodAccentPicker && prodAccent) {
        prodAccentPicker.addEventListener('input', () => prodAccent.value = prodAccentPicker.value);
        prodAccent.addEventListener('input', () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(prodAccent.value)) {
                prodAccentPicker.value = prodAccent.value;
            }
        });
    }

    // Dynamic Builders Helpers
    function populateBuildingItems(items) {
        if (!buildingItemsContainer) return;
        buildingItemsContainer.innerHTML = '';
        const list = items && items.length > 0 ? items : [''];
        list.forEach(item => addBuildingItemRow(item));
    }

    function addBuildingItemRow(val = '') {
        if (!buildingItemsContainer) return;
        const row = document.createElement('div');
        row.className = 'admin-dynamic-list-row';
        row.innerHTML = `
            <input type="text" class="admin-input building-item-input" value="${escapeHtml(val)}" placeholder="e.g. Real-time guest folio management">
            <button type="button" class="admin-btn-remove" title="Remove bullet">&times;</button>
        `;
        row.querySelector('.admin-btn-remove').addEventListener('click', () => row.remove());
        buildingItemsContainer.appendChild(row);
    }

    if (btnAddBuildingItem) {
        btnAddBuildingItem.addEventListener('click', () => addBuildingItemRow(''));
    }

    function populateFeatureCards(features) {
        if (!featuresContainer) return;
        featuresContainer.innerHTML = '';
        const list = features && features.length > 0 ? features : [];
        list.forEach(f => addFeatureCard(f));
    }

    function addFeatureCard(feat = { icon: 'star', title: '', description: '' }) {
        if (!featuresContainer) return;
        const card = document.createElement('div');
        card.className = 'admin-dynamic-card feature-item';
        card.innerHTML = `
            <div class="admin-dynamic-card__header">
                <span class="admin-dynamic-card__title">Feature Item</span>
                <button type="button" class="admin-btn-remove" title="Remove feature">&times;</button>
            </div>
            <div class="admin-form-grid-2" style="margin-bottom: 0.5rem;">
                <input type="text" class="admin-input feat-icon" value="${escapeHtml(feat.icon || 'star')}" placeholder="Icon name (e.g. check, shield, star, zap)">
                <input type="text" class="admin-input feat-title" value="${escapeHtml(feat.title || '')}" placeholder="Feature Title">
            </div>
            <textarea class="admin-input feat-desc" rows="2" placeholder="Feature description...">${escapeHtml(feat.description || '')}</textarea>
        `;
        card.querySelector('.admin-btn-remove').addEventListener('click', () => card.remove());
        featuresContainer.appendChild(card);
    }

    if (btnAddFeature) {
        btnAddFeature.addEventListener('click', () => addFeatureCard());
    }

    function populateBenefitCards(benefits) {
        if (!benefitsContainer) return;
        benefitsContainer.innerHTML = '';
        const list = benefits && benefits.length > 0 ? benefits : [];
        list.forEach(b => addBenefitCard(b));
    }

    function addBenefitCard(ben = { icon: 'zap', title: '', description: '' }) {
        if (!benefitsContainer) return;
        const card = document.createElement('div');
        card.className = 'admin-dynamic-card benefit-item';
        card.innerHTML = `
            <div class="admin-dynamic-card__header">
                <span class="admin-dynamic-card__title">Benefit Item</span>
                <button type="button" class="admin-btn-remove" title="Remove benefit">&times;</button>
            </div>
            <div class="admin-form-grid-2" style="margin-bottom: 0.5rem;">
                <input type="text" class="admin-input ben-icon" value="${escapeHtml(ben.icon || 'zap')}" placeholder="Icon name (e.g. zap, trending-up, clock)">
                <input type="text" class="admin-input ben-title" value="${escapeHtml(ben.title || '')}" placeholder="Benefit Title">
            </div>
            <textarea class="admin-input ben-desc" rows="2" placeholder="Benefit description...">${escapeHtml(ben.description || '')}</textarea>
        `;
        card.querySelector('.admin-btn-remove').addEventListener('click', () => card.remove());
        benefitsContainer.appendChild(card);
    }

    if (btnAddBenefit) {
        btnAddBenefit.addEventListener('click', () => addBenefitCard());
    }

    function populateAudienceCards(audiences) {
        if (!audienceContainer) return;
        audienceContainer.innerHTML = '';
        const list = audiences && audiences.length > 0 ? audiences : [];
        list.forEach(a => addAudienceCard(a));
    }

    function addAudienceCard(aud = { icon: 'users', title: '', description: '' }) {
        if (!audienceContainer) return;
        const card = document.createElement('div');
        card.className = 'admin-dynamic-card audience-item';
        card.innerHTML = `
            <div class="admin-dynamic-card__header">
                <span class="admin-dynamic-card__title">Audience Role / Segment</span>
                <button type="button" class="admin-btn-remove" title="Remove audience">&times;</button>
            </div>
            <div class="admin-form-grid-2" style="margin-bottom: 0.5rem;">
                <input type="text" class="admin-input aud-icon" value="${escapeHtml(aud.icon || 'users')}" placeholder="Icon name">
                <input type="text" class="admin-input aud-title" value="${escapeHtml(aud.title || '')}" placeholder="Target Role / Audience (e.g. Hotel Managers)">
            </div>
            <textarea class="admin-input aud-desc" rows="2" placeholder="How this product solves their specific role pain point...">${escapeHtml(aud.description || '')}</textarea>
        `;
        card.querySelector('.admin-btn-remove').addEventListener('click', () => card.remove());
        audienceContainer.appendChild(card);
    }

    if (btnAddAudience) {
        btnAddAudience.addEventListener('click', () => addAudienceCard());
    }

    // Featured Image Preview in Product CMS
    function updateFeaturedPreview(url = '') {
        if (!prodFeaturedPreviewImg || !prodFeaturedPreviewEmpty) return;
        if (url && url.trim()) {
            prodFeaturedPreviewImg.src = url.trim();
            prodFeaturedPreviewImg.style.display = 'block';
            prodFeaturedPreviewEmpty.style.display = 'none';
        } else {
            prodFeaturedPreviewImg.src = '';
            prodFeaturedPreviewImg.style.display = 'none';
            prodFeaturedPreviewEmpty.style.display = 'block';
        }
    }

    if (prodFeaturedImage) {
        prodFeaturedImage.addEventListener('input', () => updateFeaturedPreview(prodFeaturedImage.value));
    }

    if (btnUploadFeaturedMedia && prodFeaturedFileInput) {
        btnUploadFeaturedMedia.addEventListener('click', () => prodFeaturedFileInput.click());
        prodFeaturedFileInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const origHtml = btnUploadFeaturedMedia.innerHTML;
            btnUploadFeaturedMedia.innerHTML = '<span>Uploading...</span>';
            btnUploadFeaturedMedia.disabled = true;
            try {
                const media = await uploadSingleFile(file);
                if (prodFeaturedImage) prodFeaturedImage.value = media.url;
                updateFeaturedPreview(media.url);
            } catch (err) {
                alert('Upload failed: ' + err.message);
            } finally {
                btnUploadFeaturedMedia.innerHTML = origHtml;
                btnUploadFeaturedMedia.disabled = false;
                prodFeaturedFileInput.value = '';
            }
        });
    }

    if (btnPickFeaturedMedia) {
        btnPickFeaturedMedia.addEventListener('click', () => {
            openMediaPicker((mediaItem) => {
                if (prodFeaturedImage) prodFeaturedImage.value = mediaItem.url;
                updateFeaturedPreview(mediaItem.url);
            });
        });
    }

    if (btnClearFeaturedMedia) {
        btnClearFeaturedMedia.addEventListener('click', () => {
            if (prodFeaturedImage) prodFeaturedImage.value = '';
            updateFeaturedPreview('');
        });
    }

    // Screenshots & Gallery Builder
    function populateScreenshotCards(screenshots = []) {
        if (!screenshotsContainer) return;
        screenshotsContainer.innerHTML = '';
        const list = screenshots && screenshots.length > 0 ? screenshots : [
            { layout: 'dashboard', label: 'Dashboard Overview', caption: '', skin: 'browser' }
        ];
        list.forEach((s, idx) => addScreenshotCard(s, idx, list.length));
        updateScreenshotOrderButtons();
    }

    function addScreenshotCard(s = { layout: 'dashboard', label: '', caption: '', image: '', skin: 'browser' }) {
        if (!screenshotsContainer) return;
        const card = document.createElement('div');
        card.className = 'admin-screenshot-card';
        const imgUrl = s.image || s.url || '';
        const thumbHtml = imgUrl 
            ? `<img src="${escapeHtml(imgUrl)}" alt="Thumbnail">`
            : `<div style="font-size:0.7rem; color:var(--adm-text-subtle); text-align:center; padding:0.25rem;">${escapeHtml(s.layout || 'Mockup')}</div>`;

        card.innerHTML = `
            <div class="admin-screenshot-order-btns">
                <button type="button" class="admin-order-arrow-btn screen-order-up" title="Move up">▲</button>
                <button type="button" class="admin-order-arrow-btn screen-order-down" title="Move down">▼</button>
            </div>
            <div class="admin-screenshot-thumb-box">
                ${thumbHtml}
            </div>
            <div style="display:flex; flex-direction:column; gap:0.5rem; flex:1;">
                <div class="admin-form-grid-3" style="grid-template-columns: 140px 140px 1fr;">
                    <div>
                        <label style="font-size:0.7rem; color:var(--adm-text-subtle); display:block; margin-bottom:2px;">Layout / Style</label>
                        <select class="admin-input screen-layout" style="padding:0.4rem 0.6rem; font-size:0.8rem;">
                            <option value="browser" ${s.layout === 'browser' ? 'selected' : ''}>Browser Window</option>
                            <option value="mobile" ${s.layout === 'mobile' ? 'selected' : ''}>Mobile Device</option>
                            <option value="dashboard" ${s.layout === 'dashboard' ? 'selected' : ''}>Dashboard SVG</option>
                            <option value="table" ${s.layout === 'table' ? 'selected' : ''}>Table / Folio SVG</option>
                            <option value="chart" ${s.layout === 'chart' ? 'selected' : ''}>Chart / Trend SVG</option>
                            <option value="raw" ${s.layout === 'raw' ? 'selected' : ''}>Raw Image</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size:0.7rem; color:var(--adm-text-subtle); display:block; margin-bottom:2px;">Device Skin</label>
                        <select class="admin-input screen-skin" style="padding:0.4rem 0.6rem; font-size:0.8rem;">
                            <option value="browser" ${(s.skin || s.layout) === 'browser' ? 'selected' : ''}>Mac / Browser Frame</option>
                            <option value="mobile" ${(s.skin || s.layout) === 'mobile' ? 'selected' : ''}>iPhone / Mobile Frame</option>
                            <option value="none" ${s.skin === 'none' ? 'selected' : ''}>No Frame (Flat)</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size:0.7rem; color:var(--adm-text-subtle); display:block; margin-bottom:2px;">Screen Title / Label</label>
                        <input type="text" class="admin-input screen-label" value="${escapeHtml(s.label || '')}" placeholder="e.g. Reservation Calendar" style="padding:0.4rem 0.6rem; font-size:0.8rem;">
                    </div>
                </div>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    <input type="text" class="admin-input screen-img-url" value="${escapeHtml(imgUrl)}" placeholder="Image URL (e.g. /assets/uploads/...) or leave blank for SVG mockup" style="padding:0.4rem 0.6rem; font-size:0.8rem; flex:1;">
                    <input type="file" class="screen-file-input" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" style="display:none;">
                    <button type="button" class="admin-btn screen-upload-btn" style="font-size:0.75rem; padding:0.4rem 0.75rem; width:auto; white-space:nowrap;">
                        Upload
                    </button>
                    <button type="button" class="admin-btn-secondary screen-pick-media-btn" style="font-size:0.75rem; padding:0.4rem 0.65rem; white-space:nowrap;">
                        Choose Visual
                    </button>
                </div>
                <div>
                    <input type="text" class="admin-input screen-caption" value="${escapeHtml(s.caption || '')}" placeholder="Caption / description shown under mockup in preview..." style="padding:0.4rem 0.6rem; font-size:0.8rem;">
                </div>
            </div>
            <div>
                <button type="button" class="admin-btn-remove screen-remove-btn" title="Remove screenshot">&times;</button>
            </div>
        `;

        const imgInput = card.querySelector('.screen-img-url');
        const thumbBox = card.querySelector('.admin-screenshot-thumb-box');
        const uploadBtn = card.querySelector('.screen-upload-btn');
        const screenFileInput = card.querySelector('.screen-file-input');
        const pickBtn = card.querySelector('.screen-pick-media-btn');
        const removeBtn = card.querySelector('.screen-remove-btn');
        const upBtn = card.querySelector('.screen-order-up');
        const downBtn = card.querySelector('.screen-order-down');

        imgInput.addEventListener('input', () => {
            const url = imgInput.value.trim();
            if (url) {
                thumbBox.innerHTML = `<img src="${escapeHtml(url)}" alt="Thumbnail">`;
            } else {
                const l = card.querySelector('.screen-layout').value;
                thumbBox.innerHTML = `<div style="font-size:0.7rem; color:var(--adm-text-subtle); text-align:center; padding:0.25rem;">${escapeHtml(l)}</div>`;
            }
        });

        if (uploadBtn && screenFileInput) {
            uploadBtn.addEventListener('click', () => screenFileInput.click());
            screenFileInput.addEventListener('change', async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                uploadBtn.textContent = 'Uploading...';
                uploadBtn.disabled = true;
                try {
                    const media = await uploadSingleFile(file);
                    imgInput.value = media.url;
                    if (!card.querySelector('.screen-label').value) {
                        card.querySelector('.screen-label').value = media.title || '';
                    }
                    if (!card.querySelector('.screen-caption').value) {
                        card.querySelector('.screen-caption').value = media.caption || '';
                    }
                    thumbBox.innerHTML = `<img src="${escapeHtml(media.url)}" alt="Thumbnail">`;
                } catch (err) {
                    alert('Upload failed: ' + err.message);
                } finally {
                    uploadBtn.textContent = 'Upload';
                    uploadBtn.disabled = false;
                    screenFileInput.value = '';
                }
            });
        }

        pickBtn.addEventListener('click', () => {
            openMediaPicker((mediaItem) => {
                imgInput.value = mediaItem.url;
                if (!card.querySelector('.screen-label').value) {
                    card.querySelector('.screen-label').value = mediaItem.title || '';
                }
                if (!card.querySelector('.screen-caption').value) {
                    card.querySelector('.screen-caption').value = mediaItem.caption || '';
                }
                thumbBox.innerHTML = `<img src="${escapeHtml(mediaItem.url)}" alt="Thumbnail">`;
            });
        });

        removeBtn.addEventListener('click', () => {
            card.remove();
            updateScreenshotOrderButtons();
        });

        upBtn.addEventListener('click', () => {
            const prev = card.previousElementSibling;
            if (prev) {
                screenshotsContainer.insertBefore(card, prev);
                updateScreenshotOrderButtons();
            }
        });

        downBtn.addEventListener('click', () => {
            const next = card.nextElementSibling;
            if (next) {
                screenshotsContainer.insertBefore(next, card);
                updateScreenshotOrderButtons();
            }
        });

        screenshotsContainer.appendChild(card);
    }

    function updateScreenshotOrderButtons() {
        if (!screenshotsContainer) return;
        const cards = screenshotsContainer.querySelectorAll('.admin-screenshot-card');
        cards.forEach((c, idx) => {
            const upBtn = c.querySelector('.screen-order-up');
            const downBtn = c.querySelector('.screen-order-down');
            if (upBtn) upBtn.disabled = (idx === 0);
            if (downBtn) downBtn.disabled = (idx === cards.length - 1);
        });
    }

    if (btnAddScreenshot) {
        btnAddScreenshot.addEventListener('click', () => {
            addScreenshotCard({ layout: 'browser', label: '', caption: '', image: '', skin: 'browser' });
            updateScreenshotOrderButtons();
        });
    }

    if (btnUploadGalleryMedia && prodGalleryFileInput) {
        btnUploadGalleryMedia.addEventListener('click', () => prodGalleryFileInput.click());
        prodGalleryFileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            const origHtml = btnUploadGalleryMedia.innerHTML;
            btnUploadGalleryMedia.innerHTML = '<span>Uploading...</span>';
            btnUploadGalleryMedia.disabled = true;
            try {
                for (const file of files) {
                    const media = await uploadSingleFile(file);
                    addScreenshotCard({
                        layout: 'browser',
                        label: media.title || '',
                        caption: media.caption || '',
                        image: media.url,
                        skin: 'browser'
                    });
                }
                updateScreenshotOrderButtons();
            } catch (err) {
                alert('Upload failed: ' + err.message);
            } finally {
                btnUploadGalleryMedia.innerHTML = origHtml;
                btnUploadGalleryMedia.disabled = false;
                prodGalleryFileInput.value = '';
            }
        });
    }

    if (btnPickGalleryMedia) {
        btnPickGalleryMedia.addEventListener('click', () => {
            openMediaPicker((mediaItem) => {
                addScreenshotCard({
                    layout: 'browser',
                    label: mediaItem.title || '',
                    caption: mediaItem.caption || '',
                    image: mediaItem.url,
                    skin: 'browser'
                });
                updateScreenshotOrderButtons();
            });
        });
    }

    function populateRelatedProducts(selectedList = [], currentId = null) {
        if (!relatedProductsCheckboxes) return;
        relatedProductsCheckboxes.innerHTML = '';

        const others = currentProducts.filter(p => p.id !== currentId);
        if (others.length === 0) {
            relatedProductsCheckboxes.innerHTML = '<span style="color:var(--adm-text-subtle); font-size:0.8rem;">No other products available.</span>';
            return;
        }

        relatedProductsCheckboxes.innerHTML = others.map(p => {
            const checked = selectedList.includes(p.id) ? 'checked' : '';
            return `
                <label class="admin-checkbox-label" style="background:#111827; padding:0.5rem 0.75rem; border-radius:6px; border:1px solid var(--adm-border);">
                    <input type="checkbox" name="related-prod" value="${p.id}" ${checked}>
                    <span>${escapeHtml(p.name)}</span>
                </label>
            `;
        }).join('');
    }

    // Collect Form Data
    function collectProductFormData(forceDraft = false) {
        let id = prodId.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        const name = prodName.value.trim();
        if (!name) {
            alert('Product Name is required.');
            return null;
        }
        if (!id) {
            id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            prodId.value = id;
        }
        if (!id) {
            alert('Product Name and URL Slug are required.');
            return null;
        }

        // Bullets
        const whatWeAreBuilding = Array.from(document.querySelectorAll('.building-item-input'))
            .map(i => i.value.trim())
            .filter(Boolean);

        // Features
        const features = Array.from(document.querySelectorAll('.feature-item')).map(c => ({
            icon: c.querySelector('.feat-icon').value.trim() || 'star',
            title: c.querySelector('.feat-title').value.trim(),
            description: c.querySelector('.feat-desc').value.trim()
        })).filter(f => f.title);

        // Benefits
        const benefits = Array.from(document.querySelectorAll('.benefit-item')).map(c => ({
            icon: c.querySelector('.ben-icon').value.trim() || 'zap',
            title: c.querySelector('.ben-title').value.trim(),
            description: c.querySelector('.ben-desc').value.trim()
        })).filter(b => b.title);

        // Audience
        const targetAudience = Array.from(document.querySelectorAll('.audience-item')).map(c => ({
            icon: c.querySelector('.aud-icon').value.trim() || 'users',
            title: c.querySelector('.aud-title').value.trim(),
            description: c.querySelector('.aud-desc').value.trim()
        })).filter(a => a.title);

        // Screenshots & Featured Image
        const featuredImage = prodFeaturedImage ? prodFeaturedImage.value.trim() : '';
        const screenshots = Array.from(document.querySelectorAll('.admin-screenshot-card')).map(card => {
            const layout = card.querySelector('.screen-layout').value;
            const imgVal = card.querySelector('.screen-img-url').value.trim();
            const label = card.querySelector('.screen-label').value.trim();
            const caption = card.querySelector('.screen-caption').value.trim();
            const skin = card.querySelector('.screen-skin').value;
            const item = { layout, label, caption, skin };
            if (imgVal) item.image = imgVal;
            return item;
        }).filter(s => s.label || s.image);

        // Related Products
        const relatedProducts = Array.from(document.querySelectorAll('input[name="related-prod"]:checked'))
            .map(cb => cb.value);

        const status = forceDraft ? 'draft' : prodStatus.value;
        const accentVal = prodAccent.value.trim() || '#4f46e5';
        const fullDescVal = prodFullDesc.value.trim();

        return {
            id,
            name,
            tagline: prodTagline.value.trim(),
            category: prodCategory.value,
            status,
            accent: accentVal,
            accentColor: accentVal,
            featured: prodFeatured.checked,
            spotlight: prodSpotlight.checked,
            order: parseInt(prodOrder.value, 10) || 1,
            shortDescription: prodShortDesc.value.trim(),
            fullDescription: fullDescVal,
            description: fullDescVal,
            problem: prodProblem.value.trim(),
            featuredImage,
            screenshots,
            whatWeAreBuilding,
            features,
            benefits,
            audience: targetAudience,
            targetAudience,
            relatedIds: relatedProducts,
            relatedProducts
        };
    }

    // Save Product (Create or Update)
    async function saveProduct(forceDraft = false) {
        const payload = collectProductFormData(forceDraft);
        if (!payload) return;

        const isEdit = !!prodOriginalId.value;
        const targetUrl = isEdit ? `/api/admin/products/${prodOriginalId.value}` : '/api/admin/products';
        const method = isEdit ? 'PUT' : 'POST';

        if (productModalSaveBtn) productModalSaveBtn.disabled = true;
        if (productModalDraftBtn) productModalDraftBtn.disabled = true;

        try {
            const res = await authFetch(targetUrl, {
                method,
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                closeProductModal();
                await loadAllData();
            } else {
                alert('Error saving product: ' + (data.error || 'Server error'));
            }
        } catch (err) {
            alert('Connection error: ' + err.message);
        } finally {
            if (productModalSaveBtn) productModalSaveBtn.disabled = false;
            if (productModalDraftBtn) productModalDraftBtn.disabled = false;
        }
    }

    // Delete Product
    async function deleteProduct() {
        if (!prodOriginalId.value) return;
        const confirmed = confirm(`Are you sure you want to permanently delete product "${prodName.value}" (${prodOriginalId.value})? This cannot be undone.`);
        if (!confirmed) return;

        try {
            const res = await authFetch(`/api/admin/products/${prodOriginalId.value}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                closeProductModal();
                await loadAllData();
            } else {
                alert('Error deleting product: ' + (data.error || 'Server error'));
            }
        } catch (err) {
            alert('Connection error: ' + err.message);
        }
    }

    // Reorder Products Handler
    async function moveProductOrder(productId, direction) {
        const sorted = [...currentProducts].sort((a, b) => (a.order || 99) - (b.order || 99));
        const index = sorted.findIndex(p => p.id === productId);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            const temp = sorted[index];
            sorted[index] = sorted[index - 1];
            sorted[index - 1] = temp;
        } else if (direction === 'down' && index < sorted.length - 1) {
            const temp = sorted[index];
            sorted[index] = sorted[index + 1];
            sorted[index + 1] = temp;
        } else {
            return;
        }

        const productIds = sorted.map(p => p.id);
        try {
            const res = await authFetch('/api/admin/products/reorder', {
                method: 'POST',
                body: JSON.stringify({ productIds })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                await loadProducts();
            }
        } catch (e) {
            console.error('Reorder error:', e);
        }
    }

    // Change status quickly from table dropdown
    async function updateProductStatusInline(productId, newStatus) {
        try {
            const res = await authFetch(`/api/admin/products/${productId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                await loadAllData();
            }
        } catch (e) {
            console.error('Status update error:', e);
        }
    }

    // ════════════════════════════════════════════════════════════════
    // PHASE 10: ADVANCED CRM PIPELINE & LEAD MANAGEMENT CONTROLLER
    // ════════════════════════════════════════════════════════════════

    const CRM_STAGES = [
        { key: 'new', label: 'New', color: '#06b6d4' },
        { key: 'in_review', label: 'In Review', color: '#f59e0b' },
        { key: 'contacted', label: 'Contacted', color: '#7c3aed' },
        { key: 'qualified', label: 'Qualified', color: '#6366f1' },
        { key: 'proposal_sent', label: 'Proposal', color: '#0ea5e9' },
        { key: 'closed_won', label: 'Won', color: '#10b981' },
        { key: 'closed_lost', label: 'Lost', color: '#ef4444' }
    ];

    const STAGE_ORDER = ['new', 'in_review', 'contacted', 'qualified', 'proposal_sent', 'closed_won'];

    function getNextStage(currentStage) {
        const idx = STAGE_ORDER.indexOf(currentStage);
        if (idx >= 0 && idx < STAGE_ORDER.length - 1) {
            return STAGE_ORDER[idx + 1];
        }
        return null;
    }

    function getFollowupInfo(followupDate) {
        if (!followupDate) return { label: 'No Follow-up', cls: 'followup-none' };
        const today = new Date().toISOString().slice(0, 10);
        if (followupDate < today) return { label: `Overdue (${followupDate})`, cls: 'followup-overdue' };
        if (followupDate === today) return { label: `Due Today`, cls: 'followup-today' };
        return { label: `Due ${followupDate}`, cls: 'followup-upcoming' };
    }

    function renderLeadsTable() {
        if (!leadsTbody) return;
        const searchTerm = (leadSearchInput ? leadSearchInput.value : '').toLowerCase().trim();

        const today = new Date().toISOString().slice(0, 10);

        let filtered = currentSubmissions.filter(item => {
            if (leadFilter.type !== 'all' && item.form_type !== leadFilter.type) return false;
            if (leadFilter.status !== 'all' && (item.status || 'new') !== leadFilter.status) return false;
            if (leadFilter.priority !== 'all' && (item.priority || 'medium') !== leadFilter.priority) return false;
            if (leadFilter.followup !== 'all') {
                const fDate = item.follow_up_date;
                if (leadFilter.followup === 'overdue' && (!fDate || fDate >= today)) return false;
                if (leadFilter.followup === 'today' && fDate !== today) return false;
                if (leadFilter.followup === 'upcoming' && (!fDate || fDate <= today)) return false;
            }
            if (searchTerm) {
                const ref = (item.ref_id || '').toLowerCase();
                const name = (item.contact && item.contact.name ? item.contact.name : '').toLowerCase();
                const email = (item.contact && item.contact.email ? item.contact.email : '').toLowerCase();
                const company = (item.contact && item.contact.company ? item.contact.company : '').toLowerCase();
                const phone = (item.contact && item.contact.phone ? item.contact.phone : '').toLowerCase();
                const prod = (item.details && item.details.product_name ? item.details.product_name : '').toLowerCase();
                const subj = (item.details && item.details.subject ? item.details.subject : '').toLowerCase();
                const msg = (item.details && item.details.message ? item.details.message : '').toLowerCase();
                const notes = (item.admin_notes || '').toLowerCase();
                const assigned = (item.assigned_to || '').toLowerCase();
                if (!ref.includes(searchTerm) && !name.includes(searchTerm) && !email.includes(searchTerm) && !company.includes(searchTerm) && !phone.includes(searchTerm) && !prod.includes(searchTerm) && !subj.includes(searchTerm) && !msg.includes(searchTerm) && !notes.includes(searchTerm) && !assigned.includes(searchTerm)) return false;
            }
            return true;
        });

        if (leadsCountBadge) {
            leadsCountBadge.textContent = filtered.length + (filtered.length === 1 ? ' Record' : ' Records');
        }

        if (filtered.length === 0) {
            leadsTbody.innerHTML = '<tr><td colspan="8" class="admin-empty-table">No matching inquiries found in CRM.</td></tr>';
            return;
        }

        leadsTbody.innerHTML = filtered.map(item => {
            const ref = item.ref_id || '-';
            const dateStr = formatDate(item.submitted_at);
            const name = item.contact ? escapeHtml(item.contact.name || 'Anonymous') : 'Anonymous';
            const email = item.contact ? escapeHtml(item.contact.email || '') : '';
            const company = item.contact && item.contact.company && item.contact.company !== 'N/A' ? escapeHtml(item.contact.company) : '';
            const topic = item.details ? escapeHtml(item.details.product_name || item.details.subject || 'General') : 'General';
            const status = item.status || 'new';
            const statusClass = 'status-' + status;
            const statusLabel = status.replace('_', ' ');

            const priority = item.priority || 'medium';
            const priorityClass = 'priority-' + priority;

            const assignedTo = item.assigned_to && item.assigned_to !== 'unassigned' ? item.assigned_to : 'Unassigned';
            const followup = getFollowupInfo(item.follow_up_date);

            return `
                <tr data-ref="${ref}">
                    <td><span class="admin-ref-id">${ref}</span></td>
                    <td style="color: var(--adm-text-muted); font-size: 0.82rem; white-space: nowrap;">${dateStr}</td>
                    <td>
                        <div style="font-weight: 600; color: var(--adm-text);">${name}</div>
                        <div style="font-size: 0.78rem; color: var(--adm-text-muted);">${email}${company ? ' &bull; ' + company : ''}</div>
                    </td>
                    <td>
                        <div style="color: var(--adm-text); font-weight: 500;">${topic}</div>
                        ${item.details && item.details.industry ? '<div style="font-size: 0.75rem; color: var(--adm-text-subtle);">' + escapeHtml(item.details.industry) + '</div>' : ''}
                    </td>
                    <td><span class="admin-status-badge ${statusClass}">${statusLabel}</span></td>
                    <td><span class="admin-priority-badge ${priorityClass}">${priority}</span></td>
                    <td>
                        <div style="display:flex; flex-direction:column; gap:0.25rem;">
                            <span class="admin-assignee-pill">${escapeHtml(assignedTo)}</span>
                            <span class="admin-followup-badge ${followup.cls}">${followup.label}</span>
                        </div>
                    </td>
                    <td style="text-align: right; white-space: nowrap;">
                        <button class="admin-view-btn" data-action="view-lead" data-ref="${ref}">View CRM Details</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function openLeadDrawer(lead) {
        selectedLead = lead;
        if (drawerRefId) drawerRefId.textContent = lead.ref_id || '';
        if (drawerName) drawerName.textContent = lead.contact ? (lead.contact.name || '-') : '-';
        if (drawerEmail) drawerEmail.textContent = lead.contact ? (lead.contact.email || '-') : '-';
        if (drawerCompany) drawerCompany.textContent = lead.contact ? (lead.contact.company || '-') : '-';
        if (drawerPhone) drawerPhone.textContent = lead.contact ? (lead.contact.phone || '-') : '-';

        if (drawerType) drawerType.textContent = lead.form_type === 'demo_request' ? 'Request a Demo' : 'Contact Us Enquiry';
        if (drawerDate) drawerDate.textContent = formatDate(lead.submitted_at, true);
        if (drawerProduct) drawerProduct.textContent = lead.details ? (lead.details.product_name || lead.details.product_id || 'N/A') : 'N/A';
        if (drawerIndustry) drawerIndustry.textContent = lead.details ? (lead.details.industry || 'N/A') : 'N/A';
        if (drawerGoal) drawerGoal.textContent = lead.details ? (lead.details.goal || lead.details.subject || 'N/A') : 'N/A';
        if (drawerMessage) drawerMessage.textContent = lead.details && lead.details.message ? lead.details.message : 'No additional message provided.';

        // Mailto setup
        const custEmail = lead.contact && lead.contact.email ? lead.contact.email : '';
        const custName = lead.contact && lead.contact.name ? lead.contact.name.split(' ')[0] : 'there';
        const prodName = lead.details && lead.details.product_name ? lead.details.product_name : (lead.details && lead.details.subject ? lead.details.subject : 'Versaly Solutions');
        const mailtoSubject = encodeURIComponent(`Re: Inquiry for ${prodName} [${lead.ref_id}]`);
        const mailtoBody = encodeURIComponent(`Hi ${custName},\n\nThank you for reaching out to Versaly regarding ${prodName}.\n\nI would love to schedule a quick 15-minute walkthrough or answer any specific questions you have.\n\nBest regards,\nVersaly Team`);
        if (drawerBtnQuickEmail) {
            drawerBtnQuickEmail.href = `mailto:${custEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;
        }

        // Advance Stage Button config
        updateAdvanceStageButton(lead.status || 'new');

        // Form fields
        if (drawerStatusSelect) drawerStatusSelect.value = lead.status || 'new';
        if (drawerPrioritySelect) drawerPrioritySelect.value = lead.priority || 'medium';
        if (drawerAssignedSelect) drawerAssignedSelect.value = lead.assigned_to || 'unassigned';
        if (drawerFollowupInput) drawerFollowupInput.value = lead.follow_up_date || '';
        if (drawerValueInput) drawerValueInput.value = lead.estimated_value != null ? lead.estimated_value : '';

        // Notes thread & Timeline
        renderDrawerNotes(lead.notes || []);
        renderDrawerTimeline(lead.timeline || []);

        if (drawerSource) drawerSource.textContent = lead.meta ? (lead.meta.source_page || '/') : '/';
        if (drawerIp) drawerIp.textContent = lead.meta ? (lead.meta.client_ip_hash || 'N/A') : 'N/A';

        if (leadDrawerBackdrop) {
            leadDrawerBackdrop.classList.add('is-open');
            leadDrawerBackdrop.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    }

    function updateAdvanceStageButton(currentStage) {
        if (!drawerBtnAdvanceStage) return;
        const next = getNextStage(currentStage);
        if (next) {
            drawerBtnAdvanceStage.style.display = 'inline-flex';
            drawerBtnAdvanceStage.querySelector('span').textContent = `Advance to ${next.replace('_', ' ')} →`;
            drawerBtnAdvanceStage.dataset.nextStage = next;
        } else {
            drawerBtnAdvanceStage.style.display = 'none';
        }
    }

    function renderDrawerNotes(notes) {
        if (!drawerNotesThread) return;
        const list = Array.isArray(notes) ? notes : [];
        if (drawerNotesCount) drawerNotesCount.textContent = `${list.length} note${list.length === 1 ? '' : 's'}`;

        if (list.length === 0) {
            drawerNotesThread.innerHTML = '<div class="admin-notes-empty">No internal notes added yet.</div>';
            return;
        }

        drawerNotesThread.innerHTML = list.slice().reverse().map(n => {
            const timeAgo = formatTimeAgo(n.timestamp || n.created_at);
            return `
                <div class="admin-note-bubble">
                    <div class="admin-note-meta">
                        <span class="admin-note-author">${escapeHtml(n.author || 'Admin')}</span>
                        <span class="admin-note-time">${timeAgo}</span>
                    </div>
                    <div class="admin-note-text">${escapeHtml(n.text || '')}</div>
                </div>
            `;
        }).join('');
    }

    function renderDrawerTimeline(events) {
        if (!drawerTimelineEvents) return;
        const list = Array.isArray(events) ? events : [];
        if (list.length === 0) {
            drawerTimelineEvents.innerHTML = '<div class="admin-notes-empty">No activity events recorded.</div>';
            return;
        }

        drawerTimelineEvents.innerHTML = list.slice().reverse().map(evt => {
            const timeAgo = formatTimeAgo(evt.timestamp);
            let dotCls = 'blue';
            if ((evt.event || '').includes('created') || (evt.event || '').includes('won')) dotCls = 'green';
            if ((evt.event || '').includes('lost') || (evt.event || '').includes('urgent')) dotCls = 'amber';
            return `
                <div class="admin-timeline-item">
                    <div class="admin-timeline-dot ${dotCls}"></div>
                    <div class="admin-timeline-content">
                        <div class="admin-timeline-text">${escapeHtml(evt.detail || evt.event || 'Action logged')}</div>
                        <div class="admin-timeline-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function addLeadNote() {
        if (!selectedLead) return;
        const text = drawerNewNoteText ? drawerNewNoteText.value.trim() : '';
        if (!text) {
            alert('Please enter a note before adding.');
            return;
        }

        if (drawerBtnAddNote) drawerBtnAddNote.disabled = true;

        try {
            const res = await authFetch(`/api/admin/submissions/${selectedLead.ref_id}/notes`, {
                method: 'POST',
                body: JSON.stringify({ text, author: 'Admin' })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (drawerNewNoteText) drawerNewNoteText.value = '';
                selectedLead.notes = data.notes || selectedLead.notes || [];
                selectedLead.timeline = data.timeline || selectedLead.timeline || [];
                renderDrawerNotes(selectedLead.notes);
                renderDrawerTimeline(selectedLead.timeline);
                await loadSubmissions();
            } else {
                alert('Error adding note: ' + (data.error || 'Server error'));
            }
        } catch (e) {
            alert('Connection error: ' + e.message);
        } finally {
            if (drawerBtnAddNote) drawerBtnAddNote.disabled = false;
        }
    }

    async function advanceLeadStage() {
        if (!selectedLead || !drawerBtnAdvanceStage) return;
        const next = drawerBtnAdvanceStage.dataset.nextStage;
        if (!next) return;

        if (drawerStatusSelect) drawerStatusSelect.value = next;
        await saveLeadCRMDetails(true);
    }

    async function saveLeadCRMDetails(silent = false) {
        if (!selectedLead) return;

        const payload = {
            status: drawerStatusSelect ? drawerStatusSelect.value : selectedLead.status,
            priority: drawerPrioritySelect ? drawerPrioritySelect.value : (selectedLead.priority || 'medium'),
            assigned_to: drawerAssignedSelect ? drawerAssignedSelect.value : (selectedLead.assigned_to || 'unassigned'),
            follow_up_date: drawerFollowupInput ? drawerFollowupInput.value : '',
            estimated_value: drawerValueInput && drawerValueInput.value !== '' ? parseFloat(drawerValueInput.value) || 0 : null
        };

        if (drawerSaveBtn) {
            drawerSaveBtn.disabled = true;
            drawerSaveBtn.textContent = 'Saving...';
        }

        try {
            const res = await authFetch(`/api/admin/submissions/${selectedLead.ref_id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                Object.assign(selectedLead, payload);
                if (data.timeline) {
                    selectedLead.timeline = data.timeline;
                    renderDrawerTimeline(selectedLead.timeline);
                }
                updateAdvanceStageButton(payload.status);

                if (!silent && drawerSaveBtn) {
                    drawerSaveBtn.textContent = '✓ Saved!';
                    setTimeout(() => {
                        drawerSaveBtn.textContent = 'Save CRM Details';
                        drawerSaveBtn.disabled = false;
                    }, 1200);
                } else if (drawerSaveBtn) {
                    drawerSaveBtn.textContent = 'Save CRM Details';
                    drawerSaveBtn.disabled = false;
                }
                await loadSubmissions();
                await loadStats();
            } else {
                alert('Error saving lead: ' + (data.error || 'Server error'));
                if (drawerSaveBtn) {
                    drawerSaveBtn.textContent = 'Save CRM Details';
                    drawerSaveBtn.disabled = false;
                }
            }
        } catch (e) {
            alert('Connection error: ' + e.message);
            if (drawerSaveBtn) {
                drawerSaveBtn.textContent = 'Save CRM Details';
                drawerSaveBtn.disabled = false;
            }
        }
    }

    function closeLeadDrawer() {
        if (leadDrawerBackdrop) {
            leadDrawerBackdrop.classList.remove('is-open');
            leadDrawerBackdrop.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
        selectedLead = null;
    }

    // ════════════════════════════════════════════════════════════════
    // PHASE 10: SETTINGS CMS & SYSTEM HEALTH CONTROLLER
    // ════════════════════════════════════════════════════════════════

    async function loadSettings() {
        try {
            const res = await authFetch('/api/admin/settings');
            const data = await res.json();
            if (data.success && data.settings) {
                currentSettings = data.settings;
                populateSettingsFields(currentSettings);
            }
        } catch (e) {
            console.error('Settings load error:', e);
        }
    }

    function populateSettingsFields(set) {
        if (!set) return;
        const comp = set.company || {};
        const notif = set.notifications || {};
        const ana = set.analytics || {};
        const sys = set.system || {};

        if (setCompanyName) setCompanyName.value = comp.name || '';
        if (setCompanyTagline) setCompanyTagline.value = comp.tagline || '';
        if (setSupportEmail) setSupportEmail.value = comp.supportEmail || '';
        if (setSalesEmail) setSalesEmail.value = comp.salesEmail || '';
        if (setCompanyPhone) setCompanyPhone.value = comp.phone || '';
        if (setCompanyAddress) setCompanyAddress.value = comp.address || '';
        if (setLinkedin) setLinkedin.value = comp.linkedinUrl || '';
        if (setTwitter) setTwitter.value = comp.twitterUrl || '';
        if (setGithub) setGithub.value = comp.githubUrl || '';

        if (setEmailAlerts) setEmailAlerts.checked = !!notif.emailAlerts;
        if (setRecipientEmail) setRecipientEmail.value = notif.recipientEmail || '';
        if (setWebhookEnabled) setWebhookEnabled.checked = !!notif.webhookEnabled;
        if (setWebhookUrl) setWebhookUrl.value = notif.webhookUrl || '';

        if (setGaId) setGaId.value = ana.ga4Id || '';
        if (setGtmId) setGtmId.value = ana.gtmId || '';
        if (setPrivacyBanner) setPrivacyBanner.checked = !!ana.enforcePrivacyBanner;

        if (setMaintenanceMode) setMaintenanceMode.checked = !!sys.maintenanceMode;
        if (setStatusText) setStatusText.value = sys.statusPillText || '';
        if (setMaintenanceMsg) setMaintenanceMsg.value = sys.maintenanceMessage || '';
    }

    async function saveSettings() {
        const payload = {
            company: {
                name: setCompanyName ? setCompanyName.value.trim() : 'Versaly',
                tagline: setCompanyTagline ? setCompanyTagline.value.trim() : '',
                supportEmail: setSupportEmail ? setSupportEmail.value.trim() : '',
                salesEmail: setSalesEmail ? setSalesEmail.value.trim() : '',
                phone: setCompanyPhone ? setCompanyPhone.value.trim() : '',
                address: setCompanyAddress ? setCompanyAddress.value.trim() : '',
                linkedinUrl: setLinkedin ? setLinkedin.value.trim() : '',
                twitterUrl: setTwitter ? setTwitter.value.trim() : '',
                githubUrl: setGithub ? setGithub.value.trim() : ''
            },
            notifications: {
                emailAlerts: setEmailAlerts ? setEmailAlerts.checked : false,
                recipientEmail: setRecipientEmail ? setRecipientEmail.value.trim() : '',
                webhookEnabled: setWebhookEnabled ? setWebhookEnabled.checked : false,
                webhookUrl: setWebhookUrl ? setWebhookUrl.value.trim() : ''
            },
            analytics: {
                ga4Id: setGaId ? setGaId.value.trim() : '',
                gtmId: setGtmId ? setGtmId.value.trim() : '',
                enforcePrivacyBanner: setPrivacyBanner ? setPrivacyBanner.checked : true
            },
            system: {
                maintenanceMode: setMaintenanceMode ? setMaintenanceMode.checked : false,
                statusPillText: setStatusText ? setStatusText.value.trim() : 'All Systems Operational',
                maintenanceMessage: setMaintenanceMsg ? setMaintenanceMsg.value.trim() : "System maintenance in progress."
            }
        };

        if (btnSaveSettings) {
            btnSaveSettings.disabled = true;
            btnSaveSettings.innerHTML = '<span>Saving...</span>';
        }

        try {
            const res = await authFetch('/api/admin/settings', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                currentSettings = data.settings || payload;
                if (btnSaveSettings) {
                    btnSaveSettings.innerHTML = '<span>✓ Saved Configurations!</span>';
                    setTimeout(() => {
                        btnSaveSettings.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span>Save All Settings</span>';
                        btnSaveSettings.disabled = false;
                    }, 1500);
                }
            } else {
                alert('Error saving settings: ' + (data.error || 'Server error'));
                if (btnSaveSettings) {
                    btnSaveSettings.disabled = false;
                    btnSaveSettings.innerHTML = '<span>Save All Settings</span>';
                }
            }
        } catch (e) {
            alert('Connection error: ' + e.message);
            if (btnSaveSettings) {
                btnSaveSettings.disabled = false;
                btnSaveSettings.innerHTML = '<span>Save All Settings</span>';
            }
        }
    }

    async function changeAdminPassword() {
        const cur = pwdCurrent ? pwdCurrent.value.trim() : '';
        const nw = pwdNew ? pwdNew.value.trim() : '';
        const cf = pwdConfirm ? pwdConfirm.value.trim() : '';

        if (!cur) {
            alert('Please enter your current admin password.');
            if (pwdCurrent) pwdCurrent.focus();
            return;
        }
        if (!nw || nw.length < 6) {
            alert('New password must be at least 6 characters long.');
            if (pwdNew) pwdNew.focus();
            return;
        }
        if (nw !== cf) {
            alert('New password and confirmation do not match.');
            if (pwdConfirm) pwdConfirm.focus();
            return;
        }

        if (btnChangePassword) btnChangePassword.disabled = true;

        try {
            const res = await authFetch('/api/admin/settings/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword: cur, newPassword: nw })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (data.token) {
                    setToken(data.token);
                }
                if (pwdCurrent) pwdCurrent.value = '';
                if (pwdNew) pwdNew.value = '';
                if (pwdConfirm) pwdConfirm.value = '';
                alert('Admin password changed successfully!');
            } else {
                alert('Error changing password: ' + (data.error || 'Incorrect current password'));
            }
        } catch (e) {
            alert('Connection error: ' + e.message);
        } finally {
            if (btnChangePassword) btnChangePassword.disabled = false;
        }
    }

    // ════════════════════════════════════════════════════════════════
    // PHASE 18: NOTIFICATION CENTER CONTROLLER
    // ════════════════════════════════════════════════════════════════

    async function loadNotifications(filter = 'all') {
        currentNotifFilter = filter;
        try {
            let url = '/api/admin/notifications';
            if (filter === 'unread') url += '?unread=true';
            else if (filter !== 'all') url += `?category=${encodeURIComponent(filter)}`;

            const res = await authFetch(url);
            const data = await res.json();
            if (data.success && Array.isArray(data.notifications)) {
                currentNotifications = data.notifications;
                const unread = data.unread_count !== undefined ? data.unread_count : currentNotifications.filter(n => !n.read).length;
                
                // Update badge
                if (notificationBadge) {
                    if (unread > 0) {
                        notificationBadge.textContent = unread > 99 ? '99+' : unread;
                        notificationBadge.style.display = 'inline-flex';
                    } else {
                        notificationBadge.style.display = 'none';
                    }
                }
                if (notifHeaderUnreadCount) {
                    notifHeaderUnreadCount.textContent = `${unread} new`;
                }
                renderNotifications(currentNotifications);
            }
        } catch (e) {
            console.error('Notification load error:', e);
        }
    }

    function renderNotifications(items) {
        if (!notificationList) return;
        if (!items || items.length === 0) {
            notificationList.innerHTML = '<div class="admin-empty-table" style="padding: 1.5rem; font-size:0.8rem;">No notifications in this view.</div>';
            return;
        }

        notificationList.innerHTML = items.map(n => {
            const isUnread = !n.read;
            const timeAgo = formatTimeAgo(n.timestamp);
            let catIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
            let iconClass = 'system';

            if (n.category === 'leads') {
                catIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>';
                iconClass = 'leads';
            } else if (n.severity === 'success') {
                catIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
                iconClass = 'success';
            } else if (n.severity === 'urgent') {
                catIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
                iconClass = 'auth';
            }

            return `
                <div class="admin-notif-item ${isUnread ? 'unread' : ''}" data-notif-id="${escapeHtml(n.id)}" data-link="${escapeHtml(n.link || '')}">
                    ${isUnread ? '<div class="admin-notif-unread-dot"></div>' : ''}
                    <div class="admin-notif-icon ${iconClass}">
                        ${catIcon}
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div class="admin-notif-title">${escapeHtml(n.title)}</div>
                        <div class="admin-notif-msg">${escapeHtml(n.message)}</div>
                        <div class="admin-notif-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function markNotificationAsRead(id) {
        try {
            const res = await authFetch(`/api/admin/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
            if (res.ok) {
                await loadNotifications(currentNotifFilter);
            }
        } catch (e) {
            console.error('Error marking read:', e);
        }
    }

    async function markAllNotificationsRead() {
        try {
            const res = await authFetch('/api/admin/notifications/read-all', { method: 'POST' });
            if (res.ok) {
                await loadNotifications(currentNotifFilter);
            }
        } catch (e) {
            console.error('Error marking all read:', e);
        }
    }

    async function clearAllNotifications() {
        if (!confirm('Clear all notifications?')) return;
        try {
            const res = await authFetch('/api/admin/notifications/clear', { method: 'POST' });
            if (res.ok) {
                await loadNotifications(currentNotifFilter);
            }
        } catch (e) {
            console.error('Error clearing notifications:', e);
        }
    }

    // ════════════════════════════════════════════════════════════════
    // PHASE 18: OUTBOUND WEBHOOK INTEGRATIONS CONTROLLER
    // ════════════════════════════════════════════════════════════════

    async function loadWebhooks() {
        try {
            const res = await authFetch('/api/admin/webhooks');
            const data = await res.json();
            if (data.success && Array.isArray(data.webhooks)) {
                currentWebhooks = data.webhooks;
                renderWebhooks(currentWebhooks);
            }
        } catch (e) {
            console.error('Webhooks load error:', e);
        }
    }

    function renderWebhooks(hooks) {
        if (!webhooksListContainer) return;
        if (!hooks || hooks.length === 0) {
            webhooksListContainer.innerHTML = '<div class="admin-empty-table" style="padding:1.5rem; grid-column:1/-1;">No webhook endpoints configured. Click "+ Add Webhook Endpoint" to create one.</div>';
            return;
        }

        webhooksListContainer.innerHTML = hooks.map(h => {
            const eventChips = (h.events || []).map(ev => `<span class="admin-event-chip">${escapeHtml(ev)}</span>`).join(' ');
            const statusColor = h.active ? '#10b981' : '#64748b';
            const statusLabel = h.active ? 'Active' : 'Paused';
            const lastStatusBadge = h.lastStatus ? `<span class="admin-badge ${h.lastStatus >= 200 && h.lastStatus < 300 ? 'admin-badge-success' : 'admin-badge-danger'}" style="font-size:0.68rem;">HTTP ${h.lastStatus}</span>` : '<span class="admin-badge" style="font-size:0.68rem;">No runs yet</span>';

            return `
                <div class="admin-webhook-card ${!h.active ? 'inactive' : ''}">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
                        <div>
                            <div style="display:flex; align-items:center; gap:0.4rem;">
                                <span style="width:7px; height:7px; border-radius:50%; background:${statusColor}; display:inline-block;"></span>
                                <strong style="font-size:0.88rem; color:var(--adm-text-main);">${escapeHtml(h.name)}</strong>
                                <span class="admin-badge" style="font-size:0.68rem; text-transform:uppercase;">${escapeHtml(h.type || 'generic')}</span>
                            </div>
                            <div style="font-size:0.75rem; color:var(--adm-text-muted); font-family:monospace; margin-top:0.25rem; word-break:break-all;">
                                ${escapeHtml(h.url)}
                            </div>
                        </div>
                        <div style="display:flex; gap:0.35rem;">
                            <button type="button" class="admin-btn-secondary" style="padding:0.3rem 0.55rem; font-size:0.72rem;" data-action="test-webhook" data-id="${escapeHtml(h.id)}" title="Send test ping">Test Ping</button>
                            <button type="button" class="admin-btn-secondary" style="padding:0.3rem 0.55rem; font-size:0.72rem;" data-action="edit-webhook" data-id="${escapeHtml(h.id)}" title="Edit settings">Edit</button>
                        </div>
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:0.25rem; margin-top:0.35rem;">
                        ${eventChips}
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.35rem; padding-top:0.45rem; border-top:1px solid rgba(255,255,255,0.05); font-size:0.72rem; color:var(--adm-text-subtle);">
                        <span>Status: <strong style="color:${statusColor};">${statusLabel}</strong></span>
                        <span>Last delivery: ${lastStatusBadge}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function loadWebhookDeliveries() {
        try {
            const res = await authFetch('/api/admin/webhooks/deliveries');
            const data = await res.json();
            if (data.success && Array.isArray(data.deliveries)) {
                renderWebhookDeliveries(data.deliveries);
            }
        } catch (e) {
            console.error('Webhook deliveries load error:', e);
        }
    }

    function renderWebhookDeliveries(deliveries) {
        if (!webhookDeliveriesContainer) return;
        if (!deliveries || deliveries.length === 0) {
            webhookDeliveriesContainer.innerHTML = '<div class="admin-empty-table" style="padding:1.5rem;">No webhook deliveries logged yet.</div>';
            return;
        }

        webhookDeliveriesContainer.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Event</th>
                        <th>Target Webhook</th>
                        <th>Status</th>
                        <th>Latency</th>
                    </tr>
                </thead>
                <tbody>
                    ${deliveries.map(d => {
                        const statusBadge = d.success 
                            ? `<span class="admin-badge admin-badge-success" style="font-size:0.7rem;">HTTP ${d.status_code || 200} OK</span>`
                            : `<span class="admin-badge admin-badge-danger" style="font-size:0.7rem;">HTTP ${d.status_code || 0} Error</span>`;
                        return `
                            <tr>
                                <td style="font-size:0.75rem; color:var(--adm-text-muted);">${formatDate(d.timestamp, true)}</td>
                                <td><span class="admin-event-chip">${escapeHtml(d.event)}</span></td>
                                <td style="font-size:0.78rem; font-weight:600; color:var(--adm-text);">${escapeHtml(d.webhook_name || d.webhook_id)}</td>
                                <td>${statusBadge}</td>
                                <td style="font-size:0.75rem; color:var(--adm-text-subtle);">${d.latency_ms || 0}ms</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    function openWebhookModal(hook = null) {
        if (!webhookModal) return;
        if (webhookForm) webhookForm.reset();

        if (hook) {
            if (webhookModalTitle) webhookModalTitle.textContent = 'Edit Webhook Integration';
            if (hookEditId) hookEditId.value = hook.id;
            if (hookName) hookName.value = hook.name || '';
            if (hookType) hookType.value = hook.type || 'generic';
            if (hookActive) hookActive.value = hook.active ? 'true' : 'false';
            if (hookUrl) hookUrl.value = hook.url || '';
            if (hookSecret) hookSecret.value = hook.secret || '';

            const selectedEvents = hook.events || [];
            document.querySelectorAll('input[name="hook_event"]').forEach(cb => {
                cb.checked = selectedEvents.includes(cb.value) || selectedEvents.includes('*');
            });

            if (webhookModalDeleteBtn) webhookModalDeleteBtn.style.display = 'inline-flex';
        } else {
            if (webhookModalTitle) webhookModalTitle.textContent = 'Add Webhook Integration';
            if (hookEditId) hookEditId.value = '';
            if (hookType) hookType.value = 'generic';
            if (hookActive) hookActive.value = 'true';
            document.querySelectorAll('input[name="hook_event"]').forEach(cb => cb.checked = true);
            if (webhookModalDeleteBtn) webhookModalDeleteBtn.style.display = 'none';
        }

        webhookModal.style.display = 'flex';
        if (webhookModalBackdrop) webhookModalBackdrop.classList.add('is-open');
    }

    function closeWebhookModal() {
        if (webhookModal) webhookModal.style.display = 'none';
        if (webhookModalBackdrop) webhookModalBackdrop.classList.remove('is-open');
    }

    async function saveWebhook() {
        if (!hookName || !hookUrl) return;
        const name = hookName.value.trim();
        const url = hookUrl.value.trim();

        if (!name || !url) {
            alert('Please provide a name and valid webhook URL.');
            return;
        }

        const events = Array.from(document.querySelectorAll('input[name="hook_event"]:checked')).map(cb => cb.value);
        if (events.length === 0) {
            alert('Please select at least one event topic to subscribe to.');
            return;
        }

        const payload = {
            name,
            url,
            type: hookType ? hookType.value : 'generic',
            active: hookActive ? hookActive.value === 'true' : true,
            secret: hookSecret ? hookSecret.value.trim() : '',
            events
        };

        const isEdit = hookEditId && hookEditId.value;
        const targetUrl = isEdit ? `/api/admin/webhooks/${encodeURIComponent(hookEditId.value)}` : '/api/admin/webhooks';
        const method = isEdit ? 'PUT' : 'POST';

        if (webhookModalSaveBtn) webhookModalSaveBtn.disabled = true;

        try {
            const res = await authFetch(targetUrl, {
                method,
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                closeWebhookModal();
                await loadWebhooks();
            } else {
                alert('Error saving webhook: ' + (data.error || 'Server error'));
            }
        } catch (err) {
            alert('Connection error: ' + err.message);
        } finally {
            if (webhookModalSaveBtn) webhookModalSaveBtn.disabled = false;
        }
    }

    async function deleteWebhook(id) {
        if (!confirm('Are you sure you want to delete this webhook integration?')) return;
        try {
            const res = await authFetch(`/api/admin/webhooks/${encodeURIComponent(id)}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                closeWebhookModal();
                await loadWebhooks();
            } else {
                alert('Error deleting webhook: ' + (data.error || 'Server error'));
            }
        } catch (err) {
            alert('Connection error: ' + err.message);
        }
    }

    async function testWebhook(id) {
        try {
            const res = await authFetch(`/api/admin/webhooks/${encodeURIComponent(id)}/test`, { method: 'POST' });
            const data = await res.json();
            if (res.ok && data.success) {
                const code = data.delivery ? data.delivery.status_code : 200;
                alert(`Test ping dispatched successfully!\nHTTP Status: ${code}\nLatency: ${data.delivery ? data.delivery.latency_ms : 0}ms`);
                await loadWebhookDeliveries();
                await loadWebhooks();
            } else {
                alert('Test ping failed: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Connection error: ' + err.message);
        }
    }

    // --- Password Visibility Toggles ---
    function setupPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.admin-pwd-toggle-btn');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const targetId = btn.getAttribute('data-target');
                let input = null;
                if (targetId) {
                    input = document.getElementById(targetId);
                }
                if (!input) {
                    input = btn.closest('.admin-input-wrap')?.querySelector('input');
                }
                if (!input) return;

                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';

                const showIcon = btn.querySelector('.admin-pwd-eye-icon--show');
                const hideIcon = btn.querySelector('.admin-pwd-eye-icon--hide');
                if (showIcon && hideIcon) {
                    showIcon.style.display = isPassword ? 'none' : 'block';
                    hideIcon.style.display = isPassword ? 'block' : 'none';
                }
                const label = isPassword ? 'Hide password' : 'Show password';
                btn.setAttribute('aria-label', label);
                btn.setAttribute('title', label);
                input.focus();
            });
        });
    }

    // --- Global Event Attachments ---
    function setupEvents() {
        // Notification Center bindings (Phase 18)
        if (btnNotificationBell && notificationDrawer) {
            btnNotificationBell.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = notificationDrawer.style.display !== 'none';
                notificationDrawer.style.display = isOpen ? 'none' : 'flex';
                btnNotificationBell.setAttribute('aria-expanded', !isOpen);
                if (!isOpen) loadNotifications(currentNotifFilter);
            });
        }

        notifTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                notifTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentNotifFilter = tab.dataset.notifFilter;
                loadNotifications(currentNotifFilter);
            });
        });

        if (btnMarkAllRead) {
            btnMarkAllRead.addEventListener('click', (e) => {
                e.stopPropagation();
                markAllNotificationsRead();
            });
        }

        if (btnClearAllNotifs) {
            btnClearAllNotifs.addEventListener('click', (e) => {
                e.stopPropagation();
                clearAllNotifications();
            });
        }

        if (notificationList) {
            notificationList.addEventListener('click', (e) => {
                const item = e.target.closest('.admin-notif-item');
                if (!item) return;
                const id = item.dataset.notifId;
                const link = item.dataset.link;
                if (id) markNotificationAsRead(id);
                if (link && link.startsWith('#')) {
                    const tabName = link.substring(1);
                    switchTab(tabName);
                    if (notificationDrawer) notificationDrawer.style.display = 'none';
                }
            });
        }

        // Webhooks Management Bindings (Phase 18)
        if (btnAddWebhook) {
            btnAddWebhook.addEventListener('click', () => openWebhookModal(null));
        }

        if (btnGenerateSecret && hookSecret) {
            btnGenerateSecret.addEventListener('click', () => {
                const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                    .map(b => b.toString(16).padStart(2, '0')).join('');
                hookSecret.value = 'whsec_' + randomHex;
            });
        }

        if (btnRefreshDeliveries) {
            btnRefreshDeliveries.addEventListener('click', loadWebhookDeliveries);
        }

        if (webhookModalCloseBtn) webhookModalCloseBtn.addEventListener('click', closeWebhookModal);
        if (webhookModalCancelBtn) webhookModalCancelBtn.addEventListener('click', closeWebhookModal);
        if (webhookModalSaveBtn) webhookModalSaveBtn.addEventListener('click', saveWebhook);
        if (webhookModalDeleteBtn) {
            webhookModalDeleteBtn.addEventListener('click', () => {
                if (hookEditId && hookEditId.value) deleteWebhook(hookEditId.value);
            });
        }
        if (webhookModalBackdrop) {
            webhookModalBackdrop.addEventListener('click', (e) => {
                if (e.target === webhookModalBackdrop) closeWebhookModal();
            });
        }

        if (webhooksListContainer) {
            webhooksListContainer.addEventListener('click', (e) => {
                const testBtn = e.target.closest('[data-action="test-webhook"]');
                if (testBtn) {
                    testWebhook(testBtn.dataset.id);
                    return;
                }
                const editBtn = e.target.closest('[data-action="edit-webhook"]');
                if (editBtn) {
                    const hook = currentWebhooks.find(h => h.id === editBtn.dataset.id);
                    if (hook) openWebhookModal(hook);
                    return;
                }
            });
        }

        // Close drawer on click outside
        document.addEventListener('click', (e) => {
            if (notificationDrawer && notificationDrawer.style.display !== 'none') {
                if (!notificationDrawer.contains(e.target) && !btnNotificationBell.contains(e.target)) {
                    notificationDrawer.style.display = 'none';
                    if (btnNotificationBell) btnNotificationBell.setAttribute('aria-expanded', 'false');
                }
            }
        });

        // Periodic live notification check (every 30s)
        setInterval(() => {
            if (getToken()) {
                loadNotifications(currentNotifFilter);
            }
        }, 30000);

        // Login bindings
        if (loginSubmitBtn) loginSubmitBtn.addEventListener('click', handleLogin);
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
        if (loginPassword) {
            loginPassword.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLogin(e);
                }
            });
        }
        setupPasswordToggles();

        // Header bindings
        if (btnLogout) {
            btnLogout.addEventListener('click', async function () {
                try { await authFetch('/api/admin/logout', { method: 'POST' }); } catch (e) {}
                setToken(null);
                showLogin();
            });
        }
        if (btnRefresh) {
            btnRefresh.addEventListener('click', loadAllData);
        }

        const handleExportCsv = async function (e) {
            if (e && e.preventDefault) e.preventDefault();
            if (e && e.stopPropagation) e.stopPropagation();

            const targetBtn = (e && e.currentTarget) || (e && e.target && e.target.closest ? e.target.closest('#btn-leads-export-csv, #btn-export-csv, .btn-export-csv') : null);
            let prevText = '';
            if (targetBtn) {
                prevText = targetBtn.innerHTML;
                targetBtn.disabled = true;
                targetBtn.innerHTML = '<span>Exporting...</span>';
            }

            try {
                const res = await authFetch('/api/admin/export.csv');
                if (!res.ok) throw new Error('Export failed: ' + res.status);
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const today = new Date().toISOString().slice(0, 10);
                a.download = 'versaly-leads-' + today + '.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (err) {
                console.error('Export CSV error:', err);
                // Fallback attempt via tokenized URL
                const token = getToken();
                if (token) {
                    window.location.href = getApiUrl('/api/admin/export.csv?token=' + encodeURIComponent(token));
                    return;
                }
                alert('Could not export CSV: ' + err.message);
            } finally {
                if (targetBtn) {
                    setTimeout(() => {
                        targetBtn.disabled = false;
                        targetBtn.innerHTML = prevText;
                    }, 600);
                }
            }
        };

        window.handleExportCsv = handleExportCsv;

        if (btnExportCsv) {
            btnExportCsv.addEventListener('click', handleExportCsv);
        }
        if (btnLeadsExportCsv) {
            btnLeadsExportCsv.addEventListener('click', handleExportCsv);
        }
        document.querySelectorAll('.btn-export-csv, [data-action="export-csv"]').forEach(btn => {
            btn.addEventListener('click', handleExportCsv);
        });
        document.addEventListener('click', e => {
            const btn = e.target && e.target.closest ? e.target.closest('#btn-leads-export-csv, #btn-export-csv, .btn-export-csv, [data-action="export-csv"]') : null;
            if (btn) {
                handleExportCsv(e);
            }
        });

        // Analytics Timeframe & Trend Controls
        if (analyticsRangeGroup) {
            analyticsRangeGroup.addEventListener('click', e => {
                const btn = e.target.closest('[data-analytics-range]');
                if (!btn) return;
                analyticsRangeGroup.querySelectorAll('[data-analytics-range]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                loadAnalyticsTrends(btn.dataset.analyticsRange);
            });
        }

        if (btnRefreshAnalytics) {
            btnRefreshAnalytics.addEventListener('click', () => {
                loadAnalyticsTrends(currentAnalyticsRange);
                loadAuditLogs(currentAuditCategory, currentAuditSearch);
            });
        }

        const handleExportExecReport = async function () {
            try {
                const res = await authFetch('/api/admin/analytics/report');
                if (!res.ok) throw new Error('Report fetch failed: ' + res.status);
                const data = await res.json();
                const jsonStr = JSON.stringify(data.report, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const today = new Date().toISOString().slice(0, 10);
                a.download = 'versaly-executive-report-' + today + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (err) {
                alert('Could not download executive report: ' + err.message);
            }
        };

        if (btnExportExecReport) {
            btnExportExecReport.addEventListener('click', handleExportExecReport);
        }

        // Audit Trail Controls
        if (auditFilterGroup) {
            auditFilterGroup.addEventListener('click', e => {
                const btn = e.target.closest('[data-audit-category]');
                if (!btn) return;
                auditFilterGroup.querySelectorAll('[data-audit-category]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentAuditCategory = btn.dataset.auditCategory;
                loadAuditLogs(currentAuditCategory, currentAuditSearch);
            });
        }

        if (auditSearchInput) {
            let auditSearchDebounce;
            auditSearchInput.addEventListener('input', () => {
                clearTimeout(auditSearchDebounce);
                auditSearchDebounce = setTimeout(() => {
                    currentAuditSearch = auditSearchInput.value.trim();
                    loadAuditLogs(currentAuditCategory, currentAuditSearch);
                }, 250);
            });
        }

        const handleExportAuditCsv = async function () {
            try {
                const res = await authFetch('/api/admin/audit/export.csv');
                if (!res.ok) throw new Error('Export failed: ' + res.status);
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const today = new Date().toISOString().slice(0, 10);
                a.download = 'versaly-audit-log-' + today + '.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (err) {
                alert('Could not export audit log: ' + err.message);
            }
        };

        if (btnExportAuditCsv) {
            btnExportAuditCsv.addEventListener('click', handleExportAuditCsv);
        }

        const handleClearAuditLogs = async function () {
            if (!confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
                return;
            }
            try {
                const res = await authFetch('/api/admin/audit/clear', { method: 'POST' });
                const data = await res.json();
                if (res.ok && data.success) {
                    await loadAuditLogs(currentAuditCategory, currentAuditSearch);
                } else {
                    alert('Error clearing logs: ' + (data.error || 'Server error'));
                }
            } catch (e) {
                alert('Connection error: ' + e.message);
            }
        };

        if (btnClearAuditLogs) {
            btnClearAuditLogs.addEventListener('click', handleClearAuditLogs);
        }

        // Sidebar link clicks
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tab = link.dataset.tab;
                if (tab) switchTab(tab);
            });
        });

        // Mobile sidebar toggle with backdrop
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        function closeMobileSidebar() {
            if (adminSidebar) adminSidebar.classList.remove('is-open');
            if (sidebarBackdrop) sidebarBackdrop.classList.remove('is-open');
        }
        function toggleMobileSidebar() {
            if (!adminSidebar) return;
            const isOpen = adminSidebar.classList.toggle('is-open');
            if (sidebarBackdrop) sidebarBackdrop.classList.toggle('is-open', isOpen);
        }

        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', toggleMobileSidebar);
        }
        if (sidebarCloseMobile) {
            sidebarCloseMobile.addEventListener('click', closeMobileSidebar);
        }
        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', closeMobileSidebar);
        }

        // Quick action buttons
        if (btnQuickAddProduct) {
            btnQuickAddProduct.addEventListener('click', () => {
                switchTab('products');
                openProductModal(null);
            });
        }
        if (btnQuickViewDemos) {
            btnQuickViewDemos.addEventListener('click', () => {
                switchTab('leads');
                leadFilter.type = 'demo_request';
                if (leadFilterGroup) {
                    leadFilterGroup.querySelectorAll('[data-filter-type]').forEach(b => {
                        if (b.dataset.filterType === 'demo_request') b.classList.add('active');
                        else b.classList.remove('active');
                    });
                }
                renderLeadsTable();
            });
        }
        if (btnQuickPublicCatalog) {
            btnQuickPublicCatalog.addEventListener('click', () => {
                window.open('/products.html', '_blank');
            });
        }

        // Products CMS Toolbar
        if (btnAddProduct) {
            btnAddProduct.addEventListener('click', () => openProductModal(null));
        }

        if (productFilterGroup) {
            productFilterGroup.addEventListener('click', e => {
                const btn = e.target.closest('.admin-filter-btn');
                if (!btn) return;
                productFilterGroup.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                productFilter.status = btn.dataset.prodStatus || 'all';
                renderProductsTable();
            });
        }

        if (productCategoryFilter) {
            productCategoryFilter.addEventListener('change', () => renderProductsTable());
        }

        if (productSearchInput) {
            productSearchInput.addEventListener('input', () => renderProductsTable());
        }

        // Products Table Actions (Delegated)
        if (productsTbody) {
            productsTbody.addEventListener('click', async e => {
                const editBtn = e.target.closest('[data-action="edit-product"]');
                if (editBtn) {
                    const id = editBtn.dataset.id;
                    const prod = currentProducts.find(p => p.id === id);
                    if (prod) openProductModal(prod);
                    return;
                }

                const upBtn = e.target.closest('[data-action="order-up"]');
                if (upBtn) {
                    await moveProductOrder(upBtn.dataset.id, 'up');
                    return;
                }

                const downBtn = e.target.closest('[data-action="order-down"]');
                if (downBtn) {
                    await moveProductOrder(downBtn.dataset.id, 'down');
                    return;
                }
            });

            productsTbody.addEventListener('change', async e => {
                const statusSelect = e.target.closest('[data-action="change-status"]');
                if (statusSelect) {
                    await updateProductStatusInline(statusSelect.dataset.id, statusSelect.value);
                }
            });
        }

        // Product Modal Buttons & Form
        const productEditorForm = document.getElementById('product-editor-form');
        if (productEditorForm) {
            productEditorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveProduct(false);
            });
        }
        if (productModalCloseBtn) productModalCloseBtn.addEventListener('click', closeProductModal);
        if (productModalCancelBtn) productModalCancelBtn.addEventListener('click', closeProductModal);
        if (productModalSaveBtn) productModalSaveBtn.addEventListener('click', () => saveProduct(false));
        if (productModalDraftBtn) productModalDraftBtn.addEventListener('click', () => saveProduct(true));
        if (productModalDeleteBtn) productModalDeleteBtn.addEventListener('click', deleteProduct);

        if (productModalBackdrop) {
            productModalBackdrop.addEventListener('click', e => {
                if (e.target === productModalBackdrop) closeProductModal();
            });
        }

        // Leads & CRM Filters Toolbar (Phase 10)
        if (leadStageFilterGroup) {
            leadStageFilterGroup.addEventListener('click', e => {
                const btn = e.target.closest('.admin-filter-btn');
                if (!btn) return;
                leadStageFilterGroup.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                leadFilter.status = btn.dataset.stage || 'all';
                renderLeadsTable();
            });
        }

        if (leadFilterGroup) {
            leadFilterGroup.addEventListener('click', e => {
                const btn = e.target.closest('.admin-filter-btn');
                if (!btn) return;
                leadFilterGroup.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                leadFilter.type = btn.dataset.filterType || 'all';
                renderLeadsTable();
            });
        }

        if (leadPriorityFilter) {
            leadPriorityFilter.addEventListener('change', () => {
                leadFilter.priority = leadPriorityFilter.value;
                renderLeadsTable();
            });
        }

        if (leadFollowupFilter) {
            leadFollowupFilter.addEventListener('change', () => {
                leadFilter.followup = leadFollowupFilter.value;
                renderLeadsTable();
            });
        }

        if (leadSearchInput) {
            leadSearchInput.addEventListener('input', () => renderLeadsTable());
        }

        // Leads Table View Detail
        if (leadsTbody) {
            leadsTbody.addEventListener('click', e => {
                const btn = e.target.closest('[data-action="view-lead"]');
                if (!btn) return;
                const ref = btn.dataset.ref;
                const lead = currentSubmissions.find(i => i.ref_id === ref);
                if (lead) openLeadDrawer(lead);
            });
        }

        // Leads Drawer Buttons
        if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeLeadDrawer);
        if (leadDrawerBackdrop) {
            leadDrawerBackdrop.addEventListener('click', e => {
                if (e.target === leadDrawerBackdrop) closeLeadDrawer();
            });
        }

        if (drawerBtnAdvanceStage) {
            drawerBtnAdvanceStage.addEventListener('click', advanceLeadStage);
        }

        if (drawerBtnAddNote) {
            drawerBtnAddNote.addEventListener('click', addLeadNote);
        }

        if (drawerNewNoteText) {
            drawerNewNoteText.addEventListener('keydown', e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    addLeadNote();
                }
            });
        }

        if (drawerSaveBtn) {
            drawerSaveBtn.addEventListener('click', () => saveLeadCRMDetails(false));
        }

        if (drawerDeleteBtn) {
            drawerDeleteBtn.addEventListener('click', async () => {
                if (!selectedLead) return;
                const confirmed = confirm(`Are you sure you want to permanently delete lead ${selectedLead.ref_id}? This cannot be undone.`);
                if (!confirmed) return;

                drawerDeleteBtn.disabled = true;
                drawerDeleteBtn.textContent = 'Deleting...';

                try {
                    const res = await authFetch('/api/admin/submissions/' + selectedLead.ref_id, { method: 'DELETE' });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        closeLeadDrawer();
                        await loadAllData();
                    } else {
                        alert('Error deleting lead: ' + (data.error || 'Unknown error'));
                    }
                } catch (err) {
                    alert('Connection error: ' + err.message);
                } finally {
                    drawerDeleteBtn.disabled = false;
                    drawerDeleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg><span>Delete Lead</span>';
                }
            });
        }

        // Tab 6: Settings CMS Buttons (Phase 10)
        if (btnSaveSettings) {
            btnSaveSettings.addEventListener('click', saveSettings);
        }

        if (btnChangePassword) {
            btnChangePassword.addEventListener('click', changeAdminPassword);
        }

        // --- Media Library Toolbar & Upload Events (Phase 8) ---
        if (btnUploadMedia && mediaFileInput) {
            btnUploadMedia.addEventListener('click', () => mediaFileInput.click());
        }

        if (mediaFileInput) {
            mediaFileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    uploadFiles(e.target.files);
                    mediaFileInput.value = '';
                }
            });
        }

        if (mediaDropzone) {
            mediaDropzone.addEventListener('click', (e) => {
                if (mediaFileInput) mediaFileInput.click();
            });

            mediaDropzone.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (mediaFileInput) mediaFileInput.click();
                }
            });

            ['dragenter', 'dragover'].forEach(evtName => {
                mediaDropzone.addEventListener(evtName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    mediaDropzone.classList.add('is-dragover');
                });
            });

            ['dragleave', 'drop'].forEach(evtName => {
                mediaDropzone.addEventListener(evtName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    mediaDropzone.classList.remove('is-dragover');
                });
            });

            mediaDropzone.addEventListener('drop', (e) => {
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    uploadFiles(e.dataTransfer.files);
                }
            });
        }

        if (mediaFilterGroup) {
            mediaFilterGroup.addEventListener('click', e => {
                const btn = e.target.closest('.admin-filter-btn');
                if (!btn) return;
                mediaFilterGroup.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                mediaFilter.type = btn.dataset.mediaType || 'all';
                renderMediaGrid();
            });
        }

        if (mediaProductFilter) {
            mediaProductFilter.addEventListener('change', () => {
                mediaFilter.product = mediaProductFilter.value;
                renderMediaGrid();
            });
        }

        if (mediaSearchInput) {
            mediaSearchInput.addEventListener('input', () => {
                mediaFilter.search = mediaSearchInput.value.trim();
                renderMediaGrid();
            });
        }

        // Media Grid Actions (Delegated)
        if (mediaGridContainer) {
            mediaGridContainer.addEventListener('click', async e => {
                const viewBtn = e.target.closest('[data-action="view-media"], [data-action="edit-media"]');
                if (viewBtn) {
                    const id = viewBtn.dataset.id;
                    if (id) openMediaDetailModal(id);
                    return;
                }

                const delBtn = e.target.closest('[data-action="delete-media"]');
                if (delBtn) {
                    const id = delBtn.dataset.id;
                    if (id) await deleteMediaItem(id);
                    return;
                }

                const copyBtn = e.target.closest('[data-action="copy-url"]');
                if (copyBtn) {
                    const url = copyBtn.dataset.url;
                    if (url) {
                        try {
                            const fullUrl = window.location.origin + url;
                            await navigator.clipboard.writeText(fullUrl);
                            const origSpan = copyBtn.querySelector('span');
                            if (origSpan) {
                                const origText = origSpan.textContent;
                                origSpan.textContent = 'Copied!';
                                setTimeout(() => origSpan.textContent = origText, 1200);
                            }
                        } catch (err) {
                            prompt('Asset URL:', url);
                        }
                    }
                }
            });
        }

        // Media Detail Modal Actions
        if (mediaModalCloseBtn) mediaModalCloseBtn.addEventListener('click', closeMediaDetailModal);
        if (medDetailCancelBtn) medDetailCancelBtn.addEventListener('click', closeMediaDetailModal);
        if (medDetailSaveBtn) medDetailSaveBtn.addEventListener('click', saveMediaDetail);
        if (medDetailDeleteBtn) {
            medDetailDeleteBtn.addEventListener('click', async () => {
                if (selectedMediaDetail) await deleteMediaItem(selectedMediaDetail.id);
            });
        }
        if (medDetailCopyUrlBtn) {
            medDetailCopyUrlBtn.addEventListener('click', async () => {
                if (selectedMediaDetail) {
                    try {
                        const fullUrl = window.location.origin + selectedMediaDetail.url;
                        await navigator.clipboard.writeText(fullUrl);
                        medDetailCopyUrlBtn.textContent = '✓ Copied to Clipboard!';
                        setTimeout(() => medDetailCopyUrlBtn.textContent = 'Copy Public URL', 1500);
                    } catch (err) {
                        prompt('Asset URL:', selectedMediaDetail.url);
                    }
                }
            });
        }

        if (mediaDetailBackdrop) {
            mediaDetailBackdrop.addEventListener('click', e => {
                if (e.target === mediaDetailBackdrop) closeMediaDetailModal();
            });
        }

        // Media Picker Modal Actions
        if (mediaPickerCloseBtn) mediaPickerCloseBtn.addEventListener('click', closeMediaPicker);
        if (pickerCancelBtn) pickerCancelBtn.addEventListener('click', closeMediaPicker);
        if (pickerConfirmBtn) pickerConfirmBtn.addEventListener('click', confirmMediaPicker);

        if (pickerUploadBtn && pickerFileInput) {
            pickerUploadBtn.addEventListener('click', () => pickerFileInput.click());
            pickerFileInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                if (pickerUploadStatus) {
                    pickerUploadStatus.textContent = `Uploading ${files.length} asset${files.length > 1 ? 's' : ''}...`;
                    pickerUploadStatus.style.display = 'block';
                }
                const origHtml = pickerUploadBtn.innerHTML;
                pickerUploadBtn.innerHTML = '<span>Uploading...</span>';
                pickerUploadBtn.disabled = true;
                let lastUploaded = null;
                try {
                    for (const file of files) {
                        lastUploaded = await uploadSingleFile(file);
                    }
                    renderPickerGrid('all', '');
                    if (lastUploaded) {
                        selectedPickerItem = lastUploaded;
                        if (pickerConfirmBtn) pickerConfirmBtn.disabled = false;
                        if (pickerSelectionInfo) {
                            pickerSelectionInfo.textContent = `Selected: ${lastUploaded.title || lastUploaded.filename}`;
                        }
                        if (pickerGridContainer) {
                            pickerGridContainer.querySelectorAll('.admin-picker-item').forEach(el => {
                                if (el.dataset.pickerId === lastUploaded.id) el.classList.add('selected');
                                else el.classList.remove('selected');
                            });
                        }
                    }
                } catch (err) {
                    alert('Upload failed: ' + err.message);
                } finally {
                    pickerUploadBtn.innerHTML = origHtml;
                    pickerUploadBtn.disabled = false;
                    if (pickerUploadStatus) pickerUploadStatus.style.display = 'none';
                    pickerFileInput.value = '';
                }
            });
        }

        if (pickerFilterGroup) {
            pickerFilterGroup.addEventListener('click', e => {
                const btn = e.target.closest('.admin-filter-btn');
                if (!btn) return;
                pickerFilterGroup.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const t = btn.dataset.pickerFilter || btn.dataset.pickerType || 'all';
                const q = pickerSearchInput ? pickerSearchInput.value.trim() : '';
                renderPickerGrid(t, q);
            });
        }

        if (pickerSearchInput) {
            pickerSearchInput.addEventListener('input', () => {
                const activeBtn = pickerFilterGroup ? pickerFilterGroup.querySelector('.admin-filter-btn.active') : null;
                const t = activeBtn ? (activeBtn.dataset.pickerFilter || activeBtn.dataset.pickerType || 'all') : 'all';
                renderPickerGrid(t, pickerSearchInput.value.trim());
            });
        }

        if (mediaPickerBackdrop) {
            mediaPickerBackdrop.addEventListener('click', e => {
                if (e.target === mediaPickerBackdrop) closeMediaPicker();
            });

            ['dragenter', 'dragover'].forEach(evtName => {
                mediaPickerBackdrop.addEventListener(evtName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            mediaPickerBackdrop.addEventListener('drop', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const files = Array.from(e.dataTransfer.files);
                    if (pickerUploadStatus) {
                        pickerUploadStatus.textContent = `Uploading ${files.length} asset${files.length > 1 ? 's' : ''}...`;
                        pickerUploadStatus.style.display = 'block';
                    }
                    let lastUploaded = null;
                    try {
                        for (const file of files) {
                            lastUploaded = await uploadSingleFile(file);
                        }
                        renderPickerGrid('all', '');
                        if (lastUploaded) {
                            selectedPickerItem = lastUploaded;
                            if (pickerConfirmBtn) pickerConfirmBtn.disabled = false;
                            if (pickerSelectionInfo) {
                                pickerSelectionInfo.textContent = `Selected: ${lastUploaded.title || lastUploaded.filename}`;
                            }
                            if (pickerGridContainer) {
                                pickerGridContainer.querySelectorAll('.admin-picker-item').forEach(el => {
                                    if (el.dataset.pickerId === lastUploaded.id) el.classList.add('selected');
                                    else el.classList.remove('selected');
                                });
                            }
                        }
                    } catch (err) {
                        alert('Upload failed: ' + err.message);
                    } finally {
                        if (pickerUploadStatus) pickerUploadStatus.style.display = 'none';
                    }
                }
            });
        }

        // Content CMS Actions (Phase 9)
        if (btnAddContentItem) {
            btnAddContentItem.addEventListener('click', () => {
                openContentModal(activeContentSubTab, null);
            });
        }

        if (contentSubnavBtns && contentSubnavBtns.length > 0) {
            contentSubnavBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const sub = btn.dataset.contentSubtab || btn.dataset.subnav;
                    if (sub) switchContentSubTab(sub);
                });
            });
        }

        if (contentFilterGroup) {
            contentFilterGroup.addEventListener('click', e => {
                const btn = e.target.closest('.admin-filter-btn');
                if (!btn) return;
                contentFilterGroup.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                contentFilter.status = btn.dataset.contentFilter || btn.dataset.status || 'all';
                renderContentSection();
            });
        }

        if (contentSearchInput) {
            contentSearchInput.addEventListener('input', () => {
                contentFilter.search = contentSearchInput.value.trim();
                renderContentSection();
            });
        }

        if (contentListContainer) {
            contentListContainer.addEventListener('click', async e => {
                const editBtn = e.target.closest('[data-action="edit-content"]');
                if (editBtn) {
                    const id = editBtn.dataset.id;
                    const item = (currentContent[activeContentSubTab] || []).find(it => it.id === id);
                    if (item) openContentModal(activeContentSubTab, item);
                    return;
                }

                const delBtn = e.target.closest('[data-action="delete-content"]');
                if (delBtn) {
                    const id = delBtn.dataset.id;
                    if (id) await deleteContentItem(activeContentSubTab, id);
                    return;
                }

                const upBtn = e.target.closest('[data-action="order-content-up"]');
                if (upBtn) {
                    const id = upBtn.dataset.id;
                    if (id) await moveContentOrder(activeContentSubTab, id, 'up');
                    return;
                }

                const downBtn = e.target.closest('[data-action="order-content-down"]');
                if (downBtn) {
                    const id = downBtn.dataset.id;
                    if (id) await moveContentOrder(activeContentSubTab, id, 'down');
                    return;
                }
            });
        }

        if (testRatingStars) {
            testRatingStars.addEventListener('click', e => {
                const btn = e.target.closest('.star-btn');
                if (!btn) return;
                const rating = parseInt(btn.dataset.rating, 10) || 5;
                setRatingStarsValue(rating);
            });
        }

        if (btnPickTestAvatar) {
            btnPickTestAvatar.addEventListener('click', () => {
                openMediaPicker(mediaItem => {
                    const url = typeof mediaItem === 'string' ? mediaItem : (mediaItem && mediaItem.url ? mediaItem.url : '');
                    if (testAvatar) testAvatar.value = url;
                });
            });
        }

        if (btnPickPartnerLogo) {
            btnPickPartnerLogo.addEventListener('click', () => {
                openMediaPicker(mediaItem => {
                    const url = typeof mediaItem === 'string' ? mediaItem : (mediaItem && mediaItem.url ? mediaItem.url : '');
                    if (partnerLogo) partnerLogo.value = url;
                });
            });
        }

        // Content Item Modal Actions
        const contentItemForm = document.getElementById('content-item-form');
        if (contentItemForm) {
            contentItemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveContentItem();
            });
        }

        if (contentModalCloseBtn) contentModalCloseBtn.addEventListener('click', closeContentModal);
        if (contentModalCancelBtn) contentModalCancelBtn.addEventListener('click', closeContentModal);
        if (contentModalSaveBtn) contentModalSaveBtn.addEventListener('click', saveContentItem);
        if (contentModalDeleteBtn) {
            contentModalDeleteBtn.addEventListener('click', async () => {
                if (editingContentItem) {
                    const sec = contentItemSection ? contentItemSection.value : activeContentSubTab;
                    await deleteContentItem(sec, editingContentItem.id);
                }
            });
        }

        if (contentModalBackdrop) {
            contentModalBackdrop.addEventListener('click', e => {
                if (e.target === contentModalBackdrop) closeContentModal();
            });
        }

        // Global Escape Key to close modals
        window.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (productModalBackdrop && productModalBackdrop.classList.contains('is-open')) {
                    closeProductModal();
                } else if (leadDrawerBackdrop && leadDrawerBackdrop.classList.contains('is-open')) {
                    closeLeadDrawer();
                } else if (mediaDetailBackdrop && mediaDetailBackdrop.classList.contains('is-open')) {
                    closeMediaDetailModal();
                } else if (mediaPickerBackdrop && mediaPickerBackdrop.classList.contains('is-open')) {
                    closeMediaPicker();
                } else if (contentModalBackdrop && contentModalBackdrop.classList.contains('is-open')) {
                    closeContentModal();
                }
            }
        });
    }

    // --- Format & Utility Helpers ---
    function formatDate(isoStr, full = false) {
        if (!isoStr) return '-';
        try {
            const d = new Date(isoStr);
            if (isNaN(d.getTime())) return isoStr;
            if (full) {
                return d.toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
            }
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return isoStr;
        }
    }

    function formatTimeAgo(isoStr) {
        if (!isoStr) return 'Recently';
        try {
            const d = new Date(isoStr);
            const now = new Date();
            const diffSec = Math.floor((now - d) / 1000);
            if (diffSec < 60) return 'Just now';
            if (diffSec < 3600) return Math.floor(diffSec / 60) + 'm ago';
            if (diffSec < 86400) return Math.floor(diffSec / 3600) + 'h ago';
            return Math.floor(diffSec / 86400) + 'd ago';
        } catch (e) {
            return 'Recently';
        }
    }

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // --- Initialization Boot ---
    async function init() {
        setupEvents();

        const token = getToken();
        if (token) {
            try {
                const verifyUrl = getApiUrl('/api/admin/verify');
                const res = await fetch(verifyUrl, {
                    headers: { 'Authorization': 'Bearer ' + token, 'x-admin-token': token }
                });
                const data = await res.json();
                if (res.ok && data.authenticated) {
                    showDashboard();
                    await loadAllData();
                    return;
                }
            } catch (e) {}
        }
        setToken(null);
        showLogin();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
