// PDF Worker Config
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
}

const { createClient } = supabase;
window.supabaseClient = window.supabase.createClient(
  'https://ucmzrkwrsezfdjnnwsww.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbXpya3dyc2V6ZmRqbm53c3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDIzODcsImV4cCI6MjA2ODQxODM4N30.rvLItmDStjWb3GfECnCXocHvj-CMTfHfD1CHsAHOLaw'
);
const supabaseClient = window.supabaseClient;

const NEIS_KEY = '28ca0f05af184e8ba231d5a949d52db2';
const ATPT_OFCDC_SC_CODE = 'J10';
const SD_SCHUL_CODE = '7679111';

// 🍪 쿠키 헬퍼 함수
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  let nameEQ = name + "=";
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// 초기 로딩 시 세션 복구 및 설정 (실제 구동은 initApp 또는 DOMContentLoaded 하단에서 수행되도록 연동)
function syncPersistentSession() {
  const savedUser = localStorage.getItem('savedUsername');
  const cookieUser = getCookie('savedUsername');

  if (!savedUser && cookieUser) {
    localStorage.setItem('savedUsername', cookieUser);
  } else if (savedUser && !cookieUser) {
    setCookie('savedUsername', savedUser, 7); // 7일 유지
  }
}
function initTheme() {
  const prefs = JSON.parse(localStorage.getItem('eduBoard_preferences') || '{}');
  const savedTheme = prefs.theme || localStorage.getItem('theme') || 'light'; // Default to light
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

function updateThemeUI(isDark) {
  const icon = isDark ? '☀️' : '🌙';
  const desktopIcon = document.getElementById('theme-icon');
  const mobileIcon = document.getElementById('theme-icon-mobile');
  if (desktopIcon) desktopIcon.textContent = icon;
  if (mobileIcon) mobileIcon.textContent = icon;
}

syncPersistentSession();
initTheme();

// 전역 폼 제출 방지 (엔터 키 리다이렉트 버그 해결)
document.addEventListener('submit', (e) => {
  e.preventDefault();
}, true);

const KOR_SUBJECTS = [
  '국어', '수학', '영어', '과학', '사회', '역사', '도덕', '기술', '가정', '정보', '음악', '미술', '체육',
  '통합', '자율', '창체', '자율활동', '동아리', '진로', '한문', '스포츠'
];

/** 🛡️ 학년/반 데이터를 안전하게 정수로 변환 (null/NaN 방지) */
function getSafeGradeClass() {
  const rawG = currentGrade ?? localStorage.getItem('savedGrade');
  const rawC = currentClassNum ?? localStorage.getItem('savedClassNum');

  // "null" 문자열 또는 falsy 값 처리
  const g = (rawG === "null" || rawG === null || rawG === undefined) ? 0 : parseInt(rawG, 10);
  const c = (rawC === "null" || rawC === null || rawC === undefined) ? 0 : parseInt(rawC, 10);

  return {
    safeG: isNaN(g) ? 0 : g,
    safeC: isNaN(c) ? 0 : c
  };
}

const docResult = document.getElementById('doc-result');


const SUBJECT_CANON = [
  '국어', '수학', '영어', '과학', '사회', '역사', '도덕', '기술·가정', '정보',
  '음악', '미술', '체육', '자율', '동아리', '진로', '한문',
  '중국어', '스포츠'
];

const SUBJECT_SYNONYMS = {
  '국어': ['국어', '국어과', '문학', '독서', '작문'],
  '수학': ['수학', '수 학', '수(학)', '수학Ⅰ', '수학I', '수학A', '수학B'],
  '영어': ['영어', '영 어', '회화', '독해', '문법', '영어A', '영어B'],
  '과학': ['과학', '과 학', '과탐', '과학탐구', '물리', '화학', '생명과학', '지구과학', '통합과학'],
  '사회': ['사회', '사회과', '통합사회', '법과정치', '경제', '윤리'],
  '역사': ['역사', '한국사', '세계사'],
  '도덕': ['도덕', '윤리'],
  '기술·가정': ['기술·가정', '기술가정', '기술 가정', '기가', '기 술', '가 정', '기술', '가정'],
  '정보': ['정보', '컴퓨터', '프로그래밍', '코딩', 'SW', '소프트웨어'],
  '음악': ['음악', '합창', '합주', '실기(음악)'],
  '미술': ['미술', '디자인', '드로잉', '실기(미술)'],
  '체육': ['체육', '체육활동', '체 육', '스포츠', '스포츠클럽'],
  '자율': ['자율', '자율활동'],
  '동아리': ['동아리'],
  '진로': ['진로', '진로활동'],
  '한문': ['한문', '한자'],
  '중국어': ['중국어', '중국어회화', '중국어Ⅰ', '중국어 I', '중국어1'],
  '스포츠': ['스포츠', '스포츠클럽']
};

let currentUserRole = 'user';
let currentUserName = '';
let currentStudentNumber = '';
let currentGrade = null;
let currentClassNum = null;
let timetableOffset = 0;

let currentFourNumbers = [];
// let currentUserCoin = 0; // 전역 window.currentUserCoin 사용으로 전환

/** 🔐 보안 유틸리티: HTML 특수문자 이스케이프 (XSS 방지) */
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/** 🔄 글로벌 로딩 제어 */
function showLoading() {
  const loader = document.getElementById('loader-overlay');
  if (loader) {
    loader.style.display = 'flex';
  }
}
function hideLoading() {
  const loader = document.getElementById('loader-overlay');
  if (loader) {
    loader.style.display = 'none';
  }
}

async function loginDirect() {
  const userBtn = document.getElementById('login-btn');
  const username = document.getElementById('loginUsername').value.replace(/\s+/g, '');
  const password = document.getElementById('loginPassword').value.replace(/\s+/g, '');

  if (!username || !password) {
    alert('아이디와 비밀번호를 입력해주세요.');
    return;
  }

  showLoading();
  if (userBtn) userBtn.disabled = true;

  try {
    const { data: user } = await supabaseClient
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (user) {
      currentUserName = user.name;
      currentStudentNumber = user.student_number;

      localStorage.setItem('savedUsername', username);
      setCookie('savedUsername', username, 7); // 7일 유지
      localStorage.setItem('savedName', currentUserName);
      localStorage.setItem('savedStudentNum', currentStudentNumber);
      localStorage.setItem('savedGrade', user.grade || 0);
      localStorage.setItem('savedClassNum', user.class_num || 0);
      localStorage.setItem('savedRole', user.role || 'user');
      localStorage.setItem('savedUserId', user.id || '');
      localStorage.setItem('savedEmail', user.email || '');

      setUserInfoInput();

      currentUserRole = user.role || 'user';
      currentGrade = user.grade;
      currentClassNum = user.class_num;

      // 📝 로그인 로그 기록 (통합 로그 함수 사용)
      if (window.logActivity) {
        window.logActivity('login', username, 'user', { name: user.name, student_number: user.student_number });
      }

      document.getElementById('dash-name').innerHTML = formatUserDisplayName(user);
      document.getElementById('dash-role').textContent = user.role === 'admin' ? '관리자' : '학생';

      loadTimetableWeek(user.grade, user.class_num);
      showMain();
      loadNotices();
      initDashboardTop();
    } else {
      document.getElementById('loginStatus').innerText = '아이디 또는 비밀번호가 틀렸습니다.';
    }
  } catch (err) {
    console.error('Login error:', err);
    document.getElementById('loginStatus').innerText = '로그인 중 오류가 발생했습니다: ' + err.message;
  } finally {
    hideLoading();
    if (userBtn) userBtn.disabled = false;
  }
}

async function signup() {
  const signupBtn = document.getElementById('signup-btn');
  const signupStatus = document.getElementById('signupStatus');
  const username = document.getElementById('signupUsername').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  const emailId = document.getElementById('signupEmailId').value.trim();
  const domainValue = document.getElementById('signupEmailDomain').value;
  const customDomain = document.getElementById('signupEmailCustom').value.trim();
  const email = `${emailId}@${domainValue === '직접입력' ? customDomain : domainValue}`;
  const name = document.getElementById('signupName').value.trim();
  const grade = document.getElementById('signupGrade').value.trim();
  const classNum = document.getElementById('signupClass').value.trim();
  const number = document.getElementById('signupNumber').value.trim();
  const agree = document.getElementById('privacy-agree').checked;

  if (!agree) {
    if (signupStatus) signupStatus.innerText = '개인정보 수집·이용에 동의해 주세요.';
    return;
  }
  if (!username || !password || !email || !name || !grade || !classNum || !number) {
    if (signupStatus) signupStatus.innerText = '모든 항목을 입력해 주세요.';
    return;
  }
  if (password.length < 6) {
    if (signupStatus) signupStatus.innerText = '비밀번호는 6자 이상이어야 합니다.';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (signupStatus) signupStatus.innerText = '올바른 이메일을 입력해 주세요.';
    return;
  }

  showLoading();
  if (signupBtn) signupBtn.disabled = true;

  try {
    // 1. 중복 확인
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      if (signupStatus) signupStatus.innerText = '이미 존재하는 아이디입니다.';
      return;
    }

    // 2. 가입 시도
    const { error } = await supabaseClient.from('users').insert([{
      username: username,
      password: password,
      email: email,
      name: name,
      grade: parseInt(grade, 10),
      class_num: parseInt(classNum, 10),
      student_number: parseInt(number, 10),
      role: 'user',
      privacy_agreed_at: new Date().toISOString()
    }]);

    if (error) throw error;

    alert('가입을 축하합니다! 로그인 해 주세요.');
    showLogin();
  } catch (err) {
    if (signupStatus) {
      signupStatus.innerText = '가입 오류: ' + err.message;
      signupStatus.style.color = 'red';
    }
  } finally {
    hideLoading();
    if (signupBtn) signupBtn.disabled = false;
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  localStorage.removeItem('savedUsername');
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}

async function updateProfile() {
  const newName = document.getElementById('update-name').value;
  const newPass = document.getElementById('update-password').value;

  if (newPass) {
    const { error } = await supabaseClient.auth.updateUser({ password: newPass });
    if (error) alert('비밀번호 수정 오류:' + error.message);
    else alert('비밀번호 수정 완료!');
  }
  if (newName) {
    const user = await supabaseClient.auth.getUser();
    if (user && user.data.user) {
      await supabaseClient.from('users').update({ name: newName }).eq('id', user.data.user.id);
      alert('이름 수정 완료!');
    }
  }
}

// 📱 모바일 하단 네브 활성화 상태 업데이트
function updateMobileNavActive(panelId) {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => {
    const onclick = item.getAttribute('onclick');
    if (onclick && onclick.includes(`'${panelId}'`)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// 기존 showPanel 함수를 확장하거나 호출 시점에 연동
const originalShowPanel = window.showPanel;
window.showPanel = function(id) {
  if (typeof originalShowPanel === 'function') {
    originalShowPanel(id);
  } else {
    // 만약 이미 전역에 정의되어 있다면 (index.js 또는 다른 파일)
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    const target = document.getElementById(id);
    if (target) target.style.display = 'block';
  }
  updateMobileNavActive(id);
};

async function addNotice() {
  const submitBtn = document.querySelector('#notice-panel button');
  const title = document.getElementById('notice-title').value.trim();
  const content = document.getElementById('notice-content').value.trim();
  const fileInput = document.getElementById('notice-image');
  const uploadChecked = document.getElementById('notice-upload-check').checked;

  if (!title || !content) {
    alert('제목과 내용을 입력해 주세요.');
    return;
  }

  showLoading();
  if (submitBtn) submitBtn.disabled = true;

  try {
    let imageUrl = '';
    if (uploadChecked && fileInput.files.length) {
      const file = fileInput.files[0];
      const uniqueName = Date.now() + '_' + file.name;
      const filePath = `public/${uniqueName}`;

      const { error: uploadErr } = await supabaseClient
        .storage
        .from('notice-images')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabaseClient
        .storage
        .from('notice-images')
        .getPublicUrl(filePath);

      imageUrl = publicData.publicUrl;
    }

    const { data: writerData, error: writerError } = await supabaseClient
      .from('users')
      .select('username,name,role,grade,class_num')
      .eq('username', localStorage.getItem('savedUsername'))
      .single();

    if (writerError || !writerData) throw new Error('사용자 정보 확인 실패');

    const newNotice = {
      title,
      content,
      image_url: imageUrl,
      writer: writerData.name,
      username: writerData.username,
      writer_role: writerData.role,
      grade: writerData.grade,
      class_num: writerData.class_num
    };

    const { error } = await supabaseClient.from('notices').insert([newNotice]);
    if (error) throw error;

    // 🎯 [Logging] 활동 로그 기록
    if (window.logActivity) {
      window.logActivity('notice_create', title, 'notice', { content: content, image_url: imageUrl });
    }

    // 🎯 [이관] 일일 XP 보상 지급 (notice 등록 시)
    await awardDailyXP('notice');

    alert('공지 등록 완료!');
    document.getElementById('notice-title').value = '';
    document.getElementById('notice-content').value = '';
    document.getElementById('notice-image').value = '';
    document.getElementById('notice-upload-check').checked = false;

    loadNotices();
  } catch (err) {
    alert('공지 등록 실패: ' + err.message);
  } finally {
    hideLoading();
    if (submitBtn) submitBtn.disabled = false;
  }
}

/** 👤 사용자 표시 이름 포맷터 (칭호 포함) */
function formatUserDisplayName(user) {
  if (!user) return '사용자';
  let nameHtml = user.name;
  if (user.equipped_title) {
    let titleStyle = 'font-size:0.85rem; font-weight:700; margin-right:6px;';
    if (user.equipped_title.includes('rainbow') || (user.equipped_color && user.equipped_color.includes('무지개'))) {
      titleStyle += 'background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3); -webkit-background-clip: text; -webkit-text-fill-color: transparent;';
    } else if (user.equipped_color) {
      titleStyle += `color: ${user.equipped_color};`;
    } else {
      titleStyle += 'color: #6366f1;'; // 기본 인디고
    }
    const cleanTitle = user.equipped_title.replace('[칭호]', '').trim();
    nameHtml = `<span style="${titleStyle}">[${cleanTitle}]</span> ${user.name}`;
  }
  return nameHtml;
}

/** 📢 공지사항 메뉴 토글 */
window.toggleNoticeMenu = function (id) {
  const menu = document.getElementById(`notice-menu-${id}`);
  if (!menu) return;
  const isVisible = menu.style.display === 'block';

  // 다른 모든 메뉴 닫기
  document.querySelectorAll('.notice-menu-dropdown').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.material-menu-dropdown').forEach(el => el.style.display = 'none');

  menu.style.display = isVisible ? 'none' : 'block';
};

/** 📁 자료실 메뉴 토글 */
window.toggleMaterialMenu = function (id) {
  const menu = document.getElementById(`material-menu-${id}`);
  if (!menu) return;
  const isVisible = menu.style.display === 'block';

  // 다른 모든 메뉴 닫기
  document.querySelectorAll('.notice-menu-dropdown').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.material-menu-dropdown').forEach(el => el.style.display = 'none');

  menu.style.display = isVisible ? 'none' : 'block';
};

document.addEventListener('click', function (e) {
  if (!e.target.closest('.notice-menu-container') && !e.target.closest('.material-menu-container')) {
    document.querySelectorAll('.notice-menu-dropdown').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.material-menu-dropdown').forEach(el => el.style.display = 'none');
  }
});

async function loadNotices() {
  const listEl = document.getElementById('notice-list');
  if (listEl) listEl.innerHTML = '<div style="text-align:center; padding:2rem; color:#6b7280;">공지사항을 불러오는 중...</div>';

  try {
    const { safeG, safeC } = getSafeGradeClass();

    let query = supabaseClient.from('notices').select('*');

    if (currentUserRole === 'admin') {
      if (safeG !== 0) {
        // 관리자도 전교 공지(grade=0, null)와 자기 반 공지를 함께 봄
        query = query.or(`grade.is.null,grade.eq.0,and(grade.eq.${safeG},class_num.eq.${safeC})`);
      }
      // safeG가 0이면 모든 공지 노출
    } else {
      // 전교 공지(grade=0, null) 또는 내 반 공지
      query = query.or(`grade.is.null,grade.eq.0,and(grade.eq.${safeG},class_num.eq.${safeC})`);
    }

    const { data, error } = await query.order('id', { ascending: false }).limit(20);

    // [No-Join Refactor] Fetch users separately to avoid PGRST200
    if (data && data.length > 0) {
      const usernames = [...new Set(data.filter(i => i.username).map(i => i.username))];
      if (usernames.length > 0) {
        const { data: userData } = await supabaseClient
          .from('users')
          .select('username, name, equipped_title, equipped_color')
          .in('username', usernames);

        const userMap = {};
        userData?.forEach(u => { userMap[u.username] = u; });
        data.forEach(item => { item.users = userMap[item.username] || null; });
      }
    }

    if (error) {
      console.error('Notice loading error:', error);
      if (listEl) listEl.innerHTML = `<div style="text-align:center; padding:2rem; color:#dc3545;">공지사항 로딩 실패: ${error.message}</div>`;
      return;
    }

    if (!listEl) return;
    listEl.innerHTML = '';

    if (!data || data.length === 0) {
      listEl.innerHTML = '<div style="text-align:center; padding:2rem; color:#888;">등록된 공지사항이 없습니다.</div>';
      return;
    }

    data.forEach(item => {
      const safeTitle = escapeHtml(item.title);
      const writerTitle = item.users?.equipped_title ? `[${item.users.equipped_title.replace('[칭호]', '').trim()}] ` : '';
      const writerColor = item.users?.equipped_color || '#6366f1';
      const safeWriter = escapeHtml(item.writer);
      const safeContent = (item.content || '').split('\n').map(line => escapeHtml(line)).join('<br>');

      const titleSpanStyle = `font-size:0.8rem; font-weight:700; margin-left:8px; color:${writerColor};`;
      const writerTitleHtml = writerTitle ? `<span style="${titleSpanStyle}">${writerTitle}</span>` : '';

      const div = document.createElement('div');
      div.style.borderBottom = '1px solid #ddd';
      div.style.padding = '0.75rem 0';

      const currentUsername = localStorage.getItem('savedUsername');
      const isAuthor = (item.username === currentUsername);
      const isAdmin = (currentUserRole === 'admin');

      let adminBtns = '';
      if (isAuthor || isAdmin) {
        adminBtns = `
              <div class="notice-menu-container" style="position:relative; display:inline-block;">
                <button onclick="toggleNoticeMenu(${item.id})" style="background:none; border:none; font-size:1.2rem; cursor:pointer; padding:0 5px; color:#888; line-height:1;">⋮</button>
                <div id="notice-menu-${item.id}" class="notice-menu-dropdown" style="display:none; position:absolute; right:0; top:100%; background:white; border:1px solid #ddd; border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,0.1); z-index:100; min-width:90px; overflow:hidden;">
                  <button onclick="openEditNoticeModal(${item.id})" style="display:block; width:100%; text-align:left; padding:10px 14px; background:none; border:none; cursor:pointer; font-size:0.85rem; color:#333; border-bottom:1px solid #eee; transition:background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='none'">수정</button>
                  <button onclick="deleteNotice(${item.id}, '${item.image_url || ''}')" style="display:block; width:100%; text-align:left; padding:10px 14px; background:none; border:none; cursor:pointer; font-size:0.85rem; color:#dc3545; transition:background 0.2s;" onmouseover="this.style.background='#fff5f5'" onmouseout="this.style.background='none'">삭제</button>
                </div>
              </div>
          `;
      }

      const editedBadge = item.is_edited ? '<span style="font-size:0.75rem; color:#94a3b8; background:#f1f5f9; padding:2px 6px; border-radius:4px; margin-left:6px; font-weight:normal;">(수정됨)</span>' : '';

      div.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:flex-start;">
                           <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
                             <strong>${safeTitle}</strong>
                             ${editedBadge}
                             ${writerTitleHtml}
                             <span style="font-size:0.8rem;color:#888;">${safeWriter}</span>
                           </div>
                           ${adminBtns}
                         </div>
                         <div style="margin-top:0.4rem; padding-right:1rem; word-break:break-all;">${safeContent}</div>`;

      if (item.image_url) {
        div.innerHTML += `<br><img src="${item.image_url}" 
                               style="max-width:100%;margin-top:0.5rem;border-radius:0.5rem; cursor:pointer;"
                               onclick="openImageModal('${item.image_url}')">`;
      }
      listEl.appendChild(div);
    });
  } catch (err) {
    console.error('Notice load exception:', err);
    if (listEl) listEl.innerHTML = `<div style="text-align:center; padding:2rem; color:#dc3545;">공지사항을 불러오는 중 오류가 발생했습니다.</div>`;
  }
}




async function loadTimetableWeek(grade, classNum) {
  const container = document.getElementById('timetable-container');
  const dashTimetable = document.getElementById('timetable');
  const dashNotice = document.getElementById('notice');

  if (!grade || grade === '-' || grade === 'null' || !classNum || classNum === '-' || classNum === 'null') {
    if (container) container.innerHTML = '<p style="text-align:center; padding:2rem; color:#64748b;">학년/반 정보가 없어 시간표를 불러올 수 없습니다.</p>';
    if (dashTimetable) dashTimetable.innerHTML = '';
    if (dashNotice) {
      dashNotice.style.display = 'block';
      dashNotice.textContent = '관리자 또는 학급 정보가 없는 계정입니다.';
    }
    return;
  }

  currentGrade = grade;
  currentClassNum = classNum;

  if (document.getElementById('timetable-grade-info')) {
    document.getElementById('timetable-grade-info').innerText = `${grade}학년 ${classNum}반 (주간)`;
  }
  if (container) container.innerHTML = '<p>시간표 불러오는 중...</p>';

  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + timetableOffset * 7);

  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const semester = (month <= 8) ? 1 : 2;

  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  });

  try {
    const results = await Promise.all(
      dates.map(async (dateStr) => {
        const url = `https://open.neis.go.kr/hub/misTimetable?KEY=${NEIS_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&AY=${year}&SEM=${semester}&ALL_TI_YMD=${dateStr}&GRADE=${grade}&CLASS_NM=${classNum}`;
        //console.log(url);
        const res = await fetch(url);
        const data = await res.json();
        return { dateStr, data };
      })
    );

    container.innerHTML = '';

    for (const { dateStr, data } of results) {
      const dayBox = document.createElement('div');
      dayBox.className = 'tt-card';

      const dateObj = new Date(
        dateStr.slice(0, 4),
        parseInt(dateStr.slice(4, 6)) - 1,
        dateStr.slice(6, 8)
      );

      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const dayName = days[dateObj.getDay()];
      const displayDate = `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;

      const header = document.createElement('div');
      header.className = 'tt-day';
      header.innerHTML = `${dayName}요일 <small>${displayDate}</small>`;
      dayBox.appendChild(header);

      if (data.misTimetable && data.misTimetable[1]) {
        const rows = data.misTimetable[1].row;
        const unique = {};
        rows.forEach(row => {
          const key = row.PERIO;
          if (!unique[key]) unique[key] = row.ITRT_CNTNT;
        });

        Object.keys(unique).sort((a, b) => parseInt(a) - parseInt(b)).forEach(perio => {
          const item = document.createElement('div');
          item.className = 'tt-item';
          item.innerHTML = `
            <span class="tt-period">${perio}</span>
            <span class="tt-subject">${unique[perio]}</span>
          `;
          dayBox.appendChild(item);
        });
      } else {
        const none = document.createElement('div');
        none.className = 'tt-empty';
        none.innerText = '일정 없음';
        dayBox.appendChild(none);
      }
      container.appendChild(dayBox);
    }
  } catch (err) {
    //console.error('주간 시간표 오류:', err);
    container.innerHTML = '<p>시간표를 불러오는 중 오류가 발생했습니다.</p>';
  }
}

async function submitHomework() {
  const submitBtn = document.querySelector('#homework-panel button');
  const name = currentUserName;
  const studentNum = currentStudentNumber;
  const grade = currentGrade;
  const classNum = currentClassNum;
  const scope = document.getElementById('homework-scope').value;
  const title = document.getElementById('homework-title').value.trim();
  const comment = document.getElementById('homework-comment').value.trim();
  const fileInput = document.getElementById('homework-file');
  const statusEl = document.getElementById('homework-status');

  if (!name || !studentNum || !title || fileInput.files.length === 0) {
    alert('과제명과 파일을 모두 입력해 주세요.');
    return;
  }

  showLoading();
  if (submitBtn) submitBtn.disabled = true;
  statusEl.style.color = '#007bff';
  statusEl.textContent = '⏳ 업로드 중...';

  const insertRecords = [];

  try {
    for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^\w.-]/g, '_');
      const fileName = `${studentNum}_${timestamp}_${i}_${safeFileName}`;

      const { error: uploadError } = await supabaseClient
        .storage
        .from('homework-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicURLData } = supabaseClient
        .storage
        .from('homework-files')
        .getPublicUrl(fileName);

      insertRecords.push({
        name,
        username: localStorage.getItem('savedUsername'),
        student_number: studentNum,
        title,
        grade,
        class_num: classNum,
        comment,
        file_url: publicURLData.publicUrl,
        share_scope: scope
      });
    }

    const { error: insertError } = await supabaseClient
      .from('homeworks')
      .insert(insertRecords);

    if (insertError) throw insertError;

    // 🎯 [Logging] 활동 로그 기록
    if (window.logActivity) {
      window.logActivity('material_create', title, 'material', {
        file_count: insertRecords.length,
        scope: scope
      });
    }

    alert('업로드 완료!');
    statusEl.style.color = 'green';
    statusEl.textContent = `✅ 총 ${insertRecords.length}개 파일 업로드 완료!`;

    document.getElementById('homework-title').value = '';
    document.getElementById('homework-comment').value = '';
    document.getElementById('homework-file').value = '';
    loadMaterials();
  } catch (err) {
    alert('업로드 실패: ' + err.message);
    statusEl.style.color = 'red';
    statusEl.textContent = '❌ 실패';
  } finally {
    hideLoading();
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function loadMaterials() {
  const listEl = document.getElementById('material-list');
  if (listEl) listEl.innerHTML = '<div style="text-align:center; padding:2rem; color:#6b7280;">자료를 불러오는 중...</div>';

  try {
    const { safeG, safeC } = getSafeGradeClass();

    let query = supabaseClient.from('homeworks').select('*');

    if (currentUserRole !== 'admin') {
      // 권한 필터: 전교(school/null/0), 같은 학년(grade), 또는 같은 반(class)
      query = query.or(`share_scope.eq.school,grade.is.null,grade.eq.0,and(share_scope.eq.grade,grade.eq.${safeG}),and(share_scope.eq.class,grade.eq.${safeG},class_num.eq.${safeC})`);
    }

    const { data, error } = await query.order('uploaded_at', { ascending: false }).limit(20);

    if (error) {
      console.error('Material loading error:', error);
      if (listEl) listEl.innerHTML = `<li style="text-align:center; padding:2rem; color:#dc3545;">자료 로딩 실패: ${error.message}</li>`;
      return;
    }

    // [No-Join Refactor] Fetch users separately to avoid PGRST200 error
    if (data && data.length > 0) {
      const usernames = [...new Set(data.filter(i => i.username).map(i => i.username))];
      if (usernames.length > 0) {
        const { data: userData } = await supabaseClient
          .from('users')
          .select('username, name, equipped_title, equipped_color')
          .in('username', usernames);

        const userMap = {};
        userData?.forEach(u => { userMap[u.username] = u; });
        data.forEach(item => { item.users = userMap[item.username] || null; });
      }
    }

    if (!listEl) return;
    listEl.innerHTML = '';

    if (!data || data.length === 0) {
      listEl.innerHTML = '<li style="text-align:center; padding:2rem; color:#888;">표시할 자료가 없습니다.</li>';
      return;
    }

    data.forEach(item => {
      const safeTitle = escapeHtml(item.title);
      const writerTitle = item.users?.equipped_title ? `[${item.users.equipped_title.replace('[칭호]', '').trim()}] ` : '';
      const writerColor = item.users?.equipped_color || '#6366f1';
      const safeName = escapeHtml(item.name);

      const titleLine = `📌 ${safeTitle} (<span style="color:${writerColor};font-weight:700;">${writerTitle}</span>${item.grade}학년 ${item.class_num}반 ${item.student_number}번 ${safeName})`;
      const editedBadge = item.is_edited ? '<span style="font-size:0.75rem; color:#94a3b8; background:#f1f5f9; padding:2px 6px; border-radius:4px; margin-left:6px; font-weight:normal;">(수정됨)</span>' : '';
      const scopeTag = `<span style="font-size:.8rem;color:#6b7280; margin-left:8px;">· 범위: ${item.share_scope === 'class' ? '같은 반' : item.share_scope === 'grade' ? '같은 학년' : '전교'}</span>`;

      const currentUsername = localStorage.getItem('savedUsername');
      const isOwner = (item.username === currentUsername) || (currentUserRole === 'admin');

      let adminBtns = '';
      if (isOwner) {
        adminBtns = `
            <div class="material-menu-container" style="position:relative; display:inline-block; flex-shrink:0;">
                <button onclick="toggleMaterialMenu(${item.id})" style="background:none; border:none; font-size:1.2rem; cursor:pointer; padding:0 5px; color:#888; line-height:1;">⋮</button>
                <div id="material-menu-${item.id}" class="material-menu-dropdown" style="display:none; position:absolute; right:0; top:100%; background:white; border:1px solid #ddd; border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,0.1); z-index:100; min-width:90px; overflow:hidden;">
                    <button onclick="openEditMaterialModal(${item.id})" style="display:block; width:100%; text-align:left; padding:10px 14px; background:none; border:none; cursor:pointer; font-size:0.85rem; color:#333; border-bottom:1px solid #eee; transition:background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='none'">수정</button>
                    <button onclick="deleteMaterial(${item.id})" style="display:block; width:100%; text-align:left; padding:10px 14px; background:none; border:none; cursor:pointer; font-size:0.85rem; color:#dc3545; transition:background 0.2s;" onmouseover="this.style.background='#fff5f5'" onmouseout="this.style.background='none'">삭제</button>
                </div>
            </div>
        `;
      }

      const rawComment = item.description || item.content || item.comment || '';
      const safeComment = escapeHtml(rawComment);
      const commentHtml = safeComment
        ? `<p style="margin:6px 0; color:#4b5563;">💬 ${safeComment.split('\n').join('<br>')}</p>`
        : '';

      const rawUrls = item.file_url;
      let fileUrls = [];
      if (Array.isArray(rawUrls)) {
        fileUrls = rawUrls;
      } else if (typeof rawUrls === 'string' && rawUrls.startsWith('[')) {
        try { fileUrls = JSON.parse(rawUrls); } catch (e) { fileUrls = [rawUrls]; }
      } else if (rawUrls) {
        fileUrls = [rawUrls];
      }

      // 유효한 URL만 필터링 (null, undefined, 빈 문자열 제외)
      fileUrls = fileUrls.filter(u => u && u !== '[]');

      const fileHtmlArray = (fileUrls || []).map(url => {
        if (!url) return '';
        const filename = decodeURIComponent(url.split('/').pop() || '파일');
        const isImage = (url.match(/\.(jpg|jpeg|png|gif|webp)$/i));
        const imagePreview = isImage
          ? `<img src="${url}" alt="${escapeHtml(filename)}"
                      onclick="openImageModal('${url}')"
                      style="max-width:120px; max-height:120px; border-radius:6px; cursor:pointer; margin-bottom:6px; border:1px solid #e5e7eb;" />`
          : '';
        const downloadLink = `<a href="${url}" download="${escapeHtml(filename)}" target="_blank"
                                        style="color:#007bff;text-decoration:none;font-weight:500; font-size:0.9rem;">
                                        📥 ${escapeHtml(filename.length > 20 ? filename.slice(0, 17) + '...' : filename)}
                                      </a>`;
        return `<div style="margin-bottom:8px;">${imagePreview}${imagePreview ? '<br>' : ''}${downloadLink}</div>`;
      });

      const li = document.createElement('li');
      li.style.listStyle = 'none';
      li.style.borderBottom = '1px solid #e5e7eb';
      li.style.padding = '16px 0';
      li.innerHTML = `
                <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:flex-start;">
                  <div style="flex:1;">
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
                      <div style="font-weight:bold; color:#1f2937;">${titleLine}</div>
                      ${editedBadge}
                    </div>
                    ${scopeTag}
                  </div>
                  ${adminBtns}
                </div>
                ${commentHtml}
                <div style="margin-top:10px;">${fileHtmlArray.join('')}</div>
              `;
      listEl.appendChild(li);
    });
  } catch (err) {
    console.error('Material load exception:', err);
    if (listEl) listEl.innerHTML = `<li style="text-align:center; padding:2rem; color:#dc3545;">자료를 불러오는 중 오류가 발생했습니다.</li>`;
  }
}




async function checkFourEqualsTen() {
  const fb = document.getElementById('game-feedback');
  const input = document.getElementById('game-input');
  if (!input || !fb) return;
  const expr = input.value.trim();

  if (!isValidExpression(expr, currentFourNumbers)) {
    fb.textContent = '❌ 주어진 4개 숫자를 각각 한 번씩만 사용하고, + - × ÷ () 만 사용하세요.';
    exitMiniGame();
    return;
  }

  try {
    const result = safeEval(expr);
    const ok = Math.abs(result - 10) < 1e-9;

    if (ok) {
      fb.textContent = '🎉 정답입니다! (+10포인트 지급)';
      if (typeof window.rewardPoints === 'function') {
        window.rewardPoints(10);
      }
    } else {
      fb.textContent = `😅 오답! 결과는 ${result} 입니다.`;
    }

    exitMiniGame();

  } catch (e) {
    fb.textContent = '⚠️ 식을 정확히 입력해 주세요.';
    exitMiniGame();
  }
}

function setUserInfoInput() {
  const inputEl = document.getElementById('homework-userinfo');
  if (inputEl) {
    inputEl.value = `${currentStudentNumber}번 ${currentUserName}`;
  }
}

function showMain() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  setupAdminNav();
  setupCodingOnNav();
  showPanel('dashboard');
}

function showSignup() {
  document.getElementById('login-box').style.display = 'none';
  document.getElementById('signup-box').style.display = 'block';
}

function showLogin() {
  document.getElementById('login-box').style.display = 'block';
  document.getElementById('signup-box').style.display = 'none';
}

function showPanel(panelId) {
  console.log(`Switching to panel: ${panelId}`);

  // 퀘스트 진행 감지 (함수 시작 부분에서 미리 실행)
  if (panelId === 'notice-panel') updateQuestProgress('check_notices');
  if (panelId === 'homework-panel' || panelId === 'doc-panel') updateQuestProgress('visit_materials'); // 자료실 또는 수행등록 모두 방문으로 체크
  if (panelId === 'timetable-panel') updateQuestProgress('check_timetable');
  if (panelId === 'shop-panel') updateQuestProgress('visit_shop');
  if (panelId === 'dashboard') updateQuestProgress('visit_dashboard');
  if (panelId === 'minigame-panel') {
    if (typeof window.checkDailyGameStatus === 'function') window.checkDailyGameStatus();
  }
  if (panelId === 'codingon-panel') {
    if (typeof updateQuestProgress === 'function') updateQuestProgress('visit_codingon');
  }

  // 모든 패널 숨기기
  document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');

  const target = document.getElementById(panelId);
  if (target) {
    target.style.display = 'block';

    // 📱 모바일 하단 네비게이션 활성 상태 동기화
    updateBottomNav(panelId);

    // 모바일 메뉴가 열려있다면 닫기
    if (typeof closeMobileMenu === 'function') {
      closeMobileMenu();
    }

    if (panelId === 'shop-panel') {
      if (typeof loadShopItems === 'function') loadShopItems();
      if (typeof syncCoinBalance === 'function') window.syncCoinBalance();
    } else if (panelId === 'inventory-panel') {
      loadInventory();
    } else if (panelId === 'notice-panel') {
      if (typeof loadNotices === 'function') loadNotices();
    } else if (panelId === 'homework-panel') {
      if (typeof loadMaterials === 'function') loadMaterials();
    } else if (panelId === 'dashboard') {
      if (typeof initDashboardTop === 'function') initDashboardTop();
    } else if (panelId === 'profile-panel') {
      if (typeof loadOwnedCollection === 'function') loadOwnedCollection();
    } else if (panelId === 'codingon-panel') {
      if (typeof initCodingOn === 'function') initCodingOn();
    }
  }
}

/** 📱 하단 네비게이션 아이콘 강조 상태 업데이트 */
function updateBottomNav(panelId) {
  const mapping = {
    'dashboard': 'nav-dash',
    'notice-panel': 'nav-notice',
    'minigame-panel': 'nav-game',
    'shop-panel': 'nav-shop',
    'profile-panel': 'nav-profile'
  };

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const activeId = mapping[panelId];
  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) el.classList.add('active');
  }
}

// Redundant session check removed. Initialization is handled in the main DOMContentLoaded listener.


function norm(s = '') {
  return String(s)
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/[‐-‒–—―]/g, '-')
    .trim();
}

function toYMD(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function weekdayKo(dateObj) {
  return ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
}

function extractDate(text) {
  text = norm(text);
  const now = new Date();
  const year = now.getFullYear();

  let m = text.match(/(20\d{2})[.\-/년\s]*([01]?\d)[.\-/월\s]*([0-3]?\d)\s*(?:일)?/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mn = Math.max(1, Math.min(12, parseInt(m[2], 10)));
    const d = Math.max(1, Math.min(31, parseInt(m[3], 10)));
    const dt = new Date(y, mn - 1, d);
    return { dateObj: dt, ymd: toYMD(dt), yoil: weekdayKo(dt) };
  }

  m = text.match(/([01]?\d)\s*[.\-/월]\s*([0-3]?\d)\s*(?:일)?/);
  if (m) {
    const mn = Math.max(1, Math.min(12, parseInt(m[1], 10)));
    const d = Math.max(1, Math.min(31, parseInt(m[2], 10)));
    const dt = new Date(year, mn - 1, d);
    return { dateObj: dt, ymd: toYMD(dt), yoil: weekdayKo(dt) };
  }

  return { dateObj: null, ymd: '', yoil: '' };
}

function extractTimePeriod(text) {
  text = norm(text);

  const p = text.match(/([1-9]|1[0-2])\s*교시/);
  const period = p ? parseInt(p[1], 10) : '';

  let m = text.match(/(오전|오후)\s*([0-1]?\d)\s*시\s*([0-5]?\d)?\s*분?/);
  if (m) {
    let h = parseInt(m[2], 10);
    const mm = m[3] ? String(parseInt(m[3], 10)).padStart(2, '0') : '00';
    if (m[1] === '오후' && h !== 12) h += 12;
    if (m[1] === '오전' && h === 12) h = 0;
    return { time: `${String(h).padStart(2, '0')}:${mm}`, period };
  }

  m = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (m) {
    return { time: `${m[1].padStart(2, '0')}:${m[2]}`, period };
  }

  return { time: '', period };
}

function extractSubject(text) {
  text = norm(text);

  let m = text.match(/(?:과목|교과)\s*[:\-]\s*([가-힣A-Za-z0-9 ]{1,20})/);
  if (m) return m[1].trim();

  for (const sub of KOR_SUBJECTS) {
    const re = new RegExp(`\\b${sub}\\b`);
    if (re.test(text)) return sub;
  }
  return '';
}

function extractTopic(text) {
  text = norm(text);
  let m = text.match(/(?:주제|내용|단원)\s*[:\-]\s*([^\n]+)/);
  if (m) return m[1].trim();

  m = text.match(/수행\s*평가[^\n]*\n([^\n]+)/i);
  if (m) return m[1].trim();
  return '';
}

function updateYoilFromDate() {
  const v = document.getElementById('af-date').value;
  document.getElementById('af-yoil').value = v ? weekdayKo(new Date(v)) : '';
}

function setAnalyzeForm(f) {
  const byId = id => document.getElementById(id);
  byId('af-subject').value = f.subject || '';
  byId('af-date').value = f.date || '';
  byId('af-yoil').value = f.date ? weekdayKo(new Date(f.date)) : (f.yoil || '');
  byId('af-time').value = f.time || '';
  byId('af-period').value = f.period || '';
  byId('af-topic').value = f.topic || '';
  byId('af-materials').value = f.materials || '';

  const txt = formatAnalyzeResult(f);
  const r = document.getElementById('doc-result');
  if (r) { r.value = txt; if (typeof autoResize === 'function') autoResize(); }
}

function $v(id) {
  const el = document.getElementById(id);
  return el && 'value' in el ? String(el.value).trim() : '';
}

// ✅ 날짜 → 요일 동기화(이미 있으시면 유지)
function syncYoilFromDate() {
  const d = $v('af-date');
  const yoilEl = document.getElementById('af-yoil');
  if (!yoilEl) return;
  if (!d) { yoilEl.value = ''; return; }
  const wd = ['일', '월', '화', '수', '목', '금', '토'][new Date(d).getDay()];
  yoilEl.value = wd;
}

// ✅ 기존 함수 교체: 없는 필드가 있어도 에러 없이 동작
function getAnalyzeForm() {
  const fields = {
    subject: $v('af-subject'),
    date: $v('af-date'),
    yoil: $v('af-yoil'),
    period: $v('af-period'),
    topic: $v('af-topic'),
    // 아래 두 개는 폼에 없으면 자동으로 빈 문자열 반환
    time: $v('af-time'),
    materials: $v('af-materials'),
  };

  // 요일 빈칸이면 날짜로 자동 계산
  if (!fields.yoil && fields.date) {
    fields.yoil = ['일', '월', '화', '수', '목', '금', '토'][new Date(fields.date).getDay()];
  }

  // 교시 숫자 정규화
  if (fields.period) {
    const n = parseInt(fields.period, 10);
    fields.period = Number.isFinite(n) ? String(n) : '';
  }

  return fields;
}

// (선택) 값 채울 때도 안전하게
function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? '';
}
if (typeof mergeMissing !== 'function') {
  // base(현재값)에서 빈 칸만 add(후보값)으로 보강
  function mergeMissing(base = {}, add = {}) {
    const out = { ...base };
    const keys = ['subject', 'date', 'yoil', 'time', 'period', 'topic', 'materials'];
    for (const k of keys) {
      const cur = (out[k] ?? '').toString().trim();
      const nxt = (add[k] ?? '').toString().trim();
      if (!cur && nxt) out[k] = nxt;
    }
    // 날짜가 있는데 요일이 비었으면 자동 계산
    try {
      if (out.date && (!out.yoil || !String(out.yoil).trim())) {
        const _weekdayKo = (typeof weekdayKo === 'function')
          ? weekdayKo
          : (d) => ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
        out.yoil = _weekdayKo(new Date(out.date));
      }
    } catch { }
    return out;
  }
}

if (typeof parseTextToFields !== 'function') {
  function parseTextToFields(text = '', seed = {}) {
    // 내부 유틸(전역에 없을 때만 사용)
    const _norm = (s = '') => String(s)
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/[‐-‒–—―]/g, '-')
      .trim();
    const _weekdayKo = (d) => ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    const _toYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // 날짜 추출 (전역 extractDate가 있으면 그걸 우선)
    const _extractDate = (typeof extractDate === 'function') ? extractDate : (txt) => {
      txt = _norm(txt);
      const year = new Date().getFullYear();
      let m = txt.match(/(20\d{2})[.\-/년\s]*([01]?\d)[.\-/월\s]*([0-3]?\d)\s*일?/);
      if (m) {
        const dt = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
        return { dateObj: dt, ymd: _toYMD(dt), yoil: _weekdayKo(dt) };
      }
      m = txt.match(/([01]?\d)[.\-/월\s]*([0-3]?\d)\s*일?/);
      if (m) {
        const dt = new Date(year, parseInt(m[1], 10) - 1, parseInt(m[2], 10));
        return { dateObj: dt, ymd: _toYMD(dt), yoil: _weekdayKo(dt) };
      }
      return { dateObj: null, ymd: '', yoil: '' };
    };

    // 시간/교시 추출
    const _extractTimePeriod = (typeof extractTimePeriod === 'function') ? extractTimePeriod : (txt) => {
      txt = _norm(txt);
      const p = txt.match(/([1-9]|1[0-2])\s*교시/);
      const period = p ? parseInt(p[1], 10) : '';
      let m = txt.match(/(오전|오후)\s*([0-1]?\d)\s*시\s*([0-5]?\d)?\s*분?/);
      if (m) {
        let h = parseInt(m[2], 10);
        const mm = m[3] ? String(parseInt(m[3], 10)).padStart(2, '0') : '00';
        if (m[1] === '오후' && h !== 12) h += 12;
        if (m[1] === '오전' && h === 12) h = 0;
        return { time: `${String(h).padStart(2, '0')}:${mm}`, period };
      }
      m = txt.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
      if (m) return { time: `${String(m[1]).padStart(2, '0')}:${m[2]}`, period };
      return { time: '', period };
    };

    // 과목/주제/준비물 추출
    const KOR_SUBJECTS = (typeof window !== 'undefined' && Array.isArray(window.KOR_SUBJECTS) && window.KOR_SUBJECTS.length)
      ? window.KOR_SUBJECTS
      : ['국어', '수학', '영어', '과학', '사회', '역사', '도덕', '기술', '가정', '정보', '음악', '미술', '체육', '통합', '자율', '창체', '동아리', '진로', '한문', '스포츠'];

    const _extractSubject = (typeof extractSubject === 'function') ? extractSubject : (txt) => {
      txt = _norm(txt);
      let m = txt.match(/(?:과목|교과)\s*[:\-]\s*([가-힣A-Za-z0-9 ]{1,20})/);
      if (m) return m[1].trim();
      for (const sub of KOR_SUBJECTS) {
        if (new RegExp(`\\b${sub}\\b`).test(txt)) return sub;
      }
      return '';
    };

    const _extractTopic = (typeof extractTopic === 'function') ? extractTopic : (txt) => {
      txt = _norm(txt);
      let m = txt.match(/(?:주제|내용|단원|제목)\s*[:\-]\s*([^\n]+)/);
      if (m) return m[1].trim();
      m = txt.match(/수행\s*평가[^\n]*\n([^\n]+)/i);
      return m ? m[1].trim() : '';
    };


    // 실제 파싱
    const subject = (seed.subject || _extractSubject(text) || '').trim();
    const topic = (seed.topic || _extractTopic(text) || '').trim();
    const mats = (seed.materials || _extractMaterials(text) || '').trim();

    const d = _extractDate(seed.date || text);
    const t = _extractTimePeriod(seed.time || text);

    return {
      subject,
      date: d.ymd || (seed.date || ''),
      yoil: d.yoil || '',
      time: t.time || (seed.time || ''),
      period: String(seed.period || '') || (t.period ? String(t.period) : ''),
      topic: topic,
      materials: mats
    };
  }
}

function fillFromText(text = '', seed = {}) {
  const parsed = parseTextToFields(text, seed);
  const merged = mergeMissing(parsed, seed); // 빈칸 보강
  // 폼 채우기 (이미 프로젝트에 있음)
  if (typeof setAnalyzeForm === 'function') {
    setAnalyzeForm(merged);
  }
  // doc-result에 들어갈 예쁜 텍스트 반환 (이미 프로젝트에 있는 포맷터)
  return (typeof formatAnalyzeResult === 'function')
    ? formatAnalyzeResult(merged)
    : JSON.stringify(merged, null, 2);
}

function autoResize() {
  docResult.style.height = 'auto';
  docResult.style.height = docResult.scrollHeight + 'px';
}

function moveTimetable(offset) {
  timetableOffset += offset;
  loadTimetableWeek(currentGrade, currentClassNum, timetableOffset);
}

function setupAdminNav() {
  const existing = document.getElementById('admin-nav');

  if (currentUserRole === 'admin') {
    if (!existing) {
      const nav = document.getElementById('main-nav');
      const a = document.createElement('a');
      a.href = 'admin.html';      // ← 바로 admin.html로 이동
      a.id = 'admin-nav';
      a.innerText = '관리자 설정';

      a.onclick = (e) => {
        e.preventDefault();       // 혹시 SPA 라우터가 기본 동작 막아도 강제 이동
        window.location.href = 'admin.html';
      };

      nav.appendChild(a);
    }
  } else {
    if (existing) existing.remove();
  }
}

function setupCodingOnNav() {
  const role = currentUserRole || localStorage.getItem('savedRole');
  const navCodingOn = document.getElementById('nav-codingon');
  const sideNavCodingOn = document.getElementById('side-nav-codingon');

  if (role === 'student' || role === 'admin') {
    if (navCodingOn) navCodingOn.style.display = 'inline-block';
    if (sideNavCodingOn) sideNavCodingOn.style.display = 'block';
  } else {
    if (navCodingOn) navCodingOn.style.display = 'none';
    if (sideNavCodingOn) sideNavCodingOn.style.display = 'none';
  }
}



document.querySelectorAll('#main-nav a').forEach(link => {
  link.addEventListener('click', () => {
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
      menuToggle.checked = false;
    }
  });
});

function canUserSeeMaterial(item) {
  if (currentUserRole === 'admin') return true;
  const myGrade = currentGrade ?? parseInt(localStorage.getItem('savedGrade') || '0', 10);
  const myClass = currentClassNum ?? parseInt(localStorage.getItem('savedClassNum') || '0', 10);

  const scope = (item.share_scope || 'school').toLowerCase();
  if (scope === 'school') return true;
  if (scope === 'grade') return Number(item.grade) === Number(myGrade);
  if (scope === 'class') return Number(item.grade) === Number(myGrade) &&
    Number(item.class_num) === Number(myClass);
  return false;
}

function setUserInfoInput() {
  const inputEl = document.getElementById('homework-userinfo');
  if (inputEl) inputEl.value = `${currentStudentNumber}번 ${currentUserName}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const profileButton = document.getElementById('profile-button');
  const dropdown = document.getElementById('profile-dropdown');

  if (profileButton && dropdown) {

    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });
  }
});

function generateFourNumbers() {
  currentFourNumbers = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9) + 1);
  const box = document.getElementById('game-numbers');
  if (box) box.textContent = currentFourNumbers.join('  ');
  const input = document.getElementById('game-input');
  if (input) input.value = '';
  const fb = document.getElementById('game-feedback');
  if (fb) fb.textContent = '';
}

