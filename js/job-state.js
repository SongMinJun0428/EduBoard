
class AppState {
    constructor() {
        this.reset();
    }

    reset() {
        this.user = {
            name: "",
            grade: "",
            modeDetail: "short",
            modeGroup: "solo",
            apiKey: "",
            apiProvider: "gemini"
        };
        
        // answers will store: { questionId: { selectedOption: 'A', tags: [...] } }
        this.answers = {};
        
        // tagCounts will store: { "보상": 3, "성장": 5, ... }
        this.tagCounts = {};

        // categoryReasons will store: { "categoryId": "reason user typed after 5 questions" }
        this.categoryReasons = {};

        this.currentCategoryIndex = 0;
        this.currentQuestionIndex = 0;
        
        // Pre-compute category ranges for easy navigation
        this.categoryQuestions = {};
        CATEGORIES.forEach(cat => {
            this.categoryQuestions[cat.id] = QUESTIONS.filter(q => q.category === cat.id);
        });
    }

    setUserForm(name, grade, modeDetail, modeGroup, apiKey, apiProvider) {
        this.user.name = name;
        this.user.grade = grade;
        this.user.modeDetail = modeDetail;
        this.user.modeGroup = modeGroup;
        this.user.apiKey = apiKey;
        this.user.apiProvider = apiProvider;
    }

    getCurrentCategory() {
        return CATEGORIES[this.currentCategoryIndex] || null;
    }

    getCurrentQuestion() {
        const cat = this.getCurrentCategory();
        if (!cat) return null;
        return this.categoryQuestions[cat.id][this.currentQuestionIndex];
    }

    getCurrentCategoryProgress() {
        const cat = this.getCurrentCategory();
        if (!cat) return { current: 0, total: 1 };
        return {
            current: this.currentQuestionIndex + 1,
            total: this.categoryQuestions[cat.id].length
        };
    }

    saveAnswer(questionId, selectedOption, tags, reason) {
        this.answers[questionId] = { selectedOption, tags, reason };
        
        // Accumulate tags
        tags.forEach(tag => {
            this.tagCounts[tag] = (this.tagCounts[tag] || 0) + 1;
        });
    }

    saveCategoryReason(categoryId, reason) {
        this.categoryReasons[categoryId] = reason;
    }

    nextStep() {
        // Returns "question_next", "category_summary", or "finished"
        const cat = this.getCurrentCategory();
        const maxQ = this.categoryQuestions[cat.id].length;
        const totalAnswered = Object.keys(this.answers).length;

        // Check if we should show reasoning (every 5 questions OR end of category)
        // 1. Check if we hit a 5-question milestone WITHIN a category
        // (But only if we are not at the very end of the category, so we don't double trigger)
        if (totalAnswered % 5 === 0 && this.currentQuestionIndex < maxQ - 1) {
            return "category_summary";
        }
        
        // 2. Move to next question if available in current category
        if (this.currentQuestionIndex < maxQ - 1) {
            this.currentQuestionIndex++;
            return "question_next";
        } else {
            // 3. Reached end of category -> Always summarize to ensure no questions are left out
            return "category_summary";
        }
    }

    nextCategory() {
        this.currentCategoryIndex++;
        this.currentQuestionIndex = 0;
    }

    // Advanced tag retrieval
    getTopTagsForCategory(categoryId, limit = 3) {
        const qList = this.categoryQuestions[categoryId];
        let catTags = {};
        qList.forEach(q => {
            const ans = this.answers[q.id];
            if (ans && ans.tags) {
                ans.tags.forEach(t => {
                    catTags[t] = (catTags[t] || 0) + 1;
                });
            }
        });

        return Object.entries(catTags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(e => e[0]);
    }

    getAllTopTags(limit = 3) {
        return Object.entries(this.tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(e => e[0]);
    }
    seedTestData() {
        this.answers = {};
        this.tagCounts = {};
        this.categoryReasons = {};
        
        const personalities = [
            ['성장', '도전', '창의', '리더십', '경험'], // The Challenger
            ['안정', '현실', '현실', '현실', '규칙', '분석'], // The Realist
            ['공감', '사람', '소통', '보람', '협업'], // The Supporter
            ['기술', '전문성', '집중', '독립', '논리'] // The Specialist
        ];
        const biasTags = personalities[Math.floor(Math.random() * personalities.length)];

        QUESTIONS.forEach((q, idx) => {
            // Check which option matches the bias more
            let scoreA = 0; let scoreB = 0;
            if (q.tagsA) q.tagsA.forEach(t => { if (biasTags.includes(t)) scoreA++; });
            if (q.tagsB) q.tagsB.forEach(t => { if (biasTags.includes(t)) scoreB++; });

            let selected = 'A';
            if (scoreA > scoreB) selected = (Math.random() < 0.8) ? 'A' : 'B';
            else if (scoreB > scoreA) selected = (Math.random() < 0.8) ? 'B' : 'A';
            else selected = (Math.random() < 0.5) ? 'A' : 'B';

            const tags = selected === 'A' ? q.tagsA : q.tagsB;
            const chosenText = selected === 'A' ? q.optionA : q.optionB;
            
            this.saveAnswer(q.id, selected, tags, `테스트: ${chosenText} 성향이 저의 가치관과 더 잘 맞는다고 생각합니다.`);
            
            // Add dummy category reasons every 5 questions
            if ((idx + 1) % 5 === 0) {
                this.saveCategoryReason(q.category + "_" + (idx + 1), "테스트: 이 5가지 선택지에 대한 종합적인 가치관 분석입니다.");
            }
        });

        this.currentCategoryIndex = CATEGORIES.length - 1;
        this.currentQuestionIndex = this.categoryQuestions[CATEGORIES[this.currentCategoryIndex].id].length - 1;
    }
}

const state = new AppState();
