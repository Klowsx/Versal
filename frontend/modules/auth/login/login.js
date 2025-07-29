// login.js
(() => {
  const checkIfLoggedIn = () => {
    const token = localStorage.getItem("token");
    if (token) {
      console.warn("Usuario ya autenticado. Intento de redirigir.");
      window.location.replace("/frontend/modules/main/dashboard.html"); // Default redirect for already logged-in users
    }
  };

  checkIfLoggedIn();

  const App = (() => {
    const htmlElements = {
      loginForm: document.getElementById("loginForm"),
      email: document.querySelector('input[name="email"]'),
      password: document.querySelector('input[name="password"]'),
    };

    const API_URL = "http://localhost:3000/api/user/login"; // Your Fastify login endpoint

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
              // Not valid JSON or empty
            }
            throw new Error(errorMessage);
          }

          return await response.json(); // Expected: { user: { _id, role, ... }, token }
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
        if (result && result.token && result.user) { // Ensure user object is also present
          localStorage.setItem("token", result.token);
          // Store user details, especially role, in localStorage for client-side checks
          localStorage.setItem("userRole", result.user.role); // Store the user's role

          alert("Inicio de sesión exitoso.");

          // Role-based redirection
          if (result.user.role === 'admin') {
            window.location.href = "/frontend/modules/admin/admin.html"; // Redirect to admin panel
          } else {
            window.location.href = "/frontend/modules/main/dashboard.html"; // Redirect to regular dashboard
          }
        } else {
          console.warn("Inicio de sesión fallido. Respuesta:", result);
          // The error message from fetchLogin (via alert) should suffice for user feedback
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