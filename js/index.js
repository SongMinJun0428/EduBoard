// PDF Worker Config
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
}

const { createClient } = supabase;
const supabaseClient = window.supabase.createClient(
  'https://ucmzrkwrsezfdjnnwsww.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbXpya3dyc2V6ZmRqbm53c3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDIzODcsImV4cCI6MjA2ODQxODM4N30.rvLItmDStjWb3GfECnCXocHvj-CMTfHfD1CHsAHOLaw'
);

const NEIS_KEY = '28ca0f05af184e8ba231d5a949d52db2';
const ATPT_OFCDC_SC_CODE = 'J10';
const SD_SCHUL_CODE = '7679111';

const KOR_SUBJECTS = [
  '국어', '수학', '영어', '과학', '사회', '역사', '도덕', '기술', '가정', '정보', '음악', '미술', '체육',
  '통합', '자율', '창체', '자율활동', '동아리', '진로', '한문', '스포츠'
];

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
let currentUserCoin = 0;

async function loginDirect() {
  const username = document.getElementById('loginUsername').value.replace(/\s+/g, '');
  const password = document.getElementById('loginPassword').value.replace(/\s+/g, '');
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
    localStorage.setItem('savedName', currentUserName);
    localStorage.setItem('savedStudentNum', currentStudentNumber);
    localStorage.setItem('savedGrade', user.grade);
    localStorage.setItem('savedClassNum', user.class_num);
    localStorage.setItem('savedRole', user.role);

    setUserInfoInput();

    currentUserRole = user.role || 'user';
    currentGrade = user.grade;
    currentClassNum = user.class_num;

    document.getElementById('dash-name').textContent = user.name;
    document.getElementById('dash-role').textContent = user.role === 'admin' ? '관리자' : '학생';

    loadTimetableWeek(user.grade, user.class_num);
    showMain();
    loadNotices();
    afterLoginRefreshDashboard();
  } else {
    document.getElementById('loginStatus').innerText = '아이디 또는 비밀번호가 틀렸습니다.';
  }
}

