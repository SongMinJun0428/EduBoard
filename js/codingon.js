/**
 * CodingOn Integrated Module for EduBoard (v2.1)
 * Features: Natively rendered lessons, Pyodide (WASM) execution, Automatic progression.
 * Organization: Lessons in /lessons, Quizzes in /quizzes
 */

// ✅ State Management
window.coState = {
  xp: 0,
  level: 1,
  unlockedSteps: 0, 
  pyodide: null,    
  isPyodideLoading: false,
  currentLesson: null 
};

// Level Icons & Names (Expanded)
const CO_LEVELS = [
  { xp: 0, icon: "👶", name: "Hello World", level: 1 },
  { xp: 100, icon: "🪴", name: "코드 탐험가", level: 2 },
  { xp: 300, icon: "🌼", name: "로직 숙련자", level: 3 },
  { xp: 600, icon: "🌿", name: "알고리즘 개척자", level: 4 },
  { xp: 1000, icon: "🍀", name: "데이터 마스터", level: 5 },
  { xp: 1500, icon: "✨", name: "함수 장인", level: 6 },
  { xp: 2100, icon: "🔥", name: "파이썬 연금술사", level: 7 },
  { xp: 2800, icon: "🤖", name: "AI 빌더", level: 8 },
  { xp: 3600, icon: "👑", name: "코딩 총사령관", level: 9 }
];

