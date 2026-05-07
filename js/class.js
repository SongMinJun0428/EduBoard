const $ = (id) => document.getElementById(id);

function toggleMenu() { $('nav').classList.toggle('show'); }

function toggleDark() { document.body.classList.toggle('dark'); }

const client = window.supabase.createClient(
    window.EduConfig.getSupabaseURL(),
    window.EduConfig.getSupabaseKey()
);
const CLASS_GRADE = 3;
const CLASS_NUM = 2;

function clearElement(element) {
    while (element && element.firstChild) element.removeChild(element.firstChild);
}

function appendText(parent, tagName, text, className) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text == null ? "" : String(text);
    parent.appendChild(element);
    return element;
}

function safeAssetUrl(value) {
    try {
        const url = new URL(String(value || ""), window.location.href);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (e) {
        return "";
    }
}
/* 공지 */
async function loadNotices() {
    try {
        const { data, error } = await client
            .from("notices")
            .select("title, content, created_at, image_url")
            .eq("grade", CLASS_GRADE).eq("class_num", CLASS_NUM)
            .order("created_at", { ascending: false });
        if (error) throw error;

        const list = $('notice-list');
        clearElement(list);

        if (data && data.length) {
            data.forEach(n => {
                const date = new Date(n.created_at).toLocaleDateString("ko-KR", {
                    year: "numeric", month: "2-digit", day: "2-digit"
                });
                const item = document.createElement("div");
                item.className = "notice-item";

                const imageUrl = safeAssetUrl(n.image_url);
                if (imageUrl) {
                    const image = document.createElement("img");
                    image.src = imageUrl;
                    image.className = "notice-thumb";
                    image.alt = "공지 이미지";
                    image.addEventListener("click", () => openModal(imageUrl));
                    item.appendChild(image);
                }

                const body = document.createElement("div");
                body.className = "notice-body";
                appendText(body, "div", `📢 ${n.title || ""}`, "notice-title");
                appendText(body, "div", date, "notice-date");
                appendText(body, "div", n.content || "", "notice-content");
                item.appendChild(body);
                list.appendChild(item);
            });
        } else {
            appendText(list, "p", "공지 없음");
        }
    } catch (e) {
        console.error(e);
        $('notice-list').textContent = "공지 불러오기 오류";
    }
}

/* 과제 */async function loadAssignments() {
    try {
        const { data, error } = await client
            .from("assignments")
            .select("title, deadline")
            .eq("grade", CLASS_GRADE).eq("class_num", CLASS_NUM)
            .order("deadline", { ascending: true });
        if (error) throw error;

        const list = $('assign-list');
        clearElement(list);
        if (data && data.length) {
            const ul = document.createElement("ul");
            data.forEach(a => appendText(ul, "li", `${a.title || ""} (${a.deadline || ""})`));
            list.appendChild(ul);
        } else {
            list.textContent = "과제 없음";
        }
    } catch (e) {
        console.error(e);
        $('assign-list').textContent = "과제 불러오기 오류";
    }
}
async function loadTimetableByDate() {
    const API_KEY = "28ca0f05af184e8ba231d5a949d52db2";
    const ATPT_OFCDC_SC_CODE = "J10";   // 경기도교육청
    const SD_SCHUL_CODE = "7679111";    // 봉담중학교
    const grade = CLASS_GRADE;
    const classNum = CLASS_NUM;

    const input = document.getElementById("timetable-date");

    // input 값이 있으면 그걸 쓰고, 없으면 오늘 날짜
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
                const period = document.createElement("strong");
                period.textContent = `${r.PERIO}교시`;
                item.appendChild(period);
                item.appendChild(document.createTextNode(` : ${r.ITRT_CNTNT || ""}`));
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
    const grade = CLASS_GRADE;
    const classNum = CLASS_NUM;
    const container = document.getElementById("files");

    container.textContent = "파일 불러오는 중...";

    try {
        const { data, error } = await client
            .from("homeworks")
            .select("name, title, comment, file_url, grade, class_num, share_scope, uploaded_at")
            .order("uploaded_at", { ascending: false });

        if (error) throw error;

        const filtered = (data || []).filter(file => {
            return file.share_scope === 'all' ||
                (file.share_scope === 'grade' && file.grade === grade) ||
                (file.share_scope === 'class' && file.grade === grade && file.class_num === classNum);
        });

        clearElement(container);
        if (filtered.length === 0) {
            appendText(container, "p", "열람 가능한 파일이 없습니다.", "muted");
            return;
        }

        filtered.forEach(file => {
            const card = document.createElement("div");
            card.className = "file-card";
            card.addEventListener("click", () => openFileModal(file));

            const imageUrl = safeAssetUrl(file.file_url);
            if (imageUrl) {
                const image = document.createElement("img");
                image.src = imageUrl;
                image.alt = "파일 이미지";
                image.className = "file-thumb";
                card.appendChild(image);
            }

            const info = document.createElement("div");
            info.className = "file-info";
            appendText(info, "div", `📄 ${file.title || ""}`, "file-title");
            appendText(info, "div", `${file.name || ""} · ${file.comment || ""}`, "file-meta");
            const scope = file.share_scope === 'all'
                ? "전체공개"
                : file.share_scope === 'grade'
                    ? `${file.grade}학년 전체`
                    : `${file.grade}-${file.class_num}반`;
            appendText(info, "div", scope, "file-scope muted");
            card.appendChild(info);
            container.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        clearElement(container);
        appendText(container, "p", "파일 불러오기 실패", "muted");
    }
}
function loadGallery() {
    loadGalleryFromHomeworks();  // homeworks 테이블에서 불러오도록 변경
}

/* 자리배치 (드래그&드롭 + 고정) */
let seatData = [];      // 학생 이름 배열
let lockedSeats = {};   // {index: true}

function getSeatMapColumnCount() {
    const map = $('seat-map');
    if (map && window.getComputedStyle) {
        const template = window.getComputedStyle(map).gridTemplateColumns;
        if (template && template !== "none") {
            const columns = template.split(" ").filter(Boolean).length;
            if (columns > 0) return columns;
        }
    }
    return 6;
}

function getLastRowVisualOffset(index, totalSeats, columnCount) {
    if (columnCount !== 6 || totalSeats <= 30 || index < 30) {
        return 0;
    }
    return 1;
}

function applyVisualSeatPosition(element, index, totalSeats) {
    const columnCount = getSeatMapColumnCount();
    const offset = getLastRowVisualOffset(index, totalSeats, columnCount);
    if (offset) {
        const visualIndex = index + offset;
        element.style.gridColumn = String((visualIndex % columnCount) + 1);
        element.style.gridRow = String(Math.floor(visualIndex / columnCount) + 1);
    }
}

function renderSeats(list) {
    const container = $('seat-map');
    container.innerHTML = '';

    list.forEach((name, i) => {
        const seatDiv = document.createElement('div');
        seatDiv.className = 'seat';
        seatDiv.textContent = name;
        applyVisualSeatPosition(seatDiv, i, list.length);

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
            .eq("grade", CLASS_GRADE)
            .eq("class_num", CLASS_NUM)
            .order("seat_index", { ascending: true });

        if (error) throw error;

        let seats = data || [];
        if (!seats.length) {
            seats = await loadInitialSeatsFromPoints();
        }

        if (!seats.length) {
            $('seat-map').innerHTML = `<p class='muted'>${CLASS_GRADE}학년 ${CLASS_NUM}반 자리 데이터 없음</p>`;
            return;
        }

        const container = $('seat-map');
        container.innerHTML = '';

        seats.forEach((seat, index) => {
            const seatDiv = document.createElement('div');
            seatDiv.className = 'seat';
            seatDiv.textContent = seat.name;
            applyVisualSeatPosition(seatDiv, index, seats.length);

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

async function loadInitialSeatsFromPoints() {
    const { data, error } = await client
        .from("class_student_points")
        .select("student_number,name")
        .eq("grade", CLASS_GRADE)
        .eq("class_num", CLASS_NUM)
        .order("student_number");

    if (error) throw error;

    return (data || [])
        .filter(student => student.name)
        .map((student, index) => ({
            student_number: student.student_number,
            name: student.name,
            seat_index: index + 1,
            locked: false
        }));
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
    document.getElementById("modal-img").src = safeAssetUrl(src);
    document.getElementById("image-modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("image-modal").style.display = "none";
}

function openFileModal(file) {
    $('modal-preview').src = safeAssetUrl(file.file_url);
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

        const container = $('quiz-questions');
        clearElement(container);
        if (error || !data.length) {
            container.textContent = "퀴즈 없음";
            return;
        }

        currentQuizSetId = data[0].quiz_set_id;

        data.forEach(q => {
            const block = document.createElement("div");
            block.style.marginBottom = "10px";
            const question = document.createElement("div");
            const strong = document.createElement("strong");
            strong.textContent = `Q${q.number}:`;
            question.appendChild(strong);
            question.appendChild(document.createTextNode(` ${q.question || ""}`));
            block.appendChild(question);

            const input = document.createElement("input");
            input.type = "text";
            input.id = `answer-${q.number}`;
            input.placeholder = "답 입력";
            input.style.width = "100%";
            input.style.padding = "6px";
            block.appendChild(input);
            container.appendChild(block);
        });
    } catch (e) {
        console.error(e);
        $('quiz-questions').textContent = "오류 발생";
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
            grade: CLASS_GRADE,
            class_num: CLASS_NUM,
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
            .eq("grade", CLASS_GRADE)
            .eq("class_num", CLASS_NUM)
            .order("student_number");

        if (error) throw error;

        const container = $('points-list');
        clearElement(container);
        if (!data || data.length === 0) {
            appendText(container, "p", "학생 포인트 데이터 없음", "muted");
            return;
        }

        const table = document.createElement("table");
        table.className = "points-table";
        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        ["번호", "이름", "포인트"].forEach(label => appendText(headRow, "th", label));
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        data.forEach(row => {
            const tr = document.createElement("tr");
            appendText(tr, "td", row.student_number);
            appendText(tr, "td", row.name);
            appendText(tr, "td", `💰 ${row.point || 0}`);
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    } catch (e) {
        console.error(e);
        $('points-list').textContent = "포인트 불러오기 오류";
    }
}
let currentVote = null;

async function loadVotePolls() {
    try {
        const { data, error } = await client
            .from("class_votes")
            .select("*")
            .eq("grade", CLASS_GRADE)
            .eq("class_num", CLASS_NUM)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const box = $("vote-box");
        clearElement(box);
        if (!data || data.length === 0) {
            appendText(box, "p", "현재 진행 중인 투표가 없습니다.", "muted");
            return;
        }

        data.forEach(vote => {
            let options = [];
            try {
                options = typeof vote.options === "string" ? JSON.parse(vote.options) : vote.options || [];
            } catch (e) {
                console.error("옵션 파싱 실패", e, vote.options);
            }

            const card = document.createElement("div");
            card.className = "vote-card";
            card.style.marginBottom = "1rem";
            card.style.padding = "1rem";
            card.style.border = "1px solid #e5e7eb";
            card.style.borderRadius = "0.75rem";
            card.style.background = "#f9fafb";
            const question = appendText(card, "p", vote.question || "");
            question.style.fontWeight = "600";
            question.style.marginBottom = "0.5rem";

            options.forEach(opt => {
                const button = appendText(card, "button", opt, "btn");
                button.type = "button";
                button.addEventListener("click", () => submitVote(vote.id, opt));
            });

            const result = document.createElement("div");
            result.id = `vote-result-${vote.id}`;
            result.className = "muted";
            result.style.marginTop = ".5rem";
            card.appendChild(result);
            box.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        $("vote-box").textContent = "투표 불러오기 실패";
    }
}
async function submitVote(voteId, choice) {
    const studentName = prompt("이름을 입력하세요");
    if (!studentName) return;

    // 이미 투표했는지 확인
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

    // 새로운 투표 저장
    const { error } = await client.from("class_vote_submissions").insert({
        vote_id: voteId,
        grade: CLASS_GRADE,
        class_num: CLASS_NUM,
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