async function signup() {
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
    document.getElementById('signupStatus').innerText = '개인정보 수집·이용에 동의해 주세요.';
    return;
  }
  if (!username || !password || !email || !name || !grade || !classNum || !number) {
    document.getElementById('signupStatus').innerText = '모든 항목을 입력해 주세요.';
    return;
  }
  if (password.length < 6) {
    document.getElementById('signupStatus').innerText = '비밀번호는 6자 이상이어야 합니다.';
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('signupStatus').innerText = '올바른 이메일을 입력해 주세요.';
    return;
  }

  try {
    const { error } = await supabaseClient.from('users').insert([{
      username: username,
      password: password,
      email: email,
      name: name,
      grade: parseInt(grade, 10),
      class_num: parseInt(classNum, 10),
      student_number: parseInt(number, 10),
      role: 'user'
    }]);
    if (error) {
      document.getElementById('signupStatus').innerText = '회원가입 실패: ' + error.message;
      return;
    }
    alert("회원가입이 완료되었습니다!");
    document.getElementById('signupStatus').style.color = 'green';
    document.getElementById('signupStatus').innerText = '회원가입이 완료되었습니다. 로그인해 주세요.';
  } catch (e) {
    document.getElementById('signupStatus').innerText = '오류 발생: ' + e.message;
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

async function addNotice() {
  const title = document.getElementById('notice-title').value.trim();
  const content = document.getElementById('notice-content').value.trim();
  const fileInput = document.getElementById('notice-image');
  const uploadChecked = document.getElementById('notice-upload-check').checked;

  if (!title || !content) {
    alert('제목과 내용을 입력해 주세요.');
    return;
  }

  let imageUrl = '';

  if (uploadChecked && fileInput.files.length) {
    const file = fileInput.files[0];
    const uniqueName = Date.now() + '_' + file.name;
    const filePath = `public/${uniqueName}`;

    const { error: uploadErr } = await supabaseClient
      .storage
      .from('notice-images')
      .upload(filePath, file, { upsert: true });

    if (uploadErr) {
      alert('이미지 업로드 실패: ' + uploadErr.message);
      return;
    }

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

  if (writerError || !writerData) {
    alert('사용자 정보 확인 중 오류가 발생했습니다.');
    return;
  }

  const newNotice = {
    title: title,
    content: content,
    image_url: imageUrl,
    writer: writerData.name,
    writer_role: writerData.role,
    grade: writerData.grade,
    class_num: writerData.class_num
  };

  const { error } = await supabaseClient.from('notices').insert([newNotice]);
  if (error) {
    alert('공지 등록 실패: ' + error.message);
    return;
  }

  alert('공지 등록 완료!');
  document.getElementById('notice-title').value = '';
  document.getElementById('notice-content').value = '';
  document.getElementById('notice-image').value = '';
  document.getElementById('notice-upload-check').checked = false;

  loadNotices();
}

async function loadNotices() {
  // 기본 쿼리
  let query = supabaseClient.from('notices').select('*').order('id', { ascending: false });

  const g = Number(currentGrade);
  const c = Number(currentClassNum);

  if (currentUserRole === 'admin') {
    // ✅ 어드민
    // - 0학년 어드민: 전체 조회
    // - N학년 M반 어드민: 해당 반만 조회
    if (g !== 0) {
      query = supabaseClient
        .from('notices')
        .select('*')
        .eq('grade', g)
        .eq('class_num', c)
        .order('id', { ascending: false });
    }
  } else {
    // ✅ 비관리자(학생/교사)
    // - 전체 공지(grade=0) + 본인 반 공지
    query = supabaseClient
      .from('notices')
      .select('*')
      .or(`grade.eq.0,and(grade.eq.${g},class_num.eq.${c})`)
      .order('id', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    //console.error('공지 불러오기 실패:', error);
    return;
  }

  const listEl = document.getElementById('notice-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  (data || []).forEach(item => {
    const formattedContent = (item.content || '').replace(/\n/g, '<br>');
    const div = document.createElement('div');
    div.style.borderBottom = '1px solid #ddd';
    div.style.padding = '0.5rem 0';
    div.innerHTML = `<strong>${item.title ?? ''}</strong> 
                     <span style="font-size:0.8rem;color:#888;">(${item.writer ?? ''})</span><br>
                     ${formattedContent}`;

    if (item.image_url) {
      div.innerHTML += `<br><img src="${item.image_url}" 
                           style="max-width:100%;margin-top:0.5rem;border-radius:0.5rem;">`;
    }

    listEl.appendChild(div);
  });
}



async function loadTimetableWeek(grade, classNum) {
  currentGrade = grade;
  currentClassNum = classNum;


  document.getElementById('timetable-grade-info').innerText = `${grade}학년 ${classNum}반 (주간)`;
  const container = document.getElementById('timetable-container');
  container.innerHTML = '<p>시간표 불러오는 중...</p>';

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
      dayBox.style.border = '1px solid #ccc';
      dayBox.style.borderRadius = '8px';
      dayBox.style.padding = '8px';
      dayBox.style.background = '#fdfdfd';
      dayBox.style.marginBottom = '10px';

      const title = document.createElement('h4');
      const dateObj = new Date(
        dateStr.slice(0, 4),
        parseInt(dateStr.slice(4, 6)) - 1,
        dateStr.slice(6, 8)
      );

      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const dayName = days[dateObj.getDay()];

      title.innerText = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)} (${dayName})`;

      dayBox.appendChild(title);

      if (data.misTimetable && data.misTimetable[1]) {
        const rows = data.misTimetable[1].row;
        const unique = {};
        rows.forEach(row => {
          const key = row.PERIO;
          if (!unique[key]) {
            unique[key] = row.ITRT_CNTNT;
          }
        });

        Object.keys(unique).sort((a, b) => parseInt(a) - parseInt(b)).forEach(perio => {
          const item = document.createElement('div');
          item.innerHTML = `<strong>${perio}교시</strong> : ${unique[perio]}`;
          dayBox.appendChild(item);
        });

      }

      else {
        const none = document.createElement('p');
        none.innerText = '교육청 시간표 데이터 없음';
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

  statusEl.style.color = '#007bff';
  statusEl.textContent = '⏳ 업로드 중입니다...';

  const insertRecords = [];

  try {
    for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      const timestamp = Date.now();

      const safeFileName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w.-]/g, '_');

      const fileName = `${studentNum}_${timestamp}_${i}_${safeFileName}`;

      const { error: uploadError } = await supabaseClient
        .storage
        .from('homework-files')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`❌ 파일 업로드 실패: ${safeFileName} - ${uploadError.message}`);
      }

      const { data: publicURLData } = supabaseClient
        .storage
        .from('homework-files')
        .getPublicUrl(fileName);

      const fileURL = publicURLData.publicUrl;

      insertRecords.push({
        name,
        student_number: studentNum,
        title,
        grade,
        class_num: classNum,
        comment,
        file_url: fileURL,
        share_scope: scope
      });
    }

    const { error: insertError } = await supabaseClient
      .from('homeworks')
      .insert(insertRecords);

    if (insertError) {
      throw new Error(`❌ DB 저장 실패: ${insertError.message}`);
    }

    statusEl.style.color = 'green';
    statusEl.textContent = `✅ 총 ${insertRecords.length}개 파일 업로드 완료!`;

    document.getElementById('homework-title').value = '';
    document.getElementById('homework-comment').value = '';
    document.getElementById('homework-file').value = '';

    loadMaterials();

  } catch (err) {
    //console.error(err);
    statusEl.style.color = 'red';
    statusEl.textContent = err.message || '업로드 중 오류 발생';
  }
}

async function loadMaterials() {
  const listEl = document.getElementById('material-list');
  listEl.innerHTML = '';

  const { data, error } = await supabaseClient
    .from('homeworks')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (error) {
    //console.error('❌ 자료 불러오기 오류:', error);
    listEl.innerHTML = '<li>자료를 불러오는 중 오류가 발생했습니다.</li>';
    return;
  }

  const visible = (data || []).filter(canUserSeeMaterial);

  if (!visible || visible.length === 0) {
    listEl.innerHTML = '<li>내 공유 범위에 해당하는 자료가 없습니다.</li>';
    return;
  }

  visible.forEach(item => {
    const titleLine = `📌 ${item.title} (${item.grade}학년 ${item.class_num}반 ${item.student_number}번 ${item.name})` +
      ` <span style="font-size:.8rem;color:#6b7280;">· 범위: ${item.share_scope === 'class' ? '같은 반' :
        item.share_scope === 'grade' ? '같은 학년' : '전교'
      }</span>`;

    const commentHtml = item.comment
      ? `<p style="margin:6px 0;">💬 ${item.comment}</p>`
      : '';

    const fileUrls = Array.isArray(item.file_url)
      ? item.file_url
      : (typeof item.file_url === 'string' && item.file_url.startsWith('['))
        ? JSON.parse(item.file_url)
        : [item.file_url];

    const fileHtmlArray = fileUrls.map(url => {
      const filename = decodeURIComponent((url || '').split('/').pop() || '');
      const isImage = (url || '').match(/\.(jpg|jpeg|png|gif|webp)$/i);
      const imagePreview = isImage
        ? `<img src="${url}" alt="${filename}"
                  onclick="openImageModal('${url}')"
                  style="max-width:120px; max-height:120px; border-radius:6px; cursor:pointer; margin-bottom:6px;" />`
        : '';
      const downloadLink = `<a href="${url}" download="${filename}" target="_blank"
                                    style="color:#007bff;text-decoration:none;font-weight:500;">
                                    📥 파일 다운로드
                                  </a>`;
      return `${imagePreview}<br>${downloadLink}`;
    });

    const li = document.createElement('li');
    li.style.borderBottom = '1px solid #ddd';
    li.style.padding = '12px 0';
    li.innerHTML = `
            <div style="font-weight:bold; margin-bottom:6px;">${titleLine}</div>
            ${commentHtml}
            ${fileHtmlArray.join('<br><br>')}
          `;
    listEl.appendChild(li);
  });
}


async function syncCoinBalance() {
  const username = localStorage.getItem('savedUsername');
  if (!username) return;
  const { data, error } = await supabaseClient
    .from('users')
    .select('coin_balance')
    .eq('username', username)
    .single();
  if (!error && data) {
    currentUserCoin = data.coin_balance || 0;
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
      const username = localStorage.getItem('savedUsername');
      if (username) {
        const { error } = await supabaseClient
          .from('users')
          .update({ coin_balance: currentUserCoin + 10 })
          .eq('username', username);
        if (!error) {
          currentUserCoin += 10;
          if (typeof displayCoinBalance === 'function') {
            displayCoinBalance();
          }
        }
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
  document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
  const target = document.getElementById(panelId);
  if (target) {
    target.style.display = 'block';
    if (panelId === 'shop-panel') {
      loadShopItems();
      loadCoinBalance();
    } else if (panelId === 'inventory-panel') {
      loadInventory();
    }
  }
}

supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
  if (session) {
    const { data: user } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (user) currentUserRole = user.role;
  } else {
    showLogin();
  }
});

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
  const nameEl = document.getElementById('profile-name-display');
  const mobileNameEl = document.getElementById('mobile-user-name');

  if (inputEl) inputEl.value = `${currentStudentNumber}번 ${currentUserName}`;
  if (nameEl) nameEl.textContent = currentUserName;
  if (mobileNameEl) mobileNameEl.textContent = currentUserName;
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
  const game = document.getElementById('fourEqualsTen-game');
  if (game) game.style.display = 'none';
  const panel = document.getElementById('minigame-panel');
  if (panel) panel.style.display = 'block';
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
          // 숫자 4개 생성/초기화 함수
          if (typeof generateFourNumbers === 'function') generateFourNumbers();
        }
      },
      mazeEscape: {
        cost: 5,
        panelId: 'mazeEscape-game',
        launch() {
          // 예: <canvas id="maze-cv">가 panel 내부에 있다고 가정
          if (typeof window.initMazeGame === 'function') window.initMazeGame('maze-cv');
        }
      },
      fallingBlocks: {
        cost: 5,
        panelId: 'fallingBlocks-game',
        launch() {
          // 예: <canvas id="fall-cv">
          if (typeof window.initFallingBlocks === 'function') window.initFallingBlocks('fall-cv');
        }
      },
      reaction: {
        cost: 5,
        panelId: 'reaction-game',
        launch() {
          // 예: pad/start/label id가 패널 내부에 존재
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
      flappy: {
        cost: 5,
        panelId: 'flappy-game',
        launch() {
          // 예: <div id="mini-flappy">
          if (typeof window.initFlappyGame === 'function') window.initFlappyGame('mini-flappy', {});
        }
      }
    };

    const cfg = GAME_TABLE[gameType];
    if (!cfg) {
      alert(`알 수 없는 게임 타입: ${gameType}`);
      return;
    }

    // 잔액 동기화 (currentUserCoin 전역 사용 가정)
    if (typeof syncCoinBalance === 'function') {
      await syncCoinBalance();
    }
    const cost = Number(cfg.cost) || 0;
    const current = Number(currentUserCoin || 0);

    if (current < cost) {
      alert(`포인트가 부족합니다. (보유: ${current}, 필요: ${cost})`);
      return;
    }

    // 포인트 차감 (Supabase)
    if (typeof supabaseClient === 'undefined') {
      alert('supabaseClient가 설정되지 않았습니다.');
      return;
    }

    const { error } = await supabaseClient
      .from('users')
      .update({ coin_balance: current - cost })
      .eq('username', username);

    if (error) {
      alert('포인트 차감 실패: ' + (error.message || error));
      return;
    }

    // 로컬 잔액 반영 + 표시 갱신
    currentUserCoin = current - cost;
    if (typeof displayCoinBalance === 'function') {
      displayCoinBalance();
    }

    // 패널 전환
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    const panel = document.getElementById(cfg.panelId);
    if (!panel) {
      alert(`패널을 찾을 수 없습니다: #${cfg.panelId}`);
      return;
    }
    panel.style.display = 'block';

    // 게임 런칭
    if (typeof cfg.launch === 'function') {
      // 패널이 보이도록 만든 후 초기화(캔버스/레이아웃 크기 계산 이슈 방지)
      requestAnimationFrame(() => cfg.launch());
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
  document.getElementById('mobile-side-menu').classList.toggle('open');
  document.getElementById('mobile-overlay').classList.toggle('show');
}

