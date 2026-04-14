const client = window.supabase.createClient(
    window.EduConfig.getSupabaseURL(),
    window.EduConfig.getSupabaseKey()
);

/* --------------------
   자리 관리
-------------------- */
let seatData = [];

async function loadSeats() {
    const { data, error } = await client.from("class_seats")
        .select("id,student_number,name,seat_index,locked")  // ✅ name 불러옴
        .eq("grade", 2).eq("class_num", 3)
        .order("seat_index");
    if (error) { console.error(error); return; }
    seatData = data || [];
    renderSeats();
}

function renderSeats() {
    const container = document.getElementById("seat-map");
    container.innerHTML = "";
    seatData.forEach((s, i) => {
        const div = document.createElement("div");
        div.className = "seat";
        if (s.locked) div.classList.add("locked");
        
        // [번호] 이름 형식으로 표시 (번호 포함 요청 반영)
        div.innerHTML = `
          <div class="s-num" style="font-size: 0.7rem; color: #64748b; font-weight: 600;">${s.student_number || (i+1)}</div>
          <div class="s-name" style="font-size: 0.95rem; font-weight: 800; color: #1e293b;">${s.name}</div>
        `;
        
        div.draggable = true;
        div.dataset.index = i;

        div.addEventListener("dragstart", e => {
            e.dataTransfer.setData("from", i);
        });
        div.addEventListener("dragover", e => e.preventDefault());
        div.addEventListener("drop", e => {
            e.preventDefault();
            const from = parseInt(e.dataTransfer.getData("from"));
            swapSeats(from, i);
        });
        div.addEventListener("contextmenu", async e => {
            e.preventDefault();
            seatData[i].locked = !seatData[i].locked;
            await client.from("class_seats")
                .update({ locked: seatData[i].locked })
                .eq("id", seatData[i].id);
            renderSeats();
        });

        container.appendChild(div);
    });
}

function swapSeats(from, to) {
    if (seatData[from].locked || seatData[to].locked) return;

    const temp = seatData[from];
    seatData[from] = seatData[to];
    seatData[to] = temp;

    // 화면 갱신
    renderSeats();

    // 방금 바뀐 두 자리만 효과
    highlightSeats([from, to]);
}


// 🔧 실제 섞기 + 기존 효과들 실행 (랜덤 셔플 핵심 로직)
function basicShuffleCore() {
    // 1) 잠금 안 된 좌석만 따로 뽑아서 섞기
    let free = seatData.filter(s => !s.locked);
    let shuffled = [...free].sort(() => Math.random() - 0.5);

    // 2) 잠긴 자리는 그대로 두고, 나머지만 섞인 순서로 다시 배치
    let idx = 0;
    seatData = seatData.map(s => {
        if (s.locked) return s;
        return { ...shuffled[idx++] };
    });

    // 3) 새로운 배열 순서대로 seat_index 다시 부여
    seatData.forEach((s, i) => {
        s.seat_index = i + 1;
    });

    // 4) 화면 다시 그리기
    renderSeats();

    // 5) 기존에 만들어 둔 효과들 실행 (있을 때만)
    if (typeof randomizeSeatVars === "function") {
        randomizeSeatVars();   // 좌석별 랜덤 이동량 (pop 효과용)
    }
    if (typeof animateAllSeats === "function") {
        animateAllSeats();     // 전체 흔들림/반짝임 효과
    }

    // 6) 셔플 직후 웅장하게 "팡" 튀는 보너스 효과
    const seats = document.querySelectorAll("#seat-map .seat");
    seats.forEach(el => {
        el.classList.remove("grand-seat");
        void el.offsetWidth;  // 애니메이션 리셋 트릭
        el.classList.add("grand-seat");
        setTimeout(() => {
            el.classList.remove("grand-seat");
        }, 650);
    });
}


// 🎬 화면 가려지고 카운트다운 후 basicShuffleCore 실행
function shuffleSeats() {
    const overlay = document.getElementById("shuffle-overlay");

    // 오버레이가 없으면 → 그냥 기본 셔플만
    if (!overlay) {
        basicShuffleCore();
        return;
    }

    const countEl = overlay.querySelector(".overlay-count");
    const titleEl = overlay.querySelector(".overlay-title");

    if (!countEl || !titleEl) {
        basicShuffleCore();
        return;
    }

    overlay.classList.add("active");
    titleEl.textContent = "자리 셔플 시작!";
    let count = 3;
    countEl.textContent = count;

    const interval = setInterval(() => {
        count -= 1;

        if (count > 0) {
            countEl.textContent = count;
        } else {
            countEl.textContent = "GO!";
            clearInterval(interval);

            // GO! 잠깐 보여준 뒤 실제 셔플 실행
            setTimeout(() => {
                basicShuffleCore();   // 🔥 실제 자리 섞기 + 기존 효과들

                // 결과 잠깐 보여주고 오버레이 닫기
                setTimeout(() => {
                    overlay.classList.remove("active");
                }, 500);
            }, 450);
        }
    }, 800);
}

