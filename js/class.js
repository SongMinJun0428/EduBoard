const $ = (id) => document.getElementById(id);

/* 메뉴 토글 */
function toggleMenu() { $('nav').classList.toggle('show'); }

/* 다크 모드 */
function toggleDark() { document.body.classList.toggle('dark'); }

/* Supabase 클라이언트 */
/* Supabase 클라이언트 */
const client = window.supabase.createClient(
    window.EduConfig.getSupabaseURL(),
    window.EduConfig.getSupabaseKey()
);

/* 공지 */
async function loadNotices() {
    try {
        const { data, error } = await client
            .from("notices")
            .select("title, content, created_at, image_url")
            .eq("grade", 2).eq("class_num", 3)
            .order("created_at", { ascending: false });
        if (error) throw error;

        if (data && data.length) {
            $('notice-list').innerHTML = data.map(n => {
                const date = new Date(n.created_at).toLocaleDateString("ko-KR", {
                    year: "numeric", month: "2-digit", day: "2-digit"
                });
                return `
          <div class="notice-item">
            ${n.image_url
                        ? `<img src="${n.image_url}" class="notice-thumb" alt="공지 이미지" onclick="openModal('${n.image_url}')">`
                        : ""}
            <div class="notice-body">
              <div class="notice-title">📌 ${n.title}</div>
              <div class="notice-date">${date}</div>
              <div class="notice-content">${n.content}</div>
            </div>
          </div>
        `;
            }).join("");
        } else {
            $('notice-list').innerHTML = "<p>공지 없음</p>";
        }
    } catch (e) {
        console.error(e);
        $('notice-list').innerHTML = "❌ 공지 불러오기 오류";
    }
}

/* 과제 */
async function loadAssignments() {
    try {
        const { data, error } = await client
            .from("assignments")
            .select("title, deadline")
            .eq("grade", 2).eq("class_num", 3)
            .order("deadline", { ascending: true });
        if (error) throw error;
        $('assign-list').innerHTML = (data && data.length)
            ? "<ul>" + data.map(a => `<li>${a.title} (${a.deadline})</li>`).join("") + "</ul>"
            : "과제 없음";
    } catch (e) {
        console.error(e);
        $('assign-list').innerHTML = "❌ 과제 불러오기 오류";
    }
}