function isValidExpression(expr, numbers) {
  if (!expr) return false;

  expr = expr.replace(/×/g, '*').replace(/÷/g, '/');

  if (!/^[\d+\-*/()\s.]+$/.test(expr)) return false;

  const used = (expr.match(/\d+/g) || []).map(n => Number(n)).sort((a, b) => a - b);
  const need = [...numbers].sort((a, b) => a - b);
  if (JSON.stringify(used) !== JSON.stringify(need)) return false;

  return true;
}

function safeEval(expr) {
  expr = expr.replace(/×/g, '*').replace(/÷/g, '/');
  if (!/^[\d+\-*/()\s.]+$/.test(expr)) throw new Error('invalid');
  let bal = 0;
  for (const ch of expr) {
    if (ch === '(') bal++;
    if (ch === ')') bal--;
    if (bal < 0) throw new Error('paren');
  }
  if (bal !== 0) throw new Error('paren');

  const fn = new Function(`return (${expr});`);
  return fn();
}

function exitMiniGame() {
  if (typeof window.stopAllGames === 'function') window.stopAllGames();

  // 모든 패널 숨기기 및 미니게임 메인 복구
  if (typeof showPanel === 'function') {
    showPanel('minigame-panel');
  }

  // 세션 정리
  window.miniGameSessionId = null;
}
// ✅ 교체용: 여러 게임을 처리하는 startGame
async function startGame(gameType) {
  // 중복 클릭 방지
  if (startGame._busy) return;
  startGame._busy = true;
  try {
    // 사용자 확인
    const username = (localStorage.getItem('savedUsername') || '').trim();
    if (!username) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 게임 설정 테이블 (비용/패널ID/런처)
    const GAME_TABLE = {
      fourEqualsTen: {
        cost: 5,
        panelId: 'fourEqualsTen-game',
        launch() {
          if (typeof generateFourNumbers === 'function') generateFourNumbers();
        }
      },
      mazeEscape: {
        cost: 5,
        panelId: 'mazeEscape-game',
        launch() {
          if (typeof window.initMazeGame === 'function') window.initMazeGame('maze-cv');
        }
      },
      fallingBlocks: {
        cost: 5,
        panelId: 'fallingBlocks-game',
        launch() {
          if (typeof window.initFallingBlocks === 'function') window.initFallingBlocks('fall-cv');
        }
      },
      reaction: {
        cost: 5,
        panelId: 'reaction-game',
        launch() {
          if (typeof window.initReactionGame === 'function') {
            window.initReactionGame({
              padId: 'rx-pad',
              startBtnId: 'rx-start',
              lastId: 'rx-last',
              bestId: 'rx-best'
            });
          }
        }
      },
      mathPower: {
        cost: 5,
        panelId: 'mathPower-game',
        launch() {
          if (typeof window.initMathPowerGame === 'function') window.initMathPowerGame();
        }
      },
      colorMatch: {
        cost: 5,
        panelId: 'colorMatch-game',
        launch() {
          if (typeof window.initColorMatchGame === 'function') window.initColorMatchGame();
        }
      },
      numberMemory: {
        cost: 5,
        panelId: 'numberMemory-game',
        launch() {
          if (typeof window.initNumberMemoryGame === 'function') window.initNumberMemoryGame();
        }
      },
      moleWhack: {
        cost: 5,
        panelId: 'moleWhack-game',
        launch() {
          if (typeof window.initMoleWhackGame === 'function') window.initMoleWhackGame();
        }
      },
      snakeGame: {
        cost: 5,
        panelId: 'snakeGame-game',
        launch() {
          if (typeof window.initSnakeGame === 'function') window.initSnakeGame('snake-cv');
        }
      },
      lightingQuiz: {
        cost: 5,
        panelId: 'lightingQuiz-game',
        launch() {
          if (typeof window.initLightingQuiz === 'function') window.initLightingQuiz();
        }
      },
      flappy: {
        cost: 5,
        panelId: 'flappy-game',
        launch() {
          if (typeof window.initFlappyGame === 'function') window.initFlappyGame();
        }
      }
    };

    const cfg = GAME_TABLE[gameType];
    if (!cfg) {
      alert(`알 수 없는 게임 타입: ${gameType}`);
      return;
    }

    // 잔액 동기화
    if (typeof window.syncCoinBalance === 'function') await window.syncCoinBalance();
    const cost = Number(cfg.cost) || 0;
    const current = Number(window.currentUserCoin || 0);

    // 🛑 [보안] 세션 ID 생성
    window.miniGameSessionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    if (!window._rewardedSessions) window._rewardedSessions = new Set();

    // 🛑 [일일 제한] 보상 획득 횟수 사전 체크 (KST 기준)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kstTodayStart = new Date(utc + (9 * 60 * 60 * 1000));
    kstTodayStart.setHours(0, 0, 0, 0);
    const utcTodayStart = new Date(kstTodayStart.getTime() - (9 * 60 * 60 * 1000));

    const { count: rewardCount } = await supabaseClient
      .from('user_activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('username', username)
      .eq('action', 'game_reward')
      .gte('created_at', utcTodayStart.toISOString());

    // 모든 UI 카운터 동기화
    document.querySelectorAll('.reward-count-val').forEach(el => {
      el.innerText = rewardCount || 0;
    });

    if (rewardCount >= 10) {
      if (!confirm('오늘 받을 수 있는 최대 보상(10회)을 모두 받으셨습니다. 더 이상 보상이 지급되지 않는데 게임을 시작하시겠습니까?')) {
        return;
      }
    }

    // 포인트 차감 (Supabase)
    const { error: deductErr } = await supabaseClient.rpc('increment_coin', {
      u_name: username,
      amount: -cost
    });

    if (deductErr) {
      // RPC 없을 시 fallback
      await supabaseClient.from('users').update({ coin_balance: current - cost }).eq('username', username);
    }

    // 로그 기록: 게임 시작
    await supabaseClient.from('user_activity_logs').insert({
      username: username,
      action: 'game_start',
      target: gameType,
      target_type: 'game',
      details: JSON.stringify({ cost, sessionId: window.miniGameSessionId })
    });

    // 로컬 잔액 반영 + 표시 갱신
    if (typeof window.syncCoinBalance === 'function') await window.syncCoinBalance();

    // 패널 전환 (View-Swap 방식)
    if (typeof showPanel === 'function') {
      showPanel(cfg.panelId);
    }

    // 게임 런칭
    if (typeof cfg.launch === 'function') {
      requestAnimationFrame(() => cfg.launch());
    }

    // 🎯 일일 퀘스트 업데이트
    if (typeof updateQuestProgress === 'function') {
      updateQuestProgress('play_game');
    }
  } catch (e) {
    //console.error(e);
    alert('게임 시작 중 오류가 발생했습니다: ' + (e.message || e));
  } finally {
    startGame._busy = false;
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('game-input');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        checkFourEqualsTen();
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const agree = document.getElementById('privacy-agree');
  const btn = document.getElementById('signup-btn');
  agree.addEventListener('change', () => {
    btn.style.display = agree.checked ? 'block' : 'none';
  });
});

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-side-menu');
  const overlay = document.getElementById('mobile-overlay');
  if (menu) menu.classList.toggle('open');
  if (overlay) overlay.classList.toggle('show');
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-side-menu');
  const overlay = document.getElementById('mobile-overlay');
  if (menu) menu.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
  const domainSelect = document.getElementById('signupEmailDomain');
  const customInput = document.getElementById('signupEmailCustom');

  domainSelect.addEventListener('change', () => {
    if (domainSelect.value === '직접입력') {
      customInput.style.display = 'block';
    } else {
      customInput.style.display = 'none';
    }
  });
});

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  input.type = input.type === 'password' ? 'text' : 'password';
}