// 🗺️ FULL ROADMAP (60 Items total)
const CO_ROADMAP = [
  // Step 0: 입문
  { id: "print.html", title: "0-1. print() 기초", type: "lesson", xp: 10 },
  { id: "python.hw1.html", title: "Q0-1. 다이아몬드 출력", type: "quiz", xp: 50 },

  // Step 1: 연산 기초
  { id: "python1.html", title: "1-1. 사칙연산", type: "lesson", xp: 15 },
  { id: "python2.html", title: "1-2. 타입 변환", type: "lesson", xp: 15 },
  { id: "python.hw2-1.html", title: "Q1-1. 몫과 나머지", type: "quiz", xp: 40 },
  { id: "python.hw2-2.html", title: "Q1-2. 거듭제곱 계산", type: "quiz", xp: 40 },

  // Step 2: 변수와 입력
  { id: "python4.html", title: "2-1. 변수 만들기", type: "lesson", xp: 20 },
  { id: "python2-2.html", title: "2-2. 변수 다루기", type: "lesson", xp: 20 },
  { id: "python2-3.html", title: "2-3. 변수와 계산", type: "lesson", xp: 20 },
  { id: "python2-4.html", title: "2-4. 값 입력 받기", type: "lesson", xp: 20 },
  { id: "python2-5.html", title: "2-5. 다양한 출력", type: "lesson", xp: 20 },
  { id: "python2-6.html", title: "2-6. 변수 예제", type: "lesson", xp: 20 },
  { id: "python.hw2-3.html", title: "Q2-1. 이익률 계산", type: "quiz", xp: 50 },
  { id: "python.hw2-4.html", title: "Q2-2. 소금물 농도", type: "quiz", xp: 50 },
  { id: "python.hw2.1-6.html", title: "Q2-3. 출생 연도", type: "quiz", xp: 50 },

  // Step 3: 비교와 논리
  { id: "python3-1.html", title: "3-1. 불과 비교 연산자", type: "lesson", xp: 25 },
  { id: "python3-2.html", title: "3-2. is, in, type", type: "lesson", xp: 25 },
  { id: "python3-3.html", title: "3-3. bool 변환", type: "lesson", xp: 25 },
  { id: "python3-4.html", title: "3-4. 논리 연산자", type: "lesson", xp: 25 },
  { id: "python3-5.html", title: "3-5. 비교 예제", type: "lesson", xp: 25 },
  { id: "python3.html", title: "3-6. 숫자 계산 응용", type: "lesson", xp: 25 },
  { id: "python.hw3-1.html", title: "Q3-1. 짝수 판별", type: "quiz", xp: 60 },
  { id: "python.hw3-2.html", title: "Q3-2. 배수 판별", type: "quiz", xp: 60 },
  { id: "python.hw3-6.html", title: "Q3-3. 윤년 판별", type: "quiz", xp: 60 },

  // Step 4: 자료구조 기초 (리스트, 튜플)
  { id: "python5-1.html", title: "4-1. 문자열 활용", type: "lesson", xp: 30 },
  { id: "python5-2.html", title: "4-2. 리스트 활용", type: "lesson", xp: 30 },
  { id: "python5-3.html", title: "4-3. 튜플 활용", type: "lesson", xp: 30 },
  { id: "python5-4.html", title: "4-4. range 활용", type: "lesson", xp: 30 },
  { id: "python5-5.html", title: "4-5. 시퀀스 자료형", type: "lesson", xp: 30 },
  { id: "python5-6.html", title: "4-6. 전종 기초 예제", type: "lesson", xp: 30 },
  { id: "python.hw2.1-10.html", title: "Q4-1. 문자열 이어붙이기", type: "quiz", xp: 50 },
  { id: "python.hw3-5.html", title: "Q4-2. 문자열 포함 여부", type: "quiz", xp: 50 },

  // Step 5: 기초 함수
  { id: "python4-1.html", title: "5-1. 함수의 호출", type: "lesson", xp: 35 },
  { id: "python4-2.html", title: "5-2. 함수의 반환", type: "lesson", xp: 35 },
  { id: "python4-3.html", title: "5-3. 함수 예제-1", type: "lesson", xp: 35 },
  { id: "python4-4.html", title: "5-4. 솔루션 함수", type: "lesson", xp: 35 },
  { id: "python4-5.html", title: "5-5. 함수 예제-2", type: "lesson", xp: 35 },
  { id: "python.hw3-4.html", title: "Q5-1. 두 수 비교", type: "quiz", xp: 60 },

  // Step 6: 조건문 심화
  { id: "python6-1.html", title: "6-1. if 조건문", type: "lesson", xp: 40 },
  { id: "python6-2.html", title: "6-2. if 활용하기", type: "lesson", xp: 40 },
  { id: "python6-3.html", title: "6-3. else 사용하기", type: "lesson", xp: 40 },
  { id: "python6-4.html", title: "6-4. 조건문 중첩", type: "lesson", xp: 40 },
  { id: "python6-5.html", title: "6-5. elif 사용하기", type: "lesson", xp: 40 },
  { id: "python6-6.html", title: "6-6. 조건문 종합", type: "lesson", xp: 40 },
  { id: "python.hw3-7.html", title: "Q6-1. 미성년자 판별", type: "quiz", xp: 70 },
  { id: "python.hw3-8.html", title: "Q6-2. 제곱수 판별", type: "quiz", xp: 70 },

  // Step 7: 기타 연습 문제들 (나머지 퀴즈들)
  { id: "python.hw2-5.html", title: "Q7-1. 소금물 역산", type: "quiz", xp: 50 },
  { id: "python.hw2-6.html", title: "Q7-2. 평균 속력", type: "quiz", xp: 50 },
  { id: "python.hw2-7.html", title: "Q7-3. 전력질주", type: "quiz", xp: 50 },
  { id: "python.hw2.1-1.html", title: "Q7-4. 두 정수의 합", type: "quiz", xp: 30 },
  { id: "python.hw2.1-2.html", title: "Q7-5. 두 정수의 차", type: "quiz", xp: 30 },
  { id: "python.hw2.1-3.html", title: "Q7-6. 두 정수의 곱", type: "quiz", xp: 30 },
  { id: "python.hw2.1-4.html", title: "Q7-7. 두 정수의 몫", type: "quiz", xp: 30 },
  { id: "python.hw2.1-5.html", title: "Q7-8. 두 정수의 나머지", type: "quiz", xp: 30 },
  { id: "python.hw2.1-7.html", title: "Q7-9. 연산 응용", type: "quiz", xp: 30 },
  { id: "python.hw2.1-8.html", title: "Q7-10. 특수문자", type: "quiz", xp: 30 },
  { id: "python.hw2.1-9.html", title: "Q7-11. 실수 정수부", type: "quiz", xp: 30 },
  { id: "python.hw2.1-11.html", title: "Q7-12. 계산식 출력", type: "quiz", xp: 40 },
  { id: "python.hw2.1-12.html", title: "Q7-13. 변수 형식", type: "quiz", xp: 40 },
  { id: "python.hw3-3.html", title: "Q7-14. 공배수 판별", type: "quiz", xp: 50 }
];

