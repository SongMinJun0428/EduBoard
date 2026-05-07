# Upload Folder

이 폴더만 GitHub에 올리면 Netlify 배포에 필요한 파일이 들어 있습니다.

## 포함한 것

- HTML 화면 파일
- `css/`
- `js/`
- `img/`
- `docs/`
- `reports/`
- `netlify/functions/eduboard-auth.js`
- `netlify.toml`
- `.env.example`
- 배포 안내 문서

## 일부러 뺀 것

- `.env`: 비밀키가 들어갈 수 있으므로 GitHub에 올리지 않습니다.
- `node_modules/`: Netlify 배포에 필요 없습니다.
- `m/`: 모바일/Capacitor용 복사본입니다.
- `android/`, `ios/`: Netlify 웹 배포에 필요 없습니다.
- `scratch/`, `release/`, `dist/`: 작업/빌드 산출물입니다.
- `package.json`, `package-lock.json`: Electron/Capacitor 의존성 설치를 피하려고 웹 배포 패키지에서는 제외했습니다.

## Netlify 환경변수

Netlify에 아래 환경변수를 따로 등록해야 합니다.

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
EMAILJS_SERVICE_ID
EMAILJS_TEMPLATE_ID
EMAILJS_PUBLIC_KEY
```

`SUPABASE_SERVICE_ROLE_KEY`는 절대 GitHub에 올리지 마세요.
