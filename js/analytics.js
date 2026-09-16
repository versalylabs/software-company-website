/**
 * softify Analytics & Privacy-First Conversion Tracking Engine
 * 
 * Supports Google Analytics 4 (GA4) with zero PII leakage, automatic CTA delegation,
 * product interest metrics, conversion funnel tracking, and graceful fallback.
 */

(function (window, document) {
    'use strict';

    // ── Default Configuration ──────────────────────────────────────────────
    var DEFAULT_CONFIG = {
        // Replace with your production GA4 Measurement ID (e.g., 'G-XXXXXXXXXX')
        measurementId: '',
        
        // Set to true to activate external provider loading
        enabled: false,
        
        // Set to true to log tracked events and funnel steps to the browser console
        debug: false,
        
        // If true, requires explicit consent via softifyAnalytics.setConsent(true) before sending events
        requireConsent: false,
        
        // If true, disables external tracking when browser Do Not Track (DNT) is active
        respectDoNotTrack: true
    };

    // Merge global configuration if predefined
    var config = Object.assign({}, DEFAULT_CONFIG, window.softifyAnalyticsConfig || {});

    // Internal state
    var state = {
        initialized: false,
        providerLoaded: false,
        consentGranted: false,
        sessionFormStarted: {
            demo_request: false,
            contact: false
        }
    };

    // ── PII Protection & Parameter Sanitizer ────────────────────────────────
    // Strict blocklist of forbidden keys that represent personal data
    var FORBIDDEN_PII_KEYS = [
        'name', 'full_name', 'fullname', 'firstname', 'first_name', 'lastname', 'last_name',
        'user_name', 'username', 'customer_name', 'contact_name', 'client_name',
        'email', 'user_email', 'work_email', 'contact_email', 'email_address', 'mail',
        'phone', 'telephone', 'mobile', 'cell', 'phone_number', 'tel',
        'message', 'msg', 'comment', 'comments', 'notes', 'user_input', 'free_text',
        'address', 'street', 'zip', 'postal', 'ssn', 'password', 'secret', 'token', 'auth'
    ];

    // Explicit allowlist of safe analytics dimension names
    var SAFE_DIMENSION_KEYS = [
        'cta_name', 'cta_location', 'product_name', 'product_id', 'product_category',
        'product_status', 'page_name', 'page_title', 'page_path', 'page_category',
        'form_name', 'form_type', 'industry', 'goal', 'enquiry_type',
        'search_query_tier', 'total_products', 'category_filter', 'has_referrer'
    ];

    /**
     * Determines whether a key represents personally identifiable information
     * @param {string} key 
     * @returns {boolean}
     */
    function isPIIKey(key) {
        var lower = String(key).toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (SAFE_DIMENSION_KEYS.indexOf(lower) !== -1) {
            return false;
        }
        return FORBIDDEN_PII_KEYS.some(function (bad) {
            return lower === bad || lower.indexOf(bad) === 0 || lower.endsWith('_' + bad) || lower.indexOf('_' + bad + '_') !== -1;
        });
    }

    /**
     * Sanitizes event parameters to strictly prevent PII transmission
     * @param {Object} rawParams 
     * @returns {Object} Safe parameters
     */
    function sanitizeParams(rawParams) {
        if (!rawParams || typeof rawParams !== 'object') {
            return {};
        }

        var safe = {};
        Object.keys(rawParams).forEach(function (key) {
            if (!isPIIKey(key)) {
                var val = rawParams[key];
                // Only allow primitive strings, numbers, booleans
                if (typeof val === 'string') {
                    // Truncate long strings to prevent accidental free-text leakage
                    safe[key] = val.slice(0, 100);
                } else if (typeof val === 'number' || typeof val === 'boolean') {
                    safe[key] = val;
                }
            }
        });

        return safe;
    }

    /**
     * Checks if Do Not Track is enabled in the user's browser
     * @returns {boolean}
     */
    function isDoNotTrackEnabled() {
        if (!config.respectDoNotTrack) return false;
        var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
        return dnt === '1' || dnt === 'yes';
    }

    /**
     * Checks if tracking is currently permitted
     * @returns {boolean}
     */
    function isTrackingAllowed() {
        if (!config.enabled || !config.measurementId) return false;
        if (isDoNotTrackEnabled()) return false;
        if (config.requireConsent && !state.consentGranted) return false;
        return true;
    }

    /**
     * Dynamically loads GA4 tag if allowed and not already loaded
     */
    function loadProvider() {
        if (state.providerLoaded || !isTrackingAllowed()) return;

        try {
            var script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.measurementId);
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];
            window.gtag = function () {
                window.dataLayer.push(arguments);
            };

            window.gtag('js', new Date());
            window.gtag('config', config.measurementId, {
                anonymize_ip: true,
                send_page_view: false // Managed explicitly
            });

            state.providerLoaded = true;
            if (config.debug) {
                console.log('[softifyAnalytics] GA4 Provider loaded successfully (' + config.measurementId + ')');
            }
        } catch (e) {
            if (config.debug) {
                console.warn('[softifyAnalytics] Failed to load provider script:', e);
            }
        }
    }

    // ── Public API ──────────────────────────────────────────────────────────
    var softifyAnalytics = {
        /**
         * Initialize analytics engine with custom options
         * @param {Object} options 
         */
        init: function (options) {
            if (options && typeof options === 'object') {
                config = Object.assign({}, config, options);
            }

            // Restore consent from localStorage if previously stored
            try {
                var storedConsent = localStorage.getItem('softify_analytics_consent');
                if (storedConsent === 'granted') {
                    state.consentGranted = true;
                }
            } catch (e) {}

            state.initialized = true;

            if (config.debug) {
                console.log('[softifyAnalytics] Initialized with config:', {
                    enabled: config.enabled,
                    measurementId: config.measurementId ? '[CONFIGURED]' : '[NOT SET]',
                    debug: config.debug,
                    requireConsent: config.requireConsent,
                    dnt: isDoNotTrackEnabled()
                });
            }

            loadProvider();
            this.trackPageView();
            this.bindDelegatedCTAEvents();
        },

        /**
         * Set user consent status
         * @param {boolean} granted 
         */
        setConsent: function (granted) {
            state.consentGranted = !!granted;
            try {
                localStorage.setItem('softify_analytics_consent', granted ? 'granted' : 'denied');
            } catch (e) {}

            if (granted) {
                loadProvider();
            }

            if (config.debug) {
                console.log('[softifyAnalytics] Consent updated:', granted ? 'granted' : 'denied');
            }
        },

        /**
         * Check if consent is granted
         * @returns {boolean}
         */
        isConsentGranted: function () {
            return state.consentGranted;
        },

        /**
         * Generic event tracking function with automatic PII sanitization
         * @param {string} eventName 
         * @param {Object} params 
         */
        trackEvent: function (eventName, params) {
            if (!eventName) return;

            var safeParams = sanitizeParams(params);

            if (config.debug) {
                console.log('[softifyAnalytics Event]', eventName, safeParams);
            }

            if (isTrackingAllowed() && typeof window.gtag === 'function') {
                try {
                    window.gtag('event', eventName, safeParams);
                } catch (e) {
                    if (config.debug) console.warn('[softifyAnalytics] gtag dispatch failed:', e);
                }
            }
        },

        /**
         * Track page view with sanitized path & category
         * @param {string} [pageCategory] 
         * @param {string} [pageTitle] 
         */
        trackPageView: function (pageCategory, pageTitle) {
            var path = window.location.pathname || '/';
            var title = pageTitle || document.title;
            var category = pageCategory || this.detectPageCategory();

            this.trackEvent('page_view', {
                page_path: path,
                page_title: title,
                page_category: category
            });
        },

        /**
         * Helper to classify current page
         * @returns {string}
         */
        detectPageCategory: function () {
            var path = (window.location.pathname || '').toLowerCase();
            if (path.indexOf('product.html') !== -1) return 'product_detail';
            if (path.indexOf('products.html') !== -1) return 'product_catalogue';
            if (path.indexOf('about.html') !== -1) return 'about';
            if (path.indexOf('request-demo.html') !== -1) return 'request_demo';
            if (path.indexOf('contact.html') !== -1) return 'contact';
            if (path.indexOf('404.html') !== -1) return 'error_404';
            return 'home';
        },

        /**
         * Track CTA clicks across website
         * @param {string} ctaName 
         * @param {string} ctaLocation 
         * @param {Object} [extraParams] 
         */
        trackCTA: function (ctaName, ctaLocation, extraParams) {
            var params = Object.assign({
                cta_name: ctaName || 'unknown_cta',
                cta_location: ctaLocation || 'unspecified'
            }, extraParams || {});

            this.trackEvent('cta_click', params);
        },

        /**
         * Track product catalogue viewing
         * @param {number} totalProducts 
         */
        trackCatalogueView: function (totalProducts) {
            this.trackEvent('catalogue_viewed', {
                total_products: typeof totalProducts === 'number' ? totalProducts : 0
            });
        },

        /**
         * Track category filter actions on catalogue
         * @param {string} category 
         */
        trackProductCategoryFilter: function (category) {
            this.trackEvent('product_category_filtered', {
                category_filter: category || 'all'
            });
        },

        /**
         * Track search query activity (non-PII query length categorization)
         * @param {number|string} queryLengthOrCategory 
         */
        trackProductSearch: function (queryLengthOrCategory) {
            this.trackEvent('product_search', {
                search_query_tier: typeof queryLengthOrCategory === 'number'
                    ? (queryLengthOrCategory > 10 ? 'long' : (queryLengthOrCategory > 3 ? 'medium' : 'short'))
                    : String(queryLengthOrCategory || 'unknown')
            });
        },

        /**
         * Track individual product view
         * @param {Object} product 
         */
        trackProductView: function (product) {
            if (!product) return;
            this.trackEvent('product_view', {
                product_id: product.id || 'unknown',
                product_name: product.name || 'unknown',
                product_category: product.category || 'general',
                product_status: product.status || 'in-development'
            });
        },

        /**
         * Track demo or inquiry CTA specifically for a product
         * @param {Object|string} productOrId 
         * @param {string} ctaLocation 
         */
        trackProductDemoClick: function (productOrId, ctaLocation) {
            var prodId = typeof productOrId === 'string' ? productOrId : (productOrId ? productOrId.id : 'unknown');
            var prodName = typeof productOrId === 'object' && productOrId ? productOrId.name : prodId;

            this.trackEvent('product_demo_click', {
                product_id: prodId,
                product_name: prodName,
                cta_location: ctaLocation || 'product_action'
            });
        },

        /**
         * Track form start (triggers only once per session/formType upon first focus)
         * @param {string} formType ('demo_request' | 'contact')
         * @param {string} [productId]
         */
        trackFormStarted: function (formType, productId) {
            formType = formType || 'general';
            if (state.sessionFormStarted[formType]) return; // Fire once

            state.sessionFormStarted[formType] = true;

            var params = {
                form_type: formType
            };
            if (productId) {
                params.product_id = productId;
            }

            this.trackEvent('form_started', params);
        },

        /**
         * Track successful form submission with strictly non-PII metadata
         * @param {string} formType 
         * @param {Object} summaryParams 
         */
        trackFormSubmitted: function (formType, summaryParams) {
            var baseParams = {
                form_type: formType || 'general',
                has_referrer: !!document.referrer
            };

            // Merge permitted categorical fields
            var safeExtra = sanitizeParams(summaryParams);
            var params = Object.assign({}, baseParams, safeExtra);

            this.trackEvent('form_submitted', params);
        },

        /**
         * Declarative click listener for HTML elements with data-track-cta
         */
        bindDelegatedCTAEvents: function () {
            if (!document || typeof document.addEventListener !== 'function') return;
            document.addEventListener('click', function (event) {
                var target = event.target && typeof event.target.closest === 'function' ? event.target.closest('[data-track-cta]') : null;
                if (!target) return;

                var ctaName = target.getAttribute('data-track-cta') || 'unnamed_cta';
                var sectionEl = target.closest('[data-track-section]');
                var ctaLoc = target.getAttribute('data-track-location') || (sectionEl ? sectionEl.getAttribute('data-track-section') : 'page_content');
                var prodId = target.getAttribute('data-track-product');

                var extra = {};
                if (prodId) extra.product_id = prodId;

                softifyAnalytics.trackCTA(ctaName, ctaLoc, extra);
            });
        }
    };

    // Auto-initialize on DOM ready
    if (typeof document !== 'undefined' && document.readyState) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                softifyAnalytics.init();
            });
        } else {
            softifyAnalytics.init();
        }
    }

    // Expose to global window / environment
    if (typeof window !== 'undefined') {
        window.softifyAnalytics = softifyAnalytics;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = softifyAnalytics;
    }

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), typeof document !== 'undefined' ? document : {});

