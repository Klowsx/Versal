(() => {
  const App = (() => {
    const htmlElements = {
      loginForm: document.getElementById("loginForm"),
      email: document.querySelector('input[name="email"]'),
      password: document.querySelector('input[name="password"]'),
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
      handleLoginSubmit: async (e) => {
        e.preventDefault();

        const credentials = {
          email: htmlElements.email.value.trim(),
          password: htmlElements.password.value.trim(),
        };

        const options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        };

        const result = await methods.fetchAPI(`${API_URL}/login`, options);
        if (result && result.token) {
          localStorage.setItem("token", result.token);
          alert("Inicio de sesión exitoso.");
          window.location.href = "/frontend/modules/main/dashboard.html";
        }
      },
    };

    const init = () => {
      htmlElements.loginForm.addEventListener("submit", handlers.handleLoginSubmit);
    };

    return { init };
  })();

  App.init();
})();
