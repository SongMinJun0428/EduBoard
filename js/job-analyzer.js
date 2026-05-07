window.Analyzer = {
    
    /**
     * Determines the main Result Type based on tag counts
     */
    calculateMainType(tagCounts) {
        let maxNormalizedScore = -1;
        let topType = RESULT_TYPES[0];

        // 1. Calculate max possible scores for each type to normalize
        const typeMaxScores = {};
        RESULT_TYPES.forEach(rt => {
            let totalMax = 0;
            QUESTIONS.forEach(q => {
                let countA = 0;
                let countB = 0;
                rt.keywords.forEach(kw => {
                    if (q.tagsA && q.tagsA.includes(kw)) countA++;
                    if (q.tagsB && q.tagsB.includes(kw)) countB++;
                });
                totalMax += Math.max(countA, countB);
            });
            typeMaxScores[rt.id] = (totalMax || 1);
        });

        // 2. Find the type with the highest normalized score
        RESULT_TYPES.forEach(rt => {
            let rawScore = 0;
            rt.keywords.forEach(kw => {
                if (tagCounts[kw]) {
                    rawScore += tagCounts[kw];
                }
            });
            const normalizedScore = rawScore / typeMaxScores[rt.id];
            if (normalizedScore > maxNormalizedScore) {
                maxNormalizedScore = normalizedScore;
                topType = rt;
            }
        });

        return {
            type: topType,
            score: Math.round(maxNormalizedScore * 100)
        };
    },

    /**
     * Generates summaries for each category
     */
    generateCategorySummaries(state) {
        return CATEGORIES.map(cat => {
            const topTags = state.getTopTagsForCategory(cat.id, 2);
            let tagsText = topTags.join(', ');
            if (topTags.length === 0) tagsText = "\ub2f9\uc2e0\uc758 \uac00\uce58";
            
            return {
                id: cat.id,
                title: cat.title,
                summary: cat.summaryTemplate.replace("[TOP_TAGS]", tagsText)
            };
        });
    },

    /**
     * Pseudo-AI logic to generate dynamic insight sentences
     */
    generateAISentences(state, topType) {
        const sentences = [];
        const topOverall = state.getAllTopTags(3);
        const tag1 = topOverall[0] || "\uac00\uce58";
        const tag2 = topOverall[1] || "\uc601\uc5ed";

        sentences.push(`\ub2f9\uc2e0\uc758 \uc9c1\uc5c5 \uc120\ud0dd\uc5d0 \uc788\uc5b4 \ubb34\uc5c7\ubcf4\ub2e4\ub3c4 '${tag1}'\uacfc '${tag2}'\ub97c \uc911\uc694\ud558\uac8c \uace0\ub824\ud558\ub294 \ud3b8\uc785\ub2c8\ub2e4.`);

        if (topOverall.includes("\ud611\ub825") || topOverall.includes("\uc0ac\ub78c") || topOverall.includes("\uc18c\ud1b5")) {
            sentences.push("\ud63c\uc790\ub9cc\uc758 \ubaa8\uc785\ubcf4\ub2e4\ub294 \ud611\ub825\uacfc \uc0c1\ud638\uc791\uc6a9\uc774 \uc788\ub294 \ud658\uacbd\uc5d0\uc11c \ub354 \ub3d9\uae30\ubd80\uc5ec\ub97c \ubc1b\uc744 \uac00\ub2a5\uc131\uc774 \uc788\uc2b5\ub2c8\ub2e4.");
        } else if (topOverall.includes("\ub3c5\ub9bd") || topOverall.includes("\uc9d1\uc911") || topOverall.includes("\ubd84\uc11d")) {
            sentences.push("\uc77c\ub2e8\uc740 \ubcf5\uc7a1\ud55c \uc18c\ud1b5\ubcf4\ub2e4\ub294 \ub3c5\ub9bd\uc801\uc73c\ub85c \uc0c1\ud669\uc744 \ubd84\uc11d\ud558\uace0 \ud574\uacb0\ucc45\uc744 \ucc3e\ub294 \ud658\uacbd\uc744 \uc120\ud638\ud569\ub2c8\ub2e4.");
        }

        if (topOverall.includes("\uc131\uc7a5") || topOverall.includes("\ub3c4\uc804")) {
            sentences.push("\uc0c1\ub2f9\ud55c \uc548\uc815\uc801\uc778 \ud604\uc2e4\uc5d0 \uc548\uc8fc\ud558\uae30\ubcf4\ub2e4, \uc0c8\ub85c\uc6b4 \ubaa9\ud45c\ub97c \ud5a5\ud574 \ub3c4\uc804\ud560 \ub54c \uac00\uc7a5 \ube5b\ub098\ub294 \uc720\ud615\ub2cc\ub2c8\ub2e4.");
        } else if (topOverall.includes("\uc548\uc815") || topOverall.includes("\uaddc\ucc59")) {
            sentences.push("\ubd88\ud655\uc2e4\ud55c \ubcc0\uc218\ubcf4\ub2e4\ub294 \uc608\uce21 \uac00\ub2a5\ud55c \ucccc\uacc4\uc801\uc778 \ud658\uacbd\uc5d0\uc11c \uc548\uc815\uac10\uc744 \ub210\ub07c\uba70 \uc2e4\ub825\uc744 \ubc1c\ud718\ud569\ub2c8\ub2e4.");
        }

        sentences.push(`\ub530\ub77c\uc11c \uc9c1\uc5c5\uc744 \uc815\ud560 \ub54c\ub294 "${topType.keywords[0]}" \uc911\uc2ec\uc758 \ud65c\ub3d9\uc774\ub098 "${topType.keywords[1]}" \ud658\uacbd\uc744 \uc885\ud569\uc801\uc73c\ub85c \uac80\ud1a0\ud574\ubcf4\ub294 \uac83\uc774 \uc88b\uc2b5\ub2c8\ub2e4.`);

        const allReasons = Object.values(state.answers).map(ans => ans.reason).join(' ');
        const customWords = [];
        if (/\uae08\uc81c|\uc218\uc785|\uae09\uc5ec/i.test(allReasons)) customWords.push('\ud604\uc2e4\uc801\uc778 \uae08\uc81c \ubcf4\uc0c1');
        if (/\uc131\uc7a5|\ubc1c\uc804|\uacbd\ud5d8/i.test(allReasons)) customWords.push('\uc790\uae30\uc131\uc7a5\uacfc \uc131\ucde8');
        if (/\uc548\uc815|\ub8e8\ud2f4|\ubcf4\uc7a5/i.test(allReasons)) customWords.push('\uc548\uc815\uc801\uc778 \uc0dd\ud65c');
        if (/\uc0ac\ub78c|\uad00\uacc4|\uc18c\ud1b5/i.test(allReasons)) customWords.push('\uc778\uac04\uad00\uacc4\uc640 \uc870\ud654');
        if (/\uc6cc\ub77c\ubca8|\uc5ec\uac00|\uade0\ud615/i.test(allReasons)) customWords.push('\uc77c\uacfc \uc0b6\uc758 \uade0\ud615');
        
        if (customWords.length > 0) {
            const uniqueWords = [...new Set(customWords)].slice(0, 3);
            sentences.push(`\u2728 <b>[\ud575\uc2ec \ud0a4\uc6cc\ub4dc \uacb0\ud569 \ubd84\uc11d]</b><br>\uc9c1\uc811 \uc801\uc5b4\uc8fc\uc2e0 \uc18c\uc911\ud55c \uace0\ubbfc\uc758 \ud754\uc801\uc744 \uc9da\uc5b4\ubcf4\ub2e4, <b>'${uniqueWords.join(`', '`)}'</b>\uc5d0 \ub300\ud574 \uae4a\uc740 \uac00\uce58\ub97c \ub440\uace0 \uc788\uc74c\uc744 \ubcfc \uc218 \uc788\uc5c8\uc2b5\ub2c8\ub2e4. \uc774 \ubd84\ubd84\uc740 \ud6d7\ub0a0 \uc5b4\ub5a4 \uc9c1\uc5c5\uc744 \ud0dd\ud558\ub4e0 \uc2a4\uc2a4\ub85c\ub97c \uc9c0\ud0f1\ud574 \uc904 \uc911\uc694\ud55c \uae30\uc900\uc774 \ub420 \uac83\uc785\ub2c8\ub2e4!`);
        }
        return sentences;
    },

    calculateTraits(tagCounts) {
        // User requested 10 specific traits
        const mapping = {
            "\ucc3d\uc758\uc131": ["\ucc3d\uc758", "\ubc1c\uc0c1", "\uc0c1\uc0c1\ub825", "\uc608\uc220"],
            "\ubd84\uc11d\ub825": ["\ubd84\uc11d", "\ub17c\ub9ac", "\ub370\uc774\ud130", "\uc815\ud655\uc131", "\ucccc\uacc4"],
            "\ub9ac\ub354\uc2ed": ["\ub9ac\ub354\uc2ed", "\uc601\ud5a5\ub825", "\ucc45\uc784", "\ubb34\ub300", "\ub9ac\ub354"],
            "\uc0ac\uad50\uc131": ["\uc18c\ud1b5", "\ud611\uc5c5", "\ud300\uc6cc\ud06c", "\uc0ac\ub78c", "\uad00\uacc4"],
            "\uacf5\uac10\ub825": ["\uacf5\uac10", "\ubc30\ub824", "\uc9c0\uc6d0", "\ub098\ub214", "\ubcf4\ub78c"],
            "\uc804\ubb38\uc131": ["\uae30\uc220", "\uc804\ubb38\uc131", "\uae4a\uc774", "\uc644\uc131", "\uc7a5\uc778"],
            "\ub3c5\ub9bd\uc131": ["\ub3c5\ub9bd", "\uac1c\uc778", "\uc9d1\uc911", "\uc790\uc720", "\uc9fc\ub3c4"],
            "\uc548\uc815\uc131": ["\uc548\uc815", "\uaddc\ucc59", "\uc815\ucc29", "\ubcf4\uc548", "\ubcf4\uc99d", "\uc9c0\uc18d"],
            "\uc758\ubbf8 \ucd94\uad6c": ["\uc758\ubbf8", "\uc0ac\ud68c\uac00\uce58", "\uae30\uc5ec", "\uc9c4\uc815\uc131", "\uac00\uce58"],
            "\uc131\uc7a5\uc695": ["\uc131\uc7a5", "\ub3c4\uc804", "\ubcc0\ud654", "\uc131\ucde8", "\ub3c4\uc57d", "\uc5f4\uc815"]
        };

        const traits = [];
        for (const [traitName, tags] of Object.entries(mapping)) {
            // 1. Calculate max possible score
            let totalMax = 0;
            QUESTIONS.forEach(q => {
                let countA = 0; let countB = 0;
                tags.forEach(t => {
                    if (q.tagsA && q.tagsA.includes(t)) countA++;
                    if (q.tagsB && q.tagsB.includes(t)) countB++;
                });
                totalMax += Math.max(countA, countB);
            });
            const traitMax = totalMax || 1;

            // Calculate actual score with base activity for 'professional' look
            let score = 0;
            tags.forEach(t => { score += (tagCounts[t] || 0); });
            
            // 3. Normalize with Laplace Smoothing (Avoid absolute 0%, like MBTI/Psychometric tests)
            // Current Score + 1 / Max Possible + 2
            const smoothedRatio = (score + 0.5) / (traitMax + 1);
            const percent = Math.min(95, Math.max(15, Math.round(smoothedRatio * 100)));
            traits.push({ name: traitName, value: percent });
        }
        return traits;
    },

    compileFinalResult(state) {
        const top3Tags = state.getAllTopTags(3);
        const mainResult = this.calculateMainType(state.tagCounts);
        const categorySummaries = this.generateCategorySummaries(state);
        const traits = this.calculateTraits(state.tagCounts);
        const aiSentences = this.generateAISentences(state, mainResult.type);
        const choiceReview = QUESTIONS.map(q => {
            const ans = state.answers[q.id];
            return {
                id: q.id, title: q.title, selectedOption: ans ? ans.selectedOption : null,
                choice: ans ? (ans.selectedOption === 'A' ? q.optionA : q.optionB) : "\ubbf8\uc120\ud0dd",
                reason: ans ? ans.reason : "\uc774\uc720\ub97c \uc801\uc9c0 \uc54a\uc558\uc5b4\uc694"
            };
        });
        return { topTags: top3Tags, mainType: mainResult.type, categorySummaries, traits, choiceReview, aiSentences };
    },

    async generateRealAISentences(state, topType) {
        try {
            const apiKey = state.user.apiKey;
            const provider = state.user.apiProvider || 'gemini';
            let qaContext = "";
            CATEGORIES.forEach((cat) => {
                qaContext += `--- [\u200b${cat.title}\u200b] \ud30c\ud2b8 ---\n`;
                if (!state.categoryQuestions[cat.id]) return;
                state.categoryQuestions[cat.id].forEach(q => {
                    const ans = state.answers[q.id];
                    if (ans) {
                        const chosenText = ans.selectedOption === 'A' ? q.optionA : q.optionB;
                        qaContext += `- \uc120\ud0dd: ${chosenText}\n`;
                    }
                });
                const relevantReasons = Object.keys(state.categoryReasons).filter(key => key.startsWith(cat.id)).map(key => state.categoryReasons[key]);
                const reasonText = relevantReasons.length > 0 ? relevantReasons.join(' / ') : "\uc774\uc720 \ubbf8\uc791\uc131";
                qaContext += `=> \uac00\uce58\ub4e4 \uc120\ud0dd \uc774\uc720: ${reasonText}\n\n`;
            });

            let text = ""; let lastError = ""; let success = false;
            if (provider === 'gemini') {
                // Models updated based on ListModels result 2026-03-27
                const models = [
                    'gemini-3-flash-preview',       // 1순위 (정확한 ID 확인됨)
                    'gemini-3.1-flash-lite-preview', // 변형 모델
                    'gemini-2.5-flash',             // 2순위 (작동 확인됨)
                    'gemini-2.0-flash', 
                    'gemini-1.5-flash'
                ];
                const keys = [];
                if (window.AI_CONFIG && window.AI_CONFIG.primaryUrl && !window.AI_CONFIG.primaryUrl.startsWith('http')) {
                    keys.push(window.AI_CONFIG.primaryUrl);
                }
                if (window.AI_CONFIG && window.AI_CONFIG.backupUrl && !window.AI_CONFIG.backupUrl.startsWith('http')) {
                    keys.push(window.AI_CONFIG.backupUrl);
                }
                const userKey = (apiKey && apiKey !== 'hardcoded') ? apiKey : "AIzaSyDqcCPtLZkB6vv4gJoEvp7CfbHmTfI0SN8";
                if (!keys.includes(userKey)) keys.push(userKey);

                const fullPrompt = `\uc2e0\ubd84: 20\ub144 \uacbd\ub825\uc758 \ubca0\ud14c\ub791 \uc9c4\ub85c \ucee8\uc124\ud134\ud2b8 \uba54\ud1a0
\ubbf8\uc158: \ud559\uc0dd '${state.user.name}'\uc758 \uc120\ud0dd \uc544\uc774\ud15c\uacfc \uc9c1\uc811 \uc791\uc131\ud55c \uc774\uc720\ub97c \uae30\ubc18\uc73c\ub85c 2000\uc790 \uc774\uc0c1\uc758 \uc2ec\ucc3d \ubd84\uc11d \ub9ac\ud3ec\ud2b8 \uc791\uc131
\ud3ec\ub9b7: \ud559\uc0dd\uc758 \uc774\ub984\uc744 \uc2e4\uba85\uc73c\ub85c \ubd80\ub974\uba70, \uc544\uc8fc \ub530\ub0bb\ud558\uace0 \uc815\uc131\uc2a4\ub7ec\uc6b4 \uc5d0\uc138\uc774 \ud615\uc2dd\uc73c\ub85c \uc811\uadfc\ud558\uc138\uc694. 
\ub0b4\uc6a9:
${qaContext}`;

                for (const key of keys) {
                    for (const modelName of models) {
                        const targetUrls = [
                            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`,
                            `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${key}`
                        ];
                        for (const url of targetUrls) {
                            try {
                                console.log(`[Gemini API Request] Attempting ${modelName} with key ${key.substring(0,6)}...`);
                                const response = await fetch(url, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 8000 } })
                                });
                                if (!response.ok) { lastError = `Status ${response.status}`; continue; }
                                const data = await response.json();
                                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                                    text = data.candidates[0].content.parts[0].text;
                                    success = true;
                                    break;
                                }
                            } catch (e) { lastError = e.message; }
                        }
                        if (success) break;
                    }
                    if (success) break;
                }
                if (!success) throw new Error(`Gemini API Failed: ${lastError}`);
            }
            return [`\u2728 <b>[\uc2e4\uc81c AI \uc2ec\uce35 \ubd84\uc11d \ub9ac\ud3ec\ud2b8]</b><br><br><div style="text-align:left; line-height:1.8; font-size:1.05rem; white-space: pre-wrap;">` + text + `</div>`];
        } catch(e) {
            console.error('AI API Error:', e);
            const fallback = this.generateAISentences(state, topType);
            fallback.unshift(`\u26a0\ufe0f AI API \uc790\ub3d9 \uc2e4\ud328. \uc624\ud504\ub77c\uc778 \ubd84\uc11d \uacb0\uacfc\ub85c \ub300\uccb4\ub418\uc5c8\uc2b5\ub2c8\ub2e4.`);
            return fallback;
        }
    },

    async compileFinalResultAsync(state) {
        const top3Tags = state.getAllTopTags(3);
        const mainResult = this.calculateMainType(state.tagCounts);
        const categorySummaries = this.generateCategorySummaries(state);
        const traits = this.calculateTraits(state.tagCounts);
        const choiceReview = QUESTIONS.map(q => {
            const ans = state.answers[q.id];
            return {
                id: q.id, title: q.title, selectedOption: ans ? ans.selectedOption : null,
                choice: ans ? (ans.selectedOption === 'A' ? q.optionA : q.optionB) : "\ubbf8\uc120\ud0dd",
                reason: ans ? ans.reason : "\uc774\uc720\ub97c \uc801\uc9c0 \uc54a\uc558\uc5b4\uc694"
            };
        });
        return { topTags: top3Tags, mainType: mainResult.type, categorySummaries, traits, choiceReview, aiSentences: [] };
    }
};