// 🚀 1. Initialization
window.initCodingOn = async function() {
  const username = localStorage.getItem("savedUsername");
  if (!username) return;

  console.log("🚀 Initializing CodingOn Integrated Module Explorer...");
  
  await loadCOUserData(username);
  renderCOHome();
  
  // Toggle Admin Nav
  const role = String(localStorage.getItem('savedRole') || '').toLowerCase();
  if (role === 'admin') {
    document.querySelectorAll('#nav-codingon-admin, #side-nav-codingon-admin').forEach(el => el.style.display = 'flex');
  }
  // Lazy load Pyodide
  if (!window.coState.pyodide && !window.coState.isPyodideLoading) {
    initPyodide();
  }
};

async function initPyodide() {
  window.coState.isPyodideLoading = true;
  try {
    const pyo = await loadPyodide();
    window.coState.pyodide = pyo;
    console.log("🐍 Pyodide Ready!");
  } catch (err) {
    console.error("Pyodide Load Failed:", err);
  } finally {
    window.coState.isPyodideLoading = false;
  }
}

// 🛡️ 2. Data Persistence (Main Supabase)
async function loadCOUserData(username) {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .select('co_xp, co_level, co_unlocked_steps')
      .eq('username', username)
      .single();

    if (error) throw error;

    if (data) {
      window.coState.xp = data.co_xp || 0;
      window.coState.level = data.co_level || 1;
      window.coState.unlockedSteps = data.co_unlocked_steps || 0;
      window.coState.levelInfo = getCOLevelInfo(window.coState.xp);
      console.log("📊 Loaded CodingOn Data:", window.coState);
    }
  } catch (err) {
    console.error("❌ Failed to load user data:", err.message);
  }
}

async function syncCOUserData() {
  const username = localStorage.getItem("savedUsername");
  if (!username) return;

  const updatePayload = {
    co_xp: window.coState.xp,
    co_level: window.coState.level,
    co_unlocked_steps: window.coState.unlockedSteps
  };

  console.log("💾 Syncing progress to DB...", updatePayload);

  const { error } = await supabaseClient
    .from('users')
    .update(updatePayload)
    .eq('username', username);
  if (error) {
    console.error("❌ Database Update Failed:", error.message);
    alert("⚠️ 진행도 저장에 실패했습니다: " + error.message);
  } else {
    console.log("✅ Database Update Success!");
  }
}

function getCOLevelInfo(xp) {
  let current = CO_LEVELS[0];
  let next = null;
  for (let i = 0; i < CO_LEVELS.length; i++) {
    if (xp >= CO_LEVELS[i].xp) {
      current = CO_LEVELS[i];
      next = CO_LEVELS[i + 1] || null;
    }
  }
  return { ...current, next };
}

