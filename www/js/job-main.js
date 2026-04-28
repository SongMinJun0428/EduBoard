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

        // Check if we also reached the end of the category
        const progress = state.getCurrentCategoryProgress();
        const isLastCategory = state.currentCategoryIndex >= CATEGORIES.length - 1;
        const isEndOfCategory = progress.current >= progress.total;
        const isLast = isLastCategory && isEndOfCategory;

        UI.renderIntermediateSummary(cat, topTags, state, last5Questions, isLast, (reason) => {
            state.saveCategoryReason(cat.id + "_" + Object.keys(state.answers).length, reason);
            
            if (isEndOfCategory) {
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
            // 1. Get base results (tags, type, traits, etc.)
            const finalResult = await Analyzer.compileFinalResultAsync(state);
            
            // 2. Automated AI Deep Analysis
            // (Pedagogical Check for reasoning length - if too short, we use the fallback logic in Analyzer)
            const totalReasonLength = state.categoryReasons ? Object.values(state.categoryReasons).join('').length : 0;
            
            let aiSuccess = false;
            let aiReportText = "";
            if (totalReasonLength >= 20) {
                try {
                    console.log("Starting automated AI analysis...");
                    const aiResult = await Analyzer.generateRealAISentences(state, finalResult.mainType);
                    
                    // Check if it's a real AI result or a fallback from generateRealAISentences
                    const isFallback = Array.isArray(aiResult) && aiResult[0] && aiResult[0].includes('AI API 자동 실패');
                    
                    finalResult.aiSentences = Array.isArray(aiResult) ? aiResult : [aiResult];
                    aiReportText = finalResult.aiSentences.join('\n\n');
                    aiSuccess = !isFallback;
                } catch (aiErr) {
                    console.warn("AI Analysis failed, using fallback:", aiErr.message);
                    const fallback = Analyzer.generateAISentences(state, finalResult.mainType);
                    finalResult.aiSentences = fallback;
                    aiReportText = fallback.join('\n\n');
                    aiSuccess = false;
                }
            } else {
                console.log("Reasoning too short for AI analysis, using fallback.");
                const fallback = Analyzer.generateAISentences(state, finalResult.mainType);
                finalResult.aiSentences = fallback;
                aiReportText = fallback.join('\n\n');
                aiSuccess = false;
            }

            // 3. Prepare merged data for Supabase
            const resultData = {
                username: localStorage.getItem('savedUsername') || 'anonymous',
                name: state.user.name,
                grade: state.user.grade,
                main_type: finalResult.mainType.name,
                top_tags: finalResult.topTags.join(', '),
                details: {
                    summaries: finalResult.categorySummaries.map(s => s.summary).join(' | '),
                    categoryReasons: state.categoryReasons,
                    answers: state.answers,
                    ai_report: aiReportText,
                    ai_success: aiSuccess
                }
            };

            // 4. Single Save to Supabase
            console.log("Saving final results to Supabase (Single Step)...");
            const { data: savedData, error: saveError } = await window.sb.from('career_test_results')
                .insert([resultData])
                .select('id')
                .single();

            const currentId = savedData?.id;
            if (saveError) {
                console.error("Supabase Save Error:", saveError.message);
            } else {
                console.log("Final result saved successfully. ID:", currentId);
            }

            // 5. Render Final UI (AI report is already there)
            UI.renderFinalResult(finalResult, state.user, 
                () => { // onRestart
                    state.reset();
                    this.start();
                },
                async (container) => { // onRetry (Manual Retry)
                    const loadingInterval = UI.renderDeepAnalyzeProgress(container);
                    try {
                        const aiResult = await Analyzer.generateRealAISentences(state, finalResult.mainType);
                        if (loadingInterval) clearInterval(loadingInterval);
                        
                        finalResult.aiSentences = Array.isArray(aiResult) ? aiResult : [aiResult];
                        const newReportText = finalResult.aiSentences.join('\n\n');

                        // Update DB if we have an ID
                        if (currentId) {
                            const newDetails = { ...resultData.details, ai_report: newReportText, ai_success: true };
                            await window.sb.from('career_test_results').update({ details: newDetails }).eq('id', currentId);
                        }

                        container.innerHTML = `
                            <div id="ai-report-text-content" style="position:relative; z-index: 2; text-align:left; line-height:2.0; font-size: 1.1rem; white-space: pre-wrap; color: rgba(255,255,255,0.95); animation: fade-in 1s ease-out;">
                                ${finalResult.aiSentences.join('<br><br>')}
                            </div>
                        `;
                    } catch (err) {
                        if (loadingInterval) clearInterval(loadingInterval);
                        alert("다시 시도했으나 오류가 발생했습니다: " + err.message);
                    }
                },
                aiSuccess
            );

        } catch(e) {
            console.error("Critical Error in showFinalResult:", e);
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