async function loadTimetableByDate() {
    const API_KEY = "28ca0f05af184e8ba231d5a949d52db2";
    const ATPT_OFCDC_SC_CODE = "J10";   // 경기도교육청
    const SD_SCHUL_CODE = "7679111";    // 봉담중학교
    const grade = 2;
    const classNum = 3;

    const input = document.getElementById("timetable-date");

    // ✅ input 값이 있으면 그걸 쓰고, 없으면 오늘 날짜
    let dateStr;
    if (input.value && input.value.trim() !== "") {
        dateStr = input.value.replace(/-/g, "");
    } else {
        const today = new Date();
        dateStr = today.getFullYear() +
            String(today.getMonth() + 1).padStart(2, '0') +
            String(today.getDate()).padStart(2, '0');
    }

    const year = dateStr.slice(0, 4);
    const month = parseInt(dateStr.slice(4, 6));
    const semester = (month <= 8) ? 1 : 2;

    const url = `https://open.neis.go.kr/hub/misTimetable?KEY=${API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&AY=${year}&SEM=${semester}&ALL_TI_YMD=${dateStr}&GRADE=${grade}&CLASS_NM=${classNum}`;

    const container = document.getElementById("timetable-grid");
    container.innerHTML = "<p>시간표 불러오는 중...</p>";

    try {
        const res = await fetch(url);
        const json = await res.json();

        container.innerHTML = "";

        if (json.misTimetable && json.misTimetable[1]) {
            const rows = json.misTimetable[1].row;
            rows.sort((a, b) => parseInt(a.PERIO) - parseInt(b.PERIO));

            rows.forEach(r => {
                const item = document.createElement("div");
                item.innerHTML = `<strong>${r.PERIO}교시</strong> : ${r.ITRT_CNTNT}`;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = "<p>❌ 시간표 데이터 없음</p>";
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>❌ 시간표 불러오기 오류</p>";
    }
}

async function loadGalleryFromHomeworks() {
    const grade = 2;
    const classNum = 3;
    const container = document.getElementById("files");

    container.innerHTML = "<p>📂 파일 불러오는 중...</p>";

    try {
        const { data, error } = await client
            .from("homeworks")
            .select("name, title, comment, file_url, grade, class_num, share_scope, uploaded_at")
            .order("uploaded_at", { ascending: false });

        if (error) throw error;

        // 🔎 필터링 (공유 범위 조건)
        const filtered = (data || []).filter(file => {
            return file.share_scope === 'all' ||
                (file.share_scope === 'grade' && file.grade === grade) ||
                (file.share_scope === 'class' && file.grade === grade && file.class_num === classNum);
        });

        if (filtered.length === 0) {
            container.innerHTML = "<p class='muted'>📂 열람 가능한 파일이 없습니다.</p>";
            return;
        }

        container.innerHTML = filtered.map(file => `
  <div class="file-card" onclick='openFileModal(${JSON.stringify(file)})'>
    <img src="${file.file_url}" alt="파일 이미지" class="file-thumb" />
    <div class="file-info">
      <div class="file-title">📄 ${file.title}</div>
      <div class="file-meta">${file.name} ・ ${file.comment}</div>
      <div class="file-scope muted">${file.share_scope === 'all' ? '전체공개' :
                file.share_scope === 'grade' ? `${file.grade}학년 전체` :
                    `${file.grade}-${file.class_num}반`
            }</div>
    </div>
  </div>
`).join("");




    } catch (e) {
        console.error(e);
        container.innerHTML = "<p class='muted'>❌ 파일 불러오기 실패</p>";
    }
}

function loadGallery() {
    loadGalleryFromHomeworks();  // homeworks 테이블에서 불러오도록 변경
}

/* 자리배치 (드래그&드롭 + 고정) */
let seatData = [];      // 학생 이름 배열
let lockedSeats = {};   // {index: true}


function renderSeats(list) {
    const container = $('seat-map');
    container.innerHTML = '';

    list.forEach((name, i) => {
        const seatDiv = document.createElement('div');
        seatDiv.className = 'seat';
        seatDiv.textContent = name;

        if (lockedSeats[i]) seatDiv.classList.add('locked');

        seatDiv.draggable = true;
        seatDiv.dataset.index = i;

        seatDiv.addEventListener("dragstart", e => {
            e.dataTransfer.setData("index", String(i));
        });
        seatDiv.addEventListener("dragover", e => e.preventDefault());
        seatDiv.addEventListener("drop", e => {
            e.preventDefault();
            const from = parseInt(e.dataTransfer.getData("index"), 10);
            const to = parseInt(e.currentTarget.dataset.index, 10);
            swapSeats(from, to);
        });

        // 우클릭 고정/해제
        seatDiv.addEventListener("contextmenu", e => {
            e.preventDefault();
            lockedSeats[i] = !lockedSeats[i];
            renderSeats(seatData);
        });

        container.appendChild(seatDiv);
    });
}

function swapSeats(from, to) {
    if (Number.isNaN(from) || Number.isNaN(to)) return;
    if (lockedSeats[from] || lockedSeats[to]) return;
    [seatData[from], seatData[to]] = [seatData[to], seatData[from]];
    renderSeats(seatData);
}

function shuffleSeats() {
    if (!seatData.length) return;
    const arr = [...seatData];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        if (!lockedSeats[i] && !lockedSeats[j]) {
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    seatData = arr;
    renderSeats(seatData);
}
window.shuffleSeats = shuffleSeats; // 버튼에서 호출 가능하도록

async function loadSeats() {
    try {
        const { data, error } = await client
            .from("class_seats")
            .select("student_number, name, seat_index, locked")
            .eq("grade", 2)
            .eq("class_num", 3)
            .order("seat_index", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            $('seat-map').innerHTML = "<p class='muted'>자리 데이터 없음</p>";
            return;
        }

        const container = $('seat-map');
        container.innerHTML = '';

        data.forEach(seat => {
            const seatDiv = document.createElement('div');
            seatDiv.className = 'seat';
            seatDiv.textContent = seat.name;

            // 고정 좌석은 색상 다르게 표시
            if (seat.locked) {
                seatDiv.classList.add('locked');
            }

            container.appendChild(seatDiv);
        });

    } catch (e) {
        console.error(e);
        $('seat-map').innerHTML = "❌ 자리 불러오기 오류";
    }
}


/* DOMContentLoaded */
document.addEventListener('DOMContentLoaded', () => {
    loadNotices();
    loadAssignments();
    loadSeats();
    loadGallery();
    loadVotePolls();
    loadClassStudentPoints();
    const input = document.getElementById("timetable-date");
    if (!input.value) {   // 사용자가 직접 선택한 값이 없을 때만 기본값 세팅
        const today = new Date();
        input.value = today.toISOString().slice(0, 10);
    }
    loadTimetableByDate();  // 기본적으로 오늘 시간표 보여주기
    loadEnglishQuiz()
});
function openModal(src) {
    document.getElementById("modal-img").src = src;
    document.getElementById("image-modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("image-modal").style.display = "none";
}

function openFileModal(file) {
    $('modal-preview').src = file.file_url;
    $('modal-title').textContent = file.title;
    $('modal-meta').textContent = `${file.name}`;
    $('modal-comment').textContent = file.comment;
    $('modal-scope').textContent =
        file.share_scope === 'all' ? '전체공개' :
            file.share_scope === 'grade' ? `${file.grade}학년 전체` :
                `${file.grade}-${file.class_num}반`;

    $('file-modal').style.display = 'flex';
}

function closeFileModal() {
    $('file-modal').style.display = 'none';
}
let currentQuizSetId = null;

async function loadEnglishQuiz() {
    try {
        const { data, error } = await client
            .from("english_quiz_questions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);

        if (error || !data.length) {
            $('quiz-questions').innerHTML = "❌ 퀴즈 없음";
            return;
        }

        currentQuizSetId = data[0].quiz_set_id;

        $('quiz-questions').innerHTML = data.map(q => `
      <div style="margin-bottom:10px;">
        <div><strong>Q${q.number}:</strong> ${q.question}</div>
        <input type="text" id="answer-${q.number}" placeholder="답변 입력" style="width:100%; padding:6px;" />
      </div>
    `).join("");

    } catch (e) {
        console.error(e);
        $('quiz-questions').innerHTML = "❌ 오류 발생";
    }
}

async function submitEnglishAnswers() {
    const name = $('student-name').value.trim();
    if (!name || !currentQuizSetId) {
        $('quiz-submit-result').textContent = "❌ 이름을 입력해주세요.";
        return;
    }

    const answers = {};
    for (let i = 1; i <= 5; i++) {
        answers[i] = $(`answer-${i}`).value.trim();
    }

    try {
        const { error } = await client.from("english_quiz_submissions").insert({
            student_name: name,
            grade: 2,
            class_num: 3,
            quiz_set_id: currentQuizSetId,
            answers
        });

        if (error) throw error;

        $('quiz-submit-result').textContent = "✅ 제출 완료!";
        $('student-name').value = "";
        for (let i = 1; i <= 5; i++) $(`answer-${i}`).value = "";
    } catch (e) {
        console.error(e);
        $('quiz-submit-result').textContent = "❌ 제출 실패";
    }
}
async function loadClassStudentPoints() {
    try {
        const { data, error } = await client
            .from("class_student_points")
            .select("student_number, name, point")
            .eq("grade", 2)
            .eq("class_num", 3)
            .order("student_number");

        if (error) throw error;

        if (!data || data.length === 0) {
            $('points-list').innerHTML = "<p class='muted'>❌ 학생 포인트 데이터 없음</p>";
            return;
        }

        let html = `
      <table class="points-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>이름</th>
            <th>포인트</th>
          </tr>
        </thead>
        <tbody>
    `;

        data.forEach(row => {
            html += `
        <tr>
          <td>${row.student_number}</td>
          <td>${row.name}</td>
          <td>⭐ ${row.point}</td>
        </tr>
      `;
        });

        html += "</tbody></table>";
        $('points-list').innerHTML = html;

    } catch (e) {
        console.error(e);
        $('points-list').innerHTML = "❌ 포인트 불러오기 오류";
    }
}
let currentVote = null;

async function loadVotePolls() {
    try {
        const { data, error } = await client
            .from("class_votes")
            .select("*")
            .eq("grade", 2)
            .eq("class_num", 3)
            .order("created_at", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            $("vote-box").innerHTML = "<p class='muted'>현재 진행 중인 투표가 없습니다.</p>";
            return;
        }

        $("vote-box").innerHTML = data.map(vote => {
            // ✅ 옵션 안전 처리
            let options = [];
            try {
                if (typeof vote.options === "string") {
                    options = JSON.parse(vote.options);
                } else {
                    options = vote.options || [];
                }
            } catch (e) {
                console.error("❌ 옵션 파싱 실패", e, vote.options);
                options = [];
            }

            return `
        <div class="vote-card" style="margin-bottom:1rem; padding:1rem; border:1px solid #e5e7eb; border-radius:0.75rem; background:#f9fafb;">
          <p style="font-weight:600; margin-bottom:0.5rem;">${vote.question}</p>
          ${options.map(opt => `
            <button class="btn" onclick="submitVote(${vote.id}, '${opt}')">${opt}</button>
          `).join(" ")}
          <div id="vote-result-${vote.id}" class="muted" style="margin-top:.5rem"></div>
        </div>
      `;
        }).join("");

    } catch (e) {
        console.error(e);
        $("vote-box").innerHTML = "❌ 투표 불러오기 실패";
    }
}


async function submitVote(voteId, choice) {
    const studentName = prompt("이름을 입력하세요");
    if (!studentName) return;

    // 🔍 이미 투표했는지 확인
    const { data: existing, error: checkError } = await client
        .from("class_vote_submissions")
        .select("id")
        .eq("vote_id", voteId)
        .eq("name", studentName)
        .maybeSingle();

    if (checkError) {
        console.error(checkError);
        alert("❌ 확인 오류");
        return;
    }

    if (existing) {
        alert("❌ 이미 투표에 참여했습니다.");
        return;
    }

    // ✅ 새로운 투표 저장
    const { error } = await client.from("class_vote_submissions").insert({
        vote_id: voteId,
        grade: 2,
        class_num: 3,
        name: studentName,
        choice
    });

    if (error) {
        console.error(error);
        alert("❌ 투표 저장 실패");
    } else {
        document.getElementById(`vote-result-${voteId}`).textContent = `내 선택: ${choice}`;
        alert("✅ 투표 완료!");
    }
}