function renderCOHome() {
  const container = document.getElementById('co-dynamic-content');
  if (!container) return;

  const info = window.coState.levelInfo || CO_LEVELS[0];
  const xp = window.coState.xp;
  const progress = info.next ? ((xp - info.xp) / (info.next.xp - info.xp)) * 100 : 100;

  let html = `
    <div class="co-home-view co-animate-in">
      <!-- Profile Header -->
      <div class="glass-card" style="padding: 2rem; margin-bottom: 2rem; background: linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(129, 140, 248, 0.04)); border: 1px solid rgba(79,70,229,0.15);">
        <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
          <div class="co-avatar" style="font-size: 4rem; width: 110px; height: 110px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.05);">
            ${info.icon}
          </div>
          <div style="flex: 1; min-width: 250px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.8rem;">
              <div>
                <span style="font-size: 0.9rem; color: #6366f1; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">${info.name}</span>
                <h2 style="margin: 0; font-size: 1.8rem; font-weight: 900; color: #1e293b;">LV.${info.level} <span style="font-weight: 500; font-size: 1.2rem; color: #64748b; margin-left: 10px;">${localStorage.getItem('userName') || ''}</span></h2>
              </div>
              <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">${xp} XP</span>
            </div>
            <div style="height: 12px; background: rgba(0,0,0,0.05); border-radius: 6px; overflow: hidden; position: relative;">
              <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, #4f46e5, #818cf8); border-radius: 6px; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 1.2rem; display: flex; justify-content: space-between; align-items: center;">
         <h3 style="margin:0; font-weight: 800;">🧭 학습 로드맵</h3>
      </div>

      <div class="roadmap-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem;">
  `;

  let currentStepNum = -1;
  const STEP_TITLES = [
    "🏁 STEP 0. 파이썬 시작하기",
    "🔢 STEP 1. 연산과 데이터의 기초",
    "📦 STEP 2. 변수와 입력 다루기",
    "⚖️ STEP 3. 비교와 논리의 세계",
    "📚 STEP 4. 데이터 묶음 (리스트/튜플)",
    "⚙️ STEP 5. 마법의 도구, 함수",
    "🔀 STEP 6. 조건문 심화",
    "🏆 STEP 7. 실전 문제 풀이"
  ];

  CO_ROADMAP.forEach((item, idx) => {
    const isUnlocked = idx <= window.coState.unlockedSteps;
    const isCompleted = idx < window.coState.unlockedSteps;
    const isCurrent = idx === window.coState.unlockedSteps;

    // Detect Step Change
    const stepMatch = item.title.match(/^(\d+)-/) || item.title.match(/^Q(\d+)-/);
    const stepNum = stepMatch ? parseInt(stepMatch[1]) : 7; // Default to step 7 if misc

    if (stepNum !== currentStepNum) {
      currentStepNum = stepNum;
      html += `<div class="co-step-header">${STEP_TITLES[stepNum] || `STEP ${stepNum}`}</div>`;
    }

    if (!window.CO_DATA[item.id]) return;

    html += `
      <div class="lesson-card glass-card ${!isUnlocked ? 'locked' : ''} ${isCurrent ? 'current' : ''}" 
           onclick="${isUnlocked ? `openLessonModal('${item.id}')` : ''}"
           style="position: relative; padding: 1.5rem; border: 2px solid ${isCurrent ? '#4f46e5' : 'transparent'}; opacity: ${isUnlocked ? '1' : '0.5'}; cursor: ${isUnlocked ? 'pointer' : 'not-allowed'}; min-height: 140px; display: flex; flex-direction: column; justify-content: space-between;">
        ${isCompleted ? '<div style="position:absolute; top:12px; right:12px; color:#10b981; font-size: 1.2rem;">●</div>' : ''}
        <div>
          <div class="co-step-badge">ITEM ${idx + 1}</div>
          <div style="font-size: 1.8rem; margin-bottom: 0.5rem;">${item.type === 'lesson' ? '📖' : '🎯'}</div>
          <h4 style="margin:0; font-size: 1rem; line-height: 1.4; color: var(--text-main);">${item.title}</h4>
        </div>
        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem; font-weight: 600;">+ ${item.xp} XP</div>
      </div>
    `;
  });
  
  html += `</div>
    </div>
  `;
  container.innerHTML = html;
}

function getActiveLessonModal() {
  const modals = Array.from(document.querySelectorAll('#co-lesson-modal'));
  return modals.find(modal => modal.style.display !== 'none') || modals[modals.length - 1] || null;
}

