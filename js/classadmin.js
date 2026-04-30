const client = window.supabase.createClient(
    window.EduConfig.getSupabaseURL(),
    window.EduConfig.getSupabaseKey()
);
const CLASS_GRADE = 3;
const CLASS_NUM = 2;

/* --------------------
   자리 관리
-------------------- */
let seatData = [];
let selectedSeatIndex = null;
let movingSeatIndex = null;
const SEAT_RULE_STORAGE_KEY = "classadmin_seat_rules_v1";
const SEAT_RULE_ALL_VALUE = "__all__";
const SEAT_RULE_TYPES = {
    together: "붙이기",
    near: "가깝게",
    apart: "떨어뜨리기",
    far: "멀리",
    veryFar: "완전 떨어뜨리기",
    avoidPreviousSeat: "지난 자리 피하기",
    avoidPreviousNeighbor: "지난 옆친구 피하기",
    front: "앞자리",
    back: "뒷자리",
    firstRow: "맨 앞줄",
    lastRow: "맨 뒷줄",
    window: "창가 자리",
    avoidWindow: "창가 피하기"
};
const SEAT_RULE_MIN_NAMES = {
    together: 2,
    near: 2,
    apart: 2,
    far: 2,
    veryFar: 2,
    avoidPreviousNeighbor: 2
};
let seatRules = loadSeatRules();

async function loadSeats() {
    const { data, error } = await client.from("class_seats")
        .select("id,student_number,name,seat_index,locked")  // ✅ name 불러옴
        .eq("grade", CLASS_GRADE).eq("class_num", CLASS_NUM)
        .order("seat_index");

    if (error) {
        console.error(error);
        showSeatMessage("자리 데이터를 불러오지 못했습니다.");
        return;
    }

    seatData = data || [];
    if (!seatData.length) {
        seatData = await loadInitialSeatsFromPoints();
    }

    populateSeatRuleStudentSelects();
    syncSeatRuleStudentFields();
    renderSeatRules();
    renderSeats();
}

async function loadInitialSeatsFromPoints() {
    const { data, error } = await client
        .from("class_student_points")
        .select("student_number,name")
        .eq("grade", CLASS_GRADE)
        .eq("class_num", CLASS_NUM)
        .order("student_number");

    if (error) {
        console.error(error);
        showSeatMessage("자리 데이터가 없고 학생 명단도 불러오지 못했습니다.");
        return [];
    }

    return (data || [])
        .filter(student => student.name)
        .map((student, index) => ({
            id: null,
            student_number: student.student_number,
            name: student.name,
            seat_index: index + 1,
            locked: false
        }));
}

function showSeatMessage(message) {
    const container = document.getElementById("seat-map");
    if (!container) return;

    container.innerHTML = `<div class="seat-empty">${message}</div>`;
    renderSeatActionBar();
}

function renderSeats() {
    const container = document.getElementById("seat-map");
    container.innerHTML = "";

    if (!seatData.length) {
        showSeatMessage(`${CLASS_GRADE}학년 ${CLASS_NUM}반 학생/자리 데이터가 없습니다.`);
        return;
    }

    const columnCount = getSeatColumnCount();
    seatData.forEach((s, i) => {
        const div = document.createElement("div");
        div.className = "seat";
        if (s.locked) div.classList.add("locked");
        if (selectedSeatIndex === i) div.classList.add("selected");
        if (movingSeatIndex === i) div.classList.add("moving");
        applyVisualSeatPosition(div, i, seatData.length, columnCount);
        
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
            clearSeatSelection(false);
            swapSeats(from, i);
        });
        div.addEventListener("click", e => {
            handleSeatTap(i);
        });
        div.addEventListener("contextmenu", async e => {
            e.preventDefault();
            await toggleSeatLock(i);
        });

        container.appendChild(div);
    });

    renderSeatActionBar();
}

