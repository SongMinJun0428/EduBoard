# Netlify + GitHub 배포 안내

이 버전은 GitHub에 올리면 Netlify가 정적 파일과 서버 함수까지 함께 배포하는 구조입니다.
Supabase Edge Function을 따로 배포하지 않습니다.

## GitHub에 올릴 것

루트 폴더 전체를 올립니다. 단, `.gitignore`에 들어간 항목은 제외합니다.

필수로 포함되어야 하는 파일/폴더:

- `index.html`, `admin.html`, `find-password.html` 등 HTML 파일
- `css/`
- `js/`
- `img/`
- `docs/`
- `netlify/functions/eduboard-auth.js`
- `netlify.toml`
- `package.json`, `package-lock.json`

GitHub에 올리지 않는 것:

- `node_modules/`
- `.env`
- `.env.*`
- `scratch/`
- `release/`
- `dist/`

## Netlify 환경변수

Netlify 사이트 설정에서 아래 환경변수를 추가해야 합니다.

Site settings -> Environment variables

```text
SUPABASE_URL=https://ucmzrkwrsezfdjnnwsww.supabase.co
SUPABASE_SERVICE_ROLE_KEY=Supabase service_role key
EMAILJS_SERVICE_ID=service_eyu0hbt
EMAILJS_TEMPLATE_ID=template_tpffacl
EMAILJS_PUBLIC_KEY=2U-mo3uDa-tKMVd5H
```

중요:

- `SUPABASE_SERVICE_ROLE_KEY`는 절대 GitHub에 올리지 않습니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 Supabase Dashboard -> Project Settings -> API에서 확인합니다.
- anon key가 아니라 `service_role` key를 넣어야 관리자 API와 비밀번호 검증이 동작합니다.

## Supabase SQL

Supabase SQL Editor에서 `docs/supabase_custom_auth.sql` 내용을 한 번 실행합니다.

실행할 때 `P0`, `Finding`, 리뷰 설명 문구를 같이 붙여 넣지 말고 SQL 코드만 넣습니다.

## Netlify 동작 방식

브라우저는 아래 주소로 로그인/관리자 요청을 보냅니다.

```text
/.netlify/functions/eduboard-auth
```

이 함수가 Netlify 서버에서 실행되고, 서버의 환경변수에 저장된 `SUPABASE_SERVICE_ROLE_KEY`로 Supabase DB에 안전하게 접근합니다.

## 배포 후 확인

1. Netlify deploy log에서 Function bundling 에러가 없는지 확인합니다.
2. 사이트에서 로그인합니다.
3. 관리자 페이지에서 사용자 목록, 권한 변경, 포인트 지급을 테스트합니다.
4. 비밀번호 찾기 이메일이 전송되는지 확인합니다.
