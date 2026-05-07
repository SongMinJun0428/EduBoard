# EduBoard Pro

EduBoard Pro는 학급 운영, 공지, 일정, 시간표, 퀘스트, 포인트, 상점, 진로 검사, 미니게임을 한 화면에서 관리하는 학급 대시보드입니다.

정적 화면은 Netlify에서 배포하고, 로그인/비밀번호 변경/관리자 작업/퀘스트 보상처럼 보안이 필요한 작업은 Netlify Functions에서 Supabase service role 키로 처리합니다.

## 주요 기능

- 학생/관리자 로그인
- 공지사항과 첨부 이미지 관리
- 월간 일정, 주간 시간표 확인
- 일일 퀘스트 진행도와 보상 지급
- XP, 레벨, 코인, 상점, 인벤토리
- 진로 검사와 AI 리포트
- 미니게임과 활동 보상
- 관리자 페이지에서 사용자, 권한, 포인트, 상점 아이템 관리

## 배포 방식

현재 배포 기준은 GitHub + Netlify입니다.

GitHub에는 `upload` 폴더 안의 파일만 올리면 됩니다. Netlify는 GitHub 저장소를 감지해서 정적 파일과 `netlify/functions/eduboard-auth.js` 함수를 함께 배포합니다.

Supabase Edge Function은 사용하지 않습니다.

## 업로드할 파일

`upload` 폴더에는 Netlify 배포에 필요한 파일만 모아두었습니다.

포함:

- `index.html`, `admin.html`, `class.html`, `find-password.html` 등 화면 파일
- `css/`
- `js/`
- `img/`
- `docs/`
- `reports/`
- `netlify/functions/eduboard-auth.js`
- `netlify.toml`
- `.env.example`
- 배포 안내 문서

제외:

- `.env`
- `node_modules/`
- `android/`, `ios/`, `m/`
- `scratch/`, `release/`, `dist/`
- Electron/Capacitor 개발용 파일

## Netlify 환경변수

Netlify 대시보드에서 아래 환경변수를 추가해야 합니다.

경로:

`Site settings -> Environment variables`

```text
SUPABASE_URL=https://ucmzrkwrsezfdjnnwsww.supabase.co
SUPABASE_SERVICE_ROLE_KEY=Supabase service_role key
EMAILJS_SERVICE_ID=service_cnktiz9
EMAILJS_TEMPLATE_ID=template_ozh7f4v
EMAILJS_PUBLIC_KEY=ylQL6_ZfhS-QQi2LT
```

주의:

- `SUPABASE_SERVICE_ROLE_KEY`는 절대 GitHub에 올리지 않습니다.
- `.env` 파일도 GitHub에 올리지 않습니다.
- Netlify 환경변수의 Secret 체크는 켜도 됩니다.
- Scopes와 Deploy contexts는 기본값인 All scopes, All deploy contexts로 두면 됩니다.

## 인증 구조

브라우저에서 비밀번호를 직접 검증하지 않습니다.

로그인 요청은 아래 Netlify Function으로 전달됩니다.

```text
/.netlify/functions/eduboard-auth
```

Netlify Function이 Supabase `users.password`를 service role 권한으로 확인하고, 성공하면 httpOnly 쿠키 세션을 발급합니다.

이 구조에서는 사용자가 Supabase Auth 계정을 따로 만들 필요가 없습니다.

## 보안 처리

현재 보안 기준:

- `users.password`는 브라우저에서 조회하지 않음
- 관리자 작업은 브라우저의 anon Supabase 클라이언트로 직접 실행하지 않고 Netlify Function을 통해 실행
- 세션 토큰은 `localStorage`가 아니라 httpOnly 쿠키 사용
- 비밀번호 재설정은 서버 함수에서 인증번호 검증 후 처리
- 로그인/회원가입/비밀번호 재설정에는 rate limit 적용
- Supabase SQL은 `docs/supabase_custom_auth.sql` 기준 적용

## 퀘스트 보상

퀘스트 보상은 Netlify Function에서 처리합니다.

보상 받기 흐름:

1. 브라우저가 `claimQuestReward` 요청을 Netlify Function으로 보냅니다.
2. 서버가 현재 로그인 세션을 확인합니다.
3. 완료된 퀘스트인지 확인합니다.
4. 중복 수령을 막기 위해 `completed` 상태일 때만 `rewarded`로 변경합니다.
5. 코인과 XP를 지급합니다.
6. XP가 20 이상이면 레벨업하고, 레벨업 1회당 보너스 코인 10개를 지급합니다.
7. 경험치 2배 효과가 켜져 있으면 퀘스트 XP 보상도 2배로 계산합니다.

보상 알림은 한국어로 표시됩니다.

예시:

```text
보상이 지급되었습니다! (+10 코인, +20 XP)
경험치 2배 효과 적용!
레벨 업! 현재 레벨: 5 (+10 코인 보너스)
```

## Supabase SQL

Supabase SQL Editor에서 아래 파일 내용을 실행합니다.

```text
docs/supabase_custom_auth.sql
```

주의:

- 리뷰 문구인 `P0`, `Finding`, 설명 문장은 SQL에 붙여넣지 않습니다.
- SQL 코드만 복사해서 실행합니다.
- `users` 테이블에는 `id` 컬럼이 없으므로 쿼리에서 `id`를 선택하지 않습니다.

## 로컬 테스트

`file://`로 `index.html`을 직접 열면 Netlify Function과 Service Worker가 정상 동작하지 않습니다.

로컬에서 테스트할 때는 Netlify 개발 서버를 사용합니다.

```bash
npx netlify dev
```

또는 실제 Netlify 배포 URL에서 테스트합니다.

## 배포 후 확인

배포 후 아래를 확인합니다.

- 로그인 성공
- 로그아웃 성공
- 관리자 페이지 사용자 목록 로딩
- 관리자 권한 변경, 포인트 지급
- 비밀번호 찾기 이메일 발송
- 프로필, 퀘스트, 상점 정보 로딩
- 퀘스트 보상 수령 시 코인/XP/레벨 반영
- 일정과 시간표가 모바일/PC에서 잘리지 않음

## 캐시 문제

수정 후에도 예전 동작이 보이면 브라우저 캐시가 남아 있을 수 있습니다.

해결:

- Netlify 재배포 후 새로고침
- 강력 새로고침
- 모바일에서는 앱/브라우저 캐시 삭제 후 재접속

## 현재 주요 파일

- `index.html`: 메인 화면
- `admin.html`: 관리자 화면
- `js/index.js`: 메인 기능
- `js/admin.js`: 관리자 기능
- `js/auth-api.js`: Netlify 인증 API 호출
- `netlify/functions/eduboard-auth.js`: 로그인, 세션, 관리자 작업, 퀘스트 보상 서버 함수
- `css/index.css`: 메인 스타일
- `docs/supabase_custom_auth.sql`: Supabase 보안 SQL

## 유지보수 메모

- 새 보안 기능이나 관리자 쓰기 작업을 추가할 때는 브라우저에서 `users`를 직접 update/delete 하지 말고 Netlify Function에 추가합니다.
- `users.password`는 클라이언트에서 절대 조회하지 않습니다.
- 업로드 전에는 최신 루트 파일을 `upload` 폴더에 복사한 뒤 GitHub에 올립니다.
