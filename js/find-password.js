let resetRequestId = null;

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

  btn.disabled = true;
  btn.innerText = "전송 중...";

  try {
    const result = await window.EduAuth.requestPasswordReset({ username, name, email });
    resetRequestId = result.resetId;

    setResult("이메일로 인증번호를 보냈습니다.", "#28a745");
    document.getElementById("verify-area").style.display = "block";
  } catch (err) {
    console.error("Password reset request failed:", err);
    setResult(err.message || "인증번호 발송에 실패했습니다.");
    btn.disabled = false;
    btn.innerText = "인증번호 발송";
  }
});

document.getElementById("verifyBtn").addEventListener("click", () => {
  const input = document.getElementById("verifyCode").value.trim();

  if (!resetRequestId) {
    setResult("먼저 인증번호를 발송해주세요.");
    return;
  }

  if (!/^\d{6}$/.test(input)) {
    setResult("6자리 인증번호를 입력해주세요.");
    return;
  }

  setResult("새 비밀번호를 입력한 뒤 변경을 완료하세요.", "#28a745");
  document.getElementById("reset-area").style.display = "block";
  document.getElementById("verify-area").style.display = "none";
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  const code = document.getElementById("verifyCode").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (!resetRequestId) {
    setResult("인증번호 발송부터 다시 진행해주세요.");
    return;
  }

  if (newPassword.length < 8) {
    setResult("비밀번호는 8자 이상이어야 합니다.");
    return;
  }

  if (newPassword !== confirmPassword) {
    setResult("비밀번호가 일치하지 않습니다.");
    return;
  }

  try {
    await window.EduAuth.confirmPasswordReset({
      resetId: resetRequestId,
      code,
      newPassword
    });

    alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
    window.location.href = "index.html";
  } catch (err) {
    setResult("비밀번호 변경 실패: " + err.message);
  }
});
