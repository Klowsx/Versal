(() => {
  // Función para verificar la autenticación globalmente
  const checkAuthentication = () => {
    const token = localStorage.getItem("token");
    const currentPage = window.location.pathname;

    // Rutas permitidas sin autenticación
    const publicRoutes = [
      "/frontend/modules/auth/login/login.html",
      "/frontend/modules/auth/register/register.html",
      "/frontend/modules/main/tyc.html" // Terminos y condiciones
    ];

    // Si no hay token y la página actual NO es una ruta pública, redirigir al login
    if (!token && !publicRoutes.includes(currentPage)) {
      console.warn("Usuario no autenticado. Redirigiendo a la página de login.");
      window.location.replace("/frontend/modules/auth/login/login.html");
    }
  };

  // Ejecutar la verificación de autenticación inmediatamente al cargar el script
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

      setupBusqueda(); // Inicializa el buscador
      setupLogout();    // Inicializa la función de cerrar sesión

    } catch (err) {
      console.error("Error al cargar el navbar:", err);
    }
  };

  // Función para inicializar el cierre de sesión
  const setupLogout = () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault(); // Prevenir la navegación predeterminada del enlace
        localStorage.removeItem("token"); // Eliminar el token del almacenamiento local
        console.log("Token de usuario eliminado. Redirigiendo al login.");
        window.location.replace("/frontend/modules/auth/login/login.html"); // Redirigir al login
      });
    } else {
      console.error("No se encontró el botón de cerrar sesión (logoutBtn).");
    }
  };

  // updateFilterIndicator is not directly used by the new live search but kept if needed elsewhere.
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

  const setupBusqueda = () => {
    const searchInput = document.getElementById("search-input");
    const searchResultsDropdown = document.getElementById("search-results-dropdown");
    const API_SEARCH_URL = "http://localhost:3000/api/stories"; // Endpoint para buscar historias

    let searchTimeout;

    if (!searchInput || !searchResultsDropdown) {
      console.error("No se encontró el input o el contenedor de resultados de búsqueda.");
      return;
    }

    const fetchStoriesByTitle = async (query) => {
      if (query.length < 2) { // Opcional: Solo buscar si hay 2 o más caracteres
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
        searchResultsDropdown.innerHTML = '<div style="padding: 10px; color: red;">Error al cargar resultados.</div>';
        searchResultsDropdown.classList.add("show");
      }
    };

    const renderSearchResults = (stories, query) => {
      searchResultsDropdown.innerHTML = ""; // Limpiar resultados anteriores

      if (stories && stories.length > 0) {
        // Mostrar solo las primeras 3 historias
        stories.slice(0, 3).forEach(story => {
          const resultItem = document.createElement("a");
          resultItem.href = `/frontend/modules/stories/preview-story/preview.html?id=${story._id}`; // Enlace a la página de vista previa
          resultItem.classList.add("search-result-item");

          // Resaltar el texto coincidente en el título
          const title = story.title;
          const regex = new RegExp(`(${query})`, 'gi'); // Expresión regular para buscar y resaltar
          const highlightedTitle = title.replace(regex, '<strong>$1</strong>');

          resultItem.innerHTML = `
            <img src="${story.coverImage || '/images/default-cover.jpg'}" alt="Portada" />
            <span>${highlightedTitle}</span>
          `;
          searchResultsDropdown.appendChild(resultItem);
        });
        searchResultsDropdown.classList.add("show"); // Mostrar el dropdown
      } else {
        searchResultsDropdown.classList.remove("show"); // Ocultar si no hay resultados
      }
    };

    // Evento 'input' para la búsqueda en vivo con debounce
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      if (query.length === 0) {
        searchResultsDropdown.classList.remove("show");
        return;
      }
      searchTimeout = setTimeout(() => {
        fetchStoriesByTitle(query);
      }, 300); // Debounce de 300ms
    });

    // Ocultar el dropdown cuando se hace clic fuera del buscador
    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !searchResultsDropdown.contains(e.target)) {
        searchResultsDropdown.classList.remove("show");
      }
    });

    // Ocultar el dropdown si el input pierde el foco y no hay query
    searchInput.addEventListener("blur", () => {
        if (searchInput.value.trim().length === 0) {
            searchResultsDropdown.classList.remove("show");
        }
    });

    // Mantener visible si el input tiene foco y hay query
    searchInput.addEventListener("focus", () => {
        if (searchInput.value.trim().length > 0 && searchResultsDropdown.children.length > 0) {
            searchResultsDropdown.classList.add("show");
        }
    });
  };

  // El evento DOMContentLoaded asegura que el HTML ya está cargado y el placeholder existe
  document.addEventListener("DOMContentLoaded", loadNavbar);
})();