function handleSeatTap(index) {
    if (movingSeatIndex !== null) {
        if (movingSeatIndex === index) {
            movingSeatIndex = null;
            selectedSeatIndex = index;
            renderSeats();
            return;
        }

        const from = movingSeatIndex;
        clearSeatSelection(false);
        swapSeats(from, index);
        return;
    }

    selectedSeatIndex = selectedSeatIndex === index ? null : index;
    renderSeats();
}

function renderSeatActionBar() {
    const bar = document.getElementById("seat-action-bar");
    if (!bar) return;

    const title = document.getElementById("seat-action-title");
    const sub = document.getElementById("seat-action-sub");
    const moveButton = bar.querySelector("[onclick='startSeatMove()']");
    const lockButton = bar.querySelector("[onclick='toggleSelectedSeatLock()']");

    const activeIndex = movingSeatIndex ?? selectedSeatIndex;
    const seat = activeIndex !== null ? seatData[activeIndex] : null;

    bar.classList.toggle("active", Boolean(seat));
    bar.classList.toggle("moving", movingSeatIndex !== null);

    if (!seat) {
        if (title) title.textContent = "좌석 선택";
        if (sub) sub.textContent = "좌석을 선택하세요";
        return;
    }

    if (title) title.textContent = `${seat.student_number || activeIndex + 1}. ${seat.name}`;
    if (sub) {
        sub.textContent = movingSeatIndex !== null
            ? "바꿀 자리를 탭하세요"
            : seat.locked
                ? "잠금 상태"
                : "작업을 선택하세요";
    }
    if (moveButton) {
        moveButton.textContent = movingSeatIndex !== null ? "이동 중" : "이동하기";
        moveButton.disabled = movingSeatIndex !== null;
    }
    if (lockButton) {
        lockButton.textContent = seat.locked ? "잠금 해제" : "잠금";
    }
}

function startSeatMove() {
    if (selectedSeatIndex === null || !seatData[selectedSeatIndex]) return;

    if (seatData[selectedSeatIndex].locked) {
        alert("잠긴 자리는 먼저 잠금 해제해야 이동할 수 있습니다.");
        return;
    }

    movingSeatIndex = selectedSeatIndex;
    renderSeats();
}

function clearSeatSelection(shouldRender = true) {
    selectedSeatIndex = null;
    movingSeatIndex = null;
    if (shouldRender) {
        renderSeats();
    }
}

function clearSeatAction() {
    clearSeatSelection();
}

async function toggleSelectedSeatLock() {
    const activeIndex = movingSeatIndex ?? selectedSeatIndex;
    if (activeIndex === null) return;
    await toggleSeatLock(activeIndex);
}

async function toggleSeatLock(index) {
    if (!seatData[index]) return;

    seatData[index].locked = !seatData[index].locked;
    if (selectedSeatIndex === index) selectedSeatIndex = null;
    if (movingSeatIndex === index) movingSeatIndex = null;

    if (seatData[index].id) {
        await client.from("class_seats")
            .update({ locked: seatData[index].locked })
            .eq("id", seatData[index].id);
    }

    renderSeats();
}

function swapSeats(from, to) {
    if (from === to) return;
    if (seatData[from].locked || seatData[to].locked) {
        alert("잠긴 자리는 이동할 수 없습니다.");
        renderSeats();
        return;
    }

    const temp = seatData[from];
    seatData[from] = seatData[to];
    seatData[to] = temp;

    // 화면 갱신
    renderSeats();

    // 방금 바뀐 두 자리만 효과
    highlightSeats([from, to]);
}

function loadSeatRules() {
    try {
        const saved = localStorage.getItem(SEAT_RULE_STORAGE_KEY);
        if (!saved) return [];

        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map(rule => ({
                id: rule.id || createSeatRuleId(),
                type: SEAT_RULE_TYPES[rule.type] ? rule.type : "together",
                all: Boolean(rule.all),
                names: Array.isArray(rule.names)
                    ? [...new Set(rule.names.filter(Boolean).map(name => String(name).trim()))]
                    : []
            }))
            .filter(rule => rule.all || rule.names.length >= getSeatRuleMinNames(rule.type));
    } catch (e) {
        console.warn("자리 규칙을 불러오지 못했습니다.", e);
        return [];
    }
}

