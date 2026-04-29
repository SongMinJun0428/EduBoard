/** 🎓 전국 초·중·고 학교 검색 시스템 (NEIS API) */
const SchoolSearch = {
  NEIS_KEY: '28ca0f05af184e8ba231d5a949d52db2',

  /** 🔍 학교명으로 검색 */
  async search(keyword, atptCode = null) {
    if (!keyword || keyword.length < 2) {
      alert('학교명을 2글자 이상 입력해 주세요.');
      return [];
    }

    try {
      let url = `https://open.neis.go.kr/hub/schoolInfo?KEY=${this.NEIS_KEY}&Type=json&pIndex=1&pSize=20&SCHUL_NM=${encodeURIComponent(keyword)}`;
      if (atptCode) {
        url += `&ATPT_OFCDC_SC_CODE=${encodeURIComponent(atptCode)}`;
      }
      const res = await fetch(url);
      const data = await res.json();

      if (!data.schoolInfo) {
        if (data.RESULT && data.RESULT.CODE !== 'INFO-000') {
          console.warn('NEIS API Message:', data.RESULT.MESSAGE);
        }
        return [];
      }

      return data.schoolInfo[1].row.map(school => ({
        name: school.SCHUL_NM,
        atptCode: school.ATPT_OFCDC_SC_CODE,
        schulCode: school.SD_SCHUL_CODE,
        address: school.ORG_RDNMA,
        type: school.SCHUL_KND_SC_NM // 초등학교, 중학교, 고등학교 구분
      }));
    } catch (err) {
      console.error('School Search Error:', err);
      return [];
    }
  }
};

window.SchoolSearch = SchoolSearch;
