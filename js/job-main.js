class AppController {
    
    start() {
        UI.renderStartScreen(() => this.showConfig());
    }

    showConfig() {
        UI.renderConfigScreen((name, grade, detail, group, api, provider) => {
            state.setUserForm(name, grade, detail, group, api, provider);
            if (grade === '테스트') {
                state.seedTestData();
                this.showFinalResult();
            } else {
                this.showCategoryIntro();
            }
        });
    }

    showCategoryIntro() {
        UI.renderCategoryScreen(CATEGORIES, state.currentCategoryIndex, () => {
            this.showQuestion();
        });
    }

    showQuestion() {
        const cat = state.getCurrentCategory();
        const q = state.getCurrentQuestion();
        const progress = state.getCurrentCategoryProgress();

        UI.renderQuestionScreen(cat, q, progress, (selectedOption, tags, reason) => {
            // Save answered data
            state.saveAnswer(q.id, selectedOption, tags, reason);
            
            // Determine next step
            const nextAction = state.nextStep();
            
            if (nextAction === "question_next") {
                this.showQuestion();
            } else if (nextAction === "category_summary") {
                this.showIntermediateSummary();
            } else if (nextAction === "finished") {
                this.showFinalResult();
            }
        });
    }

    showIntermediateSummary() {
        const cat = state.getCurrentCategory();
        const topTags = state.getTopTagsForCategory(cat.id, 2);
        
        // Identify the last 5 questions answered across the whole test
        const allAnsweredIds = Object.keys(state.answers);
        const last5Questions = QUESTIONS.filter(q => allAnsweredIds.includes(q.id)).slice(-5);

        UI.renderIntermediateSummary(cat, topTags, state, last5Questions, (reason) => {
            state.saveCategoryReason(cat.id + "_" + Object.keys(state.answers).length, reason);
            
            // Check if we also reached the end of the category
            const progress = state.getCurrentCategoryProgress();
            if (progress.current >= progress.total) {
                state.nextCategory();
                if (state.currentCategoryIndex < CATEGORIES.length) {
                    this.showCategoryIntro();
                } else {
                    this.showFinalResult();
                }
            } else {
                // Just continue to next question in same category
                state.currentQuestionIndex++; 
                this.showQuestion();
            }
        });
    }

    async showFinalResult() {
        UI.renderAnalyzingScreen();
        try {
            // Get base results (tags, type, etc.)
            const finalResult = await Analyzer.compileFinalResultAsync(state);
            
            // Log to Supabase user_activity_logs (Await the save to prevent race conditions)
            const resultData = {
                username: localStorage.getItem('savedUsername') || 'anonymous',
                name: state.user.name,
                grade: state.user.grade,
                main_type: finalResult.mainType.name,
                top_tags: finalResult.topTags.join(', '),
                details: {
                    summaries: finalResult.categorySummaries.map(s => s.summary).join(' | '),
                    categoryReasons: state.categoryReasons,
                    answers: state.answers
                }
            };

            // Return a promise for the save operation and execute it immediately
            console.log("Saving result to Supabase...");
            const savePromise = window.sb.from('career_test_results')
                .insert([resultData])
                .select('id')
                .single();
            
            // Handle initial save errors early
            savePromise.then(({data, error}) => {
                if (error) {
                    console.error("Supabase Save Error Details:", error);
                    // Critical for debugging: show if table or column is missing
                } else {
                    console.log("Base result saved successfully. ID:", data?.id);
                }
            });

            UI.renderFinalResult(finalResult, state.user, 
                () => { // onRestart
                    state.reset();
                    this.start();
                },
                async (container) => { // onDeepAnalyze (Click handler)
                    // 1. Check if reasoning is enough (Pedagogical Check)
                    const totalReasonLength = state.categoryReasons ? Object.values(state.categoryReasons).join('').length : 0;
                    if (totalReasonLength < 20) {
                        alert("분석을 위해 답변 이유를 조금 더 자세히 적어주세요! (각 단계별 이유를 합쳐 최소 20자 이상 필요합니다)");
                        return;
                    }

                    const loadingInterval = UI.renderDeepAnalyzeProgress(container);

                    try {
                        const resultText = await Analyzer.generateRealAISentences(state, finalResult.mainType);
                        
                        // Clear loading animation immediately
                        if (loadingInterval) clearInterval(loadingInterval);
                        
                        // Sync result to result object
                        finalResult.aiSentences = Array.isArray(resultText) ? resultText : [resultText];

                        // Ensure initial save is finished before updating
                        const { data: savedData, error: saveError } = await savePromise;
                        
                        if (!saveError && savedData) {
                            const aiReportText = finalResult.aiSentences.join('\n\n');
                            const finalDetails = JSON.parse(JSON.stringify(resultData.details || {}));
                            finalDetails.ai_report = aiReportText;

                            const { error: updateError } = await window.sb.from('career_test_results').update({
                                details: finalDetails
                            }).eq('id', savedData.id);
                            
                            if (updateError) console.warn("AI Report sync error:", updateError.message);
                            else console.log("AI Report successfully synced to DB.");
                        } else if (saveError) {
                            console.warn("Could not sync AI report because initial save failed:", saveError.message);
                        }

                        container.innerHTML = `
                            <div id="ai-report-text-content" style="position:relative; z-index: 2; text-align:left; line-height:2.0; font-size: 1.1rem; white-space: pre-wrap; color: rgba(255,255,255,0.95); animation: fade-in 1s ease-out;">
                                ${finalResult.aiSentences.join('<br><br>')}
                            </div>
                        `;
                    } catch(err) {
                        console.error(err);
                        container.innerHTML = `
                            <div style="position:relative; z-index: 2; padding: 30px; color: #fecaca; background: rgba(220, 38, 38, 0.1); border-radius: 16px; border: 1px solid rgba(220, 38, 38, 0.2); text-align:center;">
                                <div style="font-size: 2.5rem; margin-bottom: 20px;">⚠️</div>
                                <h4 style="margin-bottom: 10px; font-weight: 800;">AI 분석 중 오류가 발생했습니다.</h4>
                                <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 20px;">사유: ${err.message}</p>
                                <button onclick="location.reload()" class="btn btn-primary" style="padding: 10px 25px; font-size: 0.9rem;">새로고침 후 다시 시도</button>
                            </div>
                        `;
                    }
                }
            );
        } catch(e) {
            console.error(e);
            alert('결과 화면을 수립하는 중 오류가 발생했습니다.');
        }
    }
}

const initApp = () => {
    const app = new AppController();
    app.start();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // If bundled at the bottom, DOMContentLoaded might have already fired
    setTimeout(initApp, 0);
}
