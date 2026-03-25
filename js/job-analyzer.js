const Analyzer = {
    
    /**
     * Determines the main Result Type based on tag counts
     */
    calculateMainType(tagCounts) {
        let maxScore = -1;
        let topType = RESULT_TYPES[0];

        RESULT_TYPES.forEach(rt => {
            let score = 0;
            rt.keywords.forEach(kw => {
                if (tagCounts[kw]) {
                    score += tagCounts[kw];
                }
            });
            if (score > maxScore) {
                maxScore = score;
                topType = rt;
            }
        });

        return {
            type: topType,
            score: maxScore
        };
    },

    /**
     * Generates summaries for each category
     */
    generateCategorySummaries(state) {
        return CATEGORIES.map(cat => {
            const topTags = state.getTopTagsForCategory(cat.id, 2);
            let tagsText = topTags.join(', ');
            if (topTags.length === 0) tagsText = "다양한 가치";
            
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
        const tag1 = topOverall[0] || "가치";
        const tag2 = topOverall[1] || "의미";

        // Sentence 1: Core Value
        sentences.push(`당신은 직업을 선택할 때 무엇보다도 '${tag1}'과(와) '${tag2}'을(를) 중요하게 고려하는 편입니다.`);

        // Sentence 2: Match with specific keywords
        if (topOverall.includes("협업") || topOverall.includes("사람") || topOverall.includes("소통")) {
            sentences.push("혼자만의 몰입보다는 협력과 상호작용이 있는 환경에서 큰 동기부여를 받을 가능성이 높습니다.");
        } else if (topOverall.includes("독립") || topOverall.includes("집중") || topOverall.includes("분석")) {
            sentences.push("팀 단위의 복잡한 소통보다는, 독립적으로 상황을 분석하고 통제할 수 있는 환경을 선호합니다.");
        }

        if (topOverall.includes("성장") || topOverall.includes("도전")) {
            sentences.push("또한 안정적인 현실에 안주하기보다, 끊임없이 새로운 목표를 향해 도전할 때 가장 빛나는 유형입니다.");
        } else if (topOverall.includes("안정") || topOverall.includes("규칙")) {
            sentences.push("불확실한 변화보다는 예측 가능하고 체계적인 환경에서 안정감을 느끼며 역량을 발휘합니다.");
        }

        // Sentence 3: Career Design Connection
        sentences.push(`따라서 진로를 정할 때는 "${topType.keywords[0]}" 중심의 역할과 "${topType.keywords[1]}" 환경을 종합적으로 검토해보는 것이 좋습니다.`);

        // Analyze user's written reasons
        const allReasons = Object.values(state.answers).map(ans => ans.reason).join(' ');
        const customWords = [];
        if (/돈|연봉|수입|급여|경제/.test(allReasons)) customWords.push('현실적인 금전 보상');
        if (/재미|즐겁|행복|흥미/.test(allReasons)) customWords.push('스스로 느끼는 일의 재미');
        if (/안정|편안|정착|루틴/.test(allReasons)) customWords.push('예측 가능한 안정감');
        if (/성장|배움|발전|경험/.test(allReasons)) customWords.push('개인의 꾸준한 성장');
        if (/사람|소통|관계|친구/.test(allReasons)) customWords.push('사람들과의 긍정적인 관계');
        if (/워라밸|시간|휴식|퇴근|여유/.test(allReasons)) customWords.push('일과 삶의 균형(워라밸)');
        if (/가족|부모|자녀/.test(allReasons)) customWords.push('소중한 가족과의 시간');
        
        if (customWords.length > 0) {
            // Deduplicate and take top 3
            const uniqueWords = [...new Set(customWords)].slice(0, 3);
            sentences.push(`💡 <b>[핵심 키워드 결합 분석]</b><br>직접 적어주신 소중한 고민의 흔적들을 짚어보니, <b>'${uniqueWords.join(`', '`)}'</b>에 대한 깊은 가치관을 엿볼 수 있었습니다. 이 부분은 훗날 어떤 직업을 택하든 스스로를 지탱해 줄 훌륭한 기준점이 될 것입니다!`);
        }

        return sentences;
    },



    /**
     * Calculates secondary personality traits based on tag mapping
     */
    calculateTraits(tagCounts) {
        const mapping = {
            "창의성": ["창의", "발상", "기획", "예술", "아이디어"],
            "분석력": ["분석", "논리", "데이터", "정확성", "체계"],
            "리더십": ["리더", "영향력", "책임", "결단", "표현"],
            "사교성": ["사람", "소통", "협업", "관계", "팀워크"],
            "공감력": ["사람", "공감", "교육", "배려", "지원"],
            "전문성": ["기술", "전문성", "깊이", "장인", "실행"],
            "독립성": ["독립", "개인이", "집중", "자유", "탐색"],
            "안정성": ["안정", "규칙", "정착", "지속성", "현실"],
            "의미 추구": ["의미", "보람", "사회가치", "기여", "만족"],
            "성장욕": ["성장", "도전", "변화", "성취", "열정"]
        };

        const traits = [];
        for (const [trait, tags] of Object.entries(mapping)) {
            let score = 0;
            tags.forEach(tag => {
                score += (tagCounts[tag] || 0);
            });
            // Normalize: 8-10 tags = 100%
            const percent = Math.min(100, Math.round((score / 8) * 100));
            traits.push({ name: trait, value: percent });
        }
        return traits;
    },

    /**
     * Compiles all results cleanly for the UI
     */
    compileFinalResult(state) {
        const top3Tags = state.getAllTopTags(3);
        const mainResult = this.calculateMainType(state.tagCounts);
        const categorySummaries = this.generateCategorySummaries(state);
        const traits = this.calculateTraits(state.tagCounts);
        const aiSentences = this.generateAISentences(state, mainResult.type);

        // Prepare choice review data
        const choiceReview = QUESTIONS.map(q => {
            const ans = state.answers[q.id];
            return {
                id: q.id,
                title: q.title,
                selectedOption: ans ? ans.selectedOption : null,
                choice: ans ? (ans.selectedOption === 'A' ? q.optionA : q.optionB) : "미선택",
                reason: ans ? ans.reason : "이유를 적지 않았어요"
            };
        });

        return {
            topTags: top3Tags,
            mainType: mainResult.type,
            categorySummaries,
            traits,
            choiceReview,
            aiSentences
        };
    },

    async generateRealAISentences(state, topType) {
        try {
            const apiKey = state.user.apiKey;
            const provider = state.user.apiProvider || 'gemini';
            
            let qaContext = "";
            QUESTIONS.forEach((q, idx) => {
                const ans = state.answers[q.id];
                if (ans) {
                    const chosenText = ans.selectedOption === 'A' ? q.optionA : q.optionB;
                    const reasonText = ans.reason === "(이유 미작성)" ? "작성 안함" : ans.reason;
                    qaContext += `[질문 ${idx + 1}] ${q.title}\n선택한 답: ${chosenText}\n직접 쓴 이유: ${reasonText}\n\n`;
                }
            });

            const topTags = state.getAllTopTags(3).join(', ');
            
            const promptStr = `학생의 진로 밸런스 게임 결과입니다.
가치관 키워드: ${topTags}
결과 유형: ${topType.name} (${topType.desc})

[학생의 25개 문항별 선택 및 이유 전체 응답]
${qaContext}
이 데이터를 바탕으로 이 학생을 위한 [심도 있고 아주 자세한 진로 상담 에세이]를 한 편 작성해 주세요. 
단순한 3줄 요약이 아닙니다. 학생의 수많은 고뇌와 답변을 하나하나 짚어보며 전문가로서 깊이 있는 통찰을 담아 매우 정성스럽고 긴 글을 써주셔야 합니다.

글은 자연스럽게 다음 세 가지 섹션을 포함하도록 내용이 이어져야 합니다 (제목을 써주셔도 좋습니다):
1. 내면과 가치관 심층 분석: 학생이 작성한 이유들을 구체적으로 읽어보고, 어떤 가치에 움직이는 사람인지 묘사해 주세요. 이때 절대로 '질문 14', '문항 4' 같이 번호로만 언급하지 마세요. 대신 해당 질문의 '내용'을 자연스럽게 언급해야 합니다. (예: '안정적인 직장보다 도전을 선택하셨던 문항에서...', '보상보다 재미를 추구하는 모습에서...' 등)
2. 잠재된 강점 조명: 학생이 지닌 특별한 사고방식이나 태도를 크게 칭찬하며 본인만의 강점을 발견해 주세요. 
3. 맞춤형 진로 조언: 이 학생의 성향에 어울리는 구체적인 직업 환경이나 직무의 성격, 앞으로 고민해 볼 방향을 따뜻하게 조언해 주세요.`;

            let text = "";
            let success = false;
            let lastError = "";

            const apiKeys = [
                "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",
                "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"
            ];

            if (provider === 'gemini') {
                const geminiKey = (apiKey && apiKey !== 'hardcoded') ? apiKey : "AIzaSyB5u83XsNfw-QidE5BA3z6CjlHjjxPMfGk";
                const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-001'];
                
                for (const modelName of models) {
                    try {
                        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
                        console.log(`[Gemini API Request] URL: ${url}`);
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                system_instruction: { parts: [{ text: "당신은 청소년 진로 멘토입니다. 절대 '질문 14', '문항 4'와 같은 번호로 답변을 지칭하지 말고, 해당 문항의 '내용'을 요약하여 자연스럽게 언급하십시오." }] },
                                contents: [{ parts: [{ text: promptStr }] }] 
                            })
                        });
                        
                        if (!response.ok) {
                            throw new Error(`Model ${modelName} failed: ${response.status}`);
                        }
                        
                        const data = await response.json();
                        text = data.candidates[0].content.parts[0].text;
                        success = true;
                        break; // success!
                    } catch (err) {
                        lastError = err.message;
                        console.warn(`Gemini Model ${modelName} failed, trying next...`);
                    }
                }
                
                if (!success) {
                    throw new Error(`Gemini 모든 모델 호출 실패 (마지막 에러: ${lastError})`);
                }
            } else {
                // OpenAI Loop (as before)
                const url = `https://api.openai.com/v1/chat/completions`;
                const reqBody = {
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "당신은 청소년 학생들을 진심으로 사랑하고, 그들의 사소한 메모 하나에서도 엄청난 잠재력을 발견해 주는 최고의 진로 멘토입니다. 매우 길고 따뜻하며 논리적인 장문의 분석 글을 씁니다. 절대 '질문 14', '문항 4'와 같은 번호로 답변을 지칭하지 마세요. 대신 해당 문항의 '내용'을 요약하여 자연스럽게 언급하십시오." },
                        { role: "user", content: promptStr }
                    ],
                    max_tokens: 1500,
                    temperature: 0.7
                };

                for (const key of apiKeys) {
                    try {
                        console.log(`[OpenAI API Request] URL: ${url}, Model: ${reqBody.model}`);
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${key}`
                            },
                            body: JSON.stringify(reqBody)
                        });

                        if (!response.ok) {
                            const errData = await response.json().catch(() => ({}));
                            const errMsg = errData.error && errData.error.message ? errData.error.message : response.statusText;
                            throw new Error(`OpenAI Error ${response.status}: ${errMsg}`);
                        }
                        const data = await response.json();
                        text = data.choices[0].message.content;
                        success = true;
                        break;
                    } catch (err) {
                        lastError = err.message;
                        console.error(`Attempt failed [${reqBody.model}]: ${err.message}`);
                    }
                }

                if (!success) {
                    throw new Error(`모든 API 키 한도 초과 (마지막 에러: ${lastError})`);
                }
            }
            
            const sentences = text.split('\n').filter(s => s.trim().length > 0);
            return [`💡 <b>[실제 AI(OpenAI) 심층 분석 리포트]</b><br><br><div style="text-align:left; line-height:1.75; font-size:1.05rem;">` + sentences.join('<br><br>') + `</div>`];
        } catch(e) {
            console.error('AI API Error:', e);
            const fallback = this.generateAISentences(state, topType);
            fallback.unshift(`⚠️ AI API 연동 실패 (사유: ${e.message}). 오프라인 분석 결과로 대체되었습니다.`);
            return fallback;
        }
    },

    async compileFinalResultAsync(state) {
        const top3Tags = state.getAllTopTags(3);
        const mainResult = this.calculateMainType(state.tagCounts);
        const categorySummaries = this.generateCategorySummaries(state);
        
        // Initial screen now shows base results; AI is triggered by button
        const aiSentences = []; 

        return {
            topTags: top3Tags,
            mainType: mainResult.type,
            categorySummaries,
            aiSentences
        };
    }
};
