/**
 * Versaly Client Portal Client-Side Application (portal.js)
 * Handles client authentication, real-time project roadmap synchronization,
 * deliverable signoffs, meeting recaps, approved assets, and invoice payment links.
 */

(function () {
  'use strict';

  var state = {
    token: localStorage.getItem('versaly_client_token') || '',
    client: null,
    project: null,
    activeTab: 'overview',
    pendingApprovalDelId: null
  };

  // DOM Elements
  var loginView = document.getElementById('portal-login-view');
  var dashboardView = document.getElementById('portal-dashboard-view');
  var headerActions = document.getElementById('portal-header-actions');
  var loginForm = document.getElementById('portal-login-form');
  var loginError = document.getElementById('login-error-alert');
  var toastEl = document.getElementById('portal-toast');

  // Modals
  var modalApprove = document.getElementById('modal-approve-deliverable');
  var modalContact = document.getElementById('modal-contact-lead');

  function init() {
    wireEventListeners();
    if (state.token) {
      loadPortalData();
    } else {
      showLoginView();
    }
  }

  function wireEventListeners() {
    // Login form submit
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    // Logout button
    var logoutBtn = document.getElementById('portal-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    // Tab buttons
    var tabBtns = document.querySelectorAll('.portal-tab-btn');
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.dataset.tab);
      });
    });

    // Deliverable filters
    var filterBtns = document.querySelectorAll('.portal-pill-filter');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderDeliverables(btn.dataset.filter);
      });
    });

    // Feedback form
    var fbForm = document.getElementById('portal-feedback-form');
    if (fbForm) {
      fbForm.addEventListener('submit', handleFeedbackSubmit);
    }

    // Contact lead buttons
    var btnContactLead = document.getElementById('btn-contact-lead');
    var btnRequestCall = document.getElementById('btn-request-call');
    var btnCloseContact = document.getElementById('btn-close-contact-modal');
    if (btnContactLead) btnContactLead.addEventListener('click', openContactModal);
    if (btnRequestCall) btnRequestCall.addEventListener('click', openContactModal);
    if (btnCloseContact) btnCloseContact.addEventListener('click', closeContactModal);

    // Approve deliverable modal
    var btnCloseApprove = document.getElementById('btn-close-approve-modal');
    var btnCancelApprove = document.getElementById('btn-cancel-approve');
    var btnConfirmApprove = document.getElementById('btn-confirm-approve');
    if (btnCloseApprove) btnCloseApprove.addEventListener('click', closeApproveModal);
    if (btnCancelApprove) btnCancelApprove.addEventListener('click', closeApproveModal);
    if (btnConfirmApprove) btnConfirmApprove.addEventListener('click', confirmApproveDeliverable);
  }

  function showLoginView() {
    if (loginView) loginView.style.display = 'flex';
    if (dashboardView) dashboardView.style.display = 'none';
    if (headerActions) headerActions.style.display = 'none';
  }

  function showDashboardView() {
    if (loginView) loginView.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';
    if (headerActions) headerActions.style.display = 'flex';
  }

  function showToast(msg, duration) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, duration || 3500);
  }

  // --- API CALLS ---
  function apiHeaders() {
    var headers = { 'Content-Type': 'application/json' };
    if (state.token) {
      headers['Authorization'] = 'Bearer ' + state.token;
      headers['x-client-token'] = state.token;
    }
    return headers;
  }

  function handleLogin(e) {
    e.preventDefault();
    if (loginError) loginError.style.display = 'none';

    var email = (document.getElementById('portal-email').value || '').trim();
    var password = (document.getElementById('portal-password').value || '').trim();
    var submitBtn = document.getElementById('portal-login-submit');

    if (!email || !password) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying Credentials...</span>';
    }

    fetch('/api/portal/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Sign In to Project Portal</span>';
        }

        if (data.success && data.token) {
          state.token = data.token;
          localStorage.setItem('versaly_client_token', data.token);
          state.client = data.client;
          showToast('Welcome back, ' + (data.client ? data.client.name : 'Client') + '!');
          loadPortalData();
        } else {
          if (loginError) {
            loginError.textContent = data.error || 'Invalid work email or password.';
            loginError.style.display = 'block';
          }
        }
      })
      .catch(function (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Sign In to Project Portal</span>';
        }
        if (loginError) {
          loginError.textContent = 'Connection error. Please try again.';
          loginError.style.display = 'block';
        }
      });
  }

  function handleLogout() {
    fetch('/api/portal/logout', { method: 'POST', headers: apiHeaders() }).finally(function () {
      state.token = '';
      state.client = null;
      state.project = null;
      localStorage.removeItem('versaly_client_token');
      showLoginView();
      showToast('Signed out successfully.');
    });
  }

  function loadPortalData() {
    fetch('/api/portal/project', { headers: apiHeaders() })
      .then(function (res) {
        if (res.status === 401) {
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(function (data) {
        if (data.success && data.project) {
          state.client = data.client;
          state.project = data.project;
          renderHeaderInfo();
          renderHero();
          renderTimeline();
          renderDeliverables('all');
          renderMeetings();
          renderFiles();
          renderFeedback();
          renderInvoices();
          showDashboardView();
        } else {
          throw new Error('Failed to load project details');
        }
      })
      .catch(function () {
        state.token = '';
        localStorage.removeItem('versaly_client_token');
        showLoginView();
      });
  }

  // --- RENDERING ROUTINES ---

  function renderHeaderInfo() {
    var c = state.client || {};
    var nameEl = document.getElementById('header-client-name');
    var compEl = document.getElementById('header-client-company');
    var avatarEl = document.getElementById('header-avatar');
    if (nameEl) nameEl.textContent = c.name || 'Client';
    if (compEl) compEl.textContent = c.company || '';
    if (avatarEl && c.name) avatarEl.textContent = c.name.charAt(0).toUpperCase();
  }

  function renderHero() {
    var p = state.project || {};
    var c = state.client || {};

    var stageEl = document.getElementById('dash-project-stage');
    var statusEl = document.getElementById('dash-project-status');
    var compEl = document.getElementById('dash-client-company');
    var leadEl = document.getElementById('dash-versaly-lead');
    var titleEl = document.getElementById('dash-project-name');
    var descEl = document.getElementById('dash-project-desc');
    var progressFill = document.getElementById('dash-progress-fill');
    var progressText = document.getElementById('dash-progress-percent');
    var targetDateEl = document.getElementById('dash-target-date');
    var pendingDelEl = document.getElementById('dash-pending-deliverables');
    var invSummaryEl = document.getElementById('dash-invoice-summary');

    if (stageEl) stageEl.textContent = p.stage || 'Discovery';
    if (statusEl) statusEl.textContent = (p.status || 'in_progress').replace('_', ' ');
    if (compEl) compEl.textContent = c.company || '';
    if (leadEl) leadEl.textContent = p.versalyLead || 'Versaly Engineering Desk';
    if (titleEl) titleEl.textContent = p.name || 'Custom Enterprise System';
    if (descEl) descEl.textContent = p.description || '';

    var pct = Math.min(100, Math.max(0, p.progressPercent || 0));
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressText) progressText.textContent = pct + '%';

    if (targetDateEl) {
      targetDateEl.textContent = p.targetLaunchDate ? formatDate(p.targetLaunchDate) : 'TBD';
    }

    var pendingCount = (p.deliverables || []).filter(function (d) { return d.status === 'pending_review'; }).length;
    if (pendingDelEl) pendingDelEl.textContent = pendingCount;
    var badgeDel = document.getElementById('badge-deliverables');
    if (badgeDel) {
      if (pendingCount > 0) {
        badgeDel.textContent = pendingCount;
        badgeDel.style.display = 'inline-block';
      } else {
        badgeDel.style.display = 'none';
      }
    }

    var unpaidInvoices = (p.invoices || []).filter(function (i) { return i.status === 'due'; });
    if (invSummaryEl) {
      invSummaryEl.textContent = unpaidInvoices.length > 0 ? (unpaidInvoices.length + ' Pending') : 'All Settled';
      invSummaryEl.className = 'portal-metric-val ' + (unpaidInvoices.length > 0 ? 'portal-metric-val--amber' : '');
    }
    var badgeInv = document.getElementById('badge-invoices');
    if (badgeInv) {
      badgeInv.style.display = unpaidInvoices.length > 0 ? 'inline-block' : 'none';
    }

    // Sidebar metadata
    var sbLeadName = document.getElementById('sidebar-lead-name');
    var sbLeadEmail = document.getElementById('sidebar-lead-email');
    var sbProjectDesc = document.getElementById('sidebar-project-desc');
    var sbTarget = document.getElementById('sidebar-target-deployment');
    if (sbLeadName) sbLeadName.textContent = p.versalyLead || 'Alex Mercer';
    if (sbLeadEmail && p.contactEmail) {
      sbLeadEmail.textContent = p.contactEmail;
      sbLeadEmail.href = 'mailto:' + p.contactEmail;
    }
    if (sbProjectDesc) sbProjectDesc.textContent = p.description || '';
    if (sbTarget) sbTarget.textContent = p.targetLaunchDate ? formatDate(p.targetLaunchDate) : 'Target Q4 2026';
  }

  function renderTimeline() {
    var container = document.getElementById('portal-timeline-list');
    if (!container) return;
    var timeline = (state.project && state.project.timeline) || [];

    if (!timeline.length) {
      container.innerHTML = '<p class="portal-text-muted">No timeline milestones posted yet.</p>';
      return;
    }

    var html = '';
    timeline.forEach(function (step, idx) {
      var statusClass = 'portal-timeline-step--' + (step.status || 'upcoming');
      var badgeClass = 'portal-step-badge--' + (step.status || 'upcoming');
      var iconContent = '';

      if (step.status === 'completed') {
        iconContent = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      } else if (step.status === 'in_progress') {
        iconContent = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
      } else {
        iconContent = '<span>' + (idx + 1) + '</span>';
      }

      var dateLabel = '';
      if (step.completedDate) {
        dateLabel = 'Completed: ' + formatDate(step.completedDate);
      } else if (step.targetDate) {
        dateLabel = 'Target: ' + formatDate(step.targetDate);
      }

      html += '<div class="portal-timeline-step ' + statusClass + '">'
        + '<div class="portal-step-icon">' + iconContent + '</div>'
        + '<div class="portal-step-content">'
        + '<div class="portal-step-header">'
        + '<span class="portal-step-title">' + escHtml(step.phase) + '</span>'
        + '<span class="portal-step-badge ' + badgeClass + '">' + (step.status || 'upcoming').replace('_', ' ') + '</span>'
        + '</div>'
        + '<p class="portal-step-desc">' + escHtml(step.summary || '') + '</p>'
        + (dateLabel ? '<span class="portal-step-date">' + dateLabel + '</span>' : '')
        + '</div>'
        + '</div>';
    });

    container.innerHTML = html;
  }

  function renderDeliverables(filter) {
    var container = document.getElementById('portal-deliverables-list');
    if (!container) return;
    var deliverables = (state.project && state.project.deliverables) || [];

    var filtered = deliverables.filter(function (d) {
      if (!filter || filter === 'all') return true;
      return d.status === filter;
    });

    if (!filtered.length) {
      container.innerHTML = '<p class="portal-text-muted" style="grid-column: 1/-1; padding: 2rem 0; text-align: center;">No deliverables match this filter.</p>';
      return;
    }

    var html = '';
    filtered.forEach(function (d) {
      var isApproved = d.status === 'approved';
      var statusClass = isApproved ? 'portal-status-pill--paid' : 'portal-status-pill--due';
      var statusLabel = isApproved ? 'Approved' : 'Pending Review';

      var actionBtn = '';
      if (!isApproved) {
        actionBtn = '<button type="button" class="portal-btn-approve" data-del-id="' + escHtml(d.id) + '" data-del-title="' + escHtml(d.title) + '">Approve Deliverable</button>';
      } else {
        actionBtn = '<span class="portal-text-muted portal-text-xs">Approved ' + (d.approvedAt ? formatDate(d.approvedAt) : '') + '</span>';
      }

      var fileLink = d.fileUrl ? '<a href="' + escHtml(d.fileUrl) + '" target="_blank" rel="noopener" class="portal-btn-view-doc">Inspect Artifact &rarr;</a>' : '';

      html += '<div class="portal-del-card">'
        + '<div class="portal-del-card__top">'
        + '<span class="portal-del-cat">' + escHtml(d.category || 'Deliverable') + '</span>'
        + '<span class="portal-status-pill ' + statusClass + '">' + statusLabel + '</span>'
        + '</div>'
        + '<h3 class="portal-del-title">' + escHtml(d.title) + '</h3>'
        + '<p class="portal-del-notes">' + escHtml(d.notes || 'Ready for client review and verification.') + '</p>'
        + '<div class="portal-del-footer">'
        + fileLink
        + actionBtn
        + '</div>'
        + '</div>';
    });

    container.innerHTML = html;

    // Attach approve button events
    container.querySelectorAll('.portal-btn-approve').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openApproveModal(btn.dataset.delId, btn.dataset.delTitle);
      });
    });
  }

  function renderMeetings() {
    var container = document.getElementById('portal-meetings-list');
    if (!container) return;
    var meetings = (state.project && state.project.meetingNotes) || [];

    if (!meetings.length) {
      container.innerHTML = '<p class="portal-text-muted">No meeting summaries posted yet.</p>';
      return;
    }

    var html = '';
    meetings.forEach(function (m) {
      html += '<div class="portal-meeting-item">'
        + '<div class="portal-meeting-header">'
        + '<h3 class="portal-meeting-title">' + escHtml(m.title) + '</h3>'
        + '<span class="portal-meeting-date">' + (m.date ? formatDate(m.date) : '') + '</span>'
        + '</div>'
        + '<div class="portal-meeting-attendees">Attendees: ' + escHtml(m.attendees || 'Client & Engineering Team') + '</div>'
        + '<p class="portal-meeting-summary">' + escHtml(m.summary || '') + '</p>'
        + (m.nextSteps ? '<div class="portal-meeting-actions"><strong>Agreed Action Items:</strong> ' + escHtml(m.nextSteps) + '</div>' : '')
        + '</div>';
    });

    container.innerHTML = html;
  }

  function renderFiles() {
    var tbody = document.getElementById('portal-files-tbody');
    if (!tbody) return;
    var files = (state.project && state.project.approvedFiles) || [];

    if (!files.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="portal-text-muted" style="text-align: center; padding: 2rem;">No approved repository files uploaded yet.</td></tr>';
      return;
    }

    var html = '';
    files.forEach(function (f) {
      html += '<tr>'
        + '<td><strong>' + escHtml(f.name) + '</strong></td>'
        + '<td><span class="portal-file-chip">' + escHtml(f.type || 'Document') + '</span></td>'
        + '<td>' + (f.uploadedAt ? formatDate(f.uploadedAt) : '&mdash;') + '</td>'
        + '<td>' + escHtml(f.size || '&mdash;') + '</td>'
        + '<td><a href="' + escHtml(f.url || '#') + '" target="_blank" rel="noopener" class="portal-btn-sm portal-btn-outline">Download</a></td>'
        + '</tr>';
    });

    tbody.innerHTML = html;
  }

  function renderFeedback() {
    var container = document.getElementById('portal-feedback-feed');
    if (!container) return;
    var feedback = (state.project && state.project.feedback) || [];

    if (!feedback.length) {
      container.innerHTML = '<p class="portal-text-muted">No feedback activity recorded yet. Submit a message using the form to the right.</p>';
      return;
    }

    var html = '';
    feedback.forEach(function (fb) {
      var typeBadge = fb.type === 'approval' ? '<span class="portal-status-pill portal-status-pill--paid">Approval Signoff</span>' : '<span class="portal-status-pill portal-status-pill--due">Note / Feedback</span>';

      html += '<div class="portal-fb-item">'
        + '<div class="portal-fb-header">'
        + '<span class="portal-fb-author">' + escHtml(fb.author || 'Client') + ' ' + typeBadge + '</span>'
        + '<span class="portal-fb-date">' + (fb.createdAt ? formatDate(fb.createdAt) : '') + '</span>'
        + '</div>'
        + '<p class="portal-fb-comment">' + escHtml(fb.comment) + '</p>'
        + (fb.adminResponse ? '<div class="portal-fb-reply"><strong>Versaly Engineering Reply:</strong> ' + escHtml(fb.adminResponse) + '</div>' : '')
        + '</div>';
    });

    container.innerHTML = html;
  }

  function renderInvoices() {
    var tbody = document.getElementById('portal-invoices-tbody');
    var summaryEl = document.getElementById('portal-billing-summary');
    if (!tbody) return;

    var invoices = (state.project && state.project.invoices) || [];

    var totalBilled = 0;
    var totalPaid = 0;
    var totalDue = 0;

    invoices.forEach(function (i) {
      var amt = Number(i.amount) || 0;
      totalBilled += amt;
      if (i.status === 'paid') totalPaid += amt;
      else totalDue += amt;
    });

    if (summaryEl) {
      summaryEl.innerHTML = '<div class="portal-billing-box">'
        + '<span>Total Invoiced: <strong>$' + totalBilled.toLocaleString() + '</strong></span>'
        + '<span>Settled: <strong style="color: var(--ptl-success);">$' + totalPaid.toLocaleString() + '</strong></span>'
        + '<span>Outstanding: <strong style="color: var(--ptl-warning);">$' + totalDue.toLocaleString() + '</strong></span>'
        + '</div>';
    }

    if (!invoices.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="portal-text-muted" style="text-align: center; padding: 2rem;">No invoices generated yet for this project.</td></tr>';
      return;
    }

    var html = '';
    invoices.forEach(function (i) {
      var isPaid = i.status === 'paid';
      var statusClass = isPaid ? 'portal-status-pill--paid' : 'portal-status-pill--due';
      var statusLabel = isPaid ? 'Paid' : 'Payment Due';

      var actionLink = '';
      if (!isPaid && i.paymentUrl) {
        actionLink = '<a href="' + escHtml(i.paymentUrl) + '" target="_blank" rel="noopener" class="portal-btn-pay">Pay Invoice &rarr;</a>';
      } else if (isPaid && i.receiptUrl) {
        actionLink = '<a href="' + escHtml(i.receiptUrl) + '" target="_blank" rel="noopener" class="portal-btn-receipt">Receipt PDF</a>';
      } else {
        actionLink = '<span class="portal-text-muted">&mdash;</span>';
      }

      html += '<tr>'
        + '<td><code>' + escHtml(i.id) + '</code></td>'
        + '<td><strong>' + escHtml(i.title) + '</strong></td>'
        + '<td>' + (i.issueDate ? formatDate(i.issueDate) : '&mdash;') + '</td>'
        + '<td>' + (i.dueDate ? formatDate(i.dueDate) : '&mdash;') + '</td>'
        + '<td><strong>$' + (Number(i.amount) || 0).toLocaleString() + ' ' + escHtml(i.currency || 'USD') + '</strong></td>'
        + '<td><span class="portal-status-pill ' + statusClass + '">' + statusLabel + '</span></td>'
        + '<td>' + actionLink + '</td>'
        + '</tr>';
    });

    tbody.innerHTML = html;
  }

  // --- SUBMISSIONS & MODAL HANDLERS ---

  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.portal-tab-btn').forEach(function (btn) {
      if (btn.dataset.tab === tabId) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    document.querySelectorAll('.portal-pane').forEach(function (pane) {
      if (pane.id === 'pane-' + tabId) pane.classList.add('active');
      else pane.classList.remove('active');
    });
  }

  function handleFeedbackSubmit(e) {
    e.preventDefault();
    var commentEl = document.getElementById('fb-comment');
    var typeEl = document.getElementById('fb-type');
    var submitBtn = document.getElementById('fb-submit-btn');

    var comment = (commentEl.value || '').trim();
    var type = typeEl.value || 'feedback';

    if (!comment) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Transmitting...';
    }

    fetch('/api/portal/feedback', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ comment: comment, type: type })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send to Versaly Team';
        }
        if (data.success && data.feedback) {
          commentEl.value = '';
          if (!state.project.feedback) state.project.feedback = [];
          state.project.feedback.unshift(data.feedback);
          renderFeedback();
          showToast('Feedback submitted to Versaly team.');
        } else {
          showToast(data.error || 'Could not submit feedback.');
        }
      })
      .catch(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send to Versaly Team';
        }
        showToast('Connection error.');
      });
  }

  function openApproveModal(delId, title) {
    state.pendingApprovalDelId = delId;
    var titleEl = document.getElementById('modal-del-title');
    if (titleEl) titleEl.textContent = title;
    var notesEl = document.getElementById('approve-notes');
    if (notesEl) notesEl.value = '';
    if (modalApprove) modalApprove.classList.add('is-open');
  }

  function closeApproveModal() {
    state.pendingApprovalDelId = null;
    if (modalApprove) modalApprove.classList.remove('is-open');
  }

  function confirmApproveDeliverable() {
    if (!state.pendingApprovalDelId) return;

    var notes = (document.getElementById('approve-notes').value || '').trim();
    var btn = document.getElementById('btn-confirm-approve');
    if (btn) btn.disabled = true;

    fetch('/api/portal/deliverables/' + encodeURIComponent(state.pendingApprovalDelId) + '/approve', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ notes: notes })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (btn) btn.disabled = false;
        closeApproveModal();
        if (data.success && data.deliverable) {
          showToast('Deliverable approved successfully!');
          // Refresh project data
          loadPortalData();
        } else {
          showToast(data.error || 'Failed to approve deliverable.');
        }
      })
      .catch(function () {
        if (btn) btn.disabled = false;
        closeApproveModal();
        showToast('Connection error.');
      });
  }

  function openContactModal() {
    var p = state.project || {};
    var nameEl = document.getElementById('contact-modal-name');
    var emailEl = document.getElementById('contact-modal-email');
    var mailtoEl = document.getElementById('contact-modal-mailto');

    if (nameEl) nameEl.textContent = p.versalyLead || 'Alex Mercer';
    if (emailEl && p.contactEmail) {
      emailEl.textContent = p.contactEmail;
      emailEl.href = 'mailto:' + p.contactEmail;
    }
    if (mailtoEl && p.contactEmail) {
      mailtoEl.href = 'mailto:' + p.contactEmail + '?subject=Client%20Portal%20Inquiry%20-%20' + encodeURIComponent(p.name || 'Project');
    }
    if (modalContact) modalContact.classList.add('is-open');
  }

  function closeContactModal() {
    if (modalContact) modalContact.classList.remove('is-open');
  }

  // --- UTILS ---
  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      var d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return isoStr;
    }
  }

  function escHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