// 📚 4. Lesson Modal Logic
window.openLessonModal = function(idx) {
  // Prevent duplicate modals
  document.querySelectorAll('#co-lesson-modal').forEach(modal => modal.remove());

  const item = window.CO_DATA[idx] || { title: "내용 없음", content: "데이터를 찾을 수 없습니다.", template: "" };
  window.coState.currentStepIdx = idx;

  const modalHtml = `
    <div id="co-lesson-modal" class="co-animate-in" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(2, 6, 23, 0.98); z-index:10000; display:flex; align-items:center; justify-content:center; padding:15px; border:none !important;">
      <div class="premium-modal" style="width:100%; max-width:1500px; height:96vh; display:flex; flex-direction:column; overflow:hidden;">
        
        <div style="padding: 1.25rem 2rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 15px; min-width: 0;">
            <div style="background: #4f46e5; color: white; padding: 5px 10px; border-radius: 8px; font-weight: 900; font-size: 0.75rem; text-transform: uppercase;">LEARN</div>
            <h3 style="margin:0; font-size: 1.6rem; font-weight: 900; color: var(--text-main); line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.title}</h3>
          </div>
          <button onclick="closeLessonModal()" style="background:rgba(239, 68, 68, 0.1); border:none; width: 44px; height: 44px; border-radius: 50%; font-size:2rem; cursor:pointer; color:#ef4444; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">&times;</button>
        </div>

        <div class="co-split-view" style="flex:1; display:flex; overflow:hidden;">
          <!-- Left: Lesson -->
          <div id="co-lesson-body" style="flex:1; overflow-y:auto; padding:2rem 2.5rem; background: var(--bg-card); border-right: 1px solid var(--border-color);">
            ${item.content}
          </div>

          <!-- Right: Tools -->
          <div style="flex:1; display:flex; flex-direction:column; background: #fafafa; position: relative; overflow-y: auto;">
            <div style="display:flex; flex-direction:column; padding: 1.5rem; gap:1.2rem; min-height: fit-content;">
              <div class="co-editor-container" style="flex:1; display:flex; flex-direction:column; border-radius:12px; overflow:hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="padding: 10px 1.25rem; background: #fff; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size:0.75rem; font-weight:800; color:#64748b;">🐍 PYTHON EDITOR</span>
                  <span id="co-py-status" style="font-size:0.75rem; color:#10b981; font-weight:800;">● Engine Ready</span>
                </div>
                <textarea id="co-code-editor" spellcheck="false" placeholder="Write your python code here..." style="flex:1; width:100%; border:none; padding:1.5rem; outline:none; resize:none; font-family:'Consolas', monospace;"></textarea>
              </div>

              <div style="display:flex; gap:10px;">
                <button id="co-run-btn" onclick="runCode()" style="flex:3; padding:1.2rem; background:#4f46e5; color:white; border:none; border-radius:12px; font-weight:900; font-size: 1.1rem; cursor:pointer; box-shadow: 0 4px 15px rgba(79,70,229,0.3); transition: all 0.2s;">▶ RUN CODE</button>
                <button onclick="resetEditorCode()" style="flex:1; padding:1.2rem; background:white; color:#64748b; border:1px solid #e2e8f0; border-radius:12px; font-weight:800; cursor:pointer;">RESET 🔄</button>
              </div>

              <div class="co-console-wrapper" style="flex: 0.8; display:flex; flex-direction:column;">
                <div class="co-console-header">
                  <span>TERMINAL OUTPUT</span>
                  <button onclick="clearConsole()" style="padding: 2px 8px; background: rgba(255,255,255,0.1); border-radius: 4px; border:none; color:inherit; cursor:pointer;">Clear</button>
                </div>
                <div id="co-console" style="flex:1; overflow-y:auto;">>>> Waiting for input...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const editor = getActiveLessonModal()?.querySelector('#co-code-editor');
  if (editor) editor.value = item.template || "";
  document.body.style.overflow = 'hidden';
};

window.closeLessonModal = function() {
  document.querySelectorAll('#co-lesson-modal').forEach(modal => modal.remove());
  document.body.style.overflow = '';
};

window.resetEditorCode = function() {
  const item = window.CO_DATA[window.coState.currentStepIdx];
  const editor = getActiveLessonModal()?.querySelector('#co-code-editor');
  if (item && editor) editor.value = item.template || "";
};

window.clearConsole = function() {
  const consoleEl = document.getElementById('co-console');
  if (consoleEl) consoleEl.innerText = "";
};

// 🐍 5. Python Execution
window.runCode = async function() {
  const modal = getActiveLessonModal();
  if (!modal) return;

  const runBtn = modal.querySelector('#co-run-btn');
  const code = modal.querySelector('#co-code-editor')?.value || '';
  const consoleEl = modal.querySelector('#co-console');
  const item = window.CO_DATA[window.coState.currentStepIdx];
  if (!consoleEl) return;

  if (!code.trim()) return alert("코드를 입력하세요.");

  if (!window.coState.pyodide) {
    consoleEl.innerText = "파이썬 엔진 초기화 중...";
    await initPyodide();
  }

  if (runBtn) runBtn.disabled = true;
  consoleEl.innerText = "실행 중...\n";

  try {
    let output = "";
    window.coState.pyodide.setStdout({ batched: (str) => { output += str + "\n"; } });
    await window.coState.pyodide.runPythonAsync(code);
    
    const trimmedOutput = output.trim();
    consoleEl.innerText = trimmedOutput || "실행됨 (출력 없음)";
    consoleEl.style.color = "#f1f5f9";

    if (item.type === 'quiz') {
      await verifyAnswer(trimmedOutput);
    } else {
      await advanceProgression();
    }
  } catch (err) {
    let msg = err.message;
    if (msg.includes('Traceback')) msg = msg.split('\n').filter(l => !l.includes('_pyodide') && !l.includes('eval_code_async')).join('\n');
    consoleEl.innerText = "❌ ERROR:\n" + msg;
    consoleEl.style.color = "#fb7185";
  } finally {
    consoleEl.scrollTop = consoleEl.scrollHeight;
    if (runBtn) runBtn.disabled = false;
  }
};

window.runPythonCode = function() {
  if (typeof window.runCode === 'function') return window.runCode();
};

window.closeCOModal = function() {
  if (typeof window.closeLessonModal === 'function') window.closeLessonModal();
};

async function verifyAnswer(output) {
  const item = window.CO_DATA[window.coState.currentStepIdx];
  const expected = item.answer ? item.answer.trim() : null;
  const consoleEl = getActiveLessonModal()?.querySelector('#co-console');
  if (!consoleEl) return;

  if (!expected) {
    consoleEl.innerHTML += `\n\n<div style="color: #4ade80; font-weight:800;">✅ 정답(자동 확인) 처리되었습니다.</div>`;
    await advanceProgression();
    return;
  }

  if (output === expected) {
    consoleEl.innerHTML += `\n\n<div style="color: #4ade80; font-weight:800;">✅ 정답입니다! +${item.xp || 10} XP</div>`;
    await advanceProgression();
  } else {
    consoleEl.innerHTML += `\n\n<div style="color: #fbbf24; font-weight:800;">❌ 오답입니다. 결과가 정확히 일치해야 합니다.</div>`;
  }
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

async function advanceProgression() {
  const currentIdx = CO_ROADMAP.findIndex(i => i.id === window.coState.currentStepIdx);
  if (currentIdx === window.coState.unlockedSteps) {
    window.coState.unlockedSteps++;
    const item = window.CO_DATA[window.coState.currentStepIdx];
    window.coState.xp += item.xp || 10;
    
    const newInfo = getCOLevelInfo(window.coState.xp);
    if (newInfo.level > window.coState.level) {
      window.coState.level = newInfo.level;
      alert(`🎊 LEVEL UP! ${newInfo.icon} ${newInfo.name} 등급이 되었습니다!`);
    }

    await syncCOUserData();
    renderCOHome();
  }
}

// ⚙️ 6. Admin Logic
window.renderCOAdmin = async function(subTab = 'list') {
  const container = document.getElementById('co-admin-content');
  if (!container) return;

  container.innerHTML = `
    <div class="co-admin-wrapper co-animate-in" style="min-height: 500px;">
      <!-- Sub-Tabs Navigation (Tailwind Styled) -->
      <div class="flex items-center gap-1 p-4 bg-gray-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800">
        <button onclick="renderCOAdmin('list')" 
                class="px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${subTab === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm dark:hover:bg-slate-800'}">
          👥 학생 목록
        </button>
        <button onclick="renderCOAdmin('approve')" 
                class="px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${subTab === 'approve' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm dark:hover:bg-slate-800'}">
          🎯 승인 요청
        </button>
      </div>

      <!-- Content Area -->
      <div id="co-admin-body" class="p-0">
        <div style="padding: 5rem; text-align: center; color: #94a3b8; font-weight: 600;">
          <div class="loader-spinner mb-4"></div>
          <div>데이터를 안전하게 불러오는 중...</div>
        </div>
      </div>
    </div>
  `;

  if (subTab === 'list') {
    await renderCOStudentList();
  } else {
    await renderCOApproval();
  }
};

async function renderCOStudentList() {
  const body = document.getElementById('co-admin-body');
  if (!body) return;

  try {
    const { data: students, error } = await supabaseClient
      .from('users')
      .select('name, student_number, co_xp, co_level, co_unlocked_steps')
      .order('co_xp', { ascending: false });

    if (error) throw error;

    let html = `
      <!-- Toolbar (Search & Statistics) -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <div>
          <h4 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">STUNDENT PROGRESS MONITOR</h4>
          <div class="text-xl font-black text-slate-800 dark:text-white">학생 전체 명단 (${students.length}명)</div>
        </div>
        <div class="relative w-full sm:w-72">
          <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input type="text" id="co-student-search" placeholder="이름 또는 학번 검색..." oninput="filterCOStudentList()" 
                 class="w-full h-11 pl-10 pr-4 text-sm rounded-2xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white outline-none transition-all shadow-sm">
        </div>
      </div>

      <!-- Table Container -->
      <div id="co-student-table-container" class="overflow-x-auto p-4 bg-gray-50/30 dark:bg-slate-950/20">
        <div class="table-container shadow-sm border-none">
          ${getStudentTableHtml(students)}
        </div>
      </div>
    `;
    body.innerHTML = html;
  } catch (err) {
    body.innerHTML = `<div style="padding: 3rem; text-align: center; color: #fb7185;">학생 목록 로드 실패: ${escapeHtml(err.message)}</div>`;
  }
}

function getStudentTableHtml(students) {
  let tableHtml = `
    <table class="min-w-full text-sm">
      <thead>
        <tr class="bg-gray-50 dark:bg-slate-800/50">
          <th class="w-20 px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">순위</th>
          <th class="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">학생 정보</th>
          <th class="w-32 px-6 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">학습 레벨</th>
          <th class="w-32 px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">누적 XP</th>
          <th class="w-48 px-6 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">미션 진행도</th>
          <th class="w-24 px-6 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">작업</th>
        </tr>
      </thead>
      <tbody id="co-student-rows">
  `;

  students.forEach((s, idx) => {
    const progressPercent = Math.round((s.co_unlocked_steps / CO_ROADMAP.length) * 100);
    const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
    const isTop3 = idx < 3;
    
    // Level Badge Color Logic
    const lv = s.co_level || 1;
    let lvColor = 'bg-slate-100 text-slate-600';
    if (lv >= 30) lvColor = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    else if (lv >= 20) lvColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    else if (lv >= 10) lvColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';

    tableHtml += `
      <tr class="co-student-row group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors border-b border-gray-100 dark:border-slate-800" 
          data-name="${s.name || ''}" data-sn="${s.student_number || ''}">
        <td class="px-6 py-4">
          <span class="text-sm font-black ${isTop3 ? 'text-indigo-600' : 'text-slate-400'}">${rankEmoji}</span>
        </td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-800 dark:text-white">${s.name || '익명'}</div>
          <div class="text-xs text-slate-400 font-medium">${s.student_number || '-'}</div>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${lvColor}">LV.${lv}</span>
        </td>
        <td class="px-6 py-4 text-right font-mono font-bold text-slate-600 dark:text-slate-400">
          ${(s.co_xp || 0).toLocaleString()} <span class="text-[10px] text-slate-300">XP</span>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
             <div class="flex-1 h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
               <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000" style="width: ${progressPercent}%"></div>
             </div>
             <span class="text-xs font-black text-indigo-600 w-8">${progressPercent}%</span>
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <button class="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
            <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tableHtml += `</tbody></table>`;
  return tableHtml;
}

