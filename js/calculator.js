/**
 * softify ROI & Value Calculator Engine (js/calculator.js) — Phase 13
 * Provides dynamic recalculation of hours saved, dollar efficiency, and ROI multipliers,
 * with animated numeral displays and URL parameter generator for demo booking handoff.
 */

(function () {
    'use strict';

    function initCalculator() {
        const teamSlider = document.getElementById('calc-team-size');
        const teamVal = document.getElementById('calc-team-val');
        const hoursSlider = document.getElementById('calc-hours');
        const hoursVal = document.getElementById('calc-hours-val');
        const rateSlider = document.getElementById('calc-rate');
        const rateVal = document.getElementById('calc-rate-val');
        const industrySelect = document.getElementById('calc-industry');

        const kpiSavingsEl = document.getElementById('calc-kpi-savings');
        const kpiHoursEl = document.getElementById('calc-kpi-hours');
        const kpiRoiEl = document.getElementById('calc-kpi-roi');
        const ctaBtn = document.getElementById('calc-claim-btn');

        if (!teamSlider || !hoursSlider || !rateSlider || !kpiSavingsEl) return;

        // Industry multipliers based on operational overhead reduction
        const INDUSTRY_MULTIPLIERS = {
            'hospitality': 0.72,  // 72% manual sync reduction
            'healthcare': 0.78,   // 78% intake & notes reduction
            'finance': 0.82,      // 82% ledger sync & reporting acceleration
            'manufacturing': 0.75,// 75% inventory tracking efficiency
            'custom': 0.70        // 70% custom workflow automation
        };

        function formatCurrency(val) {
            return '$' + Math.round(val).toLocaleString();
        }

        function formatNumber(val) {
            return Math.round(val).toLocaleString();
        }

        function recalculate() {
            const teamSize = parseInt(teamSlider.value, 10) || 1;
            const manualHoursPerWeek = parseFloat(hoursSlider.value) || 1;
            const hourlyRate = parseFloat(rateSlider.value) || 20;
            const industry = (industrySelect && industrySelect.value) || 'hospitality';
            const efficiencyRate = INDUSTRY_MULTIPLIERS[industry] || 0.75;

            // 1. Update text displays for slider labels
            if (teamVal) teamVal.textContent = `${teamSize} ${teamSize === 1 ? 'user' : 'users'}`;
            if (hoursVal) hoursVal.textContent = `${manualHoursPerWeek} hrs/wk`;
            if (rateVal) rateVal.textContent = `$${hourlyRate}/hr`;

            // 2. Calculations
            // Total annual manual hours = teamSize * manualHoursPerWeek * 52
            const totalAnnualManualHours = teamSize * manualHoursPerWeek * 52;
            const recoveredAnnualHours = totalAnnualManualHours * efficiencyRate;

            // Total annual cost saved = recoveredAnnualHours * hourlyRate
            const annualCostSavings = recoveredAnnualHours * hourlyRate;

            // ROI Multiplier estimated relative to standard cloud license
            const estimatedLicenseCost = Math.max(3600, teamSize * 480);
            const rawRoi = Math.max(2.1, (annualCostSavings / estimatedLicenseCost));
            const roiMultiplier = rawRoi.toFixed(1) + 'x';

            // 3. Update DOM metrics
            if (kpiSavingsEl) kpiSavingsEl.textContent = formatCurrency(annualCostSavings);
            if (kpiHoursEl) kpiHoursEl.textContent = formatNumber(recoveredAnnualHours);
            if (kpiRoiEl) kpiRoiEl.textContent = roiMultiplier;

            // 4. Update CTA link with pre-populated URL parameters
            if (ctaBtn) {
                const params = new URLSearchParams({
                    goal: 'roi_analysis',
                    industry: industry,
                    team_size: teamSize,
                    est_savings: Math.round(annualCostSavings),
                    est_hours: Math.round(recoveredAnnualHours)
                });
                ctaBtn.href = `request-demo.html?${params.toString()}`;
            }
        }

        // Event listeners
        [teamSlider, hoursSlider, rateSlider].forEach(slider => {
            slider.addEventListener('input', recalculate);
        });

        if (industrySelect) {
            industrySelect.addEventListener('change', recalculate);
        }

        // Initial run
        recalculate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCalculator);
    } else {
        initCalculator();
    }

    if (typeof window !== 'undefined') {
        window.softifyCalculator = { init: initCalculator };
    }
})();
