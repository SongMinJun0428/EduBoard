// ===== Supabase =====
const SUPABASE_URL = "https://ucmzrkwrsezfdjnnwsww.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbXpya3dyc2V6ZmRqbm53c3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDIzODcsImV4cCI6MjA2ODQxODM4N30.rvLItmDStjWb3GfECnCXocHvj-CMTfHfD1CHsAHOLaw";
let sb; // 위임 초기화
const USE_SUPABASE_RESET_EMAIL = true;

// ===== Utils =====
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
let toastTimer; function toast(m) { clearTimeout(toastTimer); const t = $('#toast'); t.textContent = m; t.classList.add('show'); toastTimer = setTimeout(() => t.classList.remove('show'), 1800); }
const roleBadge = r => `<span class="badge ${({ admin: 'role-admin', teacher: 'role-teacher', class_admin: 'role-class_admin', student: 'role-student', user: 'role-user' })[r] || 'role-user'}">${r || '-'}</span>`;
const chunked = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n)o.push(a.slice(i, i + n)); return o; }
const randTemp = () => 'temp-' + Math.random().toString(36).slice(2, 10);

// ===== Theme/Auth =====
// ===== Theme Initialization =====
(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
})();

(async () => {
    // [보안] 관리자 세션 및 권한 체크 (localStorage 기반 기존 로그인 방식과 연동)
    const savedUsername = localStorage.getItem('savedUsername');
    
    // "null" 문자열이나 빈 값도 체크
    if (!savedUsername || savedUsername === 'null' || savedUsername === 'undefined') {
        alert('로그인이 필요합니다.');
        location.replace('index.html');
        return;
    }

    try {
        if (!window.supabase) throw new Error('Supabase 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인하세요.');
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // DB에서 최신 권한 정보 확인
        const { data: userData, error: authError } = await sb.from('users').select('role').eq('username', savedUsername).maybeSingle();
        
        if (authError) throw new Error(`서버 연결 오류: ${authError.message}`);
        if (!userData || userData.role !== 'admin') {
            alert('관리자 전용 페이지입니다. (권한 부족)');
            location.replace('index.html');
            return;
        }

        // 통과 시 바디 표시
        document.body.style.display = 'block';
    } catch (err) {
        console.error('Initialization Error:', err);
        alert(err.message || '시스템 초기화 중 오류가 발생했습니다.');
        location.replace('index.html');
        return;
    }

    function rowIdOrUser(r) { return r.id !== undefined ? r.id : r.username; }
    
    // Variables used in loadUsers and apply
    let all = [], view = [], page = 1, pageSize = 50, sortKey = 'name', sortDir = 'asc';
    let allLogs = [];

    // ===== Tab Logic Initialization =====
    const allSections = [
        $('#section-stats'), 
        $('#section-toolbar'), 
        $('#section-users'), 
        $('#section-shop'), 
        $('#section-job'), 
        $('#section-db'),
        $('#bulk-drawer')
    ];

    const tabsMap = {
        'tab-users': [$('#section-stats'), $('#section-toolbar'), $('#section-users')],
        'tab-shop': [$('#section-shop')],
        'tab-job': [$('#section-job')],
        'tab-db': [$('#section-db')]
    };

    function switchTab(activeTabId) {
        // Clear active states
        $$('.tab-btn').forEach(btn => btn.classList.remove('active'));
        $(`#${activeTabId}`).classList.add('active');

        // Hide all sections
        allSections.forEach(sec => sec?.classList.add('hidden'));

        // Show target sections
        const targetSections = tabsMap[activeTabId];
        if (targetSections) {
            targetSections.forEach(sec => sec?.classList.remove('hidden'));
        }

        // Trigger loads
        if (activeTabId === 'tab-users') loadUsers();
        if (activeTabId === 'tab-shop') loadShopItemsAdmin();
        if (activeTabId === 'tab-job') loadJobResults();
        if (activeTabId === 'tab-db') loadDBTable($('#db-table-select').value);
    }

    // Set up click handlers for tabs
    $$('.tab-btn').forEach(btn => {
        btn.onclick = () => switchTab(btn.id);
    });

    // ===== Header Scroll Effect =====
    const hdr = $('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) hdr.classList.add('scrolled');
        else hdr.classList.remove('scrolled');
    }, { passive: true });

    // ===== Mobile Menu Logic =====
    const mobileMenuBtn = $('#btn-mobile-menu');
    const mobileSidebar = $('#mobile-sidebar');
    const masterSidebar = $('#master-sidebar');
    const mobileSidebarOverlay = $('#mobile-sidebar-overlay');
    const closeMobileMenuBtn = $('#btn-close-mobile-menu');

    function openMobileMenu() {
        mobileSidebar.classList.remove('hidden');
        mobileSidebar.classList.add('open');
        setTimeout(() => masterSidebar.classList.add('active'), 10);
    }
    function closeMobileMenu() {
        masterSidebar.classList.remove('active');
        setTimeout(() => {
            mobileSidebar.classList.remove('open');
            mobileSidebar.classList.add('hidden');
        }, 400); // 100ms extra for smooth transition
    }

    if (mobileMenuBtn) mobileMenuBtn.onclick = openMobileMenu;
    if (closeMobileMenuBtn) closeMobileMenuBtn.onclick = closeMobileMenu;
    if (mobileSidebarOverlay) mobileSidebarOverlay.onclick = closeMobileMenu;

    $$('.tab-btn.mobile').forEach(btn => {
        btn.onclick = () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
            closeMobileMenu();
            $$('.tab-btn.mobile').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });

    const mobileThemeBtn = $('#mobile-theme');
    const pcThemeBtn = $('#theme');
    const pcSignoutBtn = $('#signout');

    if (pcThemeBtn) {
        pcThemeBtn.onclick = () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            if (mobileThemeBtn) mobileThemeBtn.textContent = isDark ? '☀️ 라이트 모드' : '🌙 다크 모드';
        };
    }

    if (pcSignoutBtn) {
        pcSignoutBtn.onclick = () => {
            if (!confirm('로그아웃 하시겠습니까?')) return;
            localStorage.removeItem('savedUsername');
            location.replace('index.html');
        };
    }

    if (mobileThemeBtn) {
        mobileThemeBtn.onclick = () => pcThemeBtn?.click();
    }
    const mobileSignoutBtn = $('#mobile-signout');
    if (mobileSignoutBtn) {
        mobileSignoutBtn.onclick = () => pcSignoutBtn?.click();
    }

    let currentJobData = [];
    let jobChart = null;

    async function loadJobResults() {
        const { data, error } = await sb.from('career_test_results')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500); // Increased limit for better stats

        if (error) return toast('진로 결과 로드 실패');
        
        currentJobData = data || [];
        renderJobTable(currentJobData);
        renderJobStats(currentJobData);
    }

    function renderJobTable(data) {
        const tb = $('#job-rows');
        if (!tb) return;
        tb.innerHTML = '';
        $('#job-empty')?.classList.toggle('hidden', !!data?.length);

        data.forEach(row => {
            const tr = document.createElement('tr');
            const dateStr = new Date(row.created_at).toLocaleString('ko-KR', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
            
            tr.innerHTML = `
                <td data-label="검사 일시" class="px-4 py-3 text-xs text-gray-400">${dateStr}</td>
                <td data-label="학생 정보" class="px-4 py-3 font-medium">${escapeHtml(row.name || '익명')} (${row.grade || '-'}학년)</td>
                <td data-label="주요 유형" class="px-4 py-3"><span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">${escapeHtml(row.main_type || '-')}</span></td>
                <td data-label="핵심 키워드" class="px-4 py-3 text-xs text-gray-500">${escapeHtml(row.top_tags || '-')}</td>
                <td data-label="작업" class="px-4 py-3 text-center">
                    <div class="flex justify-center gap-2">
                        <button class="text-indigo-600 hover:text-indigo-800 text-xs view-job-detail" data-id="${row.id}">보기</button>
                        <button class="text-red-500 hover:text-red-700 text-xs del-job-log" data-id="${row.id}">삭제</button>
                    </div>
                </td>
            `;
            tb.appendChild(tr);
        });
    }

    function renderJobStats(data) {
        const total = data.length;
        $('#job-stat-total').textContent = total.toLocaleString();

        const typeCounts = {};
        data.forEach(r => {
            if (r.main_type) typeCounts[r.main_type] = (typeCounts[r.main_type] || 0) + 1;
        });

        const sortedTypes = Object.entries(typeCounts).sort((a,b) => b[1] - a[1]);
        $('#job-stat-top-type').textContent = sortedTypes[0] ? sortedTypes[0][0] : '-';

        renderJobDistributionChart(typeCounts);
    }

    function renderJobDistributionChart(counts) {
        const ctx = document.getElementById('job-dist-chart');
        if (!ctx) return;

        if (jobChart) jobChart.destroy();

        const labels = Object.keys(counts);
        const values = Object.values(counts);

        jobChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { boxWidth: 12, font: { size: 11 } }
                    }
                },
                cutout: '70%'
            }
        });
    }

    function exportJobResultsToCSV() {
        if (!currentJobData.length) return toast('내보낼 데이터가 없습니다.');

        const headers = ['검사일시', '이름', '학년', '주요유형', '키워드', 'AI리포트', '답변이유'];
        const rows = currentJobData.map(r => {
            const d = r.details || {};
            const reasons = d.categoryReasons ? Object.values(d.categoryReasons).join(' | ') : '';
            return [
                new Date(r.created_at).toLocaleString(),
                r.name || '',
                r.grade || '',
                r.main_type || '',
                r.top_tags || '',
                (d.ai_report || '').replace(/\n/g, ' '),
                reasons.replace(/\n/g, ' ')
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
        });

        const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `job_results_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast('CSV 다운로드 시작');
    }

    // Job Search/Filter
    $('#job-search')?.addEventListener('input', (e) => {
        const kw = e.target.value.toLowerCase();
        const filtered = currentJobData.filter(r => 
            (r.name || '').toLowerCase().includes(kw) || 
            (r.main_type || '').toLowerCase().includes(kw) ||
            (r.top_tags || '').toLowerCase().includes(kw)
        );
        renderJobTable(filtered);
    });

    $('#job-csv-out')?.addEventListener('click', exportJobResultsToCSV);

    const jobRows = $('#job-rows');
    if (jobRows) {
        jobRows.onclick = async (e) => {
            if (e.target.classList.contains('del-job-log')) {
                if (!confirm('해당 기록을 삭제하시겠습니까?')) return;
                const id = e.target.dataset.id;
                const { error } = await sb.from('career_test_results').delete().eq('id', id);
                if (error) toast('삭제 실패');
                else { toast('삭제됨'); loadJobResults(); }
            }
            if (e.target.classList.contains('view-job-detail')) {
                const id = e.target.dataset.id;
                const { data } = await sb.from('career_test_results').select('*').eq('id', id).maybeSingle();
                if (data) showJobDetail(data);
            }
        };
    }

    function showJobDetail(row) {
        const d = row.details || {};
        const content = $('#job-detail-content');
        if (!content) return;
        
        let reasonsHtml = '';
        let reasonsObj = d.categoryReasons;
        if (typeof reasonsObj === 'string') {
            try { reasonsObj = JSON.parse(reasonsObj); } catch(e) { console.error("Reasons parse error", e); }
        }

        if (reasonsObj) {
            reasonsHtml = Object.entries(reasonsObj)
                .sort((a,b) => (parseInt(a[0].split('_').pop()) || 0) - (parseInt(b[0].split('_').pop()) || 0))
                .map(([key, text]) => {
                    const cnt = parseInt(key.split('_').pop()) || 0;
                    return `
                        <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div class="text-xs font-bold text-indigo-500 mb-2 flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                [ ${cnt-4} ~ ${cnt}번 질문 ] 신중 답변
                            </div>
                            <div class="text-sm leading-relaxed italic text-gray-700 dark:text-gray-300">"${escapeHtml(text || '입력 없음')}"</div>
                        </div>
                    `;
                }).join('');
        }

        let answersHtml = '';
        const questionsSource = (typeof QUESTIONS !== 'undefined') ? QUESTIONS : (window.QUESTIONS || []);
        
        let answersObj = d.answers;
        if (typeof answersObj === 'string') {
            try { answersObj = JSON.parse(answersObj); } catch(e) { console.error("Answers parse error", e); }
        }

        if (answersObj && questionsSource.length > 0) {
            answersHtml = Object.entries(answersObj).map(([qid, ans]) => {
                const fullQ = questionsSource.find(q => q.id === qid);
                const qTitle = fullQ ? fullQ.title : qid;
                const choice = ans.selectedOption === 'A' ? 'A' : 'B';
                const chosenText = fullQ ? (choice === 'A' ? fullQ.optionA : fullQ.optionB) : '';

                return `
                    <div class="p-3 border-b border-gray-50 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                        <div class="flex items-center justify-between mb-1.5">
                            <span class="font-mono text-[10px] text-gray-400 font-bold uppercase tracking-tighter">${qid}</span>
                            <span class="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-100 dark:border-indigo-800/50">선택: ${choice}</span>
                        </div>
                        <div class="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1 leading-snug">${escapeHtml(qTitle)}</div>
                        <div class="text-[11px] text-gray-500 italic mb-2">"${escapeHtml(chosenText)}"</div>
                        <div class="flex flex-wrap gap-1">
                            ${(ans.tags || []).map(t => `<span class="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">${t}</span>`).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }

        content.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <!-- Left Column: Info & Summary (8 cols) -->
                <div class="lg:col-span-8 space-y-12">
                    <div class="grid grid-cols-2 gap-6">
                        <div class="bg-blue-50/50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/30">
                            <div class="text-[10px] font-bold text-blue-500 uppercase mb-2 tracking-widest opacity-70">학생 기본 정보</div>
                            <div class="font-black text-2xl text-blue-900 dark:text-blue-100 mb-1">${escapeHtml(row.name || '익명')}</div>
                            <div class="text-sm text-blue-600 font-semibold">${row.grade}학년 · ID: ${row.username}</div>
                        </div>
                        <div class="bg-indigo-50/50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/30">
                            <div class="text-[10px] font-bold text-indigo-500 uppercase mb-2 tracking-widest opacity-70">분석된 성향</div>
                            <div class="font-black text-2xl text-indigo-700 dark:text-indigo-400 mb-1">"${escapeHtml(row.main_type || '-')}"</div>
                            <div class="text-xs text-indigo-500 font-bold truncate" title="${row.top_tags}">${escapeHtml(row.top_tags || '-')}</div>
                        </div>
                    </div>

                    ${d.ai_report ? `
                    <div class="space-y-4">
                        <h4 class="text-base font-black flex items-center gap-2 text-gray-800 dark:text-gray-100">
                            <i class="fas fa-magic text-purple-600"></i>
                            AI 전문가 심층 분석 리포트
                        </h4>
                        <div class="max-w-4xl text-sm bg-purple-50/20 dark:bg-purple-900/10 border border-purple-100/50 dark:border-purple-800/30 p-8 rounded-3xl leading-loose font-normal text-gray-800 dark:text-gray-200 shadow-inner overflow-hidden">
                            ${d.ai_report}
                        </div>
                    </div>
                    ` : ''}

                    <div class="space-y-4">
                        <h4 class="text-base font-black flex items-center gap-2 text-gray-800 dark:text-gray-100">
                            <i class="fas fa-chart-pie text-indigo-600"></i>
                            영역별 세부 지표 분석
                        </h4>
                        <div class="max-w-4xl text-sm bg-white dark:bg-gray-800 border-2 border-gray-50 dark:border-gray-700 p-8 rounded-3xl leading-relaxed shadow-sm">
                            ${(d.summaries || '요약 정보 없음').split(' | ').map(s => `
                                <div class="flex gap-4 mb-4 last:mb-0">
                                    <span class="text-indigo-600 mt-1"><i class="fas fa-check-circle"></i></span>
                                    <div class="text-gray-700 dark:text-gray-300 font-medium">${escapeHtml(s)}</div>
                                </div>`).join('')}
                        </div>
                    </div>

                    <div class="space-y-4">
                        <h4 class="text-base font-black flex items-center gap-2 text-gray-800 dark:text-gray-100">
                            <i class="fas fa-pen-nib text-indigo-600"></i>
                            신중 보강 답변 (가치관 서술)
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${reasonsHtml || '<p class="text-gray-400 text-sm italic p-4">기록된 이유가 없습니다.</p>'}
                        </div>
                    </div>
                </div>

                <!-- Right Column: Raw Answers (4 cols) -->
                <div class="lg:col-span-4 space-y-6">
                     <h4 class="text-base font-black flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <i class="fas fa-list-check text-slate-500"></i>
                        문항별 선택 내역
                    </h4>
                    <div class="bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-white dark:border-gray-800 overflow-hidden shadow-sm">
                        <div class="max-h-[800px] overflow-y-auto px-2 py-2 custom-scrollbar">
                             ${answersHtml || '<p class="p-8 text-center text-gray-400 text-xs italic">내역 없음</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
        openModal('#modal-job-detail');
    }
    $$('#modal-job-detail [data-close]').forEach(b => b.onclick = () => closeModal('#modal-job-detail'));
    
    const refreshJob = $('#refresh-job');
    if (refreshJob) refreshJob.onclick = loadJobResults;

    const dbTableSelect = $('#db-table-select');
    if (dbTableSelect) dbTableSelect.onchange = (e) => loadDBTable(e.target.value);

    const dbRefresh = $('#db-refresh');
    if (dbRefresh) dbRefresh.onclick = () => {
        const sel = $('#db-table-select');
        if (sel) loadDBTable(sel.value);
    };



    // ===== Actions & Initialization =====
    await loadUsers(); // Call immediately within the initialization flow


    function apply() {
        const kw = $('#search').value.trim().toLowerCase();
        const fg = $('#f-grade').value;
        const fc = $('#f-class').value;
        const fr = $('#f-role').value;

        view = all.filter(u => {
            const mMatch = !kw || (u.name || '').toLowerCase().includes(kw)
                || String(u.student_number || '').includes(kw)
                || (u.username || '').toLowerCase().includes(kw);
            
            const gMatch = !fg || String(u.grade) === fg;
            const cMatch = !fc || String(u.class_num) === fc;
            const rMatch = !fr || u.role === fr;

            return mMatch && gMatch && cMatch && rMatch;
        });
        const cmp = (a, b) => (a < b ? -1 : (a > b ? 1 : 0));
        view.sort((a, b) => {
            let r = (sortDir === 'asc' ? 1 : -1) * cmp(a[sortKey] ?? '', b[sortKey] ?? '');
            if (r !== 0) return r;
            for (const k of ['grade', 'class_num', 'student_number', 'name']) { if (k === sortKey) continue; const t = cmp(a[k] ?? '', b[k] ?? ''); if (t !== 0) return t; }
            return 0;
        });
        const pageSizeEl = $('#page-size');
        pageSize = Number(pageSizeEl?.value || 50);
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
            tr.className = 'group hover:bg-slate-50 transition-colors';
            tr.innerHTML = `
          <td data-label="선택" class="text-center w-10"><input type="checkbox" class="row-check" data-username="${u.username}"></td>
          <td data-label="이름" class="text-left font-bold text-gray-900 dark:text-gray-100">${u.name ?? '-'}</td>
          <td data-label="아이디" class="text-left font-mono text-[11px] text-slate-400">${u.username ?? '-'}</td>
          <td data-label="학급 정보" class="text-center whitespace-nowrap">
            <span class="text-sm font-medium">${u.grade ?? '-'}학년 ${u.class_num ?? '-'}반</span>
            <span class="text-[10px] text-slate-400 ml-1">(${u.student_number ?? '0'}번)</span>
          </td>
          <td data-label="권한 관리">
            <div class="flex items-center gap-1">
              <select class="rounded-lg border px-2 py-1 text-xs dark:bg-gray-800 border-slate-200 w-24 h-8" data-role-select="${u.username}">
                ${['admin', 'teacher', 'class_admin', 'student', 'user'].map(r => `<option ${u.role === r ? 'selected' : ''} value="${r}">${r}</option>`).join('')}
              </select>
              <button class="btn btn-primary h-8 px-2 text-[10px] shrink-0 quick-save-role rounded-lg" data-username="${u.username}">저장</button>
            </div>
          </td>
          <td data-label="성장 Stats" class="text-center">
            <div class="flex items-center gap-1.5 justify-end">
                <span class="text-xs font-bold">Lvl.${u.level ?? '1'}</span>
                <span class="text-[10px] text-slate-400 font-mono">(${u.xp ?? '0'} XP)</span>
            </div>
          </td>
          <td data-label="포인트" class="text-right pr-6 font-mono text-blue-600 font-bold whitespace-nowrap">
            ${(u.coin_balance ?? 0).toLocaleString()} <span class="text-[10px] text-slate-400 font-normal">P</span>
          </td>
          <td data-label="작업" class="text-center w-24">
            <button class="btn h-8 px-3 text-xs bg-slate-50 border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 rounded-lg flex items-center gap-1.5 transition-all" data-menu="${u.username}">
                <span>관리</span>
                <i class="fa-solid fa-ellipsis text-[10px] opacity-50"></i>
            </button>
          </td>`;

            // 빠른 저장 이벤트
            tr.querySelector('.quick-save-role').onclick = (e) => {
                const btn = e.target;
                const username = btn.dataset.username;
                const role = tr.querySelector(`[data-role-select="${username}"]`).value;
                updateRole(username, role);
            };

            tb.appendChild(tr);
        }
    }


    async function loadUsers() {
        const { data, error } = await sb.from('users').select('*');
        if (error) { console.error(error); return toast('사용자 목록 로딩 실패'); }
        all = data || [];
        apply();
        renderStats();
    }

    async function renderStats() {
        try {
            // 1. 사용자 관련 (총원, 코인 합계, 최고 레벨, 학급 수)
            const { data: userData, error: userErr } = await sb.from('users').select('coin_balance, level, grade, class_num');
            if (userErr) throw userErr;

            const userCount = userData?.length || 0;
            const totalCoins = userData?.reduce((sum, u) => sum + (u.coin_balance || 0), 0) || 0;
            const maxLevel = userData?.reduce((max, u) => Math.max(max, u.level || 0), 0) || 0;
            
            const classSet = new Set();
            userData?.forEach(u => {
                if (u.grade && u.class_num) classSet.add(`${u.grade}-${u.class_num}`);
            });
            const classCount = classSet.size;

            // 2. 상점 상품 수
            const { count: shopCount } = await sb.from('shop_items').select('*', { count: 'exact', head: true });

            // 3. 24시간 활동 로그 수
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { count: logCount } = await sb.from('user_activity_logs')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', yesterday);

            // 4. UI 반영
            const set = (id, val) => { 
                const v = (val || 0).toLocaleString();
                if (window.__updateSecurityValue) {
                    window.__updateSecurityValue(id, v);
                } else {
                    const el = $('#' + id); if (el) el.textContent = v; 
                }
            };
            set('stat-total', userCount);
            set('stat-total-coins', totalCoins);
            set('stat-max-level', maxLevel);
            set('stat-recent-logs', logCount);
            set('stat-shop-items', shopCount);
            set('stat-classes', classCount);

        } catch (e) {
            console.error('Stats 로딩 오류:', e);
        }
    }

    async function loadDBTable(table) {
        if (!table) return;
        const tb = $('#db-tbody'), th = $('#db-thead');
        if (!tb || !th) return;
        
        tb.innerHTML = '<tr><td colspan="10" class="text-center py-10">로딩 중...</td></tr>';
        const { data, error } = await sb.from(table).select('*').limit(500);
        if (error) { tb.innerHTML = `<tr><td colspan="10" class="text-center py-10 text-red-500">${error.message}</td></tr>`; return; }

        if (!data || data.length === 0) {
            tb.innerHTML = '<tr><td colspan="10" class="text-center py-10">데이터가 없습니다.</td></tr>';
            return;
        }

        const keys = Object.keys(data[0]);
        th.innerHTML = `<tr>${keys.map(k => `<th class="p-2 border bg-gray-50 text-xs font-bold">${k}</th>`).join('')}</tr>`;
        tb.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = keys.map(k => {
                const val = row[k];
                const display = (typeof val === 'object') ? JSON.stringify(val) : val;
                return `<td data-label="${k}" class="p-2 border text-xs truncate max-w-[200px]" title="${display}">${escapeHtml(String(display ?? ''))}</td>`;
            }).join('');
            tb.appendChild(tr);
        });
    }

    // ===== Actions =====
    async function updateRole(username, role) {
        const { error } = await sb.from('users').update({ role }).eq('username', username);
        if (error) { console.error(error); return toast('권한 저장 실패'); }
        toast('권한 저장 완료'); logAction('role_update', { target: username, role });
        renderStats();
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
        renderStats();
    }
    async function bulkApplyRole() {
        const role = $('#bulk-role').value; if (!role) return toast('일괄 권한을 선택하세요');
        const ids = [...$$('.row-check:checked')].map(i => i.dataset.username); if (!ids.length) return;
        if (!confirm(`${ids.length}명의 권한을 '${role}'(으)로 일괄 변경할까요?`)) return;
        const { error } = await sb.from('users').update({ role }).in('username', ids);
        if (error) { console.error(error); return toast('일괄 변경 실패'); }
        toast(`일괄 변경 완료 (${ids.length}명)`); logAction('role_bulk_update', { targets: ids, role }); loadUsers();
    }
    async function bulkGivePoints() {
        const ids = [...$$('.row-check:checked')].map(i => i.dataset.username);
        if (!ids.length) return;
        const raw = prompt(`${ids.length}명에게 지급할 포인트를 입력하세요:`, '100');
        const amount = parseInt(raw, 10);
        if (isNaN(amount) || amount <= 0) return toast('올바른 포인트를 입력하세요');

        if (!confirm(`${ids.length}명에게 각각 ${amount}P를 지급할까요?`)) return;

        // Supabase RPC if exists, or batch update loop
        for (const chunk of chunked(ids, 50)) {
            const { data, error: getErr } = await sb.from('users').select('username, coin_balance').in('username', chunk);
            if (getErr) continue;
            const updates = data.map(u => ({ username: u.username, coin_balance: (u.coin_balance || 0) + amount }));
            const { error: upErr } = await sb.from('users').upsert(updates);
            if (upErr) console.error('Bulk point error for chunk', upErr);
        }

        toast(`일괄 지급 완료 (${ids.length}명)`);
        logAction('coin_bulk_given', { targets: ids, amount });
        loadUsers();
    }
    async function promote() {
        if (!confirm('신학기 자동 승급(1→2, 2→3)을 실행할까요?\n(학생 권한인 사용자만 학년이 1씩 올라갑니다)')) return;

        // 1. RPC 시도
        const { error: rpcError } = await sb.rpc('promote_students_safe', {});
        if (!rpcError) {
            toast('자동 승급 완료 (RPC)');
            logAction('promote', { via: 'rpc' });
            await loadUsers();
            return;
        }

        // 2. Fallback: 클라이언트 사이드 일괄 업데이트
        toast('일괄 승급 처리 중...');
        const { data, error: e2 } = await sb.from('users').select('username,grade').eq('role', 'student').limit(5000);
        if (e2) { console.error(e2); return toast('데이터 로드 실패: ' + e2.message); }

        if (!data || data.length === 0) return toast('승급할 학생이 없습니다.');

        const ups = data.filter(u => u.grade && !isNaN(parseInt(u.grade)))
            .map(u => {
                const current = parseInt(u.grade, 10);
                return {
                    username: u.username,
                    grade: (current >= 1 && current <= 2) ? current + 1 : current
                };
            });

        if (ups.length === 0) return toast('유효한 학년 정보가 있는 학생이 없습니다.');

        let successCount = 0;
        for (const c of chunked(ups, 100)) {
            const { error: e3 } = await sb.from('users').upsert(c);
            if (e3) {
                console.error('Batch error:', e3);
            } else {
                successCount += c.length;
            }
        }

        toast(`자동 승급 완료 (${successCount}명)`);
        logAction('promote', { count: successCount, total: ups.length });
        await loadUsers();
        renderStats();
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

    async function openEditModal(username) {
        const { data, error } = await sb.from('users').select('*').eq('username', username).maybeSingle();
        if (error || !data) return toast('사용자 정보를 가져올 수 없습니다.');

        $('#edit-username').value = data.username;
        $('#edit-name').value = data.name || '';
        $('#edit-email').value = data.email || '';
        $('#edit-grade').value = data.grade || '';
        $('#edit-class').value = data.class_num || '';
        $('#edit-number').value = data.student_number || '';
        $('#edit-level').value = data.level || 1;
        $('#edit-xp').value = data.xp || 0;
        $('#edit-coin').value = data.coin_balance || 0;

        openModal('#modal-edit');
    }

    async function updateUserInfo() {
        const username = $('#edit-username').value;
        const p = {
            name: $('#edit-name').value.trim(),
            email: $('#edit-email').value.trim() || null,
            grade: Number($('#edit-grade').value) || null,
            class_num: Number($('#edit-class').value) || null,
            student_number: Number($('#edit-number').value) || null,
            level: Number($('#edit-level').value) || 1,
            xp: Number($('#edit-xp').value) || 0,
            coin_balance: Number($('#edit-coin').value) || 0
        };

        if (!p.name) return toast('이름은 필수 항목입니다.');

        const { error } = await sb.from('users').update(p).eq('username', username);
        if (error) { console.error(error); return toast('정보 수정 실패'); }

        toast('정보 수정 완료');
        logAction('user_info_update', { target: username, ...p });
        closeModal('#modal-edit');
        loadUsers();
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

    let logDataCache = [];
    async function loadLogs() {
        try {
            const { data, error } = await sb
                .from('user_activity_logs')
                .select('action, username, email, target, target_type, created_at, details')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            logDataCache = data || [];
            renderLogsUI();
        } catch (e) {
            console.error('loadLogs 오류', e);
            $('#log-empty').classList.remove('hidden');
        }
    }

    const LOG_ACTION_MAP = {
        'login': '로그인',
        'signup': '회원가입',
        'buy': '아이템 구매',
        'use': '아이템 사용',
        'game_reward': '게임 보상 획득',
        'coin_given': '포인트 지급',
        'coin_bulk_given': '일괄 포인트 지급',
        'role_update': '권한 변경',
        'role_bulk_update': '일괄 권한 변경',
        'user_create': '사용자 생성',
        'user_delete': '사용자 삭제',
        'user_info_update': '사용자 정보 수정',
        'password_reset_email': '비밀번호 재설정 메일',
        'password_temp_set': '임시 비밀번호 설정',
        'promote': '신학기 자동 승급',
        'db_direct_edit': 'DB 직접 수정',
        'shop_item_create': '상점 아이템 추가',
        'shop_item_update': '상점 아이템 수정',
        'shop_item_delete': '상점 아이템 삭제'
    };

    function renderLogsUI() {
        const ul = $('#log-list');
        ul.innerHTML = '';

        const filterUser = $('#log-search-user').value.trim().toLowerCase();
        const filterAction = $('#log-search-action').value.trim().toLowerCase();

        const filtered = logDataCache.filter(r => {
            const uMatch = !filterUser || (r.username || r.email || '').toLowerCase().includes(filterUser);
            const aMatch = !filterAction || (r.action || '').toLowerCase().includes(filterAction);
            return uMatch && aMatch;
        });

        $('#log-empty').classList.add('hidden');
        if (!filtered.length) {
            $('#log-empty').classList.remove('hidden');
            return;
        }

        for (const r of filtered) {
            const when = new Date(r.created_at).toLocaleString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            });
            const actionText = LOG_ACTION_MAP[r.action] || r.action;

            let detailSummary = '';
            if (r.details) {
                const d = r.details;
                if (r.action === 'coin_given' || r.action === 'coin_bulk_given') {
                    detailSummary = `<span class="text-amber-600 font-bold">+${(d.amount || 0).toLocaleString()}P</span>`;
                } else if (r.action === 'buy' || r.action === 'use') {
                    detailSummary = `<span class="text-indigo-600 font-bold">[${d.item_name || d.name || '아이템'}]</span>`;
                } else if (r.action === 'game_reward') {
                    detailSummary = `<span class="text-green-600 font-bold">+${(d.amount || 0).toLocaleString()}P (${d.session_id || '게임'})</span>`;
                } else if (r.action === 'role_update' || r.action === 'role_bulk_update') {
                    detailSummary = `<span class="text-slate-500">(${d.role || d.new_role || ''})</span>`;
                }
            }

            const li = document.createElement('li');
            const safeDetails = escapeHtml(JSON.stringify(r.details, null, 2));

            li.innerHTML = `
        <div class="p-6 rounded-xl border bg-white dark:bg-gray-950 dark:border-gray-800 flex justify-between items-center group hover:border-indigo-300 transition-all shadow-sm hover:shadow-md min-h-[6rem]">

          <div class="flex items-center gap-6 flex-1 min-w-0">
            <div class="text-[10px] text-gray-400 font-mono w-32 shrink-0 border-r dark:border-gray-800 pr-4">${when}</div>

            <div class="flex flex-col gap-0.5 min-w-[120px] shrink-0">
              <span class="font-bold text-sm text-gray-700 dark:text-gray-200 truncate">${r.username || 'unknown'}</span>
              <span class="text-[10px] text-gray-400 truncate opacity-70">${r.email || ''}</span>
            </div>

            <div class="flex items-center gap-4 flex-grow min-w-0">
               <span class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 shrink-0 tracking-tight">${actionText}</span>
               <div class="detail-summary text-xs text-slate-500 break-words">${detailSummary}</div>
            </div>

            ${r.target ? `<div class="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 rounded border border-dashed shrink-0 max-w-[200px] break-all">대상: ${r.target}</div>` : ''}
          </div>

          <div class="ml-6 shrink-0">
            <button class="btn btn-ghost btn-sm h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity view-log-detail" data-details="${safeDetails}" title="상세 내역">
                <svg viewBox="0 0 24 24" fill="none" class="w-5 h-5 text-slate-400"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>`;

            ul.appendChild(li);
        }

        document.querySelectorAll('.view-log-detail').forEach(btn => {
            btn.onclick = function () {
                const detailsJson = this.getAttribute('data-details');
                document.getElementById('log-detail-content').textContent = detailsJson;
                openModal('#modal-log-detail');
            };
        });
    }

    // XSS 방지를 위한 유틸리티 함수
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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
        $('#sel-count').textContent = cnt; $('#bulk-drawer').classList.toggle('active', cnt > 0);
        $('#check-all').checked = !!cnt && [...$$('.row-check')].every(i => i.checked);
    }

    // 필터/검색/페이징
    $('#f-grade').onchange = () => { page = 1; apply(); };
    $('#f-class').onchange = () => { page = 1; apply(); };
    $('#f-role').onchange = () => { page = 1; apply(); };
    $('#search').oninput = () => { page = 1; apply(); };
    const pageSizeEl = $('#page-size');
    if (pageSizeEl) pageSizeEl.onchange = () => { page = 1; apply(); };
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
        } else if (act === 'edit') {
            openEditModal(ctxUser);
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
    $('#bulk-point').onclick = bulkGivePoints;

    // 로그 검색 실시간 반영
    $('#log-search-user').oninput = renderLogsUI;
    $('#log-search-action').oninput = renderLogsUI;

    // 툴바
    $('#refresh').onclick = loadUsers;
    $('#promote').onclick = promote;
    $('#more-btn').onclick = () => togglePopover($('#more'));
    $('#open-logs').onclick = () => openModal('#modal-logs');

    // ✅ 관리자 아이템 전체 동기화 (본인)
    $('#admin-sync-all').onclick = async () => {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { alert('로그인이 필요합니다.'); return; }

        const { data: userData } = await sb.from('users').select('username').eq('email', user.email).maybeSingle();
        const username = userData?.username;
        if (!username) { alert('사용자 정보를 찾을 수 없습니다.'); return; }

        if (!confirm('모든 상점 아이템을 인벤토리에 추가하시겠습니까? (본인 계정 기준)')) return;

        try {
            const { data: allItems } = await sb.from('shop_items').select('id, name');
            const { data: myItems } = await sb.from('inventory').select('item_id').eq('username', username);
            const myItemIdSet = new Set(myItems.map(i => i.item_id));

            const toInsert = allItems
                .filter(item => !myItemIdSet.has(item.id))
                .map(item => ({
                    username: username,
                    item_id: item.id,
                    item_name: item.name,
                    price: 0,
                    purchased_at: new Date().toISOString()
                }));

            if (toInsert.length === 0) {
                toast('이미 모든 아이템을 보유하고 있습니다.');
                return;
            }

            const { error } = await sb.from('inventory').insert(toInsert);
            if (error) throw error;

            toast(`✅ ${toInsert.length}개의 아이템이 추가되었습니다.`);
        } catch (err) {
            console.error(err);
            alert('오류 발생: ' + err.message);
        }
    };

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
    $$('#modal-log-detail [data-close]').forEach(b => b.onclick = () => closeModal('#modal-log-detail'));
    $('#refresh-logs').onclick = loadLogs;

    $$('#modal-edit [data-close]').forEach(b => b.onclick = () => closeModal('#modal-edit'));
    $('#edit-submit').onclick = updateUserInfo;

    // 정렬
    document.querySelectorAll('th.sortable').forEach(th => {
        th.onclick = () => { const key = th.dataset.sort; sortDir = (sortKey === key && sortDir === 'asc') ? 'desc' : 'asc'; sortKey = key; apply(); };
    });

    // ===== Shop Management Logic (Tab switching is handled above) =====
    async function loadShopItemsAdmin() {
        const { data, error } = await sb.from('shop_items').select('*').order('id', { ascending: true });
        if (error) { console.error(error); return toast('상점 아이템 로드 실패'); }
        const tb = $('#shop-rows'); tb.innerHTML = '';
        $('#shop-empty').classList.toggle('hidden', !!data?.length);

        (data || []).forEach(item => {
            const tr = document.createElement('tr');
            const imgHtml = item.image_url
                ? `<div class="w-10 h-10 rounded border bg-cover bg-center" style="background-image:url('${item.image_url}')"></div>`
                : `<div class="w-10 h-10 rounded border bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Img</div>`;

            tr.innerHTML = `
          <td data-label="ID" class="text-center font-mono text-xs text-gray-400">${item.id}</td>
          <td data-label="아이템 정보">
            <div class="flex items-center gap-3">
              ${imgHtml}
              <div class="flex flex-col">
                <span class="font-semibold">${escapeHtml(item.name)}</span>
                <span class="text-[10px] text-gray-400 uppercase font-bold">${item.item_type || 'normal'}</span>
              </div>
            </div>
          </td>
          <td data-label="가격 (P)" class="text-center text-amber-600 font-bold">${(item.price || 0).toLocaleString()}</td>
          <td data-label="개인 재고" class="text-center">${item.stock || 1}</td>
          <td data-label="설명" class="text-gray-500 text-xs truncate max-w-[300px]">${escapeHtml(item.description || '-')}</td>
          <td data-label="작업" class="text-center">
            <div class="flex justify-center gap-2">
              <button class="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors edit-shop" data-id="${item.id}">수정</button>
              <button class="text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors del-shop" data-id="${item.id}">삭제</button>
            </div>
          </td>`;
            tb.appendChild(tr);
        });
    }

    // 상점 아이템 추가/수정
    $('#open-add-shop').onclick = () => {
        $('#shop-modal-title').textContent = '🛒 새 아이템 추가';
        $('#shop-id').value = '';
        $('#shop-name').value = '';
        $('#shop-price').value = '';
        $('#shop-type').value = 'normal';
        $('#shop-effect').value = '';
        $('#shop-image').value = '';
        $('#shop-stock').value = '1';
        $('#shop-desc').value = '';
        openModal('#modal-shop');
    };

    $('#shop-submit').onclick = async () => {
        const id = $('#shop-id').value;
        const p = {
            name: $('#shop-name').value.trim(),
            price: Number($('#shop-price').value || 0),
            item_type: $('#shop-type').value,
            effect_data: $('#shop-effect').value.trim() || null,
            image_url: $('#shop-image').value.trim() || null,
            stock: Number($('#shop-stock').value || 1),
            description: $('#shop-desc').value.trim() || null
        };

        if (!p.name) return toast('아이템 이름을 입력하세요');

        let error;
        if (id) {
            const { error: e } = await sb.from('shop_items').update(p).eq('id', id);
            error = e;
        } else {
            const { error: e } = await sb.from('shop_items').insert([p]);
            error = e;
        }

        if (error) { console.error(error); return toast('저장 실패: ' + error.message); }
        toast(id ? '수정 완료' : '추가 완료');
        logAction(id ? 'shop_item_update' : 'shop_item_create', p);
        closeModal('#modal-shop');
        loadShopItemsAdmin();
        renderStats();
    };

    $('#shop-rows').onclick = async (e) => {
        const editBtn = e.target.closest('.edit-shop');
        const delBtn = e.target.closest('.del-shop');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const { data, error } = await sb.from('shop_items').select('*').eq('id', id).maybeSingle();
            if (error || !data) return toast('정보 로드 실패');

            $('#shop-modal-title').textContent = '📝 아이템 수정';
            $('#shop-id').value = data.id;
            $('#shop-name').value = data.name;
            $('#shop-price').value = data.price;
            $('#shop-type').value = data.item_type || 'normal';
            $('#shop-effect').value = data.effect_data || '';
            $('#shop-image').value = data.image_url || '';
            $('#shop-stock').value = data.stock || 1;
            $('#shop-desc').value = data.description || '';
            openModal('#modal-shop');
        }

        if (delBtn) {
            const id = delBtn.dataset.id;
            if (!confirm('정말 이 아이템을 삭제할까요?')) return;
            const { error } = await sb.from('shop_items').delete().eq('id', id);
            if (error) { console.error(error); return toast('삭제 실패'); }
            toast('삭제 완료');
            logAction('shop_item_delete', { item_id: id });
            loadShopItemsAdmin();
            renderStats();
        }
    };

    $$('#modal-shop [data-close]').forEach(b => b.onclick = () => closeModal('#modal-shop'));

    let targetUserForCoin = null;
    $('#coin-submit').onclick = async () => {
        const raw = $('#coin-amount')?.value?.trim();
        const amount = parseInt(raw, 10);

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
})();
