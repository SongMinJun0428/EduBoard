// ===== Supabase =====
const SUPABASE_URL = "https://ucmzrkwrsezfdjnnwsww.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbXpya3dyc2V6ZmRqbm53c3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDIzODcsImV4cCI6MjA2ODQxODM4N30.rvLItmDStjWb3GfECnCXocHvj-CMTfHfD1CHsAHOLaw";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const USE_SUPABASE_RESET_EMAIL = true;

// ===== Utils =====
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
let toastTimer; function toast(m) { clearTimeout(toastTimer); const t = $('#toast'); t.textContent = m; t.classList.add('show'); toastTimer = setTimeout(() => t.classList.remove('show'), 1800); }
const roleBadge = r => `<span class="badge ${({ admin: 'role-admin', teacher: 'role-teacher', class_admin: 'role-class_admin', student: 'role-student', user: 'role-user' })[r] || 'role-user'}">${r || '-'}</span>`;
const chunked = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n)o.push(a.slice(i, i + n)); return o; }
const randTemp = () => 'temp-' + Math.random().toString(36).slice(2, 10);

// ===== Theme/Auth =====
(async () => { const { data: { user } } = await sb.auth.getUser(); $('#me').textContent = user?.email || ''; })();
const root = document.documentElement; (localStorage.getItem('theme') === 'dark') && root.classList.add('dark');
$('#theme').onclick = () => { root.classList.toggle('dark'); localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light'); };
$('#signout').onclick = async () => { await sb.auth.signOut(); location.href = './index.html'; };

// ===== State =====
let all = [], view = [], page = 1, pageSize = 50, sortKey = 'grade', sortDir = 'asc';

// ===== Load & Stats =====
async function loadUsers() {
    let q = sb.from('users').select('username,name,grade,class_num,student_number,role,email,level,xp,coin_balance').limit(5000);
    const g = $('#f-grade').value, c = $('#f-class').value, r = $('#f-role').value;
    if (g) q = q.eq('grade', Number(g)); if (c) q = q.eq('class_num', Number(c)); if (r) q = q.eq('role', r);
    const { data, error } = await q; if (error) { console.error(error); return toast('사용자 로드 실패'); }
    all = data || [];
    apply();
    renderStats();
}
function renderStats() {
    const total = all.length;
    const byRole = all.reduce((m, u) => (m[u.role] = (m[u.role] || 0) + 1, m), {});
    const classes = new Set(all.filter(u => u.grade && u.class_num).map(u => `${u.grade}-${u.class_num}`)).size;
    const grades = all.map(u => u.grade).filter(Boolean);
    const avg = grades.length ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : '-';
    $('#stat-total').textContent = total.toLocaleString();
    $('#stat-student').textContent = (byRole.student || 0).toLocaleString();
    $('#stat-teacher').textContent = (byRole.teacher || 0).toLocaleString();
    $('#stat-admin').textContent = (byRole.admin || 0).toLocaleString();
    $('#stat-classes').textContent = classes.toLocaleString();
    $('#stat-avg-grade').textContent = avg;
}

// ===== Filter / Sort / Paging =====
function apply() {
    const kw = $('#search').value.trim().toLowerCase();
    view = all.filter(u => {
        if (!kw) return true;
        return (u.name || '').toLowerCase().includes(kw)
            || String(u.student_number || '').includes(kw)
            || (u.username || '').toLowerCase().includes(kw);
    });
    const cmp = (a, b) => (a < b ? -1 : (a > b ? 1 : 0));
    view.sort((a, b) => {
        let r = (sortDir === 'asc' ? 1 : -1) * cmp(a[sortKey] ?? '', b[sortKey] ?? '');
        if (r !== 0) return r;
        for (const k of ['grade', 'class_num', 'student_number', 'name']) { if (k === sortKey) continue; const t = cmp(a[k] ?? '', b[k] ?? ''); if (t !== 0) return t; }
        return 0;
    });
    pageSize = Number($('#page-size').value || 50);
    const total = view.length, pages = Math.max(1, Math.ceil(total / pageSize)); if (page > pages) page = pages;
    render(view.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize));
    $('#page-info').textContent = `총 ${total.toLocaleString()}명 · ${page}/${pages}페이지`;
    $('#empty').classList.toggle('hidden', total > 0);
    updateSelectionUI();
}
function render(list) {
    const tb = $('#rows'); tb.innerHTML = '';
    for (const u of list) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="text-center"><input type="checkbox" class="row-check" data-username="${u.username}"></td>
          <td class="font-medium">${u.name ?? '-'}</td>
          <td class="text-center">${u.grade ?? '-'}</td>
          <td class="text-center">${u.class_num ?? '-'}</td>
          <td class="text-center">${u.student_number ?? '-'}</td>
          <td>
            <div class="flex items-center gap-2">
              <span>${roleBadge(u.role)}</span>
              <select class="rounded border px-2 py-1 text-xs dark:bg-gray-900" data-role="${u.username}">
                ${['admin', 'teacher', 'class_admin', 'student', 'user'].map(r => `<option ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>
          </td>
          <td class="text-center">${u.level ?? '-'}</td>
          <td class="text-center">${u.xp ?? '-'}</td>
          <td class="text-center">${u.coin_balance ?? '-'}</td>
          <td class="text-center">
            <button class="btn text-xs" data-menu="${u.username}">⋯</button>
          </td>`;
        tb.appendChild(tr);
    }
}

// ===== Actions =====
async function updateRole(username, role) {
    const { error } = await sb.from('users').update({ role }).eq('username', username);
    if (error) { console.error(error); return toast('권한 저장 실패'); }
    toast('권한 저장 완료'); logAction('role_update', { target: username, role });
}
async function deleteUser(username) {
    if (!confirm(`${username} 계정을 삭제할까요?`)) return;
    const { error } = await sb.from('users').delete().eq('username', username);
    if (error) { console.error(error); return toast('삭제 실패'); }
    toast('삭제 완료'); logAction('user_delete', { target: username }); loadUsers();
}
async function addUser() {
    const p = {
        username: $('#add-username').value.trim(),
        name: $('#add-name').value.trim(),
        email: $('#add-email').value.trim() || null,
        grade: Number($('#add-grade').value || 0) || null,
        class_num: Number($('#add-class').value || 0) || null,
        student_number: Number($('#add-number').value || 0) || null,
        role: $('#add-role').value


    };
    const pw = $('#add-password').value.trim(); if (pw) p.password = pw;
    if (!p.username || !p.name) return toast('아이디와 이름은 필수');
    const { error } = await sb.from('users').insert(p);
    if (error) { console.error(error); return toast('추가 실패'); }
    toast('추가 완료'); logAction('user_create', p);
    closeModal('#modal-add');
    ['#add-username', '#add-name', '#add-email', '#add-grade', '#add-class', '#add-number', '#add-password'].forEach(s => $(s).value = ''); $('#add-role').value = 'student';
    loadUsers();
}
async function bulkApplyRole() {
    const role = $('#bulk-role').value; if (!role) return toast('일괄 권한을 선택하세요');
    const ids = [...$$('.row-check:checked')].map(i => i.dataset.username); if (!ids.length) return;
    const { error } = await sb.from('users').update({ role }).in('username', ids);
    if (error) { console.error(error); return toast('일괄 변경 실패'); }
    toast(`일괄 변경 완료 (${ids.length}명)`); logAction('role_bulk_update', { targets: ids, role }); loadUsers();
}
async function promote() {
    if (!confirm('신학기 자동 승급(1→2, 2→3)을 실행할까요?')) return;
    const { error } = await sb.rpc('promote_students_safe', {}); // 있으면 사용
    if (!error) { toast('승급 완료'); logAction('promote', { via: 'rpc' }); return loadUsers(); }
    const { data, error: e2 } = await sb.from('users').select('username,grade').eq('role', 'student').limit(5000);
    if (e2) { console.error(e2); return toast('승급 실패'); }
    const ups = data.map(u => ({ username: u.username, grade: (u.grade >= 1 && u.grade <= 2) ? u.grade + 1 : u.grade }));
    for (const c of chunked(ups, 200)) { const { error: e3 } = await sb.from('users').upsert(c); if (e3) console.error(e3); }
    toast('승급 완료'); logAction('promote', { count: ups.length }); loadUsers();
}
async function resetByUsername(username) {
    const { data, error } = await sb.from('users').select('email').eq('username', username).maybeSingle();
    if (error || !data?.email) return toast('이메일이 없습니다');
    if (USE_SUPABASE_RESET_EMAIL) {
        const { error: e2 } = await sb.auth.resetPasswordForEmail(data.email, { redirectTo: location.origin + '/reset.html' });
        if (e2) { console.error(e2); return toast('메일 전송 실패'); }
        toast('재설정 메일 전송'); logAction('password_reset_email', { target: username });
    } else {
        const temp = randTemp(); const { error: e3 } = await sb.from('users').update({ password: temp }).eq('username', username);
        if (e3) { console.error(e3); return toast('임시 비번 실패'); }
        toast(`임시 비번: ${temp}`); logAction('password_temp_set', { target: username });
    }
}

// ===== Logs (optional) =====
async function logAction(action, details = {}) {
    try {
        const { data: { user } } = await sb.auth.getUser();

        const payload = {
            user_id: user?.id || null,
            username: user?.user_metadata?.username || null,
            email: user?.email || null,
            action,
            target: details?.target || null,
            target_type: details?.target_type || null,
            details,
            ip_address: await getIP(),               // IP 가져오기
            user_agent: navigator.userAgent || null
        };

        await sb.from('user_activity_logs').insert(payload);
    } catch (e) {
        console.error('logAction 오류', e);
    }
}

async function getIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const json = await res.json();
        return json.ip || null;
    } catch {
        return null;
    }
}