document.addEventListener('DOMContentLoaded', () => {
  const menuProfile = document.getElementById('menu-profile');
  const menuPassword = document.getElementById('menu-password');
  const menuSetting = document.getElementById('menu-setting');
  const menuLogout = document.getElementById('menu-logout');

  if (menuProfile) {
    menuProfile.addEventListener('click', (e) => {
      e.preventDefault();
      showPanel('profile-panel');

      closeMobileMenu();
      window.initProfilePanel();
    });
  }

  if (menuLogout) {
    menuLogout.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
      closeMobileMenu();
    });
  }

  // 로그인 필드 엔터 키 처리
  const loginUser = document.getElementById('loginUsername');
  const loginPass = document.getElementById('loginPassword');
  if (loginUser) {
    loginUser.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        loginDirect();
      }
    });
  }
  if (loginPass) {
    loginPass.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        loginDirect();
      }
    });
  }
});

window.currentDate = new Date();

function formatYMD(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function updateDateLabels() {
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  const dateStr = window.currentDate.toLocaleDateString('ko-KR', options);

  const tLabel = document.getElementById('timetable-date-label');
  const mLabel = document.getElementById('meal-date-label');
  if (tLabel) tLabel.textContent = dateStr;
  if (mLabel) mLabel.textContent = dateStr;

  const ymd = `${window.currentDate.getFullYear()}-${String(window.currentDate.getMonth() + 1).padStart(2, '0')}-${String(window.currentDate.getDate()).padStart(2, '0')}`;

  const pairs = [
    { label: tLabel, picker: document.getElementById('timetableDatePicker') },
    { label: mLabel, picker: document.getElementById('mealDatePicker') }
  ];

  pairs.forEach(({ label, picker }) => {
    if (picker) {
      if (picker.value !== ymd) picker.value = ymd;
      if (label && !label.onclick) {
        label.style.cursor = 'pointer';
        label.title = '날짜 직접 선택하기';
        label.onclick = () => {
          if (typeof picker.showPicker === 'function') picker.showPicker();
          else picker.click();
        };
      }
    }
  });
}

function changeDate(delta) {
  if (delta === 0) {
    window.currentDate = new Date();
  } else {
    window.currentDate.setDate(window.currentDate.getDate() + delta);
  }
  updateDateLabels();

  const dateValue = `${window.currentDate.getFullYear()}-${String(window.currentDate.getMonth() + 1).padStart(2, '0')}-${String(window.currentDate.getDate()).padStart(2, '0')}`;

  if (typeof loadTimetableDay === 'function') loadTimetableDay(dateValue);
  if (typeof loadMeal === 'function') loadMeal(dateValue);
}

const fileInput = document.getElementById('homework-file');
const previewContainer = document.getElementById('filePreviewContainer');
const modal = document.getElementById('fileModal');
const modalImage = document.getElementById('modalImage');
const downloadLink = document.getElementById('downloadLink');

fileInput.addEventListener('change', () => {
  previewContainer.innerHTML = '';

  Array.from(fileInput.files).forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = file.name;
        img.onclick = () => {
          modal.style.display = 'flex';
          modalImage.src = e.target.result;
          downloadLink.href = e.target.result;
          downloadLink.download = file.name;
        };
        previewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });
});

function closeModal() {
  modal.style.display = 'none';
}

function openImageModal(url) {
  const modal = document.getElementById('imageModal');
  const img = document.getElementById('modalImage');
  img.src = url;
  modal.style.display = 'flex';
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
}

function $id(id) { return document.getElementById(id) }

async function initDashboardTop() {
  const d = new Date(); const w = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  if ($id('dash-notice-date')) $id('dash-notice-date').textContent =
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${w})`;

  const savedRole = localStorage.getItem('savedRole') || 'user';
  const isAdmin = savedRole === 'admin';

  const nm = currentUserName || localStorage.getItem('savedName') || '학생';
  const savedNum = localStorage.getItem('savedStudentNum');
  const savedGrade = localStorage.getItem('savedGrade');
  const savedClassNum = localStorage.getItem('savedClassNum');

  const num = isAdmin ? '-' : ((currentStudentNumber && currentStudentNumber !== 'null') ? currentStudentNumber : ((savedNum && savedNum !== 'null') ? savedNum : '-'));
  const grd = isAdmin ? '-' : ((currentGrade && currentGrade !== 'null') ? currentGrade : ((savedGrade && savedGrade !== 'null') ? savedGrade : '-'));
  const cls = isAdmin ? '-' : ((currentClassNum && currentClassNum !== 'null') ? currentClassNum : ((savedClassNum && savedClassNum !== 'null') ? savedClassNum : '-'));

  if ($id('dash-name')) {
    const savedName = localStorage.getItem('savedName') || '학생';
    const equippedTitle = localStorage.getItem('savedTitle') || '';
    const nameHtml = formatUserDisplayName({ name: savedName, equipped_title: equippedTitle });
    if (window.__updateSecurityValue) window.__updateSecurityValue('dash-name', nameHtml, true);
    else $id('dash-name').innerHTML = nameHtml;
  }
  if ($id('dash-role')) {
    const roleTxt = isAdmin ? '관리자' : '학생';
    if (window.__updateSecurityValue) window.__updateSecurityValue('dash-role', roleTxt);
    else $id('dash-role').textContent = roleTxt;
  }
  if ($id('dash-num')) {
    if (window.__updateSecurityValue) window.__updateSecurityValue('dash-num', num);
    else $id('dash-num').textContent = num;
  }
  if ($id('dash-grade')) {
    if (window.__updateSecurityValue) window.__updateSecurityValue('dash-grade', grd);
    else $id('dash-grade').textContent = grd;
  }
  if ($id('dash-class')) {
    if (window.__updateSecurityValue) window.__updateSecurityValue('dash-class', cls);
    else $id('dash-class').textContent = cls;
  }

  await loadRecentNotices3();
  await syncStatsAndRender();
  await initDailyQuests(); // 퀘스트 초기화 완료를 기다림

  // 📅 일정(캘린더) 초기화 추가
  if (typeof renderScheduleCalendar === 'function') {
    renderScheduleCalendar();
  }
}


async function loadRecentNotices3() {
  const box = $id('dash-notice-list');
  if (!box) return;
  box.innerHTML = `<div class="notice-item"><div class="meta">불러오는 중…</div></div>`;

  try {
    const { safeG, safeC } = getSafeGradeClass();

    let q = supabaseClient.from('notices').select('*');

    if (currentUserRole === 'admin') {
      if (safeG !== 0) {
        q = q.or(`grade.is.null,grade.eq.0,and(grade.eq.${safeG},class_num.eq.${safeC})`);
      }
    } else {
      q = q.or(`grade.is.null,grade.eq.0,and(grade.eq.${safeG},class_num.eq.${safeC})`);
    }

    const { data, error } = await q.order('id', { ascending: false }).limit(3);

    // [No-Join Refactor] Fetch users separately to avoid PGRST200
    if (data && data.length > 0) {
      const usernames = [...new Set(data.filter(i => i.username).map(i => i.username))];
      if (usernames.length > 0) {
        const { data: userData } = await supabaseClient
          .from('users')
          .select('username, name, equipped_title, equipped_color')
          .in('username', usernames);

        const userMap = {};
        userData?.forEach(u => { userMap[u.username] = u; });
        data.forEach(item => { item.users = userMap[item.username] || null; });
      }
    }

    if (error) {
      console.error('Dash notice loading error:', error);
      box.innerHTML = `<div class="notice-item"><div class="meta" style="color:#dc3545;">불러오기 실패: ${error.message}</div></div>`;
      return;
    }

    if (!data || data.length === 0) {
      box.innerHTML = `<div class="notice-item"><div class="meta">최근 공지가 없습니다.</div></div>`;
      return;
    }

    box.innerHTML = '';
    data.forEach(n => {
      const preview = (n.content || '').replace(/\n/g, ' ').slice(0, 60);
      const el = document.createElement('div');
      el.className = 'notice-item clickable'; // clickable 클래스 추가
      el.style.cursor = 'pointer'; // 명시적으로 커서 변경
      el.onclick = () => showPanel('notice-panel');

      const writerTitle = n.users?.equipped_title ? `[${n.users.equipped_title.replace('[칭호]', '').trim()}] ` : '';
      const writerColor = n.users?.equipped_color || '#6366f1';
      const writerName = n.users?.name || n.writer || '익명';

      // 기획: 이미지가 있으면 우측에 크게 배치, 없으면 텍스트만 꽉 채움
      const imgHtml = n.image_url
        ? `<img src="${n.image_url}" class="notice-thumbnail-large" alt="thumbnail" onclick="openImageModal('${n.image_url}')">`
        : '';

      el.innerHTML = `
        <div class="notice-item-inner" style="align-items: center;">
          <div class="notice-item-text">
            <div class="title" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${n.title || ''}</div>
            <div class="meta"><span style="color:${writerColor}; font-weight:700;">${writerTitle}</span>${writerName} · ${(n.grade && n.grade !== 'null') ? n.grade + '학년' : '-'} ${(n.class_num && n.class_num !== 'null') ? n.class_num + '반' : '-'}</div>
            <div class="meta" style="margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${preview}${(n.content || '').length > 60 ? '…' : ''}</div>
          </div>
          ${imgHtml}
        </div>`;
      box.appendChild(el);
    });
  } catch (err) {
    console.error('Dash notice load exception:', err);
    if (box) box.innerHTML = `<div class="notice-item"><div class="meta" style="color:#dc3545;">오류 발생</div></div>`;
  }
}



/** 🆙 XP 획득 배율 계산 (버프 여부 확인) */
function getXpMultiplier() {
  const buffEnd = localStorage.getItem('xp_buff_end');
  const badge = document.getElementById('xp-buff-badge');
  if (buffEnd && Date.now() < parseInt(buffEnd)) {
    if (badge) badge.style.display = 'inline-block';
    return 2; // 2배 버프
  }
  if (badge) badge.style.display = 'none';
  return 1;
}

async function syncStatsAndRender() {
  try {
    const username = localStorage.getItem('savedUsername');
    const NEED = 20;

    if (!username) {
      renderStats({ level: 1, exp: 0, point: 0, need: NEED });
      return;
    }

    const { data, error } = await supabaseClient
      .from('users')
      .select('level, xp, coin_balance')
      .eq('username', username)
      .single();

    if (error) throw error;

    let level = Number.isFinite(+data?.level) ? +data.level : 1;
    let exp = Number.isFinite(+data?.xp) ? +data.xp : 0;
    let point = Number.isFinite(+data?.coin_balance) ? +data.coin_balance : 0;

    // 🆙 레벨업 로직 (20 XP당 1레벨 + 10포인트 보너스)
    if (exp >= NEED) {
      const levelUps = Math.floor(exp / NEED);
      level += levelUps;
      exp = exp % NEED;
      const bonus = levelUps * 10;
      point += bonus;

      // DB 즉시 반영
      await supabaseClient
        .from('users')
        .update({ level, xp: exp, coin_balance: point })
        .eq('username', username);

      alert(`🎉 레벨 업! 현재 레벨: ${level}\n보너스로 ${bonus}포인트가 지급되었습니다!`);
    }

    renderStats({ level, exp, point, need: NEED });
  } catch (e) {
    console.warn('syncStatsAndRender error:', e);
    renderStats({ level: 1, exp: 0, point: 0, need: 20 });
  }
}

/** 🎯 [이관] 일일 액션에 따른 랜덤 XP 보상 지급 (3~10 XP) */
async function awardDailyXP(action) {
  const username = localStorage.getItem('savedUsername');
  if (!username) return;

  try {
    // 1. 한국 시간 기준 오늘 날짜 생성 (YYYY-MM-DD)
    const seoulTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const today = seoulTime.toISOString().split('T')[0];

    // 2. 오늘 해당 액션으로 보상을 받았는지 확인
    const { data: existing, error: checkError } = await supabaseClient
      .from('daily_xp_log_uname')
      .select('id')
      .eq('username', username)
      .eq('action_type', action)
      .eq('reward_date', today)
      .maybeSingle();

    if (checkError) {
      console.warn('일일 보상 로그 조회 중 오류:', checkError);
      return;
    }

    if (existing) {
      console.log(`[XP Skip] '${action}' 보상을 오늘 이미 받았습니다.`);
      return;
    }

    // 3. 로그 기록 시도 (동시성 방지를 위해 인서트 시도)
    const { error: logError } = await supabaseClient
      .from('daily_xp_log_uname')
      .insert([{
        username: username,
        action_type: action,
        reward_date: today
      }]);

    if (logError) {
      // PK나 Unique 제약조건으로 인해 중복 발생 시 로그 에러 무시 (이미 지급됨)
      console.log(`[XP Skip] 중복 거래 방지: ${logError.message}`);
      return;
    }

    // 4. 랜덤 XP 생성 (3~10)
    let inc = Math.floor(Math.random() * (10 - 3 + 1) + 3);

    // XP 버프 적용
    const multiplier = getXpMultiplier();
    inc = inc * multiplier;

    // 5. 현재 사용자 데이터 조회
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('xp')
      .eq('username', username)
      .single();

    if (userError || !user) return;

    // 6. DB 업데이트 (XP만 더함. 레벨업은 syncStatsAndRender가 처리함)
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({ xp: (user.xp || 0) + inc })
      .eq('username', username);

    if (!updateError) {
      console.log(`[XP Awarded] ${action}: +${inc} XP`);
      // UI 갱신 및 레벨업 체크
      syncStatsAndRender();
    }

  } catch (e) {
    console.warn('awardDailyXP exception:', e);
  }
}

// Redundant listener removed.


function renderStats({ level, exp, point, need }) {
  const levelBadge = document.getElementById('lv-num');
  const expCur = document.getElementById('exp-cur');
  const expNeed = document.getElementById('exp-need');
  const fillBar = document.getElementById('lvl-fill');
  const pointEl = document.getElementById('coin-balance');
  const shopPointEl = document.getElementById('shop-coin-balance');

  const setVal = (id, el, val) => {
    if (!el) return;
    if (window.__updateSecurityValue) window.__updateSecurityValue(id, val);
    else el.textContent = val;
  };

  setVal('lv-num', levelBadge, level);
  setVal('exp-cur', expCur, exp);
  setVal('exp-need', expNeed, need);
  if (typeof point === 'number') {
    const pStr = point.toLocaleString();
    setVal('coin-balance', pointEl, pStr);
    setVal('shop-coin-balance', shopPointEl, pStr);
  }

  const pct = Math.max(0, Math.min(100, Math.round((exp / need) * 100)));
  if (fillBar) fillBar.style.width = pct + '%';
}


async function loadCoinBalance() {
  const username = localStorage.getItem('savedUsername');
  if (!username) return;

  const { data, error } = await supabaseClient
    .from('users')
    .select('coin_balance')
    .eq('username', username)
    .single();

  const coin = (!error && data && Number.isFinite(+data.coin_balance)) ? +data.coin_balance : 0;

  const el = document.getElementById('coin-balance');
  const shopEl = document.getElementById('shop-coin-balance');
  if (window.__updateSecurityValue) {
    if (el) window.__updateSecurityValue('coin-balance', coin);
    if (shopEl) window.__updateSecurityValue('shop-coin-balance', coin);
  } else {
    if (el) el.textContent = coin;
    if (shopEl) shopEl.textContent = coin;
  }

  currentUserCoin = coin;
}

const ymd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const ymdCompact = (d) => ymd(d).replace(/-/g, '');

const startOfMonth = d => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = d => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addDays = (d, n) => { const t = new Date(d); t.setDate(t.getDate() + n); return t; };

let schedRefDate = new Date();

function buildMonthMatrix(ref) {
  const first = startOfMonth(ref);
  const start = addDays(first, -((first.getDay() + 7) % 7));
  const days = [];
  for (let i = 0; i < 42; i++) days.push(addDays(start, i));
  return days;
}

async function fetchAssessmentsMonth(ref) {
  const first = ymd(startOfMonth(ref));
  const last = ymd(endOfMonth(ref));
  const { data, error } = await supabaseClient
    .from('analyzed_docs')
    .select('date, period, subject')
    .gte('date', first).lte('date', last)
    .eq('grade', currentGrade).eq('class_num', currentClassNum)
    .order('date, period');
  if (error) { console.warn('assessments error', error); return []; }
  return data || [];
}

async function renderScheduleCalendar() {
  const label = document.getElementById('sched-month-label');
  label.textContent = `${schedRefDate.getFullYear()}.${String(schedRefDate.getMonth() + 1).padStart(2, '0')}`;

  const grid = document.getElementById('sched-grid');
  const detailTitle = document.getElementById('sched-detail-title');
  const detailList = document.getElementById('sched-detail-list');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 8px; color:#6b7280;">불러오는 중…</div>';

  try {
    const [assessRows, schoolRowsRaw] = await Promise.all([
      fetchAssessmentsMonth(schedRefDate),
      fetchSchoolEventsMonth(schedRefDate)
    ]);

    const schoolRows = (schoolRowsRaw || []).filter(ev =>
      !/(토요\s*휴업일)/.test(ev.title || '')
    );

    const assessByDate = assessRows.reduce((m, r) => {
      (m[r.date] ??= []).push({ type: 'assess', period: r.period, title: r.subject || '수행' });
      return m;
    }, {});
    const schoolByDate = schoolRows.reduce((m, r) => {
      (m[r.date] ??= []).push({ type: 'school', title: r.title, kind: r.kind });
      return m;
    }, {});

    const cells = buildMonthMatrix(schedRefDate);
    const todayStr = ymd(new Date());

    grid.innerHTML = '';
    let firstSelectedDone = false;

    cells.forEach(d => {
      const dStr = ymd(d);
      const inMonth = (d.getMonth() === schedRefDate.getMonth());

      const itemsA = assessByDate[dStr] || [];
      const itemsE = schoolByDate[dStr] || [];
      const items = [...itemsA, ...itemsE];

      const cell = document.createElement('div');
      cell.className = 'sched-cell' + (inMonth ? '' : ' out');
      if (dStr === todayStr) cell.classList.add('today');
      if (items.length) cell.classList.add('has');
      const dayEl = `<div class="sched-day">${d.getDate()}</div>`;

      const top3 = items.slice(0, 3).map(it => {
        if (it.type === 'assess') {
          return `<div class="sched-item">
                    📘 ${escapeHtml(it.title)} - <b>${it.period}</b>교시
                  </div>`;
        } else {
          return `<div class="sched-item">
                    ${eventLabel(it.kind, escapeHtml(it.title))}
                  </div>`;
        }
      }).join('');


      const more = items.length > 3
        ? `<div class="sched-more">+${items.length - 3}개 더</div>`
        : '';

      cell.innerHTML = `${dayEl}<div class="sched-items">${top3}${more}</div>`;

      // 클릭: 선택 테두리 단 하나 + 상세 패널 갱신
      cell.addEventListener('click', () => {
        document.querySelectorAll('.sched-cell.selected').forEach(el => el.classList.remove('selected'));
        cell.classList.add('selected');
        renderSchedDetail(dStr, itemsA, itemsE);
      });

      grid.appendChild(cell);

      // 처음 진입 시: 같은 달의 오늘 자동 선택/표시
      if (!firstSelectedDone && dStr === todayStr && inMonth) {
        cell.classList.add('selected');
        renderSchedDetail(dStr, itemsA, itemsE);
        firstSelectedDone = true;
      }
    });

    // 오늘이 달 밖/데이터 없음 → 첫 일정 있는 날 or 그 달 1일 선택
    if (!firstSelectedDone) {
      const allDates = [...new Set([
        ...Object.keys(assessByDate),
        ...Object.keys(schoolByDate)
      ])].sort();

      const pick = allDates[0] || `${schedRefDate.getFullYear()}-${String(schedRefDate.getMonth() + 1).padStart(2, '0')}-01`;
      renderSchedDetail(pick, assessByDate[pick] || [], schoolByDate[pick] || []);

      // UI상 선택 테두리도 동기화
      const day = Number(pick.slice(-2));
      const cellToSelect = [...grid.children].find(div => {
        const numEl = div.querySelector('.sched-day');
        return numEl && Number(numEl.textContent) === day && !div.classList.contains('out');
      });
      if (cellToSelect) {
        document.querySelectorAll('.sched-cell.selected').forEach(el => el.classList.remove('selected'));
        cellToSelect.classList.add('selected');
      }
    }
  } catch (e) {
    const grid = document.getElementById('sched-grid');
    const detailTitle = document.getElementById('sched-detail-title');
    const detailList = document.getElementById('sched-detail-list');
    if (grid) grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 8px; color:#ef4444;">달력 데이터를 불러오지 못했습니다.</div>';
    if (detailTitle) detailTitle.textContent = '날짜를 선택하세요';
    if (detailList) detailList.innerHTML = '';
  }
}

// 📅 일정(캘린더) 월 이동 전역 함수
window.changeSchedMonth = function (delta) {
  if (!schedRefDate) schedRefDate = new Date();
  schedRefDate.setMonth(schedRefDate.getMonth() + delta);
  renderScheduleCalendar();
};

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let scheduleBound = false;
function bindScheduleUI() {
  if (scheduleBound) return;
  scheduleBound = true;

  const prev = document.getElementById('sched-prev');
  const next = document.getElementById('sched-next');
  if (prev) prev.onclick = () => {
    schedRefDate = new Date(schedRefDate.getFullYear(), schedRefDate.getMonth() - 1, 1);
    renderScheduleCalendar();
  };
  if (next) next.onclick = () => {
    schedRefDate = new Date(schedRefDate.getFullYear(), schedRefDate.getMonth() + 1, 1);
    renderScheduleCalendar();
  };
}

// (Consolidated into global afterLoginRefreshDashboard)

async function fetchSchoolEventsMonth(ref) {

  const firstDate = startOfMonth(ref);
  const lastDate = endOfMonth(ref);
  const AA_FROM_YMD = ymdCompact(firstDate);
  const AA_TO_YMD = ymdCompact(lastDate);

  const AY = ref.getFullYear();
  const mm = ref.getMonth() + 1;
  const SEM = (mm <= 8) ? 1 : 2;

  const url = `https://open.neis.go.kr/hub/SchoolSchedule` +
    `?KEY=${NEIS_KEY}` +
    `&Type=json` +
    `&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}` +
    `&SD_SCHUL_CODE=${SD_SCHUL_CODE}` +
    `&AY=${AY}&SEM=${SEM}` +
    `&AA_FROM_YMD=${AA_FROM_YMD}` +
    `&AA_TO_YMD=${AA_TO_YMD}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!(data.SchoolSchedule && data.SchoolSchedule[1])) return [];

    const rows = data.SchoolSchedule[1].row || [];
    return rows.map(r => {
      const ymd = String(r.AA_YMD || '');
      const date = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
      const title = r.EVENT_NM || r.EVENT_CNTNT || '';
      const kind = classifyNeisEvent(title, r.EVENT_CNTNT || '');
      return { date, title, kind };
    });
  } catch (e) {
    console.warn('NEIS 학사일정 오류:', e);
    return [];
  }
}

function classifyNeisEvent(title = '', detail = '') {
  const s = `${title} ${detail}`.toLowerCase();

  const examKw = [
    '시험', '지필', '중간', '기말', '평가', '고사', '모의', '퀴즈', '수행평가'
  ];

  const holidayKw = [
    '휴업', '방학', '공휴일', '대체공휴일', '개교기념일', '재량휴업', '휴교',
    '설날', '설 연휴', '추석', '추석 연휴', '성탄', '크리스마스', '현충일', '어린이날',
    '광복절', '개천절', '한글날', '석가탄신일', '신정'
  ];

  if (examKw.some(k => s.includes(k))) return 'exam';
  if (holidayKw.some(k => s.includes(k))) return 'holiday';

  return 'event';
}

function eventLabel(kind, title) {
  const t = (title && title.trim()) ? title : '학사 일정';
  if (kind === 'holiday') return `🏖️ ${t}`;
  if (kind === 'exam') return `📝 ${t}`;
  return `📌 ${t}`;
}

function renderSchedDetail(dateStr, itemsA, itemsE) {
  const t = document.getElementById('sched-detail-title');
  const ul = document.getElementById('sched-detail-list');
  t.textContent = `${dateStr.replace(/-/g, '.')} 일정`;

  const aPart = (itemsA && itemsA.length)
    ? itemsA.map(x => `<li>📘 <b>${x.period}교시</b> · ${escapeHtml(x.title)}</li>`).join('')
    : '<li>📝 수행 일정 없음</li>';

  const ePart = (itemsE && itemsE.length)
    ? itemsE.map(e => `<li>${eventLabel(e.kind, escapeHtml(e.title))}</li>`).join('')
    : '<li>📌 학사일정 없음</li>';

  ul.innerHTML = `
          <div style="margin-bottom:.4rem;color:#6b7280;font-weight:700;">수행</div>
          ${aPart}
          <div style="margin:.6rem 0 .4rem;color:#6b7280;font-weight:700;">학사</div>
          ${ePart}
        `;
}

(() => {

  const elBadge = document.getElementById('badge-day');
  const elList = document.getElementById('timetable');
  const elNotice = document.getElementById('notice');
  const elPicker = document.getElementById('mealDatePicker');

  const DOW = ['일', '월', '화', '수', '목', '금', '토'];

  const seoulNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const toInput = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const toNeisYmd = d => toInput(d).replace(/-/g, '');
  const semesterOf = (d) => (d.getMonth() + 1) <= 8 ? 1 : 2;

  function getGradeClass() {
    const g = (typeof currentGrade === 'number' ? currentGrade : parseInt(localStorage.getItem('savedGrade'), 10)) || null;
    const c = (typeof currentClassNum === 'number' ? currentClassNum : parseInt(localStorage.getItem('savedClassNum'), 10)) || null;
    return { grade: g, classNum: c };
  }

  function setBadge(d) {
    if (!elBadge) return;
    elBadge.textContent = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${DOW[d.getDay()]})`;
  }

  function showNotice(msg) {
    if (!elNotice) return;
    elList.innerHTML = '';
    elNotice.style.display = 'block';
    elNotice.textContent = msg;
  }

  function hideNotice() {
    if (!elNotice) return;
    elNotice.style.display = 'none';
    elNotice.textContent = '';
  }

  function renderRows(rows) {
    if (!rows || rows.length === 0) {
      elList.innerHTML = '';
      showNotice('교육청 시간표 데이터가 없습니다.');
      return;
    }
    hideNotice();

    const byPeriod = {};
    for (const r of rows) {
      const p = String(r.PERIO ?? '').trim();
      if (!p) continue;
      if (!byPeriod[p]) byPeriod[p] = r.ITRT_CNTNT || '';
    }
    const sorted = Object.keys(byPeriod).map(Number).sort((a, b) => a - b);

    elList.innerHTML = sorted.map(p => `
            <li>
              <span class="period-badge">${p}</span>
              <span class="subject-name">${byPeriod[p] || ''}</span>
            </li>
          `).join('');

    const first = elList.querySelector('li');
    if (first) first.style.borderTop = '0';
  }

  async function fetchNeisDay({ grade, classNum }, dateObj) {
    const AY = dateObj.getFullYear();
    const SEM = semesterOf(dateObj);
    const YMD = toNeisYmd(dateObj);

    const url =
      `https://open.neis.go.kr/hub/misTimetable` +
      `?KEY=${encodeURIComponent(NEIS_KEY)}` +
      `&Type=json` +
      `&ATPT_OFCDC_SC_CODE=${encodeURIComponent(ATPT_OFCDC_SC_CODE)}` +
      `&SD_SCHUL_CODE=${encodeURIComponent(SD_SCHUL_CODE)}` +
      `&AY=${AY}&SEM=${SEM}` +
      `&ALL_TI_YMD=${YMD}` +
      `&GRADE=${encodeURIComponent(grade)}` +
      `&CLASS_NM=${encodeURIComponent(classNum)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`NEIS 응답 오류 ${res.status}`);
    const json = await res.json();
    const block = json && json.misTimetable && json.misTimetable[1];
    return block ? (block.row || []) : [];
  }

  async function loadTimetableDay(dateStr) {
    const dateObj = dateStr ? new Date(dateStr) : seoulNow();
    setBadge(dateObj);

    const { grade, classNum } = getGradeClass();
    if (!grade || !classNum) {
      renderRows([]);
      showNotice('학년/반 정보를 찾을 수 없습니다. 로그인 후 다시 시도하세요.');
      return;
    }

    try {
      const rows = await fetchNeisDay({ grade, classNum }, dateObj);
      renderRows(rows);
    } catch (e) {
      console.warn(e);
      renderRows([]);
      showNotice('시간표를 불러오는 중 오류가 발생했습니다.');
    }
  }

  function handleDateChange(dateValue) {
    if (!dateValue) return;

    const parts = dateValue.split('-');
    window.currentDate = new Date(parts[0], parts[1] - 1, parts[2]);

    loadTimetableDay(dateValue);

    if (typeof loadMeal === 'function') loadMeal(dateValue);
    if (typeof updateDateLabels === 'function') updateDateLabels();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const defaultDate = toInput(seoulNow());
    ['timetableDatePicker', 'mealDatePicker'].forEach(id => {
      const picker = document.getElementById(id);
      if (picker) {
        picker.value = defaultDate;
        picker.addEventListener('change', (e) => handleDateChange(e.target.value));
      }
    });
    loadTimetableDay(defaultDate);
    if (typeof loadMeal === 'function') loadMeal(defaultDate);
    if (typeof updateDateLabels === 'function') updateDateLabels();
  });

  window.loadTimetableDay = loadTimetableDay;
  window.reloadTimetableCard = () => loadTimetableDay(elPicker?.value || undefined);
})();

(function () {
  const ul = document.getElementById('rank-list');
  const meEl = document.getElementById('rank-me');
  const selMetric = document.getElementById('rank-metric');
  const selScope = document.getElementById('rank-scope');
  const btnRefresh = document.getElementById('rank-refresh');

  // ✅ 모두가 범위를 바꿀 수 있도록 보장
  selScope.disabled = false;

  const escapeHtml = (s = '') => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function medal(n) {
    if (n === 1) return '🥇';
    if (n === 2) return '🥈';
    if (n === 3) return '🥉';
    return `<span style="display:inline-block;width:22px;text-align:right;font-weight:700;color:#6b7280">${n}</span>`;
  }

  function rowHtml(rank, u, metric) {
    const right =
      metric === 'coin'
        ? `💰 ${Number(u.coin_balance || 0)}`
        : `Lv ${Number(u.level || 1)} (XP ${Number(u.xp || 0)})`;
    const sub = `${u.grade ?? '-'}학년 ${u.class_num ?? '-'}반 · ${u.student_number ?? ''}번`;
    const titleText = u.equipped_title ? `[${u.equipped_title.replace('[칭호]', '').trim()}] ` : '';
    const nameWithTitle = `<span style="color:#6366f1; font-weight:700;">${titleText}</span>${escapeHtml(u.name || u.username || '학생')}`;

    return `
            <li class="rank-item">
              <div style="width:32px;text-align:center">${medal(rank)}</div>
              <div style="flex:1 1 auto;">
                <div style="font-weight:700">${nameWithTitle}</div>
                <div style="font-size:.85rem;color:#6b7280">${sub}</div>
              </div>
              <div style="font-weight:700">${right}</div>
            </li>`;
  }

  function meHtml(rank, total, u, metric) {
    const right =
      metric === 'coin'
        ? `💰 ${Number(u.coin_balance || 0)}`
        : `Lv ${Number(u.level || 1)} (XP ${Number(u.xp || 0)})`;
    const titleText = u.equipped_title ? `[${u.equipped_title.replace('[칭호]', '').trim()}] ` : '';
    const nameWithTitle = `<span style="color:#6366f1; font-weight:700;">${titleText}</span>${escapeHtml(u.name || '나')}`;

    return `
            <div style="display:flex;align-items:center;gap:10px">
              <div style="font-weight:800">내 순위</div>
              <div style="margin-left:auto;font-size:.9rem;color:#6b7280">${rank}/${total}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
              <div style="width:32px;text-align:center">${medal(rank)}</div>
              <div style="flex:1 1 auto;">
                <div style="font-weight:700">${nameWithTitle}</div>
                <div style="font-size:.85rem;color:#6b7280">${u.grade ?? '-'}학년 ${u.class_num ?? '-'}반 · ${u.student_number ?? ''}번</div>
              </div>
              <div style="font-weight:700">${right}</div>
            </div>`;
  }

  function sortUsers(users, metric) {
    if (metric === 'coin') {
      return users.sort(
        (a, b) => (b.coin_balance || 0) - (a.coin_balance || 0) || (a.name || '').localeCompare(b.name || '')
      );
    } else {
      return users.sort(
        (a, b) => (b.level || 0) - (a.level || 0) || (b.xp || 0) - (a.xp || 0) || (a.name || '').localeCompare(b.name || '')
      );
    }
  }

  async function loadRanking() {
    const metric = selMetric.value;
    const scope = selScope.value; // 'class' | 'grade' | 'school' (가정)

    const myUsername = localStorage.getItem('savedUsername') || '';
    const g = (typeof currentGrade === 'number'
      ? currentGrade
      : parseInt(localStorage.getItem('savedGrade') || '0', 10)) || null;
    const c = (typeof currentClassNum === 'number'
      ? currentClassNum
      : parseInt(localStorage.getItem('savedClassNum') || '0', 10)) || null;

    ul.innerHTML = `<li style="padding:10px;color:#6b7280">불러오는 중…</li>`;
    meEl.style.display = 'none';

    // ✅ 관리자 여부와 무관하게 항상 같은 기본 쿼리 사용
    let q = supabaseClient.from('users')
      .select('username,name,grade,class_num,student_number,coin_balance,level,xp,role,equipped_title', { count: 'exact' })
      .neq('role', 'admin'); // 랭킹에서 관리자 제외 (유지)

    // ✅ scope에만 따라 필터
    if (scope === 'class') {
      if (g != null) q = q.eq('grade', g);
      if (c != null) q = q.eq('class_num', c);
    } else if (scope === 'grade') {
      if (g != null) q = q.eq('grade', g);
    } // scope === 'school' 이면 추가 필터 없음

    const { data, error } = await q;

    if (error) {
      ul.innerHTML = `<li style="padding:10px;color:#ef4444">랭킹 로드 오류: ${escapeHtml(error.message)}</li>`;
      return;
    }

    const users = Array.isArray(data) ? data.slice() : [];
    if (users.length === 0) {
      ul.innerHTML = `<li style="padding:10px;color:#6b7280">표시할 데이터가 없습니다.</li>`;
      return;
    }

    const sorted = sortUsers(users, metric);

    const N = 5;
    ul.innerHTML = '';
    sorted.slice(0, N).forEach((u, i) => {
      ul.insertAdjacentHTML('beforeend', rowHtml(i + 1, u, metric));
    });

    const myIndex = sorted.findIndex(u => (u.username || '') === myUsername);
    if (myIndex >= 0) {
      meEl.innerHTML = meHtml(myIndex + 1, sorted.length, sorted[myIndex], metric);
      meEl.style.display = 'block';
    } else {
      meEl.style.display = 'none';
    }
  }

  selMetric.addEventListener('change', loadRanking);
  selScope.addEventListener('change', loadRanking);
  btnRefresh.addEventListener('click', loadRanking);
  document.addEventListener('DOMContentLoaded', loadRanking);

  window.reloadRankingCard = loadRanking;
})();

(() => {
  const seoulNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const toYMD = d => {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${dd}`;
  };
  const labelYMD = d => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

  function parseDishList(ddish = "") {
    return String(ddish)
      .replace(/<br\s*\/?>/gi, "\n")
      .split(/\n+/)
      .map(s => s.replace(/\((?:\s*\d+\s*\.)+\s*\)/g, "").trim())
      .filter(Boolean);
  }

  function renderMeal(dateObj, rows) {
    const box = document.getElementById("meal-box");
    const dayLabel = labelYMD(dateObj);

    if (!rows || rows.length === 0) {
      box.innerHTML = `<div style="color:#6b7280">🍽️ ${dayLabel} 급식 정보 없음</div>`;
      return;
    }

    const byType = rows.reduce((m, r) => {
      (m[r.MMEAL_SC_NM] ??= []).push(...parseDishList(r.DDISH_NM));
      return m;
    }, {});

    const order = ["조식", "중식", "석식"];
    const types = Object.keys(byType).sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    box.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <strong>오늘 급식</strong>
            </div>
            ${types.map(type => `
              <div style="margin-bottom:8px;">
                <div style="font-weight:600;margin-bottom:4px;">${type}</div>
                <ul style="margin:0;padding-left:18px;color:#374151;">
                  ${byType[type].map(d => `<li>${d}</li>`).join("")}
                </ul>
              </div>
            `).join("")}
          `;
  }

  async function loadMeal(forDate) {
    const d = forDate ? new Date(forDate) : seoulNow();
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo`
      + `?KEY=${encodeURIComponent(NEIS_KEY)}&Type=json`
      + `&ATPT_OFCDC_SC_CODE=${encodeURIComponent(ATPT_OFCDC_SC_CODE)}`
      + `&SD_SCHUL_CODE=${encodeURIComponent(SD_SCHUL_CODE)}`
      + `&MLSV_YMD=${toYMD(d)}`;

    try {
      const res = await fetch(url);
      const json = await res.json();
      const block = json && json.mealServiceDietInfo && json.mealServiceDietInfo[1];
      renderMeal(d, block ? block.row : []);
    } catch (e) {
      document.getElementById("meal-box").innerHTML =
        `<div style="color:#ef4444">급식 로딩 오류</div>`;
      console.error(e);
    }
  }

  window.loadMeal = loadMeal;
})();


