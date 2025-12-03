document.addEventListener('DOMContentLoaded', () => {
    const supabase = window.supabase.createClient(
        "https://ucmzrkwrsezfdjnnwsww.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbXpya3dyc2V6ZmRqbm53c3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDIzODcsImV4cCI6MjA2ODQxODM4N30.rvLItmDStjWb3GfECnCXocHvj-CMTfHfD1CHsAHOLaw"
    );

    document.getElementById("findIdBtn").addEventListener("click", async () => {
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const result = document.getElementById("result");

        if (!name || !email) {
            result.innerText = "이름과 이메일을 모두 입력해주세요.";
            result.style.color = "red";
            return;
        }

        const { data, error } = await supabase
            .from("users")
            .select("username")
            .eq("name", name)
            .eq("email", email)
            .single();

        if (error || !data) {
            result.innerText = "일치하는 아이디를 찾을 수 없습니다.";
            result.style.color = "red";
        } else {
            result.innerText = `가입된 아이디: ${data.username}`;
            result.style.color = "#28a745";
        }
    });
});
