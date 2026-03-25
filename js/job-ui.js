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
            <div class="view active question-screen" style="padding: 35px 25px; display:flex; flex-direction:column; min-height: 480px; gap: 0;">
                
                <!-- 1. Header Section -->
                <div style="flex-shrink: 0; margin-bottom: 25px;">
                    <div style="display:flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
                        <span style="font-size: 0.85rem; font-weight:700; color: var(--primary-color); text-transform: uppercase; letter-spacing: 1px;">${category.title}</span>
                        <span style="font-size:1rem; font-weight:800; color: var(--text-muted); opacity: 0.5;">${progress.current} / ${progress.total}</span>
                    </div>
                    <h2 style="font-size: 1.7rem; font-weight: 900; line-height: 1.3; margin-bottom: 20px; color: var(--text-main); letter-spacing: -0.5px;">${question.title}</h2>
                    <div style="height: 5px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow:hidden;">
                        <div class="progress-bar-fill" style="height: 100%; background: var(--grad-primary); width: ${pct}%;"></div>
                    </div>
                </div>

                <!-- 2. Interaction Section -->
                <div style="flex:1; display:flex; flex-direction:column; justify-content: center;">
                    <p id="selection-guide" style="font-size: 0.95rem; font-weight: 800; color: var(--primary-color); margin-bottom: 15px; text-align:center; opacity: 0.8;">
                        두 가지 가치 중 당신의 마음이 가는 곳은?
                    </p>

                    <!-- Options Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px; max-width: 600px; width: 100%; margin-left: auto; margin-right: auto;">
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
                    
                    <div id="reason-mount" style="min-height: 90px;">
                        <div style="text-align:center; padding: 25px; color: var(--text-muted); font-size: 0.85rem; background: rgba(0,0,0,0.02); border-radius: 12px; border: 1px dashed #ddd;">
                            선택지를 클릭하면 답변 이유를 적을 수 있습니다.
                        </div>
                    </div>
                </div>

                <!-- 3. Footer Section -->
                <div style="flex-shrink:0; padding-top: 15px; border-top: 1px solid #f0f0f0; margin-top: 15px;">
                    <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; opacity: 0.7;">스스로에게 던져보는 질문:</div>
                    <div style="display:flex; flex-wrap: wrap; gap: 6px;">${followUps}</div>
                </div>
            </div>
        `;
        
        this.renderView(html, true, () => {
            let selectedOption = null;
            let selectedTags = null;
            const mountPoint = document.getElementById('reason-mount');

            const attachReasoning = (option, tags) => {
                selectedOption = option;
                selectedTags = tags;

                const btnA = document.getElementById('opt-a');
                const btnB = document.getElementById('opt-b');
                
                [btnA, btnB].forEach(b => {
                    b.style.borderColor = 'transparent';
                    b.style.background = 'var(--bg-glass-card)';
                    b.style.opacity = '0.5';
                    b.classList.remove('active-card');
                });

                const selected = option === 'A' ? btnA : btnB;
                selected.style.borderColor = 'var(--primary-color)';
                selected.style.background = '#ffffff';
                selected.style.opacity = '1';
                selected.classList.add('active-card');
                
                document.getElementById('selection-guide').innerHTML = "탁월한 선택입니다! 이유를 간단히 적어주세요.";
                document.getElementById('selection-guide').style.color = "#10b981";

                mountPoint.innerHTML = `
                    <div id="reason-container" class="fade-in-up" style="margin-top: 0; margin-bottom: 10px; background: #ffffff; padding: 20px; border-radius: 20px; border: 2px solid var(--primary-color); box-shadow: 0 10px 30px rgba(99, 102, 241, 0.1);">
                        <label style="display:block; margin-bottom: 10px; font-size: 1rem; font-weight: 800; color: var(--text-main);">그렇게 선택한 이유는 무엇인가요?</label>
                        <textarea id="reason-input" rows="2" placeholder="예: 새로운 것을 배우고 도전할 때 에너지가 생기기 때문입니다." style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; resize:none; font-family:inherit; font-size: 0.95rem; line-height: 1.5; color: var(--text-main); outline:none;"></textarea>
                        <div style="display:flex; justify-content: space-between; align-items: center; margin-top: 12px; gap: 10px;">
                            <span style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.3;">이유를 적을수록<br>AI 리포트가 정확해집니다.</span>
                            <button id="btn-submit-reason" class="btn btn-primary" style="padding: 10px 25px; border-radius: 12px; font-weight: 800; font-size: 0.95rem;">다음 질문 <i class="fas fa-arrow-right"></i></button>
                        </div>
                    </div>
                `;

                document.getElementById('btn-submit-reason').addEventListener('click', () => {
                    const reason = document.getElementById('reason-input').value.trim();
                    if (!reason || reason.length < 2) {
                        alert('보다 정확한 AI 분석을 위해 선택한 이유를 간단하게나마 적어주세요!\n(예: "안정적인 것이 좋아서", "도전하고 싶어서" 등)');
                        document.getElementById('reason-input').focus();
                        return;
                    }
                    onAnswer(selectedOption, selectedTags, reason);
                });
                
                document.getElementById('reason-input').focus();
            };

            const optA = document.getElementById('opt-a');
            const optB = document.getElementById('opt-b');
            if (optA) optA.addEventListener('click', () => attachReasoning('A', question.tagsA));
            if (optB) optB.addEventListener('click', () => attachReasoning('B', question.tagsB));
        });
    },

    renderIntermediateSummary(category, topTags, onNext) {
        const text = category.summaryTemplate.replace("[TOP_TAGS]", topTags.join(', ') || "다양함");
        
        const html = `
            <div class="view active intermediate-screen" style="padding: 50px 30px; text-align:center; display:flex; flex-direction:column; justify-content:center;">
                <h3 style="color: var(--primary-color); margin-bottom: 20px;" class="delay-100">[ ${category.title} ] 요약</h3>
                <div style="background: var(--bg-glass-card); padding: 30px; border-radius: var(--border-radius-md); box-shadow: var(--glass-shadow); margin-bottom: 40px;" class="delay-200">
                    <p style="font-size: 1.3rem; line-height: 1.6;">"${text}"</p>
                </div>
                <div class="delay-300">
                    <button id="btn-next-cat" class="btn btn-primary">다음 단계로 이동</button>
                </div>
            </div>
        `;
        this.renderView(html, true, () => {
            const btn = document.getElementById('btn-next-cat');
            if (btn) btn.addEventListener('click', onNext);
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

        const choiceReviewHtml = choiceReview.map((cr, idx) => `
            <div class="result-card-premium" style="margin-bottom: 15px;">
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px; font-weight: 600;">질문 ${idx + 1}. ${cr.title}</div>
                <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 15px;">
                    <div style="background: var(--primary-color); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; flex-shrink: 0; min-width: 24px;">
                        <i class="fas fa-check"></i>
                    </div>
                    <div>
                        <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); line-height: 1.3;">${cr.choice}</div>
                        <div style="font-size: 0.9rem; font-weight: 600; color: var(--primary-color); margin-top: 4px; opacity: 0.9;">
                            ${QUESTIONS.find(q => q.id === cr.id)[cr.selectedOption === 'A' ? 'descA' : 'descB'] || ""}
                        </div>
                    </div>
                </div>
                <div style="font-size: 0.95rem; color: var(--text-muted); font-style: italic; padding: 15px; background: rgba(0,0,0,0.02); border-left: 3px solid var(--border-glass); border-radius: 0 8px 8px 0;">
                    "${cr.reason}"
                </div>
            </div>
        `).join('');

        const html = `
            <div class="view active final-screen" style="padding: 60px 40px; overflow-y:auto; scrollbar-width: none;">
                
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
                        <i class="fas fa-edit" style="color: var(--primary-color);"></i> 나의 선택 이유 돌아보기
                    </h3>
                    <div style="display:grid; grid-template-columns: 1fr; gap: 10px;">
                        ${choiceReviewHtml}
                    </div>
                </div>

                <!-- Footer Actions -->
                <div style="text-align:center; padding-top: 50px; border-top: 2px solid #eee;" class="delay-500">
                    <button id="btn-restart" class="btn btn-secondary" style="margin-right: 15px; padding: 15px 40px;">다시 시작하기</button>
                    <button id="btn-print" class="btn btn-primary" style="padding: 15px 40px;" onclick="window.print()"><i class="fas fa-print"></i> 결과 PDF 저장 / 인쇄</button>
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
        });
    }
};
