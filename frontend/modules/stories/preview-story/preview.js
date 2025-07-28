(() => {
  const StoryDetailApp = (() => {
    const API_BASE_URL = "http://localhost:3000/api";
    const API_ENDPOINTS = {
      GET_STORY: (id) => `${API_BASE_URL}/stories/${id}`,
      GET_USER_ME: `${API_BASE_URL}/user/me`,
      DONATE_STORY: (id) => `${API_BASE_URL}/stories/${id}/donate`,
      TOGGLE_FAVORITE: (storyId) => `${API_BASE_URL}/stories/${storyId}/favorite`,
      CREATE_REPORT: `${API_BASE_URL}/reports`,
      GET_IS_FAVORITE: (storyId) => `${API_BASE_URL}/stories/${storyId}/isFavorite`,
      GET_PUBLISHED_CHAPTER_COUNT: (storyId) =>
        `${API_BASE_URL}/stories/${storyId}/published-chapters-count`,
    };

    const htmlElements = {
      // Elementos de la historia
      cover: document.getElementById("story-cover"),
      title: document.getElementById("story-title"),
      authorName: document.getElementById("story-author"),
      authorAvatar: document.getElementById("author-avatar"),
      tagsContainer: document.getElementById("story-tags"),
      likes: document.getElementById("story-likes"),
      synopsis: document.getElementById("synopsis-1"),
      status: document.getElementById("story-status"),
      chapters: document.getElementById("story-chapters"),
      language: document.getElementById("story-language"),

      // Botones principales
      readBtn: document.getElementById("read-now"),
      donateBtn: document.getElementById("donate"),
      saveStoryBtn: document.getElementById("save-story"),
      saveIcon: document.getElementById("save-icon"),
      saveText: document.getElementById("save-text"),
      reportStoryBtn: document.getElementById("report-story"),

      // Modales y sus elementos
      donationModal: document.getElementById("donationModal"),
      donationAmountInput: document.getElementById("donationAmount"),
      availableCoinsSpan: document.getElementById("availableCoins"),
      confirmDonationBtn: document.getElementById("confirmDonation"),
      cancelDonationBtn: document.getElementById("cancelDonation"),
      // Ya no necesitamos 'donationModalMessage' directamente para los toasts.

      reportModal: document.getElementById("reportModal"),
      reportReasonSelect: document.getElementById("reportReason"),
      reportDetailsTextarea: document.getElementById("reportDetails"),
      confirmReportBtn: document.getElementById("confirmReport"),
      cancelReportBtn: document.getElementById("cancelReport"),
      // Ya no necesitamos 'reportModalMessage' directamente para los toasts.

      navbarPlaceholder: document.getElementById("navbar-placeholder"),
    };

    const storyId = new URLSearchParams(window.location.search).get("id");

    let currentStory = null;
    let currentStoryAuthorId = null;
    let currentUserId = null;
    let currentUserCoins = 0;
    let isStoryFavorited = false;

    const methods = {
      async fetchAPI(url, options = {}) {
        const token = localStorage.getItem("token");
        if (token) {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          };
        }

        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              methods.showNotification(
                "Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.",
                true
              );
              localStorage.removeItem("token");
              setTimeout(() => {
                window.location.href = "/frontend/modules/auth/login/login.html";
              }, 1500);
              return null;
            }
            const error = await response
              .json()
              .catch(() => ({ message: "Error desconocido en la respuesta." }));
            throw new Error(error.message || `Error de servidor: ${response.status}`);
          }
          if (
            response.status === 204 ||
            options.method === "DELETE" ||
            (options.method === "POST" && response.headers.get("Content-Length") === "0")
          ) {
            return { success: true };
          }
          return await response.json();
        } catch (err) {
          console.error(`Error en fetchAPI para ${url}:`, err);
          methods.showNotification(
            err.message || "Error desconocido al comunicarse con el servidor.",
            true
          );
          return null;
        }
      },

      async fetchStoryDetails() {
        if (!storyId) {
          methods.showNotification("Error: No se proporcionó un ID de historia.", true);
          return null;
        }

        const data = await methods.fetchAPI(API_ENDPOINTS.GET_STORY(storyId));
        if (!data || !data.story) {
          methods.showNotification("No se pudo cargar la historia.", true);
          return null;
        }

        currentStory = data.story;
        currentStoryAuthorId = data.story.author?._id;

        const chapterCountResult = await methods.fetchAPI(
          API_ENDPOINTS.GET_PUBLISHED_CHAPTER_COUNT(storyId)
        );

        if (chapterCountResult && typeof chapterCountResult.publishedChapterCount === "number") {
          currentStory.chapterCount = chapterCountResult.publishedChapterCount;
        } else {
          currentStory.chapterCount = 0;
          console.warn("No se pudo obtener el conteo de capítulos publicados.");
        }

        return currentStory;
      },

      async fetchCurrentUserDetails() {
        const userData = await methods.fetchAPI(API_ENDPOINTS.GET_USER_ME);
        if (userData) {
          currentUserId = userData._id;
          currentUserCoins = userData.coins;
        }
        return userData;
      },

      async checkIsStoryFavorited() {
        if (!currentUserId) {
          isStoryFavorited = false;
          methods.updateSaveButtonUI();
          console.log(
            "[Preview App] Usuario no autenticado, asumiendo historia NO favorita por defecto."
          );
          return;
        }

        const result = await methods.fetchAPI(API_ENDPOINTS.GET_IS_FAVORITE(storyId));
        if (result && typeof result.isFavorite === "boolean") {
          isStoryFavorited = result.isFavorite;
          methods.updateSaveButtonUI();
        } else {
          isStoryFavorited = false;
          methods.updateSaveButtonUI();
        }
      },

      mapStatus(status) {
        switch (status) {
          case "draft":
            return "Borrador";
          case "published":
            return "Publicado";
          case "archived":
            return "Archivado";
          default:
            return "Desconocido";
        }
      },

      updateSaveButtonUI() {
        if (isStoryFavorited) {
          htmlElements.saveIcon.className = "icon fas fa-bookmark";
          htmlElements.saveText.textContent = "Guardada";
          htmlElements.saveStoryBtn.classList.add("saved");
        } else {
          htmlElements.saveIcon.className = "icon far fa-bookmark";
          htmlElements.saveText.textContent = "Guardar Historia";
          htmlElements.saveStoryBtn.classList.remove("saved");
        }
      },

      showNotification: (message, isError = false) => {
        console.log("Notificación intentada:", message, "Es error:", isError);
        const notification = document.createElement("div");
        notification.className = `editor-notification ${isError ? "error" : ""}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.classList.add("show");
        }, 10);
        setTimeout(() => {
          notification.classList.remove("show");
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 500);
        }, 3000);
      },

      displayModal: (modalElement, show) => {
        modalElement.style.display = show ? "flex" : "none";
        if (show) {
          modalElement.classList.add("show-modal");
        } else {
          modalElement.classList.remove("show-modal");
        }

        if (show) {
          if (modalElement === htmlElements.donationModal) {
            htmlElements.availableCoinsSpan.textContent = currentUserCoins;
            htmlElements.donationAmountInput.value = 10;
          } else if (modalElement === htmlElements.reportModal) {
            htmlElements.reportReasonSelect.value = "";
            htmlElements.reportDetailsTextarea.value = "";
          }
        }
      },
    };
    const handlers = {
      async handlePageLoad() {
        fetch("/frontend/modules/main/navbar/navbar.html")
          .then((response) => response.text())
          .then((html) => {
            htmlElements.navbarPlaceholder.innerHTML = html;
          })
          .catch((error) => console.error("Error al cargar el navbar:", error));

        const story = await methods.fetchStoryDetails();
        if (!story) return;

        htmlElements.cover.src = story.coverImage || "/frontend/resources/default-cover.png";
        htmlElements.title.textContent = story.title;
        htmlElements.authorName.textContent = story.author?.username || "Anónimo";

        if (story.author?.profileImage) {
          htmlElements.authorAvatar.style.backgroundImage = `url(${story.author.profileImage})`;
        } else {
          htmlElements.authorAvatar.style.backgroundImage = `url(/frontend/resources/profile.png)`;
        }

        htmlElements.tagsContainer.innerHTML = "";
        story.tags.forEach((tag) => {
          const span = document.createElement("span");
          span.textContent = tag.name;
          htmlElements.tagsContainer.appendChild(span);
        });

        htmlElements.likes.textContent = `${story.likes ?? 0} me gusta`;
        htmlElements.synopsis.textContent = story.description || "Esta historia no tiene sinopsis.";
        htmlElements.status.textContent = methods.mapStatus(story.status);
        htmlElements.chapters.textContent = story.chapterCount ?? 0;
        htmlElements.language.textContent = story.language || "No especificado";

        await methods.fetchCurrentUserDetails();
        await methods.checkIsStoryFavorited();

        if (currentUserId && currentStoryAuthorId === currentUserId) {
          htmlElements.donateBtn.style.display = "none";
          htmlElements.saveStoryBtn.style.display = "none";
          htmlElements.reportStoryBtn.style.display = "none";
        } else if (!currentUserId) {
          methods.showNotification(
            "Inicia sesión para interactuar con esta historia (donar, guardar, reportar).",
            false
          );
          htmlElements.donateBtn.style.display = "none";
          htmlElements.saveStoryBtn.style.display = "none";
          htmlElements.reportStoryBtn.style.display = "none";
        }
      },

      handleReadNowClick() {
        if (storyId) {
          window.location.href = `/frontend/modules/stories/read-story/read_story.html?id=${storyId}`;
        }
      },

      async handleDonateClick() {
        if (!localStorage.getItem("token")) {
          methods.showNotification("Debes iniciar sesión para donar.", true);
          setTimeout(() => {
            window.location.href = "/frontend/modules/auth/login/login.html";
          }, 1000);
          return;
        }
        methods.displayModal(htmlElements.donationModal, true);
      },

      async handleConfirmDonation() {
        const amount = parseInt(htmlElements.donationAmountInput.value, 10);

        if (isNaN(amount) || amount <= 0) {
          methods.showNotification("Por favor, ingresa una cantidad válida para donar.", true);
          return;
        }

        if (currentUserId === currentStoryAuthorId) {
          methods.showNotification("No puedes donar monedas a tu propia historia.", true);
          return;
        }

        if (currentUserCoins < amount) {
          methods.showNotification(
            `No tienes suficientes monedas. Te faltan ${amount - currentUserCoins} ⍟.`,
            true
          );
          const confirmBuy = confirm(
            `No tienes suficientes monedas. Te faltan ${
              amount - currentUserCoins
            } ⍟. ¿Deseas comprar más monedas?`
          );
          if (confirmBuy) {
            window.location.href = "/frontend/modules/coins/coins.html";
          }
          return;
        }

        const donationResult = await methods.fetchAPI(API_ENDPOINTS.DONATE_STORY(storyId), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });

        if (donationResult && donationResult.success) {
          methods.showNotification("¡Donación realizada con éxito! Gracias por tu apoyo.");
          methods.displayModal(htmlElements.donationModal, false);
          await methods.fetchCurrentUserDetails();
        } else {
          methods.showNotification(
            donationResult?.error || donationResult?.message || "Error al procesar la donación.",
            true
          );
        }
      },

      handleCancelDonation() {
        methods.displayModal(htmlElements.donationModal, false);
      },

      async handleToggleFavorite() {
        if (!localStorage.getItem("token")) {
          methods.showNotification("Debes iniciar sesión para guardar historias.", true);
          setTimeout(() => {
            window.location.href = "/frontend/modules/auth/login/login.html";
          }, 1000);
          return;
        }

        const result = await methods.fetchAPI(API_ENDPOINTS.TOGGLE_FAVORITE(storyId), {
          method: "POST",
        });

        if (result && !result.error) {
          isStoryFavorited = !isStoryFavorited;
          methods.updateSaveButtonUI();
          methods.showNotification(
            isStoryFavorited
              ? "Historia guardada en favoritos."
              : "Historia eliminada de favoritos."
          );
        } else {
          methods.showNotification(
            result?.error || result?.message || "Error al guardar/desguardar la historia.",
            true
          );
        }
      },

      handleReportStoryClick() {
        if (!localStorage.getItem("token")) {
          methods.showNotification("Debes iniciar sesión para reportar historias.", true);
          setTimeout(() => {
            window.location.href = "/frontend/modules/auth/login/login.html";
          }, 1000);
          return;
        }
        methods.displayModal(htmlElements.reportModal, true);
      },

      async handleConfirmReport() {
        const reason = htmlElements.reportReasonSelect.value;
        const details = htmlElements.reportDetailsTextarea.value;

        if (!reason) {
          methods.showNotification("Por favor, selecciona una razón para el reporte.", true);
          return;
        }

        const reportData = {
          contentId: storyId,
          onModel: "Story",
          reason: reason,
          details: details,
        };

        const result = await methods.fetchAPI(API_ENDPOINTS.CREATE_REPORT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reportData),
        });

        if (result && !result.error) {
          methods.showNotification(
            "Reporte enviado exitosamente. Gracias por tu contribución.",
            false
          );
          methods.displayModal(htmlElements.reportModal, false);
        } else {
          methods.showNotification(
            result?.message || result?.error || "Error al enviar el reporte.",
            true
          );
        }
      },

      handleCancelReport() {
        methods.displayModal(htmlElements.reportModal, false);
      },

      handleAuthorClick() {
        if (currentStoryAuthorId) {
          window.location.href = `/frontend/modules/user/public-profile/publicprofile.html?id=${currentStoryAuthorId}`;
        } else {
          methods.showNotification("No se pudo obtener el perfil del autor.", true);
        }
      },
    };
    const init = () => {
      handlers.handlePageLoad();

      htmlElements.readBtn.addEventListener("click", handlers.handleReadNowClick);
      htmlElements.donateBtn.addEventListener("click", handlers.handleDonateClick);
      htmlElements.saveStoryBtn.addEventListener("click", handlers.handleToggleFavorite);
      htmlElements.reportStoryBtn.addEventListener("click", handlers.handleReportStoryClick);

      htmlElements.authorAvatar.addEventListener("click", handlers.handleAuthorClick);
      htmlElements.authorName.addEventListener("click", handlers.handleAuthorClick);

      htmlElements.confirmDonationBtn.addEventListener("click", handlers.handleConfirmDonation);
      htmlElements.cancelDonationBtn.addEventListener("click", handlers.handleCancelDonation);

      htmlElements.confirmReportBtn.addEventListener("click", handlers.handleConfirmReport);
      htmlElements.cancelReportBtn.addEventListener("click", handlers.handleCancelReport);
    };

    return { init };
  })();

  document.addEventListener("DOMContentLoaded", StoryDetailApp.init);
})();