async function loadLogs() {
    try {
        const { data, error } = await sb
            .from('user_activity_logs')
            .select('action, username, email, target, target_type, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

        const ul = $('#log-list');
        ul.innerHTML = '';

        if (error || !data?.length) {
            $('#log-empty').classList.remove('hidden');
            return;
        }

        $('#log-empty').classList.add('hidden');

        for (const r of data) {
            const when = new Date(r.created_at).toLocaleString();
            const li = document.createElement('li');
            li.innerHTML = `
            <div class="p-2 rounded border dark:border-gray-700">
              <div class="text-xs text-gray-500">${when}</div>
              <div class="text-sm">
                <b>${r.username || r.email || '-'}</b>
                → <span class="font-mono">${r.target || '-'}</span>
                <span class="ml-1 text-xs text-gray-400">${r.target_type || ''}</span>
              </div>
              <div class="text-xs text-blue-600 dark:text-blue-400">${r.action}</div>
            </div>`;
            ul.appendChild(li);
        }
    } catch (e) {
        console.error('loadLogs 오류', e);
        $('#log-empty').classList.remove('hidden');
    }
}

// ===== CSV =====
function toCSV(rows) {
    const esc = v => ('"' + String(v ?? '').replace(/"/g, '""') + '"');
    const head = ['username', 'name', 'grade', 'class_num', 'student_number', 'role', 'email'];
    return [head.join(',')].concat(rows.map(r => [r.username, r.name, r.grade, r.class_num, r.student_number, r.role, r.email].map(esc).join(','))).join('\n');
}
function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); }
function parseCSV(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter(Boolean); const header = lines.shift().split(',').map(h => h.trim());
    return lines.map(line => {
        const cols = splitCSV(line); const o = {}; header.forEach((h, i) => o[h] = cols[i]);
        if (o.grade) o.grade = Number(o.grade); if (o.class_num) o.class_num = Number(o.class_num); if (o.student_number) o.student_number = Number(o.student_number); return o;
    });
}
function splitCSV(line) {
    const out = []; let cur = '', inq = false; for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inq = !inq; } else if (ch === ',' && !inq) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur); return out.map(s => s.trim());
}

