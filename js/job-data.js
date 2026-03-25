const CATEGORIES = [
    {
        id: "value",
        title: "가치관 탐색",
        description: "직업에서 무엇을 가장 중요하게 생각하는지 알아봅니다.",
        summaryTemplate: "당신은 가치관 탐색에서 [TOP_TAGS]을(를) 더 자주 선택했어요."
    },
    {
        id: "work_style",
        title: "일하는 방식 탐색",
        description: "어떤 업무 환경과 방식이 나에게 잘 맞는지 알아봅니다.",
        summaryTemplate: "일하는 방식에 있어서 당신은 [TOP_TAGS]을(를) 선호합니다."
    },
    {
        id: "aptitude",
        title: "적성 탐색",
        description: "나의 잠재적 강점과 잘 맞는 활동 성향을 알아봅니다.",
        summaryTemplate: "적성 탐색 결과, [TOP_TAGS] 쪽에서 큰 흥미나 강점을 보일 가능성이 높습니다."
    },
    {
        id: "life_direction",
        title: "삶의 방향 탐색",
        description: "직업 너머, 내가 원하는 삶의 형태를 그려봅니다.",
        summaryTemplate: "삶의 방향에서 당신은 [TOP_TAGS]을(를) 지향하는 경향이 있습니다."
    },
    {
        id: "decision",
        title: "진로 결정 심화",
        description: "실제 진로를 결정할 때 부딪히는 현실적 고민들을 다뤄봅니다.",
        summaryTemplate: "진로 결정 과정에서 [TOP_TAGS]을(를) 중요한 기준으로 고민합니다."
    }
];