window.filterCOStudentList = function() {
  const kw = document.getElementById('co-student-search').value.toLowerCase();
  const rows = document.querySelectorAll('.co-student-row');
  rows.forEach(r => {
    const name = r.dataset.name.toLowerCase();
    const sn = String(r.dataset.sn).toLowerCase();
    r.style.display = (name.includes(kw) || sn.includes(kw)) ? '' : 'none';
  });
};

async function renderCOApproval() {
  const body = document.getElementById('co-admin-body');
  if (!body) return;

  body.innerHTML = `
    <div class="flex flex-col items-center justify-center py-24 px-6 bg-white dark:bg-slate-900 min-h-[500px] co-animate-in">
      <div class="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-4xl mb-8 shadow-sm border border-gray-100 dark:border-slate-800">
        🎯
      </div>
      <h3 class="text-xl font-black text-slate-800 dark:text-white mb-3">승인 대기 중인 과제가 없습니다.</h3>
      <p class="text-slate-500 dark:text-slate-400 text-center max-w-sm leading-relaxed mb-10 text-sm font-medium">
        학생들이 제출한 코드가 여기에 나타나며, 선생님은 내용을 검토하고 보너스 XP를 승인하거나 피드백을 남길 수 있습니다.
      </p>
      <button onclick="renderCOAdmin('approve')" 
              class="px-8 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-2xl font-black text-sm hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm">
        새로고침 🔄
      </button>
    </div>
  `;
}

window.resetEditorCode = function() {
  const item = window.CO_DATA[window.coState.currentStepIdx];
  if (item && confirm("현재 작성한 코드를 모두 지우고 초기 상태로 되돌릴까요?")) {
    const editor = getActiveLessonModal()?.querySelector('#co-code-editor');
    if (editor) editor.value = item.template || "";
  }
};

// Global Nav Switch
window.switchCOTab = function(tab) {
  const buttons = document.querySelectorAll('.co-sub-nav button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  const container = document.getElementById('co-dynamic-content');
  if (tab === 'home') {
    renderCOHome();
  } else if (tab === 'admin') {
     renderCOAdmin();
  }
};
