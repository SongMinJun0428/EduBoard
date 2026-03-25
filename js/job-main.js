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
        
        UI.renderIntermediateSummary(cat, topTags, () => {
            state.nextCategory();
            this.showCategoryIntro();
        });
    }

    async showFinalResult() {
        UI.renderAnalyzingScreen();
        try {
            // Get base results (tags, type, etc.)
            const finalResult = await Analyzer.compileFinalResultAsync(state);
            
            UI.renderFinalResult(finalResult, state.user, 
                () => { // onRestart
                    state.reset();
                    this.start();
                },
                async (container) => { // onDeepAnalyze (Click handler)
                    try {
                        const sentences = await Analyzer.generateRealAISentences(state, finalResult.mainType);
                        container.innerHTML = sentences.join('<br><br>');
                    } catch(err) {
                        console.error(err);
                        container.innerHTML = `
                            <div style="padding: 20px; color: #d32f2f; background: #ffebee; border-radius: 8px;">
                                ⚠️ AI 분석 중 오류가 발생했습니다.<br>
                                사유: ${err.message}<br><br>
                                <button onclick="location.reload()" class="btn btn-secondary" style="padding: 8px 15px; font-size: 0.9rem;">새로고침 후 다시 시도</button>
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
