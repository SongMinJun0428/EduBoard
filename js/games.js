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

        let swipeStart = null;
        canvas.onpointerdown = (e) => {
            swipeStart = { x: e.clientX, y: e.clientY };
            canvas.setPointerCapture?.(e.pointerId);
        };
        canvas.onpointerup = (e) => {
            if (!swipeStart) return;
            const dx = e.clientX - swipeStart.x;
            const dy = e.clientY - swipeStart.y;
            swipeStart = null;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
            if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0);
            else move(0, dy > 0 ? 1 : -1);
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

        const movePlayerTo = (clientX) => {
            const rect = canvas.getBoundingClientRect();
            const x = ((clientX - rect.left) / rect.width) * canvas.width;
            player.x = Math.max(0, Math.min(canvas.width - player.w, x - player.w / 2));
        };
        canvas.onpointerdown = (e) => {
            movePlayerTo(e.clientX);
            canvas.setPointerCapture?.(e.pointerId);
        };
        canvas.onpointermove = (e) => {
            if (e.buttons || e.pointerType === 'touch') movePlayerTo(e.clientX);
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

        const setDir = (next) => {
            if (next === 'LEFT' && d !== 'RIGHT') d = 'LEFT';
            if (next === 'UP' && d !== 'DOWN') d = 'UP';
            if (next === 'RIGHT' && d !== 'LEFT') d = 'RIGHT';
            if (next === 'DOWN' && d !== 'UP') d = 'DOWN';
        };

        window.onkeydown = (e) => {
            const key = e.key.toLowerCase();
            if (key === 'arrowleft' || key === 'a') { e.preventDefault(); setDir('LEFT'); }
            if (key === 'arrowup' || key === 'w') { e.preventDefault(); setDir('UP'); }
            if (key === 'arrowright' || key === 'd') { e.preventDefault(); setDir('RIGHT'); }
            if (key === 'arrowdown' || key === 's') { e.preventDefault(); setDir('DOWN'); }
        };

        let swipeStart = null;
        canvas.onpointerdown = (e) => {
            swipeStart = { x: e.clientX, y: e.clientY };
            canvas.setPointerCapture?.(e.pointerId);
        };
        canvas.onpointerup = (e) => {
            if (!swipeStart) return;
            const dx = e.clientX - swipeStart.x;
            const dy = e.clientY - swipeStart.y;
            swipeStart = null;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
            if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 'RIGHT' : 'LEFT');
            else setDir(dy > 0 ? 'DOWN' : 'UP');
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

    /** 🐦 점프 피하기 */
    window.initFlappyGame = function () {
        const board = document.getElementById('mini-flappy');
        if (!board) return;

        board.innerHTML = '';
        board.style.background = 'linear-gradient(#e0f2fe, #f8fafc)';
        board.style.cursor = 'pointer';

        const player = document.createElement('div');
        player.textContent = '◆';
        player.style.cssText = 'position:absolute; left:58px; top:142px; width:28px; height:28px; border-radius:10px; background:#facc15; color:#92400e; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:900; box-shadow:0 4px 10px rgba(146,64,14,.25); z-index:3;';

        const scoreEl = document.createElement('div');
        scoreEl.style.cssText = 'position:absolute; left:12px; top:10px; z-index:5; padding:5px 9px; border-radius:999px; background:rgba(255,255,255,.82); color:#0f172a; font-weight:900; font-size:.85rem; border:1px solid rgba(226,232,240,.9);';
        scoreEl.textContent = '점수 0';

        const hint = document.createElement('div');
        hint.style.cssText = 'position:absolute; left:50%; bottom:12px; transform:translateX(-50%); z-index:5; color:#475569; font-size:.75rem; font-weight:800; background:rgba(255,255,255,.72); padding:4px 8px; border-radius:999px;';
        hint.textContent = '스페이스 / 터치';

        const countdown = document.createElement('div');
        countdown.style.cssText = 'position:absolute; inset:0; z-index:8; display:flex; align-items:center; justify-content:center; font-size:3rem; font-weight:1000; color:#0f172a; background:rgba(255,255,255,.52); backdrop-filter:blur(2px); text-shadow:0 2px 0 #fff;';

        board.append(player, scoreEl, hint, countdown);

        let y = 142;
        let velocity = 0;
        let score = 0;
        let frame = 0;
        let ended = false;
        let running = false;
        let rafId = null;
        let countdownTimer = null;
        const pipes = [];
        const width = board.clientWidth || 320;
        const height = board.clientHeight || 320;

        function jump() {
            if (ended || !running) return;
            velocity = -5.4;
            hint.style.opacity = '0';
        }

        function addPipe() {
            const gap = 118;
            const topH = 36 + Math.random() * Math.max(60, height - gap - 72);
            const pipe = {
                x: width + 10,
                topH,
                bottomY: topH + gap,
                counted: false,
                top: document.createElement('div'),
                bottom: document.createElement('div')
            };
            pipe.top.style.cssText = 'position:absolute; top:0; width:42px; background:linear-gradient(180deg,#22c55e,#15803d); border-radius:0 0 10px 10px; box-shadow:inset 0 -4px 0 rgba(255,255,255,.18);';
            pipe.bottom.style.cssText = 'position:absolute; bottom:0; width:42px; background:linear-gradient(0deg,#22c55e,#15803d); border-radius:10px 10px 0 0; box-shadow:inset 0 4px 0 rgba(255,255,255,.18);';
            pipe.top.style.height = `${topH}px`;
            pipe.bottom.style.height = `${height - pipe.bottomY}px`;
            board.append(pipe.top, pipe.bottom);
            pipes.push(pipe);
        }

        function hit(a, b) {
            return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        }

        function finish() {
            if (ended) return;
            ended = true;
            clearInterval(countdownTimer);
            cancelAnimationFrame(rafId);
            const reward = Math.min(10, Math.max(1, Math.floor(score / 2)));
            if (typeof window.rewardPoints === 'function') window.rewardPoints(reward);
            alert(`게임 종료! 점수: ${score} (+${reward}포인트)`);
            if (typeof window.exitMiniGame === 'function') window.exitMiniGame();
        }

        function loop() {
            if (ended || !running) return;
            frame++;
            velocity += 0.28;
            y += velocity;
            player.style.top = `${y}px`;

            if (frame % 104 === 0) addPipe();

            const playerBox = {
                left: 58,
                right: 86,
                top: y,
                bottom: y + 28
            };

            if (playerBox.top < 0 || playerBox.bottom > height) {
                finish();
                return;
            }

            for (const pipe of pipes) {
                pipe.x -= 1.85 + Math.min(1.15, score * 0.04);
                pipe.top.style.left = `${pipe.x}px`;
                pipe.bottom.style.left = `${pipe.x}px`;

                const topBox = { left: pipe.x, right: pipe.x + 42, top: 0, bottom: pipe.topH };
                const bottomBox = { left: pipe.x, right: pipe.x + 42, top: pipe.bottomY, bottom: height };
                if (hit(playerBox, topBox) || hit(playerBox, bottomBox)) {
                    finish();
                    return;
                }

                if (!pipe.counted && pipe.x + 42 < 58) {
                    pipe.counted = true;
                    score++;
                    scoreEl.textContent = `점수 ${score}`;
                }
            }

            while (pipes.length && pipes[0].x < -52) {
                const old = pipes.shift();
                old.top.remove();
                old.bottom.remove();
            }

            rafId = requestAnimationFrame(loop);
        }

        board.onclick = jump;
        board.onpointerdown = (e) => {
            e.preventDefault();
            jump();
        };
        window.onkeydown = (e) => {
            if (e.code === 'Space' || e.key === 'ArrowUp') {
                e.preventDefault();
                jump();
            }
        };

        function startCountdown() {
            let count = 3;
            countdown.textContent = String(count);
            countdownTimer = setInterval(() => {
                count -= 1;
                if (count > 0) {
                    countdown.textContent = String(count);
                    return;
                }

                clearInterval(countdownTimer);
                countdown.textContent = 'START';
                setTimeout(() => {
                    if (ended) return;
                    countdown.remove();
                    running = true;
                    addPipe();
                    rafId = requestAnimationFrame(loop);
                }, 320);
            }, 700);
        }

        currentGameLoop = {
            stop: () => {
                ended = true;
                running = false;
                clearInterval(countdownTimer);
                cancelAnimationFrame(rafId);
                board.onclick = null;
                board.onpointerdown = null;
            }
        };
        startCountdown();
    };

    /** 🛑 모든 게임 중지 */
    window.stopAllGames = function () {
        if (currentGameLoop && typeof currentGameLoop.stop === 'function') {
            currentGameLoop.stop();
        } else if (currentGameLoop) {
            cancelAnimationFrame(currentGameLoop);
        }
        currentGameLoop = null;
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

    window.completeMiniGame = async function (gameType, amount, label = '미니게임 완료') {
        const reward = Math.max(0, Math.floor(Number(amount) || 0));
        if (reward > 0 && typeof window.rewardPoints === 'function') {
            await window.rewardPoints(reward);
        }
        alert(`🎉 ${label}! ${reward > 0 ? `+${reward}포인트` : '기록이 저장되었습니다.'}`);
        if (typeof window.exitMiniGame === 'function') window.exitMiniGame();
    };

    function getKstRewardWindow() {
        const now = new Date();
        const parts = Object.fromEntries(
            new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).formatToParts(now).map(part => [part.type, part.value])
        );
        const year = Number(parts.year);
        const month = Number(parts.month);
        const day = Number(parts.day);
        return {
            dateKey: `${parts.year}-${parts.month}-${parts.day}`,
            startIso: new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0)).toISOString()
        };
    };

    function getLocalRewardKey(username) {
        return `eduBoard_gameRewardCount:${username}:${getKstRewardWindow().dateKey}`;
    }

    function getLocalRewardCount(username) {
        return Math.max(0, Number(localStorage.getItem(getLocalRewardKey(username)) || 0));
    }

    function setLocalRewardCount(username, count) {
        localStorage.setItem(getLocalRewardKey(username), String(Math.max(0, Math.min(10, Number(count) || 0))));
    }

    async function fetchServerRewardCount(username) {
        if (!username || !window.supabaseClient) return 0;
        const { startIso } = getKstRewardWindow();
        const { count, error } = await window.supabaseClient
            .from('user_activity_logs')
            .select('*', { count: 'exact', head: true })
            .eq('username', username)
            .eq('action', 'game_reward')
            .gte('created_at', startIso);
        if (error) throw error;
        return Number(count || 0);
    }

    async function insertGameRewardLog(username, sessionId, amount) {
        if (!window.supabaseClient) return false;
        const payload = {
            username,
            action: 'game_reward',
            target: `session_${sessionId}`,
            target_type: 'game',
            details: {
                amount,
                session_id: sessionId,
                rewarded_at: new Date().toISOString()
            },
            user_agent: navigator.userAgent
        };

        const { error } = await window.supabaseClient.from('user_activity_logs').insert(payload);
        if (!error) return true;

        console.warn('Game reward log insert failed, trying string details fallback:', error);
        const fallback = { ...payload, details: JSON.stringify(payload.details) };
        const { error: fallbackError } = await window.supabaseClient.from('user_activity_logs').insert(fallback);
        if (fallbackError) {
            console.warn('Game reward log fallback failed:', fallbackError);
            return false;
        }
        return true;
    }

    window.updateGameRewardCounters = function (count) {
        const safeCount = Math.max(0, Math.min(10, Number(count) || 0));
        document.querySelectorAll('.reward-count-val').forEach(el => {
            el.innerText = safeCount;
        });
    };

    window.getEffectiveDailyGameRewardCount = async function (username = localStorage.getItem('savedUsername')) {
        const cleanUsername = String(username || '').trim();
        if (!cleanUsername) return 0;
        try {
            const serverCount = await fetchServerRewardCount(cleanUsername);
            const effective = Math.max(serverCount, getLocalRewardCount(cleanUsername));
            if (effective !== getLocalRewardCount(cleanUsername)) {
                setLocalRewardCount(cleanUsername, effective);
            }
            return effective;
        } catch (err) {
            console.warn('Server reward count unavailable, using local count:', err);
            return getLocalRewardCount(cleanUsername);
        }
    };

    function isUuidLike(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
    }

    async function getCoinUserRow(username) {
        const cleanUsername = String(username || localStorage.getItem('savedUsername') || '').trim();
        if (!cleanUsername || !window.supabaseClient) return null;

        const { data, error } = await window.supabaseClient
            .from('users')
            .select('username, coin_balance, auth_user_id')
            .eq('username', cleanUsername)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async function refreshCoinBalanceFromDb(username) {
        const row = await getCoinUserRow(username);
        const balance = Number(row?.coin_balance || 0);
        window.currentUserCoin = balance;
        if (typeof window.updateCoinDisplays === 'function') {
            window.updateCoinDisplays(balance);
        } else {
            ['coin-balance', 'shop-coin-balance'].forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                if (window.__updateSecurityValue) window.__updateSecurityValue(id, balance.toLocaleString());
                else el.textContent = balance.toLocaleString();
            });
        }
        return balance;
    }

    window.adjustUserCoinBalance = async function (delta, options = {}) {
        const amount = Math.trunc(Number(delta) || 0);
        const username = String(options.username || localStorage.getItem('savedUsername') || '').trim();
        if (!username || !window.supabaseClient) {
            throw new Error('포인트를 변경할 로그인 정보가 없습니다.');
        }

        const before = await getCoinUserRow(username);
        if (!before) throw new Error('포인트를 변경할 사용자 정보를 찾지 못했습니다.');

        const current = Number(before.coin_balance || 0);
        if (amount === 0) {
            return { balance: current, method: 'noop' };
        }

        const authTarget = before.auth_user_id || localStorage.getItem('savedAuthUserId') || localStorage.getItem('savedUserId');
        let rpcError = null;
        if (isUuidLike(authTarget)) {
            const { error } = await window.supabaseClient.rpc('increment_coin', {
                x: amount,
                target_user_id: authTarget
            });
            rpcError = error || null;
            if (!error) {
                const balance = await refreshCoinBalanceFromDb(username);
                return { balance, method: 'rpc' };
            }
        }

        if (rpcError) {
            console.warn('increment_coin RPC failed, using users.coin_balance update:', rpcError);
        }

        const nextBalance = Math.max(0, current + amount);
        const { data: updated, error: updateError } = await window.supabaseClient
            .from('users')
            .update({ coin_balance: nextBalance })
            .eq('username', username)
            .select('coin_balance')
            .maybeSingle();

        if (updateError) throw updateError;
        if (!updated) throw new Error('포인트 업데이트 결과를 확인하지 못했습니다.');

        const balance = Number(updated.coin_balance || nextBalance);
        window.currentUserCoin = balance;
        if (typeof window.updateCoinDisplays === 'function') {
            window.updateCoinDisplays(balance);
        } else {
            ['coin-balance', 'shop-coin-balance'].forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                if (window.__updateSecurityValue) window.__updateSecurityValue(id, balance.toLocaleString());
                else el.textContent = balance.toLocaleString();
            });
        }
        return { balance, method: 'direct' };
    };

    /** 🎁 보상 지급 및 검증 (세션 + 일일 제한) - 전역 함수로 격상 */
    window.rewardPoints = async function (amount) {
        amount = Math.max(0, Math.floor(Number(amount) || 0));
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
            const currentCount = await window.getEffectiveDailyGameRewardCount(username);
            if (currentCount >= 10) {
                alert('오늘 받을 수 있는 최대 보상(10회)을 모두 받으셨습니다. 내일 다시 도전해 주세요!');
                window.updateGameRewardCounters(currentCount);
                return;
            }

            console.log(`Granting reward: ${amount}P for session ${sessionId}`);

            await window.adjustUserCoinBalance(amount, { username, reason: 'game_reward' });

            const logged = await insertGameRewardLog(username, sessionId, amount);
            if (!logged && typeof window.logActivity === 'function') {
                await window.logActivity('game_reward', `session_${sessionId}`, 'game', {
                    amount,
                    session_id: sessionId,
                    rewarded_at: new Date().toISOString()
                });
            }

            // 내부 표시용 캐시 업데이트
            if (!window._rewardedSessions) window._rewardedSessions = new Set();
            window._rewardedSessions.add(sessionId);
            const updatedCount = Math.min(10, currentCount + 1);
            setLocalRewardCount(username, updatedCount);
            window.updateGameRewardCounters(updatedCount);

            // UI 갱신 (잔액)
            if (typeof window.syncCoinBalance === 'function') {
                await window.syncCoinBalance();
            }
            if (typeof window.syncStatsAndRender === 'function') {
                await window.syncStatsAndRender();
            }
            if (typeof window.showRewardToast === 'function') {
                window.showRewardToast(`포인트 +${amount.toLocaleString()}P를 받았습니다. 오늘 보상 ${updatedCount}/10회`);
            }

        } catch (e) {
            console.error('Point reward critical failure:', e);
            alert('보상 지급 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        }
    };

    /** 📊 매일 첫 로드 시 보상 현황 업데이트용 */
    window.checkDailyGameStatus = async function () {
        const username = localStorage.getItem('savedUsername');
        if (!username) return;

        try {
            const count = await window.getEffectiveDailyGameRewardCount(username);
            window.updateGameRewardCounters(count);
            console.log(`Daily reward status for ${username}: ${count}/10`);
        } catch (err) {
            console.warn('Failed to check daily game status:', err);
        }
    };

    /** 🃏 Memory Match: 카드 뒤집기 게임 */
    window.initMemoryMatchGame = function () {
        const grid = document.getElementById('mm-grid');
        if (!grid) return;
        grid.innerHTML = '';
        
        const symbols = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍'];
        const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
        
        let flipped = [];
        let matched = 0;
        let busy = false;

        deck.forEach((symbol, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.style = `
                height: 80px; background: #fff; border-radius: 12px; border: 2px solid #e2e8f0;
                display: flex; align-items: center; justify-content: center; font-size: 1.8rem;
                cursor: pointer; transition: transform 0.3s;
            `;
            card.dataset.symbol = symbol;
            card.innerText = '❓';

            card.onclick = () => {
                if (busy || card.classList.contains('flipped') || card.classList.contains('matched')) return;
                
                card.innerText = symbol;
                card.style.background = '#eef2ff';
                card.classList.add('flipped');
                flipped.push(card);

                if (flipped.length === 2) {
                    busy = true;
                    const [c1, c2] = flipped;
                    if (c1.dataset.symbol === c2.dataset.symbol) {
                        c1.classList.add('matched');
                        c2.classList.add('matched');
                        c1.style.background = '#dcfce7';
                        c2.style.background = '#dcfce7';
                        matched++;
                        flipped = [];
                        busy = false;
                        if (matched === symbols.length) {
                            setTimeout(() => {
                                if (typeof window.completeMiniGame === 'function') {
                                    window.completeMiniGame('memoryMatch', 15);
                                }
                            }, 500);
                        }
                    } else {
                        setTimeout(() => {
                            c1.innerText = '❓';
                            c2.innerText = '❓';
                            c1.style.background = '#fff';
                            c2.style.background = '#fff';
                            c1.classList.remove('flipped');
                            c2.classList.remove('flipped');
                            flipped = [];
                            busy = false;
                        }, 800);
                    }
                }
            };
            grid.appendChild(card);
        });
    };

})();
