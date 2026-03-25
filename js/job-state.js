
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
        
        // answers will store: { questionId: { selectedOption: 'A', reason: '...' } }
        this.answers = {};
        
        // tagCounts will store: { "보상": 3, "성장": 5, ... }
        this.tagCounts = {};

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

    nextStep() {
        // Returns "question_next", "category_summary", or "finished"
        const cat = this.getCurrentCategory();
        const maxQ = this.categoryQuestions[cat.id].length;
        
        if (this.currentQuestionIndex < maxQ - 1) {
            this.currentQuestionIndex++;
            return "question_next";
        } else {
            // Reached end of category
            if (this.currentCategoryIndex < CATEGORIES.length - 1) {
                return "category_summary";
            } else {
                return "finished";
            }
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
        
        QUESTIONS.forEach(q => {
            const options = ['A', 'B'];
            const selected = options[Math.floor(Math.random() * options.length)];
            const tags = selected === 'A' ? q.tagsA : q.tagsB;
            const chosenText = selected === 'A' ? q.optionA : q.optionB;
            
            this.saveAnswer(q.id, selected, tags, `테스트: ${chosenText} 성향이 저의 가치관과 더 잘 맞는다고 생각합니다.`);
        });

        this.currentCategoryIndex = CATEGORIES.length - 1;
        this.currentQuestionIndex = this.categoryQuestions[CATEGORIES[this.currentCategoryIndex].id].length - 1;
    }
}

const state = new AppState();
