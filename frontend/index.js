const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

const Auth = {

  isValidPassword(password) {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return (
      password.length >= minLength &&
      hasUppercase &&
      hasLowercase &&
      hasSpecialChar
    );
  },

  async register({ fullName, username, email, password, confirmPassword }) {
    if (!fullName || !username || !email || !password || !confirmPassword) {
      throw new Error("Por favor completa todos los campos.");
    }
    if (password !== confirmPassword) {
      throw new Error("Las contraseñas no coinciden.");
    }
    if (!this.isValidPassword(password)) {
      throw new Error(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un carácter especial."
      );
    }


    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        username,
        email,
        password: password,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Error en el registro");
    }
    return data;
  },

  async login({ email, password }) {

    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Error en el login");
    }
    return data;
  },
};

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const fullName = registerForm.fullName?.value || "";
      const username = registerForm.username.value;
      const email = registerForm.email.value;
      const password = registerForm.password.value;
      const confirmPassword = registerForm.confirmPassword.value;

      const data = await Auth.register({ fullName, username, email, password, confirmPassword });

      alert("✅ Registro exitoso");
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "userInfo",
        JSON.stringify({ fullName, username, email })
      );
      window.location.href = "login.html";
    } catch (error) {
      alert(`❌ ${error.message}`);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const email = loginForm.email.value;
      const password = loginForm.password.value;

      const data = await Auth.login({ email, password });

      alert("✅ Login exitoso");
      localStorage.setItem("token", data.token);
      window.location.href = "dashboard.html";
    } catch (error) {
      alert(`❌ ${error.message}`);
    }
  });
}
