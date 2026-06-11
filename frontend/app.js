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

// ── Tabs ────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
});

// ── Line numbers ─────────────────────────────────────────
const editor = document.getElementById('codeEditor');
const lineNumbers = document.getElementById('lineNumbers');
const cursorPos = document.getElementById('cursorPos');

function updateLineNumbers() {
    const lines = editor.value.split('\n');
    const count = lines.length;
    const curLine = editor.value.substr(0, editor.selectionStart).split('\n').length;

    let html = '';
    for (let i = 1; i <= count; i++) {
        html += `<span class="line-number${i === curLine ? ' current' : ''}">${i}</span>`;
    }
    lineNumbers.innerHTML = html;

    // Sync scroll
    lineNumbers.scrollTop = editor.scrollTop;
}

function updateCursor() {
    const text = editor.value.substr(0, editor.selectionStart);
    const lines = text.split('\n');
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;
    cursorPos.textContent = `Ln ${ln}, Col ${col}`;
    updateLineNumbers();
}

editor.addEventListener('input', updateLineNumbers);
editor.addEventListener('keyup', updateCursor);
editor.addEventListener('click', updateCursor);
editor.addEventListener('scroll', () => { lineNumbers.scrollTop = editor.scrollTop; });

// Tab key inserts spaces
editor.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const s = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, s) + '    ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = s + 4;
        updateLineNumbers();
    }
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        runCode();
    }
});

// ── Clear ───────────────────────────────────────────────
document.getElementById('clearBtn').addEventListener('click', () => {
    editor.value = '';
    updateLineNumbers();
    editor.focus();
});

// ── Sample code ─────────────────────────────────────────
editor.value = `# Welcome to Cloud IDE
# Press Ctrl+Enter or click Run to execute

def fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

squares = [x**2 for x in range(1, 11)]
person = {"name": "Alice", "age": 30, "lang": "Python"}

print("Hello, Cloud IDE!")
print(f"Squares 1–10: {squares}")
print(f"Fibonacci(10): {fibonacci(10)}")
print(f"Person: {person}")
`;
updateLineNumbers();


// ── Status helpers ───────────────────────────────────────
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

function setStatus(state, text) {
    statusDot.setAttribute('data-state', state);
    statusText.textContent = text;
}

// ── Run code ─────────────────────────────────────────────
const runBtn = document.getElementById('runBtn');
const stdout = document.getElementById('stdout');
const stderr = document.getElementById('stderr');
const logsEmpty = document.getElementById('logsEmpty');
const logsContainer = document.getElementById('logsContainer');

let pollTimer = null;
let currentId = null;

document.getElementById('runBtn').addEventListener('click', runCode);

async function runCode() {
    const code = editor.value.trim();
    if (!code) return;

    clearResults();
    setStatus('running', 'Executing…');
    runBtn.disabled = true;
    editor.disabled = true;

    const lang = document.getElementById('langSelect').value;
    const t0 = Date.now();

    try {
        const res = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language: lang })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        currentId = data.execution_id;

        document.getElementById('infoId').textContent = currentId;
        document.getElementById('infoId').classList.remove('muted');
        document.getElementById('infoLang').textContent = lang;
        document.getElementById('infoLang').classList.remove('muted');

        pollTimer = setInterval(pollStatus, 500);

    } catch (err) {
        setStatus('error', 'Request failed');
        showStderr(`Failed to submit: ${err.message}`);
        runBtn.disabled = false;
        editor.disabled = false;
    }
}

async function pollStatus() {
    if (!currentId) return;
    const t0 = Date.now();

    try {
        const res = await fetch(`/api/execution/${currentId}`);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        applyResult(data);

        const terminal = ['SUCCESS', 'ERROR', 'TIMEOUT', 'MEMORY_LIMIT_EXCEEDED'];
        if (terminal.includes(data.status)) {
            clearInterval(pollTimer);
            runBtn.disabled = false;
            editor.disabled = false;
            fetchLogs();
        }
    } catch (err) {
        console.warn('Poll error:', err);
    }
}