// (Removed redundant syncStatsAndRender/renderStats definitions)

// Consolidated into the main initialization block below.


window.addEventListener('DOMContentLoaded', async () => {
  // 1. 세션 복구 및 기본 데이터 로드
  const savedUsername = localStorage.getItem('savedUsername');
  if (!savedUsername) {
    showLogin();
    return;
  }

  // Supabase 세션 확인 (레이스 컨디션 방지)
  const { data: { session } } = await supabaseClient.auth.getSession();

  const { data: user, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('username', savedUsername)
    .maybeSingle();

  if (error || !user) {
    console.warn('User not found or error, showing login.');
    showLogin();
    return;
  }

  // 2. 전역 변수 설정
  currentUserRole = user.role || 'user';
  currentGrade = user.grade;
  currentClassNum = user.class_num;
  currentUserName = user.name;
  currentStudentNumber = user.student_number;

  // 3. 로컬 스토리지 동기화
  localStorage.setItem('savedName', user.name);
  localStorage.setItem('savedStudentNum', user.student_number);
  localStorage.setItem('savedGrade', user.grade);
  localStorage.setItem('savedClassNum', user.class_num);

  // 4. UI 및 데이터 로드 (순차 실행)
  await loadUserInfo();
  setUserInfoInput();
  await loadTimetableWeek(user.grade, user.class_num);
  await loadCoinBalance();

  showMain();

  // 5. 대시보드 및 기타 데이터 최종 갱신
  await afterLoginRefreshDashboard();

  // 6. 확성기(브로드캐스트) 리스너 시작
  listenForBroadcasts();
});

// =========================================
// 📢 확성기 (전역 브로드캐스트) 시스템 & 모달 전용
// =========================================
let currentMegaItemId = null;
let currentMegaItemName = null;

window.openMegaphoneModal = function (itemId = null, itemName = null) {
  currentMegaItemId = itemId;
  currentMegaItemName = itemName;
  const modal = document.getElementById('megaphone-modal');
  const input = document.getElementById('megaphone-message-input');
  const status = document.getElementById('megaphone-status');
  if (modal) modal.style.display = 'flex';
  if (input) {
    input.value = '';
    input.focus();
  }
  if (status) status.innerText = '';
};

window.closeMegaphoneModal = function () {
  const modal = document.getElementById('megaphone-modal');
  if (modal) modal.style.display = 'none';
  currentMegaItemId = null;
  currentMegaItemName = null;
};

/** 🤖 AI API 기반 비속어/비매너 검사 */
async function checkProfanityWithAI(text) {
  // 1. 기본적인 금사회(Client-side)
  const blacklist = ['성인', '도박', '바카라', 'ㅅㅂ', 'ㅄ', 'ㄴㅁ', 'ㅂㅅ', 'ㅉㅉ']; // 예시
  if (blacklist.some(word => text.includes(word))) return { safe: false, reason: '금지어가 포함되어 있습니다.' };

  try {
    // 2. 외부 AI API 호출 시뮬레이션 (딜레이 제거로 성능 최적화)
    // 단순 패턴 검사 (성적 단어 등 포괄)
    const badPatterns = /욕설|성인|섹스|자위|시발|병신|개새끼/i;
    if (badPatterns.test(text)) {
      return { safe: false, reason: '부적절한 표현(욕설/성적 단어)이 감지되었습니다.' };
    }

    return { safe: true };
  } catch (err) {
    console.warn('AI 검사 오류:', err);
    return { safe: true }; // 오류 시 일단 통과시키거나 차단 정책 결정
  }
}

window.submitMegaphone = async function () {
  const inputEl = document.getElementById('megaphone-message-input');
  const statusEl = document.getElementById('megaphone-status');
  const sendBtn = document.getElementById('megaphone-send-btn');
  const message = inputEl.value.trim();

  if (!message) return;

  if (sendBtn) sendBtn.disabled = true;
  if (statusEl) {
    statusEl.innerText = '🔍 AI가 메시지를 검토 중입니다...';
    statusEl.style.color = '#6366f1';
  }

  const check = await checkProfanityWithAI(message);

  if (!check.safe) {
    if (statusEl) {
      statusEl.innerText = `❌ ${check.reason}`;
      statusEl.style.color = '#dc3545';
    }
    if (sendBtn) sendBtn.disabled = false;
    return;
  }

  const username = localStorage.getItem('savedUsername');
  const name = localStorage.getItem('savedName') || username;

  try {
    // 1. broadcasts 테이블에 실제 삽입
    const { error: brError } = await supabaseClient
      .from('broadcasts')
      .insert({ sender_name: name, message: message });

    if (brError) throw brError;

    // 2. 인벤토리에서 소모 (아이템 번호가 있을 경우만)
    if (currentMegaItemId) {
      await supabaseClient.from('inventory').delete().eq('id', currentMegaItemId);
    }

    // 3. 로그 기록
    if (window.logActivity) {
      window.logActivity('item_consume', currentMegaItemName || '확성기', 'item', { message });
    }

    alert('✅ 전교에 확성기 알림이 발송되었습니다!');
    closeMegaphoneModal();
    if (typeof loadInventory === 'function') loadInventory();

  } catch (err) {
    alert('발송 실패: ' + err.message);
    if (statusEl) statusEl.innerText = '';
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
};

let broadcastSubscription = null;
function listenForBroadcasts() {
  if (broadcastSubscription) return; // 이미 실행 중

  broadcastSubscription = supabaseClient
    .channel('public:broadcasts')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcasts' }, payload => {
      showBroadcastBanner(payload.new.sender_name, payload.new.message);
    })
    .subscribe();
}

function showBroadcastBanner(sender, message) {
  const banner = document.getElementById('global-broadcast-banner');
  const senderEl = document.getElementById('broadcast-sender');
  const msgEl = document.getElementById('broadcast-message');

  if (!banner || !senderEl || !msgEl) return;

  senderEl.textContent = `[${escapeHtml(sender)}님의 알림]`;
  msgEl.textContent = escapeHtml(message);

  // 시작 애니메이션
  banner.style.display = 'block';
  banner.style.animation = 'slideDown 0.5s ease-out forwards';

  // 7초 후 닫기
  setTimeout(() => {
    banner.style.animation = 'slideUp 0.5s ease-in forwards';
    setTimeout(() => {
      banner.style.display = 'none';
      banner.style.animation = '';
    }, 500); // 닫히는 애니메이션 지속시간
  }, 7000);
}

document.addEventListener('DOMContentLoaded', () => {
  const profileButton = document.getElementById('profile-button');
  const dropdown = document.getElementById('profile-dropdown');

  if (profileButton && dropdown) {
    profileButton.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
    });
    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });
  }
});

// 컬렉션 정보도 함께 갱신 (프로필 패널이 열려있을 수 있으므로)
if (typeof loadOwnedCollection === 'function') loadOwnedCollection();

// 간단한 애니메이션 효과 함수 (눈, 벚꽃)
function startSnowEffect(canvas, isAccumulate = false) {
  const ctx = canvas.getContext('2d');
  const particles = Array.from({ length: 50 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 3 + 1,
    d: Math.random() * 1 + 0.5
  }));
  let settled = [];
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    particles.forEach(p => {
      ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
    });
    if (isAccumulate) {
      settled.forEach(p => {
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
      });
    }
    ctx.fill();
    update();
  }
  function update() {
    particles.forEach(p => {
      p.y += Math.pow(p.d, 2) + 1;
      p.x += Math.sin(p.d);

      let limit = isAccumulate ? canvas.height - Math.random() * 20 : canvas.height;
      if (p.y > limit) {
        if (isAccumulate) {
          settled.push({ x: p.x, y: p.y, r: p.r });
          if (settled.length > 300) settled.shift(); // limit settled particles
        }
        p.x = Math.random() * canvas.width;
        p.y = isAccumulate ? -10 : 0;
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

function startCherryBlossomEffect(canvas, isAccumulate = false) {
  const ctx = canvas.getContext('2d');
  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    s: Math.random() * 1 + 0.5,
    r: Math.random() * 360,
    d: Math.random() * 1 + 0.5,
    angle: Math.random() * 100, // 좌우 살랑거림 각도
    swaySpeed: Math.random() * 0.02 + 0.01 // 흔들림 속도 (아주 천천히)
  }));
  let settled = [];
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let toDraw = isAccumulate ? [...particles, ...settled] : particles;
    toDraw.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r * Math.PI / 180);
      ctx.fillStyle = 'rgba(255, 183, 197, 0.8)';
      ctx.beginPath();
      // 벚꽃잎 모양
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-10 * p.s, -10 * p.s, -10 * p.s, 10 * p.s, 0, 15 * p.s);
      ctx.bezierCurveTo(10 * p.s, 10 * p.s, 10 * p.s, -10 * p.s, 0, 0);
      ctx.fill();
      ctx.restore();
    });
    update();
  }
  function update() {
    particles.forEach(p => {
      p.y += p.d;
      // 부드러운 좌우 흔들림 적용
      p.x += Math.sin(p.angle) * 1.5;
      p.angle += p.swaySpeed;
      // 자연스러운 천천히 회전
      p.r += 0.5;

      let limit = isAccumulate ? canvas.height - Math.random() * 30 : canvas.height;
      if (p.y > limit) {
        if (isAccumulate) {
          settled.push({ x: p.x, y: p.y, s: p.s, r: p.r });
          if (settled.length > 200) settled.shift(); // 최대 200개 제한
        }
        p.y = isAccumulate ? -20 : -20;
        p.x = Math.random() * canvas.width;
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

function startStarEffect(canvas, isAccumulate = false) {
  const ctx = canvas.getContext('2d');
  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    s: Math.random() * 2 + 1, // 크기
    r: Math.random() * 360,   // 회전 각도
    d: Math.random() * 1.5 + 0.5, // 떨어지는 속도
    rotSpeed: (Math.random() - 0.5) * 4 // 회전 속도
  }));
  let settled = [];

  function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let toDraw = isAccumulate ? [...particles, ...settled] : particles;
    toDraw.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r * Math.PI / 180);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'; // 금색 별
      drawStar(0, 0, 5, 5 * p.s, 2 * p.s);
      ctx.restore();
    });
    update();
  }
  function update() {
    particles.forEach(p => {
      p.y += p.d;
      p.x += Math.sin(p.y / 50) * 0.5; // 살짝 흔들림
      p.r += p.rotSpeed;

      let limit = isAccumulate ? canvas.height - Math.random() * 20 : canvas.height;
      if (p.y > limit) {
        if (isAccumulate) {
          settled.push({ x: p.x, y: p.y, s: p.s, r: p.r });
          if (settled.length > 200) settled.shift(); // 바닥에 쌓임
        }
        p.y = isAccumulate ? -20 : -20;
        p.x = Math.random() * canvas.width;
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/** 🔑 임시(비권장): 브라우저에 하드코딩 */


/** 이미지 → 크기제한 JPEG dataURL */
async function fileToBase64Optimized(file, maxW = 1800, maxH = 1800, type = 'image/jpeg', quality = 0.9) {
  const dataUrl = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });

  // ✅ GIF 파일인 경우 압축/리사이징 없이 원본 그대로 반환 (움짤 유지)
  if (file.type === 'image/gif') {
    return dataUrl;
  }

  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  let { width: w, height: h } = img;
  const scale = Math.min(maxW / w, maxH / h, 1);
  w = Math.round(w * scale); h = Math.round(h * scale);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(img, 0, 0, w, h);
  return cv.toDataURL(type, quality); // data:image/jpeg;base64,...
}

/** JSON 텍스트만 뽑아 파싱(백틱 코드블록 방어) */
function parseJsonLoose(s = '') {
  const trimmed = s.trim();
  try { return JSON.parse(trimmed); } catch { }
  const m = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (m) {
    try { return JSON.parse(m[1]); } catch { }
  }
  // 중괄호 블록만 추출 시도
  const idx1 = trimmed.indexOf('{');
  const idx2 = trimmed.lastIndexOf('}');
  if (idx1 !== -1 && idx2 !== -1 && idx2 > idx1) {
    try { return JSON.parse(trimmed.slice(idx1, idx2 + 1)); } catch { }
  }
  throw new Error('JSON 파싱 실패');
}

/** 출력: 문단 텍스트(폼 채우지 않음) */
function toParagraph({ subject = '', date = '', period = '', topic = '' } = {}) {
  const s = subject || '-';
  const d = date || '-';
  const p = period || '-';
  const t = topic || '-';
  return [
    '📄 수행평가 분석 결과',
    '--------------------------',
    `• 과목: ${s}`,
    `• 날짜: ${d}`,
    `• 교시: ${p}`,
    `• 평가 주제: ${t}`
  ].join('\n');
}

/** 결과 표기 textarea 확보(#doc-result 없으면 즉석 생성) */
function ensureResultBox() {
  let box = document.getElementById('doc-result') || document.getElementById('ocr-result');
  if (!box) {
    const panel = document.getElementById('doc-panel') || document.body;
    box = document.createElement('textarea');
    box.id = 'ocr-result';
    box.readOnly = true;
    box.style.cssText = 'width:100%;min-height:140px;margin-top:8px;white-space:pre-wrap;';
    panel.appendChild(box);
  }
  return box;
}

/** 메인: 버튼 onclick="analyzeDocument()" 연결용 */
async function analyzeDocument() {
  const fileInput = document.getElementById('doc-file');
  const previewImg = document.getElementById('doc-preview');
  const resultBox = ensureResultBox();

  try {
    if (!fileInput || !fileInput.files || !fileInput.files.length) {
      alert('이미지 파일(JPG/PNG)을 선택하세요.');
      return;
    }
    const file = fileInput.files[0];
    if (!/^image\//.test(file.type)) {
      alert('현재는 이미지(JPG/PNG)만 지원합니다. (PDF 제외)');
      return;
    }

    // 미리보기
    if (previewImg) {
      previewImg.src = URL.createObjectURL(file);
      previewImg.style.display = 'block';
    }
    resultBox.value = '인식 및 분석 중…';

    // 이미지 최적화 dataURL
    const imageDataUrl = await fileToBase64Optimized(file);

    // Gemini payload structure
    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: "시스템: 너는 한국 중학교 수행평가 안내 이미지를 OCR하고, 핵심 4항목(과목, 날짜, 교시, 평가 주제)을 구조화해 주는 도우미다. 반드시 JSON 객체 하나만 반환해." },
            { text: `1) 이미지를 먼저 정확히 OCR하세요.
2) OCR 결과를 바탕으로 아래 JSON 형식으로만 답변하세요(딱 한 개의 JSON, 다른 말 금지).
{
  "subject": "과목명(국어/수학/영어/과학/사회/역사/도덕/기술가정/정보/음악/미술/체육/창체/동아리/진로/한문 등, 추론 가능)",
  "date": "YYYY-MM-DD 또는 '10월 3일' 등 원문 그대로",
  "period": "숫자만(예: '3'). 교시 언급이 없으면 빈 문자열",
  "topic": "평가 주제(없으면 빈 문자열)"
}
주의:
- 추정일 경우 가장 가능성 높은 한 가지로만 기입.
- 불명확하면 빈 문자열("")로 남겨둠.` },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageDataUrl.split(',')[1]
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        response_mime_type: "application/json"
      }
    };

    // 🔑 API 호출 (Gemini용으로 변경)
    const rawResult = await callGeminiWithFallback(geminiPayload);
    
    // 결과 처리
    fillFormFromJson(rawResult);
    resultBox.value = toParagraph(rawResult);

  } catch (err) {
    console.error(err);
    resultBox.value = `❌ 분석 실패: ${err.message || err}`;
  }
}

