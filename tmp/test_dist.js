const fs = require('fs');
const path = require('path');

// Mock browser global arrays
let CATEGORIES = [];
let QUESTIONS = [];
let RESULT_TYPES = [];

// Read job-data.js and extract the variable values (simple regex or eval)
const dataFilePath = 'c:/Users/송민준/Desktop/영재학급/01.코드(업로드)/js/job-data.js';
const dataCode = fs.readFileSync(dataFilePath, 'utf8');

// Use eval in a controlled way for mocking
const mockContext = { 
    CATEGORIES: [], 
    QUESTIONS: [], 
    RESULT_TYPES: [] 
};

// We need to strip "const" to eval correctly in this context or just use eval directly
eval(dataCode); 

function calculateMainTypeMock(tagCounts) {
    let maxNormalizedScore = -1;
    let topType = RESULT_TYPES[0];

    const typeMaxScores = {};
    RESULT_TYPES.forEach(rt => {
        let totalMax = 0;
        QUESTIONS.forEach(q => {
            let countA = 0, countB = 0;
            if (q.tagsA) rt.keywords.forEach(kw => { if (q.tagsA.includes(kw)) countA++; });
            if (q.tagsB) rt.keywords.forEach(kw => { if (q.tagsB.includes(kw)) countB++; });
            totalMax += Math.max(countA, countB);
        });
        typeMaxScores[rt.id] = (totalMax || 1);
    });

    RESULT_TYPES.forEach(rt => {
        let rawScore = 0;
        rt.keywords.forEach(kw => {
            if (tagCounts[kw]) rawScore += tagCounts[kw];
        });
        const normalizedScore = rawScore / typeMaxScores[rt.id];
        if (normalizedScore > maxNormalizedScore) {
            maxNormalizedScore = normalizedScore;
            topType = rt;
        }
    });
    return topType;
}

const iterations = 20000;
const counts = {};
RESULT_TYPES.forEach(rt => counts[rt.id] = 0);

for (let i = 0; i < iterations; i++) {
    const tagCounts = {};
    QUESTIONS.forEach(q => {
        const tags = Math.random() > 0.5 ? q.tagsA : q.tagsB;
        if (tags) {
            tags.forEach(t => {
                tagCounts[t] = (tagCounts[t] || 0) + 1;
            });
        }
    });
    const res = calculateMainTypeMock(tagCounts);
    counts[res.id]++;
}

console.log("\n[ 20,000회 시뮬레이션 결과 ]");
console.log("-----------------------------------------");
RESULT_TYPES.forEach(rt => {
    const count = counts[rt.id];
    const percent = ((count / iterations) * 100).toFixed(2);
    console.log(`${rt.name.padEnd(10)}: ${count.toString().padStart(6)}회 (${percent}%)`);
});
console.log("-----------------------------------------");