// ===== UI helpers & Events =====
function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }
function togglePopover(el) { el.classList.toggle('open'); }
function updateSelectionUI() {
    const cnt = [...$$('.row-check:checked')].length;
    $('#sel-count').textContent = cnt; $('#bulk-drawer').classList.toggle('hidden', cnt === 0);
    $('#check-all').checked = !!cnt && [...$$('.row-check')].every(i => i.checked);
}

// 필터/검색/페이징
$('#f-grade').onchange = () => { page = 1; loadUsers(); };
$('#f-class').onchange = () => { page = 1; loadUsers(); };
$('#f-role').onchange = () => { page = 1; loadUsers(); };
$('#search').oninput = () => { page = 1; apply(); };
$('#page-size').onchange = () => { page = 1; apply(); };
$('#prev').onclick = () => { if (page > 1) { page--; apply(); } };
$('#next').onclick = () => { const pages = Math.max(1, Math.ceil(view.length / pageSize)); if (page < pages) { page++; apply(); } };

// ✅ 행 작업: 전역 컨텍스트 메뉴(포털)
let ctxUser = null;
function openCtx(btn, username) {
    ctxUser = username;
    const el = document.getElementById('ctx');
    el.style.left = '0px'; el.style.top = '0px';
    el.classList.add('open');

    const r = btn.getBoundingClientRect();
    const pad = 8;
    const vw = window.innerWidth, vh = window.innerHeight;
    const mw = el.offsetWidth, mh = el.offsetHeight || 180;

    let top = r.bottom + pad;
    let left = Math.min(vw - mw - pad, Math.max(pad, r.left));
    if (top + mh + pad > vh) { top = r.top - mh - pad; }
    if (top < pad) top = pad;
    if (left < pad) left = pad;

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
}
function closeCtx() { const el = document.getElementById('ctx'); el.classList.remove('open'); ctxUser = null; }

