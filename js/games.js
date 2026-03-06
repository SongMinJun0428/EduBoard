/**
 * 🎮 EduBoard Minigames Implementation
 * 1. 4=10 Puzzle Logic
 * 2. Maze Escape (Canvas)
 * 3. Falling Blocks (Canvas)
 * 4. Reaction Time Test
 * 5. Flappy Jump (DIV-based)
 */

(function () {
    let currentGameLoop = null;

    /** 🧮 4=10 Puzzle: 숫자 생성기 */
    window.generateFourNumbers = function () {
        const numbers = [];
        for (let i = 0; i < 4; i++) {
            numbers.push(Math.floor(Math.random() * 9) + 1);
        }
        const container = document.getElementById('game-numbers');
        if (container) {
            container.innerText = numbers.join('   ');
        }
        window.currentFourNumbers = numbers; // index.js와 공유
        const feedback = document.getElementById('game-feedback');
        if (feedback) feedback.innerText = '';
        const input = document.getElementById('game-input');
        if (input) input.value = '';
    };

    /** 🧩 Maze Escape: Solvable Maze Generation (Recursive Backtracking) */
    window.initMazeGame = function (canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const size = 15; // 좀 더 조밀하게 변경
        const cellSize = canvas.width / size;
        let player = { x: 0, y: 0 };
        let goal = { x: size - 1, y: size - 1 };

        // 100% 탈출 가능한 미로 생성 (Recursive Backtracking)
        let grid = [];
        for (let y = 0; y < size; y++) {
            grid[y] = [];
            for (let x = 0; x < size; x++) {
                grid[y][x] = { x, y, visited: false, walls: { top: true, right: true, bottom: true, left: true } };
            }
        }

        function getNeighbors(cell) {
            let neighbors = [];
            if (cell.y > 0) neighbors.push(grid[cell.y - 1][cell.x]);
            if (cell.x < size - 1) neighbors.push(grid[cell.y][cell.x + 1]);
            if (cell.y < size - 1) neighbors.push(grid[cell.y + 1][cell.x]);
            if (cell.x > 0) neighbors.push(grid[cell.y][cell.x - 1]);
            return neighbors.filter(n => !n.visited);
        }

        function removeWalls(a, b) {
            let dx = a.x - b.x;
            if (dx === 1) { a.walls.left = false; b.walls.right = false; }
            else if (dx === -1) { a.walls.right = false; b.walls.left = false; }
            let dy = a.y - b.y;
            if (dy === 1) { a.walls.top = false; b.walls.bottom = false; }
            else if (dy === -1) { a.walls.bottom = false; b.walls.top = false; }
        }

        let stack = [];
        let current = grid[0][0];
        current.visited = true;
        stack.push(current);

        while (stack.length > 0) {
            let next = getNeighbors(current);
            if (next.length > 0) {
                let neighbor = next[Math.floor(Math.random() * next.length)];
                neighbor.visited = true;
                stack.push(neighbor);
                removeWalls(current, neighbor);
                current = neighbor;
            } else {
                current = stack.pop();
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    let cell = grid[y][x];
                    let px = x * cellSize;
                    let py = y * cellSize;
                    if (cell.walls.top) ctx.strokeRect(px, py, cellSize, 0);
                    if (cell.walls.right) ctx.strokeRect(px + cellSize, py, 0, cellSize);
                    if (cell.walls.bottom) ctx.strokeRect(px, py + cellSize, cellSize, 0);
                    if (cell.walls.left) ctx.strokeRect(px, py, 0, cellSize);
                }
            }

            // 도착점
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.roundRect(goal.x * cellSize + 4, goal.y * cellSize + 4, cellSize - 8, cellSize - 8, 4);
            ctx.fill();

            // 플레이어
            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.arc(player.x * cellSize + cellSize / 2, player.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
            ctx.fill();
        }

        function move(dx, dy) {
            let cell = grid[player.y][player.x];
            if (dx === 1 && !cell.walls.right) player.x++;
            else if (dx === -1 && !cell.walls.left) player.x--;
            else if (dy === 1 && !cell.walls.bottom) player.y++;
            else if (dy === -1 && !cell.walls.top) player.y--;

            if (player.x === goal.x && player.y === goal.y) {
                alert('🎉 탈출 성공! (+20포인트)');
                rewardPoints(20);
                exitMiniGame();
            }
            draw();
        }

        window.onkeydown = (e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); move(0, -1); }
            if (e.key === 'ArrowDown') { e.preventDefault(); move(0, 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1, 0); }
            if (e.key === 'ArrowRight') { e.preventDefault(); move(1, 0); }
        };

        draw();
    };

    /** 🧱 Falling Blocks */
    window.initFallingBlocks = function (canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let player = { x: canvas.width / 2 - 15, y: canvas.height - 40, w: 30, h: 30 };
        let blocks = [];
        let score = 0;
        let gameOver = false;

        function spawnBlock() {
            blocks.push({
                x: Math.random() * (canvas.width - 20),
                y: -20,
                w: 20 + Math.random() * 20,
                h: 20,
                speed: 2 + Math.random() * 3
            });
        }

        function update() {
            if (gameOver) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 플레이어
            ctx.fillStyle = '#007bff';
            ctx.fillRect(player.x, player.y, player.w, player.h);

            // 블록
            ctx.fillStyle = '#dc3545';
            blocks.forEach((b, i) => {
                b.y += b.speed;
                ctx.fillRect(b.x, b.y, b.w, b.h);

                // 충돌 감지
                if (b.x < player.x + player.w && b.x + b.w > player.x && b.y < player.y + player.h && b.y + b.h > player.y) {
                    gameOver = true;
                    alert(`Game Over! 점수: ${Math.floor(score / 10)} (+${Math.min(20, Math.floor(score / 100) + 5)}포인트)`);
                    rewardPoints(Math.min(20, Math.floor(score / 100) + 5));
                    exitMiniGame();
                }

                if (b.y > canvas.height) blocks.splice(i, 1);
            });

            score++;
            if (score % 30 === 0) spawnBlock();

            currentGameLoop = requestAnimationFrame(update);
        }

        window.onkeydown = (e) => {
            if (e.key === 'ArrowLeft' && player.x > 0) player.x -= 15;
            if (e.key === 'ArrowRight' && player.x < canvas.width - player.w) player.x += 15;
        };

        update();
    };

    /** ⚡ Reaction Test */
    window.initReactionGame = function (config) {
        const pad = document.getElementById(config.padId);
        const startBtn = document.getElementById(config.startBtnId);
        const lastEl = document.getElementById(config.lastId);
        const bestEl = document.getElementById(config.bestId);

        let startTime, endTime;
        let state = 'waiting'; // waiting, ready, clicking
        let timeout;

        function reset() {
            pad.style.background = '#f8f9fa';
            pad.innerText = '🔵 Ready';
            state = 'waiting';
            clearTimeout(timeout);
        }

        startBtn.onclick = () => {
            if (state !== 'waiting') return;
            pad.style.background = '#ffc107';
            pad.innerText = 'Wait for GREEN...';
            state = 'ready';

            const delay = 2000 + Math.random() * 3000;
            timeout = setTimeout(() => {
                pad.style.background = '#28a745';
                pad.innerText = 'CLICK NOW!';
                state = 'clicking';
                startTime = Date.now();
            }, delay);
        };

        pad.onclick = () => {
            if (state === 'ready') {
                clearTimeout(timeout);
                alert('Too early!');
                reset();
            } else if (state === 'clicking') {
                endTime = Date.now();
                const diff = endTime - startTime;
                lastEl.innerText = diff + 'ms';
                if (!window._bestRx || diff < window._bestRx) {
                    window._bestRx = diff;
                    bestEl.innerText = diff + 'ms';
                }
                alert(`Reaction Time: ${diff}ms! (+10포인트)`);
                rewardPoints(10);
                reset();
            }
        };
    };

    /** 🧠 수학 계산 왕 (Math Power) */
    window.initMathPowerGame = function () {
        const questionEl = document.getElementById('math-question');
        const timerEl = document.getElementById('math-timer');
        const feedbackEl = document.getElementById('math-feedback');
        const inputEl = document.getElementById('math-input');
        if (!questionEl || !timerEl) return;

        let level = 1;
        let currentAnswer = 0;
        let timeLeft = 10;
        let timer = null;

        function generateQuestion() {
            const op = Math.random() > 0.5 ? '+' : '-';
            let a = Math.floor(Math.random() * (10 * level)) + 1;
            let b = Math.floor(Math.random() * (10 * level)) + 1;
            if (op === '-' && a < b) [a, b] = [b, a];

            currentAnswer = op === '+' ? a + b : a - b;
            questionEl.innerText = `${a} ${op} ${b}`;
            inputEl.value = '';
            inputEl.focus();
        }

        window.checkMathPower = function () {
            const userVal = parseInt(inputEl.value);
            if (userVal === currentAnswer) {
                feedbackEl.innerText = '✅ 정답!';
                feedbackEl.style.color = '#10b981';
                level++;
                timeLeft = Math.max(3, 10 - Math.floor(level / 2)); // 레벨 오를수록 시간 단축
                generateQuestion();
            } else {
                feedbackEl.innerText = '❌ 오답!';
                feedbackEl.style.color = '#ef4444';
            }
        };

        inputEl.onkeydown = (e) => { if (e.key === 'Enter') checkMathPower(); };

        function updateTimer() {
            timeLeft--;
            timerEl.innerText = `남은 시간: ${timeLeft}초`;
            if (timeLeft <= 0) {
                clearInterval(timer);
                alert(`시간 종료! 당신의 점수: ${level - 1} (+${Math.min(10, level - 1)}포인트)`);
                rewardPoints(Math.min(10, level - 1));
                exitMiniGame();
            }
        }

        feedbackEl.innerText = '';
        generateQuestion();
        timer = setInterval(updateTimer, 1000);
        currentGameLoop = { stop: () => clearInterval(timer) };
    };

    /** 🎨 색상 맞추기 (Color Match) */
    window.initColorMatchGame = function () {
        const wordEl = document.getElementById('cm-word');
        const optionsEl = document.getElementById('cm-options');
        const timerEl = document.getElementById('cm-timer');
        if (!wordEl || !optionsEl || !timerEl) return;

        const colors = [
            { name: '빨강', value: '#ef4444' },
            { name: '파랑', value: '#3b82f6' },
            { name: '초록', value: '#10b981' },
            { name: '노랑', value: '#eab308' },
            { name: '보라', value: '#a855f7' },
            { name: '주황', value: '#f97316' }
        ];

        let score = 0;
        let timeLeft = 10;
        let timer = null;

        function nextRound() {
            const wordColor = colors[Math.floor(Math.random() * colors.length)];
            const textColor = colors[Math.floor(Math.random() * colors.length)];

            wordEl.innerText = wordColor.name;
            wordEl.style.color = textColor.value;

            optionsEl.innerHTML = '';
            const shuffled = [...colors].sort(() => Math.random() - 0.5);
            shuffled.forEach(c => {
                const btn = document.createElement('button');
                btn.innerText = c.name;
                btn.style.background = c.value;
                btn.style.color = '#fff';
                btn.style.border = 'none';
                btn.style.borderRadius = '8px';
                btn.style.padding = '12px';
                btn.style.fontWeight = '700';
                btn.style.cursor = 'pointer';
                btn.onclick = () => {
                    if (c.value === textColor.value) {
                        score++;
                        timeLeft = Math.min(10, timeLeft + 1.5);
                        nextRound();
                    } else {
                        timeLeft = Math.max(0, timeLeft - 2);
                    }
                };
                optionsEl.appendChild(btn);
            });
        }

        function updateTimer() {
            timeLeft -= 0.1;
            timerEl.innerText = `남은 시간: ${timeLeft.toFixed(1)}초`;
            if (timeLeft <= 0) {
                clearInterval(timer);
                alert(`시간 종료! 정답 횟수: ${score} (+${Math.min(10, score)}포인트)`);
                rewardPoints(Math.min(10, score));
                exitMiniGame();
            }
        }

        score = 0;
        timeLeft = 10;
        nextRound();
        timer = setInterval(updateTimer, 100);
        currentGameLoop = { stop: () => clearInterval(timer) };
    };

    /** 🔢 숫자 기억력 (Number Memory) */
    window.initNumberMemoryGame = function () {
        const displayEl = document.getElementById('nm-display');
        const inputArea = document.getElementById('nm-input-area');
        const inputEl = document.getElementById('nm-input');
        const submitBtn = document.getElementById('nm-submit');
        const feedbackEl = document.getElementById('nm-feedback');
        if (!displayEl || !inputArea) return;

        let level = 1;
        let currentNumber = '';

        function startLevel() {
            if (!document.getElementById('numberMemory-game') || document.getElementById('numberMemory-game').style.display === 'none') return;

            inputArea.style.display = 'none';
            feedbackEl.innerText = '';
            currentNumber = '';
            for (let i = 0; i < level + 2; i++) {
                currentNumber += Math.floor(Math.random() * 10);
            }

            displayEl.innerText = currentNumber;
            setTimeout(() => {
                const card = document.getElementById('numberMemory-game');
                if (!card || card.style.display === 'none') return;
                displayEl.innerText = '????';
                inputArea.style.display = 'block';
                inputEl.value = '';
                inputEl.focus();
            }, 1000 + level * 500);
        }

        submitBtn.onclick = () => {
            if (inputEl.value === currentNumber) {
                level++;
                feedbackEl.innerText = '✅ 정답입니다!';
                feedbackEl.style.color = '#10b981';
                setTimeout(startLevel, 1000);
            } else {
                alert(`오답입니다! 정답은 ${currentNumber} 였습니다.\n최종 레벨: ${level} (+${Math.min(10, level * 2)}포인트)`);
                rewardPoints(Math.min(10, level * 2));
                exitMiniGame();
            }
        };

        level = 1;
        startLevel();
        currentGameLoop = { stop: () => { } };
    };

    /** 🐭 두더지 잡기 (Whack-a-Mole) */
    window.initMoleWhackGame = function () {
        const holes = document.querySelectorAll('.mole-hole');
        const scoreEl = document.getElementById('mw-score');
        const timerEl = document.getElementById('mw-timer');
        if (!holes.length) return;

        let score = 0;
        let timeLeft = 20;
        let timer = null;
        let moleTimer = null;

        function showMole() {
            const card = document.getElementById('moleWhack-game');
            if (!card || card.style.display === 'none') return;

            holes.forEach(h => {
                h.innerHTML = '';
                h.style.background = '#cbd5e1';
            });

            const randomHole = holes[Math.floor(Math.random() * holes.length)];
            const mole = document.createElement('div');
            mole.innerText = '🐭';
            mole.style.fontSize = '3rem';
            mole.style.textAlign = 'center';
            mole.style.lineHeight = '80px';
            randomHole.appendChild(mole);
            randomHole.style.background = '#94a3b8';

            mole.onclick = (e) => {
                e.stopPropagation();
                score++;
                scoreEl.innerText = score;
                randomHole.innerHTML = '';
                randomHole.style.background = '#cbd5e1';
                clearTimeout(moleTimer);
                showMole();
            };

            moleTimer = setTimeout(showMole, Math.max(400, 1000 - score * 50));
        }

        function updateTimer() {
            timeLeft--;
            timerEl.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timer);
                clearTimeout(moleTimer);
                alert(`시간 종료! 점수: ${score} (+${Math.min(10, Math.floor(score / 2))}포인트)`);
                rewardPoints(Math.min(10, Math.floor(score / 2)));
                exitMiniGame();
            }
        }

        score = 0;
        timeLeft = 20;
        scoreEl.innerText = '0';
        timerEl.innerText = '20';
        showMole();
        timer = setInterval(updateTimer, 1000);
        currentGameLoop = { stop: () => { clearInterval(timer); clearTimeout(moleTimer); } };
    };

    /** 🐍 스네이크 (Snake Classic) */
    window.initSnakeGame = function (canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const size = 20;
        const box = canvas.width / size;

        let snake = [{ x: 10, y: 10 }];
        let food = { x: 15, y: 15 };
        let d = 'RIGHT';
        let score = 0;
        const scoreEl = document.getElementById('sn-score');

        function move() {
            const card = document.getElementById('snakeGame-game');
            if (!card || card.style.display === 'none') return;

            let head = { ...snake[0] };
            if (d === 'LEFT') head.x--;
            if (d === 'UP') head.y--;
            if (d === 'RIGHT') head.x++;
            if (d === 'DOWN') head.y++;

            // 충돌 체크
            if (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size || snake.some(s => s.x === head.x && s.y === head.y)) {
                alert(`Game Over! 점수: ${score} (+${Math.min(15, score * 1.5)}포인트)`);
                rewardPoints(Math.min(15, Math.floor(score * 1.5)));
                exitMiniGame();
                return;
            }

            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) {
                score++;
                scoreEl.innerText = score;
                food = {
                    x: Math.floor(Math.random() * size),
                    y: Math.floor(Math.random() * size)
                };
                if (score >= 10) {
                    alert('🎉 미션 완료! 10개의 사과를 먹었습니다! (+15포인트)');
                    rewardPoints(15);
                    exitMiniGame();
                    return;
                }
            } else {
                snake.pop();
            }

            // 그리기
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(food.x * box, food.y * box, box, box);

            ctx.fillStyle = '#22c55e';
            snake.forEach(s => ctx.fillRect(s.x * box, s.y * box, box, box));
        }

        window.onkeydown = (e) => {
            if (e.key === 'ArrowLeft' && d !== 'RIGHT') d = 'LEFT';
            if (e.key === 'ArrowUp' && d !== 'DOWN') d = 'UP';
            if (e.key === 'ArrowRight' && d !== 'LEFT') d = 'RIGHT';
            if (e.key === 'ArrowDown' && d !== 'UP') d = 'DOWN';
        };

        const timer = setInterval(move, 150);
        currentGameLoop = { stop: () => { clearInterval(timer); window.onkeydown = null; } };
    };

    /** 💡 번개 퀴즈 (Lighting Quiz) */
    window.initLightingQuiz = function () {
        const questionEl = document.getElementById('lq-question');
        const countEl = document.getElementById('lq-count');
        const barEl = document.getElementById('lq-bar');
        const yesBtn = document.getElementById('lq-yes');
        const noBtn = document.getElementById('lq-no');
        if (!questionEl) return;

        const quizData = [
            { q: '12 + 25 = 37', a: true },
            { q: '대한민국의 수도는 부산이다', a: false },
            { q: '물은 100도에서 끓는다', a: true },
            { q: '지구는 태양 주위를 돈다', a: true },
            { q: '3 x 9 = 24', a: false },
            { q: '사과는 채소다', a: false },
            { q: '1년은 12개월이다', a: true },
            { q: '거미는 곤충이다', a: false },
            { q: '55 - 18 = 37', a: true },
            { q: '고래는 포유류다', a: true }
        ];

        let score = 0;
        let timeLeft = 3;
        let timer = null;

        function nextQuiz() {
            const card = document.getElementById('lightingQuiz-game');
            if (!card || card.style.display === 'none') return;

            const current = quizData[Math.floor(Math.random() * quizData.length)];
            questionEl.innerText = current.q;
            timeLeft = Math.max(1, 3 - score * 0.1);

            yesBtn.onclick = () => check(true === current.a);
            noBtn.onclick = () => check(false === current.a);
        }

        function check(isCorrect) {
            if (isCorrect) {
                score++;
                countEl.innerText = score;
                nextQuiz();
            } else {
                end();
            }
        }

        function end() {
            clearInterval(timer);
            alert(`도전 종료! 연속 정답: ${score} (+${Math.min(10, score)}포인트)`);
            rewardPoints(Math.min(10, score));
            exitMiniGame();
        }

        function tick() {
            timeLeft -= 0.05;
            barEl.style.width = (timeLeft / 3 * 100) + '%';
            if (timeLeft <= 0) end();
        }

        score = 0;
        countEl.innerText = '0';
        nextQuiz();
        timer = setInterval(tick, 50);
        currentGameLoop = { stop: () => { clearInterval(timer); yesBtn.onclick = null; noBtn.onclick = null; } };
    };

    /** 🛑 모든 게임 중지 */
    window.stopAllGames = function () {
        if (currentGameLoop && typeof currentGameLoop.stop === 'function') {
            currentGameLoop.stop();
        }
        cancelAnimationFrame(currentGameLoop);
        window.onkeydown = null;
        window.onclick = null;
    };

    /** 📝 통합 로그 시스템 (Server-Side Logging) */
    window.logActivity = async function (action, target, targetType, details = {}) {
        const username = localStorage.getItem('savedUsername');
        const userId = localStorage.getItem('savedUserId');
        const email = localStorage.getItem('savedEmail');

        if (!username || !window.supabaseClient) {
            console.warn('Logging skipped: No active session or supabaseClient');
            return;
        }

        try {
            const { error } = await window.supabaseClient.from('user_activity_logs').insert({
                user_id: userId || null,
                username: username,
                email: email || null,
                action: action,
                target: target || null,
                target_type: targetType || null,
                details: {
                    ...details,
                    browser: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                },
                user_agent: navigator.userAgent
                // ip_address는 서버 사이드(Edge Functions 등)에서 처리하는 것이 일반적이나, 
                // 필요한 경우 외부 API를 통해 클라이언트에서 획득하여 details에 넣을 수 있습니다.
            });

            if (error) throw error;
            console.log(`Activity logged: ${action} - ${target}`);
        } catch (err) {
            console.error('Failed to log activity:', err);
        }
    };

    /** 🎁 보상 지급 및 검증 (세션 + 일일 제한) - 전역 함수로 격상 */
    window.rewardPoints = async function (amount) {
        if (amount <= 0) return;
        const username = localStorage.getItem('savedUsername');
        const sessionId = window.miniGameSessionId;

        if (!username || !window.supabaseClient || !sessionId) {
            console.error('Reward Failure: Missing essential data', { username, sessionId });
            return;
        }

        // 🛡️ 보안: 이 세션에서 이미 보상을 받았는지 확인 (중복 지급 방지)
        if (window._rewardedSessions && window._rewardedSessions.has(sessionId)) {
            console.warn('Reward Warning: Session already rewarded', sessionId);
            return;
        }

        try {
            // 🛑 일일 제한 체크 (KST 기준 00:00 ~ 현재)
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const kstTodayStart = new Date(utc + (9 * 60 * 60 * 1000));
            kstTodayStart.setHours(0, 0, 0, 0);
            const utcTodayStart = new Date(kstTodayStart.getTime() - (9 * 60 * 60 * 1000));

            const { count: currentCount, error: countErr } = await window.supabaseClient
                .from('user_activity_logs')
                .select('*', { count: 'exact', head: true })
                .eq('username', username)
                .eq('action', 'game_reward')
                .gte('created_at', utcTodayStart.toISOString());

            if (countErr) throw countErr;

            if (currentCount >= 10) {
                alert('오늘 받을 수 있는 최대 보상(10회)을 모두 받으셨습니다. 내일 다시 도전해 주세요!');
                return;
            }

            console.log(`Granting reward: ${amount}P for session ${sessionId}`);

            // 포인트 지급
            const { error: incErr } = await window.supabaseClient.rpc('increment_coin', {
                u_name: username,
                amount: amount
            });

            if (incErr) {
                console.warn('RPC increment_coin failed, falling back to update', incErr);
                const { data: user } = await window.supabaseClient.from('users').select('coin_balance').eq('username', username).single();
                if (user) {
                    await window.supabaseClient.from('users').update({ coin_balance: (user.coin_balance || 0) + amount }).eq('username', username);
                }
            }

            // 📝 로그 기록 (통합 로그 시스템 활용 - 꽉 채워서 저장)
            await window.logActivity('game_reward', `session_${sessionId}`, 'game', {
                amount: amount,
                session_id: sessionId,
                rewarded_at: new Date().toISOString()
            });

            // 내부 표시용 캐시 업데이트
            if (!window._rewardedSessions) window._rewardedSessions = new Set();
            window._rewardedSessions.add(sessionId);

            // UI 갱신 (잔액)
            if (typeof window.syncCoinBalance === 'function') {
                await window.syncCoinBalance();
            }

            // ⭐ 일일 보상 현황 UI 실시간 동기화 (모든 카운터 갱신)
            const { count: updatedCount } = await window.supabaseClient
                .from('user_activity_logs')
                .select('*', { count: 'exact', head: true })
                .eq('username', username)
                .eq('action', 'game_reward')
                .gte('created_at', utcTodayStart.toISOString());

            document.querySelectorAll('.reward-count-val').forEach(el => {
                el.innerText = updatedCount || 0;
            });

        } catch (e) {
            console.error('Point reward critical failure:', e);
            alert('보상 지급 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        }
    }

    /** 📊 매일 첫 로드 시 보상 현황 업데이트용 */
    window.checkDailyGameStatus = async function () {
        const username = localStorage.getItem('savedUsername');
        if (!username || !window.supabaseClient) return;

        try {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const kstTodayStart = new Date(utc + (9 * 60 * 60 * 1000));
            kstTodayStart.setHours(0, 0, 0, 0);
            const utcTodayStart = new Date(kstTodayStart.getTime() - (9 * 60 * 60 * 1000));

            const { count, error } = await window.supabaseClient
                .from('user_activity_logs')
                .select('*', { count: 'exact', head: true })
                .eq('username', username)
                .eq('action', 'game_reward')
                .gte('created_at', utcTodayStart.toISOString());

            if (error) throw error;

            document.querySelectorAll('.reward-count-val').forEach(el => {
                el.innerText = count || 0;
            });

            console.log(`Daily reward status for ${username}: ${count}/10`);
        } catch (err) {
            console.warn('Failed to check daily game status:', err);
        }
    };

})();
