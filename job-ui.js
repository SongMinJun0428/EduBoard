/* ==========================================================================
   Additional View Styles (injected via JS or inline)
   ========================================================================== */
const UI = {
    container: document.getElementById('main-content'),

    renderView(html, isFade = true, onComplete = null) {
        if (!isFade) {
            this.container.innerHTML = html;
            if (onComplete) onComplete();
            return;
        }

        const oldContent = this.container.innerHTML;
        // If it's just the initial loader, replace it immediately to avoid race conditions
        if (!oldContent || oldContent.includes('class="loader"')) {
            this.container.innerHTML = html;
            const children = Array.from(this.container.children);
            children.forEach(child => child.classList.add('fade-in-up'));
            if (onComplete) onComplete();
            return;
        }

        // Apply slide-out-fade to existing content
        const currentView = this.container.firstChild;
        if (currentView && currentView.classList) {
            currentView.classList.add('slide-out-left');
        }

        setTimeout(() => {
            this.container.innerHTML = html;
            const newView = this.container.firstChild;
            if (newView && newView.classList) {
                newView.classList.add('slide-in-right');
            }
            if (onComplete) onComplete();
        }, 150);
    },

    renderStartScreen(onStart) {
        const html = `
            <div class="view active start-screen" style="text-align: center; padding: 60px 20px;">
                <h1 style="font-size: 2.5rem; margin-bottom: 20px;" class="delay-100">나를 찾아가는 진로 밸런스 게임</h1>
                <p style="font-size: 1.2rem; margin-bottom: 40px; color: var(--text-muted);" class="delay-200">
                    단순히 재미로 끝나는 것이 아닌,<br>
                    선택과 이유를 통해 나의 가치관과 일하는 방식을 깊이 이해하는 시간입니다.
                </p>
                <div class="delay-300">
                    <button id="btn-start" class="btn btn-primary" style="font-size: 1.3rem; padding: 16px 40px;">시작하기</button>
                </div>
            </div>
        `;
        this.renderView(html, true, () => {
            const btn = document.getElementById('btn-start');
            if (btn) btn.addEventListener('click', onStart);
        });
    },

    renderConfigScreen(onSave) {
        const html = `
            <div class="view active config-screen" style="padding: 60px 40px 40px 40px; display:flex; flex-direction:column; min-height:100%;">
                <h2 style="margin-bottom: 30px; text-align:center; color: var(--primary-color);" class="delay-100">기본 정보 설정</h2>
                <div class="form-group delay-200" style="margin-bottom: 30px;">
                    <label style="display:block; margin-bottom: 10px; font-weight:600;">이름 (또는 닉네임)</label>
                    <input type="text" id="cfg-name" placeholder="이름을 입력하세요" style="width: 100%; padding: 12px; border-radius:8px; border: 1px solid var(--border-glass); background: rgba(255,255,255,0.5);">
                </div>
                <div class="form-group delay-300" style="margin-bottom: 30px;">
                    <label style="display:block; margin-bottom: 10px; font-weight:600;">학년/소속</label>
                    <select id="cfg-grade" style="width: 100%; padding: 12px; border-radius:8px; border: 1px solid var(--border-glass); background: rgba(255,255,255,0.5);">
                        <option value="초등">초등학생</option>
                        <option value="중등">중학생</option>
                        <option value="고등">고등학생</option>
                        <option value="기기타">기타</option>
                        <option value="테스트">💡 기능 테스트 (데이터 자동 채우기)</option>
                    </select>
                </div>
                <div class="form-group delay-400" style="margin-bottom: 25px;">
                    <label style="display:block; margin-bottom: 12px; font-weight:700; color:var(--primary-color); font-size: 1.1rem;">✨ AI(Gemini) 무료 분석 엔진 탑재 완료</label>
                    <div style="background: rgba(255,255,255,0.6); padding: 15px; border-radius: 12px; border: 1px solid var(--border-glass);">
                        <p style="font-size: 0.95rem; color:var(--text-main); line-height: 1.6; margin:0;">
                            구글 제미나이 1.5 무료 키가 엔진에 내장되었습니다.<br>
                            결제나 인증 없이 전 문항 AI 에세이 분석을 바로 이용할 수 있습니다.
                        </p>
                    </div>
                    <input type="hidden" id="cfg-api-provider" value="gemini">
                    <input type="hidden" id="cfg-api" value="hardcoded">
                </div>
                <div style="margin-top: 40px; text-align: right;" class="delay-400">
                    <button id="btn-save-cfg" class="btn btn-primary" style="padding: 12px 30px; font-size: 1.1rem; font-weight: 600; border-radius: 8px;">다음 단계로</button>
                </div>
            </div>
        `;
        this.renderView(html, true, () => {
            const btn = document.getElementById('btn-save-cfg');
            if (btn) {
                btn.addEventListener('click', () => {
                    const name = document.getElementById('cfg-name').value.trim();
                    if (!name) {
                        alert("성함을 입력해 주세요! 본인 확인을 위해 필요합니다.");
                        document.getElementById('cfg-name').focus();
                        return;
                    }
                    const grade = document.getElementById('cfg-grade').value;
                    const provider = document.getElementById('cfg-api-provider').value;
                    const api = document.getElementById('cfg-api').value.trim();
                    onSave(name, grade, 'short', 'solo', api, provider);
                });
            }
        });
    },

    renderCategoryScreen(categories, currentIndex, onNext) {
        const cat = categories[currentIndex];
        const html = `
            <div class="view active category-screen" style="padding: 50px 30px; text-align:center;">
                <h3 style="color: var(--primary-color); text-transform:uppercase; letter-spacing: 2px; font-size: 1rem; margin-bottom: 10px;" class="delay-100">
                    STEP ${currentIndex + 1} / ${categories.length}
                </h3>
                <h2 style="font-size: 2.2rem; margin-bottom: 15px;" class="delay-200">${cat.title}</h2>
                <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 40px;" class="delay-300">${cat.description}</p>
                <div class="delay-400">
                    <button id="btn-start-cat" class="btn btn-primary">질문 시작하기</button>
                </div>
            </div>
        `;
        this.renderView(html, true, () => {
            const btn = document.getElementById('btn-start-cat');
            if (btn) btn.addEventListener('click', onNext);
        });
    },

    renderQuestionScreen(category, question, progress, onAnswer) {
        const pct = (progress.current / progress.total) * 100;
        const followUps = question.followUp.map(f => `<span style="font-size:0.85rem; background:var(--primary-color-soft); color:var(--primary-color); padding:4px 10px; border-radius:15px; margin-right:5px; margin-bottom:5px; display:inline-block;">💡 ${f}</span>`).join('');

        const html = `
            <div class="view active question-screen" style="padding: 20px 20px; text-align:center; display:flex; flex-direction:column; justify-content:flex-start; min-height:100%; overflow-y:auto; gap: 20px;">
                <!-- 1. Header Section -->
                <div style="flex-shrink:0;">
                    <div style="width: 100%; height: 6px; background: #f0f0f0; border-radius: 10px; margin-bottom: 20px; overflow:hidden;">
                        <div style="width: ${pct}%; height: 100%; background: var(--grad-primary); transition: width 0.5s ease;"></div>
                    </div>
                    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <span style="font-weight: 800; color: var(--primary-color); font-size: 0.9rem;">${category.title}</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">질문 ${progress.current} / ${progress.total}</span>
                    </div>
                    <h2 style="font-size: 1.6rem; margin-bottom: 5px; line-height: 1.3; word-break: keep-all;">${question.title}</h2>
                </div>

                <!-- 2. Interaction Section -->
                <div style="flex:1; display:flex; flex-direction:column; justify-content: center;">
                    <p id="selection-guide" style="font-size: 0.95rem; font-weight: 800; color: var(--primary-color); margin-bottom: 15px; text-align:center; opacity: 0.8;">
                        두 가지 가치 중 당신의 마음이 가는 곳은?
                    </p>

                    <!-- Options Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; align-items: start;">
                        <div id="opt-a" class="btn btn-secondary hover-lift question-card" style="padding: 22px 15px; flex-direction:column; height: auto; text-align:center; border-radius: 16px; border: 2px solid transparent; cursor: pointer; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                            <div style="font-size: 0.7rem; opacity: 0.4; margin-bottom: 4px; font-weight: 700;">OPTION A</div>
                            <div style="font-size: 1.2rem; font-weight: 900; line-height: 1.2; color: var(--text-main);">${question.optionA}</div>
                            <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 6px; font-weight: 500; word-break: keep-all;">${question.descA}</div>
                        </div>
                        <div id="opt-b" class="btn btn-secondary hover-lift question-card" style="padding: 22px 15px; flex-direction:column; height: auto; text-align:center; border-radius: 16px; border: 2px solid transparent; cursor: pointer; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                            <div style="font-size: 0.7rem; opacity: 0.4; margin-bottom: 4px; font-weight: 700;">OPTION B</div>
                            <div style="font-size: 1.2rem; font-weight: 900; line-height: 1.2; color: var(--text-main);">${question.optionB}</div>
                            <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 6px; font-weight: 500; word-break: keep-all;">${question.descB}</div>
                        </div>
                    </div>
                </div>

                <!-- 3. Footer Section -->
                <div style="flex-shrink:0; padding-top: 15px; border-top: 1px solid #f0f0f0; margin-top: auto;">
                    <button id="btn-next-q" class="btn btn-primary" style="width:100%; padding: 16px; margin-bottom: 20px; font-size: 1.1rem; border-radius: 14px; opacity: 0; pointer-events: none; transition: all 0.3s ease;">다음 질문으로 넘어가기</button>
                    <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; opacity: 0.7;">스스로에게 던져보는 질문:</div>
                    <div style="display:flex; flex-wrap: wrap; gap: 6px; justify-content: center;">${followUps}</div>
                </div>
            </div>
        `;
        
        this.renderView(html, true, () => {
            let currentSelected = null;
            const btnA = document.getElementById('opt-a');
            const btnB = document.getElementById('opt-b');
            const btnNext = document.getElementById('btn-next-q');
            const guide = document.getElementById('selection-guide');

            const selectChoice = (choice) => {
                currentSelected = choice;
                [btnA, btnB].forEach(b => {
                    b.classList.remove('active-card');
                    b.style.borderColor = 'transparent';
                    b.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)';
                });

                const target = choice === 'A' ? btnA : btnB;
                target.classList.add('active-card');
                target.style.borderColor = 'var(--primary-color)';
                target.style.boxShadow = '0 8px 25px rgba(99,102,241,0.2)';

                btnNext.style.opacity = '1';
                btnNext.style.pointerEvents = 'auto';
                guide.innerHTML = "선택을 완료했다면 아래 '다음 질문' 버튼을 눌러주세요!";
                guide.style.color = "var(--primary-color)";
            };

            if (btnA) btnA.addEventListener('click', () => selectChoice('A'));
            if (btnB) btnB.addEventListener('click', () => selectChoice('B'));

            if (btnNext) {
                btnNext.addEventListener('click', () => {
                    if (!currentSelected) return;
                    btnNext.disabled = true;
                    onAnswer(currentSelected, currentSelected === 'A' ? question.tagsA : question.tagsB, "(이유 미작성)");
                });
            }
        });
    },

    renderIntermediateSummary(category, topTags, state, last5Questions, onNext) {
        const text = category.summaryTemplate.replace("[TOP_TAGS]", topTags.join(', ') || "다양함");
        
        // Build the 5 choices HTML from the passed context
        const choicesHtml = last5Questions.map(q => {
            const ans = state.answers[q.id];
            const chosen = ans ? (ans.selectedOption === 'A' ? q.optionA : q.optionB) : "미선택";
            const catInfo = CATEGORIES.find(c => c.id === q.category) || { title: q.category };
            return `
                <div style="text-align:left; background: #fff; padding: 12px; border-radius: 12px; margin-bottom: 8px; font-size: 0.85rem; border: 1px solid #eee; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                    <div style="font-weight: 700; color:var(--primary-color); margin-bottom:3px; font-size: 0.7rem; opacity: 0.8;">[${catInfo.title}]</div>
                    <div style="line-height:1.4;">
                        <span style="font-weight:800; color:var(--text-main); opacity: 0.6;">Q.</span> ${q.title}
                        <div style="color:var(--primary-color); font-weight:800; margin-top:3px; font-size:0.95rem;">👉 선택: ${chosen}</div>
                    </div>
                </div>
            `;
        }).join('');

        const html = `
            <div class="view active intermediate-screen" style="padding: 40px 20px; text-align:center; display:flex; flex-direction:column; justify-content:flex-start; min-height:100%; overflow-y:auto;">
                <h3 style="color: var(--primary-color); margin-bottom: 15px;" class="delay-100">[ ${category.title} ] 요약</h3>
                <h2 style="font-size: 1.6rem; margin-bottom: 20px; line-height: 1.4;" class="delay-200">${text}</h2>
                
                <div class="delay-300" style="text-align: left; margin-bottom: 20px;">
                    <p style="font-weight: 800; color: var(--text-main); margin-bottom: 10px; text-align:center;">당신이 방금 전 선택한 5가지 가치입니다.</p>
                    <div style="max-width: 600px; margin: 0 auto; margin-bottom: 20px;">
                        ${choicesHtml}
                    </div>
                </div>

                <div class="delay-400" style="max-width: 600px; margin: 0 auto; width: 100%; text-align: left; background: #ffffff; padding: 20px; border-radius: 20px; border: 2px solid var(--primary-color); box-shadow: 0 10px 30px rgba(99, 102, 241, 0.1);">
                    <label style="display:block; margin-bottom: 10px; font-size: 1rem; font-weight: 800; color: var(--text-main);">위 5가지 가치를 선택한 결정적인 이유는 무엇인가요?</label>
                    <textarea id="cat-reason-input" rows="3" placeholder="예: 평소에 사람들과 소통하는 것을 좋아하고, 도전적인 목표를 달성할 때 보람을 느끼기 때문입니다." style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; resize:none; font-family:inherit; font-size: 0.95rem; line-height: 1.5; color: var(--text-main); outline:none;"></textarea>
                    
                    <div style="display:flex; flex-direction: column; align-items: center; margin-top: 15px;">
                        <span style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 15px;">※ 이 답변은 최종 AI 분석 리포트의 핵심 자료가 됩니다!</span>
                        <button id="btn-next-cat" class="btn btn-primary" style="padding: 12px 30px; font-size: 1.05rem; width: 100%; max-width: 300px;">다음 라운드로 넘어가기 <i class="fas fa-arrow-right"></i></button>
                    </div>
                </div>
            </div>
        `;
        this.renderView(html, true, () => {
            const btn = document.getElementById('btn-next-cat');
            const textarea = document.getElementById('cat-reason-input');
            
            if (btn) btn.disabled = true; // Initially disabled

            if (textarea) {
                textarea.addEventListener('input', (e) => {
                    const val = e.target.value.trim();
                    if (val.length >= 10) {
                        btn.disabled = false;
                        btn.style.opacity = '1';
                    } else {
                        btn.disabled = true;
                        btn.style.opacity = '0.5';
                    }
                });
            }

            if (btn) {
                btn.addEventListener('click', () => {
                    const reason = textarea.value.trim();
                    if (reason.length < 10) {
                        alert("분석을 위해 최소 10자 이상의 이유를 입력해 주세요!");
                        return;
                    }
                    onNext(reason);
                });
            }
        });
    },

    renderAnalyzingScreen() {
        const html = `
            <div class="view active analyzing-screen" style="padding: 50px 30px; text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                <div class="spinner" style="border-width: 6px; width: 60px; height: 60px; margin-bottom: 25px;"></div>
                <h2 style="font-size: 1.8rem; color: var(--primary-color); margin-bottom: 15px;" class="delay-100">결과 분석 중...</h2>
                <p style="font-size: 1.1rem; color: var(--text-muted);" class="delay-200">
                    작성해주신 소중한 이유들과 선택지들을<br>AI가 하나하나 정성스럽게 읽어보고 있습니다.
                </p>
            </div>
        `;
        this.renderView(html);
    },

    renderFinalResult(result, user, onRestart, onDeepAnalyze) {
        const { topTags, mainType, categorySummaries, traits, choiceReview } = result;

        const catSummariesHtml = categorySummaries.map(c => `
            <div style="margin-bottom: 20px; padding: 22px; background: rgba(255,255,255,0.4); border-radius: 20px; border: 1px solid rgba(255,255,255,0.5); box-shadow: var(--glass-shadow);">
                <span style="font-weight:800; color:var(--primary-color); display:block; margin-bottom:10px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">${c.title}</span>
                <span style="color: var(--text-main); font-size:1.1rem; line-height: 1.6; font-weight: 500;">${c.summary}</span>
            </div>
        `).join('');

        const traitsHtml = traits.map(t => `
            <div style="margin-bottom: 12px;">
                <div style="display:flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.95rem; font-weight: 700;">
                    <span>${t.name}</span>
                    <span style="color: var(--primary-color);">${t.value}%</span>
                </div>
                <div style="height: 8px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow:hidden;">
                    <div style="height: 100%; background: var(--grad-primary); width: ${t.value}%; border-radius: 10px; transition: width 1s ease-out;"></div>
                </div>
            </div>
        `).join('');

        const intermediateReasonsHtml = Object.entries(state.categoryReasons)
            .sort((a, b) => {
                const numA = parseInt(a[0].split('_').pop()) || 0;
                const numB = parseInt(b[0].split('_').pop()) || 0;
                return numA - numB;
            })
            .map(([key, reason]) => {
                const cnt = parseInt(key.split('_').pop()) || 0;
                return `
                    <div class="result-card-premium" style="margin-bottom: 20px; border-left: 4px solid var(--primary-color);">
                        <div style="font-size: 0.85rem; color: var(--primary-color); margin-bottom: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                            <i class="fas fa-quote-left" style="margin-right: 8px; opacity: 0.5;"></i> ${cnt - 4} ~ ${cnt}번 질문에 대한 나의 생각
                        </div>
                        <div style="font-size: 1.05rem; color: var(--text-main); font-style: italic; line-height: 1.7; padding: 5px 0;">
                            "${reason}"
                        </div>
                    </div>
                `;
            }).join('');

        const html = `
            <div class="view active final-screen" style="padding: 60px 20px; overflow-y:auto; overflow-x:hidden; scrollbar-width: none; width: 100%; max-width: 100%;">
                
                <!-- NEW HERO STYLE (Reference Match) -->
                <div style="text-align:center; margin-bottom: 40px;" class="delay-100">
                    <div style="display:inline-block; padding: 6px 18px; background: var(--secondary-color); color: white; border-radius: 4px; font-weight: 900; font-size: 0.75rem; margin-bottom: 15px; letter-spacing: 2px;">YOUR RESULT</div>
                    <h1 style="font-size: clamp(1.8rem, 6vw, 3.2rem); font-weight: 900; letter-spacing: -1.5px; margin-bottom: 12px; color: var(--text-main); line-height: 1.2;">
                        당신은 <span style="background: var(--grad-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${mainType.name}</span>
                    </h1>
                    <p style="font-size: clamp(0.95rem, 2vw, 1.1rem); color: var(--text-muted); font-weight: 500;">나의 진로 가치관과 추천 직업을 확인하세요</p>
                </div>

                <!-- MAIN ANALYSIS BOX (Premium Refined) -->
                <div class="delay-200 dark-mode-card" style="margin-bottom: 50px; overflow: visible;">
                    <div style="position:relative; z-index: 2;">
                        <div style="text-transform: uppercase; letter-spacing: 2px; font-size: 0.75rem; font-weight: 800; opacity: 0.7; margin-bottom: 10px;">Career Type Analysis</div>
                        <h2 style="font-size: clamp(1.8rem, 5vw, 2.8rem); margin: 10px 0; font-weight: 900; display:flex; align-items:center; gap:15px; flex-wrap: wrap;">
                            ${mainType.name} <span style="font-size: clamp(2.5rem, 6vw, 3.5rem); filter: drop-shadow(0 0 15px rgba(255,255,255,0.3));">🎨</span>
                        </h2>
                        <div style="width: 50px; height: 3px; background: white; border-radius: 2px; margin-bottom: 20px;"></div>
                        <p style="font-size: clamp(1rem, 2.5vw, 1.25rem); line-height: 1.7; opacity: 0.95; font-weight: 500; max-width: 100%; letter-spacing: -0.3px; word-break: keep-all;">
                            ${mainType.desc} <br><span style="color: #60a5fa; font-weight: 700;">당신의 특별한 상상력이 세상에 가치를 더할 준비가 되었습니다.</span>
                        </p>
                    </div>
                    <div style="position:absolute; bottom: -30px; right: -30px; font-size: 15rem; opacity: 0.1; transform: rotate(-15deg); pointer-events:none;">🎨</div>
                </div>

                <!-- 1. KEYWORDS & TRAITS -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 50px;" class="delay-300">
                    <div class="result-section">
                        <h3 style="margin-bottom: 20px; font-size: 1.3rem; display:flex; align-items:center; gap: 10px; font-weight: 900;">
                            <i class="fas fa-thumbtack" style="color: var(--secondary-color);"></i> 나의 진로 키워드 3가지
                        </h3>
                        <div style="display:flex; gap: 10px; flex-wrap: wrap; margin-bottom: 40px;">
                            ${topTags.map(tag => `<span style="padding: 10px 22px; background: #1a1a1a; color: white; border-radius: 4px; font-size:1rem; font-weight:800;"># ${tag}</span>`).join('')}
                        </div>

                        <h3 style="margin-bottom: 25px; font-size: 1.3rem; display:flex; align-items:center; gap: 10px; font-weight: 900;">
                            <i class="fas fa-chart-bar" style="color: #10b981;"></i> 성향 분석
                        </h3>
                        <div style="background: rgba(255,255,255,0.7); backdrop-filter: blur(8px); padding: 25px; border-radius: 12px; border: 1px solid var(--border-glass);">
                            ${traitsHtml}
                        </div>
                    </div>
                    
                    <div class="result-section">
                        <h3 style="margin-bottom: 25px; font-size: 1.3rem; display:flex; align-items:center; gap: 10px; font-weight: 900;">
                            <i class="fas fa-briefcase" style="color: #6366f1;"></i> 추천 직업
                        </h3>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            ${mainType.jobs.slice(0, 6).map((job, i) => `
                                <div class="hover-lift" style="background: #ffffff; padding: 25px 20px; border-radius: 12px; border: 1px solid #eee; text-align:center;">
                                    <div style="font-size: 2.2rem; margin-bottom: 15px;">${['🎬','🎨','🚀','✍️','🎮','🏗️'][i] || '💼'}</div>
                                    <div style="font-size: 1.15rem; font-weight: 800; margin-bottom: 8px; color: var(--text-main);">${job}</div>
                                    <div style="font-size: 0.8rem; font-weight: 700; color: ${i < 2 ? 'var(--secondary-color)' : i < 4 ? 'var(--primary-color)' : '#94a3b8'};">
                                        ${i < 2 ? '★ 최고 적합' : i < 4 ? '◎ 강력 추천' : '○ 추천'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- 2. AI DEEP REPORT (Premium Shimmer) -->
                <div class="delay-400" id="report-view-anchor" style="margin-bottom: 60px;">
                    <div id="ai-report-container" style="background: #1a1a1a; padding: 60px 40px; border-radius: 28px; color: white; text-align:center; position:relative; overflow:visible; box-shadow: 0 40px 80px -15px rgba(0,0,0,0.4); min-height: 400px; transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);">
                        <div style="position:absolute; top:0; left:0; right:0; bottom:0; background: var(--mesh-dark); opacity: 0.5; z-index: 1; border-radius: 28px;"></div>
                        <div style="position:relative; z-index: 2;">
                            <h3 style="font-size: 2.2rem; margin-bottom: 18px; font-weight: 900; letter-spacing: -1px;">✨ 2026 AI 전문가 심층 리포트</h3>
                            <p style="opacity: 0.75; line-height: 1.8; margin-bottom: 45px; font-size: 1.1rem; max-width: 620px; margin-left:auto; margin-right:auto; word-break: keep-all;">
                                당신이 답변 속에 남긴 고민의 흔적들을 AI가 세밀하게 분석하여,<br>세상에 하나뿐인 <b>장문의 진로 상담 에세이</b>를 작성합니다.
                            </p>
                            <button id="btn-deep-analyze" class="btn shimmer-btn" style="padding: 22px 65px; font-size: 1.35rem; border-radius: 18px; color: white; font-weight:900; background: var(--grad-primary); border:none; box-shadow: 0 20px 40px rgba(99,102,241,0.5);">
                                 AI 심층 분석 리포트 생성하기
                            </button>
                            <p style="margin-top: 25px; font-size: 0.85rem; opacity: 0.5;">(약 15~30초 정도 소요될 수 있습니다)</p>
                        </div>
                    </div>
                </div>

                <!-- 3. CHOICE REVIEW (Reference Match) -->
                <div class="delay-500" style="margin-bottom: 50px;">
                    <h3 style="margin-bottom: 30px; font-size: 1.5rem; display:flex; align-items:center; gap: 15px; font-weight: 900;">
                        <i class="fas fa-edit" style="color: var(--primary-color);"></i> 나의 5단계 신중 답변
                    </h3>
                    <div style="display:grid; grid-template-columns: 1fr; gap: 10px;">
                        ${intermediateReasonsHtml}
                    </div>
                </div>

                <!-- Footer Actions -->
                <div style="text-align:center; padding-top: 50px; border-top: 2px solid #eee;" class="delay-500">
                    <button id="btn-restart" class="btn btn-secondary" style="margin-right: 15px; padding: 15px 40px;">다시 시작하기</button>
                    <button id="btn-print" class="btn btn-primary" style="padding: 15px 40px;"><i class="fas fa-print"></i> 결과 PDF 저장 / 인쇄</button>
                </div>
            </div>
        `;
        
        this.renderView(html, true, () => {
            const btnRestart = document.getElementById('btn-restart');
            if (btnRestart) btnRestart.addEventListener('click', onRestart);
            
            const btnAnalyze = document.getElementById('btn-deep-analyze');
            if (btnAnalyze) {
                btnAnalyze.addEventListener('click', () => {
                    const container = document.getElementById('ai-report-container');
                    container.innerHTML = `
                        <div style="padding: 40px; text-align:center;">
                            <div class="spinner" style="border-width: 4px; width: 40px; height: 40px; margin-bottom: 15px; border-top-color: white;"></div>
                            <p style="font-weight:700; color:white;">AI가 학생의 고뇌와 흔적을 읽고 있습니다... (약 15초 소요)</p>
                        </div>
                    `;
                    onDeepAnalyze(container);
                });
            }

            const btnPrint = document.getElementById('btn-print');
            if (btnPrint) {
                btnPrint.addEventListener('click', () => {
                    this.handlePrint(result, user);
                });
            }
        });
    },

    handlePrint(result, user) {
        const dateStr = new Date().toLocaleDateString();
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 1024;
        
        const printHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>진로 심층 분석 리포트 - ${user.name}</title>
                <style>
                    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; padding: 40px; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                    .info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px; font-size: 0.9rem; }
                    .section { margin-bottom: 40px; }
                    .section-title { font-size: 1.4rem; font-weight: bold; border-left: 5px solid #4f46e5; padding-left: 15px; margin-bottom: 20px; color: #1a1a1a; }
                    .main-type { font-size: 2rem; color: #4f46e5; font-weight: 900; margin-bottom: 10px; }
                    .tags { color: #666; font-weight: bold; }
                    .ai-report { white-space: pre-wrap; background: #fff; border: 1px solid #eee; padding: 25px; border-radius: 12px; font-size: 1.05rem; }
                    .category { margin-bottom: 15px; }
                    .cat-name { font-weight: bold; color: #4f46e5; margin-right: 10px; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="position: fixed; top: 15px; right: 15px; display: flex; gap: 8px; z-index: 9999;">
                    <button onclick="window.print()" style="padding: 10px 18px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 800; font-size: 0.9rem; box-shadow: 0 5px 15px rgba(79, 70, 229, 0.4);">실제 인쇄 / PDF 저장</button>
                    <button onclick="window.close()" style="padding: 10px 18px; background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-weight: 800; font-size: 0.9rem; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">창 닫기</button>
                </div>
                <div class="header">
                    <h1>진로 역량 심층 분석 리포트</h1>
                    <p style="color: #666;">EduBoard AI Career Assessment System</p>
                </div>
                <div class="info">
                    <div><b>이름:</b> ${user.name}</div>
                    <div><b>학급:</b> ${user.grade}학년 ${user.classNum || ''}반 ${user.studentNum || ''}번</div>
                    <div><b>검사일:</b> ${dateStr}</div>
                </div>
                <div class="section">
                    <div class="section-title">종합 분석 결과</div>
                    <div class="main-type">"${result.mainType.name}"</div>
                    <div class="tags">핵심 키워드: ${result.topTags.join(', ')}</div>
                </div>
                <div class="section">
                    <div class="section-title">AI 전문가 심층 어드바이스</div>
                    <div class="ai-report">${(result.aiSentences && result.aiSentences.length > 0) 
                        ? result.aiSentences.join('<br><br>') 
                        : '<div style="text-align:center; color:#999; padding:20px;">[ 분석 리포트 생성 버튼을 누른 후 인쇄해 주세요 ]</div>'}</div>
                </div>
                <div class="section">
                    <div class="section-title">영역별 세부 분석</div>
                    ${result.categorySummaries.map(c => `
                        <div class="category">
                            <span class="cat-name">[${c.title}]</span> ${c.summary}
                        </div>
                    `).join('')}
                </div>
                <div class="section">
                    <div class="section-title">나의 5단계 신중 답변</div>
                    ${Object.entries(state.categoryReasons)
                        .sort((a,b) => (parseInt(a[0].split('_').pop()) || 0) - (parseInt(b[0].split('_').pop()) || 0))
                        .map(([key, reason]) => {
                            const cnt = parseInt(key.split('_').pop()) || 0;
                            return `
                                <div style="margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 10px;">
                                    <div style="font-size: 0.85rem; color: #4f46e5; font-weight: bold; margin-bottom: 5px;">[ ${cnt-4} ~ ${cnt}번 질문 ]</div>
                                    <div style="font-size: 1rem; color: #333; font-style: italic;">"${reason}"</div>
                                </div>
                            `;
                        }).join('')}
                </div>
                <div style="text-align:center; margin-top: 50px; font-size: 0.8rem; color: #999;">
                    © 2026 EduBoard Career Assessment. All Rights Reserved.
                </div>
            </body>
            </html>
        `;

        if (isMobile && window.html2pdf) {
            // 모바일/테블릿: 자동 다운로드
            const element = document.createElement('div');
            element.innerHTML = printHtml;
            // 버튼 제거
            const btns = element.querySelector('.no-print');
            if (btns) btns.remove();

            const opt = {
                margin: 10,
                filename: `진로분석리포트_${user.name}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save();
        } else {
            // PC: 기존 방식 (새 창 열고 인쇄창 띄우기)
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printHtml + `
                <script>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                        }, 500);
                    };
                </script>
            `);
            printWindow.document.close();
        }
    }
};