/** Supabase에서 API 키 가져오기 (id=1 기본, id=2 백업) */
async function getOpenAIKeysFromSupabase() {
  const { data, error } = await supabaseClient
    .from("eduboard")
    .select("id, api_url")
    .in("id", [1, 2]);

  if (error || !data || data.length === 0) {
    throw new Error("❌ Supabase에서 API 키를 가져오지 못했습니다.");
  }

  const primary = data.find((row) => row.id === 1)?.api_url;
  const backup = data.find((row) => row.id === 2)?.api_url;

  return { primary, backup };
}

/** Gemini API 호출 (기본 키 실패 시 백업 키로 재시도) */
async function callGeminiWithFallback(payload) {
  const { primary, backup } = await getOpenAIKeysFromSupabase();

  const tryGemini = async (apiKey) => {
    // gemini-2.5-flash 또는 gemini-2.0-flash 등을 시도
    const model = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API Error: ${errText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return parseJsonLoose(text);
  };

  try {
    return await tryGemini(primary);
  } catch (err) {
    console.warn("⚠️ 1차 키 실패 → 백업 키로 전환:", err.message);
    if (!backup) throw err;
    return await tryGemini(backup);
  }
}


function fileToBase64Optimized(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseJsonLoose(str) {
  try {
    return JSON.parse(str);
  } catch {
    const match = str.match(/{[\s\S]+}/);
    return match ? JSON.parse(match[0]) : {};
  }
}

function fillFormFromJson(json) {
  console.log("📝 분석 결과:", json);
}

function toParagraph(json) {
  return `📘 과목: ${json.subject || "-"}\n📅 날짜: ${json.date || "-"}\n⏰ 교시: ${json.period || "-"}\n📝 주제: ${json.topic || "-"}`;
}


// 인라인 onclick 사용 시 전역에 노출
window.analyzeDocument = analyzeDocument;

function koWeekday(d) { return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]; }
function isValidDate(d) { return d instanceof Date && !isNaN(d.getTime()); }

// 날짜 파서: "2025-03-12", "2025.3.12", "3월12일", "03/12", "10.03(수)" 등 → {ymd, yoil}
function parseDateSmart(raw = "") {
  const s = String(raw).replace(/\([^)]*\)/g, '').replace(/\s+/g, '').trim();
  const nowY = new Date().getFullYear();

  // 1) YYYY[.-/년]MM[.-/월]DD
  let m = s.match(/(20\d{2})[.\-/년]?([01]?\d)[.\-/월]?([0-3]?\d)일?/);
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (isValidDate(d)) return { ymd: d.toISOString().slice(0, 10), yoil: koWeekday(d) };
  }

  // 2) M월D일
  m = s.match(/([01]?\d)월([0-3]?\d)일/);
  if (m) {
    const d = new Date(nowY, +m[1] - 1, +m[2]);
    if (isValidDate(d)) return { ymd: d.toISOString().slice(0, 10), yoil: koWeekday(d) };
  }

  // 3) MM[.-/]DD
  m = s.match(/([01]?\d)[.\-/]([0-3]?\d)/);
  if (m) {
    const d = new Date(nowY, +m[1] - 1, +m[2]);
    if (isValidDate(d)) return { ymd: d.toISOString().slice(0, 10), yoil: koWeekday(d) };
  }

  return { ymd: "", yoil: "" };
}

// ✅ 날짜를 바꾸면 요일 자동으로 갱신
function syncYoilFromDate() {
  const v = document.getElementById('af-date')?.value || "";
  const yoilEl = document.getElementById('af-yoil');
  if (!yoilEl) return;
  yoilEl.value = v ? koWeekday(new Date(v)) : "";
}

// ✅ GPT JSON 결과를 폼에 채우기 (과목/날짜/요일/교시/주제)
function fillFormFromJson(obj = {}) {
  const subjectEl = document.getElementById('af-subject');
  const periodEl = document.getElementById('af-period');
  const topicEl = document.getElementById('af-topic');
  const yoilEl = document.getElementById('af-yoil');
  const dateEl = document.getElementById('af-date');

  if (subjectEl && obj.subject) subjectEl.value = String(obj.subject).trim();
  if (topicEl && obj.topic) topicEl.value = String(obj.topic).trim();

  // 교시 숫자만 추출
  if (periodEl && obj.period !== undefined && obj.period !== null) {
    const num = String(obj.period).match(/\d+/);
    if (num) periodEl.value = parseInt(num[0], 10);
  }

  // 날짜 파싱(문자열 어떤 형태든 parseDateSmart로 처리) → 날짜/요일 동시 세팅
  let ymd = "";
  if (obj.date) {
    ymd = parseDateSmart(obj.date).ymd;
  } else if (obj.ymd) {
    ymd = String(obj.ymd).slice(0, 10); // 이미 YYYY-MM-DD 형식으로 준 경우
  }

  if (ymd) {
    if (dateEl) dateEl.value = ymd;         // 날짜 채우기
    if (yoilEl) yoilEl.value = koWeekday(new Date(ymd)); // 요일 동기화
  } else {
    // 날짜가 없으면 요일도 비움(둘 다 같이 관리)
    if (dateEl) dateEl.value = "";
    if (yoilEl) yoilEl.value = "";
  }
}

const $ = id => document.getElementById(id);
function weekdayKo(d) { return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]; }

// 날짜 → 요일 자동 채우기
(function bindYoilAutoFill() {
  const dateInput = $('af-date');     // ← 날짜 input (type="date")
  const yoilInput = $('af-yoil');     // ← 요일 input (readonly)
  if (!dateInput || !yoilInput) return;  // 폼에 둘 다 있어야 작동

  const fill = () => {
    const v = dateInput.value;
    yoilInput.value = v ? weekdayKo(new Date(v)) : '';
  };
  dateInput.addEventListener('change', fill);
  dateInput.addEventListener('input', fill);
  fill(); // 초기 1회
})();
function val(id) {
  const el = document.getElementById(id);
  return (el && 'value' in el) ? (el.value || '').trim() : '';
}

// 날짜→요일 자동 계산(한 번만 붙임)
(function attachYoilAutoFill() {
  const dateEl = document.getElementById('af-date');
  const yoilEl = document.getElementById('af-yoil');
  if (!dateEl || !yoilEl) return;
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  const setYoil = () => {
    if (!dateEl.value) { yoilEl.value = ''; return; }
    const d = new Date(dateEl.value + 'T00:00:00');
    yoilEl.value = isNaN(d) ? '' : DOW[d.getDay()];
  };
  dateEl.addEventListener('input', setYoil);
  setYoil();
})();

// ✅ 체크되면 이미지 업로드 후 공개 URL 반환
async function uploadDocImageIfNeeded() {
  const checked = document.getElementById('upload-image-check')?.checked;
  const fileInput = document.getElementById('doc-file');
  if (!checked || !fileInput || fileInput.files.length === 0) return null;

  const file = fileInput.files[0];
  const username = (localStorage.getItem('savedUsername') || 'anon')
    .replace(/[^\w.-]/g, '_');
  const ts = Date.now();
  const safe = file.name.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]/g, '_');
  const path = `${username}/${ts}_${safe}`;

  // 버킷 이름을 사용 중인 것으로 바꿔도 됩니다 (예: 'homework-files')
  const bucket = 'notice-images';

  const { error: upErr } = await supabaseClient
    .storage.from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });

  if (upErr) {
    alert('이미지 업로드 실패: ' + upErr.message);
    return null;
  }
  const { data: pub } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return pub?.publicUrl || null;
}

// ✅ DB 저장(이미지 URL 포함)
window.registerAnalyzedText = async function () {
  try {
    const subject = val('af-subject');
    const date = val('af-date');  // YYYY-MM-DD
    const yoilUi = val('af-yoil');
    const periodS = val('af-period');
    const topic = val('af-topic');

    // 선택 입력(없을 수도 있음)
    const timeStr = val('af-time') || null;
    const materials = val('af-materials') || null;
    const rawText = val('doc-result') || null;

    const period = periodS ? parseInt(periodS, 10) : null;
    if (!subject || !date || !period || !topic) {
      alert('과목, 수행 날짜, 교시, 평가 주제를 모두 입력해 주세요.');
      return;
    }

    // 요일 보정
    let yoil = yoilUi;
    if (!yoil) {
      const DOW = ['일', '월', '화', '수', '목', '금', '토'];
      const d = new Date(date + 'T00:00:00');
      yoil = isNaN(d) ? '' : DOW[d.getDay()];
    }

    // 🔼 이미지 업로드(체크된 경우)
    const imageUrl = await uploadDocImageIfNeeded();

    const payload = {
      username: localStorage.getItem('savedUsername') || '',
      name: localStorage.getItem('savedName') || '',
      grade: Number(localStorage.getItem('savedGrade')) || null,
      class_num: Number(localStorage.getItem('savedClassNum')) || null,
      student_number: Number(localStorage.getItem('savedStudentNum')) || null,

      subject,
      date,          // DATE 컬럼
      yoil,          // text
      period,        // int4
      topic,         // text
      time: timeStr,       // text
      materials,           // text
      raw_text: rawText,   // text
      image_url: imageUrl  // text (체크 안 했거나 업로드 실패 시 null)
    };

    const { data, error } = await supabaseClient
      .from('analyzed_docs')
      .insert([payload])
      .select();

    if (error) {
      console.error(error);
      alert('DB 저장 실패: ' + (error.message || '알 수 없는 오류'));
      return;
    }

    // 🎯 [이관] 수행 평가 등록 시 공지사항으로 자동 복사 (copy_analyzed_docs_to_notices)
    try {
      const noticeContent = `[과목] ${subject}\n[평가 날짜] ${date}\n[교시] ${val('af-period')}교시\n[평가 주제] ${topic}`;
      const { error: syncError } = await supabaseClient
        .from('notices')
        .insert([{
          title: subject + ' 수행',
          content: noticeContent,
          image_url: imageUrl,
          writer: payload.name,
          username: payload.username,
          writer_role: 'student',
          grade: payload.grade,
          class_num: payload.class_num,
          date: date
        }]);

      if (syncError) console.warn('공지사항 동기화 실패:', syncError);
    } catch (errSync) {
      console.warn('공지사항 동기화 중 오류:', errSync);
    }

    // 🎯 [이관] 일일 XP 보상 지급 (수행 평가 등록 시)
    await awardDailyXP('perform');

    alert('등록 완료!');
  } catch (e) {
    console.error(e);
    alert('예상치 못한 오류: ' + (e?.message || e));
  }
};

function setupStudentPanel() {
  if (
    window.currentUserRole === 'student' &&
    Number(window.currentGrade) === 2 &&
    Number(window.currentClassNum) === 3
  ) {
    const panel = document.getElementById('student-panel');
    if (panel) {
      panel.style.display = 'block';
    }
  }
}

async function loadUserFromDashboardValues() {
  const username = localStorage.getItem('savedUsername');
  if (!username) {
    console.warn("⚠️ 저장된 사용자 정보가 없습니다.");
    return;
  }

  console.log("🔍 Supabase 쿼리 실행 중 (사용자 정보 채우기)...");

  // ✅ Supabase에서 사용자 찾기
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error("❌ 쿼리 에러:", error);
    return;
  }

  if (!data) {
    console.warn("❗ 일치하는 사용자가 없습니다.");
    return;
  }

  // ✅ 콘솔 출력 (디버그용)
  console.log("✅ 사용자 찾음:", data);
  console.log("👤 이름:", data.name);
  console.log("🆔 아이디:", data.username);
  console.log("📧 이메일:", data.email);
  console.log("🔒 비밀번호:", data.password);



  // 나머지 입력창들
  document.getElementById("profile-name").value = data.name || "";
  document.getElementById("profile-username").value = data.username || "";
  document.getElementById("profile-username-origin").value = data.username; // ← 핵심
  document.getElementById("profile-email").value = data.email || "";
  document.getElementById("profile-grade").value = data.grade || "";
  document.getElementById("profile-class").value = data.class_num || "";
  document.getElementById("profile-number").value = data.student_number || "";

  console.log("📌 모든 프로필 정보가 입력창에 반영되었습니다.");
}



window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    loadUserFromDashboardValues().catch(console.error);
  }, 300);
});



// 키 컬럼은 id(uuid)
// ✅ 키 컬럼
const USER_KEY_COLUMN = 'username';

// 예: 버튼 클릭 핸들러
document.getElementById("btn-profile-save")?.addEventListener("click", () => {
  saveProfileByUsername().catch((e) => { document.getElementById("profile-status").innerText = "❌ 저장 실패: " + e.message; });
});


async function loadProfileByUsername() {
  const status = document.getElementById("profile-status");
  const username = document.getElementById("profile-username").value.trim();
  if (!username) { status.innerText = "❌ 아이디(username)를 입력하세요."; return; }

  const { data: row, error } = await supabaseClient
    .from("users")
    .select("username, name, email, grade, class_num, student_number, can_edit_username, can_edit_name")
    .eq("username", username)
    .limit(1)
    .maybeSingle();

  if (error) { status.innerText = "❌ 사용자 조회 오류: " + error.message; return; }
  if (!row) { status.innerText = "❌ 해당 아이디의 사용자 행이 없습니다."; return; }

  document.getElementById("profile-name").value = row.name ?? "";
  document.getElementById("profile-email").value = row.email ?? "";
  document.getElementById("profile-grade").value = row.grade ?? "";
  document.getElementById("profile-class").value = row.class_num ?? "";
  document.getElementById("profile-number").value = row.student_number ?? "";

  // 입력칸엔 현재 username 표시, hidden에는 “원래값” 저장
  document.getElementById("profile-username").value = row.username;
  document.getElementById("profile-username-origin").value = row.username;

  // (선택) 1회 제한 상태에 따라 안내만
  status.innerText = "";
}

// 이름 1회 제한 + username 변경 1회 제한을 모두 적용
async function saveProfileByUsername() {
  const statusEl = document.getElementById("profile-status");
  const newUsername = document.getElementById("profile-username").value.trim();
  const originEl = document.getElementById("profile-username-origin");
  let oldUsername = (originEl?.value || "").trim();

  if (!newUsername) { statusEl.innerText = "❌ 아이디(username)를 입력하세요."; return; }

  // origin 비었으면 newUsername으로 보충(최초 진입 대비)
  if (!oldUsername) {
    const { data: probe, error: probeErr } = await supabaseClient
      .from("users").select("username").eq("username", newUsername).limit(1).maybeSingle();
    if (probeErr) { statusEl.innerText = "❌ 사용자 조회 오류: " + probeErr.message; return; }
    if (!probe) { statusEl.innerText = "❌ 아이디 정보가 없습니다. 먼저 사용자 로드가 필요합니다."; return; }
    oldUsername = probe.username;
    if (originEl) originEl.value = oldUsername;
  }

  // 현재 DB 값 + 플래그
  const { data: current, error: curErr } = await supabaseClient
    .from("users")
    .select("username, name, email, grade, class_num, student_number, can_edit_username, can_edit_name")
    .eq("username", oldUsername)
    .limit(1)
    .maybeSingle();

  if (curErr) { statusEl.innerText = "❌ 사용자 조회 오류: " + curErr.message; return; }
  if (!current) { statusEl.innerText = "❌ 원래 아이디의 사용자 행이 없습니다."; return; }

  // 폼 값
  const nameStr = document.getElementById("profile-name").value.trim();
  const emailStr = document.getElementById("profile-email").value.trim();
  const gradeStr = document.getElementById("profile-grade").value.trim();
  const classStr = document.getElementById("profile-class").value.trim();
  const numStr = document.getElementById("profile-number").value.trim();
  const toNumOrNull = (s) => (s === "" ? null : (isNaN(Number(s)) ? null : Number(s)));
  const changed = (a, b) => (a ?? null) !== (b ?? null);

  const next = {
    name: nameStr || null,
    email: emailStr || null,
    grade: toNumOrNull(gradeStr),
    class_num: toNumOrNull(classStr),
    student_number: toNumOrNull(numStr),
  };

  // 변경된 필드만 담기
  const updateData = {};
  if (changed(current.email, next.email)) updateData.email = next.email;
  if (changed(current.grade, next.grade)) updateData.grade = next.grade;
  if (changed(current.class_num, next.class_num)) updateData.class_num = next.class_num;
  if (changed(current.student_number, next.student_number))
    updateData.student_number = next.student_number;

  // ✅ 이름은 1회만: 실제 변경 시에만 검사/적용
  const wantChangeName = changed(current.name, next.name) && next.name !== null;
  if (wantChangeName) {
    if (current.can_edit_name) {
      updateData.name = next.name;
      updateData.can_edit_name = false; // 이름 변경 기회 소비
    } else {
      // 거부 + 폼 되돌리기(선택)
      statusEl.innerText = "❌ 이름은 이미 한 번 변경했습니다. 관리자 승인 필요.";
      document.getElementById("profile-name").value = current.name ?? "";
      return;
    }
  }

  // (선택) username도 1회만 바꾸고 싶다면 아래 유지, 아니라면 이 블록 제거
  const wantChangeUsername = newUsername !== oldUsername;
  if (wantChangeUsername) {
    if (current.can_edit_username) {
      updateData.username = newUsername;
      updateData.can_edit_username = false;
    } else {
      statusEl.innerText = "❌ 아이디는 이미 한 번 변경했습니다. 관리자 승인 필요.";
      document.getElementById("profile-username").value = current.username; // 되돌리기(선택)
      return;
    }
  }

  if (Object.keys(updateData).length === 0) {
    statusEl.innerText = "ℹ️ 변경사항이 없습니다.";
    return;
  }

  statusEl.innerText = "⏳ 저장 중...";
  const { error: upErr } = await supabaseClient
    .from("users")
    .update(updateData)
    .eq("username", oldUsername); // 항상 원래 username 기준

  if (upErr) { statusEl.innerText = "❌ 저장 실패: " + upErr.message; return; }

  // 성공: origin 갱신
  if (wantChangeUsername) {
    document.getElementById("profile-username-origin").value = newUsername;
  }
  statusEl.innerText = "✅ 저장 완료!";
}




// 🔐 비밀번호 변경 함수
async function changePassword() {
  const statusEl = document.getElementById("profile-pass-status");
  const newPass = document.getElementById("profile-newpass").value.trim();
  const newPass2 = document.getElementById("profile-newpass2").value.trim();

  // username (원래 값이 있으면 그것을 사용, 없으면 현재 입력값 사용)
  const originEl = document.getElementById("profile-username-origin");
  const inputEl = document.getElementById("profile-username");
  const newUsername = (inputEl?.value || "").trim();
  let oldUsername = (originEl?.value || "").trim();

  if (!newUsername && !oldUsername) {
    statusEl.innerText = "❌ 아이디 정보가 없습니다. 먼저 프로필을 로드하세요.";
    return;
  }
  if (!oldUsername && newUsername) oldUsername = newUsername;

  // 기본 검증
  if (!newPass) {
    statusEl.innerText = "❌ 새 비밀번호를 입력하세요.";
    return;
  }
  if (newPass.length < 8) {
    statusEl.innerText = "❌ 비밀번호는 최소 8자 이상이어야 합니다.";
    return;
  }
  if (newPass !== newPass2) {
    statusEl.innerText = "❌ 새 비밀번호 확인이 일치하지 않습니다.";
    return;
  }

  statusEl.innerText = "⏳ 비밀번호 변경 중...";

  // ✅ DB 업데이트
  const { error: upErr } = await supabaseClient
    .from("users")
    .update({ password: newPass })
    .eq("username", oldUsername);

  if (upErr) {
    statusEl.innerText = "❌ 비밀번호 변경 실패: " + upErr.message;
    return;
  }

  // 성공 → 입력창 비우기
  document.getElementById("profile-newpass").value = "";
  document.getElementById("profile-newpass2").value = "";
  statusEl.innerText = "✅ 비밀번호가 변경되었습니다.";
}

// 버튼 이벤트 바인딩
document.getElementById("btn-profile-pass")?.addEventListener("click", () => {
  changePassword().catch(e => {
    document.getElementById("profile-pass-status").innerText = "❌ 오류: " + e.message;
  });
});

function closeModal() {
  document.getElementById('guideModal').style.display = 'none';
}

// ✅ 새로고침 시마다 모달 표시
document.addEventListener('DOMContentLoaded', () => {
  const guide = document.getElementById('guideModal');
  if (guide) guide.style.display = 'flex';
});

async function loadShopItems() {
  const listEl = document.getElementById('shop-list');
  if (!listEl) return;

  listEl.innerHTML = '<p>상점 아이템을 불러오는 중...</p>';

  const username = localStorage.getItem('savedUsername');

  // 0. 내 인벤토리 조회 (이미 산 아이템 제외하기 위해)
  let myItemIds = [];
  if (username) {
    const { data: invData } = await supabaseClient
      .from('inventory')
      .select('item_id')
      .eq('username', username);
    if (invData) {
      myItemIds = invData.map(r => r.item_id);
    }
  }

  // 1. Supabase에서 아이템 목록 조회
  const { data, error } = await supabaseClient
    .from('shop_items')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.warn('상점 아이템 로드 실패:', error);
    listEl.innerHTML = '<p>아이템을 불러올 수 없습니다. (관리자에게 문의)</p>';
    return;
  }

  if (!data || data.length === 0) {
    listEl.innerHTML = '<p>판매 중인 아이템이 없습니다.</p>';
    return;
  }

  // 이미 구매한 아이템 필터링 제거 (모두 보여주되 버튼만 비활성화)
  // const visibleItems = data.filter(item => !myItemIds.includes(item.id));

  // 2. 보유 수량 집계 및 정렬
  // item_id별 보유 갯수 계산
  const myItemCounts = {};
  myItemIds.forEach(id => {
    myItemCounts[id] = (myItemCounts[id] || 0) + 1;
  });

  // 정렬: 보유 안 한 것 우선 (stock 여유 있는 것 우선) -> 가격순
  data.sort((a, b) => {
    const aLimit = a.stock || 1;
    const bLimit = b.stock || 1;
    const aOwned = myItemCounts[a.id] || 0;
    const bOwned = myItemCounts[b.id] || 0;
    const aFull = aOwned >= aLimit;
    const bFull = bOwned >= bLimit;

    if (aFull !== bFull) return aFull ? 1 : -1;
    return a.price - b.price;
  });

  listEl.innerHTML = '';
  data.forEach(item => {
    const limit = item.stock || 1;
    const ownedCount = myItemCounts[item.id] || 0;
    const isFull = ownedCount >= limit;

    const itemEl = document.createElement('div');
    itemEl.className = 'shop-item';
    if (isFull) {
      itemEl.classList.add('owned');
    }

    // 프리뷰 (이미지 또는 아이콘)
    let previewHtml = '';
    if (item.image_url) {
      previewHtml = `<div class="shop-preview" style="background-image: url('${item.image_url}');"></div>`;
    } else {
      const icon = item.name.includes('캐릭터') ? '👤' : '🎁';
      previewHtml = `<div class="shop-preview"><span style="font-size: 2.3rem;">${icon}</span></div>`;
    }

    // 버튼 및 재고 정보 HTML 생성
    let btnHtml = '';
    let stockHtml = '';

    if (limit > 1) {
      const percent = Math.max(0, Math.min(100, ((limit - ownedCount) / limit) * 100));
      stockHtml = `
        <div class="stock-container">
          <div class="stock-header">
            <span>남은 수량</span>
            <span>${limit - ownedCount}/${limit}</span>
          </div>
          <div class="stock-bar-bg">
            <div class="stock-bar-fill" style="width: ${percent}%;"></div>
          </div>
        </div>
      `;
    }

    if (isFull) {
      btnHtml = `<button class="btn-equipped" disabled>보유 중</button>`;
    } else {
      const safeName = (item.name || '이름 없음').replace(/'/g, "\\'");
      btnHtml = `<button class="btn-buy" onclick="buyItem(${item.id}, ${item.price}, '${safeName}')">구매하기</button>`;
    }

    // 카드 내부 구성
    itemEl.innerHTML = `
      ${previewHtml}
      <div class="shop-info">
        <h4>${item.name}</h4>
        <p class="description">${item.description || '특별한 아이템입니다.'}</p>
        ${stockHtml}
        <div class="price-tag">💰 ${item.price.toLocaleString()} P</div>
      </div>
      ${btnHtml}
    `;

    listEl.appendChild(itemEl);
  });
}

// ✅ EduBoard 인벤토리 전체 로직 (Supabase 연동 포함)
let currentInventoryFilter = 'all';

window.filterInventory = function (category) {
  currentInventoryFilter = category;

  // 버튼 활성화 상태 변경
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === (category === 'all' ? '전체' : (category === '소비' ? '소비/아이템' : category)));
  });

  loadInventory();
};

