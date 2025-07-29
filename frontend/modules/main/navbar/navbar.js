(() => {
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  };

  const checkAuthentication = () => {
    const token = localStorage.getItem("token");
    const currentPage = window.location.pathname;

    const publicRoutes = [
      "/frontend/modules/auth/login/login.html",
      "/frontend/modules/auth/register/register.html",
      "/frontend/modules/main/tyc.html",
    ];

    if (!token) {
      if (!publicRoutes.includes(currentPage)) {
        console.warn("Usuario no autenticado. Redirigiendo a la página de login.");
        window.location.replace("/frontend/modules/auth/login/login.html");
      }
      return;
    }

    const payload = parseJwt(token);

    if (!payload) {
      console.error("Token inválido o corrupto. Limpiando y redirigiendo al login.");
      localStorage.removeItem("token");
      window.location.replace("/frontend/modules/auth/login/login.html");
      return;
    }

    const isAdmin = payload.role === "admin";
    const adminDashboard = "/frontend/modules/admin/admin/admin.html";
    const userDashboard = "/frontend/modules/main/dashboard.html";

    if (isAdmin && currentPage.includes("dashboard.html")) {
      console.log("Admin detectado. Redirigiendo al panel de administrador.");
      window.location.replace(adminDashboard);
      return;
    }

    if (!isAdmin && currentPage.includes("admin.html")) {
      console.warn("Acceso denegado al panel de administrador. Redirigiendo...");
      window.location.replace(userDashboard);
    }
  };
  checkAuthentication();

  const loadNavbar = async () => {
    try {
      const response = await fetch("/frontend/modules/main/navbar/navbar.html");
      const html = await response.text();
      const placeholder = document.getElementById("navbar-placeholder");

      if (!placeholder) {
        console.error("No se encontró el contenedor con id 'navbar-placeholder'");
        return;
      }

      placeholder.innerHTML = html;

      setupBusqueda();
      setupLogout();
      updateNavbarLinks();
    } catch (err) {
      console.error("Error al cargar el navbar:", err);
    }
  };

  const setupLogout = () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        console.log("Token de usuario eliminado. Redirigiendo al login.");
        window.location.replace("/frontend/modules/auth/login/login.html");
      });
    } else {
      console.error("No se encontró el botón de cerrar sesión (logoutBtn).");
    }
  };

  const updateFilterIndicator = (filtro) => {
    let text = "";
    if (filtro !== "todas") {
      text = `Buscando por: ${filtro}`;
    }

    let existing = document.getElementById("filter-indicator");

    if (!existing) {
      existing = document.createElement("div");
      existing.id = "filter-indicator";
      existing.className = "filter-indicator";
      document.querySelector(".search-container").appendChild(existing);
    }

    existing.textContent = text;
  };

  const updateNavbarLinks = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:3000/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error("No se pudo obtener la información del usuario para la navbar.");
        return;
      }

      const user = await response.json();
      const coinsLink = document.getElementById("nav-coins-link");
      const publicProfileLink = document.getElementById("public-profile-link");

      if (user && typeof user.coins !== "undefined" && coinsLink) {
        coinsLink.innerHTML = `⍟ ${user.coins}`;
      }

      if (user && user._id && publicProfileLink) {
        publicProfileLink.href = `/frontend/modules/user/public-profile/publicprofile.html?id=${user._id}`;
      }
    } catch (error) {
      console.error("Error al actualizar los enlaces de la navbar:", error);
    }
  };

  const setupBusqueda = () => {
    const searchInput = document.getElementById("search-input");
    const searchResultsDropdown = document.getElementById("search-results-dropdown");
    const API_SEARCH_URL = "http://localhost:3000/api/stories";

    let searchTimeout;

    if (!searchInput || !searchResultsDropdown) {
      console.error("No se encontró el input o el contenedor de resultados de búsqueda.");
      return;
    }

    const fetchStoriesByTitle = async (query) => {
      if (query.length < 2) {
        searchResultsDropdown.classList.remove("show");
        return;
      }

      try {
        const url = `${API_SEARCH_URL}?search=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        renderSearchResults(data.stories, query);
      } catch (error) {
        console.error("Error al buscar historias:", error);
        searchResultsDropdown.innerHTML =
          '<div style="padding: 10px; color: red;">Error al cargar resultados.</div>';
        searchResultsDropdown.classList.add("show");
      }
    };

    const renderSearchResults = (stories, query) => {
      searchResultsDropdown.innerHTML = "";

      if (stories && stories.length > 0) {
        stories.slice(0, 3).forEach((story) => {
          const resultItem = document.createElement("a");
          resultItem.href = `/frontend/modules/stories/preview-story/preview.html?id=${story._id}`; // Enlace a la página de vista previa
          resultItem.classList.add("search-result-item");

          const title = story.title;
          const regex = new RegExp(`(${query})`, "gi");
          const highlightedTitle = title.replace(regex, "<strong>$1</strong>");

          resultItem.innerHTML = `
            <img src="${story.coverImage || "/images/default-cover.jpg"}" alt="Portada" />
            <span>${highlightedTitle}</span>
          `;
          searchResultsDropdown.appendChild(resultItem);
        });
        searchResultsDropdown.classList.add("show");
      } else {
        searchResultsDropdown.classList.remove("show");
      }
    };

    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      if (query.length === 0) {
        searchResultsDropdown.classList.remove("show");
        return;
      }
      searchTimeout = setTimeout(() => {
        fetchStoriesByTitle(query);
      }, 300);
    });

    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !searchResultsDropdown.contains(e.target)) {
        searchResultsDropdown.classList.remove("show");
      }
    });

    searchInput.addEventListener("blur", () => {
      if (searchInput.value.trim().length === 0) {
        searchResultsDropdown.classList.remove("show");
      }
    });

    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim().length > 0 && searchResultsDropdown.children.length > 0) {
        searchResultsDropdown.classList.add("show");
      }
    });
  };

  document.addEventListener("DOMContentLoaded", loadNavbar);
})();
