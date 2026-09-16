/**
 * softify Motion Engine (js/motion.js) — Phase 11 Upgrade
 * High-performance, lightweight, restrained animation and interaction module.
 * Zero-dependency, accessible, and strictly respects prefers-reduced-motion.
 */

(function () {
    'use strict';

    const EASINGS = {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
        easeOutQuint: 'cubic-bezier(0.22, 1, 0.36, 1)',
        easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        linear: 'linear'
    };

    function isReducedMotion() {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Resolve target or selector into an array of DOM elements
     */
    function resolveElements(target) {
        if (!target) return [];
        if (typeof target === 'string') return Array.from(document.querySelectorAll(target));
        if (target instanceof Element) return [target];
        if (target instanceof NodeList || Array.isArray(target)) return Array.from(target).filter(el => el instanceof Element);
        return [];
    }

    /**
     * Animate elements using the Web Animations API
     */
    function animate(target, keyframes, options = {}) {
        const elements = resolveElements(target);
        if (elements.length === 0) return { finished: Promise.resolve(), cancel: () => {} };

        const reduced = isReducedMotion();
        const duration = reduced ? 0.01 : (typeof options.duration === 'number' ? options.duration * 1000 : 350);
        const delay = reduced ? 0 : (typeof options.delay === 'number' ? options.delay * 1000 : 0);
        const easing = EASINGS[options.easing] || options.easing || EASINGS.spring;

        const animations = elements.map((el, index) => {
            const elDelay = typeof options.delay === 'function' ? options.delay(index) * 1000 : delay;
            
            if (reduced) {
                // Instantly apply final frame for accessibility
                const finalFrame = Array.isArray(keyframes) ? keyframes[keyframes.length - 1] : keyframes;
                if (typeof finalFrame === 'object') {
                    Object.assign(el.style, finalFrame);
                }
                return { finished: Promise.resolve(), cancel: () => {} };
            }

            try {
                const anim = el.animate(keyframes, {
                    duration,
                    delay: elDelay,
                    easing,
                    fill: options.fill || 'forwards'
                });
                return anim;
            } catch (e) {
                return { finished: Promise.resolve(), cancel: () => {} };
            }
        });

        const finishedPromise = Promise.all(animations.map(a => a.finished || Promise.resolve()));

        return {
            finished: finishedPromise,
            cancel: () => animations.forEach(a => { if (typeof a.cancel === 'function') a.cancel(); })
        };
    }

    /**
     * Trigger animation or callback when element enters viewport
     */
    function inView(target, callback, options = {}) {
        const elements = resolveElements(target);
        if (elements.length === 0) return () => {};

        const threshold = options.threshold !== undefined ? options.threshold : 0.1;
        const rootMargin = options.rootMargin || '0px 0px -40px 0px';
        const once = options.once !== undefined ? options.once : true;

        if (typeof IntersectionObserver === 'undefined' || isReducedMotion()) {
            // Fallback: immediately trigger
            elements.forEach((el, index) => callback(el, index));
            return () => {};
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = elements.indexOf(entry.target);
                    callback(entry.target, index);
                    if (once) observer.unobserve(entry.target);
                }
            });
        }, { threshold, rootMargin });

        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }

    /**
     * Stagger delay calculator
     */
    function stagger(stepDelay = 0.05, startDelay = 0) {
        return (index) => startDelay + (index * stepDelay);
    }

    /**
     * Passive scroll tracking
     */
    function scroll(callback, options = {}) {
        if (typeof window === 'undefined') return () => {};

        let ticking = false;
        const handler = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
                    const maxScroll = Math.max(
                        document.body.scrollHeight, document.documentElement.scrollHeight,
                        document.body.offsetHeight, document.documentElement.offsetHeight
                    ) - window.innerHeight;
                    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
                    
                    callback({ scrollY, progress });
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handler, { passive: true });
        // Initial call
        handler();

        return () => window.removeEventListener('scroll', handler);
    }

    /**
     * Animated Number Counter / Count-Up
     */
    function countUp(el, endVal = null, options = {}) {
        if (!el) return;
        const rawText = el.getAttribute('data-counter-target') || (endVal !== null ? String(endVal) : el.textContent.trim());
        
        // Parse format: e.g. "$2.4M", "99.99%", "5+", "100%"
        const match = rawText.match(/^([^0-9.]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
        if (!match) return;

        const prefix = match[1] || '';
        const targetNumber = parseFloat(match[2]);
        const suffix = match[3] || '';
        const decimals = match[2].includes('.') ? match[2].split('.')[1].length : 0;

        if (isReducedMotion()) {
            el.textContent = `${prefix}${targetNumber.toFixed(decimals)}${suffix}`;
            return;
        }

        const duration = typeof options.duration === 'number' ? options.duration * 1000 : 1200;
        const startTime = performance.now();

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const current = progress === 1 ? targetNumber : (easeOutCubic(progress) * targetNumber);
            
            el.textContent = `${prefix}${current.toFixed(decimals)}${suffix}`;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }

        window.requestAnimationFrame(step);
    }

    /**
     * Initialize Counter elements
     */
    function initCounters() {
        if (typeof document === 'undefined') return;
        const counterEls = document.querySelectorAll(
            '.ab-stat__val, .hh-stat__val, .stat-number, [data-counter]'
        );

        if (counterEls.length > 0) {
            inView(counterEls, (el) => {
                if (el.dataset.counted === 'true') return;
                el.dataset.counted = 'true';
                countUp(el);
            }, { threshold: 0.2 });
        }
    }

    /**
     * Dynamic Content Mutation Observer (for dynamically fetched CMS cards)
     */
    function initDynamicObserver() {
        if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;

        const dynamicContainers = document.querySelectorAll(
            '#testimonials-grid, #partner-logos, #faq-accordion, #products-grid, #spotlight-grid'
        );

        if (dynamicContainers.length === 0) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && (node.classList.contains('product-card') || node.classList.contains('testimonial-card') || node.classList.contains('partner-logo') || node.classList.contains('faq-item'))) {
                            node.classList.add('motion-fade-up');
                            inView(node, (el) => el.classList.add('is-in-view'), { threshold: 0.05 });
                        }
                    });
                }
            });
        });

        dynamicContainers.forEach(c => observer.observe(c, { childList: true, subtree: false }));
    }

    /**
     * Auto-initialize declarative motion elements
     */
    function initDeclarative() {
        if (typeof document === 'undefined') return;

        // 1. Scroll-triggered reveals (.motion-fade-up, .motion-fade-in, .motion-scale-up, [data-motion], .reveal)
        const revealTargets = document.querySelectorAll(
            '.motion-fade-up, .motion-fade-in, .motion-scale-up, [data-motion], .reveal, .about-mission-card, .about-why-card, .hh-value-card, .legal-hero__inner'
        );

        if (revealTargets.length > 0) {
            inView(revealTargets, (el) => {
                el.classList.add('is-in-view');
            }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        }

        // 2. Staggered groups
        const staggerGroups = document.querySelectorAll('.motion-stagger, [data-motion-stagger]');
        staggerGroups.forEach(group => {
            const items = group.children;
            inView(group, () => {
                Array.from(items).forEach((item, idx) => {
                    setTimeout(() => {
                        item.classList.add('is-in-view');
                    }, idx * 60);
                });
            }, { threshold: 0.05 });
        });

        // 3. Navbar scroll listener for subtle backdrop blur and elevation
        const navbars = document.querySelectorAll('.hn-bar, .navbar');
        if (navbars.length > 0) {
            scroll(({ scrollY }) => {
                navbars.forEach(nav => {
                    if (scrollY > 20) {
                        nav.classList.add('is-scrolled');
                    } else {
                        nav.classList.remove('is-scrolled');
                    }
                });
            });
        }

        // 4. Metric count-up animations
        initCounters();

        // 5. Dynamic CMS container observer
        initDynamicObserver();
    }

    // Public API
    const softifyMotion = {
        animate,
        inView,
        stagger,
        scroll,
        countUp,
        initCounters,
        isReducedMotion,
        init: initDeclarative
    };

    if (typeof window !== 'undefined') {
        window.softifyMotion = softifyMotion;
        window.motion = softifyMotion; // Alias for standard usage

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initDeclarative);
        } else {
            initDeclarative();
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = softifyMotion;
    }
})();