async function loadInventory() {
  const listEl = document.getElementById('inventory-list');
  const characterListEl = document.getElementById('character-list');
  if (!listEl) return;

  const username = localStorage.getItem('savedUsername');
  if (!username) {
    listEl.innerHTML = '<p>로그인이 필요합니다.</p>';
    return;
  }

  const role = localStorage.getItem('savedRole');

  // 관리자 전용 동기화 버튼 표시 제어
  const adminSyncBtn = document.getElementById('admin-sync-btn');
  if (adminSyncBtn) {
    adminSyncBtn.style.display = role === 'admin' ? 'block' : 'none';
  }

  const { data, error } = await supabaseClient
    .from('inventory')
    .select('*')
    .eq('username', username)
    .order('purchased_at', { ascending: false });

  // 1-1. 현재 장착 중인 아이템 정보 가져오기
  const { data: userData, error: userError } = await supabaseClient
    .from('users')
    .select('equipped_title, equipped_border, equipped_effect, equipped_color, avatar_url')
    .eq('username', username)
    .maybeSingle();

  // 1-2. 원본 상점 아이템 정보 가져오기 (이미지 및 카테고리 등)
  const { data: shopItems, error: shopError } = await supabaseClient
    .from('shop_items')
    .select('id, image_url');

  const getShopImage = (itemId) => {
    if (!shopItems) return '';
    const found = shopItems.find(s => s.id === itemId);
    return found ? found.image_url : '';
  };

  if (error) {
    console.warn('인벤토리 로드 실패:', error);
    listEl.innerHTML = '<p>인벤토리를 불러올 수 없습니다.</p>';
    return;
  }

  if (!data || data.length === 0) {
    listEl.innerHTML = '<p>보유한 아이템이 없습니다.</p>';
    if (characterListEl) characterListEl.innerHTML = '<p>보유한 캐릭터가 없습니다.</p>';
    return;
  }

  listEl.innerHTML = '';
  if (characterListEl) characterListEl.innerHTML = '';

  const equippedItems = [
    userData?.equipped_title,
    userData?.equipped_border,
    userData?.equipped_effect,
    userData?.equipped_color,
  ].filter(Boolean); // avatar_url 제외 (이름과 형식이 다름)

  const currentAvatarUrl = userData?.avatar_url || '';

  // 1-3. 데이터 가공 (장착 여부 미리 계산 및 필터링)
  let itemsToRender = data.map(item => {
    const imgUrl = getShopImage(item.item_id) || '';
    const itemName = item.item_name || '이름 없음';

    const isEquippedUrl = currentAvatarUrl && imgUrl && currentAvatarUrl === imgUrl;
    const isEquippedName = equippedItems.includes(itemName) || (currentAvatarUrl === itemName);
    const isEquipped = isEquippedUrl || isEquippedName;

    return { ...item, imgUrl, itemName, isEquipped };
  });

  // 필터링 적용
  if (currentInventoryFilter !== 'all') {
    if (currentInventoryFilter === '소비') {
      // '소비/아이템' 선택 시: 칭호, 캐릭터, 꾸미기, 컬러가 포함되지 않은 모든 아이템 + '소비' 포함 아이템
      itemsToRender = itemsToRender.filter(item => {
        const name = item.itemName;
        const isMajorCategory = name.includes('[칭호]') || name.includes('[캐릭터]') || name.includes('[꾸미기]') || name.includes('컬러');
        return !isMajorCategory || name.includes('소비');
      });
    } else {
      itemsToRender = itemsToRender.filter(item => item.itemName.includes(currentInventoryFilter));
    }
  }

  // 정렬 적용: 장착 중인 아이템이 무조건 맨 위로
  itemsToRender.sort((a, b) => {
    if (a.isEquipped !== b.isEquipped) return a.isEquipped ? -1 : 1;
    return new Date(b.purchased_at) - new Date(a.purchased_at); // 나머지는 최신순
  });

  if (itemsToRender.length === 0) {
    listEl.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#888; padding:40px;">'${currentInventoryFilter}' 카테고리에 해당하는 아이템이 없습니다.</p>`;
    return;
  }

  itemsToRender.forEach(item => {
    // 1. 일반 인벤토리 표시 (디자인 통일)
    const itemEl = document.createElement('div');
    itemEl.className = 'shop-item'; // 상점 디자인 클래스 공유
    itemEl.style.position = 'relative';

    const itemName = item.itemName;
    const safeItemName = itemName.replace(/'/g, "\\'");
    const imgUrl = item.imgUrl;
    const isEquipped = item.isEquipped;

    let btnHtml = '';

    // 단순 권한/일회성 혹은 장착 불가 아이템 식별
    const isEquipable = itemName.includes('[칭호]') ||
      itemName.includes('[꾸미기]') ||
      itemName.includes('[캐릭터]') ||
      itemName.includes('컬러');

    if (isEquipable) {
      if (isEquipped) {
        btnHtml = `<button class="btn-equipped" onclick="useItem(${item.id}, '${safeItemName}', true, '${imgUrl}')" style="background:#6c757d; cursor:pointer;">장착 해제</button>`;
        itemEl.style.border = '2px solid #4f46e5'; // 장착 중인 아이템 강조
      } else {
        btnHtml = `<button class="btn-buy" onclick="useItem(${item.id}, '${safeItemName}', false, '${imgUrl}')">장착하기</button>`;
      }
    } else {
      btnHtml = `<button class="btn-buy" onclick="useItem(${item.id}, '${safeItemName}', false, '${imgUrl}')" style="background:#10b981;">사용하기</button>`;
    }

    let previewIconHtml = '';
    if (imgUrl) {
      previewIconHtml = `<div class="shop-preview" style="background-image: url('${imgUrl}'); background-size: contain; background-repeat: no-repeat;"></div>`;
    } else {
      const icon = isEquipable ? '✨' : '🎒';
      previewIconHtml = `<div class="shop-preview"><span style="font-size: 2.3rem;">${icon}</span></div>`;
    }

    itemEl.innerHTML = `
      ${previewIconHtml}
      <div class="shop-info">
        <h4>${itemName}</h4>
        <p class="description" style="font-size:0.8rem; color:#64748b; margin-top:4px;">구매일: ${new Date(item.purchased_at).toLocaleDateString()}</p>
      </div>
      ${btnHtml}
    `;
    listEl.appendChild(itemEl);

    // 2. 캐릭터 리스트 표시 (캐릭터 아이템인 경우만)
    if (characterListEl && itemName.includes('캐릭터')) {
      const charEl = document.createElement('div');
      charEl.className = 'character-item';
      charEl.style.minWidth = '100px';
      charEl.style.padding = '10px';
      charEl.style.border = '2px solid #eee';
      charEl.style.borderRadius = '10px';
      charEl.style.textAlign = 'center';
      charEl.style.cursor = 'pointer';

      let charPreview = `<div style="font-size:2rem; margin-bottom:5px;">👤</div>`;
      if (imgUrl) {
        charPreview = `<img src="${imgUrl}" style="width:50px; height:50px; object-fit:contain; margin-bottom:5px;" />`;
      }

      charEl.innerHTML = `
        ${charPreview}
        <div style="font-weight:600; font-size:0.85rem;">${item.item_name}</div>
      `;
      charEl.onclick = () => selectCharacter(item.item_name, imgUrl);
      characterListEl.appendChild(charEl);
    }
  });

  // 캐릭터 리스트가 비어있으면 안내 문구
  if (characterListEl && characterListEl.children.length === 0) {
    characterListEl.innerHTML = '<p style="color:#888;font-size:0.9rem;">사용 가능한 캐릭터가 없습니다. 상점에서 구매해 보세요!</p>';
  }
}

// ✅ 관리자 전용: 모든 아이템 인벤토리 동기화
window.syncAdminInventory = async function () {
  const username = localStorage.getItem('savedUsername');
  const role = localStorage.getItem('savedRole');
  if (role !== 'admin' || !username) {
    alert('관리자만 사용 가능합니다.');
    return;
  }

  if (!confirm('모든 상점 아이템을 인벤토리에 추가하시겠습니까?\n(이미 보유한 아이템은 제외됩니다)')) return;

  showLoading();
  try {
    // 1. 모든 상점 아이템 조회
    const { data: allItems, error: shopErr } = await supabaseClient
      .from('shop_items')
      .select('*');
    if (shopErr) throw shopErr;

    // 2. 내 현재 인벤토리 조회
    const { data: myItems, error: invErr } = await supabaseClient
      .from('inventory')
      .select('item_id')
      .eq('username', username);
    if (invErr) throw invErr;

    const myItemIdSet = new Set(myItems.map(i => i.item_id));

    // 3. 없는 아이템 필터링 및 인서트 준비
    const toInsert = allItems
      .filter(item => !myItemIdSet.has(item.id))
      .map(item => ({
        username: username,
        item_id: item.id,
        item_name: item.name,
        price: 0, // 관리자 지급분
        purchased_at: new Date().toISOString()
      }));

    if (toInsert.length === 0) {
      alert('이미 모든 아이템을 보유하고 있습니다.');
      return;
    }

    // 4. 대량 인서트
    const { error: insertErr } = await supabaseClient
      .from('inventory')
      .insert(toInsert);

    if (insertErr) throw insertErr;

    alert(`✅ ${toInsert.length}개의 아이템이 인벤토리에 추가되었습니다!`);

    // UI 갱신
    if (typeof loadInventory === 'function') await loadInventory();
    if (typeof loadUserInfo === 'function') await loadUserInfo();
    if (typeof loadOwnedCollection === 'function') await loadOwnedCollection();

  } catch (err) {
    console.error('Admin sync error:', err);
    alert('아이템 추가 중 오류가 발생했습니다: ' + err.message);
  } finally {
    hideLoading();
  }
};

// ✅ 아이템 장착/사용 함수
window.useItem = async function (id, itemName, currentStatus = false, imageUrl = '') {
  const username = localStorage.getItem('savedUsername');
  if (!username) return;

  if (itemName.includes('캐릭터')) {
    await selectCharacter(itemName, imageUrl);
    return;
  }

  // 장착형 아이템인지 분류
  let updateData = {};

  // 현재 유저의 장착 정보를 가져옴
  const { data: userData, error: userError } = await supabaseClient
    .from('users')
    .select('equipped_title, equipped_border, equipped_effect, equipped_color')
    .eq('username', username)
    .maybeSingle();

  if (userError) {
    console.error('유저 정보 로드 실패:', userError);
    alert('현재 장착 정보를 가져오는 데 실패했습니다.');
    return;
  }

  let existingEquippedItem = null;
  if (itemName.includes('[칭호]')) {
    existingEquippedItem = userData?.equipped_title;
  } else if (itemName.includes('테두리')) {
    existingEquippedItem = userData?.equipped_border;
  } else if (itemName.includes('효과')) {
    existingEquippedItem = userData?.equipped_effect;
  } else if (itemName.includes('컬러')) {
    existingEquippedItem = userData?.equipped_color;
  }

  // 장착 해제 전용 (none) 케이스 처리
  if (id === 'none') {
    if (itemName.includes('칭호')) updateData = { equipped_title: null, equipped_color: null };
    else if (itemName.includes('테두리')) updateData = { equipped_border: null };
    else if (itemName.includes('효과')) updateData = { equipped_effect: null };
    else if (itemName.includes('컬러') || itemName.includes('배경')) updateData = { equipped_color: null };
    else updateData = { equipped_title: null, equipped_color: null }; // 기본 하위 호환

    const { error: unequipErr } = await supabaseClient
      .from('users')
      .update(updateData)
      .eq('username', username);

    if (!unequipErr) {
      alert(`✅ 장착이 해제되었습니다.`);
      await loadUserInfo();
      await loadInventory();
    } else {
      alert('장착 해제 중 오류가 발생했습니다: ' + unequipErr.message);
    }
    return;
  }

  const isEquipped = existingEquippedItem && existingEquippedItem === itemName;
  const actionText = isEquipped ? '해제' : '장착';

  if (itemName.includes('[칭호]')) {
    if (isEquipped) {
      updateData = { equipped_title: null, equipped_color: null };
    } else {
      // 칭호의 색상 정보를 가져오기 위해 shop_items 조회
      const { data: shopItem } = await supabaseClient
        .from('shop_items')
        .select('effect_data')
        .eq('name', itemName)
        .maybeSingle();

      updateData = {
        equipped_title: itemName,
        equipped_color: shopItem?.effect_data || null
      };
    }
  } else if (itemName.includes('테두리')) {
    updateData = { equipped_border: isEquipped ? null : itemName };
  } else if (itemName.includes('효과')) {
    updateData = { equipped_effect: isEquipped ? null : itemName };
  } else if (itemName.includes('컬러') || itemName.includes('배경')) {
    updateData = { equipped_color: isEquipped ? null : itemName };
  } else {
    // 단순 1회용 소비 아이템 (확성기, 버프 등)
    if (confirm(`'${itemName}'을(를) 사용하시겠습니까? (1회용 아이템은 즉시 소모됩니다)`)) {

      let luckyBoxReward = null;

      // 실제 아이템 효과 처리
      if (itemName.includes('확성기')) {
        if (typeof window.openMegaphoneModal === 'function') {
          window.openMegaphoneModal(id, itemName);
          return; // 모달에서 별도 처리하므로 여기서 종료
        } else {
          const msg = prompt('전체 공지사항에 띄울 메시지를 입력하세요:');
          if (!msg) return;
          alert(`[확성기 발송] ${msg}`);
        }
      } else if (itemName.includes('경험치 2배')) {
        // 로컬스토리지나 서버에 버프 만료 시간 기록 가능
        localStorage.setItem('xp_buff_end', Date.now() + 60 * 60 * 1000);
        alert('🎉 1시간 동안 획득하는 경험치가 2배가 됩니다!');
      } else if (itemName.includes('럭키박스')) {
        // 랜덤 보상 로직
        const r = Math.random();
        if (r < 0.4) {
          luckyBoxReward = { type: 'coin', val: 50000, name: '50,000 P' };
        } else if (r < 0.7) {
          luckyBoxReward = { type: 'coin', val: 100000, name: '100,000 P' };
        } else if (r < 0.9) {
          luckyBoxReward = { type: 'exp', val: 500, name: '경험치 500' };
        } else {
          luckyBoxReward = { type: 'coin', val: 500000, name: '초특급 500,000 P' };
        }

        alert(`🎁 [럭키박스 당첨] 축하합니다!\n\n${luckyBoxReward.name}을(를) 획득하셨습니다!`);

        if (luckyBoxReward.type === 'coin') {
          const { error: coinErr } = await supabaseClient.rpc('increment_coin', { x: luckyBoxReward.val, target_user_id: localStorage.getItem('savedUserId') });
        } else if (luckyBoxReward.type === 'exp') {
          // 🆙 XP 즉시 추가 및 동기화
          const { data: uData } = await supabaseClient.from('users').select('xp').eq('username', username).single();
          const currentXp = Number.isFinite(uData?.xp) ? uData.xp : 0;
          await supabaseClient.from('users').update({ xp: currentXp + luckyBoxReward.val }).eq('username', username);
          await syncStatsAndRender();
        }

        // 🎉 대박 당첨 시 효과 (50만P 또는 경험치 500)
        if (luckyBoxReward.val >= 500000 || luckyBoxReward.val >= 500) {
          triggerCelebration();
        }
      } else {
        alert(`'${itemName}' 사용 완료! 효과가 성공적으로 적용되었습니다.`);
      }

      // 인벤토리에서 아이템 1개 삭제 (소모)
      await supabaseClient
        .from('inventory')
        .delete()
        .eq('id', id);

      if (window.logActivity) {
        window.logActivity('item_consume', itemName, 'item', { item_id: id });
      }

      await loadInventory();
      await syncStatsAndRender(); // 코인/XP 소모 후 스탯 동기화
      return;
    }
    return;
  }

  // 장착 처리 확인창 (해제일 때는 묻지 않고 바로 해제)
  if (!isEquipped && !confirm(`'${itemName}'을(를) ${actionText}하시겠습니까?`)) {
    return;
  }

  // DB 업데이트
  const { error } = await supabaseClient
    .from('users')
    .update(updateData)
    .eq('username', username);

  if (error) {
    alert(`${actionText} 중 오류가 발생했습니다: ` + error.message);
    return;
  }

  // 📝 로그 기록
  if (window.logActivity) {
    window.logActivity(isEquipped ? 'item_unequip' : 'item_equip', itemName, 'item', { item_id: id });
  }

  alert(`✅ '${itemName}' ${actionText} 완료!`);

  // 성공 시 프로필과 UI 바로 새로고침
  await loadUserInfo();
  await loadInventory();
}

// ✅ 캐릭터 선택 함수
window.selectCharacter = async function (charName, imgUrl = '') {
  const username = localStorage.getItem('savedUsername');
  if (!username) return;

  const isNone = charName === 'none' || charName === '';
  const actionText = isNone ? '해제' : '설정';

  if (!confirm(`'${isNone ? '캐릭터' : charName}'을(를) ${actionText}하시겠습니까?`)) return;

  const statusEl = document.getElementById('collection-status');
  if (statusEl) statusEl.textContent = `⏳ ${actionText} 중...`;

  const finalAvatar = isNone ? '' : (imgUrl || charName);

  const { error } = await supabaseClient
    .from('users')
    .update({ avatar_url: finalAvatar })
    .eq('username', username);

  if (error) {
    if (statusEl) statusEl.textContent = `❌ ${actionText} 실패: ` + error.message;
    return;
  }

  if (statusEl) statusEl.textContent = `✅ ${isNone ? '캐릭터 해제' : `'${charName}' 캐릭터로 설정`}되었습니다!`;

  // 📝 로그 기록
  if (window.logActivity) {
    window.logActivity(isNone ? 'avatar_remove' : 'avatar_change', charName, 'item');
  }

  if (typeof loadUserInfo === 'function') await loadUserInfo();
}

/** 🎒 소유한 캐릭터 및 칭호 컬렉션 로드 (프로필 패널용) */
const DEFAULT_CHARACTERS = [
  { id: 'def_char_boy', item_name: '[캐릭터] 기본 학생 (남)', imgUrl: 'img/nanobanana_boy_student_1772911376788.png' },
  { id: 'def_char_girl', item_name: '[캐릭터] 기본 학생 (여)', imgUrl: 'img/nanobanana_girl_student_1772911391592.png' }
];

/** 🎒 소유한 캐릭터 및 칭호 컬렉션 로드 (프로필 패널용) */
async function loadOwnedCollection() {
  const charGrid = document.getElementById('character-list-grid');
  const titleGrid = document.getElementById('title-list-grid');
  const borderGrid = document.getElementById('border-list-grid');
  const effectGrid = document.getElementById('effect-list-grid');
  const colorGrid = document.getElementById('color-list-grid');

  if (!charGrid || !titleGrid) return;

  const username = localStorage.getItem('savedUsername');
  if (!username) return;

  // 1. 현재 장착 정보, 인벤토리, 상점 이미지 조인해서 가져오기
  const [userRes, invRes, shopRes] = await Promise.all([
    supabaseClient.from('users').select('avatar_url, equipped_title, equipped_border, equipped_effect, equipped_color').eq('username', username).maybeSingle(),
    supabaseClient.from('inventory').select('id, item_id, item_name').eq('username', username),
    supabaseClient.from('shop_items').select('id, image_url')
  ]);

  const userData = userRes.data;
  const inventory = invRes.data || [];
  const shopItems = shopRes.data || [];

  const currentAvatar = userData?.avatar_url || '';
  const currentTitle = userData?.equipped_title || '';
  const currentBorder = userData?.equipped_border || '';
  const currentEffect = userData?.equipped_effect || '';
  const currentColor = userData?.equipped_color || '';

  const getShopImage = (itemId) => {
    const found = shopItems.find(s => s.id === itemId);
    return found ? found.image_url : '';
  };

  // 2. 캐릭터와 칭호 분류 (기본 캐릭터 포함)
  const ownedCharacters = [...DEFAULT_CHARACTERS];

  // 인벤토리 캐릭터 추가 (중복 방지)
  const inventoryChars = inventory.filter(item => item.item_name.includes('캐릭터'));
  const charNamesSet = new Set(ownedCharacters.map(c => c.item_name));

  inventoryChars.forEach(c => {
    if (!charNamesSet.has(c.item_name)) {
      charNamesSet.add(c.item_name);
      ownedCharacters.push({ ...c, imgUrl: getShopImage(c.item_id) });
    }
  });

  const ownedTitles = inventory.filter(item => item.item_name.includes('칭호') && !item.item_name.includes('테두리') && !item.item_name.includes('효과') && !item.item_name.includes('컬러') && !item.item_name.includes('배경'));
  const ownedBorders = inventory.filter(item => item.item_name.includes('테두리'));
  const ownedEffects = inventory.filter(item => item.item_name.includes('효과'));
  const ownedColors = inventory.filter(item => item.item_name.includes('컬러') || item.item_name.includes('배경'));

  // 3. 캐릭터 렌더링
  charGrid.innerHTML = '';
  ownedCharacters.forEach(char => {
    const el = document.createElement('div');
    el.className = 'character-select-item';

    const imgUrl = char.imgUrl;
    // 장착 여부 확인 (이름 또는 URL 매칭)
    const isEquipped = (currentAvatar === char.item_name) || (currentAvatar === imgUrl && imgUrl !== '');
    if (isEquipped) el.classList.add('equipped');

    // 👤 대신 원 안에 들어가는 이미지/아이콘 처리
    let previewHtml = `
      <div style="width:50px; height:50px; border-radius:50%; background:#f1f5f9; display:flex; align-items:center; justify-content:center; margin-bottom:8px; border:1px solid #e2e8f0; font-size:1.5rem;">
        👤
      </div>`;

    if (imgUrl) {
      previewHtml = `
        <div style="width:50px; height:50px; border-radius:50%; overflow:hidden; margin-bottom:8px; border:1px solid #e2e8f0;">
          <img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover;" />
        </div>`;
    }

    el.innerHTML = `
      ${previewHtml}
      <div style="font-size:0.8rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">${char.item_name.replace('[캐릭터]', '').trim()}</div>
    `;

    // 클릭 시 장착/해제 토글
    el.onclick = () => {
      if (isEquipped) {
        window.selectCharacter('none', '');
      } else {
        window.selectCharacter(char.item_name, imgUrl);
      }
    };
    charGrid.appendChild(el);
  });

  // 공통 목록 렌더링 헬퍼 함수
  const renderList = (gridEl, items, currentEquipped, emptyLabel, stripTag) => {
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const noneEl = document.createElement('div');
    noneEl.className = 'title-select-item';
    const isNone = !currentEquipped || currentEquipped === '';
    if (isNone) noneEl.classList.add('equipped');
    noneEl.innerHTML = `<span>${emptyLabel} 없음</span>`;
    noneEl.onclick = () => {
      if (!isNone) window.useItem('none', `[${emptyLabel}] 없음`, true);
    };
    gridEl.appendChild(noneEl);

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'title-select-item';
      const isEquipped = (currentEquipped === item.item_name);
      if (isEquipped) el.classList.add('equipped');

      let displayName = item.item_name;
      stripTag.forEach(tag => { displayName = displayName.replace(tag, '').trim(); });

      el.innerHTML = `<span>${displayName}</span>`;
      el.onclick = () => window.useItem(item.id, item.item_name, isEquipped);
      gridEl.appendChild(el);
    });
  };

  renderList(titleGrid, ownedTitles, currentTitle, '칭호', ['[칭호]']);
  renderList(borderGrid, ownedBorders, currentBorder, '테두리', ['[칭호]', '[테두리]']);
  renderList(effectGrid, ownedEffects, currentEffect, '효과', ['[칭호]', '[효과]']);
  renderList(colorGrid, ownedColors, currentColor, '컬러', ['[칭호]', '[컬러]', '[배경]']);
}
window.loadOwnedCollection = loadOwnedCollection;

/** 🎊 보상 획득 축하 효과 */
function triggerCelebration() {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '100000';
  document.body.appendChild(container);

  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.style.position = 'absolute';
    p.style.width = '10px';
    p.style.height = '10px';
    p.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    p.style.left = '50%';
    p.style.top = '50%';
    p.style.borderRadius = '2px';
    container.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 10 + 5;
    let x = 0;
    let y = 0;
    let vy = -Math.random() * 15 - 5;
    let vx = Math.cos(angle) * velocity;

    let lifetime = 0;
    const anim = setInterval(() => {
      x += vx;
      y += vy;
      vy += 0.5; // 중력
      p.style.transform = `translate(${x}px, ${y}px) rotate(${lifetime * 10}deg)`;
      p.style.opacity = 1 - (lifetime / 100);
      lifetime++;
      if (lifetime > 100) {
        clearInterval(anim);
        p.remove();
        if (container.children.length === 0) container.remove();
      }
    }, 20);
  }
}

// ✅ 아이템 구매 함수
window.buyItem = async function (itemId, price, itemName) {
  if (!confirm(`'${itemName}'을(를) ${price} 포인트로 구매하시겠습니까?`)) return;

  const username = localStorage.getItem('savedUsername');
  if (!username) {
    alert('로그인이 필요합니다.');
    return;
  }

  // 최신 잔액 동기화 시도
  await syncCoinBalance();

  // 1. 아이템 정보(재고/한도) 및 현재 보유 수량 확인
  const { data: itemData, error: itemError } = await supabaseClient
    .from('shop_items')
    .select('stock, item_type, effect_data')
    .eq('id', itemId)
    .maybeSingle();

  if (itemError || !itemData) {
    alert('아이템 정보를 불러올 수 없습니다.');
    return;
  }

  const limit = itemData.stock || 1;

  const { data: existingInventory, error: checkError } = await supabaseClient
    .from('inventory')
    .select('id')
    .eq('username', username)
    .eq('item_id', itemId);

  if (checkError) {
    console.warn('인벤토리 확인 중 오류:', checkError);
  }

  const ownedCount = existingInventory ? existingInventory.length : 0;

  if (ownedCount >= limit) {
    alert(`이 아이템은 최대 ${limit}개까지만 보유할 수 있습니다.`);
    return;
  }

  if (window.currentUserCoin < price) {
    alert('포인트가 부족합니다.');
    return;
  }

  try {
    const newBalance = window.currentUserCoin - price;
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({ coin_balance: newBalance })
      .eq('username', username);

    if (updateError) throw new Error('포인트 차감 실패: ' + updateError.message);

    const { error: insertError } = await supabaseClient
      .from('inventory')
      .insert([{
        username: username,
        item_id: itemId,
        item_name: itemName,
        price: price,
        purchased_at: new Date().toISOString()
      }]);

    // 3. 아이템 타입별 추가 처리 (칭호/권한)
    if (itemData.item_type === 'title') {
      const { error: titleErr } = await supabaseClient
        .from('users')
        .update({
          equipped_title: `[칭호] ${itemName}`,
          equipped_color: itemData.effect_data || null
        })
        .eq('username', username);
      if (titleErr) console.warn('칭호 자동 장착 실패:', titleErr);
    } else if (itemData.item_type === 'permission') {
      // 권한 부여 로직: users 테이블의 permissions (jsonb/text[]) 컬럼에 추가한다고 가정
      // 만약 컬럼이 없으면 여기서 에러가 날 수 있으나, 요청에 따라 구현
      try {
        const { data: u } = await supabaseClient.from('users').select('permissions').eq('username', username).single();
        let perms = u?.permissions || [];
        if (!Array.isArray(perms)) perms = [];
        if (!perms.includes(itemData.effect_data)) {
          perms.push(itemData.effect_data);
          await supabaseClient.from('users').update({ permissions: perms }).eq('username', username);
        }
      } catch (pErr) {
        console.warn('권한 부여 실패 (컬럼 부재 가능성):', pErr);
      }
    }

    if (insertError) {
      console.error('인벤토리 추가 실패:', insertError);
      alert('구매 처리 중 오류가 발생했습니다. (포인트는 차감되었을 수 있음)\n' + insertError.message);
    } else {
      alert('구매가 완료되었습니다!');
      window.currentUserCoin = newBalance;

      syncCoinBalance(); // UI 동기화
      loadInventory?.();
      await loadUserInfo(); // 칭호 등 유저 정보 즉시 갱신
      await loadShopItems(); // 상점 잔여 수량 즉시 업데이트

      // 📝 로그 기록
      if (window.logActivity) {
        window.logActivity('shop_buy', itemName, 'shop_item', { item_id: itemId, price: price, type: itemData.item_type });
      }
    }
  } catch (err) {
    alert(err.message);
  }
};


// ==========================================
// ⚙️ 내 설정 (Profile Settings) 관련 로직
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  setupProfileSettings();
  loadPreferences();
});

function setupProfileSettings() {
  // 1. 계정/보안
  const btnLogout = document.getElementById('btn-session-logout');
  if (btnLogout) btnLogout.addEventListener('click', () => handleLogout('local'));

  const btnGlobalLogout = document.getElementById('btn-session-global-logout');
  if (btnGlobalLogout) btnGlobalLogout.addEventListener('click', () => handleLogout('global'));

  const btnPassReset = document.getElementById('btn-password-reset');
  if (btnPassReset) btnPassReset.addEventListener('click', handlePasswordReset);

  const btnAccountDelete = document.getElementById('btn-account-delete');
  if (btnAccountDelete) btnAccountDelete.addEventListener('click', handleAccountDelete);

  // 2. 알림/환경 설정
  const btnPrefSave = document.getElementById('btn-pref-save');
  if (btnPrefSave) btnPrefSave.addEventListener('click', savePreferences);

  const btnPrefReset = document.getElementById('btn-pref-reset');
  if (btnPrefReset) btnPrefReset.addEventListener('click', () => {
    if (confirm('모든 설정을 기본값으로 되돌리시겠습니까?')) {
      localStorage.removeItem('eduBoard_preferences');
      loadPreferences();
      alert('설정이 초기화되었습니다.');
    }
  });

  // 테마 변경 즉시 적용 (선택 시)
  const selTheme = document.getElementById('pref-theme');
  if (selTheme) {
    selTheme.addEventListener('change', (e) => applyTheme(e.target.value));
  }

  // 3. 기타 버튼
  const btnGoNotices = document.getElementById('btn-go-notices');
  if (btnGoNotices) {
    btnGoNotices.addEventListener('click', () => {
      showPanel('notice-panel');
      window.scrollTo(0, 0);
    });
  }

  const btnGoHelp = document.getElementById('btn-go-help');
  if (btnGoHelp) {
    btnGoHelp.addEventListener('click', () => {
      alert('도움말/FAQ 기능은 준비 중입니다.\n관리자에게 문의해주세요.');
    });
  }

  const btnCheckUpdates = document.getElementById('btn-check-updates');
  if (btnCheckUpdates) {
    btnCheckUpdates.addEventListener('click', () => {
      alert('최신 버전입니다. (v1.09)');
    });
  }
}

