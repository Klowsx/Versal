// Versal/frontend/modules/admin/admin.js

(() => {
  const AdminApp = (() => {
    const htmlElements = {
      adminNavLinks: null, // Se inicializa después de cargar el navbar
      reportsCountBadge: null, // Se inicializa después de cargar el navbar
      contentSections: document.querySelectorAll(".content-section"),
      adminNavbarPlaceholder: document.getElementById("admin-navbar-placeholder"),
      totalUsers: document.getElementById("total-users"),
      totalStories: document.getElementById("total-stories"),
      totalReports: document.getElementById("total-reports"),
      totalAssets: document.getElementById("total-assets"),
      usersDataContainer: document.getElementById("users-data-container"),
      storiesDataContainer: document.getElementById("stories-data-container"),
      reportsDataContainer: document.getElementById("reports-data-container"),
    };

    const API_BASE_URL = "http://localhost:3000/api";

    const methods = {
      /**
       * Realiza una petición fetch a la API del backend, incluyendo el token de autorización.
       * @param {string} url - La URL del endpoint de la API.
       * @param {object} options - Opciones para la petición fetch (método, headers, body, etc.).
       * @returns {Promise<object|null>} - La respuesta JSON de la API o null en caso de error.
       */
      async fetchAPI(url, options = {}) {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Debes iniciar sesión como administrador para acceder a esta página.");
          window.location.replace("/frontend/modules/auth/login/login.html");
          return null;
        }

        options.headers = {
          ...options.headers,
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            if (response.status === 403) {
              alert("Acceso denegado. No tienes permisos de administrador.");
              window.location.replace("/frontend/modules/main/dashboard.html");
              return null;
            }
            const error = await response.json();
            throw new Error(error.message || `Error en la petición: ${response.statusText}`);
          }
          return await response.json();
        } catch (err) {
          console.error(`Error en fetchAPI para ${url}:`, err);
          alert(`Error: ${err.message}`);
          return null;
        }
      },

      /**
       * Verifica el rol del usuario para asegurar que sea un administrador.
       * @returns {boolean} - True si el usuario es administrador, false en caso contrario.
       */
      async checkAdminRole() {
        const userRole = localStorage.getItem("userRole");
        if (userRole !== "admin") {
          alert("Acceso denegado. Solo los administradores pueden ver esta página.");
          window.location.replace("/frontend/modules/main/dashboard.html");
          return false;
        }
        return true;
      },

      /**
       * Muestra la sección de contenido especificada y oculta las demás.
       * @param {string} sectionId - El ID de la sección a mostrar (ej. "dashboard-section").
       */
      showSection: (sectionId) => {
        htmlElements.contentSections.forEach((section) => {
          section.classList.add("hidden");
        });
        document.getElementById(sectionId).classList.remove("hidden");
      },

      /**
       * Establece el enlace de navegación activo en el navbar.
       * @param {HTMLElement} clickedLink - El enlace del navbar que fue clickeado.
       */
      setActiveLink: (clickedLink) => {
        if (htmlElements.adminNavLinks) {
            htmlElements.adminNavLinks.forEach((link) => {
              link.classList.remove("active");
            });
            clickedLink.classList.add("active");
        }
      },

      /**
       * Carga y calcula las estadísticas generales del dashboard directamente en el frontend.
       * Realiza llamadas a las funciones de obtención de datos de usuarios, historias y reportes.
       */
      async loadDashboardStats() {
        try {
          // Obtener datos de usuarios y contar
          const users = await methods.fetchUsersData();
          const totalUsers = users ? users.length : 0;
          htmlElements.totalUsers.textContent = (totalUsers / 1000).toFixed(1) + 'K';

          // Obtener datos de historias y contar
          const storiesData = await methods.fetchStoriesData();
          const stories = storiesData ? storiesData.stories : [];
          const totalStories = stories ? stories.length : 0;
          htmlElements.totalStories.textContent = (totalStories / 1000).toFixed(1) + 'K';

          // Obtener datos de reportes y contar los pendientes
          const reportsData = await methods.fetchReportsData();
          const reports = reportsData ? reportsData.reports : [];
          const pendingReports = reports.filter(r => r.status === 'pending').length;
          htmlElements.totalReports.textContent = pendingReports;
          if (htmlElements.reportsCountBadge) {
            htmlElements.reportsCountBadge.textContent = pendingReports;
          }

          // Para 'Activos', si no hay un endpoint de backend, mantén un placeholder o calcula si es posible
          htmlElements.totalAssets.textContent = '0K'; // Asume 0 si no hay fuente de datos

        } catch (error) {
          console.error("Error al calcular estadísticas del dashboard:", error);
        }
      },

      // --- Funciones para Usuarios ---
      async fetchUsersData() {
        try {
          const users = await methods.fetchAPI(`${API_BASE_URL}/user/all`);
          return users;
        } catch (error) {
          console.error("Error al obtener datos de usuarios:", error);
          return null;
        }
      },

      async renderUsersTable(users, containerElement) {
        if (users && users.length > 0) {
          let usersHtml = `
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre de Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
          `;
          users.forEach(user => {
            usersHtml += `
              <tr>
                <td>${user._id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td class="action-buttons">
                  <button data-id="${user._id}" data-action="edit-user">✏️ Editar</button>
                  <button class="delete-btn" data-id="${user._id}" data-action="delete-user">🗑️ Eliminar</button>
                </td>
              </tr>
            `;
          });
          usersHtml += `
              </tbody>
            </table>
          `;
          containerElement.innerHTML = usersHtml;

          document.querySelectorAll('[data-action="delete-user"]').forEach(button => {
              button.addEventListener('click', handlers.handleUserAction);
          });
          document.querySelectorAll('[data-action="edit-user"]').forEach(button => {
              button.addEventListener('click', handlers.handleUserAction);
          });

        } else {
          containerElement.innerHTML = '<p>No se encontraron usuarios.</p>';
        }
      },

      // --- Funciones para Historias ---
      async fetchStoriesData() {
        try {
          const result = await methods.fetchAPI(`${API_BASE_URL}/stories`);
          return result;
        } catch (error) {
          console.error("Error al obtener datos de historias:", error);
          return null;
        }
      },

      async renderStoriesTable(stories, containerElement) {
        if (stories && stories.length > 0) {
          let storiesHtml = `
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Autor</th>
                  <th>Estado</th>
                  <th>Vistas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
          `;
          stories.forEach(story => {
            storiesHtml += `
              <tr>
                <td>${story._id}</td>
                <td>${story.title}</td>
                <td>${story.author ? story.author.username : 'Desconocido'}</td>
                <td>${story.status}</td>
                <td>${story.views}</td>
                <td class="action-buttons">
                  <button data-id="${story._id}" data-action="edit-story">✏️ Editar</button>
                  <button class="delete-btn" data-id="${story._id}" data-action="delete-story">🗑️ Eliminar</button>
                </td>
              </tr>
            `;
          });
          storiesHtml += `
              </tbody>
            </table>
          `;
          containerElement.innerHTML = storiesHtml;

          document.querySelectorAll('[data-action="delete-story"]').forEach(button => {
              button.addEventListener('click', handlers.handleStoryAction);
          });
          document.querySelectorAll('[data-action="edit-story"]').forEach(button => {
              button.addEventListener('click', handlers.handleStoryAction);
          });

        } else {
          containerElement.innerHTML = '<p>No se encontraron historias.</p>';
        }
      },

      // --- Funciones para Reportes ---
      async fetchReportsData() {
        try {
          const result = await methods.fetchAPI(`${API_BASE_URL}/admin/reports`);
          return result;
        } catch (error) {
          console.error("Error al obtener datos de reportes:", error);
          return null;
        }
      },

      async renderReportsTable(reports, containerElement) {
        if (reports && reports.length > 0) {
          let reportsHtml = `
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Contenido Reportado</th>
                  <th>Reportado Por</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
          `;
          reports.forEach(report => {
            reportsHtml += `
              <tr>
                <td>${report._id}</td>
                <td>${report.type}</td>
                <td>${report.targetId} (${report.targetType})</td>
                <td>${report.reporterId ? report.reporterId.username : 'Desconocido'}</td>
                <td>${report.status}</td>
                <td>${new Date(report.createdAt).toLocaleDateString()}</td>
                <td class="action-buttons">
                  <button data-id="${report._id}" data-action="view-report">🔍 Ver</button>
                  <button data-id="${report._id}" data-action="resolve-report">✅ Resolver</button>
                </td>
              </tr>
            `;
          });
          reportsHtml += `
              </tbody>
            </table>
          `;
          containerElement.innerHTML = reportsHtml;

          document.querySelectorAll('[data-action="view-report"]').forEach(button => {
              button.addEventListener('click', handlers.handleReportAction);
          });
          document.querySelectorAll('[data-action="resolve-report"]').forEach(button => {
              button.addEventListener('click', handlers.handleReportAction);
          });

        } else {
          containerElement.innerHTML = '<p>No se encontraron reportes.</p>';
        }
      },

      // --- Funciones de Refresh (Callbacks) ---
      async refreshUsersList() {
        htmlElements.usersDataContainer.innerHTML = '<p>Cargando usuarios...</p>';
        const users = await methods.fetchUsersData();
        await methods.renderUsersTable(users, htmlElements.usersDataContainer);
      },

      async refreshStoriesList() {
        htmlElements.storiesDataContainer.innerHTML = '<p>Cargando historias...</p>';
        const storiesData = await methods.fetchStoriesData();
        await methods.renderStoriesTable(storiesData ? storiesData.stories : [], htmlElements.storiesDataContainer);
      },

      async refreshReportsList() {
        htmlElements.reportsDataContainer.innerHTML = '<p>Cargando reportes...</p>';
        const reportsData = await methods.fetchReportsData();
        await methods.renderReportsTable(reportsData ? reportsData.reports : [], htmlElements.reportsDataContainer);
      },
    };

    const handlers = {
      handleNavLinkClick: async (event) => {
        event.preventDefault();
        const sectionType = event.target.dataset.section;
        const sectionToShow = sectionType + "-section";
        methods.showSection(sectionToShow);
        methods.setActiveLink(event.target);

        if (sectionType === "users") {
          await methods.refreshUsersList();
        } else if (sectionType === "stories") {
          await methods.refreshStoriesList();
        } else if (sectionType === "reports") {
          await methods.refreshReportsList();
        } else if (sectionType === "dashboard") {
          await methods.loadDashboardStats();
        }
      },

      handleUserAction: async (event) => {
        const userId = event.target.dataset.id;
        const action = event.target.dataset.action;

        if (action === "delete-user") {
          if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${userId}?`)) {
            try {
              const response = await methods.fetchAPI(`${API_BASE_URL}/user/${userId}`, {
                method: 'DELETE',
              });
              if (response) {
                alert("Usuario eliminado correctamente.");
                await methods.refreshUsersList();
                await methods.loadDashboardStats();
              }
            } catch (error) {
              console.error("Error al eliminar usuario:", error);
              alert("Error al eliminar usuario.");
            }
          }
        } else if (action === "edit-user") {
          alert(`Funcionalidad de edición para el usuario ${userId} (por implementar).`);
        }
      },

      handleStoryAction: async (event) => {
        const storyId = event.target.dataset.id;
        const action = event.target.dataset.action;

        if (action === "delete-story") {
          if (confirm(`¿Estás seguro de que quieres eliminar la historia ${storyId}?`)) {
            try {
              const response = await methods.fetchAPI(`${API_BASE_URL}/stories/${storyId}`, {
                method: 'DELETE',
              });
              if (response) {
                alert("Historia eliminada correctamente.");
                await methods.refreshStoriesList();
                await methods.loadDashboardStats();
              }
            } catch (error) {
              console.error("Error al eliminar historia:", error);
              alert("Error al eliminar historia.");
            }
          }
        } else if (action === "edit-story") {
          alert(`Funcionalidad de edición para la historia ${storyId} (por implementar).`);
        }
      },

      handleReportAction: async (event) => {
        const reportId = event.target.dataset.id;
        const action = event.target.dataset.action;

        if (action === "view-report") {
          alert(`Ver detalles del reporte ${reportId} (por implementar).`);
        } else if (action === "resolve-report") {
          if (confirm(`¿Marcar el reporte ${reportId} como resuelto?`)) {
            try {
              const response = await methods.fetchAPI(`${API_BASE_URL}/admin/reports/${reportId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'resolved' })
              });
              if (response) {
                alert("Reporte marcado como resuelto.");
                await methods.refreshReportsList();
                await methods.loadDashboardStats();
              }
            } catch (error) {
              console.error("Error al resolver reporte:", error);
              alert("Error al resolver reporte.");
            }
          }
        }
      },

      async initializeAdminPage() {
        const isAdmin = await methods.checkAdminRole();
        if (!isAdmin) return;

        try {
          const response = await fetch("/frontend/modules/admin/navbar/navbar.html");
          if (!response.ok) throw new Error("Failed to load admin navbar.");
          const navbarHtml = await response.text();
          htmlElements.adminNavbarPlaceholder.innerHTML = navbarHtml;

          htmlElements.adminNavLinks = document.querySelectorAll(".admin-nav a");
          htmlElements.reportsCountBadge = document.querySelector(".reports-count");

          htmlElements.adminNavLinks.forEach((link) => {
            link.addEventListener("click", handlers.handleNavLinkClick);
          });

          methods.showSection("dashboard-section");
          await methods.loadDashboardStats();

        } catch (error) {
          console.error("Error loading admin navbar:", error);
          alert("Error al cargar la barra de navegación del administrador.");
        }
      },
    };

    const init = () => {
      handlers.initializeAdminPage();
    };

    return { init };
  })();

  document.addEventListener("DOMContentLoaded", AdminApp.init);
})();