/*function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function shuffleSeats() {
  const cookieKey = "minjun_hojoo_count";
  const count = parseInt(getCookie(cookieKey) || "0");

  // ✅ 11회 이상이면 기존 방식 사용
  if (count >= 2) {
    let free = seatData.filter(s => !s.locked);
    let shuffled = [...free].sort(() => Math.random() - 0.5);

    let idx = 0;
    seatData = seatData.map(s => {
      if (s.locked) return s;
      return { ...shuffled[idx++] };
    });

    seatData.forEach((s, i) => s.seat_index = i + 1);
    renderSeats();

    return;
  }

  // ✅ 1~10회는 송민준, 곽호주 고정 + 나머지 랜덤
  const idxMinjun = seatData.findIndex(s => s.name === "송민준");
  const idxHojoo = seatData.findIndex(s => s.name === "곽호주");

  if (idxMinjun === -1 || idxHojoo === -1) {
    alert("❌ 송민준 또는 곽호주 학생을 찾을 수 없습니다.");
    return;
  }

  const minjun = seatData[idxMinjun];
  const hojoo = seatData[idxHojoo];

  // 🔄 송민준/곽호주 제외하고 unlocked 자리만 섞기
  const others = seatData.filter(s =>
    !s.locked &&
    s.name !== "송민준" &&
    s.name !== "곽호주"
  );
  const shuffled = [...others].sort(() => Math.random() - 0.5);

  let newSeats = [];
  let shuffledIndex = 0;

  for (let i = 0; i < seatData.length; i++) {
    if (seatData[i].locked) {
      newSeats.push(seatData[i]); // 고정 좌석
    } else if (i === 24) {
      newSeats.push({ ...minjun }); // 25번 자리에 송민준
    } else if (i === 25) {
      newSeats.push({ ...hojoo }); // 26번 자리에 곽호주
    } else {
      const next = shuffled[shuffledIndex++];
      newSeats.push(next ? { ...next } : { ...seatData[i] });
    }
  }

  newSeats.forEach((s, i) => {
    s.seat_index = i + 1;
  });

  seatData = newSeats;
  renderSeats();
  setCookie(cookieKey, (count + 1).toString(), 365);
}
*/

// 각 좌석에 랜덤 이동량 설정 → CSS 변수로 전달
function randomizeSeatVars() {
    const seats = document.querySelectorAll("#seat-map .seat");
    seats.forEach(el => {
        const randX = (Math.random() * 30 - 15) + "px";
        const randY = (Math.random() * 30 - 15) + "px";
        el.style.setProperty("--x", randX);
        el.style.setProperty("--y", randY);
    });
}

async function saveSeats() {
    try {
        // 1️⃣ seat_index 재정렬
        seatData.forEach((s, i) => s.seat_index = i + 1);

        // 2️⃣ 기존 데이터 삭제
        let { error: delError } = await client
            .from("class_seats")
            .delete()
            .eq("grade", 2)
            .eq("class_num", 3);

        if (delError) throw delError;

        // 3️⃣ seatData -> insert 용으로 정리 (id 제거!)
        const insertData = seatData.map(s => ({
            grade: 2,
            class_num: 3,
            student_number: s.student_number,
            name: s.name,
            seat_index: s.seat_index,
            locked: s.locked
        }));

        let { error: insError } = await client
            .from("class_seats")
            .insert(insertData);

        if (insError) throw insError;

        alert("✅ 자리 저장 완료!");
        await loadSeats(); // 저장 후 다시 불러오기

    } catch (e) {
        console.error("❌ 저장 실패", e);
        alert("❌ 저장 실패: " + e.message);
    }
}





/* --------------------
   과제
-------------------- */
async function addAssignment() {
    const title = document.getElementById("assign-title").value;
    const deadline = document.getElementById("assign-deadline").value;
    await client.from("assignments")
        .insert([{ title, deadline, grade: 2, class_num: 3 }]);
    alert("✅ 과제 등록 완료");
}

/* --------------------
   포인트
-------------------- */
async function updatePoint() {
    const name = document.getElementById("point-name").value;
    const point = parseInt(document.getElementById("point-value").value);
    await client.from("class_student_points")
        .update({ point })
        .eq("name", name).eq("grade", 2).eq("class_num", 3);
    alert("✅ 포인트 수정 완료");
}

