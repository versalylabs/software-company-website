/**
 * softify GSAP Integration Engine (js/gsap-init.js)
 * Coordinates hero choreography, elegant text/image reveals, subtle product showcases,
 * and the interactive 'HOW WE WORK' Showreel Theater.
 * Fast, minimal, professional, zero-duplication, and strictly respects prefers-reduced-motion.
 */

(function () {
    'use strict';

    function isReducedMotion() {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    const HOW_STAGES = [
        {
            num: '01',
            name: 'Understand',
            badge: 'STAGE 01 OF 04 • DISCOVERY & WORKFLOW ARCHITECTURE',
            title: 'Understand the Real-World Bottleneck',
            desc: 'We learn your workflow, your users, and the exact problem worth solving before writing a single line of code. No bloated generic templates.',
            milestones: [
                'Field interviews & operational process mapping',
                'Constraint identification & zero-assumption data schemas',
                'Functional prototype alignment with key stakeholders'
            ],
            uri: 'softify://pipeline/01-understand.flow',
            renderGraphic: () => `
                <div class="sr-visual-card">
                    <div class="sr-topology-grid">
                        <div class="sr-topology-node active sr-anim-node">
                            <div class="sr-topology-node__icon">🏢</div>
                            <div class="sr-topology-node__title">Operations</div>
                            <div class="sr-topology-node__sub">Workflow Mapping</div>
                        </div>
                        <div class="sr-topology-node sr-anim-node">
                            <div class="sr-topology-node__icon">⚡</div>
                            <div class="sr-topology-node__title">Data Schema</div>
                            <div class="sr-topology-node__sub">Zero-PII Specs</div>
                        </div>
                        <div class="sr-topology-node sr-anim-node">
                            <div class="sr-topology-node__icon">🎯</div>
                            <div class="sr-topology-node__title">Target Prototype</div>
                            <div class="sr-topology-node__sub">Interactive Specs</div>
                        </div>
                    </div>
                    <div class="sr-terminal-box sr-anim-node">
                        <div class="sr-terminal-line success">✓ [Discovery] Operational bottlenecks mapped</div>
                        <div class="sr-terminal-line highlight">→ [Architecture] API Contract & Data Schema verified</div>
                        <div class="sr-terminal-line">⚡ [Telemetry] 0 Assumptions • 100% Workflow Accuracy</div>
                    </div>
                </div>
            `
        },
        {
            num: '02',
            name: 'Design',
            badge: 'STAGE 02 OF 04 • SYSTEMS & INTERACTION ERGONOMICS',
            title: 'Design for Real Human Workflows',
            desc: 'We shape intuitive UI components and accessible design systems tailored to daily high-volume operations with zero eye strain.',
            milestones: [
                'WCAG 2.1 AA accessibility & keyboard flow validation',
                'High-density data layouts optimized for speed & clarity',
                'Unified component library with reusable design tokens'
            ],
            uri: 'softify://pipeline/02-design.system',
            renderGraphic: () => `
                <div class="sr-visual-card">
                    <div class="sr-terminal-box sr-anim-node" style="margin-bottom:1rem;">
                        <div class="sr-metric-bar">
                            <span>Layout Ergonomics & Accessibility</span>
                            <span style="color:#34d399;font-weight:700;">WCAG 2.1 AA Compliant</span>
                        </div>
                        <div class="sr-progress-track">
                            <div class="sr-progress-fill" style="width: 100%;"></div>
                        </div>
                    </div>
                    <div class="sr-topology-grid">
                        <div class="sr-topology-node sr-anim-node" style="border-color:#6366f1;">
                            <div class="sr-topology-node__icon">🎨</div>
                            <div class="sr-topology-node__title">Design Tokens</div>
                            <div class="sr-topology-node__sub">Indigo / Slate / Teal</div>
                        </div>
                        <div class="sr-topology-node sr-anim-node" style="border-color:#38bdf8;">
                            <div class="sr-topology-node__icon">⌨️</div>
                            <div class="sr-topology-node__title">Keyboard First</div>
                            <div class="sr-topology-node__sub">Full Tab & Focus Flow</div>
                        </div>
                        <div class="sr-topology-node sr-anim-node" style="border-color:#34d399;">
                            <div class="sr-topology-node__icon">📱</div>
                            <div class="sr-topology-node__title">Responsive Grid</div>
                            <div class="sr-topology-node__sub">Desktop / Tablet / Mobile</div>
                        </div>
                    </div>
                </div>
            `
        },
        {
            num: '03',
            name: 'Build',
            badge: 'STAGE 03 OF 04 • ITERATIVE CLOUD-NATIVE BUILD',
            title: 'Build Fast, Test Rigorously',
            desc: 'We engineer clean, modular, zero-bloat code with continuous testing, strict security standards, and automated deployment pipelines.',
            milestones: [
                'Continuous automated test suites (100% pass guarantee)',
                'Modular micro-services & zero runtime bloat',
                'Isolated staging sandboxes for client review'
            ],
            uri: 'softify://pipeline/03-build.engine',
            renderGraphic: () => `
                <div class="sr-visual-card">
                    <div class="sr-terminal-box sr-anim-node">
                        <div class="sr-terminal-line success">✓ Compiling @softify/core [12ms]</div>
                        <div class="sr-terminal-line success">✓ API Security & Honeypot Filters initialized</div>
                        <div class="sr-terminal-line success">✓ Automated Test Runner: 108 / 108 tests passing</div>
                        <div class="sr-terminal-line highlight">🚀 Staging sandbox deployed: https://preview.softify.io</div>
                    </div>
                    <div class="sr-topology-grid" style="margin-top:1rem;margin-bottom:0;">
                        <div class="sr-topology-node sr-anim-node">
                            <div class="sr-topology-node__title" style="color:#34d399;font-size:1.1rem;">100%</div>
                            <div class="sr-topology-node__sub">Test Coverage</div>
                        </div>
                        <div class="sr-topology-node sr-anim-node">
                            <div class="sr-topology-node__title" style="color:#818cf8;font-size:1.1rem;">&lt; 25KB</div>
                            <div class="sr-topology-node__sub">Zero Bloat Bundle</div>
                        </div>
                        <div class="sr-topology-node sr-anim-node">
                            <div class="sr-topology-node__title" style="color:#38bdf8;font-size:1.1rem;">0ms</div>
                            <div class="sr-topology-node__sub">Downtime Deploy</div>
                        </div>
                    </div>
                </div>
            `
        },
        {
            num: '04',
            name: 'Improve',
            badge: 'STAGE 04 OF 04 • TELEMETRY, EVOLUTION & SCALE',
            title: 'Evolve Continuously as You Scale',
            desc: 'We monitor system health, optimize bottleneck queries, and ship iterative feature enhancements as your operational scale grows.',
            milestones: [
                'Real-time health audits & automated error alerting',
                'Database indexing & sub-millisecond query tuning',
                'Direct feedback loops and quarterly capability upgrades'
            ],
            uri: 'softify://pipeline/04-improve.telemetry',
            renderGraphic: () => `
                <div class="sr-visual-card">
                    <div class="sr-terminal-box sr-anim-node" style="margin-bottom:1rem;">
                        <div class="sr-metric-bar">
                            <span>Cloud Infrastructure Health</span>
                            <span style="color:#34d399;font-weight:700;">99.99% Uptime</span>
                        </div>
                        <div class="sr-progress-track">
                            <div class="sr-progress-fill" style="width: 99.99%;"></div>
                        </div>
                    </div>
                    <div class="sr-topology-grid">
                        <div class="sr-topology-node sr-anim-node" style="border-color:#10b981;">
                            <div class="sr-topology-node__icon">📈</div>
                            <div class="sr-topology-node__title">Live Telemetry</div>
                            <div class="sr-topology-node__sub">Real-Time Metrics</div>
                        </div>
                        <div class="sr-topology-node sr-anim-node" style="border-color:#6366f1;">
                            <div class="sr-topology-node__icon">⚡</div>
                            <div class="sr-topology-node__title">&lt; 15ms Latency</div>
                            <div class="sr-topology-node__sub">Sub-Second Queries</div>
                        </div>
                        <div class="sr-topology-node sr-anim-node" style="border-color:#f59e0b;">
                            <div class="sr-topology-node__icon">🔄</div>
                            <div class="sr-topology-node__title">Quarterly Releases</div>
                            <div class="sr-topology-node__sub">Continuous Evolution</div>
                        </div>
                    </div>
                </div>
            `
        }
    ];

    /**
     * Resilient Showreel Theater Controller
     */
    function initHowShowreel() {
        const container = document.getElementById('how-showreel');
        if (!container) return;

        const tabs = Array.from(container.querySelectorAll('.showreel-tab'));
        const badgeEl = document.getElementById('sr-stage-badge');
        const titleEl = document.getElementById('sr-stage-title');
        const descEl = document.getElementById('sr-stage-desc');
        const milestonesEl = document.getElementById('sr-stage-milestones');
        const uriEl = document.getElementById('sr-uri-label');
        const currentNumEl = document.getElementById('sr-current-num');
        const graphicContainer = document.getElementById('sr-graphic-container');
        const prevBtn = document.getElementById('sr-prev-btn');
        const nextBtn = document.getElementById('sr-next-btn');

        let currentStage = 0;
        let autoTimer = null;
        const DURATION = 5; // seconds per stage
        const reduced = isReducedMotion();
        const hasGSAP = typeof window.gsap !== 'undefined';

        function renderStage(idx, direction = 1, isInitial = false) {
            if (idx < 0) idx = HOW_STAGES.length - 1;
            if (idx >= HOW_STAGES.length) idx = 0;
            currentStage = idx;

            const data = HOW_STAGES[idx];
            if (!data) return;

            // 1. Update Tabs & Progress
            tabs.forEach((tab, i) => {
                const isActive = (i === idx);
                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
                const pBar = tab.querySelector('.showreel-tab__progress-bar');
                if (pBar) {
                    if (hasGSAP) window.gsap.killTweensOf(pBar);
                    pBar.style.width = '0%';
                }
            });

            // 2. Update Narrative Texts
            if (currentNumEl) currentNumEl.textContent = data.num;
            if (badgeEl) badgeEl.textContent = data.badge;
            if (titleEl) titleEl.textContent = data.title;
            if (descEl) descEl.textContent = data.desc;
            if (uriEl) uriEl.textContent = data.uri;

            if (milestonesEl) {
                milestonesEl.innerHTML = data.milestones.map(m => `
                    <li>
                        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                        <span>${m}</span>
                    </li>
                `).join('');
            }

            // 3. Update Visual Viewport
            if (graphicContainer) {
                graphicContainer.innerHTML = data.renderGraphic();
            }

            // 4. GSAP Transition Choreography (Animate text & graphics only, keep controls stationary & responsive)
            if (hasGSAP && !reduced && !isInitial) {
                const gsap = window.gsap;
                const fromX = direction > 0 ? 18 : -18;

                gsap.fromTo(['#sr-stage-badge', '#sr-stage-title', '#sr-stage-desc', '#sr-stage-milestones'], 
                    { opacity: 0, x: fromX },
                    { opacity: 1, x: 0, stagger: 0.03, duration: 0.35, ease: 'power2.out' }
                );

                gsap.fromTo('.showreel-viewport__body',
                    { opacity: 0, scale: 0.96, y: 10 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power2.out' }
                );

                gsap.fromTo('.sr-anim-node',
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, stagger: 0.05, duration: 0.35, ease: 'power2.out' }
                );
            }

            // 5. Active Tab Progress Fill
            if (hasGSAP && !reduced) {
                const activeBar = tabs[idx].querySelector('.showreel-tab__progress-bar');
                if (activeBar) {
                    window.gsap.fromTo(activeBar, { width: '0%' }, {
                        width: '100%',
                        duration: DURATION,
                        ease: 'none'
                    });
                }
            }
        }

        let isSwitching = false;

        function nextStage() {
            if (isSwitching) return;
            isSwitching = true;
            renderStage(currentStage + 1, 1);
            setTimeout(() => { isSwitching = false; }, 260);
        }

        function prevStage() {
            if (isSwitching) return;
            isSwitching = true;
            renderStage(currentStage - 1, -1);
            setTimeout(() => { isSwitching = false; }, 260);
        }

        function startTimer() {
            if (reduced) return;
            stopTimer();
            autoTimer = setInterval(nextStage, DURATION * 1000);
        }

        function stopTimer() {
            if (autoTimer) {
                clearInterval(autoTimer);
                autoTimer = null;
            }
        }

        // ── Direct Unique Click Handlers ────────────────────────
        tabs.forEach((tab, index) => {
            tab.onclick = (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                const dir = index >= currentStage ? 1 : -1;
                renderStage(index, dir);
                startTimer();
            };
        });

        if (prevBtn) {
            prevBtn.onclick = (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                prevStage();
                startTimer();
            };
        }

        if (nextBtn) {
            nextBtn.onclick = (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                nextStage();
                startTimer();
            };
        }

        // Pause timer on hover
        container.addEventListener('mouseenter', () => {
            stopTimer();
            if (hasGSAP && !reduced) {
                const activeBar = tabs[currentStage].querySelector('.showreel-tab__progress-bar');
                if (activeBar) window.gsap.killTweensOf(activeBar);
            }
        });

        container.addEventListener('mouseleave', () => {
            startTimer();
            if (hasGSAP && !reduced) {
                const activeBar = tabs[currentStage].querySelector('.showreel-tab__progress-bar');
                if (activeBar) {
                    window.gsap.fromTo(activeBar, { width: '0%' }, {
                        width: '100%',
                        duration: DURATION,
                        ease: 'none'
                    });
                }
            }
        });

        // Keyboard navigation
        container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevStage();
                startTimer();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextStage();
                startTimer();
            }
        });

        // Initial setup
        renderStage(0, 1, true);
        startTimer();

        // Export controller globally
        const controller = {
            next: () => { nextStage(); startTimer(); },
            prev: () => { prevStage(); startTimer(); },
            goTo: (idx) => { renderStage(idx, idx >= currentStage ? 1 : -1); startTimer(); },
            getCurrent: () => currentStage
        };

        window.softifyHowShowreel = controller;
        window.softifyShowreelNext = (e) => { if (e) { e.preventDefault(); e.stopPropagation(); } controller.next(); };
        window.softifyShowreelPrev = (e) => { if (e) { e.preventDefault(); e.stopPropagation(); } controller.prev(); };
        window.softifyShowreelGo = (idx, e) => { if (e) { e.preventDefault(); e.stopPropagation(); } controller.goTo(idx); };
    }

    /**
     * Main GSAP Animation Suite
     */
    function initGSAP() {
        // Initialize the Showreel Theater regardless of other module states
        initHowShowreel();

        if (typeof window.gsap === 'undefined') {
            return;
        }

        const gsap = window.gsap;

        if (typeof window.ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(window.ScrollTrigger);
        }

        // ── 0. REDUCED MOTION SAFETY GUARD ──────────────────────────────
        if (isReducedMotion()) {
            gsap.set([
                '.hh-hero__eyebrow', '.hh-hero__title', '.hh-hero__sub', '.hh-hero__ctas',
                '.hh-hero__social-proof', '.hh-hero__visual', '.hh-screenshot-wrap',
                '.hh-value-card', '.about-why-card', '.ab-val-item', '.about-mission-card',
                '.hh-spotlight-card', '.product-card', '.ct-route-card', '.legal-hero__inner',
                '.gsap-reveal', '.gsap-hero-elem', '.showreel-theater'
            ], {
                opacity: 1,
                y: 0,
                scale: 1,
                clearProps: 'all'
            });
            return;
        }

        // ── 1. HERO ENTRANCE CHOREOGRAPHY ───────────────────────────────
        function initHeroChoreography() {
            const homeHero = document.querySelector('.hh-hero');
            if (homeHero) {
                const tl = gsap.timeline({
                    defaults: { ease: 'power2.out', duration: 0.65 }
                });

                const eyebrow = homeHero.querySelector('.hh-hero__eyebrow');
                const title = homeHero.querySelector('.hh-hero__title');
                const sub = homeHero.querySelector('.hh-hero__sub');
                const ctas = homeHero.querySelector('.hh-hero__ctas');
                const proof = homeHero.querySelector('.hh-hero__social-proof');
                const visual = homeHero.querySelector('.hh-hero__visual, .hh-screenshot-wrap');

                if (eyebrow) tl.fromTo(eyebrow, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.5 });
                if (title) tl.fromTo(title, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.35');
                if (sub) tl.fromTo(sub, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.45');
                if (ctas) tl.fromTo(ctas, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55 }, '-=0.4');
                if (proof) tl.fromTo(proof, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.35');
                if (visual) tl.fromTo(visual, { opacity: 0, y: 24, scale: 0.985 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power2.out' }, '-=0.5');
            }

            const genericHeroes = document.querySelectorAll(
                '.ab-hero, .px-hero, .ct-hero, .dm-hero, .legal-hero, .error-section'
            );

            genericHeroes.forEach(hero => {
                const badge = hero.querySelector('.ab-hero__eyebrow, .px-hero__eyebrow, .ct-hero__eyebrow, .legal-eyebrow, .error-badge, .dm-left__eyebrow');
                const title = hero.querySelector('h1, .ab-hero__title, .px-hero__title, .ct-hero__title, .legal-title, .error-title, .dm-left__title');
                const desc = hero.querySelector('.ab-hero__sub, .px-hero__sub, .ct-hero__sub, .legal-sub, .error-desc, .dm-left__sub');
                const extra = hero.querySelector('.legal-meta-badge, .error-actions, .dm-left__benefits');

                const tl = gsap.timeline({
                    defaults: { ease: 'power2.out', duration: 0.6 }
                });

                if (badge) tl.fromTo(badge, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.45 });
                if (title) tl.fromTo(title, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3');
                if (desc) tl.fromTo(desc, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55 }, '-=0.4');
                if (extra) tl.fromTo(extra, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.35');
            });
        }

        // ── 2. SECTION & CARD SCROLL REVEALS ─────────────────────────────
        function initSectionReveals() {
            if (typeof window.ScrollTrigger === 'undefined') return;

            const sectionHeaders = document.querySelectorAll(
                '.hh-section-header, .ab-why__header, .ab-values__header, .ab-mission__inner, .ct-section-header'
            );

            sectionHeaders.forEach(header => {
                const title = header.querySelector('h2, .ab-why__title, .ab-values__title, .ab-mission__title');
                const tag = header.querySelector('.hh-section-tag, .ab-mission__tag');
                const sub = header.querySelector('.hh-section-sub, .ab-why__sub');

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: header,
                        start: 'top 88%',
                        once: true
                    }
                });

                if (tag) tl.fromTo(tag, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
                if (title) tl.fromTo(title, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, tag ? '-=0.3' : 0);
                if (sub) tl.fromTo(sub, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '-=0.4');
            });

            const valueGrid = document.querySelector('.hh-values__grid, .ab-why__grid, .ab-values__grid');
            if (valueGrid) {
                const cards = valueGrid.querySelectorAll('.hh-value-card, .about-why-card, .ab-val-item, .ab-why-card');
                if (cards.length > 0) {
                    gsap.fromTo(cards, 
                        { opacity: 0, y: 22 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.55,
                            stagger: 0.08,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: valueGrid,
                                start: 'top 85%',
                                once: true
                            }
                        }
                    );
                }
            }

            const contactCards = document.querySelector('.ct-cards__grid');
            if (contactCards) {
                const cards = contactCards.querySelectorAll('.ct-route-card');
                if (cards.length > 0) {
                    gsap.fromTo(cards,
                        { opacity: 0, y: 20 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.5,
                            stagger: 0.09,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: contactCards,
                                start: 'top 85%',
                                once: true
                            }
                        }
                    );
                }
            }
        }

        // ── 3. PRODUCT SHOWCASE ANIMATIONS ──────────────────────────────
        function initProductShowcase() {
            if (typeof window.ScrollTrigger === 'undefined') return;

            const spotlights = document.querySelectorAll('.hh-spotlight-card, .product-hero-card');
            spotlights.forEach(card => {
                const visual = card.querySelector('.hh-spotlight-card__visual, .product-hero-screenshot');
                const content = card.querySelector('.hh-spotlight-card__content, .product-hero-info');

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 84%',
                        once: true
                    }
                });

                if (content) {
                    tl.fromTo(content, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
                }
                if (visual) {
                    tl.fromTo(visual, { opacity: 0, scale: 0.97, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.4');
                }
            });
        }

        // Execute Sequences
        initHeroChoreography();
        initSectionReveals();
        initProductShowcase();
    }

    // Public API
    const softifyGSAP = {
        init: initGSAP,
        initHowShowreel: initHowShowreel,
        isReducedMotion: isReducedMotion
    };

    if (typeof window !== 'undefined') {
        window.softifyGSAP = softifyGSAP;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initGSAP);
        } else {
            initGSAP();
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = softifyGSAP;
    }
})();
