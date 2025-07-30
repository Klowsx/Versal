
(() => {
  const checkIfLoggedIn = () => {
    const token = localStorage.getItem("token");
    if (token) {
      console.warn("Usuario ya autenticado. Intento de redirigir.");
      window.location.replace("/frontend/modules/main/dashboard.html");
    }
  };

  checkIfLoggedIn();

  const App = (() => {
    const htmlElements = {
      loginForm: document.getElementById("loginForm"),
      email: document.querySelector('input[name="email"]'),
      password: document.querySelector('input[name="password"]'),
    };

    const API_URL = "http://localhost:3000/api/user/login";

    const methods = {
      async fetchLogin(credentials) {
        try {
          const response = await fetch(API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            let errorMessage = "Error desconocido";
            try {
              const error = await response.json();
              errorMessage = error.error || error.message || errorMessage;
            } catch {}
            throw new Error(errorMessage);
          }

          return await response.json();
        } catch (err) {
          console.error("Error en fetchLogin:", err);
          alert(err.message || "No se pudo conectar con el servidor.");
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

        console.log("Intentando login con:", credentials);

        const result = await methods.fetchLogin(credentials);
        console.log("Resultado del login:", result);
        if (result && result.token && result.user) {
          localStorage.setItem("token", result.token);

          localStorage.setItem("userRole", result.user.role);

          console.log(result.user.role);
          alert("Inicio de sesión exitoso.");

          if (result.user.role === "admin") {
            window.location.href = "/frontend/modules/admin/admin/admin.html";
          } else {
            window.location.href = "/frontend/modules/main/dashboard.html";
          }
        } else {
          console.warn("Inicio de sesión fallido. Respuesta:", result);
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
