/* ==========================================================================
   Additional View Styles (injected via JS or inline)
   ========================================================================== */
const UI = {
    container: document.getElementById('main-content'),

    renderView(html, isFade = true) {
        if (!isFade) {
            this.container.innerHTML = html;
            return;
        }

        const oldContent = this.container.innerHTML;
        if (!oldContent) {
            this.container.innerHTML = html;
            const children = Array.from(this.container.children);
            children.forEach(child => child.classList.add('fade-in-up'));
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
        this.renderView(html);
        document.getElementById('btn-start').addEventListener('click', onStart);
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
                            <b>구글 제미나이 1.5 무료 키</b>가 엔진에 내장되었습니다.<br>
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
        this.renderView(html);

        document.getElementById('btn-save-cfg').addEventListener('click', () => {
            const name = document.getElementById('cfg-name').value || "사용자";
            const grade = document.getElementById('cfg-grade').value;
            const provider = document.getElementById('cfg-api-provider').value;
            const api = document.getElementById('cfg-api').value.trim();
            onSave(name, grade, 'short', 'solo', api, provider);
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
        this.renderView(html);
        document.getElementById('btn-start-cat').addEventListener('click', onNext);
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
                    </div>
                    <div id="opt-b" class="btn btn-secondary hover-lift" style="padding: 30px 20px; flex-direction:column; height: auto; text-align:center; border-radius: var(--border-radius-md); border: 2px solid transparent;">
                        <div style="font-size: 0.9rem; opacity: 0.5; margin-bottom: 8px;">선택지 B</div>
                        <div style="font-size: 1.3rem; font-weight: 800;">${question.optionB}</div>
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
        
        this.renderView(html);

        // Binding reasoning logic inside UI handler
        let selectedOption = null;
        let selectedTags = null;

        const attachReasoning = (option, tags) => {
            selectedOption = option;
            selectedTags = tags;

            const btnA = document.getElementById('opt-a');
            const btnB = document.getElementById('opt-b');
            
            // Highlight selected with border and shadow
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

            // Render reason input directly below if it doesn't exist
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
                
                const container = document.getElementById('reason-mount');
                container.innerHTML = reasonHtml;

                document.getElementById('btn-submit-reason').addEventListener('click', () => {
                    let reason = document.getElementById('reason-input').value.trim();
                    if (!reason && state.user.grade !== '기타') {
                        alert('이유를 한 글자라도 입력해 주세요!\n여러분의 생각이 진로 분석에 반영됩니다.');
                        return;
                    }
                    if (!reason) reason = "(이유 미작성)";
                    onAnswer(selectedOption, selectedTags, reason);
                });
            }
        };

        document.getElementById('opt-a').addEventListener('click', () => attachReasoning('A', question.tagsA));
        document.getElementById('opt-b').addEventListener('click', () => attachReasoning('B', question.tagsB));
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
        this.renderView(html);
        document.getElementById('btn-next-cat').addEventListener('click', onNext);
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
        const { topTags, mainType, categorySummaries } = result;

        const catSummariesHtml = categorySummaries.map(c => `
            <div style="margin-bottom: 20px; padding: 20px; background: rgba(255,255,255,0.4); border-radius: 15px; border: 1px solid rgba(255,255,255,0.5);">
                <span style="font-weight:800; color:var(--primary-color); display:block; margin-bottom:8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">${c.title}</span>
                <span style="color: var(--text-main); font-size:1.1rem; line-height: 1.5; font-weight: 500;">${c.summary}</span>
            </div>
        `).join('');

        const html = `
            <div class="view active final-screen" style="padding: 60px 40px; overflow-y:auto; scrollbar-width: none;">
                
                <!-- Hero Section -->
                <div style="text-align:center; margin-bottom: 60px;" class="delay-100">
                    <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 10px; font-weight: 600;">${user.name} 님의 결과분석</p>
                    <h1 style="font-size: 3.5rem; font-weight: 900; letter-spacing: -2px; margin-bottom: 20px; background: var(--grad-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                        ${mainType.name}
                    </h1>
                    <div style="display:flex; justify-content:center; gap: 10px; flex-wrap: wrap;">
                        ${topTags.map(tag => `<span style="padding: 8px 20px; background: #ffffff; color: var(--primary-color); border: 1px solid var(--primary-color-soft); border-radius: 30px; font-size:1rem; font-weight:700; box-shadow: var(--glass-shadow);">#${tag}</span>`).join('')}
                    </div>
                </div>

                <!-- Deep Analysis Action (Better than Claude) -->
                <div class="delay-200" style="margin-bottom: 50px;">
                    <div id="ai-report-container" style="background: #ffffff; padding: 40px; border-radius: 30px; border: 2px solid var(--primary-color-soft); box-shadow: 0 30px 60px -12px rgba(99, 102, 241, 0.15); text-align:center; position:relative; overflow:hidden;">
                        <div style="position:relative; z-index: 2;">
                            <h3 style="font-size: 1.5rem; margin-bottom: 15px; font-weight: 800;">✨ 2026 AI 전문가 심층 리포트</h3>
                            <p style="color: var(--text-muted); line-height: 1.7; margin-bottom: 30px; font-size: 1.1rem; max-width: 500px; margin-left:auto; margin-right:auto;">
                                25개의 답변과 선택 이유를 바탕으로 당신의 잠재력과 가치관을<br>전문 멘토의 시선에서 1500자 분량의 에세이로 풀어냅니다.
                            </p>
                            <button id="btn-deep-analyze" class="btn btn-primary pulse-glow" style="padding: 20px 60px; font-size: 1.3rem; border-radius: 20px; font-weight: 800;">
                                AI 심층 분석 시작하기
                            </button>
                        </div>
                        <div style="position:absolute; top:-20%; right:-10%; width: 300px; height: 300px; background: radial-gradient(circle, var(--primary-color-soft), transparent 70%); z-index:1;"></div>
                    </div>
                </div>

                <!-- Detailed Breakdown -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 50px;" class="delay-300">
                    <div class="result-section">
                        <h3 style="margin-bottom: 25px; font-size: 1.4rem; font-weight: 900; color: var(--text-main); display:flex; align-items:center; gap: 10px;">
                            <i class="fas fa-list-check" style="color: var(--primary-color);"></i> 영역별 응답 요약
                        </h3>
                        ${catSummariesHtml}
                    </div>
                    
                    <div class="result-section">
                        <h3 style="margin-bottom: 25px; font-size: 1.4rem; font-weight: 900; color: var(--text-main); display:flex; align-items:center; gap: 10px;">
                            <i class="fas fa-compass" style="color: var(--secondary-color);"></i> 추천 탐색 직업군
                        </h3>
                        <div style="display:grid; grid-template-columns: 1fr; gap: 12px;">
                            ${mainType.jobs.map(job => `
                                <a href="https://search.naver.com/search.naver?query=${encodeURIComponent(job + ' 직업')}" target="_blank" 
                                   class="hover-lift"
                                   style="display:flex; align-items:center; justify-content: space-between; padding: 20px 25px; background: #ffffff; border: 1px solid #edf2f7; border-radius: 20px; font-weight:700; color:var(--text-main); text-decoration:none;">
                                   <span style="font-size: 1.15rem;">${job}</span>
                                   <i class="fas fa-chevron-right" style="font-size: 0.8rem; opacity: 0.3;"></i>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div style="text-align:center; padding-top: 40px; border-top: 1px solid #edf2f7;" class="delay-400">
                    <button id="btn-restart" class="btn btn-secondary" style="margin-right: 15px;">테스트 다시하기</button>
                    <button id="btn-print" class="btn btn-primary" onclick="window.print()"><i class="fas fa-print"></i> PDF/인쇄 저장</button>
                </div>
            </div>
        `;
        
        this.renderView(html);
        document.getElementById('btn-restart').addEventListener('click', onRestart);
        
        const btnAnalyze = document.getElementById('btn-deep-analyze');
        if (btnAnalyze) {
            btnAnalyze.addEventListener('click', () => {
                const container = document.getElementById('ai-report-container');
                container.innerHTML = `
                    <div style="padding: 40px; text-align:center;">
                        <div class="spinner" style="border-width: 4px; width: 40px; height: 40px; margin-bottom: 15px;"></div>
                        <p style="font-weight:600; color:var(--primary-color);">AI가 학생의 답변을 정독하며<br>심층 에세이를 작성하고 있습니다 (약 10~20초 소요)...</p>
                    </div>
                `;
                onDeepAnalyze(container);
            });
        }
    }
};