const QUESTIONS = [
    // 1. 가치관 탐색
    {
        id: "v1", category: "value",
        title: "직업을 선택할 때 무엇이 더 중요한가요?",
        optionA: "연봉 높은 직업", tagsA: ["보상", "경제", "현실"],
        optionB: "행복한 직업", tagsB: ["행복", "만족", "삶의질"],
        followUp: ["돈이 많으면 만족도도 높아질까요?", "행복한 직업이라도 수입이 적으면 괜찮을까요?"]
    },
    {
        id: "v2", category: "value",
        title: "어떤 직장이 더 끌리나요?",
        optionA: "워라밸 좋은 직업", tagsA: ["여유", "삶의질", "안정"],
        optionB: "성장 기회 많은 직업", tagsB: ["성장", "도전", "성취"],
        followUp: ["개인의 여유 시간과 일에서의 성장 중 무엇이 내게 더 큰 원동력이 될까요?"]
    },
    {
        id: "v3", category: "value",
        title: "내가 바라는 미래의 모습은?",
        optionA: "가족과 시간 많은 직업", tagsA: ["가족", "안정", "정착"],
        optionB: "해외 경험 많은 직업", tagsB: ["경험", "도전", "자유"],
        followUp: ["새로운 세상을 보는 것과 소중한 사람과 함께하는 것 중 어느 쪽이 나를 숨 쉬게 할까요?"]
    },
    {
        id: "v4", category: "value",
        title: "어떤 보상을 더 원하나요?",
        optionA: "명확한 금전적 보상", tagsA: ["보상", "경제", "현실"],
        optionB: "사회적 기여와 보람", tagsB: ["의미", "보람", "사회가치"],
        followUp: ["남들이 인정해 주지 않아도 스스로 만족할 수 있는 일이 있을까요?"]
    },
    {
        id: "v5", category: "value",
        title: "나에게 맞는 환경은?",
        optionA: "안정적이고 익숙한 직업", tagsA: ["안정", "편안함", "지속성"],
        optionB: "새롭고 도전적인 직업", tagsB: ["도전", "변화", "성취"],
        followUp: ["살면서 한 번쯤 크게 실패하더라도 도전할 가치가 있을까요?"]
    },

    // 2. 일하는 방식 탐색
    {
        id: "w1", category: "work_style",
        title: "어떤 환경에서 일하고 싶나요?",
        optionA: "혼자 집중하는 직업", tagsA: ["독립", "개인", "집중"],
        optionB: "팀으로 협력하는 직업", tagsB: ["협업", "소통", "팀워크"],
        followUp: ["다른 사람과 함께할 때 아이디어가 더 잘 나오나요, 혼자 고민할 때 더 잘 나오나요?"]
    },
    {
        id: "w2", category: "work_style",
        title: "업무 공간의 선호는?",
        optionA: "쾌적한 사무실 근무", tagsA: ["사무", "정착", "안정"],
        optionB: "이동이 많은 현장 활동", tagsB: ["현장", "활동", "역동성"],
        followUp: ["가만히 앉아있는 것이 편한가요, 돌아다니는 것이 에너지가 생기나요?"]
    },
    {
        id: "w3", category: "work_style",
        title: "일을 풀어나가는 방식은?",
        optionA: "끊임없이 아이디어 내기", tagsA: ["기획", "창의", "발상"],
        optionB: "주어진 기술로 실습/제작하기", tagsB: ["기술", "실행", "전문성"],
        followUp: ["생각하는 것에 탁월한가요, 직접 손으로 만들어내는 것에 탁월한가요?"]
    },
    {
        id: "w4", category: "work_style",
        title: "업무 시간에 대한 생각은?",
        optionA: "매일 일정한 규칙적인 근무", tagsA: ["규칙", "안정", "예측가능"],
        optionB: "상황에 맞춘 유동적인 근무", tagsB: ["유연성", "자유", "변화"],
        followUp: ["정해진 루틴이 없으면 불안한가요, 오히려 답답한가요?"]
    },
    {
        id: "w5", category: "work_style",
        title: "문제 상황에 직면했을 때?",
        optionA: "정해진 매뉴얼대로 해결", tagsA: ["규칙", "안정", "체계"],
        optionB: "스스로 새로운 방법 고안", tagsB: ["창의", "주도", "유연성"],
        followUp: ["정답이 없는 문제를 푸는 과정을 즐기나요?"]
    },

    // 3. 적성 탐색
    {
        id: "a1", category: "aptitude",
        title: "친구들과 과제를 할 때 나의 역할은?",
        optionA: "앞에 나가서 발표하기", tagsA: ["표현", "소통", "리더십"],
        optionB: "뒤에서 자료 찾고 글 쓰기", tagsB: ["기획", "분석", "지원"],
        followUp: ["주목받는 것을 즐기나요, 아니면 완벽하게 뒷받침하는 것을 선호하나요?"]
    },
    {
        id: "a2", category: "aptitude",
        title: "어떤 종류의 문제를 푸는 것이 더 재미있나요?",
        optionA: "상상력이 필요한 창의적인 문제", tagsA: ["창의", "예술", "발상"],
        optionB: "논리적이고 분석적인 문제", tagsB: ["분석", "논리", "정확성"],
        followUp: ["답이 딱 떨어지는 것이 좋은가요, 여러 가지 답이 가능한 것이 좋은가요?"]
    },
    {
        id: "a3", category: "aptitude",
        title: "누군가 어려움에 처했을 때 나는?",
        optionA: "공감하고 위로/가르쳐주기", tagsA: ["사람", "교육", "공감"],
        optionB: "상황을 분석하고 해결책 제시", tagsB: ["해결", "기술", "이성"],
        followUp: ["마음을 다루는 일이 편한가요, 사실과 데이터를 다루는 일이 편한가요?"]
    },
    {
        id: "a4", category: "aptitude",
        title: "둘 중 하나만 선택해야 한다면?",
        optionA: "사람들과 상호작용하는 일", tagsA: ["사람", "소통", "관계"],
        optionB: "자료, 기술을 다루는 일", tagsB: ["기술", "데이터", "집중"],
        followUp: ["사람에서 오는 스트레스가 클까요, 다루기 까다로운 자료/기술 오류의 스트레스가 클까요?"]
    },
    {
        id: "a5", category: "aptitude",
        title: "프로젝트를 시작할 때 나는?",
        optionA: "큰 그림을 먼저 상상한다", tagsA: ["기획", "통찰", "창의"],
        optionB: "세부적인 실천 계획부터 짠다", tagsB: ["실행", "꼼꼼함", "논리"],
        followUp: ["숲을 보는 편인가요, 나무를 보는 편인가요?"]
    },

    // 4. 삶의 방향 탐색
    {
        id: "l1", category: "life_direction",
        title: "미래에 어디서 살고 싶나요?",
        optionA: "한 지역에서 꾸준히 정착하기", tagsA: ["정착", "안정", "관계지속"],
        optionB: "여러 지역/국가를 이동하며 살기", tagsB: ["이동", "경험", "새로움"],
        followUp: ["나에게 집이라는 공간은 편안함인가요, 베이스캠프인가요?"]
    },
    {
        id: "l2", category: "life_direction",
        title: "평생 직업에 대한 생각은?",
        optionA: "한 분야의 장인이 되어 오래 유지", tagsA: ["지속", "전문성", "깊이"],
        optionB: "여러 직업을 바꿔가며 다채로운 경험", tagsB: ["변화", "다양성", "확장"],
        followUp: ["한 우물만 파는 것이 지루하게 느껴지나요?"]
    },
    {
        id: "l3", category: "life_direction",
        title: "인생의 성공 기준은?",
        optionA: "남들이 인정하는 명예와 성공", tagsA: ["성공", "명예", "인정"],
        optionB: "내가 스스로 느끼는 의미와 가치", tagsB: ["의미", "내면", "만족"],
        followUp: ["아무도 몰라줘도 나만 뿌듯하면 정말 괜찮을까요?"]
    },
    {
        id: "l4", category: "life_direction",
        title: "조직 내에서 나의 위치는?",
        optionA: "책임을 지고 이끄는 리더", tagsA: ["리더", "책임", "영향력"],
        optionB: "책임은 적지만 자유로운 팀원", tagsB: ["자유", "평등", "독립"],
        followUp: ["책임감의 무게를 견디는 것과 내 마음대로 하는 것 중 무엇이 중요한가요?"]
    },
    {
        id: "l5", category: "life_direction",
        title: "어떤 삶이 더 끌리나요?",
        optionA: "안정적인 직장에서 뿌리내리는 삶", tagsA: ["정착", "안정", "보호"],
        optionB: "어디에도 매이지 않고 넓히는 삶", tagsB: ["자유", "경험", "독립"],
        followUp: ["불안정함이 나에게 주는 감정은 두려움인가요, 설렘인가요?"]
    },

    // 5. 진로 결정 심화
    {
        id: "d1", category: "decision",
        title: "전공이나 직업을 고를 때?",
        optionA: "내가 좋아하는 것 선택", tagsA: ["흥미", "열정", "만족"],
        optionB: "내가 잘할 수 있는 것 선택", tagsB: ["강점", "성취", "현실"],
        followUp: ["좋아하는 일을 직업으로 삼으면 싫어지게 될까요?"]
    },
    {
        id: "d2", category: "decision",
        title: "취업 준비 시 우선순위는?",
        optionA: "현실적으로 유리하고 취업 잘 되는 길", tagsA: ["현실", "안정", "보장"],
        optionB: "내가 정말 끌리고 해보고 싶은 길", tagsB: ["탐색", "도전", "열정"],
        followUp: ["후회하더라도 내 뜻대로 해보는 것이 중요할까요?"]
    },
    {
        id: "d3", category: "decision",
        title: "진로 결정 시기?",
        optionA: "지금 한 방향을 확실히 정하고 집중", tagsA: ["확정", "집중", "결단"],
        optionB: "아직은 여러 가능성을 열어두고 탐색", tagsB: ["탐색", "유연성", "경험"],
        followUp: ["빨리 정하면 앞서갈 수 있을까요, 아니면 나중에 후회할 확률이 높을까요?"]
    },
    {
        id: "d4", category: "decision",
        title: "부모님/지인이 반대하는 길이라면?",
        optionA: "조언을 수용하고 안전한 길로 수정", tagsA: ["수용", "안정", "현실"],
        optionB: "반대해도 내가 원하는 길로 밀고 감", tagsB: ["독립", "확신", "도전"],
        followUp: ["나 스스로에 대한 확신이 충분한가요?"]
    },
    {
        id: "d5", category: "decision",
        title: "직업이 나에게 주는 가장 큰 의미는?",
        optionA: "나의 생계와 평온한 일상을 지키는 수단", tagsA: ["생계", "현실", "도구"],
        optionB: "사회에 기여하고 세상에 남기는 나의 흔적", tagsB: ["기여", "영향력", "사회가치"],
        followUp: ["돈 걱정이 없다면, 당신은 어떤 일을 하며 살고 싶나요?"]
    }
];

