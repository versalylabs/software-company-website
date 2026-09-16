/**
 * softify Main UI & Navigation Controller
 */

const navToggle = document.querySelector('.nav-toggle');
const navPanel = document.querySelector('.nav-panel');
const navBackdrop = document.querySelector('.nav-backdrop');
const navLinks = document.querySelectorAll('.nav-link');

function isNavOpen() {
    return navPanel && navPanel.classList.contains('is-open');
}

function openNav() {
    if (!navPanel || !navToggle) return;
    navPanel.classList.add('is-open');
    if (navBackdrop) navBackdrop.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
}

function closeNav() {
    if (!navPanel || !navToggle) return;
    navPanel.classList.remove('is-open');
    if (navBackdrop) navBackdrop.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}

function toggleNav() {
    if (isNavOpen()) {
        closeNav();
    } else {
        openNav();
    }
}

if (navToggle) {
    navToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleNav();
    });
}

if (navBackdrop) {
    navBackdrop.addEventListener('click', closeNav);
}

navLinks.forEach((link) => {
    link.addEventListener('click', () => {
        if (isNavOpen()) closeNav();
    });
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isNavOpen()) {
        closeNav();
        if (navToggle) navToggle.focus();
    }
});

// Reveal elements setup (Harmonized with softifyMotion)
document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const revealEls = document.querySelectorAll('.reveal');
    if (!reduceMotion && revealEls.length) {
        const isInViewport = (el) => {
            const rect = el.getBoundingClientRect();
            return (
                rect.top < window.innerHeight &&
                rect.bottom > 0
            );
        };

        revealEls.forEach((el) => {
            if (!isInViewport(el)) {
                el.classList.add('is-prehidden');
            }
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.remove('is-prehidden');
                    entry.target.classList.add('is-in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.08,
            rootMargin: '0px 0px -40px 0px'
        });

        revealEls.forEach((el) => observer.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.remove('is-prehidden'));
    }
});

// Pre-select a product when a visitor arrives from a product card.
document.addEventListener('DOMContentLoaded', () => {
    const productSelect = document.getElementById('demo-product');
    if (productSelect) {
        const product = new URLSearchParams(window.location.search).get('product');
        if (product && [...productSelect.options].some(option => option.value === product)) {
            productSelect.value = product;
        }
    }

    // Enterprise Footer Newsletter Form
    const newsletterForm = document.getElementById('footer-newsletter-form');
    const newsletterSuccess = document.getElementById('footer-newsletter-success');
    const newsletterEmail = document.getElementById('footer-email');
    const newsletterBtn = document.getElementById('footer-subscribe-btn');

    if (newsletterForm && newsletterSuccess && newsletterEmail) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterEmail.value.trim();
            if (!email) return;

            if (newsletterBtn) {
                newsletterBtn.disabled = true;
                newsletterBtn.style.opacity = '0.7';
            }
            newsletterEmail.disabled = true;
            newsletterSuccess.style.display = 'block';

            if (typeof window.analyticsTrackEvent === 'function') {
                window.analyticsTrackEvent('newsletter_subscribed', {
                    location: 'footer',
                    has_work_email: !email.endsWith('@gmail.com') && !email.endsWith('@yahoo.com') && !email.endsWith('@hotmail.com')
                });
            }
        });
    }

    // Footer Back to Top Button with Smooth Motion
    const backToTopBtn = document.getElementById('footer-back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Dynamic Trust & Content Hydration (Phase 9 CMS)
    hydratePublicContent();
});

