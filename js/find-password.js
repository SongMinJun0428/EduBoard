const supabase = window.supabase.createClient(
  window.EduConfig.getSupabaseURL(),
  window.EduConfig.getSupabaseKey()
);

let currentResetCode = null;
let verifiedUsername = null;

function setResult(message, color = "red") {
  const result = document.getElementById("result");
  result.innerText = message;
  result.style.color = color;
}

document.getElementById("sendCodeBtn").addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const btn = document.getElementById("sendCodeBtn");

  if (!username || !name || !email) {
    setResult("모든 항목을 입력해주세요.");
    return;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .match({ username, name, email });

  if (error || !data || data.length === 0) {
    setResult("일치하는 회원 정보를 찾을 수 없습니다.");
    return;
  }

  btn.disabled = true;
  btn.innerText = "전송 중...";

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

    setResult("이메일로 인증번호를 보냈습니다.", "#28a745");
    document.getElementById("verify-area").style.display = "block";
  } catch (err) {
    console.error("Email send failed:", err);
    setResult("이메일 전송에 실패했습니다.");
    btn.disabled = false;
    btn.innerText = "인증번호 발송";
  }
});

document.getElementById("verifyBtn").addEventListener("click", () => {
  const input = document.getElementById("verifyCode").value.trim();

  if (input === currentResetCode && currentResetCode !== null) {
    setResult("인증되었습니다. 새 비밀번호를 입력하세요.", "#28a745");
    document.getElementById("reset-area").style.display = "block";
    document.getElementById("verify-area").style.display = "none";
  } else {
    setResult("인증번호가 일치하지 않습니다.");
  }
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (newPassword.length < 6) {
    setResult("비밀번호는 6자 이상이어야 합니다.");
    return;
  }

  if (newPassword !== confirmPassword) {
    setResult("비밀번호가 일치하지 않습니다.");
    return;
  }

  try {
    const passwordHash = await window.EduPassword.hash(newPassword);
    const { error } = await supabase
      .from("users")
      .update({ password: passwordHash })
      .eq("username", verifiedUsername);

    if (error) throw error;

    alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
    window.location.href = "index.html";
  } catch (err) {
    setResult("비밀번호 변경 실패: " + err.message);
  }
});
