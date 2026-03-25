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
                        <option value="기타">기타</option>
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
            <div class="view active question-screen" style="padding: 40px; display:flex; flex-direction:column; min-height:100%;">
                
                <!-- Header / Progress -->
                <div style="display:flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px;" class="delay-100">
                    <div>
                        <div style="font-size: 0.9rem; font-weight:700; color: var(--primary-color); margin-bottom: 4px; border-bottom: 2px solid var(--primary-color); display:inline-block;">${category.title}</div>
                        <h2 style="font-size: 1.8rem; margin-top: 10px; letter-spacing: -0.5px;">${question.title}</h2>
                    </div>
                    <div style="font-size:1.1rem; font-weight:800; color: var(--text-muted); padding-bottom: 5px;">${progress.current} <span style="font-weight:400; font-size: 0.8rem; opacity: 0.6;">/ ${progress.total}</span></div>
                </div>
                
                <div style="height: 4px; background: rgba(0,0,0,0.05); border-radius: 10px; margin-bottom: 40px; overflow:hidden;" class="delay-100">
                    <div class="progress-bar-fill" style="height: 100%; background: var(--grad-primary); width: ${pct}%;"></div>
                </div>

                <!-- Options as Cards -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;" class="delay-200">
                    <div id="opt-a" class="btn btn-secondary hover-lift" style="padding: 30px 20px; flex-direction:column; height: auto; text-align:center; border-radius: var(--border-radius-md); border: 2px solid transparent;">
                        <div style="font-size: 0.9rem; opacity: 0.5; margin-bottom: 8px;">선택지 A</div>
                        <div style="font-size: 1.3rem; font-weight: 800;">${question.optionA}</div>
                        <div style="font-size: 0.85rem; opacity: 0.7; margin-top: 5px; font-weight: 500;">${question.descA}</div>
                    </div>
                    <div id="opt-b" class="btn btn-secondary hover-lift" style="padding: 30px 20px; flex-direction:column; height: auto; text-align:center; border-radius: var(--border-radius-md); border: 2px solid transparent;">
                        <div style="font-size: 0.9rem; opacity: 0.5; margin-bottom: 8px;">선택지 B</div>
                        <div style="font-size: 1.3rem; font-weight: 800;">${question.optionB}</div>
                        <div style="font-size: 0.85rem; opacity: 0.7; margin-top: 5px; font-weight: 500;">${question.descB}</div>
                    </div>
                </div>
                
                <div id="reason-mount"></div>

                <!-- Guidance -->
                <div style="margin-top: auto; padding-top: 20px;" class="delay-300">
                    <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 10px;">스스로에게 던져보는 질문:</div>
                    <div style="display:flex; flex-wrap: wrap;">${followUps}</div>
                </div>
            </div>
        `;
        
        this.renderView(html, true, () => {
            let selectedOption = null;
            let selectedTags = null;

            const attachReasoning = (option, tags) => {
                selectedOption = option;
                selectedTags = tags;

                const btnA = document.getElementById('opt-a');
                const btnB = document.getElementById('opt-b');
                
                [btnA, btnB].forEach(b => {
                    b.style.borderColor = 'transparent';
                    b.style.background = 'var(--bg-glass-card)';
                    b.style.opacity = '0.5';
                });

                const selected = option === 'A' ? btnA : btnB;
                selected.style.borderColor = 'var(--primary-color)';
                selected.style.background = '#ffffff';
                selected.style.opacity = '1';
                selected.style.boxShadow = '0 10px 25px -5px rgba(99, 102, 241, 0.2)';

                if (!document.getElementById('reason-container')) {
                    const reasonHtml = `
                        <div id="reason-container" class="fade-in-up" style="margin-top: 10px; margin-bottom: 25px; background: #ffffff; padding: 30px; border-radius: var(--border-radius-md); border: 1px solid var(--border-glass); box-shadow: var(--glass-shadow);">
                            <label style="display:block; margin-bottom: 15px; font-size: 1.1rem; font-weight: 800; color: var(--text-main);">나는 왜 이 선택을 했나요?</label>
                            <textarea id="reason-input" rows="3" placeholder="예: 새로운 것을 배우고 도전할 때 에너지가 생기기 때문입니다." style="width: 100%; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; resize:none; font-family:inherit; font-size: 1rem; line-height: 1.6; color: var(--text-main); outline:none; transition: all 0.3s;"></textarea>
                            <div style="display:flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                                <span style="font-size: 0.85rem; color: var(--text-muted);">* 정성껏 적을수록 AI 리포트가 정확해집니다.</span>
                                <button id="btn-submit-reason" class="btn btn-primary" style="padding: 12px 30px; border-radius: 10px;">다음 질문 <i class="fas fa-arrow-right"></i></button>
                            </div>
                        </div>
                    `;
                    
                    const mountPoint = document.getElementById('reason-mount');
                    if (mountPoint) {
                        mountPoint.innerHTML = reasonHtml;
                        document.getElementById('btn-submit-reason').addEventListener('click', () => {
                            const reason = document.getElementById('reason-input').value.trim();
                            
                            // Enforce reasoning for all users to ensure AI report quality
                            if (!reason || reason.length < 2) {
                                alert('보다 정확한 AI 분석을 위해 선택한 이유를 간략하게나마 적어주세요!\n(예: "안정적인 것이 좋아서", "도전하고 싶어서" 등)');
                                document.getElementById('reason-input').focus();
                                return;
                            }

                            onAnswer(selectedOption, selectedTags, reason);
                        });
                    }
                }
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
            <div style="background: #ffffff; padding: 20px; border-radius: 15px; border: 1px solid #edf2f7; margin-bottom: 15px;">
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">Q${idx + 1}. ${cr.title}</div>
                <div style="font-size: 1.1rem; font-weight: 800; margin-bottom: 5px; color: var(--text-main);">
                    <i class="fas fa-check-circle" style="color: #10b981; margin-right: 8px;"></i>${cr.choice}
                </div>
                <!-- Descriptor line -->
                <div style="font-size: 0.9rem; font-weight: 600; color: var(--primary-color); opacity: 0.8; margin-bottom: 10px;">
                    ${QUESTIONS.find(q => q.id === cr.id)[cr.selectedOption === 'A' ? 'descA' : 'descB'] || ""}
                </div>
                <div style="font-size: 0.95rem; color: var(--text-muted); font-style: italic; padding-top: 10px; border-top: 1px dashed #edf2f7;">
                    ${cr.reason}
                </div>
            </div>
        `).join('');

        const html = `
            <div class="view active final-screen" style="padding: 60px 40px; overflow-y:auto; scrollbar-width: none;">
                
                <!-- NEW HERO STYLE (Reference Match) -->
                <div style="text-align:center; margin-bottom: 50px;" class="delay-100">
                    <div style="display:inline-block; padding: 6px 18px; background: var(--secondary-color); color: white; border-radius: 4px; font-weight: 900; font-size: 0.8rem; margin-bottom: 20px; letter-spacing: 2px;">YOUR RESULT</div>
                    <h1 style="font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 900; letter-spacing: -1px; margin-bottom: 15px; color: var(--text-main);">
                        당신은 <span style="background: var(--grad-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${mainType.name}</span>
                    </h1>
                    <p style="font-size: 1.1rem; color: var(--text-muted); font-weight: 500;">나의 진로 가치관과 추천 직업을 확인하세요</p>
                </div>

                <!-- MAIN ANALYSIS BOX (Reference Match) -->
                <div class="delay-200" style="margin-bottom: 50px; background: #1a1a1a; padding: 45px; border-radius: 10px; color: white; position:relative; overflow:hidden;">
                    <div style="position:relative; z-index: 2;">
                        <span style="font-size: 0.9rem; opacity: 0.6; font-weight: 700;">나의 직업 유형</span>
                        <h2 style="font-size: 2.2rem; margin: 15px 0; font-weight: 900; display:flex; align-items:center; gap:15px;">
                            ${mainType.name} <span style="font-size: 3rem;">🎨</span>
                        </h2>
                        <p style="font-size: 1.2rem; line-height: 1.8; opacity: 0.9; font-weight: 500; max-width: 600px;">
                            ${mainType.desc} 당신의 상상력이 세상을 바꿀 수 있습니다.
                        </p>
                    </div>
                    <div style="position:absolute; bottom: -20px; right: -20px; font-size: 12rem; opacity: 0.05; transform: rotate(-15deg);">🎨</div>
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
                        <div style="background: #fdfdfd; padding: 25px; border-radius: 12px; border: 1px solid #eee;">
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

                <!-- 2. AI DEEP REPORT -->
                <div class="delay-400" style="margin-bottom: 60px;">
                    <div id="ai-report-container" style="background: var(--grad-primary); padding: 50px; border-radius: 20px; color: white; text-align:center; box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.4);">
                        <h3 style="font-size: 1.8rem; margin-bottom: 15px; font-weight: 900;">✨ 2026 AI 전문가 심층 리포트</h3>
                        <p style="opacity: 0.9; line-height: 1.7; margin-bottom: 35px; font-size: 1.1rem; max-width: 600px; margin-left:auto; margin-right:auto;">
                            작성한 답변과 고민의 흔적을 바탕으로 당신의 잠재력을 1500자 분량의 정밀 에세이로 풀어냅니다.
                        </p>
                        <button id="btn-deep-analyze" class="btn btn-secondary pulse-glow" style="padding: 20px 50px; font-size: 1.25rem; border-radius: 12px; color: var(--primary-color); font-weight:900; border:none; background: white;">
                             AI 심층 분석 리포트 생성하기
                        </button>
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
