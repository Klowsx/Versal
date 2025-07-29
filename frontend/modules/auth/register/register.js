(() => {
  const checkIfLoggedIn = () => {
    const token = localStorage.getItem("token");
    if (token) {
      console.warn("Usuario ya autenticado. Redirigiendo al dashboard.");
      window.location.replace("/frontend/modules/main/dashboard.html");
    }
  };

  checkIfLoggedIn();
  const App = (() => {
    const htmlElements = {
      registerForm: document.getElementById("registerForm"),
      fullName: document.querySelector('input[name="fullName"]'),
      username: document.querySelector('input[name="username"]'),
      email: document.querySelector('input[name="email"]'),
      password: document.querySelector('input[name="password"]'),
      confirmPassword: document.querySelector('input[name="confirmPassword"]'),
    };

    const API_URL = "http://localhost:3000/api/user";

    const methods = {
      async fetchAPI(url, options = {}) {
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Error desconocido");
          }
          return response.json();
        } catch (err) {
          console.error("Error en fetchAPI:", err);
          alert(err.message || "No se pudo conectar con la API.");
          return null;
        }
      },
    };

    const handlers = {
      handleRegisterSubmit: async (e) => {
        e.preventDefault();

        const password = htmlElements.password.value.trim();
        const confirmPassword = htmlElements.confirmPassword.value.trim();

        if (password !== confirmPassword) {
          alert("Las contraseñas no coinciden.");
          return;
        }

        const newUser = {
          fullName: htmlElements.fullName.value.trim(),
          username: htmlElements.username.value.trim(),
          email: htmlElements.email.value.trim(),
          password,
        };

        const options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUser),
        };

        const result = await methods.fetchAPI(`${API_URL}/register`, options);
        if (result) {
          alert("Registro exitoso. Inicia sesión.");
          // CAMBIO: Usar replace() para evitar que la página de registro quede en el historial
          window.location.replace("../login/login.html");
        }
      },
    };

    const init = () => {
      htmlElements.registerForm.addEventListener("submit", handlers.handleRegisterSubmit);
    };

    return { init };
  })();

  App.init();
})();