function escapeText(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function hydratePublicContent() {
    try {
        let apiUrl = '/api/content?status=published';
        if (window.location.protocol === 'file:') {
            apiUrl = 'http://localhost:3005/api/content?status=published';
        }

        const res = await fetch(apiUrl);
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.success || !data.data) return;

        const content = data.data;

        // 1. Hydrate Testimonials
        const testGrid = document.getElementById('testimonials-grid');
        if (testGrid && Array.isArray(content.testimonials) && content.testimonials.length > 0) {
            testGrid.innerHTML = content.testimonials.map(item => {
                const rating = Math.max(1, Math.min(5, parseInt(item.rating, 10) || 5));
                const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
                const avatar = item.avatar || '/assets/icons/favicon.svg';
                const roleCompany = [item.role, item.company].filter(Boolean).join(', ');
                return `
                    <div class="hh-test-card">
                        <div>
                            <div class="hh-test-card__stars">${stars}</div>
                            <p class="hh-test-card__quote">"${escapeText(item.quote)}"</p>
                        </div>
                        <div class="hh-test-card__author-box">
                            <img src="${escapeText(avatar)}" alt="${escapeText(item.author)}" class="hh-test-card__avatar">
                            <div>
                                <div class="hh-test-card__author-name">${escapeText(item.author)}</div>
                                ${roleCompany ? `<div class="hh-test-card__author-role">${escapeText(roleCompany)}</div>` : ''}
                                ${item.product ? `<span class="hh-test-card__prod-badge">${escapeText(item.product)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 2. Hydrate Partners Strip
        const partnersContainer = document.getElementById('partners-logos-container');
        if (partnersContainer && Array.isArray(content.partners) && content.partners.length > 0) {
            partnersContainer.innerHTML = content.partners.map(item => {
                const logo = item.logo || '/assets/icons/favicon.svg';
                const link = item.website ? `<a href="${escapeText(item.website)}" target="_blank" rel="noopener noreferrer" class="hh-partner-item">` : `<div class="hh-partner-item">`;
                const closeLink = item.website ? `</a>` : `</div>`;
                return `
                    ${link}
                        <img src="${escapeText(logo)}" alt="${escapeText(item.name)}">
                        <span>${escapeText(item.name)}</span>
                    ${closeLink}
                `;
            }).join('');
        }

        // 3. Hydrate FAQ Accordion (on about.html)
        const faqAccordion = document.getElementById('faq-accordion');
        if (faqAccordion && Array.isArray(content.faqs) && content.faqs.length > 0) {
            faqAccordion.innerHTML = content.faqs.map((faq, idx) => {
                return `
                    <div class="faq-item">
                        <button type="button" class="faq-question" aria-expanded="false" aria-controls="faq-dyn-ans-${idx}">
                            <span>${escapeText(faq.question)}</span>
                            <span class="faq-chevron" aria-hidden="true">
                                <svg viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </span>
                        </button>
                        <div class="faq-answer" id="faq-dyn-ans-${idx}" role="region">
                            <p>${escapeText(faq.answer)}</p>
                        </div>
                    </div>
                `;
            }).join('');

            // Re-bind click events for dynamic FAQs
            const items = faqAccordion.querySelectorAll('.faq-item');
            items.forEach(item => {
                const btn = item.querySelector('.faq-question');
                if (!btn) return;
                btn.addEventListener('click', () => {
                    const isOpen = item.classList.contains('is-open');
                    items.forEach(other => {
                        if (other !== item) {
                            other.classList.remove('is-open');
                            const otherBtn = other.querySelector('.faq-question');
                            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                        }
                    });
                    if (isOpen) {
                        item.classList.remove('is-open');
                        btn.setAttribute('aria-expanded', 'false');
                    } else {
                        item.classList.add('is-open');
                        btn.setAttribute('aria-expanded', 'true');
                    }
                });
            });
        }

        // 4. Hydrate Stats Cards (on about.html)
        const statsCard = document.querySelector('.ab-stats-card');
        if (statsCard && Array.isArray(content.stats) && content.stats.length > 0) {
            statsCard.innerHTML = content.stats.map(stat => {
                return `
                    <div class="ab-stat">
                        <span class="ab-stat__val">${escapeText(stat.value)}</span>
                        <span class="ab-stat__lbl">${escapeText(stat.label)}</span>
                    </div>
                `;
            }).join('');
        }

        // 5. Hydrate Values Grid (on about.html)
        const valuesGrid = document.querySelector('.ab-values__grid');
        if (valuesGrid && Array.isArray(content.values) && content.values.length > 0) {
            valuesGrid.innerHTML = content.values.map((val, idx) => {
                const num = String(idx + 1).padStart(2, '0');
                return `
                    <div class="ab-val-item">
                        <div class="ab-val-item__num">${num}</div>
                        <div>
                            <h3>${escapeText(val.title)}</h3>
                            <p>${escapeText(val.description)}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }

    } catch (err) {
        // Graceful fallback to pre-rendered HTML content
        console.debug('Dynamic content hydration notice:', err);
    }
}

