/**
 * SAGE Leaderboard - Version Evolution Display
 * 
 * This script handles:
 * - Loading JSON data (single-node and multi-node)
 * - Tab switching between single/multi configurations
 * - Configuration filtering (Version / Backend / Workload / Nodes / Parallelism)
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
        filters: {
            'single-chip': { version: 'all', backend: 'all', workload: 'all', nodes: 'all', parallelism: 'all' },
            'multi-chip': { version: 'all', backend: 'all', workload: 'all', nodes: 'all', parallelism: 'all' },
            'multi-node': { version: 'all', backend: 'all', workload: 'all', nodes: 'all', parallelism: 'all' }
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

    function getVersion(entry) {
        return entry.sage_version || 'unknown';
    }

    function normalizeDisplayValue(value, fallback = '-') {
        if (value === undefined || value === null) return fallback;
        const normalized = String(value).trim();
        if (!normalized) return fallback;
        if (['unknown', 'none', 'null', 'n/a', '-'].includes(normalized.toLowerCase())) {
            return fallback;
        }
        return normalized;
    }

    function getSageLLMVersion(entry) {
        return normalizeDisplayValue(entry.sagellm_version || entry.metadata?.sagellm_version);
    }

    function getModelName(entry) {
        const llm = normalizeDisplayValue(
            entry.model_name || entry.metadata?.model_name || entry.model?.name,
            '',
        );
        const emb = normalizeDisplayValue(
            entry.embedding_model_name || entry.metadata?.embedding_model_name,
            '',
        );
        if (llm && emb) return `${llm} / ${emb}`;
        if (llm) return llm;
        if (emb) return emb;
        return '-';
    }

    function getTimestamp(entry) {
        return entry.timestamp || '-';
    }

    function getBackend(entry) {
        return String(entry.backend || entry.raw_record?.backend || 'sage').toLowerCase();
    }

    function getWorkload(entry) {
        return entry.workload?.name || 'Unknown';
    }

    function getNodes(entry) {
        if (entry.nodes !== undefined && entry.nodes !== null) return Number(entry.nodes);
        if (entry.cluster?.node_count !== undefined && entry.cluster?.node_count !== null) return Number(entry.cluster.node_count);
        return 1;
    }

    function getParallelism(entry) {
        if (entry.parallelism !== undefined && entry.parallelism !== null) return Number(entry.parallelism);
        const detail = String(entry.resource_config?.details || '');
        const m = detail.match(/parallelism\s*=\s*(\d+)/i);
        return m ? Number(m[1]) : 1;
    }

    function metricNumber(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }

    function scoreTimestamp(entry) {
        const ts = Date.parse(getTimestamp(entry));
        return Number.isFinite(ts) ? ts : 0;
    }

    function pickBetterEntry(current, candidate) {
        const currentTp = metricNumber(current.metrics?.throughput_qps);
        const candidateTp = metricNumber(candidate.metrics?.throughput_qps);
        if (currentTp !== null && candidateTp !== null && Math.abs(currentTp - candidateTp) > 1e-9) {
            return candidateTp > currentTp ? candidate : current;
        }

        const currentLat = metricNumber(current.metrics?.latency_p99);
        const candidateLat = metricNumber(candidate.metrics?.latency_p99);
        if (currentLat !== null && candidateLat !== null && Math.abs(currentLat - candidateLat) > 1e-9) {
            return candidateLat < currentLat ? candidate : current;
        }

        return scoreTimestamp(candidate) > scoreTimestamp(current) ? candidate : current;
    }

    function deduplicateEntries(entries) {
        const merged = new Map();
        entries.forEach((entry) => {
            const key = [
                getVersion(entry),
                getSageLLMVersion(entry),
                getModelName(entry),
                getWorkload(entry),
                getBackend(entry),
                String(getNodes(entry)),
                String(getParallelism(entry)),
            ].join('|');

            if (!merged.has(key)) {
                merged.set(key, entry);
                return;
            }
            merged.set(key, pickBetterEntry(merged.get(key), entry));
        });
        return Array.from(merged.values());
    }

    // Initialize filters
    function initializeFilters() {
        ['single-chip', 'multi-chip', 'multi-node'].forEach(tab => {
            const data = getDataByTab(tab);
            if (data.length === 0) return;
            const versions = getUniqueValues(data, (d) => getVersion(d)).sort(compareVersions).reverse();
            state.filters[tab] = {
                version: versions[0] || 'all',
                backend: 'all',
                workload: 'all',
                nodes: 'all',
                parallelism: 'all',
            };
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
        ['version', 'backend', 'workload', 'nodes', 'parallelism'].forEach(filterType => {
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

        const versionOptions = getUniqueValues(data, (d) => getVersion(d)).sort(compareVersions).reverse();
        const backendOptions = getUniqueValues(data, (d) => getBackend(d));
        const workloadOptions = getUniqueValues(data, (d) => getWorkload(d));
        const nodesOptions = getUniqueValues(data, (d) => String(getNodes(d))).sort((a, b) => Number(a) - Number(b));
        const parallelOptions = getUniqueValues(data, (d) => String(getParallelism(d))).sort((a, b) => Number(a) - Number(b));

        updateSelect('filter-version', versionOptions, filters.version, true);
        updateSelect('filter-backend', backendOptions, filters.backend, true);
        updateSelect('filter-workload', workloadOptions, filters.workload, true);
        updateSelect('filter-nodes', nodesOptions, filters.nodes, true);
        updateSelect('filter-parallelism', parallelOptions, filters.parallelism, true);
    }

    function getUniqueValues(data, accessor) {
        return [...new Set(data.map(accessor).filter(Boolean))];
    }

    function updateSelect(id, options, selectedValue, includeAll = false) {
        const select = document.getElementById(id);
        if (!select) return;
        const allOption = includeAll ? `<option value="all" ${selectedValue === 'all' ? 'selected' : ''}>All</option>` : '';
        select.innerHTML = allOption + options.map(opt =>
            `<option value="${opt}" ${String(opt) === String(selectedValue) ? 'selected' : ''}>${opt}</option>`
        ).join('');
    }

    function renderTable() {
        const tbody = document.getElementById('leaderboard-tbody');
        const emptyState = document.getElementById('empty-state');
        const statsEl = document.getElementById('leaderboard-data-stats');
        if (!tbody) return;

        const data = getDataByTab(state.currentTab);
        const filters = state.filters[state.currentTab];

        // SAGE-native multi-dim filter
        const filteredRaw = data.filter(entry => {
            const matchesVersion = filters.version === 'all' || getVersion(entry) === filters.version;
            const matchesBackend = filters.backend === 'all' || getBackend(entry) === filters.backend;
            const matchesWorkload = filters.workload === 'all' || getWorkload(entry) === filters.workload;
            const matchesNodes = filters.nodes === 'all' || String(getNodes(entry)) === String(filters.nodes);
            const matchesParallel = filters.parallelism === 'all' || String(getParallelism(entry)) === String(filters.parallelism);
            return matchesVersion && matchesBackend && matchesWorkload && matchesNodes && matchesParallel;
        });

        const filtered = deduplicateEntries(filteredRaw);

        if (statsEl) {
            statsEl.textContent = `Loaded ${state.totalLoadedEntries} entries • Showing ${filtered.length} unique entries`;
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';

        // Sort by workload/backend/nodes/parallelism
        filtered.sort((a, b) => {
            const byVersion = compareVersions(getVersion(b), getVersion(a));
            if (byVersion !== 0) return byVersion;
            const byWorkload = getWorkload(a).localeCompare(getWorkload(b), undefined, { numeric: true });
            if (byWorkload !== 0) return byWorkload;
            const byBackend = getBackend(a).localeCompare(getBackend(b));
            if (byBackend !== 0) return byBackend;
            const byNodes = getNodes(a) - getNodes(b);
            if (byNodes !== 0) return byNodes;
            return getParallelism(a) - getParallelism(b);
        });

        // Trends are defined only when a specific version is selected
        const allVersions = getUniqueValues(data, d => getVersion(d)).sort(compareVersions);
        const currentVerIndex = filters.version === 'all' ? -1 : allVersions.indexOf(filters.version);
        const prevVer = currentVerIndex > 0 ? allVersions[currentVerIndex - 1] : null;

        const withTrends = filtered.map((entry, index) => {
            // Find trend reference: Same workload/backend/nodes/parallelism in previous version
            let prevEntry = null;
            if (prevVer) {
                prevEntry = data.find(d => 
                    getVersion(d) === prevVer &&
                    getWorkload(d) === getWorkload(entry) &&
                    getBackend(d) === getBackend(entry) &&
                    getNodes(d) === getNodes(entry) &&
                    getParallelism(d) === getParallelism(entry)
                );
            }
            // Find baseline (oldest version)
            const baselineVer = allVersions[0];
             let baselineEntry = null;
             if (baselineVer && filters.version !== 'all' && baselineVer !== filters.version) {
                 baselineEntry = data.find(d => 
                    getVersion(d) === baselineVer &&
                    getWorkload(d) === getWorkload(entry) &&
                    getBackend(d) === getBackend(entry) &&
                    getNodes(d) === getNodes(entry) &&
                    getParallelism(d) === getParallelism(entry)
                );
             }

            const trends = prevEntry ? calculateTrends(entry, prevEntry) : {};
            const baselineTrends = baselineEntry ? calculateTrends(entry, baselineEntry) : {};
            
            // isBaseline check: if this version IS the oldest
            const isBaseline = (filters.version !== 'all' && filters.version === baselineVer);

            return { ...entry, trends, baselineTrends, isBaseline };
        });

        const versionRowSpans = new Map();
        withTrends.forEach((entry) => {
            const version = getVersion(entry);
            versionRowSpans.set(version, (versionRowSpans.get(version) || 0) + 1);
        });

        let lastVersion = null;
        tbody.innerHTML = withTrends.map((entry, index) => {
            const isExpanded = state.expandedRows.has(entry.entry_id || index);
            if (!entry.entry_id) entry.entry_id = `entry-${index}`; 
            const version = getVersion(entry);
            const showVersionCell = version !== lastVersion;
            const versionRowSpan = showVersionCell ? (versionRowSpans.get(version) || 1) : 0;
            if (showVersionCell) {
                lastVersion = version;
            }
            
            return `
                ${renderDataRow(entry, isExpanded, showVersionCell, versionRowSpan)}
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
        return trend;
    }

    function renderDataRow(entry, isExpanded, showVersionCell, versionRowSpan) {
        const m = entry.metrics || {};
        const t = entry.trends || {};
        const bt = entry.baselineTrends || {};
        const versionCell = showVersionCell
            ? `
                <td rowspan="${versionRowSpan}">
                    <div class="version-cell">
                        <span>${getVersion(entry)}</span>
                        ${entry.isBaseline ? '<span class="version-badge baseline">Baseline</span>' : ''}
                    </div>
                    <small class="version-subline">Date: ${getTimestamp(entry)}</small>
                </td>
            `
            : '';

        return `
            <tr data-entry-id="${entry.entry_id}">
                ${versionCell}
                <td>${getSageLLMVersion(entry)}</td>
                <td class="model-cell">${getModelName(entry)}</td>
                <td style="font-weight: 500">${getWorkload(entry)}</td>
                <td class="config-cell">${getBackend(entry).toUpperCase()}</td>
                <td>${getNodes(entry)}</td>
                <td>${getParallelism(entry)}</td>
                <td>${renderMetricCell(m.latency_p99, t.latency_p99, bt.latency_p99, false, false, entry.isBaseline)}</td>
                <td>${renderMetricCell(m.throughput_qps, t.throughput_qps, bt.throughput_qps, true, false, entry.isBaseline)}</td>
                <td>${renderMetricCell(m.memory_mb, t.memory_mb, bt.memory_mb, false, false, entry.isBaseline)}</td>
                <td class="action-cell">
                    <button class="btn-details" data-entry-id="${entry.entry_id || 'unknown'}" title="${isExpanded ? 'Collapse details' : 'Expand details'}" aria-label="${isExpanded ? 'Collapse details' : 'Expand details'}">
                        ${isExpanded ? '▴' : '▾'}
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
        const sp = entry.system_profile || {};

        // Format component versions list
        const compList = Object.entries(comps).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('');
        const machineInfo = Object.keys(sp).length > 0
            ? `
            <div class="detail-section">
                <h4>Machine Configuration</h4>
                <p><strong>Host:</strong> ${sp.hostname || '-'}</p>
                <p><strong>OS:</strong> ${sp.os || '-'} (${sp.arch || '-'})</p>
                <p><strong>CPU:</strong> ${sp.cpu_model || '-'}</p>
                <p><strong>Cores:</strong> ${sp.cpu_physical_cores ?? '-'}</p>
                <p><strong>Memory:</strong> ${sp.memory_gb ?? '-'} GB</p>
                <p><strong>GPU:</strong> ${sp.gpu || '-'}</p>
                <p><strong>Python:</strong> ${sp.python || '-'}</p>
            </div>
            `
            : '';
        
        return `
            <tr class="details-row">
                <td colspan="11">
                    <div class="details-content">
                        <div class="detail-grid">
                            <div class="detail-section">
                                <h4>Resource Details</h4>
                                <p><strong>Name:</strong> ${getResourceName(entry)}</p>
                                <p><strong>Backend:</strong> ${getBackend(entry)}</p>
                                <p><strong>Nodes:</strong> ${getNodes(entry)}</p>
                                <p><strong>Parallelism:</strong> ${getParallelism(entry)}</p>
                                <p><strong>Detail:</strong> ${rConf.details || '-'}</p>
                            </div>
                            <div class="detail-section">
                                <h4>Workload Details</h4>
                                <p><strong>Type:</strong> ${wConf.type || '-'}</p>
                                <p><strong>Description:</strong> ${wConf.description || '-'}</p>
                                <p><strong>SageLLM Version:</strong> ${getSageLLMVersion(entry)}</p>
                                <p><strong>Model:</strong> ${getModelName(entry)}</p>
                            </div>
                            ${machineInfo}
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