// 버튼/배경 클릭으로 열고 닫기
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-menu]');
    if (btn) {
        const current = document.getElementById('ctx');
        if (current.classList.contains('open') && ctxUser === btn.dataset.menu) { closeCtx(); return; }
        openCtx(btn, btn.dataset.menu);
    } else if (!e.target.closest('#ctx')) {
        closeCtx();

    }
});
window.addEventListener('scroll', closeCtx, { passive: true });
window.addEventListener('resize', closeCtx);

// 전역 메뉴 항목 클릭
document.getElementById('ctx').addEventListener('click', (e) => {
    const act = e.target.closest('[data-ctx]')?.dataset.ctx;
    if (!act || !ctxUser) return;
    if (act === 'save') {
        const sel = document.querySelector(`select[data-role="${ctxUser}"]`);
        if (sel) updateRole(ctxUser, sel.value);
    } else if (act === 'reset') {
        resetByUsername(ctxUser);
    } else if (act === 'del') {
        deleteUser(ctxUser);
    }
    else if (act === 'coin') {
        targetUserForCoin = ctxUser;
        closeCtx();
        openModal('#modal-coin');
    }

    closeCtx();
});

// 테이블 내부 체크/버튼
$('#rows').onclick = async (e) => {
    const chk = e.target.closest('.row-check'); if (chk) { updateSelectionUI(); }
};
$('#check-all').onchange = (e) => { $$('.row-check').forEach(i => i.checked = e.target.checked); updateSelectionUI(); };
$('#bulk-apply').onclick = bulkApplyRole;

// 툴바
$('#refresh').onclick = loadUsers;
$('#promote').onclick = promote;
$('#more-btn').onclick = () => togglePopover($('#more'));
document.addEventListener('click', (e) => { if (!e.target.closest('#more-btn') && !e.target.closest('#more')) $('#more').classList.remove('open'); });

// CSV
$('#csv-out').onclick = () => download('users_export.csv', toCSV(view));
$('#csv-in').onchange = async (e) => {
    const f = e.target.files?.[0]; if (!f) return; const rows = parseCSV(await f.text()); const good = rows.filter(r => r.username && r.name);
    for (const c of chunked(good, 200)) { const { error } = await sb.from('users').upsert(c); if (error) console.error(error); }
    toast(`CSV 업로드 완료 (${good.length}명)`); e.target.value = ''; loadUsers();
};

// 모달
$('#open-add').onclick = () => openModal('#modal-add');
$$('#modal-add [data-close]').forEach(b => b.onclick = () => closeModal('#modal-add'));
$('#add-submit').onclick = addUser;

$('#open-logs').onclick = () => { openModal('#modal-logs'); loadLogs(); };
$$('#modal-logs [data-close]').forEach(b => b.onclick = () => closeModal('#modal-logs'));
$('#refresh-logs').onclick = loadLogs;

// 정렬
document.querySelectorAll('th.sortable').forEach(th => {
    th.onclick = () => { const key = th.dataset.sort; sortDir = (sortKey === key && sortDir === 'asc') ? 'desc' : 'asc'; sortKey = key; apply(); };
});

// 초기 로드
document.addEventListener('DOMContentLoaded', async () => { await loadUsers(); });

let targetUserForCoin = null;
$('#coin-submit').onclick = async () => {
    const raw = $('#coin-amount')?.value?.trim();  // ✅ 먼저 정의
    console.log('입력값:', raw);
    console.log('지급 대상:', targetUserForCoin); // 👈 여기 추가

    const amount = parseInt(raw, 10);              // ✅ 그 다음 사용

    if (!targetUserForCoin || !raw || isNaN(amount) || amount <= 0) {
        return toast('지급할 포인트를 올바르게 입력하세요');
    }

    const { data, error: getError } = await sb.from('users')
        .select('coin_balance')
        .eq('username', targetUserForCoin)
        .maybeSingle();

    if (getError || !data) return toast('유저 정보를 불러올 수 없습니다');

    const newBalance = (data.coin_balance || 0) + amount;

    const { error: updateError } = await sb.from('users')
        .update({ coin_balance: newBalance })
        .eq('username', targetUserForCoin);

    if (updateError) {
        console.error(updateError);
        return toast('포인트 지급 실패');
    }

    toast(`포인트 ${amount} 지급 완료`);
    logAction('coin_given', { target: targetUserForCoin, amount });
    closeModal('#modal-coin');
    $('#coin-amount').value = '';
    targetUserForCoin = null;
    loadUsers();
};

$$('#modal-coin [data-close]').forEach(b => b.onclick = () => closeModal('#modal-coin'));
