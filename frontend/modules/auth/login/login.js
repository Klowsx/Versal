(() => {
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
            } catch {
              // No es JSON válido o viene vacío
            }
            throw new Error(errorMessage);
          }

          return await response.json(); // { user, token }
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

        if (result && result.token) {
          localStorage.setItem("token", result.token);
          alert("Inicio de sesión exitoso.");
          window.location.href = "/frontend/modules/main/dashboard.html";
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