function closeMobileMenu() {
  document.getElementById('mobile-side-menu').classList.remove('open');
  document.getElementById('mobile-overlay').classList.remove('show');
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
});

let currentDate = new Date();

function formatYMD(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function updateDateLabels() {
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  const dateStr = currentDate.toLocaleDateString('ko-KR', options);
  document.getElementById('timetable-date-label').textContent = dateStr;
  document.getElementById('meal-date-label').textContent = dateStr;
}

function changeDate(delta) {
  currentDate.setDate(currentDate.getDate() + delta);
  loadTimetable();
  loadMeal();
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

function initDashboardTop() {
  const d = new Date(); const w = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  if ($id('dash-notice-date')) $id('dash-notice-date').textContent =
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${w})`;

  const nm = currentUserName || localStorage.getItem('savedName') || '학생';
  const num = currentStudentNumber || localStorage.getItem('savedStudentNum') || 0;
  const grd = (currentGrade ?? parseInt(localStorage.getItem('savedGrade') || '0', 10)) || '-';
  const cls = (currentClassNum ?? parseInt(localStorage.getItem('savedClassNum') || '0', 10)) || '-';
  if ($id('dash-name')) $id('dash-name').textContent = nm;
  if ($id('dash-role')) {
    const savedRole = localStorage.getItem('savedRole') || 'user';
    $id('dash-role').textContent = savedRole === 'admin' ? '관리자' : '학생';
  }
  if ($id('dash-num')) $id('dash-num').textContent = num;
  if ($id('dash-grade')) $id('dash-grade').textContent = grd;
  if ($id('dash-class')) $id('dash-class').textContent = cls;

  loadRecentNotices3();
  syncStatsAndRender();
}

async function loadRecentNotices3() {
  const box = $id('dash-notice-list');
  if (!box) return;
  box.innerHTML = `<div class="notice-item"><div class="meta">불러오는 중…</div></div>`;

  const g = Number(currentGrade);
  const c = Number(currentClassNum);

  let q = supabaseClient.from('notices').select('*');

  if (currentUserRole === 'admin') {
    // 0학년 admin → 전체 / N학년 M반 admin → 해당 반만
    if (g !== 0) {
      q = q.eq('grade', g).eq('class_num', c);
    }
  } else {
    // 비관리자 → 전체공지(grade=0) + 본인 반 공지
    // (⚠️ 이전 코드에서 .neq('writer_role','admin') 때문에 대시보드에 안 떴을 수 있음 → 제거)
    q = q.or(`grade.eq.0,and(grade.eq.${g},class_num.eq.${c})`);
  }

  const { data, error } = await q.order('id', { ascending: false }).limit(3);

  if (error) {
    box.innerHTML = `<div class="notice-item"><div class="meta">공지 불러오기 실패</div></div>`;
    return;
  }
  if (!data || data.length === 0) {
    box.innerHTML = `<div class="notice-item"><div class="meta">최근 공지가 없습니다.</div></div>`;
    return;
  }

  box.innerHTML = '';
  data.forEach(n => {
    const preview = (n.content || '').replace(/\n/g, ' ').slice(0, 90);
    const el = document.createElement('div');
    el.className = 'notice-item';
    el.innerHTML = `
      <div class="title">${n.title || ''}</div>
      <div class="meta">${n.writer || ''} · ${n.grade}학년 ${n.class_num}반</div>
      <div class="meta" style="margin-top:4px">${preview}${(n.content || '').length > 90 ? '…' : ''}</div>`;
    box.appendChild(el);
  });
}


async function syncStatsAndRender() {
  try {
    const username = localStorage.getItem('savedUsername');
    if (!username) {
      renderStats({ level: 1, exp: 0, need: 20 });
      return;
    }

    const { data, error } = await supabaseClient
      .from('users')
      .select('level, exp, coin_balance')
      .eq('username', username)
      .single();

    const level = (data && Number.isInteger(data.level)) ? data.level : 1;
    const exp = (data && Number.isInteger(data.exp)) ? data.exp : 0;
    const need = 20;

    renderStats({ level, exp, need });
  } catch (e) {
    //console.warn(e);
    renderStats({ level: 1, exp: 0, need: 20 });
  }
}

async function afterLoginRefreshDashboard() {
  initDashboardTop();
}

document.addEventListener('DOMContentLoaded', initDashboardTop);

function renderStats({ level, exp, need, point }) {
  if ($id('lv-num')) $id('lv-num').textContent = level;

  if ($id('coin-balance') && point !== undefined) {
    $id('coin-balance').textContent = point;
  }

  const cur = Math.max(0, Math.min(exp, need));
  const pct = need > 0 ? Math.round((cur / need) * 100) : 0;

  if ($id('exp-cur')) $id('exp-cur').textContent = cur;
  if ($id('exp-need')) $id('exp-need').textContent = need;
  if ($id('lvl-fill')) $id('lvl-fill').style.width = pct + '%';
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
  if (el) el.textContent = coin;
  if (shopEl) shopEl.textContent = coin;

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
    //console.warn('달력 렌더 오류:', e);
    grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 8px; color:#ef4444;">달력 데이터를 불러오지 못했습니다.</div>';
    if (detailTitle) detailTitle.textContent = '날짜를 선택하세요';
    if (detailList) detailList.innerHTML = '';
  }
}

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

async function afterLoginRefreshDashboard() {
  initDashboardTop();
  bindScheduleUI();
  await renderScheduleCalendar();
}

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
  const elPicker = document.getElementById('datePicker');

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
            <li style="display:flex;align-items:center;gap:10px;padding:10px 6px;border-top:1px dashed #e9ecef;">
              <span style="width:58px;min-width:58px;text-align:center;font-weight:700;">${p}교시</span>
              <span style="font-weight:600;">${byPeriod[p] || ''}</span>
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

  document.addEventListener('DOMContentLoaded', () => {
    if (elPicker) {
      elPicker.value = toInput(seoulNow());
      elPicker.addEventListener('change', (e) => loadTimetableDay(e.target.value));
    }
    loadTimetableDay(elPicker?.value);
  });

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
    return `
            <li style="display:flex;align-items:center;gap:10px;padding:10px;border-top:1px dashed #e9ecef;">
              <div style="width:32px;text-align:center">${medal(rank)}</div>
              <div style="flex:1 1 auto;">
                <div style="font-weight:700">${escapeHtml(u.name || u.username || '학생')}</div>
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
    return `
            <div style="display:flex;align-items:center;gap:10px">
              <div style="font-weight:800">내 순위</div>
              <div style="margin-left:auto;font-size:.9rem;color:#6b7280">${rank}/${total}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
              <div style="width:32px;text-align:center">${medal(rank)}</div>
              <div style="flex:1 1 auto;">
                <div style="font-weight:700">${escapeHtml(u.name || '나')}</div>
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
      .select('username,name,grade,class_num,student_number,coin_balance,level,xp,role', { count: 'exact' })
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
              <span style="color:#6b7280;font-size:.9rem">${dayLabel}</span>
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

  document.addEventListener("DOMContentLoaded", () => loadMeal());
  window.reloadMealCard = loadMeal;
  document.addEventListener('DOMContentLoaded', () => {
    const box = document.getElementById('meal-box');
    if (!box) return;

    // 1) 기존 #mealDatePicker가 있으면 재사용
    let picker = document.getElementById('mealDatePicker');

    // 2) 없으면 bar와 함께 새로 생성
    if (!picker) {
      const bar = document.createElement('div');
      bar.id = 'mealDateBar';
      bar.style.display = 'flex';
      bar.style.gap = '8px';
      bar.style.marginBottom = '8px';

      picker = document.createElement('input');
      picker.type = 'date';
      picker.id = 'mealDatePicker';

      bar.appendChild(picker);
      box.parentNode.insertBefore(bar, box);
    }

    // 기본값: 서울 기준 오늘 (기존 값이 없을 때만 세팅)
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!picker.value) picker.value = ymd;

    // 날짜 변경 시 해당 일자 급식 로드
    picker.onchange = () => loadMeal(picker.value);
  });
})();


function renderStats({ level, exp, coin, need }) {
  const levelBadge = document.getElementById('lv-num');
  const expCur = document.getElementById('exp-cur');
  const expNeed = document.getElementById('exp-need');
  const fillBar = document.getElementById('lvl-fill');
  const coinEl = document.getElementById('coin-balance');

  if (levelBadge) levelBadge.textContent = level;
  if (expCur) expCur.textContent = exp;
  if (expNeed) expNeed.textContent = need;
  if (expNeed) expNeed.textContent = need;
  if (coinEl && typeof coin === 'number') coinEl.textContent = coin;

  const shopCoinEl = document.getElementById('shop-coin-balance');
  if (shopCoinEl && typeof coin === 'number') shopCoinEl.textContent = coin;

  const pct = Math.max(0, Math.min(100, Math.round((exp / need) * 100)));
  if (fillBar) fillBar.style.width = pct + '%';
}

async function syncStatsAndRender() {
  try {
    const username = localStorage.getItem('savedUsername');
    const NEED = 20;

    if (!username) {
      renderStats({ level: 1, exp: 0, coin: 0, need: NEED });
      return;
    }

    const { data, error } = await supabaseClient
      .from('users')
      .select('level, xp, coin_balance')
      .eq('username', username)
      .single();

    if (error) throw error;

    const level = Number.isFinite(+data?.level) ? +data.level : 1;
    const exp = Number.isFinite(+data?.xp) ? +data.xp : 0;
    const coin = Number.isFinite(+data?.coin_balance) ? +data.coin_balance : 0;

    renderStats({ level, exp, coin, need: NEED });
  } catch (e) {
    console.warn('syncStatsAndRender error:', e);
    renderStats({ level: 1, exp: 0, coin: 0, need: 20 });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const savedName = localStorage.getItem('savedName');
  const savedNum = localStorage.getItem('savedStudentNum');
  if (savedName && savedNum) {
    currentUserName = savedName;
    currentStudentNumber = savedNum;
    setUserInfoInput();
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  const savedUsername = localStorage.getItem('savedUsername');
  if (!savedUsername) { showLogin(); return; }

  const { data: user, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('username', savedUsername)
    .maybeSingle();

  if (error || !user) { showLogin(); return; }

  currentUserRole = user.role || 'user';
  currentGrade = user.grade;
  currentClassNum = user.class_num;
  currentUserName = user.name;
  currentStudentNumber = user.student_number;

  localStorage.setItem('savedName', user.name);
  localStorage.setItem('savedStudentNum', user.student_number);
  localStorage.setItem('savedGrade', user.grade);
  localStorage.setItem('savedClassNum', user.class_num);

  setUserInfoInput();

  await loadTimetableWeek(user.grade, user.class_num);
  await loadCoinBalance();
  showMain();
  loadNotices();

  afterLoginRefreshDashboard();
});

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
/** 🔑 임시(비권장): 브라우저에 하드코딩 */


/** 이미지 → 크기제한 JPEG dataURL */
async function fileToBase64Optimized(file, maxW = 1800, maxH = 1800, type = 'image/jpeg', quality = 0.9) {
  const dataUrl = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
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

    // GPT 비전 호출 payload
    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "너는 한국 중학교 수행평가 안내 이미지를 OCR하고, 핵심 4항목(과목, 날짜, 교시, 평가 주제)을 구조화해 주는 도우미다. 반드시 JSON 객체 하나만 반환해."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `1) 이미지를 먼저 정확히 OCR하세요.
2) OCR 결과를 바탕으로 아래 JSON 형식으로만 답변하세요(딱 한 개의 JSON, 다른 말 금지).
{
  "subject": "과목명(국어/수학/영어/과학/사회/역사/도덕/기술가정/정보/음악/미술/체육/창체/동아리/진로/한문 등, 추론 가능)",
  "date": "YYYY-MM-DD 또는 '10월 3일' 등 원문 그대로",
  "period": "숫자만(예: '3'). 교시 언급이 없으면 빈 문자열",
  "topic": "평가 주제(없으면 빈 문자열)"
}
주의:
- 추정일 경우 가장 가능성 높은 한 가지로만 기입.
- 불명확하면 빈 문자열("")로 남겨둠.`
            },
            { type: "image_url", image_url: { url: imageDataUrl } }
          ]
        }
      ]
    };

    // 🔑 API 호출 (기본 → 실패 시 백업)
    const data = await callOpenAIWithFallback(payload);

    // 결과 처리
    const raw = (data.choices?.[0]?.message?.content ?? "").trim();
    const json = parseJsonLoose(raw);
    fillFormFromJson(json);
    resultBox.value = toParagraph(json);

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

/** OpenAI API 호출 (기본 키 실패 시 백업 키로 재시도) */
async function callOpenAIWithFallback(payload) {
  const { primary, backup } = await getOpenAIKeysFromSupabase();

  // 1️⃣ 기본 키 시도
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${primary}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`❌ 1차 키 실패: ${errText}`);
    }

    return await res.json(); // ✅ 성공
  } catch (err) {
    console.warn("⚠️ 1차 키 실패 → 백업 키로 전환:", err.message);

    if (!backup) throw new Error("❌ 백업 API 키 없음");

    // 2️⃣ 백업 키로 재시도
    const res2 = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${backup}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res2.ok) {
      const errText = await res2.text();
      throw new Error(`❌ 백업 키도 실패: ${errText}`);
    }

    return await res2.json(); // ✅ 백업 성공
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
  // ✅ 대시보드에 표시된 값 읽기
  const name = document.getElementById("dash-name")?.textContent?.trim();
  const grade = parseInt(document.getElementById("dash-grade")?.textContent?.trim());
  const classNum = parseInt(document.getElementById("dash-class")?.textContent?.trim());
  const studentNum = parseInt(document.getElementById("dash-num")?.textContent?.trim());

  console.log("📥 대시보드 값:", { name, grade, classNum, studentNum });

  // ✅ 유효성 검사
  if (!name || isNaN(grade) || isNaN(classNum) || isNaN(studentNum)) {
    console.warn("⚠️ 대시보드 정보가 올바르지 않습니다.");
    return;
  }

  console.log("🔍 Supabase 쿼리 실행 중...");

  // ✅ Supabase에서 사용자 찾기
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('name', name)
    .eq('grade', grade)
    .eq('class_num', classNum)
    .eq('student_number', studentNum)
    .limit(1)
    .maybeSingle(); // 여러 명 방지 + null 처리 안전하게

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

  listEl.innerHTML = '';
  data.forEach(item => {
    const isOwned = myItemIds.includes(item.id);

    const itemEl = document.createElement('div');
    itemEl.className = 'shop-item';
    itemEl.style.border = '1px solid #eee';
    itemEl.style.borderRadius = '8px';
    itemEl.style.padding = '1rem';
    itemEl.style.textAlign = 'center';
    itemEl.style.background = '#fff';
    if (isOwned) {
      itemEl.style.opacity = '0.7';
      itemEl.style.background = '#f8f9fa';
    }

    // 이미지
    if (item.image_url) {
      itemEl.innerHTML += `<img src="${item.image_url}" alt="${item.name}" style="width:80px;height:80px;object-fit:cover;margin-bottom:0.5rem;border-radius:4px;filter:${isOwned ? 'grayscale(100%)' : 'none'}">`;
    } else {
      itemEl.innerHTML += `<div style="width:80px;height:80px;background:#f1f3f5;margin:0 auto 0.5rem;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:2rem;filter:${isOwned ? 'grayscale(100%)' : 'none'}">🎁</div>`;
    }

    // 버튼 HTML 생성
    let btnHtml = '';
    if (isOwned) {
      btnHtml = `<button disabled style="
        background:#6c757d;color:white;border:none;padding:0.4rem 1rem;border-radius:4px;cursor:not-allowed;font-size:0.9rem;
      ">보유중</button>`;
    } else {
      btnHtml = `<button class="btn-buy" style="
        background:#007bff;color:white;border:none;padding:0.4rem 1rem;border-radius:4px;cursor:pointer;font-size:0.9rem;
      " onclick="buyItem(${item.id}, ${item.price}, '${item.name}')">구매하기</button>`;
    }

    // 정보
    itemEl.innerHTML += `
      <h4 style="margin:0.5rem 0;font-size:1rem;">${item.name}</h4>
      <p style="color:#666;font-size:0.9rem;margin-bottom:0.5rem;">${item.description || ''}</p>
      <div style="font-weight:bold;color:${isOwned ? '#6c757d' : '#ff9800'};margin-bottom:0.8rem;">💰 ${item.price} P</div>
      ${btnHtml}
    `;

    listEl.appendChild(itemEl);
  });
}

