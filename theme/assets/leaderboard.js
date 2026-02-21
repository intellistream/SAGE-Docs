/**
 * SAGE Leaderboard - Version Evolution Display
 * 
 * This script handles:
 * - Loading JSON data (single-node and multi-node)
 * - Tab switching between single/multi configurations
 * - Configuration filtering (VERSION, resource)
 * - Version sorting (newest first)
 * - Trend calculation (compare with previous version)
 * - Detail expansion/collapse
 */

(function () {
    'use strict';

    // State management
    let state = {
        currentTab: 'single-chip', // single-chip, multi-chip, multi-node
        singleChipData: [],
        multiChipData: [],
        multiNodeData: [],
        totalLoadedEntries: 0,
        filters: { // Defaults
            'single-chip': { version: '', resource: '' },
            'multi-chip': { version: '', resource: '' },
            'multi-node': { version: '', resource: '' }
        },
        expandedRows: new Set()
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        await loadData();
        setupEventListeners();
        renderFilters();
        renderTable();
        await renderLastUpdated();
    }

    // Load JSON data (HF or Local)
    async function loadData() {
        const loadingEl = document.getElementById('leaderboard-loading');
        const errorEl = document.getElementById('leaderboard-error');
        const contentEl = document.getElementById('leaderboard-content');

        try {
            let singleData, multiData;

            // Try HF Loader
            if (window.HFDataLoader) {
                console.log('[Leaderboard] Using HF Data Loader...');
                try {
                    const data = await window.HFDataLoader.loadLeaderboardData();
                    singleData = data.single;
                    multiData = data.multi;
                } catch (e) {
                     console.warn('HF Loader failed, using local fallback...');
                }
            }
            
            if (!singleData) {
                // Local fallback
                const [singleRes, multiRes] = await Promise.all([
                    fetch('./data/leaderboard_single.json'),
                    fetch('./data/leaderboard_multi.json')
                ]);

                if (!singleRes.ok || !multiRes.ok) throw new Error('Failed to load data');

                singleData = await singleRes.json();
                multiData = await multiRes.json();
            }

            // Categorize Data
            state.singleChipData = singleData.filter(d => !d.config_type || d.config_type.includes('single'));
            state.multiNodeData = multiData.filter(d => d.config_type && d.config_type.includes('multi'));
            // Assuming multi-chip goes to multiNode or stays empty for now if not present

            // Sort by version (desc), then workload name (asc)
            const sorter = (a, b) => {
                const v = compareVersions(b.sage_version, a.sage_version);
                if (v !== 0) return v;
                return (a.workload?.name || '').localeCompare(b.workload?.name || '');
            };

            [state.singleChipData, state.multiChipData, state.multiNodeData].forEach(data => {
                data.sort(sorter);
            });

            state.totalLoadedEntries =
                state.singleChipData.length +
                state.multiChipData.length +
                state.multiNodeData.length;

            initializeFilters();

            loadingEl.style.display = 'none';
            contentEl.style.display = 'block';
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
        }
    }

    function getResourceName(entry) {
        if (!entry.resource_config) return 'Unknown';
        return typeof entry.resource_config === 'object' ? entry.resource_config.name : entry.resource_config;
    }

    // Initialize filters
    function initializeFilters() {
        ['single-chip', 'multi-chip', 'multi-node'].forEach(tab => {
            const data = getDataByTab(tab);
            if (data.length > 0) {
                // Default: Latest version, first resource
                const versions = getUniqueValues(data, d => d.sage_version).sort(compareVersions).reverse();
                const latest = versions[0];
                
                // Find resource associated with latest
                const firstEntry = data.find(d => d.sage_version === latest);
                
                state.filters[tab] = {
                    version: latest,
                    resource: firstEntry ? getResourceName(firstEntry) : ''
                };
            }
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                switchTab(tab);
            });
        });

        // Filter changes
        ['version', 'resource'].forEach(filterType => {
            const selectEl = document.getElementById(`filter-${filterType}`);
            if (selectEl) {
                selectEl.addEventListener('change', () => {
                    state.filters[state.currentTab][filterType] = selectEl.value;
                    renderTable();
                });
            }
        });
    }

    function getDataByTab(tab) {
        switch (tab) {
            case 'single-chip': return state.singleChipData;
            case 'multi-chip': return state.multiChipData;
            case 'multi-node': return state.multiNodeData;
            default: return [];
        }
    }

    function switchTab(tab) {
        state.currentTab = tab;
        state.expandedRows.clear();

        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        renderFilters();
        renderTable();
    }

    function renderFilters() {
        const data = getDataByTab(state.currentTab);
        const filters = state.filters[state.currentTab];

        // Options available in the WHOLE dataset for this tab
        const versionOptions = getUniqueValues(data, d => d.sage_version).sort(compareVersions).reverse();
        const resourceOptions = getUniqueValues(data, d => getResourceName(d));

        updateSelect('filter-version', versionOptions, filters.version);
        updateSelect('filter-resource', resourceOptions, filters.resource);
    }

    function getUniqueValues(data, accessor) {
        return [...new Set(data.map(accessor).filter(Boolean))];
    }

    function updateSelect(id, options, selectedValue) {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = options.map(opt =>
            `<option value="${opt}" ${opt === selectedValue ? 'selected' : ''}>${opt}</option>`
        ).join('');
    }

    function renderTable() {
        const tbody = document.getElementById('leaderboard-tbody');
        const emptyState = document.getElementById('empty-state');
        const statsEl = document.getElementById('leaderboard-data-stats');
        if (!tbody) return;

        const data = getDataByTab(state.currentTab);
        const filters = state.filters[state.currentTab];

        // Filter: Show entries matching Version AND Resource
        // This will result in a list like: v0.6.0-Q1, v0.6.0-Q2, v0.6.0-Q3
        const filtered = data.filter(entry => {
            const rName = getResourceName(entry);
            return entry.sage_version === filters.version && rName === filters.resource;
        });

        if (statsEl) {
            statsEl.textContent = `Loaded ${state.totalLoadedEntries} entries • Showing ${filtered.length} entries`;
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';

        // Sort by Workload Name (Q1, Q2, Q3...)
        filtered.sort((a, b) => (a.workload?.name || '').localeCompare(b.workload?.name || '', undefined, { numeric: true }));

        // Prepare rows with trends
        // Need to find PREVIOUS version for EACH workload
        const allVersions = getUniqueValues(data, d => d.sage_version).sort(compareVersions); // ascending
        const currentVerIndex = allVersions.indexOf(filters.version);
        const prevVer = currentVerIndex > 0 ? allVersions[currentVerIndex - 1] : null;

        const withTrends = filtered.map((entry, index) => {
            // Find trend reference: Same workload, Same resource, Previous Version
            let prevEntry = null;
            if (prevVer) {
                prevEntry = data.find(d => 
                    d.sage_version === prevVer && 
                    d.workload?.name === entry.workload?.name &&
                    getResourceName(d) === getResourceName(entry)
                );
            }
            // Find baseline (oldest version)
            const baselineVer = allVersions[0];
             let baselineEntry = null;
             if (baselineVer && baselineVer !== filters.version) {
                 baselineEntry = data.find(d => 
                    d.sage_version === baselineVer && 
                    d.workload?.name === entry.workload?.name &&
                    getResourceName(d) === getResourceName(entry)
                );
             }

            const trends = prevEntry ? calculateTrends(entry, prevEntry) : {};
            const baselineTrends = baselineEntry ? calculateTrends(entry, baselineEntry) : {};
            
            // isBaseline check: if this version IS the oldest
            const isBaseline = (filters.version === baselineVer);

            return { ...entry, trends, baselineTrends, isBaseline };
        });

        tbody.innerHTML = withTrends.map((entry, index) => {
            // For the filtered view (one version), IsLatest applies to the Version, so all rows are "Latest" if version is latest.
            // But we can simplify: Just show columns
            const isExpanded = state.expandedRows.has(entry.entry_id || index);
            if (!entry.entry_id) entry.entry_id = `entry-${index}`; 
            
            return `
                ${renderDataRow(entry, isExpanded)}
                ${renderDetailsRow(entry, isExpanded)}
            `;
        }).join('');
        
        // Re-attach listeners for details buttons
        document.querySelectorAll('.btn-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.entryId;
                toggleDetails(id);
            });
        });
    }

    async function renderLastUpdated() {
        const el = document.getElementById('leaderboard-last-updated');
        if (!el) return;

        if (!window.HFDataLoader || typeof window.HFDataLoader.getLastUpdated !== 'function') {
            el.textContent = 'Last updated: -';
            return;
        }

        try {
            const iso = await window.HFDataLoader.getLastUpdated();
            if (!iso) {
                el.textContent = 'Last updated: -';
                return;
            }
            const dt = new Date(iso);
            el.textContent = `Last updated: ${dt.toLocaleString()}`;
        } catch (_error) {
            el.textContent = 'Last updated: -';
        }
    }

    function toggleDetails(id) {
        if (state.expandedRows.has(id)) {
            state.expandedRows.delete(id);
        } else {
            state.expandedRows.add(id);
        }
        renderTable();
    }

    function calculateTrends(current, reference) {
        if (!reference) return {};
        const cm = current.metrics || {};
        const rm = reference.metrics || {};
        
        const trend = {};
        if (cm.throughput_qps && rm.throughput_qps) trend.throughput_qps = ((cm.throughput_qps - rm.throughput_qps) / rm.throughput_qps) * 100;
        if (cm.latency_p99 && rm.latency_p99) trend.latency_p99 = ((cm.latency_p99 - rm.latency_p99) / rm.latency_p99) * 100;
        if (cm.success_rate && rm.success_rate) trend.success_rate = ((cm.success_rate - rm.success_rate) / rm.success_rate) * 100;
        return trend;
    }

    function renderDataRow(entry, isExpanded) {
        const m = entry.metrics || {};
        const t = entry.trends || {};
        const bt = entry.baselineTrends || {};

        return `
            <tr data-entry-id="${entry.entry_id}">
                <td>
                    <div class="version-cell">
                        <span>${entry.sage_version}</span>
                        ${entry.isBaseline ? '<span class="version-badge baseline">Baseline</span>' : ''}
                    </div>
                </td>
                <td style="font-weight: 500">${entry.workload ? entry.workload.name : 'Unknown'}</td>
                <td class="config-cell">${getResourceName(entry)}</td>
                <td class="date-cell">${entry.timestamp || entry.metadata?.release_date || '-'}</td>
                <td>${renderMetricCell(m.latency_p99, t.latency_p99, bt.latency_p99, false, false, entry.isBaseline)}</td>
                <td>${renderMetricCell(m.throughput_qps, t.throughput_qps, bt.throughput_qps, true, false, entry.isBaseline)}</td>
                <td>${renderMetricCell(m.memory_mb, t.memory_mb, bt.memory_mb, false, false, entry.isBaseline)}</td>
                <td>${renderMetricCell(m.success_rate, t.success_rate, bt.success_rate, true, true, entry.isBaseline)}</td>
                <td>${renderMetricCell(m.accuracy_score, t.accuracy_score, bt.accuracy_score, true, false, entry.isBaseline)}</td>
                <td class="action-cell">
                    <button class="btn-details" data-entry-id="${entry.entry_id || 'unknown'}">
                        ${isExpanded ? 'Hide' : 'Details'}
                    </button>
                </td>
            </tr>
        `;
    }

    function renderMetricCell(value, prevTrend, baselineTrend, higherIsBetter, isPercentage = false, isBaseline = false) {
        if (value === undefined || value === null) return '<div class="metric-cell"><span class="metric-neutral">-</span></div>';
        
        const formattedValue = isPercentage ?
            (value).toFixed(1) + '%' :
            typeof value === 'number' ? value.toFixed(1) : value;

        if (isBaseline) {
            return `<div class="metric-cell"><span class="metric-value">${formattedValue}</span></div>`;
        }
        
        // Hide trends if 0 or undefined
        const prevTrendHtml = (prevTrend && Math.abs(prevTrend) > 0.1) ? formatTrendIndicator(prevTrend, higherIsBetter, 'vs Prev') : '';
        const baseTrendHtml = (baselineTrend && Math.abs(baselineTrend) > 0.1) ? formatTrendIndicator(baselineTrend, higherIsBetter, 'vs Base') : '';

        return `
            <div class="metric-cell">
                <span class="metric-value">${formattedValue}</span>
                ${prevTrendHtml}
                ${baseTrendHtml}
            </div>
        `;
    }

    function formatTrendIndicator(trend, higherIsBetter, label) {
        // Trend > 0: Increased. If higher matches trend direction, good.
        // higherIsBetter=true, trend>0 -> good (green)
        // higherIsBetter=false, trend>0 -> bad (red) ("Latency increased")
        const isGood = higherIsBetter ? (trend > 0) : (trend < 0);
        const trendClass = isGood ? 'trend-up' : (trend === 0 ? 'trend-neutral' : 'trend-down');
        
        // Simpler icon
        const icon = trend > 0 ? '↑' : '↓';
        const trendText = Math.abs(trend).toFixed(1) + '%';
        
        return `<small style="color: #718096; display: block; font-size: 0.7em;">${label}: <span class="${trendClass}">${icon} ${trendText}</span></small>`;
    }

    function renderDetailsRow(entry, isExpanded) {
        if (!isExpanded) return '';
        
        // Build details content
        const rConf = entry.resource_config || {};
        const wConf = entry.workload || {};
        const comps = entry.components || {};

        // Format component versions list
        const compList = Object.entries(comps).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('');
        
        return `
            <tr class="details-row">
                <td colspan="10">
                    <div class="details-content">
                        <div class="detail-grid">
                            <div class="detail-section">
                                <h4>Resource Details</h4>
                                <p><strong>Name:</strong> ${getResourceName(entry)}</p>
                                <p><strong>Detail:</strong> ${rConf.details || '-'}</p>
                            </div>
                            <div class="detail-section">
                                <h4>Workload Details</h4>
                                <p><strong>Type:</strong> ${wConf.type || '-'}</p>
                                <p><strong>Description:</strong> ${wConf.description || '-'}</p>
                            </div>
                             ${compList ? `
                            <div class="detail-section">
                                <h4>Component Versions</h4>
                                <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9em;">
                                    ${compList}
                                </ul>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    function compareVersions(v1, v2) {
        if (!v1) return -1;
        if (!v2) return 1;
        // Simple string compare or semver if needed. For now lexical sort is ok for v0.6 vs v0.5
        return v1.localeCompare(v2, undefined, { numeric: true, sensitivity: 'base' });
    }

})();