/* --------------------
   퀴즈
-------------------- */
// 퀴즈 추가
async function addQuiz() {
    const question = document.getElementById("quiz-question").value.trim();
    if (!question) {
        alert("❌ 문제를 입력하세요.");
        return;
    }

    try {
        // 오늘 세트 uuid 가져오기 (없으면 새로 생성)
        let setId = localStorage.getItem("quiz_set_id");
        if (!setId) {
            setId = crypto.randomUUID();  // ✅ uuid 생성
            localStorage.setItem("quiz_set_id", setId);
        }

        // 현재 세트 내 마지막 number 조회
        const { data: existing, error: fetchError } = await client
            .from("english_quiz_questions")
            .select("number")
            .eq("quiz_set_id", setId)
            .order("number", { ascending: false })
            .limit(1);

        if (fetchError) throw fetchError;

        const nextNumber = existing?.[0]?.number ? existing[0].number + 1 : 1;

        // 퀴즈 저장
        const { error } = await client.from("english_quiz_questions").insert([
            {
                quiz_set_id: setId,
                number: nextNumber,
                question
            }
        ]);

        if (error) throw error;

        alert(`✅ 퀴즈 추가 완료! (번호: ${nextNumber})`);
        document.getElementById("quiz-question").value = "";

    } catch (e) {
        console.error("❌ 퀴즈 추가 실패", e);
        alert("❌ 퀴즈 추가 실패: " + e.message);
    }
}


/* --------------------
   투표
-------------------- */
async function addVote() {
    const q = document.getElementById("vote-question").value;
    const opts = document.getElementById("vote-options").value.split(",").map(x => x.trim());
    await client.from("class_votes").insert([
        { question: q, options: opts, grade: 2, class_num: 3 }
    ]);
    alert("✅ 투표 등록 완료");
}

document.addEventListener("DOMContentLoaded", loadSeats);

// 학생 목록 불러오기 → 드롭다운 채우기
async function loadPointStudents() {
    try {
        const { data, error } = await client
            .from("class_student_points")
            .select("name")
            .eq("grade", 2)
            .eq("class_num", 3)
            .order("student_number");

        if (error) throw error;

        const select = document.getElementById("point-student");
        select.innerHTML = data.map(s => `<option value="${s.name}">${s.name}</option>`).join("");
    } catch (e) {
        console.error("❌ 학생 불러오기 실패", e);
    }
}

// 포인트 추가
async function addPoint() {
    const name = document.getElementById("point-student").value;
    const addValue = parseInt(document.getElementById("point-value").value);

    if (!name || isNaN(addValue)) {
        alert("❌ 학생과 포인트를 입력하세요.");
        return;
    }

    try {
        // 1️⃣ 현재 포인트 가져오기
        const { data, error } = await client
            .from("class_student_points")
            .select("point")
            .eq("grade", 2)
            .eq("class_num", 3)
            .eq("name", name)
            .single();

        if (error) throw error;

        const newPoint = (data?.point || 0) + addValue;

        // 2️⃣ 새로운 포인트 저장
        const { error: updateError } = await client
            .from("class_student_points")
            .update({ point: newPoint })
            .eq("grade", 2)
            .eq("class_num", 3)
            .eq("name", name);

        if (updateError) throw updateError;

        alert(`✅ ${name} 학생 포인트가 ${newPoint}점으로 업데이트됨!`);
        document.getElementById("point-value").value = "";
    } catch (e) {
        console.error("❌ 포인트 추가 실패", e);
        alert("❌ 포인트 추가 실패: " + e.message);
    }
}
async function makeAdjacentByName(name1, name2) {
    // 1️⃣ 두 학생 찾기
    const idx1 = seatData.findIndex(s => s.name === name1);
    const idx2 = seatData.findIndex(s => s.name === name2);

    if (idx1 === -1 || idx2 === -1) {
        alert("❌ 두 학생 중 한 명을 찾을 수 없습니다.");
        return;
    }

    // 2️⃣ 두 학생을 배열에서 추출
    const stu1 = seatData[idx1];
    const stu2 = seatData[idx2];

    // 3️⃣ 잠긴 좌석 제외하고 빈 쌍 찾기
    for (let i = 0; i < seatData.length - 1; i++) {
        if (
            !seatData[i].locked &&
            !seatData[i + 1].locked &&
            seatData[i].name !== name1 &&
            seatData[i].name !== name2 &&
            seatData[i + 1].name !== name1 &&
            seatData[i + 1].name !== name2
        ) {
            // 해당 위치에 stu1, stu2 삽입
            seatData.splice(idx1, 1);
            if (idx2 > idx1) seatData.splice(idx2 - 1, 1);
            else seatData.splice(idx2, 1);

            seatData.splice(i, 0, stu1);
            seatData.splice(i + 1, 0, stu2);

            renderSeats();
            alert(`✅ ${name1}과 ${name2}를 붙여 배치했습니다.`);
            return;
        }
    }

    alert("❌ 인접한 자리가 없습니다.");
}
// ✅ 드래그로 바꾼 두 자리만 반짝 효과
function highlightSeats(indexArray) {
    const container = document.getElementById("seat-map");
    indexArray.forEach(i => {
        const el = container.children[i];
        if (!el) return;

        // 애니메이션을 다시 적용하기 위한 트릭
        el.classList.remove("seat-moved");
        void el.offsetWidth; // reflow
        el.classList.add("seat-moved");

        setTimeout(() => {
            el.classList.remove("seat-moved");
        }, 400);
    });
}