function saveSeatRules() {
    localStorage.setItem(SEAT_RULE_STORAGE_KEY, JSON.stringify(seatRules));
}

function createSeatRuleId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }
    return `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSeatRuleMinNames(type) {
    return SEAT_RULE_MIN_NAMES[type] || 1;
}

function getSortedSeatStudents() {
    return [...seatData]
        .filter(student => student.name)
        .sort((a, b) => (a.student_number || 999) - (b.student_number || 999))
        .map(student => student.name);
}

function getSeatRuleStudentSelects() {
    return [...document.querySelectorAll(".seat-rule-student-select")];
}

function populateSeatRuleStudentSelects() {
    const selects = getSeatRuleStudentSelects();
    if (!selects.length) return;

    const names = getSortedSeatStudents();
    selects.forEach((select, index) => {
        const previousValue = select.value;
        select.innerHTML = "";

        if (index >= 1) {
            const emptyOption = document.createElement("option");
            emptyOption.value = "";
            emptyOption.textContent = "선택 안 함";
            select.appendChild(emptyOption);
        } else {
            const allOption = document.createElement("option");
            allOption.value = SEAT_RULE_ALL_VALUE;
            allOption.textContent = "전체";
            select.appendChild(allOption);
        }

        if (!names.length) {
            const emptyOption = document.createElement("option");
            emptyOption.value = "";
            emptyOption.textContent = "학생 없음";
            select.appendChild(emptyOption);
            return;
        }

        names.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });

        if (previousValue === SEAT_RULE_ALL_VALUE && index === 0) {
            select.value = previousValue;
        } else if (names.includes(previousValue) || (index >= 1 && previousValue === "")) {
            select.value = previousValue;
        } else if (index === 0 && names.length) {
            select.value = names[0];
        } else if (index >= 1) {
            select.value = "";
        }
    });
}

function syncSeatRuleStudentFields() {
    const type = document.getElementById("seat-rule-type")?.value || "together";
    const names = getSortedSeatStudents();
    const selects = getSeatRuleStudentSelects();
    const student1 = selects[0];
    const student2 = selects[1];
    if (!student1 || !student2) return;

    if (student1.value === SEAT_RULE_ALL_VALUE) {
        selects.slice(1).forEach(select => {
            select.value = "";
        });
        return;
    }

    if (getSeatRuleMinNames(type) >= 2) {
        if (!student2.value) {
            student2.value = names.find(name => name !== student1.value) || "";
        }
        return;
    }

    selects.slice(1).forEach(select => {
        select.value = "";
    });
}

function getSeatRuleTargetNames(rule) {
    return rule.all ? getSortedSeatStudents() : rule.names;
}

function getSeatRuleSignature(rule) {
    return rule.all
        ? `${rule.type}:${SEAT_RULE_ALL_VALUE}`
        : `${rule.type}:${[...rule.names].sort().join("|")}`;
}

function formatSeatRule(rule) {
    const target = rule.all ? "전체" : rule.names.join(", ");
    return `${SEAT_RULE_TYPES[rule.type] || "규칙"}: ${target}`;
}

function renderSeatRules() {
    const list = document.getElementById("seat-rule-list");
    if (!list) return;

    list.innerHTML = "";
    if (!seatRules.length) {
        const empty = document.createElement("div");
        empty.className = "seat-rule-empty";
        empty.textContent = "등록된 규칙 없음";
        list.appendChild(empty);
        return;
    }

    seatRules.forEach(rule => {
        const item = document.createElement("div");
        item.className = "seat-rule-item";

        const badge = document.createElement("span");
        badge.className = `seat-rule-badge ${rule.type}`;
        badge.textContent = SEAT_RULE_TYPES[rule.type] || "규칙";

        const names = document.createElement("span");
        names.className = "seat-rule-names";
        names.textContent = rule.all ? "전체" : rule.names.join(", ");
        if (rule.all) names.classList.add("all");

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "seat-rule-remove";
        removeButton.textContent = "삭제";
        removeButton.onclick = () => removeSeatRule(rule.id);

        item.appendChild(badge);
        item.appendChild(names);
        item.appendChild(removeButton);
        list.appendChild(item);
    });
}

function addSeatRule() {
    const type = document.getElementById("seat-rule-type")?.value || "together";
    const selectedNames = getSeatRuleStudentSelects().map(select => select.value);
    const all = selectedNames.includes(SEAT_RULE_ALL_VALUE);
    const names = all
        ? []
        : [...new Set(selectedNames.filter(Boolean))];
    const safeType = SEAT_RULE_TYPES[type] ? type : "together";
    const minNames = getSeatRuleMinNames(safeType);

    if (!all && names.length < minNames) {
        alert(minNames === 1 ? "학생을 1명 이상 선택하세요." : "학생을 2명 이상 선택하세요.");
        return;
    }

    const nextRule = {
        id: createSeatRuleId(),
        type: safeType,
        all,
        names
    };
    const signature = getSeatRuleSignature(nextRule);

    if (seatRules.some(rule => getSeatRuleSignature(rule) === signature)) {
        alert("이미 등록된 규칙입니다.");
        return;
    }

    seatRules.push(nextRule);
    saveSeatRules();
    renderSeatRules();
}

function removeSeatRule(ruleId) {
    seatRules = seatRules.filter(rule => rule.id !== ruleId);
    saveSeatRules();
    renderSeatRules();
}

function clearSeatRules() {
    if (!seatRules.length) return;
    if (!confirm("모든 자리 규칙을 삭제할까요?")) return;

    seatRules = [];
    saveSeatRules();
    renderSeatRules();
}

function getSeatColumnCount() {
    const map = document.getElementById("seat-map");
    if (map && window.getComputedStyle) {
        const template = window.getComputedStyle(map).gridTemplateColumns;
        if (template && template !== "none") {
            const columns = template.split(" ").filter(Boolean).length;
            if (columns > 0) return columns;
        }
    }

    const selected = parseInt(document.getElementById("column-count")?.value, 10);
    return Number.isInteger(selected) && selected > 0 ? selected : 6;
}

function getLastRowVisualOffset(index, totalSeats, columnCount) {
    if (columnCount !== 6 || totalSeats <= 30 || index < 30) {
        return 0;
    }
    return 1;
}

function getVisualSeatIndex(index, totalSeats, columnCount) {
    return index + getLastRowVisualOffset(index, totalSeats, columnCount);
}

function applyVisualSeatPosition(element, index, totalSeats, columnCount) {
    const visualIndex = getVisualSeatIndex(index, totalSeats, columnCount);
    if (visualIndex !== index) {
        element.style.gridColumn = String((visualIndex % columnCount) + 1);
        element.style.gridRow = String(Math.floor(visualIndex / columnCount) + 1);
    }
}

function areAdjacentIndexes(indexA, indexB, columnCount, totalSeats = seatData.length) {
    const posA = getSeatPosition(indexA, columnCount, totalSeats);
    const posB = getSeatPosition(indexB, columnCount, totalSeats);

    return Math.abs(posA.row - posB.row) + Math.abs(posA.col - posB.col) === 1;
}

function getSeatDistance(indexA, indexB, columnCount, totalSeats = seatData.length) {
    const posA = getSeatPosition(indexA, columnCount, totalSeats);
    const posB = getSeatPosition(indexB, columnCount, totalSeats);
    return Math.abs(posA.row - posB.row) + Math.abs(posA.col - posB.col);
}

function getSeatPosition(index, columnCount, totalSeats = seatData.length) {
    const visualIndex = getVisualSeatIndex(index, totalSeats, columnCount);
    return {
        row: Math.floor(visualIndex / columnCount),
        col: visualIndex % columnCount
    };
}

function getSeatRowCount(layout, columnCount) {
    return Math.max(1, Math.ceil(layout.length / columnCount));
}

function getFrontRowLimit(rowCount) {
    return Math.min(2, rowCount);
}

function getBackRowStart(rowCount) {
    return Math.max(rowCount - 2, 0);
}

function isWindowColumn(col, columnCount) {
    return col === 0 || col === columnCount - 1;
}

function areRuleMembersConnected(indexes, columnCount, totalSeats) {
    const uniqueIndexes = [...new Set(indexes)];
    const visited = new Set([uniqueIndexes[0]]);
    const stack = [uniqueIndexes[0]];

    while (stack.length) {
        const current = stack.pop();
        uniqueIndexes.forEach(next => {
            if (!visited.has(next) && areAdjacentIndexes(current, next, columnCount, totalSeats)) {
                visited.add(next);
                stack.push(next);
            }
        });
    }

    return visited.size === uniqueIndexes.length;
}

function hasAdjacentRulePair(indexes, columnCount, totalSeats) {
    for (let i = 0; i < indexes.length; i++) {
        for (let j = i + 1; j < indexes.length; j++) {
            if (areAdjacentIndexes(indexes[i], indexes[j], columnCount, totalSeats)) {
                return true;
            }
        }
    }
    return false;
}

function doAllRulePairsPass(indexes, callback) {
    for (let i = 0; i < indexes.length; i++) {
        for (let j = i + 1; j < indexes.length; j++) {
            if (!callback(indexes[i], indexes[j])) {
                return false;
            }
        }
    }
    return true;
}

function getPreviousSeatIndex(previousLayout, name) {
    return previousLayout.findIndex(student => student.name === name);
}

function getSeatRuleFailures(layout, rules = seatRules, previousLayout = seatData) {
    const columnCount = getSeatColumnCount();
    const totalSeats = layout.length;
    const rowCount = getSeatRowCount(layout, columnCount);
    const frontRowLimit = getFrontRowLimit(rowCount);
    const backRowStart = getBackRowStart(rowCount);

    return rules.filter(rule => {
        const targetNames = getSeatRuleTargetNames(rule);
        const indexes = targetNames.map(name => layout.findIndex(student => student.name === name));
        if (indexes.some(index => index === -1)) return true;

        if (rule.type === "together") {
            return !areRuleMembersConnected(indexes, columnCount, totalSeats);
        }

        if (rule.type === "near") {
            return !doAllRulePairsPass(indexes, (indexA, indexB) =>
                getSeatDistance(indexA, indexB, columnCount, totalSeats) <= 2
            );
        }

        if (rule.type === "apart") {
            return hasAdjacentRulePair(indexes, columnCount, totalSeats);
        }

        if (rule.type === "far") {
            return !doAllRulePairsPass(indexes, (indexA, indexB) =>
                getSeatDistance(indexA, indexB, columnCount, totalSeats) >= 3
            );
        }

        if (rule.type === "veryFar") {
            return !doAllRulePairsPass(indexes, (indexA, indexB) =>
                getSeatDistance(indexA, indexB, columnCount, totalSeats) >= 4
            );
        }

        if (rule.type === "avoidPreviousSeat") {
            return targetNames.some((name, nameIndex) => {
                const previousIndex = getPreviousSeatIndex(previousLayout, name);
                return previousIndex !== -1 && previousIndex === indexes[nameIndex];
            });
        }

        if (rule.type === "avoidPreviousNeighbor") {
            return targetNames.some((nameA, indexA) =>
                targetNames.some((nameB, indexB) => {
                    if (indexA >= indexB) return false;

                    const previousIndexA = getPreviousSeatIndex(previousLayout, nameA);
                    const previousIndexB = getPreviousSeatIndex(previousLayout, nameB);
                    if (previousIndexA === -1 || previousIndexB === -1) return false;

                    const wasAdjacent = areAdjacentIndexes(previousIndexA, previousIndexB, columnCount, totalSeats);
                    const isAdjacent = areAdjacentIndexes(indexes[indexA], indexes[indexB], columnCount, totalSeats);
                    return wasAdjacent && isAdjacent;
                })
            );
        }

        if (rule.type === "front") {
            return !indexes.every(index => getSeatPosition(index, columnCount, totalSeats).row < frontRowLimit);
        }

        if (rule.type === "back") {
            return !indexes.every(index => getSeatPosition(index, columnCount, totalSeats).row >= backRowStart);
        }

        if (rule.type === "firstRow") {
            return !indexes.every(index => getSeatPosition(index, columnCount, totalSeats).row === 0);
        }

        if (rule.type === "lastRow") {
            return !indexes.every(index => getSeatPosition(index, columnCount, totalSeats).row === rowCount - 1);
        }

        if (rule.type === "window") {
            return !indexes.every(index => isWindowColumn(getSeatPosition(index, columnCount, totalSeats).col, columnCount));
        }

        if (rule.type === "avoidWindow") {
            return !indexes.every(index => !isWindowColumn(getSeatPosition(index, columnCount, totalSeats).col, columnCount));
        }

        return false;
    });
}

function shuffleArray(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = result[i];
        result[i] = result[j];
        result[j] = temp;
    }
    return result;
}

function buildRandomSeatLayout() {
    const shuffledFreeSeats = shuffleArray(seatData.filter(seat => !seat.locked));
    let nextFreeIndex = 0;

    return seatData.map(seat => {
        if (seat.locked) return { ...seat };
        return { ...shuffledFreeSeats[nextFreeIndex++] };
    });
}

function createRuleAwareShuffle(previousLayout) {
    const activeRules = seatRules.filter(rule => {
        const targetNames = getSeatRuleTargetNames(rule);
        return targetNames.length >= getSeatRuleMinNames(rule.type) &&
            targetNames.every(name => seatData.some(student => student.name === name));
    });
    const maxAttempts = activeRules.length ? 3000 : 1;
    let bestLayout = null;
    let bestFailures = activeRules;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidate = buildRandomSeatLayout();
        const failures = getSeatRuleFailures(candidate, activeRules, previousLayout);

        if (!failures.length) {
            return { seats: candidate, failures: [] };
        }

        if (!bestLayout || failures.length < bestFailures.length) {
            bestLayout = candidate;
            bestFailures = failures;
        }
    }

    return {
        seats: bestLayout || buildRandomSeatLayout(),
        failures: bestFailures
    };
}


// 🔧 실제 섞기 + 기존 효과들 실행 (랜덤 셔플 핵심 로직)
function basicShuffleCore() {
    const previousLayout = seatData.map(seat => ({ ...seat }));
    const shuffleResult = createRuleAwareShuffle(previousLayout);
    const failedRules = shuffleResult.failures;
    seatData = shuffleResult.seats;

    // 새로운 배열 순서대로 seat_index 다시 부여
    seatData.forEach((s, i) => {
        s.seat_index = i + 1;
    });

    // 화면 다시 그리기
    renderSeats();

    if (failedRules.length) {
        setTimeout(() => {
            alert(`일부 자리 규칙을 만족하지 못했습니다.\n${failedRules.map(formatSeatRule).join("\n")}`);
        }, 80);
    }

    // 기존에 만들어 둔 효과들 실행 (있을 때만)
    if (typeof randomizeSeatVars === "function") {
        randomizeSeatVars();   // 좌석별 랜덤 이동량 (pop 효과용)
    }
    if (typeof animateAllSeats === "function") {
        animateAllSeats();     // 전체 흔들림/반짝임 효과
    }

    // 셔플 직후 웅장하게 "팡" 튀는 보너스 효과
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
        if (!seatData.length) {
            alert("저장할 자리 데이터가 없습니다. 학생 명단을 먼저 확인하세요.");
            return;
        }

        // 1️⃣ seat_index 재정렬
        seatData.forEach((s, i) => s.seat_index = i + 1);

        const { data: previousSeats, error: backupError } = await client
            .from("class_seats")
            .select("grade,class_num,student_number,name,seat_index,locked")
            .eq("grade", CLASS_GRADE)
            .eq("class_num", CLASS_NUM)
            .order("seat_index");

        if (backupError) throw backupError;

        // 2️⃣ 기존 데이터 삭제
        let { error: delError } = await client
            .from("class_seats")
            .delete()
            .eq("grade", CLASS_GRADE)
            .eq("class_num", CLASS_NUM);

        if (delError) throw delError;

        // 3️⃣ seatData -> insert 용으로 정리 (id 제거!)
        const insertData = seatData.map(s => ({
            grade: CLASS_GRADE,
            class_num: CLASS_NUM,
            student_number: s.student_number,
            name: s.name,
            seat_index: s.seat_index,
            locked: s.locked
        }));

        let { error: insError } = await client
            .from("class_seats")
            .insert(insertData);

        if (insError) {
            if (previousSeats?.length) {
                const { error: restoreError } = await client
                    .from("class_seats")
                    .insert(previousSeats);
                if (restoreError) {
                    console.error("Seat restore failed", restoreError);
                }
            }
            throw insError;
        }

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
        .insert([{ title, deadline, grade: CLASS_GRADE, class_num: CLASS_NUM }]);
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
        .eq("name", name).eq("grade", CLASS_GRADE).eq("class_num", CLASS_NUM);
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
        { question: q, options: opts, grade: CLASS_GRADE, class_num: CLASS_NUM }
    ]);
    alert("✅ 투표 등록 완료");
}

// 학생 목록 불러오기 → 드롭다운 채우기
async function loadPointStudents() {
    try {
        const { data, error } = await client
            .from("class_student_points")
            .select("name")
            .eq("grade", CLASS_GRADE)
            .eq("class_num", CLASS_NUM)
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
            .eq("grade", CLASS_GRADE)
            .eq("class_num", CLASS_NUM)
            .eq("name", name)
            .single();

        if (error) throw error;

        const newPoint = (data?.point || 0) + addValue;

        // 2️⃣ 새로운 포인트 저장
        const { error: updateError } = await client
            .from("class_student_points")
            .update({ point: newPoint })
            .eq("grade", CLASS_GRADE)
            .eq("class_num", CLASS_NUM)
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
    map.style.gridTemplateColumns = `repeat(${cols}, minmax(46px, 1fr))`;
}

function getExportSeatGridPosition(index) {
    const cellIndex = getVisualSeatIndex(index, seatData.length, 6);
    return {
        col: (cellIndex % 6) + 1,
        row: Math.floor(cellIndex / 6) + 1
    };
}

// ✅ 자리 배치표 이미지 다운로드 (요청하신 사진 형식으로 완벽 변환)
async function downloadSeatingChart() {
    const now = new Date();

    if (!seatData.length) {
        alert("다운로드할 자리 데이터가 없습니다.");
        return;
    }
    
    // 1️⃣ 임시 컨테이너 생성 (A4 가로 사이즈 정규화: 1414px * 1000px)
    const exportWrapper = document.createElement("div");
    exportWrapper.id = "export-capture-container";
    exportWrapper.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 1408px;
        height: 1024px;
        background: white;
        padding: 0;
        font-family: 'Malgun Gothic', 'Dotum', sans-serif;
        color: #000;
        box-sizing: border-box;
        z-index: -9999;
        overflow: hidden;
    `;

    // 2️⃣ 제목 (3학년 2반 좌석배치표)
    const title = document.createElement("h1");
    title.style.cssText = `
        position: absolute;
        top: 42px;
        left: 0;
        width: 100%;
        margin: 0;
        text-align: center;
        font-size: 52px;
        font-weight: 900;
        letter-spacing: 6px;
        font-family: 'Malgun Gothic';
    `;
    title.innerText = "3학년 2반 좌석배치표";
    exportWrapper.appendChild(title);

    // 3-1. 좌석 배치도 (HWP 양식처럼 6칸 그리드)
    const seatsArea = document.createElement("div");
    seatsArea.style.cssText = `
        position: absolute;
        top: 255px;
        left: 54px;
        display: grid;
        grid-template-columns: repeat(6, 150px);
        grid-auto-rows: 102px;
        column-gap: 50px;
        row-gap: 0;
        align-items: stretch;
    `;

    seatData.forEach((s, index) => {
        const position = getExportSeatGridPosition(index);
        const seatBox = document.createElement("div");
        seatBox.style.cssText = `
            grid-column: ${position.col};
            grid-row: ${position.row};
            border: 1px solid #000;
            width: 150px;
            height: 102px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #fff;
            box-sizing: border-box;
            overflow: hidden;
        `;

        const number = document.createElement("div");
        number.style.cssText = "font-size: 30px; line-height: 1;";
        number.textContent = s.student_number || index + 1;

        const name = document.createElement("div");
        name.style.cssText = "font-size: 34px; font-weight: 400; line-height: 1.12; text-align: center;";
        name.textContent = s.name || "";

        seatBox.appendChild(number);
        seatBox.appendChild(name);
        seatsArea.appendChild(seatBox);
    });
    exportWrapper.appendChild(seatsArea);
    
    // 3-2. 학생 명단 (우측)
    const studentListArea = document.createElement("div");
    studentListArea.style.cssText = `
        position: absolute;
        top: 52px;
        right: 56px;
        width: 140px;
    `;
    
    const table = document.createElement("table");
    table.style.cssText = "width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 17px;";
    
    // 테이블 헤더
    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr style="background: #ffd8a8;">
            <th style="border: 1px solid #000; padding: 2px; font-weight: normal; width: 50px;">번호</th>
            <th style="border: 1px solid #000; padding: 2px; font-weight: normal;">이름</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // 테이블 바디
    const tbody = document.createElement("tbody");
    const sortedList = [...seatData].sort((a, b) => (a.student_number || 0) - (b.student_number || 0));
    
    sortedList.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="border: 1px solid #000; padding: 1px; text-align: center; height: 25px;">${s.student_number || ""}</td>
            <td style="border: 1px solid #000; padding: 1px; text-align: center;">${s.name || ""}</td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    studentListArea.appendChild(table);
    exportWrapper.appendChild(studentListArea);

    // 4️⃣ 교탁 (상단 중앙: 1~6번 줄이 앞좌석)
    const desk = document.createElement("div");
    desk.style.cssText = `
        position: absolute;
        left: 423px;
        top: 145px;
        width: 392px;
        height: 72px;
        border: 2px solid #6d93e7;
        border-radius: 12px;
        background: #dcfce7;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 44px;
        font-weight: 900;
        letter-spacing: 4px;
        color: #000;
    `;
    desk.innerText = "교탁";
    exportWrapper.appendChild(desk);

    document.body.appendChild(exportWrapper);

    // 약간의 지연 시간을 주어 렌더링 보장 (브라우저가 레이아웃을 계산할 시간)
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
        const canvas = await html2canvas(exportWrapper, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false, 
            width: 1414,
            height: 1000
        });

        const link = document.createElement("a");
        link.download = `3학년2반_좌석배치표_${now.toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        
    } catch (e) {
        console.error("다운로드 실패", e);
        alert("이미지 생성 중 오류가 발생했습니다.");
    } finally {
        document.body.removeChild(exportWrapper);
    }
}




// 페이지 로드시 학생 목록 불러오기
document.addEventListener("DOMContentLoaded", () => {
    loadSeats();         // 기존 자리 불러오기
    loadPointStudents(); // 학생 목록 불러오기
});
