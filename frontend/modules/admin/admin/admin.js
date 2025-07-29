(() => {
  const AdminApp = (() => {
    const htmlElements = {
      contentSections: document.querySelectorAll(".content-section"),
      adminNavbarPlaceholder: document.getElementById("admin-navbar-placeholder"),
      totalUsers: document.getElementById("total-users"),
      totalStories: document.getElementById("total-stories"),
      totalReports: document.getElementById("total-reports"),
      totalRevenue: document.getElementById("total-revenue"),
      usersDataContainer: document.getElementById("users-data-container"),
      storiesDataContainer: document.getElementById("stories-data-container"),
      reportsDataContainer: document.getElementById("reports-data-container"),
      reportModal: document.getElementById("report-details-modal"),
      reportModalContent: document.getElementById("report-details-content"),
      reportModalCloseBtn: document.querySelector("#report-details-modal .close-button"),
      reportFilters: document.getElementById("report-filters"),
    };

    const API_BASE_URL = "http://localhost:3000/api";
    let reportsCache = [];

    const methods = {
      showNotification: (message, isError = false) => {
        const notification = document.createElement("div");
        notification.className = `editor-notification ${isError ? "error" : ""}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add("show"), 10);
        setTimeout(() => {
          notification.classList.remove("show");
          setTimeout(
            () => document.body.contains(notification) && document.body.removeChild(notification),
            500
          );
        }, 3000);
      },

      fetchAPI: async (url, options = {}) => {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.replace("/frontend/modules/auth/login/login.html");
          return null;
        }
        const headers = { ...options.headers, Authorization: `Bearer ${token}` };
        if (options.body) {
          headers["Content-Type"] = "application/json";
        }
        try {
          const response = await fetch(url, { ...options, headers });
          if (response.status === 204 || response.statusText === "No Content")
            return { success: true };
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || data.error || `Error: ${response.status}`);
          }
          return data;
        } catch (err) {
          console.error(`Error en fetchAPI para ${url}:`, err);
          methods.showNotification(err.message, true);
          return null;
        }
      },

      mapStoryStatus: (status) => {
        const statuses = {
          published: "Publicada",
          draft: "Borrador",
          archived: "Archivada",
        };
        return statuses[status] || status;
      },

      showSection: (sectionId) => {
        htmlElements.contentSections.forEach((s) => s.classList.add("hidden"));
        document.getElementById(sectionId).classList.remove("hidden");
      },

      setActiveLink: (clickedLink) => {
        document.querySelectorAll(".admin-nav a").forEach((l) => l.classList.remove("active"));
        clickedLink.classList.add("active");
      },

      async loadDashboardStats() {
        const [users, stories, reports, balance] = await Promise.all([
          methods.fetchAPI(`${API_BASE_URL}/user/all`),
          methods.fetchAPI(`${API_BASE_URL}/stories`),
          methods.fetchAPI(`${API_BASE_URL}/admin/reports`),
          methods.fetchAPI(`${API_BASE_URL}/transactions/balance`),
        ]);
        htmlElements.totalUsers.textContent = users?.length || 0;
        htmlElements.totalStories.textContent = stories?.stories?.length || 0;
        const pendingReports = reports?.reports?.filter((r) => r.status === "pending").length || 0;
        htmlElements.totalReports.textContent = pendingReports;
        document.querySelector(".reports-count").textContent = pendingReports;
        if (balance?.balance?.available[0]) {
          const amount = balance.balance.available[0].amount / 100;
          htmlElements.totalRevenue.textContent = `$${amount.toFixed(2)}`;
        }
      },

      renderUsersTable(users) {
        if (!users || users.length === 0) {
          htmlElements.usersDataContainer.innerHTML = "<p>No se encontraron usuarios.</p>";
          return;
        }
        let tableHTML = `<table class="data-table"><thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Rol</th><th>Acciones</th></tr></thead><tbody>`;
        users.forEach((user) => {
          tableHTML += `<tr data-row-id="${user._id}">
              <td>${user._id}</td>
              <td>${user.username}</td>
              <td>${user.email}</td>
              <td>${user.role}</td>
              <td class="action-buttons">
                  <button class="delete-btn" data-id="${user._id}" data-username="${user.username}" data-action="delete-user">🗑️ Eliminar</button>
              </td>
            </tr>`;
        });
        tableHTML += `</tbody></table>`;
        htmlElements.usersDataContainer.innerHTML = tableHTML;
        document
          .querySelectorAll('[data-action="delete-user"]')
          .forEach((btn) => btn.addEventListener("click", handlers.handleUserAction));
      },

      renderStoriesTable(stories) {
        if (!stories || stories.length === 0) {
          htmlElements.storiesDataContainer.innerHTML = "<p>No se encontraron historias.</p>";
          return;
        }
        let tableHTML = `<table class="data-table"><thead><tr><th>ID</th><th>Título</th><th>Autor</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>`;
        stories.forEach((story) => {
          tableHTML += `<tr data-row-id="${story._id}">
              <td>${story._id}</td>
              <td>${story.title}</td>
              <td>${story.author?.username || "N/A"}</td>
              <td>${methods.mapStoryStatus(story.status)}</td>
              <td class="action-buttons">
                  <button class="delete-btn" data-id="${story._id}" data-title="${
            story.title
          }" data-action="delete-story">🗑️ Eliminar</button>
              </td>
            </tr>`;
        });
        tableHTML += `</tbody></table>`;
        htmlElements.storiesDataContainer.innerHTML = tableHTML;
        document
          .querySelectorAll('[data-action="delete-story"]')
          .forEach((btn) => btn.addEventListener("click", handlers.handleStoryAction));
      },

      renderReportsTable(reports) {
        reportsCache = reports || [];
        if (reportsCache.length === 0) {
          htmlElements.reportsDataContainer.innerHTML = "<p>No hay reportes para este filtro.</p>";
          return;
        }
        let tableHTML = `<table class="data-table"><thead><tr><th>ID</th><th>Motivo</th><th>Estado</th><th>Reportado por</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>`;
        reportsCache.forEach((report) => {
          tableHTML += `<tr data-row-id="${report._id}">
              <td>${report._id}</td>
              <td>${report.reason}</td>
              <td><span class="status-badge ${report.status}">${report.status}</span></td>
              <td>${report.userId?.username || "N/A"}</td>
              <td>${new Date(report.createdAt).toLocaleDateString()}</td>
              <td class="action-buttons">
                  <button data-id="${report._id}" data-action="view-report">🔍 Ver</button>
                  ${
                    report.status === "pending"
                      ? `<button data-id="${report._id}" data-action="resolve-report">✅ Resolver</button>`
                      : ""
                  }
              </td>
            </tr>`;
        });
        tableHTML += `</tbody></table>`;
        htmlElements.reportsDataContainer.innerHTML = tableHTML;
        document
          .querySelectorAll('[data-action="view-report"], [data-action="resolve-report"]')
          .forEach((btn) => btn.addEventListener("click", handlers.handleReportAction));
      },
    };

    const handlers = {
      async handleUserAction(event) {
        const { id, username } = event.currentTarget.dataset;
        if (confirm(`¿Seguro que quieres eliminar al usuario "${username}" (${id})?`)) {
          const row = document.querySelector(`tr[data-row-id='${id}']`);
          const originalDisplay = row.style.display;
          row.style.display = "none";

          const result = await methods.fetchAPI(`${API_BASE_URL}/user/${id}`, { method: "DELETE" });
          if (result) {
            methods.showNotification("Usuario eliminado.");
            await methods.loadDashboardStats();
          } else {
            row.style.display = originalDisplay;
            methods.showNotification("Error al eliminar el usuario.", true);
          }
        }
      },

      async handleStoryAction(event) {
        const { id, title } = event.currentTarget.dataset;
        if (confirm(`¿Seguro que quieres eliminar la historia "${title}" (${id})?`)) {
          const row = document.querySelector(`tr[data-row-id='${id}']`);
          const originalDisplay = row.style.display;
          row.style.display = "none";

          const result = await methods.fetchAPI(`${API_BASE_URL}/stories/${id}`, {
            method: "DELETE",
          });
          if (result) {
            methods.showNotification("Historia eliminada.");
            await methods.loadDashboardStats();
          } else {
            row.style.display = originalDisplay;
            methods.showNotification("Error al eliminar la historia.", true);
          }
        }
      },

      async handleReportAction(event) {
        const { id, action } = event.currentTarget.dataset;
        const report = reportsCache.find((r) => r._id === id);

        if (action === "view-report" && report) {
          htmlElements.reportModalContent.innerHTML = `
              <p><strong>ID Reporte:</strong> ${report._id}</p>
              <p><strong>Reportado por:</strong> ${
                report.userId?.username || "Usuario eliminado"
              }</p>
              <p><strong>Fecha:</strong> ${new Date(report.createdAt).toLocaleString()}</p>
              <p><strong>Motivo:</strong> ${report.reason}</p>
              <p><strong>Detalles:</strong> ${report.details || "No proporcionados"}</p>
              <p><strong>Contenido:</strong> <a href="/frontend/modules/stories/preview-story/preview.html?id=${
                report.contentId?._id
              }" target="_blank">${report.contentId?.title || "Contenido eliminado"}</a></p>`;
          htmlElements.reportModal.style.display = "flex";
        } else if (action === "resolve-report") {
          if (confirm(`¿Marcar el reporte ${id} como resuelto?`)) {
            const result = await methods.fetchAPI(`${API_BASE_URL}/admin/reports/${id}`, {
              method: "PATCH",
              body: JSON.stringify({ status: "resolved" }),
            });
            if (result) {
              methods.showNotification("Reporte resuelto.");
              await methods.loadDashboardStats();
              const currentFilter = document.querySelector("#report-filters .filter-btn.active")
                .dataset.status;
              const url =
                currentFilter === "all"
                  ? `${API_BASE_URL}/admin/reports`
                  : `${API_BASE_URL}/admin/reports?status=${currentFilter}`;
              const reportsData = await methods.fetchAPI(url);
              methods.renderReportsTable(reportsData?.reports);
            }
          }
        }
      },

      async handleReportFilterClick(event) {
        const button = event.currentTarget;
        const status = button.dataset.status;
        htmlElements.reportFilters
          .querySelectorAll(".filter-btn")
          .forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        const url =
          status === "all"
            ? `${API_BASE_URL}/admin/reports`
            : `${API_BASE_URL}/admin/reports?status=${status}`;
        htmlElements.reportsDataContainer.innerHTML = "<p>Cargando reportes...</p>";
        const reportsData = await methods.fetchAPI(url);
        methods.renderReportsTable(reportsData?.reports);
      },

      async handleNavLinkClick(event) {
        event.preventDefault();
        const sectionType = event.currentTarget.dataset.section;
        methods.showSection(sectionType + "-section");
        methods.setActiveLink(event.currentTarget);
        if (sectionType === "users") {
          const data = await methods.fetchAPI(`${API_BASE_URL}/user/all`);
          methods.renderUsersTable(data);
        } else if (sectionType === "stories") {
          const data = await methods.fetchAPI(`${API_BASE_URL}/stories`);
          methods.renderStoriesTable(data?.stories);
        } else if (sectionType === "reports") {
          document.querySelector('#report-filters .filter-btn[data-status="all"]').click();
        }
      },

      closeReportModal() {
        htmlElements.reportModal.style.display = "none";
      },

      async initializeAdminPage() {
        try {
          const response = await fetch("/frontend/modules/admin/navbar/navbar.html");
          htmlElements.adminNavbarPlaceholder.innerHTML = await response.text();
          document
            .querySelectorAll(".admin-nav a")
            .forEach((l) => l.addEventListener("click", handlers.handleNavLinkClick));
          htmlElements.reportModalCloseBtn.addEventListener("click", handlers.closeReportModal);
          htmlElements.reportFilters
            .querySelectorAll(".filter-btn")
            .forEach((btn) => btn.addEventListener("click", handlers.handleReportFilterClick));
          window.addEventListener("click", (e) => {
            if (e.target === htmlElements.reportModal) handlers.closeReportModal();
          });
          await methods.loadDashboardStats();
        } catch (error) {
          console.error("Error al inicializar:", error);
        }
      },
    };

    return {
      init: () => {
        document.addEventListener("DOMContentLoaded", handlers.initializeAdminPage);
      },
    };
  })();

  AdminApp.init();
})();
