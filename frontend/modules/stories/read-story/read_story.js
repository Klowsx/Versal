(() => {
  const ReadStoryApp = (() => {
    const htmlElements = {
      authorAvatar: document.getElementById("author-avatar"),
      storyAuthorName: document.getElementById("story-author-name"),
      storyAuthorUsername: document.getElementById("story-author-username"),
      storyCategory: document.getElementById("story-category"),
      storyTitle: document.getElementById("story-title"),
      storyLikesCount: document.getElementById("story-likes-count"),
      storyStatus: document.getElementById("story-status"),
      authorProfileLink: document.getElementById("author-profile-link"),

      prevChapterBtn: document.getElementById("prev-chapter-btn"),
      chapterSelect: document.getElementById("chapter-select"),
      nextChapterBtn: document.getElementById("next-chapter-btn"),
      chapterDetailsContainer: document.getElementById("chapter-details-container"),
      chapterSectionContent: document.getElementById("chapter-section-content"),
      noChaptersMessage: document.getElementById("no-chapters-message"),
      backToPreviewBtn: document.getElementById("back-to-preview-btn"),

      chapterTitle: document.getElementById("chapter-title"),
      chapterPublishDate: document.getElementById("chapter-publish-date"),
      chapterContent: document.getElementById("chapter-content"),

      likeChapterBtn: document.getElementById("like-chapter-btn"),
      likeIcon: document.getElementById("like-icon"),
      likeCount: document.getElementById("like-count"),
      showCommentsBtn: document.getElementById("show-comments-btn"),
      commentCount: document.getElementById("comment-count"),

      commentsSection: document.querySelector(".comentarios-seccion"),
      totalCommentsCount: document.getElementById("total-comments-count"),
      commentInput: document.getElementById("comment-input"),
      postCommentBtn: document.getElementById("post-comment-btn"),
      commentsList: document.getElementById("comments-list"),

      reportCommentModal: document.getElementById("reportCommentModal"),
      reportCommentReason: document.getElementById("reportCommentReason"),
      reportCommentDetails: document.getElementById("reportCommentDetails"),
      confirmReportComment: document.getElementById("confirmReportComment"),
      cancelReportComment: document.getElementById("cancelReportComment"),
      closeReportCommentModal: document.getElementById("close-report-comment-modal"),
    };

    const API_BASE_URL = "http://localhost:3000/api";
    const storyId = new URLSearchParams(window.location.search).get("id");

    let currentStory = null;
    let chapters = [];
    let currentChapterIndex = -1;
    let currentUserId = null;
    let currentChapterLikes = [];
    let currentChapterComments = [];

    const methods = {
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

      async fetchAPI(url, options = {}) {
        const token = localStorage.getItem("token");
        const newOptions = JSON.parse(JSON.stringify(options));

        if (!newOptions.headers) {
          newOptions.headers = {};
        }

        if (token) {
          newOptions.headers["Authorization"] = `Bearer ${token}`;
        }

        if (newOptions.body && !(newOptions.body instanceof FormData)) {
          newOptions.headers["Content-Type"] = "application/json";
          newOptions.body = JSON.stringify(newOptions.body);
        }

        try {
          const response = await fetch(url, newOptions);

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

          if (response.status === 204 || response.headers.get("Content-Length") === "0") {
            return { success: true };
          }

          const responseData = await response.json().catch(() => {
            return { message: `Error ${response.status}: ${response.statusText}` };
          });

          if (!response.ok) {
            throw new Error(
              responseData.message || responseData.error || `Error desconocido: ${response.status}`
            );
          }

          return responseData;
        } catch (err) {
          console.error(`Error en fetchAPI para ${url}:`, err);
          methods.showNotification(err.message, true);
          throw err;
        }
      },

      async fetchCurrentUser() {
        const token = localStorage.getItem("token");
        if (!token) {
          currentUserId = null;
          console.log("Usuario no autenticado.");
          return null;
        }
        try {
          const response = await methods.fetchAPI(`${API_BASE_URL}/user/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          currentUserId = response._id;
          return response;
        } catch (error) {
          console.error("Error al obtener usuario actual:", error);
          currentUserId = null;
          return null;
        }
      },

      async fetchStoryDetails() {
        if (!storyId) {
          methods.showNotification("Error: No se proporcionó un ID de historia.", true);
          window.location.href = "/frontend/modules/main/dashboard.html";
          return null;
        }
        try {
          const data = await methods.fetchAPI(`${API_BASE_URL}/stories/${storyId}`);
          currentStory = data.story;

          console.log(currentStory);
          htmlElements.authorAvatar.src =
            currentStory.author?.profileImage || "/frontend/resources/profile.png";
          htmlElements.storyAuthorName.textContent =
            currentStory.author?.fullName || "Autor Desconocido";
          htmlElements.storyAuthorUsername.textContent = `@${
            currentStory.author?.username || "anonimo"
          }`;
          htmlElements.storyCategory.textContent = currentStory.category?.name || "General";
          htmlElements.storyTitle.textContent = currentStory.title;
          htmlElements.storyLikesCount.textContent = `${currentStory.totalLikes || 0} me gusta`;
          htmlElements.storyStatus.textContent = methods.mapStatus(currentStory.status);

          return currentStory;
        } catch (error) {
          methods.showNotification(
            `Error al cargar los detalles de la historia: ${error.message}`,
            true
          );
          console.error(error);
          return null;
        }
      },

      async fetchChapters() {
        try {
          const data = await methods.fetchAPI(`${API_BASE_URL}/stories/${storyId}/chapters`);
          chapters = data.chapters
            .filter((chap) => chap.status === "published")
            .sort((a, b) => a.chapterNumber - b.chapterNumber);

          if (chapters.length > 0) {
            htmlElements.chapterSectionContent.style.display = "block";
            htmlElements.noChaptersMessage.style.display = "none";
            methods.populateChapterSelect();
            const lastReadChapterId = localStorage.getItem(`lastReadChapter_${storyId}`);
            let initialChapterIndex = 0;
            if (lastReadChapterId) {
              const foundIndex = chapters.findIndex((c) => c._id === lastReadChapterId);
              if (foundIndex !== -1) {
                initialChapterIndex = foundIndex;
              }
            }
            methods.loadChapter(initialChapterIndex);
          } else {
            htmlElements.chapterSectionContent.style.display = "none";
            htmlElements.noChaptersMessage.style.display = "block";
          }
        } catch (error) {
          methods.showNotification(`Error al cargar los capítulos: ${error.message}`, true);
          console.error(error);
        }
      },

      populateChapterSelect() {
        htmlElements.chapterSelect.innerHTML = "";
        chapters.forEach((chapter, index) => {
          const option = document.createElement("option");
          option.value = index;
          option.textContent = `Capítulo ${chapter.chapterNumber}: ${chapter.title}`;
          htmlElements.chapterSelect.appendChild(option);
        });
      },

      async loadChapter(index) {
        if (index < 0 || index >= chapters.length) return;

        currentChapterIndex = index;
        const chapter = chapters[currentChapterIndex];
        htmlElements.chapterSelect.value = index;

        htmlElements.chapterTitle.textContent = `Capítulo ${chapter.chapterNumber}: ${chapter.title}`;
        htmlElements.chapterPublishDate.textContent = `Publicado: ${new Date(
          chapter.publishedAt
        ).toLocaleDateString()}`;
        htmlElements.chapterContent.innerHTML = chapter.content;

        htmlElements.prevChapterBtn.disabled = currentChapterIndex === 0;
        htmlElements.nextChapterBtn.disabled = currentChapterIndex === chapters.length - 1;

        localStorage.setItem(`lastReadChapter_${storyId}`, chapter._id);

        await methods.fetchChapterInteractions(chapter._id);
      },

      async fetchChapterInteractions(chapterId) {
        try {
          const data = await methods.fetchAPI(
            `${API_BASE_URL}/interactions/chapters/${chapterId}/interactions`
          );
          console.log(data);
          currentChapterLikes = data.interactions.filter((i) => i.interactionType === "like");
          currentChapterComments = data.interactions.filter((i) => i.interactionType === "comment");
          methods.updateInteractionUI();
          methods.renderComments();
        } catch (error) {
          console.error("Error al cargar interacciones:", error);
          methods.showNotification("Error al cargar interacciones del capítulo.", true);
          currentChapterLikes = [];
          currentChapterComments = [];
          methods.updateInteractionUI();
          methods.renderComments();
        }
      },

      updateInteractionUI() {
        htmlElements.likeCount.textContent = currentChapterLikes.length;

        const userLiked = currentChapterLikes.some((like) => like.userId?._id === currentUserId);
        htmlElements.likeIcon.className = userLiked ? "fas fa-heart liked" : "far fa-heart";

        htmlElements.commentCount.textContent = currentChapterComments.length;
        htmlElements.totalCommentsCount.textContent = currentChapterComments.length;
      },

      renderComments() {
        htmlElements.commentsList.innerHTML = "";
        if (currentChapterComments.length === 0) {
          htmlElements.commentsList.innerHTML = "<p>Sé el primero en comentar este capítulo.</p>";
          return;
        }

        currentChapterComments.forEach((comment) => {
          const commentItem = document.createElement("div");
          commentItem.classList.add("comentario-item");
          commentItem.dataset.commentId = comment._id;

          const commentDate = new Date(comment.createdAt).toLocaleDateString();
          const isOwner = currentUserId && comment.userId?._id === currentUserId;

          commentItem.innerHTML = `
            <div class="info-usuario">
              <img src="${
                comment.userId?.profileImage || "/frontend/resources/profile.png"
              }" alt="Avatar" class="avatar" />
              <p class="username">${comment.userId?.username || "Anónimo"}</p>
            </div>
            <p class="texto-comentario">${comment.text}</p>
            <div class="meta-comentario">
              <span>${commentDate}</span>
              <div class="acciones-comentario">
                ${
                  isOwner
                    ? `<button class="delete-comment-btn" data-comment-id="${comment._id}">Eliminar</button>`
                    : ""
                }
                ${
                  !isOwner && currentUserId
                    ? `<button class="report-comment-btn" data-comment-id="${comment._id}">Reportar</button>`
                    : ""
                }
              </div>
            </div>
          `;
          htmlElements.commentsList.appendChild(commentItem);
        });

        htmlElements.commentsList.querySelectorAll(".delete-comment-btn").forEach((button) => {
          button.addEventListener("click", handlers.handleDeleteComment);
        });
        htmlElements.commentsList.querySelectorAll(".report-comment-btn").forEach((button) => {
          button.addEventListener("click", handlers.handleReportCommentClick);
        });
      },

      displayModal: (modalElement, show) => {
        modalElement.style.display = show ? "flex" : "none";
        if (show) {
          modalElement.classList.add("show-modal");
        } else {
          modalElement.classList.remove("show-modal");
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
    };

    const handlers = {
      async handlePageLoad() {
        fetch("/frontend/modules/main/navbar/navbar.html")
          .then((response) => response.text())
          .then((html) => {
            htmlElements.navbarPlaceholder.innerHTML = html;
          })
          .catch((error) => console.error("Error al cargar el navbar:", error));

        await methods.fetchCurrentUser();
        const story = await methods.fetchStoryDetails();
        if (story) {
          await methods.fetchChapters();
        }
      },

      handleChapterSelectChange() {
        const selectedIndex = parseInt(htmlElements.chapterSelect.value);
        methods.loadChapter(selectedIndex);
      },

      handlePrevChapter() {
        methods.loadChapter(currentChapterIndex - 1);
      },

      handleNextChapter() {
        methods.loadChapter(currentChapterIndex + 1);
      },

      async handleLikeChapter() {
        if (!currentUserId) {
          methods.showNotification("Debes iniciar sesión para dar 'me gusta'.", true);
          setTimeout(() => {
            window.location.href = "/frontend/modules/auth/login/login.html";
          }, 1000);
          return;
        }
        if (!chapters[currentChapterIndex]) {
          methods.showNotification("No hay capítulo cargado.", true);
          return;
        }
        const chapterId = chapters[currentChapterIndex]._id;

        try {
          const response = await methods.fetchAPI(
            `${API_BASE_URL}/interactions/chapters/${chapterId}/interactions`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ interactionType: "like" }),
            }
          );
          methods.showNotification(
            response.message ||
              (htmlElements.likeIcon.classList.contains("liked")
                ? "Me gusta quitado."
                : "¡Me gusta!"),
            false
          );
          await methods.fetchChapterInteractions(chapterId);
        } catch (error) {
          methods.showNotification(
            "Error al procesar el 'me gusta': " + (error.message || "Error desconocido."),
            true
          );
        }
      },

      handleShowComments() {
        htmlElements.commentsSection.style.display =
          htmlElements.commentsSection.style.display === "none" ? "block" : "none";
        if (htmlElements.commentsSection.style.display === "block") {
          htmlElements.commentsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      },

      async handlePostComment() {
        if (!currentUserId) {
          methods.showNotification("Debes iniciar sesión para comentar.", true);
          setTimeout(() => {
            window.location.href = "/frontend/modules/auth/login/login.html";
          }, 1000);
          return;
        }
        if (!chapters[currentChapterIndex]) {
          methods.showNotification("No hay capítulo cargado para comentar.", true);
          return;
        }
        const chapterId = chapters[currentChapterIndex]._id;
        const commentText = htmlElements.commentInput.value.trim();

        if (!commentText) {
          methods.showNotification("El comentario no puede estar vacío.", true);
          return;
        }

        try {
          const response = await methods.fetchAPI(
            `${API_BASE_URL}/interactions/chapters/${chapterId}/interactions`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ interactionType: "comment", text: commentText }),
            }
          );

          htmlElements.commentInput.value = "";
          methods.showNotification(response.message || "Comentario publicado.", false);
          await methods.fetchChapterInteractions(chapterId);
        } catch (error) {
          methods.showNotification(
            "Error al publicar comentario: " + (error.message || "Error desconocido."),
            true
          );
        }
      },

      async handleDeleteComment(event) {
        if (!currentUserId) {
          methods.showNotification("Debes iniciar sesión para eliminar comentarios.", true);
          setTimeout(() => {
            window.location.href = "/frontend/modules/auth/login/login.html";
          }, 1000);
          return;
        }

        const commentId = event.target.dataset.commentId;
        if (!commentId) {
          methods.showNotification("ID de comentario no encontrado.", true);
          return;
        }

        if (!confirm("¿Estás seguro de que quieres eliminar este comentario?")) {
          return;
        }

        try {
          const response = await methods.fetchAPI(`${API_BASE_URL}/interactions/${commentId}`, {
            method: "DELETE",
          });
          methods.showNotification(response.message || "Comentario eliminado.", false);
          await methods.fetchChapterInteractions(chapters[currentChapterIndex]._id);
        } catch (error) {
          methods.showNotification(
            "Error al eliminar comentario: " + (error.message || "Error desconocido."),
            true
          );
        }
      },

      handleReportCommentClick(event) {
        if (!currentUserId) {
          methods.showNotification("Debes iniciar sesión para reportar comentarios.", true);
          setTimeout(() => {
            window.location.href = "/frontend/modules/auth/login/login.html";
          }, 1000);
          return;
        }

        const commentId = event.target.dataset.commentId;
        if (!commentId) {
          methods.showNotification("ID de comentario no encontrado para reportar.", true);
          return;
        }

        htmlElements.reportCommentModal.dataset.reportingCommentId = commentId;
        methods.displayModal(htmlElements.reportCommentModal, true);
      },

      async handleConfirmReportComment() {
        const commentIdToReport = htmlElements.reportCommentModal.dataset.reportingCommentId;
        const reason = htmlElements.reportCommentReason.value;
        const details = htmlElements.reportCommentDetails.value;

        if (!reason) {
          methods.showNotification("Por favor, selecciona una razón para el reporte.", true);
          return;
        }
        if (!commentIdToReport) {
          methods.showNotification("Error: ID de comentario no encontrado para reportar.", true);
          return;
        }

        const reportData = {
          contentId: commentIdToReport,
          onModel: "Interaction",
          reason: reason,
          details: details,
        };

        try {
          const reportResult = await methods.fetchAPI(`${API_BASE_URL}/reports`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: reportData,
          });

          methods.showNotification(
            reportResult.message || "¡Comentario reportado con éxito! Gracias por tu contribución.",
            false
          );
          methods.displayModal(htmlElements.reportCommentModal, false);
          delete htmlElements.reportCommentModal.dataset.reportingCommentId;
        } catch (error) {
          methods.showNotification(error.message || "Error al procesar el reporte.", true);
        }
      },

      handleCancelReportComment() {
        methods.displayModal(htmlElements.reportCommentModal, false);
        delete htmlElements.reportCommentModal.dataset.reportingCommentId;
      },

      handleCloseReportCommentModal() {
        methods.displayModal(htmlElements.reportCommentModal, false);
        delete htmlElements.reportCommentModal.dataset.reportingCommentId;
      },

      handleAuthorProfileClick() {
        if (currentStory && currentStory.author && currentStory.author._id) {
          window.location.href = `/frontend/modules/user/public-profile/publicprofile.html?userId=${currentStory.author._id}`;
        } else {
          methods.showNotification("No se pudo obtener el perfil del autor.", true);
        }
      },

      handleBackToPreview() {
        if (storyId) {
          window.location.href = `/frontend/modules/stories/preview-story/preview.html?id=${storyId}`;
        } else {
          window.location.href = `/frontend/modules/main/dashboard.html`;
        }
      },
    };

    const init = () => {
      handlers.handlePageLoad();

      htmlElements.chapterSelect.addEventListener("change", handlers.handleChapterSelectChange);
      htmlElements.prevChapterBtn.addEventListener("click", handlers.handlePrevChapter);
      htmlElements.nextChapterBtn.addEventListener("click", handlers.handleNextChapter);

      htmlElements.likeChapterBtn.addEventListener("click", handlers.handleLikeChapter);
      htmlElements.showCommentsBtn.addEventListener("click", handlers.handleShowComments);
      htmlElements.postCommentBtn.addEventListener("click", handlers.handlePostComment);

      htmlElements.confirmReportComment.addEventListener(
        "click",
        handlers.handleConfirmReportComment
      );
      htmlElements.cancelReportComment.addEventListener(
        "click",
        handlers.handleCancelReportComment
      );
      htmlElements.closeReportCommentModal.addEventListener(
        "click",
        handlers.handleCloseReportCommentModal
      );
      htmlElements.authorProfileLink.addEventListener("click", handlers.handleAuthorProfileClick);

      htmlElements.backToPreviewBtn.addEventListener("click", handlers.handleBackToPreview);
    };

    return { init };
  })();

  document.addEventListener("DOMContentLoaded", ReadStoryApp.init);
})();