// ✅ EduBoard 인벤토리 전체 로직 (Supabase 연동 포함)

async function loadInventory() {
  const listEl = document.getElementById('inventory-list');
  if (!listEl) return;

  const username = localStorage.getItem('savedUsername');
  if (!username) {
    listEl.innerHTML = '<p>로그인이 필요합니다.</p>';
    return;
  }

  listEl.innerHTML = '<p>인벤토리 불러오는 중...</p>';

  const { data, error } = await supabaseClient
    .from('inventory')
    .select('*')
    .eq('username', username)
    .order('purchased_at', { ascending: false });

  if (error) {
    console.warn('인벤토리 로드 실패:', error);
    listEl.innerHTML = '<p>인벤토리를 불러올 수 없습니다.</p>';
    return;
  }

  if (!data || data.length === 0) {
    listEl.innerHTML = '<p>보유한 아이템이 없습니다.</p>';
    return;
  }

  listEl.innerHTML = '';
  data.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.style.border = '1px solid #eee';
    itemEl.style.borderRadius = '8px';
    itemEl.style.padding = '1rem';
    itemEl.style.textAlign = 'center';
    itemEl.style.background = '#fff';

    // 아이콘 (임시)
    itemEl.innerHTML += `<div style="width:60px;height:60px;background:#f8f9fa;margin:0 auto 0.5rem;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:1.5rem;">🎒</div>`;

    itemEl.innerHTML += `
      <h4 style="margin:0.5rem 0;font-size:1rem;">${item.item_name}</h4>
      <p style="color:#888;font-size:0.8rem;">구매일: ${new Date(item.purchased_at).toLocaleDateString()}</p>
    `;

    listEl.appendChild(itemEl);
  });
}