function applyResult(data) {
    // Status
    const statusMap = {
        SUCCESS: ['success', 'Finished'],
        RUNNING: ['running', 'Running…'],
        PENDING: ['running', 'Queued…'],
        ERROR: ['error', 'Error'],
        TIMEOUT: ['error', 'Timed out'],
        MEMORY_LIMIT_EXCEEDED: ['error', 'Out of memory'],
    };
    const [state, label] = statusMap[data.status] || ['ready', data.status];
    setStatus(state, label);

    // Stdout
    if (data.stdout) {
        stdout.textContent = data.stdout;
        stdout.classList.remove('empty');
        stdout.classList.add('has-content');
    }

    // Stderr
    if (data.stderr) {
        stderr.textContent = data.stderr;
        stderr.classList.remove('empty');
        stderr.classList.add('has-content');
    }

    // Info
    const infoStatus = document.getElementById('infoStatus');
    infoStatus.textContent = data.status;
    infoStatus.className = 'info-val ' + (data.status === 'SUCCESS' ? 'success' : data.status === 'RUNNING' || data.status === 'PENDING' ? '' : 'error');

    if (data.duration != null) {
        const d = `${data.duration.toFixed(3)}s`;
        document.getElementById('infoDuration').textContent = d;
        document.getElementById('infoDuration').classList.remove('muted');
    }

    if (data.exit_code != null && data.exit_code !== -1) {
        const ec = String(data.exit_code);
        document.getElementById('infoExit').textContent = ec;
        document.getElementById('infoExit').className = 'info-val ' + (ec === '0' ? 'success' : 'error');
    }

    if (data.created_at) {
        document.getElementById('infoCreated').textContent = new Date(data.created_at).toLocaleTimeString();
        document.getElementById('infoCreated').classList.remove('muted');
    }

    if (data.completed_at) {
        document.getElementById('infoCompleted').textContent = new Date(data.completed_at).toLocaleTimeString();
        document.getElementById('infoCompleted').classList.remove('muted');
    }

    if (data.container_id) {
        document.getElementById('infoContainer').textContent = data.container_id.slice(0, 12);
        document.getElementById('infoContainer').classList.remove('muted');
    }
}

async function fetchLogs() {
    if (!currentId) return;
    const t0 = Date.now();

    try {
        const res = await fetch(`/api/execution/${currentId}/logs`);

        if (!res.ok) return;
        const data = await res.json();
        renderLogs(data.logs || []);
    } catch (e) { /* silent */ }
}

function renderLogs(logs) {
    if (!logs.length) return;
    logsEmpty.hidden = true;
    logsContainer.innerHTML = '';
    logs.forEach((log, i) => {
        const row = document.createElement('div');
        row.className = 'log-row';
        row.style.animationDelay = `${i * 30}ms`;
        row.style.opacity = '0';

        const time = new Date(log.timestamp || log.time || Date.now()).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const type = (log.type || log.level || 'INFO').toUpperCase();
        const msg = escHtml(log.message || log.msg || '');

        row.innerHTML = `<span class="log-time">${time}</span><span class="log-type-tag ${type}">${type}</span><span class="log-msg">${msg}</span>`;
        logsContainer.appendChild(row);

        // Trigger animation
        requestAnimationFrame(() => { row.style.opacity = ''; });
    });
}

function clearResults() {
    stdout.textContent = 'Running…';
    stdout.className = 'output-pre empty';
    stderr.textContent = '';
    stderr.className = 'output-pre stderr-pre empty';
    logsEmpty.hidden = false;
    logsContainer.innerHTML = '';

    ['infoId', 'infoStatus', 'infoDuration', 'infoExit', 'infoLang', 'infoCreated', 'infoCompleted', 'infoContainer'].forEach(id => {
        const el = document.getElementById(id);
        el.textContent = '—';
        el.className = 'info-val muted';
    });
}

function showStderr(msg) {
    stderr.textContent = msg;
    stderr.classList.remove('empty');
}

function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Initial line count
updateLineNumbers();