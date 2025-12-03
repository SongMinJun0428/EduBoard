import emailjs from 'https://esm.sh/@emailjs/browser';

// Supabase 연결
const supabase = window.supabase.createClient(
    "https://ucmzrkwrsezfdjnnwsww.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbXpya3dyc2V6ZmRqbm53c3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDIzODcsImV4cCI6MjA2ODQxODM4N30.rvLItmDStjWb3GfECnCXocHvj-CMTfHfD1CHsAHOLaw"
);

// EmailJS 초기화
emailjs.init("ylQL6_ZfhS-QQi2LT"); // 본인 public key

document.getElementById("findBtn").addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const result = document.getElementById("result");

    if (!username || !name || !email) {
        result.innerText = "모든 항목을 입력해주세요.";
        result.style.color = "red";
        return;
    }

    const { data, error } = await supabase
        .from("users")
        .select("password") // 일단 전체 선택으로 테스트
        .match({
            username: username,
            name: name,
            email: email
        });

    if (error || !data || data.length === 0) {
        result.innerText = "일치하는 회원 정보를 찾을 수 없습니다.";
        result.style.color = "red";
        return;
    }

    const password = data[0].password;

    try {
        await emailjs.send("service_cnktiz9", "template_ozh7f4v", {
            to_name: name,
            to_email: email,
            message: `요청하신 비밀번호는 [ ${password} ] 입니다.`
        });

        result.innerText = "📧 이메일로 비밀번호를 전송했습니다.";
        result.style.color = "#28a745";
        alert("비밀번호가 이메일로 전송되었습니다.");
    } catch (err) {
        console.error("이메일 전송 실패:", err);
        result.innerText = "이메일 전송에 실패했습니다.";
        result.style.color = "red";
    }
});