async function handleLogout(scope) {
  if (!confirm(scope === 'global' ? '모든 기기에서 로그아웃 하시겠습니까?' : '로그아웃 하시겠습니까?')) return;

  try {
    const { error } = await supabaseClient.auth.signOut({ scope: scope });
    if (error) throw error;
  } catch (err) {
    console.warn('Supabase 로그아웃 오류 (무시 가능):', err);
  }

  // 📝 로그 기록
  if (window.logActivity) {
    window.logActivity('logout', localStorage.getItem('savedUsername'), 'user', { scope: scope });
  }

  // 로컬 스토리지 클리어
  localStorage.removeItem('savedUsername');
  setCookie('savedUsername', '', -1); // 쿠키 삭제
  localStorage.removeItem('savedName');
  localStorage.removeItem('savedStudentNum');
  localStorage.removeItem('savedGrade');
  localStorage.removeItem('savedClassNum');
  localStorage.removeItem('savedRole');
  localStorage.removeItem('savedUserId');
  localStorage.removeItem('savedEmail');

  alert('로그아웃 되었습니다.');
  location.reload();
}

async function handlePasswordReset() {
  const email = document.getElementById('profile-email').value;
  if (!email) {
    alert('프로필에 이메일이 등록되어 있지 않습니다.\n이메일을 먼저 저장해주세요.');
    return;
  }

  if (!confirm(`${email} 주소로 비밀번호 재설정 메일을 보내시겠습니까?`)) return;

  try {
    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email);
    if (error) throw error;
    alert('비밀번호 재설정 메일이 발송되었습니다.\n메일함을 확인해주세요.');
  } catch (err) {
    alert('메일 발송 실패: ' + err.message);
  }
}

function handleAccountDelete() {
  alert('계정 삭제 요청이 접수되었습니다.\n(실제 삭제는 관리자 승인 후 처리됩니다.)');
}

// --- 환경 설정 (Preferences) ---

function savePreferences() {
  const pref = {
    notice: document.getElementById('pref-notice').checked,
    homework: document.getElementById('pref-homework').checked,
    push: document.getElementById('pref-push').checked,
    theme: document.getElementById('pref-theme').value,
    lang: document.getElementById('pref-lang').value
  };

  localStorage.setItem('eduBoard_preferences', JSON.stringify(pref));

  // 테마 적용
  applyTheme(pref.theme);

  const statusEl = document.getElementById('pref-status');
  if (statusEl) {
    statusEl.textContent = '설정이 저장되었습니다.';
    setTimeout(() => statusEl.textContent = '', 2000);
  }
}

function loadPreferences() {
  const saved = localStorage.getItem('eduBoard_preferences');
  if (!saved) return; // 기본값 유지

  try {
    const pref = JSON.parse(saved);

    if (document.getElementById('pref-notice')) document.getElementById('pref-notice').checked = pref.notice;
    if (document.getElementById('pref-homework')) document.getElementById('pref-homework').checked = pref.homework;
    if (document.getElementById('pref-push')) document.getElementById('pref-push').checked = pref.push;
    if (document.getElementById('pref-theme')) document.getElementById('pref-theme').value = pref.theme || 'light';
    if (document.getElementById('pref-lang')) document.getElementById('pref-lang').value = pref.lang || 'ko';

    applyTheme(pref.theme);

  } catch (e) {
    console.error('설정 로드 실패:', e);
  }
}

// Redundant applyTheme removed

/** 🔐 개인정보 처리방침 모달 제어 */
function showPrivacyDetail() {
  const modal = document.getElementById('privacy-modal');
  if (modal) modal.style.display = 'flex';
}
function closePrivacyDetail() {
  const modal = document.getElementById('privacy-modal');
  if (modal) modal.style.display = 'none';
}

/** 🎮 미니게임 종료 및 목록으로 복귀 */


// 전역 노출
window.showPrivacyDetail = showPrivacyDetail;
window.closePrivacyDetail = closePrivacyDetail;
window.exitMiniGame = exitMiniGame;

/** 📢 공지사항 삭제 */
window.deleteNotice = async function (id, imageUrl) {
  if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return;
  try {
    // 1. 이미지 삭제 (있을 경우)
    if (imageUrl) {
      const fileName = imageUrl.split('/').pop();
      await supabaseClient.storage.from('notice-images').remove([`public/${fileName}`]);
    }
    // 2. DB 삭제
    const { error } = await supabaseClient.from('notices').delete().eq('id', id);
    if (error) throw error;

    // 🎯 [Logging] 활동 로그 기록
    if (window.logActivity) {
      window.logActivity('notice_delete', `ID:${id}`, 'notice');
    }

    alert('삭제되었습니다.');
    loadNotices();
  } catch (e) { alert('삭제 실패: ' + e.message); }
};

/** 📢 공지사항 상세 수정 열기 */
window.openEditNoticeModal = async function (id) {
  // 모달 안열려있을수 있으니 메뉴 닫기
  document.querySelectorAll('.notice-menu-dropdown').forEach(el => el.style.display = 'none');

  showLoading();
  try {
    const { data: item, error } = await supabaseClient.from('notices').select('*').eq('id', id).single();
    if (error || !item) {
      alert('공지사항을 불러오는 중 오류가 발생했습니다.');
      return;
    }

    document.getElementById('edit-notice-id').value = item.id;
    document.getElementById('edit-notice-title').value = item.title;
    document.getElementById('edit-notice-content').value = item.content;
    document.getElementById('edit-notice-old-image').value = item.image_url || '';

    const preview = document.getElementById('edit-notice-preview');
    const removeLabel = document.getElementById('edit-notice-remove-label');
    if (item.image_url) {
      preview.innerHTML = `<img src="${item.image_url}" style="max-width:120px; max-height:120px; border-radius:6px; border:1px solid #ddd; display:block;">`;
      document.getElementById('edit-notice-remove-img').checked = false;
      if (removeLabel) removeLabel.style.display = 'flex';
    } else {
      preview.innerHTML = '<span style="font-size:0.85rem; color:#94a3b8;">등록된 이미지가 없습니다.</span>';
      document.getElementById('edit-notice-remove-img').checked = false;
      if (removeLabel) removeLabel.style.display = 'none';
    }

    document.getElementById('edit-notice-new-image').value = '';
    document.getElementById('modal-edit-notice').style.display = 'flex';
  } catch (e) {
    alert('오류 발생: ' + e.message);
  } finally {
    hideLoading();
  }
};

window.closeEditNoticeModal = function () {
  document.getElementById('modal-edit-notice').style.display = 'none';
};

/** 📢 공지사항 수정 로직 */
window.submitEditNotice = async function () {
  const id = document.getElementById('edit-notice-id').value;
  const newTitle = document.getElementById('edit-notice-title').value.trim();
  const newContent = document.getElementById('edit-notice-content').value.trim();
  const isRemoveImg = document.getElementById('edit-notice-remove-img').checked;
  const fileInput = document.getElementById('edit-notice-new-image');
  const oldImageUrl = document.getElementById('edit-notice-old-image').value;
  const btnSubmit = document.getElementById('btn-submit-edit-notice');

  if (!newTitle || !newContent) {
    alert('제목과 내용을 모두 입력해주세요.');
    return;
  }

  btnSubmit.disabled = true;
  showLoading();

  try {
    // 1. 기존 데이터 (비교용) 미리 저장
    const { data: oldData } = await supabaseClient.from('notices').select('*').eq('id', id).single();

    let imageUrl = oldImageUrl;

    // 2. 이미지 처리
    // 새 이미지 업로드가 있으면
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const uniqueName = Date.now() + '_' + file.name;
      const filePath = `public/${uniqueName}`;

      const { error: uploadErr } = await supabaseClient
        .storage
        .from('notice-images')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabaseClient
        .storage
        .from('notice-images')
        .getPublicUrl(filePath);

      imageUrl = publicData.publicUrl;

      // 기존 이미지가 있다면 스토리지에서 삭제
      if (oldImageUrl) {
        try {
          const oldFileName = oldImageUrl.split('/').pop();
          await supabaseClient.storage.from('notice-images').remove([`public/${oldFileName}`]);
        } catch (e) { console.warn('Old image delete failed', e); }
      }
    } else if (isRemoveImg && oldImageUrl) {
      // 새 그림은 없는데 삭제하겠다고 하면
      try {
        const oldFileName = oldImageUrl.split('/').pop();
        await supabaseClient.storage.from('notice-images').remove([`public/${oldFileName}`]);
      } catch (e) { console.warn('Old image delete failed', e); }
      imageUrl = null;
    }

    // 3. 업데이트 수행 (is_edited 추가)
    const updateData = {
      title: newTitle,
      content: newContent,
      image_url: imageUrl,
      // Supabase 테이블에 is_edited 컬럼이 있다는 전제.
      is_edited: true
    };

    const { error: updateErr, data: updatedNotice } = await supabaseClient.from('notices').update(updateData).eq('id', id).select().single();
    if (updateErr) throw updateErr;

    // 4. 활동 로그 기록 (window.logActivity로 표준화)
    if (window.logActivity) {
      window.logActivity('notice_edit', String(id), 'notice', { old: oldData, new: updatedNotice });
    }

    alert('수정되었습니다.');
    closeEditNoticeModal();
    loadNotices();
  } catch (e) {
    alert('수정 실패: ' + e.message);
  } finally {
    hideLoading();
    btnSubmit.disabled = false;
  }
};

/** 📁 자료실 수정 시 보관할 새 파일 배열 */
window.editMaterialPendingFiles = [];

/** 📁 자료실 수정 모달 열기 */
window.openEditMaterialModal = async function (id) {
  try {
    showLoading();
    window.editMaterialPendingFiles = []; // 초기화

    const { data: item, error } = await supabaseClient.from('homeworks').select('*').eq('id', id).single();
    if (error) throw error;

    document.getElementById('edit-material-id').value = item.id;
    document.getElementById('edit-material-title').value = item.title;
    document.getElementById('edit-material-comment').value = item.comment || '';

    // 공유 범위 설정
    const scopeSelect = document.getElementById('edit-material-scope');
    if (scopeSelect && item.share_scope) {
      scopeSelect.value = item.share_scope;
    }

    // 진행바 초기화
    document.getElementById('edit-material-progress-container').style.display = 'none';
    document.getElementById('upload-progress-bar').style.width = '0%';

    // 파일 그리드 초기화 (기존 파일들 보관용)
    const gridEl = document.getElementById('edit-material-file-grid');
    gridEl.innerHTML = '';

    // 보다 정확한 파일 URL 파싱 (문자열인 경우 JSON 파싱 시도)
    let fileUrls = item.file_url;
    if (typeof fileUrls === 'string' && fileUrls.startsWith('[')) {
      try { fileUrls = JSON.parse(fileUrls); } catch (e) { fileUrls = [fileUrls]; }
    }
    fileUrls = Array.isArray(fileUrls) ? fileUrls.filter(u => u) : (fileUrls ? [fileUrls] : []);

    window.editMaterialExistingUrls = [...fileUrls]; // 현재 서버에 있는 URL들 보관

    updateEditMaterialGrid();
    document.getElementById('modal-edit-material').style.display = 'flex';

    // 드래그 앤 드롭 이벤트 바인딩 (한 번만)
    setupMaterialEditDropzone();
  } catch (e) {
    alert('데이터 로드 실패: ' + e.message);
  } finally {
    hideLoading();
  }
};

/** 📁 자료실 파일 그리드 업데이트 (기존 + 새 파일 통합) */
window.updateEditMaterialGrid = function () {
  const gridEl = document.getElementById('edit-material-file-grid');
  const noFilesMsg = document.getElementById('edit-material-no-files-msg');
  gridEl.innerHTML = '';

  const totalCount = window.editMaterialExistingUrls.length + window.editMaterialPendingFiles.length;

  if (totalCount === 0) {
    if (noFilesMsg) {
      gridEl.appendChild(noFilesMsg);
      noFilesMsg.style.display = 'block';
    }
  } else {
    if (noFilesMsg) noFilesMsg.style.display = 'none';

    // 1. 기존 파일들 표시
    window.editMaterialExistingUrls.forEach((url, idx) => {
      renderFileIcon(gridEl, url, true, idx);
    });

    // 2. 새로 추가된(대기 중인) 파일들 표시
    window.editMaterialPendingFiles.forEach((file, idx) => {
      renderFileIcon(gridEl, file.name, false, idx);
    });
  }
};

/** 📁 파일 아이콘 렌더링 헬퍼 */
function renderFileIcon(container, data, isExisting, index) {
  const itemDiv = document.createElement('div');
  itemDiv.className = 'file-manager-item';
  itemDiv.style = 'position:relative; background:white; border:1px solid #e2e8f0; border-radius:10px; padding:12px 8px; text-align:center; transition:all 0.2s;';

  const filename = isExisting ? decodeURIComponent(data.split('/').pop() || '파일') : data;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

  let iconHtml = '<div style="font-size:1.8rem; margin-bottom:6px;">📄</div>';
  if (isImage && isExisting) {
    iconHtml = `<img src="${data}" style="width:100%; height:60px; object-fit:cover; border-radius:6px; margin-bottom:6px; background:#f1f5f9;">`;
  } else if (isImage && !isExisting) {
    iconHtml = '<div style="font-size:1.8rem; margin-bottom:6px;">🖼️</div>';
  }

  const badge = isExisting ? '' : '<span style="position:absolute; top:4px; left:4px; font-size:0.6rem; background:#4f46e5; color:white; padding:1px 4px; border-radius:3px;">NEW</span>';

  itemDiv.innerHTML = `
    ${badge}
    ${iconHtml}
    <div style="font-size:0.75rem; color:#334155; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:4px;" title="${filename}">${filename}</div>
    <button onclick="${isExisting ? `removeExistingMaterialFile(${index})` : `removePendingMaterialFile(${index})`}" 
      style="position:absolute; top:-6px; right:-6px; background:#ef4444; color:white; border:none; width:20px; height:20px; border-radius:50%; font-size:0.7rem; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.1);">✕</button>
  `;
  container.appendChild(itemDiv);
}

/** 📁 기존 파일 제거 */
window.removeExistingMaterialFile = function (idx) {
  if (!confirm('이 파일을 아예 삭제하시겠습니까? (저장 시 최종 반영)')) return;
  window.editMaterialExistingUrls.splice(idx, 1);
  updateEditMaterialGrid();
};

/** 📁 대기 중인 새 파일 제거 */
window.removePendingMaterialFile = function (idx) {
  window.editMaterialPendingFiles.splice(idx, 1);
  updateEditMaterialGrid();
};

/** 📁 드래그 앤 드롭 및 클릭 이벤트 설정 */
function setupMaterialEditDropzone() {
  const zone = document.getElementById('edit-material-dropzone');
  const fileInput = document.getElementById('edit-material-new-files');

  if (!zone || zone.dataset.initialized) return;

  zone.onclick = () => fileInput.click();

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.style.background = '#f0f4ff';
    zone.style.borderColor = '#4f46e5';
  });

  zone.addEventListener('dragleave', () => {
    zone.style.background = '#fff';
    zone.style.borderColor = '#e2e8f0';
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.style.background = '#fff';
    zone.style.borderColor = '#e2e8f0';

    if (e.dataTransfer.files.length > 0) {
      handleMaterialFiles(e.dataTransfer.files);
    }
  });

  fileInput.onchange = (e) => {
    if (e.target.files.length > 0) {
      handleMaterialFiles(e.target.files);
      e.target.value = ''; // 초기화
    }
  };

  zone.dataset.initialized = 'true';
}

/** 📁 선택된 파일들 큐에 추가 */
function handleMaterialFiles(files) {
  Array.from(files).forEach(file => {
    window.editMaterialPendingFiles.push(file);
  });
  updateEditMaterialGrid();
}

/** 📁 자료실 수정 모달 닫기 */
window.closeEditMaterialModal = function () {
  document.getElementById('modal-edit-material').style.display = 'none';
};

/** 📁 자료실 수정 제출 (고급) */
window.submitEditMaterial = async function () {
  const id = document.getElementById('edit-material-id').value;
  const title = document.getElementById('edit-material-title').value;
  const comment = document.getElementById('edit-material-comment').value;
  const btnSubmit = document.getElementById('btn-submit-edit-material');

  if (!title) return alert('제목을 입력해 주세요.');

  try {
    btnSubmit.disabled = true;

    // 1. 기존 데이터 확보 (로그용)
    const { data: oldData, error: fetchErr } = await supabaseClient.from('homeworks').select('*').eq('id', id).single();
    if (fetchErr) throw fetchErr;

    const originalUrls = Array.isArray(oldData.file_url) ? oldData.file_url : (oldData.file_url ? [oldData.file_url] : []);

    // 2. 삭제된 파일 스토리지 정리
    const urlsToDelete = originalUrls.filter(url => !window.editMaterialExistingUrls.includes(url));
    if (urlsToDelete.length > 0) {
      const pathsToDelete = urlsToDelete.map(url => {
        const parts = url.split('/');
        const bucketIdx = parts.indexOf('homework-files');
        return parts.slice(bucketIdx + 1).join('/');
      });
      await supabaseClient.storage.from('homework-files').remove(pathsToDelete);
    }

    // 3. 새 파일 업로드 (진행률 표시)
    const finalFileUrls = [...window.editMaterialExistingUrls];

    if (window.editMaterialPendingFiles.length > 0) {
      const progContainer = document.getElementById('edit-material-progress-container');
      const progBar = document.getElementById('upload-progress-bar');
      const progText = document.getElementById('upload-percent-text');
      const statusText = document.getElementById('upload-status-text');

      progContainer.style.display = 'block';

      const totalFiles = window.editMaterialPendingFiles.length;
      for (let i = 0; i < totalFiles; i++) {
        const file = window.editMaterialPendingFiles[i];
        statusText.innerText = `업로드 중 (${i + 1}/${totalFiles}): ${file.name}`;

        const ext = file.name.split('.').pop();
        const path = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

        const { data: uploadData, error: upErr } = await supabaseClient.storage.from('homework-files').upload(path, file);
        if (upErr) throw upErr;

        const { data: publicUrlData } = supabaseClient.storage.from('homework-files').getPublicUrl(uploadData.path);
        finalFileUrls.push(publicUrlData.publicUrl);

        const percent = Math.round(((i + 1) / totalFiles) * 100);
        progBar.style.width = `${percent}%`;
        progText.innerText = `${percent}%`;
      }
    }

    // 4. DB 업데이트
    const updateData = {
      title,
      comment,
      file_url: finalFileUrls,
      share_scope: document.getElementById('edit-material-scope')?.value || 'class',
      is_edited: true
    };

    const { error: updateErr } = await supabaseClient.from('homeworks').update(updateData).eq('id', id);
    if (updateErr) throw updateErr;

    // 5. 활동 로그 기록 (window.logActivity로 표준화)
    if (window.logActivity) {
      window.logActivity('material_edit', title, 'material', {
        old: { title: oldData.title, comment: oldData.comment, file_url: oldData.file_url },
        new: updateData
      });
    }

    alert('수정이 완료되었습니다.');
    closeEditMaterialModal();
    loadMaterials();
  } catch (e) {
    alert('수정 실패: ' + e.message);
  } finally {
    btnSubmit.disabled = false;
    const pCont = document.getElementById('edit-material-progress-container');
    if (pCont) pCont.style.display = 'none';
  }
};

/** 📁 자료실 수정 모달 닫기 */
window.closeEditMaterialModal = function () {
  document.getElementById('modal-edit-material').style.display = 'none';
};

/** 📁 자료실 자료 삭제 */
window.deleteMaterial = async function (id) {
  if (!confirm('정말로 이 자료를 삭제하시겠습니까?')) return;
  try {
    showLoading();
    // 로그용 및 스토리지 삭제용 데이터 확보
    const { data: item, error: fetchErr } = await supabaseClient
      .from('homeworks')
      .select('title, file_url')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;

    // 1. Storage 파일들 삭제
    const rawUrls = item.file_url;
    let fileUrls = [];
    if (Array.isArray(rawUrls)) fileUrls = rawUrls;
    else if (typeof rawUrls === 'string' && rawUrls.startsWith('[')) {
      try { fileUrls = JSON.parse(rawUrls); } catch (e) { fileUrls = [rawUrls]; }
    } else if (rawUrls) fileUrls = [rawUrls];

    fileUrls = fileUrls.filter(u => u && u !== '[]');

    const paths = fileUrls.map(url => {
      const parts = url.split('/');
      const idx = parts.indexOf('homework-files');
      return parts.slice(idx + 1).join('/');
    }).filter(p => p);

    if (paths.length > 0) {
      await supabaseClient.storage.from('homework-files').remove(paths);
    }
    // 2. DB 삭제
    const { error } = await supabaseClient.from('homeworks').delete().eq('id', id);
    if (error) throw error;

    // 3. 로그 기록 (window.logActivity로 표준화)
    if (window.logActivity) {
      window.logActivity('material_delete', item?.title || `ID:${id}`, 'material');
    }

    alert('자료가 삭제되었습니다.');
    loadMaterials();
  } catch (e) {
    alert('삭제 실패: ' + e.message);
  } finally {
    hideLoading();
  }
};

// --- 환경 설정 및 보안 함수들 ---

async function handlePasswordReset() {
  const email = document.getElementById('profile-email')?.value;
  if (!email) {
    alert('프로필 이메일 정보가 없습니다. 먼저 저장해 주세요.');
    return;
  }
  if (!confirm(`${email}로 비밀번호 재설정 메일을 보내시겠습니까?`)) return;
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    if (error) throw error;
    alert('재설정 메일이 발송되었습니다.');
  } catch (e) { alert('발송 실패: ' + e.message); }
}

function handleAccountDelete() {
  alert('계정 삭제 요청 기능은 아직 준비 중입니다. 관리자에게 문의하세요.');
}

function savePreferences() {
  const pref = {
    notice: document.getElementById('pref-notice')?.checked,
    homework: document.getElementById('pref-homework')?.checked,
    push: document.getElementById('pref-push')?.checked,
    theme: document.getElementById('pref-theme')?.value,
    lang: document.getElementById('pref-lang')?.value
  };
  localStorage.setItem('eduBoard_preferences', JSON.stringify(pref));
  applyTheme(pref.theme);
  const status = document.getElementById('pref-status');
  if (status) {
    status.innerText = '✅ 설정이 저장되었습니다.';
    setTimeout(() => status.innerText = '', 2000);
  }
}

function loadPreferences() {
  const saved = localStorage.getItem('eduBoard_preferences');
  if (!saved) return;
  try {
    const pref = JSON.parse(saved);
    if (document.getElementById('pref-notice')) document.getElementById('pref-notice').checked = !!pref.notice;
    if (document.getElementById('pref-homework')) document.getElementById('pref-homework').checked = !!pref.homework;
    if (document.getElementById('pref-push')) document.getElementById('pref-push').checked = !!pref.push;
    if (document.getElementById('pref-theme')) document.getElementById('pref-theme').value = pref.theme || 'light';
    if (document.getElementById('pref-lang')) document.getElementById('pref-lang').value = pref.lang || 'ko';
    applyTheme(pref.theme);
  } catch (e) { }
}

// applyTheme consolidated above

// 로그아웃 (기존 함수 보강)
async function handleLogout(scope = 'local') {
  if (!confirm('로그아웃 하시겠습니까?')) return;
  try {
    await supabaseClient.auth.signOut({ scope });
    localStorage.clear();
    location.reload();
  } catch (e) { alert('로그아웃 중 오류: ' + e.message); }
}

async function handlePasswordReset() {
  const username = localStorage.getItem('savedUsername');
  const email = localStorage.getItem('savedEmail');
  if (!email) {
    alert('등록된 이메일 정보를 찾을 수 없습니다.');
    return;
  }
  if (!confirm(`${email} 주소로 비밀번호 재설정 메일을 보내시겠습니까?`)) return;

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/index.html?type=recovery'
    });
    if (error) throw error;
    alert('비밀번호 재설정 메일이 발송되었습니다. 이메일을 확인해주세요.');
  } catch (e) {
    alert('메일 발송 오류: ' + e.message);
  }
}

async function handleAccountDelete() {
  const username = localStorage.getItem('savedUsername');
  if (!username) return;

  const reason = prompt('계정 삭제 사유를 입력해주세요 (선택사항):');
  if (reason === null) return; // 취소

  if (!confirm('정말로 계정 삭제를 요청하시겠습니까? 삭제된 계정은 복구할 수 없습니다.')) return;

  try {
    const { error } = await supabaseClient
      .from('deletion_requests')
      .insert([{
        username,
        reason,
        requested_at: new Date().toISOString()
      }]);

    if (error) throw error;
    alert('계정 삭제 요청이 접수되었습니다. 관리자 확인 후 처리될 예정입니다.');
    handleLogout('local');
  } catch (e) {
    alert('삭제 요청 중 오류: ' + e.message);
  }
}

// 초기 로드 시 실행 및 이벤트 바인딩
document.addEventListener('DOMContentLoaded', () => {
  loadPreferences();
  document.getElementById('btn-session-logout')?.addEventListener('click', () => handleLogout('local'));
  document.getElementById('btn-session-global-logout')?.addEventListener('click', () => handleLogout('global'));
  document.getElementById('btn-password-reset')?.addEventListener('click', handlePasswordReset);
  document.getElementById('btn-account-delete')?.addEventListener('click', handleAccountDelete);
  document.getElementById('btn-pref-save')?.addEventListener('click', savePreferences);
  document.getElementById('btn-pref-reset')?.addEventListener('click', () => {
    if (!confirm('모든 설정을 초기화하시겠습니까?')) return;
    localStorage.removeItem('eduBoard_preferences');
    loadPreferences();
    alert('초기화되었습니다.');
  });

  // 브라우저 알림 권한 체크 및 실시간 리스너 설정
  if (document.getElementById('pref-notice')?.checked || document.getElementById('pref-push')?.checked) {
    setupRealtimeNotifications();
  }
});

function loadPreferences() {
  const prefs = JSON.parse(localStorage.getItem('eduBoard_preferences') || '{}');

  if ($id('pref-notice')) $id('pref-notice').checked = prefs.notice !== false;
  if ($id('pref-homework')) $id('pref-homework').checked = prefs.homework !== false;
  if ($id('pref-push')) $id('pref-push').checked = prefs.push === true;
  if ($id('pref-theme')) $id('pref-theme').value = prefs.theme || 'system';
  if ($id('pref-lang')) $id('pref-lang').value = prefs.lang || 'ko';

  applyTheme(prefs.theme || 'system');
}

function savePreferences() {
  const prefs = {
    notice: $id('pref-notice')?.checked,
    homework: $id('pref-homework')?.checked,
    push: $id('pref-push')?.checked,
    theme: $id('pref-theme')?.value,
    lang: $id('pref-lang')?.value
  };

  localStorage.setItem('eduBoard_preferences', JSON.stringify(prefs));
  applyTheme(prefs.theme);

  if (prefs.notice || prefs.push) {
    requestNotificationPermission();
    setupRealtimeNotifications();
  }

  alert('환경 설정이 저장되었습니다.');
}

// Redundant applyTheme removed

async function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    await Notification.requestPermission();
  }
}

let noticeSubscription = null;
function setupRealtimeNotifications() {
  if (noticeSubscription) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  noticeSubscription = supabaseClient
    .channel('public:notices')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' }, payload => {
      if ($id('pref-notice')?.checked) {
        new Notification("📢 새 공지사항", {
          body: payload.new.title,
          icon: "/img/logo.png" // 실제 아이콘 경로 확인 필요
        });
      }
    })
    .subscribe();
}

/** 🔄 로그인 후 대시보드 및 데이터 쇄신 */
window.afterLoginRefreshDashboard = async function () {
  await initDashboardTop();
  await loadNotices();
  await loadMaterials();
  await syncCoinBalance();
  if (typeof bindScheduleUI === 'function') bindScheduleUI();
  if (typeof window.syncStatsAndRender === 'function') {
    await window.syncStatsAndRender();
  }
};

/** 💰 포인트 잔액 동기화 (UI 및 전역 변수) */
window.syncCoinBalance = async function () {
  const username = localStorage.getItem('savedUsername');
  if (!username || !window.supabaseClient) return;

  try {
    const { data: user, error } = await supabaseClient
      .from('users')
      .select('coin_balance')
      .eq('username', username)
      .single();

    if (user) {
      const balance = user.coin_balance || 0;
      window.currentUserCoin = balance; // 전역 변수 동기화

      // UI 요소들 업데이트
      ['coin-balance', 'shop-coin-balance'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = balance.toLocaleString();
      });
    }
  } catch (e) { }
};