// ✅ 아이템 구매 함수
window.buyItem = async function (itemId, price, itemName) {
  if (!confirm(`'${itemName}'을(를) ${price}포인트에 구매하시겠습니까?`)) return;

  const username = localStorage.getItem('savedUsername');
  if (!username) {
    alert('로그인이 필요합니다.');
    return;
  }

  const { data: existing, error: checkError } = await supabaseClient
    .from('inventory')
    .select('id')
    .eq('username', username)
    .eq('item_id', itemId)
    .maybeSingle();

  if (checkError) {
    console.warn('인벤토리 확인 중 오류:', checkError);
  }

  if (existing) {
    alert('이미 보유하고 있는 아이템입니다.');
    return;
  }

  if (currentUserCoin < price) {
    alert('포인트가 부족합니다.');
    return;
  }

  try {
    const newBalance = currentUserCoin - price;
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

    if (insertError) {
      console.error('인벤토리 추가 실패:', insertError);
      alert('구매 처리 중 오류가 발생했습니다. (포인트는 차감되었을 수 있음)\n' + insertError.message);
    } else {
      alert('구매가 완료되었습니다!');
      currentUserCoin = newBalance;

      const coinEl = document.getElementById('coin-balance');
      const shopCoinEl = document.getElementById('shop-coin-balance');
      if (coinEl) coinEl.textContent = currentUserCoin;
      if (shopCoinEl) shopCoinEl.textContent = currentUserCoin;

      loadInventory?.();
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

  // 로컬 스토리지 클리어
  localStorage.removeItem('savedUsername');
  localStorage.removeItem('savedName');
  localStorage.removeItem('savedStudentNum');
  localStorage.removeItem('savedGrade');
  localStorage.removeItem('savedClassNum');
  localStorage.removeItem('savedRole');

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

function applyTheme(theme) {
  // 기존 테마 클래스 제거
  document.body.classList.remove('theme-dark', 'theme-pastel', 'theme-neon', 'theme-ocean');

  if (theme === 'dark') {
    document.body.classList.add('theme-dark');
  } else if (theme === 'system') {
    // 시스템 설정 따르기 (matchMedia)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('theme-dark');
    }
  }
}
