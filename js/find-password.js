// Supabase 및 EmailJS는 config.js와 CDN을 통해 글로벌하게 로드됨
const supabase = window.supabase.createClient(
    window.EduConfig.getSupabaseURL(),
    window.EduConfig.getSupabaseKey()
);

let currentResetCode = null;
let verifiedUsername = null;

// 1. 인증번호 발송
document.getElementById("sendCodeBtn").addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const result = document.getElementById("result");

    if (!username || !name || !email) {
        result.innerText = "모든 항목을 입력해주세요.";
        result.style.color = "red";
        return;
    }

    // 사용자 확인
    const { data, error } = await supabase
        .from("users")
        .select("id")
        .match({ username, name, email });

    if (error || !data || data.length === 0) {
        result.innerText = "일치하는 회원 정보를 찾을 수 없습니다.";
        result.style.color = "red";
        return;
    }

    const btn = document.getElementById("sendCodeBtn");
    btn.disabled = true;
    btn.innerText = "발송 중...";

    // 6자리 인증번호 생성
    currentResetCode = Math.floor(100000 + Math.random() * 900000).toString();
    verifiedUsername = username;

    try {
        await emailjs.send(
            window.EduConfig.EMAILJS_SERVICE_ID,
            window.EduConfig.EMAILJS_TEMPLATE_ID,
            {
                to_name: name,
                to_email: email,
                message: `비밀번호 재설정을 위한 인증번호는 [ ${currentResetCode} ] 입니다.`
            },
            window.EduConfig.EMAILJS_PUBLIC_KEY
        );

        result.innerText = "📧 이메일로 인증번호를 전송했습니다.";
        result.style.color = "#28a745";
        document.getElementById("verify-area").style.display = "block";
    } catch (err) {
        console.error("이메일 전송 실패:", err);
        result.innerText = "이메일 전송에 실패했습니다.";
        result.style.color = "red";
        btn.disabled = false;
        btn.innerText = "인증번호 재발송";
    }
});

// 2. 인증번호 확인
document.getElementById("verifyBtn").addEventListener("click", () => {
    const input = document.getElementById("verifyCode").value.trim();
    const result = document.getElementById("result");

    if (input === currentResetCode && currentResetCode !== null) {
        result.innerText = "✅ 인증되었습니다. 새 비밀번호를 입력하세요.";
        result.style.color = "#28a745";
        document.getElementById("reset-area").style.display = "block";
        document.getElementById("verify-area").style.display = "none";
    } else {
        result.innerText = "❌ 인증번호가 일치하지 않습니다.";
        result.style.color = "red";
    }
});

// 3. 비밀번호 재설정 완료
document.getElementById("resetBtn").addEventListener("click", async () => {
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const result = document.getElementById("result");

    if (newPassword.length < 6) {
        result.innerText = "비밀번호는 6자 이상이어야 합니다.";
        result.style.color = "red";
        return;
    }

    if (newPassword !== confirmPassword) {
        result.innerText = "비밀번호가 일치하지 않습니다.";
        result.style.color = "red";
        return;
    }

    try {
        const { error } = await supabase
            .from("users")
            .update({ password: newPassword })
            .eq("username", verifiedUsername);

        if (error) throw error;

        alert("비밀번호가 성공적으로 변경되었습니다. 로그인 해주세요.");
        window.location.href = "index.html";
    } catch (err) {
        result.innerText = "비밀번호 변경 실패: " + err.message;
        result.style.color = "red";
    }
});
