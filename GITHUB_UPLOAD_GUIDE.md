# GitHub 업로드 기준

이 프로젝트의 원본 웹앱은 루트 폴더입니다. `index.html`은 반드시 루트에 유지합니다.

## 업로드해야 하는 파일/폴더

- `index.html` - 메인 앱 화면
- `admin.html`, `class.html`, `classadmin.html`, `find-id.html`, `find-password.html`, `job.html`
- `css/` - 원본 스타일 파일
- `js/` - 원본 스크립트 파일
- `img/` - 앱에서 사용하는 이미지와 캐릭터 파일
- `docs/` - 약관/개인정보 문서
- `reports/` - 앱에서 직접 열어야 하는 PDF 리포트
- `android/` - Android 네이티브 프로젝트 원본
- `ios/` - iOS 네이티브 프로젝트 원본
- `scripts/` - 빌드 전 동기화 스크립트
- `main.js` - Electron 앱 진입점
- `package.json`, `package-lock.json`
- `capacitor.config.json`
- `manifest.json`, `sw.js`
- `README.md`, `.gitignore`, `GITHUB_UPLOAD_GUIDE.md`
- 루트 로고 파일 `eduboard_logo_128px.png`, `eduboard_logo_premium.png`

## 업로드하지 않는 파일/폴더

- `node_modules/` - `npm install`로 다시 생성
- `m/` - 루트 원본을 복사해서 만드는 모바일/Capacitor 출력 폴더
- `android/app/src/main/assets/public/` - `m`에서 Android로 복사되는 출력물
- `android/.gradle/`, `android/app/build/`, `android/build/`
- `android/capacitor-cordova-android-plugins/`, `android/capacitor.settings.gradle`
- `ios/App/Pods/`, `ios/App/build/`, `ios/App/DerivedData/`
- `ios/capacitor-cordova-ios-plugins/`
- `scratch/`, `*.log`, `release/`, `dist/`, `build/`, `out/`
- `.env`, `.env.*`

## 작업 흐름

1. 루트 원본 파일을 수정합니다.
   - 예: `index.html`, `css/index.css`, `js/index.js`
2. Windows/Electron 실행은 루트 `index.html`을 바로 사용합니다.
   - `npm start`
3. Android에 반영할 때는 아래 명령을 실행합니다.
   - `npm run build:android`
4. 이 명령은 먼저 루트 원본을 `m/`로 복사하고, 그 다음 Android assets에 반영합니다.

## 주의

- `m/`는 원본이 아닙니다. 직접 수정하지 마세요.
- Android에 들어간 `android/app/src/main/assets/public/`도 원본이 아닙니다.
- 공개 GitHub에 올릴 경우 `js/config.js`와 `js/job-analyzer.js` 안의 Supabase anon key, EmailJS public key, Google API key가 노출됩니다. 클라이언트 앱 키는 원래 사용자에게 보이는 값이지만, Google API key는 도메인/API 제한을 걸어두는 것을 권장합니다.
