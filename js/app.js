/* ==========================================================
   自然灾害天气资讯站 - 核心逻辑
   功能：4重过滤（类型+地区+时间+搜索）、防抖搜索、主题切换、
         弹窗三关闭、天气刷新、回到顶部、统计仪表盘
   ========================================================== */

(function () {
  'use strict';

  /* ---------- 全局常量 ---------- */
  const DISASTER_TYPES = {
    typhoon: { name: '台风', icon: '🌀' },
    earthquake: { name: '地震', icon: '🌋' },
    flood: { name: '洪水', icon: '🌊' },
    rainstorm: { name: '暴雨', icon: '⛈️' },
    snowstorm: { name: '暴雪', icon: '❄️' },
    drought: { name: '干旱', icon: '🏜️' },
    wildfire: { name: '森林火灾', icon: '🔥' },
    heatwave: { name: '高温', icon: '🥵' },
    coldwave: { name: '寒潮', icon: '🥶' }
  };

  const LEVEL_MAP = {
    normal: { name: '一般', cls: 'level-normal' },
    severe: { name: '较重', cls: 'level-severe' },
    serious: { name: '严重', cls: 'level-serious' },
    catastrophic: { name: '特别重大', cls: 'level-catastrophic' }
  };

  const STATUS_MAP = {
    warning: { name: '预警', cls: 'status-warning' },
    ongoing: { name: '发生', cls: 'status-ongoing' },
    rescue: { name: '救援中', cls: 'status-rescue' },
    ended: { name: '已结束', cls: 'status-ended' }
  };

  const WEATHER_SAMPLES = [
    { city: '北京市', temp: [25, 36], icon: ['☀️', '⛅', '🌤️', '☁️'], desc: ['晴', '晴转多云', '多云', '多云转晴'], humidity: [35, 70], wind: ['西北风 2级', '北风 3级', '东南风 2级', '南风 4级'], aqi: [40, 120], feels: [26, 40] },
    { city: '上海市', temp: [27, 38], icon: ['🌧️', '⛈️', '☀️', '🌤️'], desc: ['阵雨', '雷阵雨', '晴', '多云'], humidity: [55, 85], wind: ['东风 3级', '东南风 4级', '南风 3级', '西南风 2级'], aqi: [50, 140], feels: [28, 42] },
    { city: '广州市', temp: [28, 37], icon: ['🌦️', '⛈️', '☀️', '🌤️'], desc: ['雷阵雨', '中雨', '晴', '多云'], humidity: [65, 92], wind: ['南风 3级', '东南风 3级', '西南风 2级', '东风 2级'], aqi: [35, 95], feels: [30, 45] },
    { city: '成都市', temp: [22, 33], icon: ['☁️', '🌦️', '⛅', '🌧️'], desc: ['阴天', '小雨', '多云', '阵雨'], humidity: [60, 88], wind: ['北风 2级', '西北风 2级', '东风 2级', '东南风 2级'], aqi: [45, 110], feels: [23, 36] }
  ];

  const TYPE_COLORS = {
    typhoon: '#7c3aed',
    earthquake: '#dc2626',
    flood: '#0284c7',
    rainstorm: '#2563eb',
    snowstorm: '#0ea5e9',
    drought: '#d97706',
    wildfire: '#ea580c',
    heatwave: '#dc2626',
    coldwave: '#0891b2'
  };

  /* ---------- 应用状态 ---------- */
  const state = {
    data: [],
    filtered: [],
    filters: {
      type: 'all',
      province: '',
      timeRange: 'all',
      keyword: ''
    }
  };

  /* ---------- 工具函数 ---------- */
  function $(selector, ctx = document) { return ctx.querySelector(selector); }
  function $$(selector, ctx = document) { return Array.from(ctx.querySelectorAll(selector)); }

  function resolveDataPath() {
    const base = location.href.includes('file://') || location.pathname === '/' || location.pathname === '/index.html'
      ? '.' : location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname.substring(0, location.pathname.lastIndexOf('/'));
    return base + '/data/data.json';
  }

  function fmtNumber(n) {
    if (n == null) return '0';
    if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatDate(str) {
    if (!str) return '';
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    const pad = n => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function formatDateShort(str) {
    if (!str) return '';
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    const pad = n => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function randomBetween(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  function getAqiLevel(aqi) {
    if (aqi <= 50) return { id: 1, label: '优', color: 'var(--aqi-excellent)' };
    if (aqi <= 100) return { id: 2, label: '良', color: 'var(--aqi-good)' };
    if (aqi <= 150) return { id: 3, label: '轻度', color: 'var(--aqi-light)' };
    if (aqi <= 200) return { id: 4, label: '中度', color: 'var(--aqi-moderate)' };
    if (aqi <= 300) return { id: 5, label: '重度', color: 'var(--aqi-heavy)' };
    return { id: 6, label: '严重', color: 'var(--aqi-severe)' };
  }

  /* ---------- 主题切换 ---------- */
  function initTheme() {
    const saved = localStorage.getItem('di-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    setTheme(initial);

    $('#themeToggle').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(cur === 'light' ? 'dark' : 'light');
    });

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('di-theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('di-theme', theme);
  }

  /* ---------- 天气概览 ---------- */
  function renderWeather(animate = false) {
    const sample = WEATHER_SAMPLES[Math.floor(Math.random() * WEATHER_SAMPLES.length)];
    const s = sample;
    const temp = randomBetween(s.temp[0], s.temp[1]);
    const icon = s.icon[Math.floor(Math.random() * s.icon.length)];
    const desc = s.desc[Math.floor(Math.random() * s.desc.length)];
    const humidity = randomBetween(s.humidity[0], s.humidity[1]);
    const wind = s.wind[Math.floor(Math.random() * s.wind.length)];
    const aqi = randomBetween(s.aqi[0], s.aqi[1]);
    const feels = randomBetween(Math.max(temp, s.feels[0]), s.feels[1]);
    const aqiLvl = getAqiLevel(aqi);

    if (animate) {
      const btn = $('#weatherRefresh');
      if (btn) { btn.classList.add('spinning'); setTimeout(() => btn.classList.remove('spinning'), 900); }
    }

    const cityEl = $('#weatherCity');
    const iconEl = $('#weatherIcon');
    const tempEl = $('#weatherTemp');
    const descEl = $('#weatherDesc');
    const feelsEl = $('#weatherFeels');
    const humEl = $('#weatherHumidity');
    const windEl = $('#weatherWind');
    const aqiWrap = $('#weatherAqiWrap');
    const aqiEl = $('#weatherAqi');
    const aqiLabel = $('#weatherAqiLabel');

    if (cityEl) cityEl.textContent = s.city;
    if (iconEl) iconEl.textContent = icon;
    if (tempEl) tempEl.textContent = temp;
    if (descEl) descEl.textContent = desc;
    if (feelsEl) feelsEl.textContent = feels;
    if (humEl) humEl.textContent = humidity;
    if (windEl) windEl.textContent = wind;
    if (aqiEl) aqiEl.textContent = aqi;
    if (aqiLabel) aqiLabel.textContent = aqiLvl.label;
    if (aqiWrap) {
      aqiWrap.className = 'weather-detail-value aqi-level-' + aqiLvl.id;
    }
  }

  /* ---------- 数据加载 ---------- */
  async function loadData() {
    showState('loading');
    try {
      const path = resolveDataPath();
      const resp = await fetch(path);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const json = await resp.json();
      state.data = (json.disasters || json.data || []).slice();
      applyFilters();
    } catch (err) {
      console.error('Data load error:', err);
      $('#errorDesc').textContent = err.message || '网络异常，请检查后重试';
      showState('error');
    }
  }

  /* ---------- 4重过滤 & 排序 ---------- */
  function applyFilters() {
    const { type, province, timeRange, keyword } = state.filters;
    const now = Date.now();
    const timeMap = { '7': 7 * 864e5, '30': 30 * 864e5, '180': 180 * 864e5 };
    const timeLimit = timeMap[timeRange] || null;

    let result = state.data.filter(item => {
      if (type !== 'all' && item.disasterType !== type) return false;
      if (province && item.province !== province) return false;
      if (timeLimit) {
        const t = new Date(item.occurTime).getTime();
        if (isNaN(t) || now - t > timeLimit) return false;
      }
      if (keyword) {
        const kw = keyword.toLowerCase();
        const hay = [item.title, item.location, item.province, item.content, item.summary, item.source]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      const order = { warning: 0, ongoing: 1, rescue: 2, ended: 3 };
      const sd = order[a.status] - order[b.status];
      if (sd !== 0) return sd;
      const ta = new Date(a.occurTime).getTime();
      const tb = new Date(b.occurTime).getTime();
      return tb - ta;
    });

    state.filtered = result;
    renderDashboard();
    renderCards();
    renderSummary();
    showState(result.length ? 'ok' : 'empty');
  }

  function renderSummary() {
    const el = $('#filterSummary');
    if (!el) return;
    const f = state.filters;
    const parts = [`共匹配 <b>${state.filtered.length}</b> 条资讯`];
    if (f.type !== 'all') parts.push(`类型：<b>${DISASTER_TYPES[f.type].name}</b>`);
    if (f.province) parts.push(`地区：<b>${f.province}</b>`);
    if (f.timeRange !== 'all') parts.push(`时间：<b>${f.timeRange === '7' ? '近7天' : f.timeRange === '30' ? '近30天' : '近半年'}</b>`);
    if (f.keyword) parts.push(`关键词：<b>"${escapeHtml(f.keyword)}"</b>`);
    el.innerHTML = parts.join('　·　');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------- 统计仪表盘 ---------- */
  function renderDashboard() {
    const data = state.data;
    const filtered = state.filtered;
    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    const monthData = data.filter(d => {
      const t = new Date(d.occurTime);
      return !isNaN(t.getTime()) && (t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') === currentMonth);
    });

    const statTotal = $('#statTotal');
    const statPeople = $('#statPeople');
    const statLoss = $('#statLoss');
    const statOngoing = $('#statOngoing');
    const totalChange = $('#statTotalChange');

    if (statTotal) animateNumber(statTotal, monthData.length);
    if (totalChange) totalChange.textContent = monthData.length > 12 ? '同比 +' + Math.round((monthData.length - 12) / 12 * 100) + '%' : monthData.length < 8 ? '同比 -' + Math.round((8 - monthData.length) / 8 * 100) + '%' : '同比 持平';

    const totalAffected = filtered.reduce((s, d) => s + (d.affectedPeople || 0), 0);
    const totalLoss = filtered.reduce((s, d) => s + (d.propertyLoss || 0), 0);
    const ongoing = filtered.filter(d => d.status === 'ongoing' || d.status === 'rescue').length;

    if (statPeople) animateNumber(statPeople, totalAffected, true);
    if (statLoss) animateNumber(statLoss, totalLoss);
    if (statOngoing) animateNumber(statOngoing, ongoing);

    const typeCounts = {};
    Object.keys(DISASTER_TYPES).forEach(k => typeCounts[k] = 0);
    filtered.forEach(d => {
      if (typeCounts[d.disasterType] != null) typeCounts[d.disasterType]++;
    });
    const totalCount = Math.max(filtered.length, 1);

    const list = $('#typeProgressList');
    const totalCountEl = $('#typeTotalCount');
    if (totalCountEl) totalCountEl.textContent = filtered.length;

    if (list) {
      list.innerHTML = Object.keys(DISASTER_TYPES).map(key => {
        const count = typeCounts[key];
        const pct = Math.round(count / totalCount * 100);
        const color = TYPE_COLORS[key];
        return `
          <div class="type-progress-item">
            <div class="type-progress-top">
              <span class="type-progress-label">
                <span>${DISASTER_TYPES[key].icon}</span>
                <span>${DISASTER_TYPES[key].name}</span>
              </span>
              <span class="type-progress-count">${count}<span> 起 (${pct}%)</span></span>
            </div>
            <div class="type-progress-bar">
              <div class="type-progress-fill animated" style="width:${pct}%;background:${color};"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function animateNumber(el, target, useWan = false) {
    if (!el) return;
    const start = parseInt(String(el.textContent).replace(/[^\d]/g, '')) || 0;
    const dur = 500;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      const v = Math.round(start + (target - start) * ease);
      el.textContent = useWan ? fmtNumber(v) : v.toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- 卡片渲染 ---------- */
  function renderCards() {
    const grid = $('#cardsGrid');
    if (!grid) return;
    if (!state.filtered.length) {
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = state.filtered.map(item => buildCard(item)).join('');
    $$('.disaster-card', grid).forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id);
        openDetail(id);
      });
    });
  }

  function buildCard(d) {
    const type = DISASTER_TYPES[d.disasterType] || { name: '未知', icon: '❓' };
    const level = LEVEL_MAP[d.level] || { name: '未知', cls: '' };
    const status = STATUS_MAP[d.status] || { name: '未知', cls: '' };
    const casualties = d.casualties != null ? d.casualties : 0;
    const loss = d.propertyLoss != null ? d.propertyLoss : 0;
    return `
      <article class="disaster-card card-${d.disasterType}" data-id="${d.id}">
        <div class="card-header">
          <span class="card-type-tag">${type.icon} ${type.name}</span>
          <span class="card-level-badge ${level.cls}">${level.name}</span>
        </div>
        <h3 class="card-title">${escapeHtml(d.title)}</h3>
        <div class="card-meta">
          <div class="card-meta-item card-location">
            <span class="card-meta-icon">📍</span>
            <span class="card-meta-text">${escapeHtml(d.location)}</span>
          </div>
          <div class="card-meta-item">
            <span class="card-meta-icon">⏰</span>
            <span class="card-meta-text">${formatDateShort(d.occurTime)}</span>
          </div>
          <div class="card-meta-item">
            <span class="card-meta-icon">🏷️</span>
            <span class="card-meta-text">${escapeHtml(d.source || '官方发布')}</span>
          </div>
        </div>
        <div class="card-stats">
          <div class="card-stat">
            <span class="card-stat-value">${fmtNumber(d.affectedPeople)}</span>
            <span class="card-stat-label">影响人数</span>
          </div>
          <div class="card-stat">
            <span class="card-stat-value">${casualties}</span>
            <span class="card-stat-label">伤亡人数</span>
          </div>
          <div class="card-stat">
            <span class="card-stat-value">${loss}M</span>
            <span class="card-stat-label">财产损失</span>
          </div>
        </div>
        <div class="card-status">
          <span class="status-tag ${status.cls}">${status.name}</span>
          <span class="card-source">📡 ${escapeHtml(d.source || '官方发布')}</span>
        </div>
        <p class="card-summary">${escapeHtml(d.summary || d.content || '')}</p>
        <div class="card-footer-arrow"></div>
      </article>
    `;
  }

  /* ---------- 详情弹窗（三关闭：X按钮/遮罩点击/Esc键） ---------- */
  let modalOpen = false;

  function openDetail(id) {
    const item = state.data.find(d => d.id === id);
    if (!item) return;
    const content = $('#modalContent');
    if (content) content.innerHTML = buildDetail(item);

    const modal = $('#detailModal');
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    modalOpen = true;
    content && (content.scrollTop = 0);
  }

  function closeDetail() {
    const modal = $('#detailModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    modalOpen = false;
  }

  function buildDetail(d) {
    const type = DISASTER_TYPES[d.disasterType] || { name: '未知', icon: '❓' };
    const level = LEVEL_MAP[d.level] || { name: '未知', cls: '' };
    const status = STATUS_MAP[d.status] || { name: '未知', cls: '' };
    const affected = fmtNumber(d.affectedPeople || 0);
    const casualties = d.casualties || 0;
    const loss = d.propertyLoss || 0;
    const supplies = (d.supplies || '').split(/[、,，;；]/).filter(Boolean).slice(0, 8);
    const related = state.data
      .filter(x => x.id !== d.id && (x.disasterType === d.disasterType || x.province === d.province))
      .sort((a, b) => new Date(b.occurTime) - new Date(a.occurTime))
      .slice(0, 4);

    return `
      <div class="detail-wrapper detail-${d.disasterType}">
        <div class="detail-header">
          <div class="detail-tags">
            <span class="card-type-tag">${type.icon} ${type.name}</span>
            <span class="card-level-badge ${level.cls}">${level.name}</span>
            <span class="status-tag ${status.cls}">${status.name}</span>
          </div>
          <h2 class="detail-title">${escapeHtml(d.title)}</h2>
          <div class="detail-meta">
            <span class="detail-meta-item">
              <span class="detail-meta-icon">📍</span>
              <span>${escapeHtml(d.location)} · ${escapeHtml(d.province || '')}</span>
            </span>
            <span class="detail-meta-item">
              <span class="detail-meta-icon">⏰</span>
              <span>发生：${formatDate(d.occurTime)}</span>
            </span>
            ${d.endTime ? `<span class="detail-meta-item"><span class="detail-meta-icon">✅</span><span>结束：${formatDate(d.endTime)}</span></span>` : ''}
            <span class="detail-meta-item">
              <span class="detail-meta-icon">📡</span>
              <span>${escapeHtml(d.source || '官方发布')}</span>
            </span>
          </div>
        </div>
        <img class="detail-map" src="${d.mapImage || 'https://picsum.photos/seed/disaster' + d.id + '/800/400'}" alt="灾区地图" loading="lazy" onerror="this.src='https://picsum.photos/seed/defaultmap/800/400'">
        <div class="detail-body">
          <section class="detail-section">
            <h3 class="detail-section-title">📰 资讯正文</h3>
            <p class="detail-content-text">${escapeHtml(d.content || d.summary || '')}</p>
          </section>

          <section class="detail-section">
            <h3 class="detail-section-title">📊 灾情统计</h3>
            <div class="detail-grid">
              <div class="detail-grid-item">
                <span class="detail-grid-label">👥 影响人数</span>
                <span class="detail-grid-value">${affected} 人</span>
              </div>
              <div class="detail-grid-item">
                <span class="detail-grid-label">🩹 伤亡情况</span>
                <span class="detail-grid-value">遇难 ${casualties} 人</span>
              </div>
              <div class="detail-grid-item">
                <span class="detail-grid-label">💰 财产损失</span>
                <span class="detail-grid-value">约 ${loss} 百万元（${(loss/100).toFixed(1)}亿元）</span>
              </div>
              <div class="detail-grid-item">
                <span class="detail-grid-label">🚒 救援力量</span>
                <span class="detail-grid-value">${escapeHtml(d.rescueForces || '专业救援力量已到位')}</span>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <h3 class="detail-section-title">🎁 物资需求</h3>
            ${supplies.length ? `<ul class="detail-list">${supplies.map(s => `<li>${escapeHtml(s.trim())}</li>`).join('')}</ul>` : '<p style="color:var(--color-text-muted);font-size:14px;">暂无物资需求信息</p>'}
          </section>

          ${d.aidUrl ? `<section class="detail-section">
            <h3 class="detail-section-title">🤝 参与援助</h3>
            <a href="${escapeHtml(d.aidUrl)}" target="_blank" rel="noopener noreferrer" class="aid-link">
              🎗️ 前往官方援助通道
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </section>` : ''}

          ${related.length ? `<section class="detail-section">
            <h3 class="detail-section-title">🔗 相关新闻</h3>
            <div class="related-news">
              ${related.map(r => `
                <div class="related-news-item" data-related-id="${r.id}" style="cursor:pointer;">
                  <span class="related-news-title">${DISASTER_TYPES[r.disasterType]?.icon || '📌'} ${escapeHtml(r.title)}</span>
                  <span class="related-news-date">${formatDateShort(r.occurTime)}</span>
                </div>
              `).join('')}
            </div>
          </section>` : ''}
        </div>
      </div>
    `;
  }

  function bindDetailEvents() {
    $('#modalClose').addEventListener('click', closeDetail);
    $('#modalMask').addEventListener('click', closeDetail);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modalOpen) closeDetail();
    });
    document.addEventListener('click', e => {
      const rel = e.target.closest('[data-related-id]');
      if (rel && modalOpen) {
        const id = parseInt(rel.dataset.relatedId);
        if (id) openDetail(id);
      }
    });
  }

  /* ---------- 状态切换 ---------- */
  function showState(s) {
    $('#loadingState').style.display = s === 'loading' ? 'flex' : 'none';
    $('#emptyState').style.display = s === 'empty' ? 'flex' : 'none';
    $('#errorState').style.display = s === 'error' ? 'flex' : 'none';
    $('#cardsGrid').style.display = s === 'ok' ? 'grid' : 'none';
  }

  /* ---------- 回到顶部 ---------- */
  function initBackToTop() {
    const btn = $('#backToTop');
    if (!btn) return;
    const onScroll = () => {
      if (window.scrollY > 480) btn.classList.add('visible');
      else btn.classList.remove('visible');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    onScroll();
  }

  /* ---------- 筛选器绑定 ---------- */
  function bindFilters() {
    $$('#disasterTabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#disasterTabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filters.type = btn.dataset.type || 'all';
        applyFilters();
      });
    });

    $('#provinceSelect').addEventListener('change', e => {
      state.filters.province = e.target.value;
      applyFilters();
    });

    $('#timeRange').addEventListener('change', e => {
      state.filters.timeRange = e.target.value;
      applyFilters();
    });

    const doSearch = debounce(val => {
      state.filters.keyword = val.trim();
      applyFilters();
    }, 300);
    $('#searchInput').addEventListener('input', e => doSearch(e.target.value));

    $('#clearFiltersBtn').addEventListener('click', () => {
      state.filters = { type: 'all', province: '', timeRange: 'all', keyword: '' };
      $$('#disasterTabs .tab-btn').forEach(b => {
        b.classList.toggle('active', (b.dataset.type || 'all') === 'all');
      });
      $('#provinceSelect').value = '';
      $('#timeRange').value = 'all';
      $('#searchInput').value = '';
      applyFilters();
    });

    $('#retryBtn').addEventListener('click', loadData);
  }

  /* ---------- 时间显示 ---------- */
  function updateClock() {
    const el = $('#currentTime');
    if (!el) return;
    const d = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const w = ['日', '一', '二', '三', '四', '五', '六'];
    el.textContent = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 周${w[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /* ---------- 初始化 ---------- */
  function init() {
    initTheme();
    renderWeather();
    updateClock();
    setInterval(updateClock, 30000);

    $('#weatherRefresh').addEventListener('click', () => renderWeather(true));

    bindFilters();
    bindDetailEvents();
    initBackToTop();

    loadData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
