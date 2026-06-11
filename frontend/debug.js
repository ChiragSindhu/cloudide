lucide.createIcons();

// ── Theme ───────────────────────────────────────────────
const html = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
const themeIcon = document.getElementById('themeIcon');

function applyTheme(t) {
    html.setAttribute('data-theme', t);
    localStorage.setItem('ide-theme', t);
    themeIcon.setAttribute('data-lucide', t === 'dark' ? 'sun' : 'moon');
    lucide.createIcons();
}
applyTheme(localStorage.getItem('ide-theme') || 'light');
themeBtn.addEventListener('click', () => {
    applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

// ── Metrics ─────────────────────────────────────────────
const mEls = {
    total: document.getElementById('mTotal'),
    active: document.getElementById('mActive'),
    completed: document.getElementById('mCompleted'),
    failed: document.getElementById('mFailed'),
    timeouts: document.getElementById('mTimeouts'),
    pending: document.getElementById('mPending'),
};

function animateCount(el, to) {
    const from = parseInt(el.textContent) || 0;
    if (from === to) return;
    const steps = 12;
    const step = (to - from) / steps;
    let cur = from, s = 0;
    const t = setInterval(() => {
        s++;
        cur += step;
        el.textContent = s >= steps ? to : Math.round(cur);
        if (s >= steps) clearInterval(t);
    }, 200 / steps);
}

function setMetrics(m) {
    animateCount(mEls.total, m.total || 0);
    animateCount(mEls.active, m.active || 0);
    animateCount(mEls.completed, m.completed || 0);
    animateCount(mEls.failed, m.failed || 0);
    animateCount(mEls.timeouts, m.timeouts || 0);
    animateCount(mEls.pending, m.pending || 0);
}

// ── Active executions ────────────────────────────────────
const execList = document.getElementById('execList');
const execEmpty = document.getElementById('execEmpty');
const activeCount = document.getElementById('activeCount');

function renderExecs(execs) {
    activeCount.textContent = execs.length;
    if (!execs.length) {
        execList.innerHTML = '';
        execList.appendChild(execEmpty);
        execEmpty.style.display = 'flex';
        return;
    }
    execEmpty.style.display = 'none';
    // keep existing rows, update or add
    const existing = new Set([...execList.querySelectorAll('.exec-row')].map(r => r.dataset.id));
    const incoming = new Set(execs.map(e => e.execution_id));

    // remove stale
    existing.forEach(id => {
        if (!incoming.has(id)) {
            const r = execList.querySelector(`[data-id="${id}"]`);
            if (r) r.remove();
        }
    });

    execs.forEach(exec => {
        const elapsed = Math.floor((Date.now() - new Date(exec.created_at).getTime()) / 1000);
        const elapsedStr = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

        let row = execList.querySelector(`[data-id="${exec.execution_id}"]`);
        if (!row) {
            row = document.createElement('div');
            row.className = 'exec-row';
            row.dataset.id = exec.execution_id;
            execList.appendChild(row);
        }

        row.innerHTML = `
        <div class="exec-left">
          <div class="exec-id">${esc(exec.execution_id)}</div>
          <div class="exec-meta">${new Date(exec.created_at).toLocaleTimeString('en-US', { hour12: false })} &nbsp;·&nbsp; ${elapsedStr} elapsed</div>
        </div>
        <div class="exec-right">
          <span class="exec-status">${esc(exec.status)}</span>
          <div class="prog-track"><div class="prog-bar"></div></div>
        </div>`;
    });
}

// ── Event stream ─────────────────────────────────────────
const stream = document.getElementById('eventStream');
const eventEmpty = document.getElementById('eventEmpty');
const eventCount = document.getElementById('eventCount');
let eventTotal = 0;
const MAX_EVENTS = 200;

document.getElementById('clearBtn').addEventListener('click', () => {
    stream.innerHTML = '';
    stream.appendChild(eventEmpty);
    eventEmpty.style.display = 'flex';
    eventTotal = 0;
    eventCount.textContent = '0';
});

// event type → { icon, colorClass }
const EVENT_CONFIG = {
    execution_started: { icon: 'play', cls: 'started' },
    execution_completed: { icon: 'check', cls: 'completed' },
    execution_failed: { icon: 'x', cls: 'failed' },
    execution_error: { icon: 'x', cls: 'failed' },
    execution_timeout: { icon: 'clock', cls: 'timeout' },
    execution_created: { icon: 'plus', cls: 'started' },
    execution_pending: { icon: 'minus', cls: 'pending' },
    container_started: { icon: 'box', cls: 'container' },
    container_stopped: { icon: 'square', cls: 'container' },
    error: { icon: 'alert-triangle', cls: 'failed' },
    warning: { icon: 'alert-circle', cls: 'timeout' },
    info: { icon: 'info', cls: 'started' },
};

function formatType(t) {
    return t.replace(/_/g, ' ');
}

function addEvent(ev, prepend = true) {
    eventEmpty.style.display = 'none';

    eventTotal++;
    if (eventTotal > MAX_EVENTS) {
        const last = stream.lastElementChild;
        if (last && last !== eventEmpty) last.remove();
    }
    eventCount.textContent = Math.min(eventTotal, MAX_EVENTS);

    const cfg = EVENT_CONFIG[ev.type] || { icon: 'circle', cls: 'default' };
    const time = new Date(ev.timestamp || Date.now()).toLocaleTimeString('en-US', { hour12: false });

    // payload
    let payloadHtml = '';
    if (ev.data) {
        let pretty;
        try {
            pretty = JSON.stringify(typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data, null, 2);
        } catch {
            pretty = String(ev.data);
        }
        const pid = 'p' + Math.random().toString(36).slice(2, 8);
        payloadHtml = `
        <pre class="ev-payload-content" id="${pid}">${esc(pretty)}</pre>
        <button class="ev-payload-toggle" onclick="togglePayload('${pid}',this)">
          <i data-lucide="chevron-right" class="chevron-icon" style="width:10px;height:10px"></i>
          payload
        </button>`;
    }

    const row = document.createElement('div');
    row.className = 'event-row';
    row.innerHTML = `
      <span class="ev-time">${time}</span>
      <span class="ev-icon"><i data-lucide="${cfg.icon}" style="width:12px;height:12px;color:var(--text-3)"></i></span>
      <span class="ev-type ${cfg.cls}">${formatType(ev.type)}</span>
      <div class="ev-body">
        ${ev.execution_id ? `<div class="ev-id">${esc(ev.execution_id)}</div>` : ''}
        ${payloadHtml}
      </div>`;

    if (prepend) {
        stream.insertAdjacentElement('afterbegin', row);
    } else {
        stream.appendChild(row);
    }

    lucide.createIcons();
}

window.togglePayload = function (id, btn) {
    const pre = document.getElementById(id);
    if (!pre) return;
    pre.classList.toggle('open');
    const icon = btn.querySelector('.chevron-icon');
    if (icon) {
        icon.style.transform = pre.classList.contains('open') ? 'rotate(90deg)' : '';
    }
};

// ── WebSocket ─────────────────────────────────────────────
const wsDot = document.getElementById('wsDot');
const wsLabel = document.getElementById('wsLabel');
let ws = null;
let reconnAttempts = 0;
const MAX_RECONN = 5;

function wsConnect() {
    setWsState('connecting');
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${location.host}/ws/debug`);

    ws.onopen = () => { setWsState('connected'); reconnAttempts = 0; };

    ws.onmessage = ({ data }) => {
        try {
            const msg = JSON.parse(data);
            if (msg.type === 'metrics_update') {
                setMetrics(msg.data);
            } else if (msg.type === 'events_history') {
                (msg.data || []).forEach(e => addEvent(e, false));
            } else {
                addEvent(msg, true);
            }
        } catch (e) { /* ignore */ }
    };

    ws.onerror = () => setWsState('disconnected');
    ws.onclose = () => {
        setWsState('disconnected');
        if (reconnAttempts < MAX_RECONN) {
            reconnAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnAttempts), 10000);
            wsLabel.textContent = `Retry in ${delay / 1000}s`;
            setTimeout(wsConnect, delay);
        }
    };
}

function setWsState(s) {
    wsDot.setAttribute('data-state', s);
    wsLabel.textContent = s === 'connected' ? 'Live' : s === 'disconnected' ? 'Offline' : 'Connecting';
}

wsConnect();

// ── Metrics polling ───────────────────────────────────────
async function fetchMetrics() {
    try {
        const r = await fetch('/api/metrics');
        if (!r.ok) return;
        const d = await r.json();
        if (d.metrics) setMetrics(d.metrics);
        if (d.active_executions) renderExecs(d.active_executions);
    } catch (e) { /* silent */ }
}

fetchMetrics();
setInterval(fetchMetrics, 2000);

// ── Demo events for preview ───────────────────────────────
// Remove this block when connected to real backend
const demoEvents = [
    { type: 'execution_completed', execution_id: 'exec_9f3a2b1c', timestamp: new Date().toISOString(), data: { exit_code: 0, duration: 0.412 } },
    { type: 'execution_started', execution_id: 'exec_9f3a2b1c', timestamp: new Date(Date.now() - 1200).toISOString() },
    { type: 'execution_created', execution_id: 'exec_9f3a2b1c', timestamp: new Date(Date.now() - 1800).toISOString() },
    { type: 'execution_failed', execution_id: 'exec_8e1c4d7a', timestamp: new Date(Date.now() - 4000).toISOString(), data: { error: 'SyntaxError: invalid syntax', exit_code: 1 } },
    { type: 'execution_timeout', execution_id: 'exec_7b2d5e9f', timestamp: new Date(Date.now() - 9000).toISOString() },
    { type: 'container_started', execution_id: 'exec_9f3a2b1c', timestamp: new Date(Date.now() - 1500).toISOString(), data: { container_id: 'a1b2c3d4e5f6' } },
];

// Simulate arriving newest-first
demoEvents.forEach((e, i) => {
    setTimeout(() => addEvent(e, true), i * 80);
});

setMetrics({ total: 42, active: 1, completed: 38, failed: 2, timeouts: 1, pending: 0 });
renderExecs([{
    execution_id: 'exec_9f3a2b1c4d5e6f7a8b9c0d1e',
    status: 'RUNNING',
    created_at: new Date(Date.now() - 3200).toISOString(),
}]);

// ── Helpers ───────────────────────────────────────────────
function esc(s) {
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
}