// Map of tags to meaningful keywords for the final results
const RESULT_TYPES = [
    {
        id: "growth",
        name: "성장도전형",
        keywords: ["성장", "도전", "변화", "성취"],
        desc: "안락함에 머물기보다 새로운 것을 배우고 성취하는 과정에서 큰 에너지를 얻는 유형입니다.",
        jobs: ["창업", "마케팅", "기획", "콘텐츠 크리에이터", "신사업 개발", "국제교류"]
    },
    {
        id: "stable",
        name: "안정설계형",
        keywords: ["안정", "규칙", "정착", "현실", "보상"],
        desc: "체계적이고 예측 가능한 환경에서 뛰어난 효율을 보여주며, 꾸준함과 신뢰를 중요하게 생각하는 유형입니다.",
        jobs: ["행정", "회계", "공공기관", "연구지원", "품질관리", "사무직"]
    },
    {
        id: "collab",
        name: "협업실행형",
        keywords: ["협업", "사람", "소통", "관계", "지원"],
        desc: "다른 사람들과 소통하며 함께 목표를 이루는 과정에서 보람을 느끼고, 조직의 분위기를 이끄는 유형입니다.",
        jobs: ["프로젝트 관리", "교육", "서비스", "인사", "상담", "조직문화 담당자"]
    },
    {
        id: "analysis",
        name: "분석전략형",
        keywords: ["분석", "논리", "기술", "독립", "객관"],
        desc: "복잡한 현상 속에서 규칙과 논리를 찾아내고, 효율적이고 정확한 시스템을 설계하는 데 강점을 보이는 유형입니다.",
        jobs: ["데이터 분석가", "연구원", "소프트웨어 개발자", "설계엔지니어", "재무분석가"]
    },
    {
        id: "meaning",
        name: "의미추구형",
        keywords: ["의미", "보람", "사회가치", "기여", "만족"],
        desc: "단순히 돈을 버는 것을 넘어, 내 일이 세상에 선한 영향력을 끼치는 것에 큰 동기를 부여받는 유형입니다.",
        jobs: ["NGO/NPO 활동가", "사회복지사", "환경/ESG 전문가", "예술가", "독립연구자"]
    },
    {
        id: "explore",
        name: "탐색확장형",
        keywords: ["경험", "유연성", "자유", "다양성", "탐색"],
        desc: "하나의 틀에 얽매이기보다 다양한 경험을 쌓으며 자유롭게 자신만의 길을 개척하는 것을 즐기는 유형입니다.",
        jobs: ["프리랜서", "여행 에디터", "컨설턴트", "N잡러", "글로벌 비즈니스"]
    }
];