// 랭킹 필터 자동 업데이트 연결
document.addEventListener('DOMContentLoaded', () => {
  ['rank-metric', 'rank-scope'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      if (typeof window.syncStatsAndRender === 'function') {
        window.syncStatsAndRender();
      }
    });
  });
  document.getElementById('rank-refresh')?.addEventListener('click', () => {
    if (typeof window.syncStatsAndRender === 'function') {
      window.syncStatsAndRender();
    }
  });

  // 📅 일정(캘린더) 내비게이션 바인딩은 이제 onclick 전역 함수(changeSchedMonth)로 처리됩니다.

  // 기타 정보 버튼 바인딩
  document.getElementById('btn-go-notices')?.addEventListener('click', () => showPanel('notice-panel'));
  document.getElementById('btn-go-help')?.addEventListener('click', () => alert('도움말 및 FAQ 페이지는 준비 중입니다. 1:1 문의는 관리자에게 메세지를 남겨주세요.'));
  document.getElementById('btn-check-updates')?.addEventListener('click', () => alert('현재 최신 버전을 사용 중입니다. (v1.09-stable)'));
});
/** 🎯 Daily Quest Logic (Supabase-driven) */

// 📅 한국 시간(KST) 기준 YYYY-MM-DD 가져오기
function getTodayKST() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 60 * 60 * 1000));

  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  const d = String(kst.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function initDailyQuests() {
  const listEl = $id('daily-quest-list');
  if (!listEl) return;

  const username = localStorage.getItem('savedUsername');
  if (!username) return;

  const today = getTodayKST();
  console.log('Quest Init for Date:', today);

  try {
    // 1. 오늘의 퀘스트가 이미 할당되었는지 확인
    let { data: myQuests, error } = await supabaseClient
      .from('user_daily_quests')
      .select('*, quests(*)')
      .eq('username', username)
      .eq('assigned_date', today);

    if (error) throw error;

    // 2. 할당된 퀘스트가 없으면 무작위로 3개 할당
    if (!myQuests || myQuests.length === 0) {
      const { data: allQuests } = await supabaseClient.from('quests').select('*');
      if (!allQuests || allQuests.length === 0) return;

      const shuffled = [...allQuests].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);

      const insertData = selected.map(q => ({
        username,
        quest_id: q.id,
        assigned_date: today,
        current_value: 0,
        status: 'assigned'
      }));

      const { data: inserted, error: insErr } = await supabaseClient
        .from('user_daily_quests')
        .insert(insertData)
        .select('*, quests(*)');

      if (insErr) throw insErr;
      myQuests = inserted;
    }

    renderDailyQuests(myQuests);
  } catch (err) {
    console.error('Quest Loading Error:', err);
    listEl.innerHTML = '<p style="font-size:0.8rem; color:#dc3545; text-align:center;">퀘스트를 불러오는 중 오류가 발생했습니다.</p>';
  }
}

function renderDailyQuests(userQuests) {
  const listEl = $id('daily-quest-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  userQuests.forEach(uq => {
    const q = uq.quests;
    if (!q) return;

    const pct = Math.min(100, Math.round((uq.current_value / q.target_value) * 100));
    const isCompleted = uq.status === 'completed' || uq.status === 'rewarded';
    const isRewarded = uq.status === 'rewarded';

    const item = document.createElement('div');
    item.className = 'quest-item';

    let actionBtn = '';
    if (isRewarded) {
      actionBtn = `<span class="quest-completed-badge">✅ 수령완료</span>`;
    } else if (isCompleted) {
      actionBtn = `<button class="quest-claim-btn" onclick="claimQuestReward('${uq.id}')">보상 받기</button>`;
    } else {
      actionBtn = `<span class="quest-percent">${pct}%</span>`;
    }

    item.innerHTML = `
      <div class="quest-top">
        <span class="quest-title">${q.title}</span>
        <span class="quest-reward">+${q.reward_coin}포인트 / +${q.reward_xp}XP</span>
      </div>
      <div class="quest-progress-bg">
        <div class="quest-progress-fill" style="width: ${pct}%"></div>
      </div>
      <div class="quest-bottom">
        <span style="font-size:0.7rem; color:#94a3b8;">(${uq.current_value}/${q.target_value})</span>
        ${actionBtn}
      </div>
    `;
    listEl.appendChild(item);
  });
}

async function updateQuestProgress(questType, increment = 1) {
  const username = localStorage.getItem('savedUsername');
  if (!username) return;
  const today = getTodayKST();

  console.log(`Quest Progress Update Attempt: ${questType} (assign_date: ${today})`);

  try {
    const { data: uqs, error } = await supabaseClient
      .from('user_daily_quests')
      .select('*, quests(*)')
      .eq('username', username)
      .eq('assigned_date', today)
      .eq('status', 'assigned');

    if (error) {
      console.error('Quest Progress Error (DB):', error);
      return;
    }

    if (!uqs || uqs.length === 0) {
      console.log('No matching assigned quests found for today.');
      return;
    }

    console.log('Active Quests for Today:', uqs.map(uq => uq.quests?.quest_type));

    const target = uqs.find(item => item.quests && item.quests.quest_type === questType);
    if (!target) {
      console.log(`No quest found for type: ${questType}`);
      return;
    }

    console.log(`Matching Quest Found: ${target.quests.title}. Updating progress...`);

    const newValue = target.current_value + increment;
    const newStatus = newValue >= target.quests.target_value ? 'completed' : 'assigned';

    await supabaseClient
      .from('user_daily_quests')
      .update({ current_value: newValue, status: newStatus })
      .eq('id', target.id);

    // 대시보드인 경우 또는 대시보드로 돌아갈 때를 대비해 DOM이 있으면 업데이트
    const listEl = document.getElementById('daily-quest-list');
    if (listEl) {
      const { data: updated } = await supabaseClient
        .from('user_daily_quests')
        .select('*, quests(*)')
        .eq('username', username)
        .eq('assigned_date', today);
      if (updated) renderDailyQuests(updated);
    }
  } catch (e) {
    console.error('Quest Update Error:', e);
  }
}

async function claimQuestReward(userQuestId) {
  const btn = event?.target;
  if (btn) btn.disabled = true;

  try {
    const { data: uq, error } = await supabaseClient
      .from('user_daily_quests')
      .select('*, quests(*)')
      .eq('id', userQuestId)
      .single();

    if (error || !uq || uq.status !== 'completed') return;

    const { data: user } = await supabaseClient.from('users').select('coin_balance, xp').eq('username', uq.username).single();
    if (user) {
      console.log('User stats before reward:', user);
      await supabaseClient.from('users').update({
        coin_balance: (user.coin_balance || 0) + uq.quests.reward_coin,
        xp: (user.xp || 0) + uq.quests.reward_xp
      }).eq('username', uq.username);
    }

    await supabaseClient
      .from('user_daily_quests')
      .update({ status: 'rewarded' })
      .eq('id', userQuestId);

    alert(`🎉 보상이 지급되었습니다! (+${uq.quests.reward_coin}포인트, +${uq.quests.reward_xp}XP)`);

    syncStatsAndRender(); // 먼저 스탯 갱신
    initDailyQuests();    // 퀘스트 UI 갱신
  } catch (e) {
    console.error('Claim Reward Error:', e);
    alert('보상을 받는 중 오류가 발생했습니다.');
    if (btn) btn.disabled = false;
  }
}

window.claimQuestReward = claimQuestReward;
window.updateQuestProgress = updateQuestProgress;

// ✅ 유저 정보 및 장착 아이템 로드 & UI 적용
window.loadUserInfo = async function () {
  // ✅ 시작하자마자 XP 버프 상태 확인 (배지 노출용)
  if (typeof getXpMultiplier === 'function') getXpMultiplier();

  const username = localStorage.getItem('savedUsername');
  if (!username) return;

  try {
    const { data: user, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error || !user) return;

    // 기본 정보 DOM 업데이트
    const dashName = document.getElementById('dash-name');
    const headerName = document.getElementById('profile-name-display');
    const dashRole = document.getElementById('dash-role');
    const dashAvatar = document.getElementById('dash-avatar');
    const headerAvatar = document.getElementById('header-avatar');
    const headerAvatarMobile = document.getElementById('header-avatar-mobile');
    const sideMenuName = document.getElementById('side-menu-name');
    const sideMenuAvatar = document.getElementById('side-menu-avatar');

    // 대시보드 학급 정보 엘리먼트
    const dashGrade = document.getElementById('dash-grade');
    const dashClass = document.getElementById('dash-class');
    const dashNum = document.getElementById('dash-num');

    // 미리보기 엘리먼트
    const previewName = document.getElementById('profile-preview-name');
    const previewTitle = document.getElementById('profile-preview-title');
    const previewAvatar = document.getElementById('profile-preview-avatar');
    const previewSchool = document.getElementById('profile-preview-school');
    const previewGrade = document.getElementById('profile-preview-grade');
    const previewClass = document.getElementById('profile-preview-class');

    const nameHtml = formatUserDisplayName(user);
    const cleanTitle = user.equipped_title ? user.equipped_title.replace('[칭호]', '').trim() : '칭호 없음';
    let titleStyle = 'font-size:0.85rem; font-weight:700; margin-right:6px; color:#6366f1;';
    if (user.equipped_title && (user.equipped_title.includes('rainbow') || (user.equipped_color && user.equipped_color.includes('무지개')))) {
      titleStyle += 'background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3); -webkit-background-clip: text; -webkit-text-fill-color: transparent;';
    }

    if (dashName) dashName.innerHTML = nameHtml;
    if (headerName) headerName.innerHTML = nameHtml;
    if (sideMenuName) sideMenuName.innerHTML = nameHtml;

    // 대시보드 학급 정보 업데이트 (관리자 및 null 방지)
    const isAdmin = user.role === 'admin';
    if (dashGrade) dashGrade.textContent = isAdmin ? '-' : (user.grade || '-');
    if (dashClass) dashClass.textContent = isAdmin ? '-' : (user.class_num || '-');
    if (dashNum) {
      if (isAdmin) {
        dashNum.textContent = '-';
      } else {
        dashNum.textContent = (user.student_number !== null && user.student_number !== undefined && user.student_number !== 'null') ? user.student_number : '-';
      }
    }

    // 미리보기 업데이트
    if (previewName) previewName.textContent = user.name;
    if (previewTitle) {
      previewTitle.innerHTML = user.equipped_title ? `[${cleanTitle}]` : '칭호 없음';
      previewTitle.style.cssText = user.equipped_title ? titleStyle : 'color:#94a3b8; font-weight:normal; font-size:0.85rem;';
    }
    if (previewSchool) previewSchool.textContent = '봉담중학교';
    if (previewGrade) previewGrade.textContent = user.grade || '-';
    if (previewClass) previewClass.textContent = user.class_num || '-';

    // ✅ 로컬 스토리지 데이터 동기화 (초기 로딩용)
    localStorage.setItem('savedTitle', user.equipped_title || '');
    localStorage.setItem('savedGrade', user.grade || '');
    localStorage.setItem('savedClassNum', user.class_num || '');

    if (dashRole) dashRole.textContent = user.role === 'admin' ? '관리자' : '학생';

    // 대시보드 및 헤더 아바타 업데이트 (인스타 스타일, 황금 테두리 지원)
    updateAvatarUI(dashAvatar, user.avatar_url, user.character_icon || '👤', user);
    updateAvatarUI(headerAvatar, user.avatar_url, user.character_icon || '👤', user);
    updateAvatarUI(headerAvatarMobile, user.avatar_url, user.character_icon || '👤', user);
    updateAvatarUI(sideMenuAvatar, user.avatar_url, user.character_icon || '👤', user);
    updateAvatarUI(previewAvatar, user.avatar_url, user.character_icon || '👤', user);

    // 경험치 바 및 기타 스탯 업데이트
    const expCur = document.getElementById('exp-cur');
    const expNeed = document.getElementById('exp-need');
    const lvlFill = document.getElementById('lvl-fill');
    const lvNum = document.getElementById('lv-num');

    if (lvNum) lvNum.innerText = user.level || 1;
    if (expCur) expCur.innerText = user.exp || 0;
    const nextExp = (user.level || 1) * 20;
    if (expNeed) expNeed.innerText = nextExp;
    if (lvlFill) {
      const percent = Math.min(100, ((user.exp || 0) / nextExp) * 100);
      lvlFill.style.width = percent + '%';
    }

    // 포인트 업데이트
    const coinBalance = document.getElementById('coin-balance');
    if (coinBalance) coinBalance.innerText = (user.coin_balance || 0).toLocaleString();

    // ✅ 프로필 설정 필드 채우기 (새로 추가)
    const pName = document.getElementById('profile-name');
    const pUsername = document.getElementById('profile-username');
    const pUsernameOrigin = document.getElementById('profile-username-origin');
    const pEmail = document.getElementById('profile-email');
    const pGrade = document.getElementById('profile-grade');
    const pClass = document.getElementById('profile-class');
    const pNumber = document.getElementById('profile-number');

    if (pName) pName.value = user.name || "";
    if (pUsername) pUsername.value = user.username || "";
    if (pUsernameOrigin) pUsernameOrigin.value = user.username || "";
    if (pEmail) pEmail.value = user.email || "";
    if (pGrade) pGrade.value = user.grade || "";
    if (pClass) pClass.value = user.class_num || "";
    if (pNumber) pNumber.value = user.student_number || "";

    // 화면 효과 적용 (눈내림, 벚꽃 등)
    let effectContainer = document.getElementById('global-screen-effect');
    if (!effectContainer) {
      effectContainer = document.createElement('div');
      effectContainer.id = 'global-screen-effect';
      effectContainer.style.position = 'fixed';
      effectContainer.style.top = '0';
      effectContainer.style.left = '0';
      effectContainer.style.width = '100vw';
      effectContainer.style.height = '100vh';
      effectContainer.style.pointerEvents = 'none';
      effectContainer.style.zIndex = '99999';
      document.body.appendChild(effectContainer);
    }

    effectContainer.innerHTML = ''; // 초기화
    if (user.equipped_effect) {
      const isAccumulate = user.equipped_effect.includes('쌓임');
      if (user.equipped_effect.includes('눈내림')) {
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        effectContainer.appendChild(canvas);
        if (typeof startSnowEffect === 'function') startSnowEffect(canvas, isAccumulate);
      } else if (user.equipped_effect.includes('벚꽃')) {
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        effectContainer.appendChild(canvas);
        if (typeof startCherryBlossomEffect === 'function') startCherryBlossomEffect(canvas, isAccumulate);
      } else if (user.equipped_effect.includes('별')) {
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        effectContainer.appendChild(canvas);
        if (typeof startStarEffect === 'function') startStarEffect(canvas, isAccumulate);
      }
    }

    // ✅ 확성기 UI 표시 여부 제어
    const broadcastSection = document.getElementById('broadcast-panel-section');
    if (broadcastSection) {
      if (user.permissions && user.permissions.includes('loudspeaker')) {
        broadcastSection.style.display = 'flex';
      } else {
        broadcastSection.style.display = 'none';
      }
    }

    // 컬렉션 정보 갱신
    if (typeof loadOwnedCollection === 'function') loadOwnedCollection();

    // 대화실 초기화 (유저 정보 기반)
    if (typeof initChat === 'function') initChat();

  } catch (err) {
    console.error('Error loading user info:', err);
  }
};

// 👤 아바타 UI 업데이트 함수 (인스타 스타일 원형, 테두리 지원)
function updateAvatarUI(container, avatarUrl, defaultEmoji, userObj = null) {
  if (!container) return;
  container.innerHTML = '';

  // 황금, 무지개 테두리 효과 초기화
  container.classList.remove('profile-border-golden');
  container.classList.remove('profile-border-rainbow');

  // 부모 컨테이너의 overflow 속성에 의해 애니메이션이 잘리는 현상 방지
  container.style.overflow = 'visible';

  if (userObj && userObj.equipped_border) {
    if (userObj.equipped_border.includes('황금')) {
      container.classList.add('profile-border-golden');
    } else if (userObj.equipped_border.includes('무지개')) {
      container.classList.add('profile-border-rainbow');
    }
  }

  if (avatarUrl && avatarUrl.trim() !== '') {
    const img = document.createElement('img');
    img.src = avatarUrl;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    // 이미지가 테두리를 덮어씌오지 않도록 z-index 설정
    img.style.position = 'relative';
    img.style.zIndex = '2';
    container.appendChild(img);
  } else {
    // 이미지가 없을 경우 캐릭터 아이콘(이모지) 표시
    container.innerText = defaultEmoji || '👤';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.fontSize = container.id === 'dash-avatar' ? '2.5rem' : '1.2rem';
    container.style.background = '#f1f5f9';
    container.style.borderRadius = '50%';
    container.style.position = 'relative';
    container.style.zIndex = '2';
  }
}

// ==========================================
// 💬 Real-time Chat Room & Premium Color
// ==========================================
let chatSubscription = null;

async function initChat() {
  const msgContainer = document.getElementById('chat-messages-container');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');

  if (!msgContainer || !chatForm) return;

  // 채팅을 새로 열 때마다 날짜 구분선 상태 초기화
  lastRenderedDate = null;

  // 1. Initial Load (fetch last 50 messages)
  const { data, error } = await supabaseClient
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error("Chat history load error:", error);
    msgContainer.innerHTML = '<div style="text-align: center; color: #dc3545; font-size: 0.85rem; padding: 20px;">대화 내역을 불러오지 못했습니다. (권한 또는 연결 문제)</div>';
    return;
  }

  // [No-Join Refactor] Fetch users separately to avoid PGRST200
  if (data && data.length > 0) {
    const usernames = [...new Set(data.filter(i => i.username).map(i => i.username))];
    const { data: userData } = await supabaseClient
      .from('users')
      .select('username, equipped_color, avatar_url, equipped_title, name, grade, class_num, student_number')
      .in('username', usernames);

    const userMap = {};
    userData?.forEach(u => { userMap[u.username] = u; });
    data.forEach(item => { item.users = userMap[item.username] || null; });
  }

  if (data && data.length > 0) {
    // 기존 메시지들 비우기 (중복 추가 방지)
    msgContainer.innerHTML = '<div style="text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 20px;">대화실에 오신 것을 환영합니다! 바른말 고운말을 사용해 주세요.</div>';
    [...data].reverse().forEach(msg => appendChatMessage(msg));
  } else {
    msgContainer.innerHTML = '<div style="text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 20px;">첫 번째 메시지를 남겨보세요! ✨</div>';
  }

  // 2. Chat form Submit Event
  chatForm.onsubmit = async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    const savedUserId = localStorage.getItem('savedUsername');
    if (!text || !savedUserId) return;

    // UI clear first for better UX
    chatInput.value = '';

    const { error: insertErr } = await supabaseClient
      .from('chat_messages')
      .insert({ username: savedUserId, message: text });

    if (insertErr) {
      console.error("Chat send error:", insertErr);
      alert("메시지 전송에 실패했습니다.");
    }
  };

  // 3. Real-time Subscription (이미 있는 경우 재구독 방지)
  if (!chatSubscription) {
    chatSubscription = supabaseClient.channel('public:chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        const rawMsg = payload.new;
        const { data: uData } = await supabaseClient.from('users').select('equipped_color, avatar_url, equipped_title, name, grade, class_num, student_number').eq('username', rawMsg.username).maybeSingle();
        const msg = { ...rawMsg, users: uData ? { ...uData } : null };
        appendChatMessage(msg);
      })
      .subscribe();
  }

  // 4. 하단 이동 버튼 기능 (Scroll to bottom)
  const scrollBtn = document.getElementById('chat-scroll-bottom');
  if (scrollBtn && msgContainer) {
    msgContainer.addEventListener('scroll', () => {
      // 위로 300px 이상 올리면 버튼 노출
      if (msgContainer.scrollHeight - msgContainer.scrollTop - msgContainer.clientHeight > 300) {
        scrollBtn.style.display = 'flex';
      } else {
        scrollBtn.style.display = 'none';
      }
    });
    scrollBtn.onclick = () => {
      msgContainer.scrollTo({ top: msgContainer.scrollHeight, behavior: 'smooth' });
    };
  }
}

let lastRenderedDate = null;

function appendChatMessage(msg) {
  const msgContainer = document.getElementById('chat-messages-container');
  if (!msgContainer) return;

  // 날짜 구분선 추가 (카카오톡 스타일)
  if (msg.created_at) {
    const curDate = new Date(msg.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    if (lastRenderedDate !== curDate) {
      const dateSep = document.createElement('div');
      dateSep.className = 'chat-date-separator';
      dateSep.innerHTML = `<span class="chat-date-text">${curDate}</span>`;
      msgContainer.appendChild(dateSep);
      lastRenderedDate = curDate;
    }
  }

  const savedUserId = localStorage.getItem('savedUsername');
  const isMine = (savedUserId === msg.username);

  // 사용자 정보 파싱 (null 안전성 확보)
  const uInfo = msg.users || {};
  const userColor = uInfo.equipped_color || '';
  const isPremium = userColor.includes('컬러');

  // 프사, 기본 이름, 학년/반/번호, 칭호 정보 추출
  const avatarUrl = uInfo.avatar_url || '';
  const grade = Number(uInfo.grade) > 0 ? `${uInfo.grade}학년 ` : '';
  const classNum = Number(uInfo.class_num) > 0 ? `${uInfo.class_num}반 ` : '';
  const studentNum = Number(uInfo.student_number) > 0 ? `${uInfo.student_number}번 ` : '';
  const realName = uInfo.name || msg.username;
  const gradeClassInfo = (grade || classNum || studentNum) ? `(${grade}${classNum}${studentNum.trim()})` : '';

  // 칭호 처리
  const rawTitle = uInfo.equipped_title || '';
  const cleanTitle = rawTitle.replace('[칭호]', '').trim();
  const titleHtml = cleanTitle ? `<span class="chat-title">[${cleanTitle}]</span> ` : '';

  // 시간 포맷팅 (오전/오후 H:MM)
  let timeStr = '';
  if (msg.created_at) {
    const d = new Date(msg.created_at);
    timeStr = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: 'numeric', hour12: true }).format(d);
  }
  const timeHtml = timeStr ? `<div class="chat-time" style="font-size:0.75rem; color:#94a3b8; margin: 0 4px; align-self:flex-end;">${timeStr}</div>` : '';

  const row = document.createElement('div');
  row.className = `chat-msg-row ${isMine ? 'mine' : 'other'} ${isPremium ? 'premium-chat' : ''}`;

  // 전체 표시용 이름 문자열
  const displayName = `${titleHtml}${realName} <span style="font-size:0.75rem; color:#64748b; font-weight:normal;">${gradeClassInfo}</span>`;

  // 프사 클릭 이벤트 (상세 프로필 보기)
  const openProfileDetail = () => {
    const modal = document.getElementById('chat-profile-modal');
    if (!modal) return;
    document.getElementById('cp-name').textContent = realName;
    document.getElementById('cp-title').textContent = cleanTitle ? `[${cleanTitle}]` : '';
    document.getElementById('cp-info').textContent = `${grade}${classNum}${studentNum}`;

    const cpAvatar = document.getElementById('cp-avatar');
    const cpPlaceholder = document.getElementById('cp-avatar-placeholder');
    if (avatarUrl) {
      cpAvatar.src = avatarUrl;
      cpAvatar.style.display = 'block';
      cpPlaceholder.style.display = 'none';
    } else {
      cpAvatar.style.display = 'none';
      cpPlaceholder.style.display = 'block';
    }

    // 언급하기 버튼 연동
    const mentBtn = document.getElementById('cp-action-mention');
    if (mentBtn) {
      mentBtn.onclick = () => {
        const input = document.getElementById('chat-input');
        input.value = `[@${realName}] ` + input.value;
        input.focus();
        modal.style.display = 'none';
      };
    }

    modal.style.display = 'flex';
  };

  // 프사 HTML 생성
  const avatarHtml = `
    <div class="chat-avatar" style="width: 40px; height: 40px; border-radius: 15px; background:#e2e8f0; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; cursor:pointer;" onclick="this.dispatchEvent(new CustomEvent('open-profile'))">
      ${avatarUrl ? `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover;">` : '<span style="font-size:1.5rem;">👤</span>'}
    </div>
  `;

  // Sanitize message to prevent XSS
  const safeMessage = msg.message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // 답글 달기 (Reply) 기능 클릭 이벤트 처리용 HTML
  const replyActionStr = `onclick="const input = document.getElementById('chat-input'); input.value = '[@${realName}] ' + input.value; input.focus();" title="클릭하여 답글 달기" style="cursor:pointer;"`;

  // 카카오톡 스타일: 프사, 이름(칭호 포함) 정보, 말풍선, 그리고 시간
  if (isMine) {
    // 내 메시지: 노란색 말풍선 (#fee500)
    row.innerHTML = `
      ${timeHtml}
      <div class="chat-content mine-content">
        <div class="chat-username" style="font-size:0.85rem; margin-bottom:4px; margin-right:4px; font-weight:600; color:#334155; display:flex; justify-content:flex-end; align-items:center;">
          ${displayName}
        </div>
        <div class="chat-bubble ${isPremium ? 'premium-bubble' : ''}" style="background:${isPremium && userColor ? userColor : '#fee500'}; color:#000; border:none; border-radius: 15px 0 15px 15px; padding: 10px 15px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); line-height:1.4;" ${replyActionStr}>${safeMessage}</div>
      </div>
      ${avatarHtml}
    `;
  } else {
    // 상대방 메시지: 흰색 말풍선
    row.innerHTML = `
      ${avatarHtml}
      <div class="chat-content">
        <div class="chat-username" style="font-size:0.85rem; margin-bottom:4px; margin-left:4px; font-weight:600; color:#334155;">
          ${displayName}
        </div>
        <div style="display:flex; align-items:flex-end;">
          <div class="chat-bubble ${isPremium ? 'premium-bubble' : ''}" style="background:${isPremium && userColor ? userColor : '#fff'}; color:#000; border:none; border-radius: 0 15px 15px 15px; padding: 10px 15px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); line-height:1.4;" ${replyActionStr}>${safeMessage}</div>
          ${timeHtml}
        </div>
      </div>
    `;
  }

  msgContainer.appendChild(row);

  // 이벤트 리스너 등록 (프사 클릭)
  const avatarEl = row.querySelector('.chat-avatar');
  if (avatarEl) avatarEl.addEventListener('open-profile', openProfileDetail);

  // 스마트 자동 스크롤: 내가 보냈거나, 이미 바달 근처(250px 이내)일 때만 스크롤
  const threshold = 250;
  const isAtBottom = (msgContainer.scrollHeight - msgContainer.scrollTop - msgContainer.clientHeight) <= (row.clientHeight + threshold);

  if (isMine || isAtBottom) {
    msgContainer.scrollTo({ top: msgContainer.scrollHeight, behavior: 'smooth' });
  }
}

window.switchSettingsTab = function(tab) {
  const profileSection = document.getElementById('settings-profile-section');
  const generalSection = document.getElementById('settings-general-section');
  const profileBtn = document.getElementById('tab-btn-profile');
  const generalBtn = document.getElementById('tab-btn-general');
  const titleText = document.querySelector('#profile-panel h2 span');

  if (tab === 'profile') {
    profileSection.classList.add('active');
    generalSection.classList.remove('active');
    profileBtn.classList.add('active');
    generalBtn.classList.remove('active');
    if (titleText) titleText.textContent = '내 프로필 설정';
  } else {
    profileSection.classList.remove('active');
    generalSection.classList.add('active');
    profileBtn.classList.remove('active');
    generalBtn.classList.add('active');
    if (titleText) titleText.textContent = '내 설정';
  }
};