// ✅ 전체 랜덤 섞기 할 때 모든 좌석에 효과
function animateAllSeats() {
    const seats = document.querySelectorAll("#seat-map .seat");
    seats.forEach(el => {
        el.classList.remove("seat-moved", "seat-shuffle");
        void el.offsetWidth;
        el.classList.add("seat-shuffle");
        setTimeout(() => {
            el.classList.remove("seat-shuffle");
        }, 350);
    });
}

// ✅ 그리드 가로 칸 수 변경 (HWP 파일 참고 목적)
function updateGridLayout(cols) {
    const map = document.getElementById("seat-map");
    map.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
}

// ✅ 자리 배치표 이미지 다운로드 (PDF 형식처럼)
async function downloadSeatingChart() {
    const container = document.getElementById("seat-map-container");
    const map = document.getElementById("seat-map");
    const cols = document.getElementById("column-count").value;
    const now = new Date();
    
    // 1️⃣ 임시 요소 생성 (전문화된 스타일)
    const exportTitle = document.createElement("div");
    exportTitle.style.cssText = "text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e293b; padding-bottom: 15px;";
    exportTitle.innerHTML = `
        <h1 style="margin: 0; font-size: 2.2rem; font-weight: 900; color: #1e293b; letter-spacing: 0.1em;">2026학년도 2학년 3반 좌석 배치표</h1>
        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 0.9rem;">${now.getFullYear()}년 ${now.getMonth()+1}월 기준 | 봉담중학교</p>
    `;

    const deskBox = document.createElement("div");
    deskBox.style.cssText = "width: 200px; height: 50px; border: 2px solid #1e293b; margin: 0 auto 30px auto; display: flex; align-items: center; justify-content: center; font-weight: 800; background: #f8fafc; font-size: 1.1rem; letter-spacing: 0.3em;";
    deskBox.innerText = "교탁";
    
    // 2️⃣ 기존 좌석 임시 스타일 변경 (캡처용)
    const originalStyle = map.style.cssText;
    const seats = map.querySelectorAll(".seat");
    const originalSeatStyles = Array.from(seats).map(s => s.style.cssText);
    const originalSeatInners = Array.from(seats).map(s => s.innerHTML);

    // 캡처용 스타일 강제 적용
    map.style.gap = "0px"; // 표 형식처럼 붙이기
    map.style.borderLeft = "1px solid #1e293b";
    map.style.borderTop = "1px solid #1e293b";
    
    seats.forEach((s, idx) => {
        const student = seatData[idx];
        s.style.cssText = `
            border-right: 1px solid #1e293b !important;
            border-bottom: 1px solid #1e293b !important;
            background: #fff !important;
            border-radius: 0 !important;
            padding: 1.5rem 0.5rem !important;
            height: 100px !important;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: none !important;
            transform: none !important;
        `;
        // [번호. 이름] 형식으로 깔끔하게 재구성
        s.innerHTML = `
            <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 4px;">${student.student_number || (idx+1)}</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b;">${student.name}</div>
        `;
    });

    container.prepend(deskBox);
    container.prepend(exportTitle);

    try {
        container.style.width = "1000px"; // 넓은 캔버스 확보
        container.style.padding = "50px";
        
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff"
        });

        const link = document.createElement("a");
        link.download = `2-3_정식_좌석배치표_${now.toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        
    } catch (e) {
        console.error("다운로드 실패", e);
        alert("이미지 생성 중 오류가 발생했습니다.");
    } finally {
        // 원상복구
        exportTitle.remove();
        deskBox.remove();
        map.style.cssText = originalStyle;
        seats.forEach((s, idx) => {
            s.style.cssText = originalSeatStyles[idx];
            s.innerHTML = originalSeatInners[idx];
        });
        container.style.width = "";
        container.style.padding = "20px";
    }
}

// 페이지 로드시 학생 목록 불러오기
document.addEventListener("DOMContentLoaded", () => {
    loadSeats();         // 기존 자리 불러오기
    loadPointStudents(); // 학생 목록 불러오기
});
