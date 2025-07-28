(() => {
  const ReadStoryApp = (() => {
    const htmlElements = {
      // Story Header Elements
      authorAvatar: document.getElementById("author-avatar"),
      storyAuthorName: document.getElementById("story-author-name"),
      storyAuthorUsername: document.getElementById("story-author-username"),
      storyCategory: document.getElementById("story-category"),
      storyTitle: document.getElementById("story-title"),
      storyReads: document.getElementById("story-reads"),
      storyLikesCount: document.getElementById("story-likes-count"),
      storyStatus: document.getElementById("story-status"),

      // Chapter Navigation Elements
      prevChapterBtn: document.getElementById("prev-chapter-btn"),
      chapterSelect: document.getElementById("chapter-select"),
      nextChapterBtn: document.getElementById("next-chapter-btn"),
      chapterDetailsContainer: document.getElementById("chapter-details-container"),

      // Chapter Content Elements
      chapterTitle: document.getElementById("chapter-title"),
      chapterPublishDate: document.getElementById("chapter-publish-date"),
      chapterContent: document.getElementById("chapter-content"),
      
      // Interaction Elements
      likeChapterBtn: document.getElementById("like-chapter-btn"),
      likeIcon: document.getElementById("like-icon"),
      likeCount: document.getElementById("like-count"),
      showCommentsBtn: document.getElementById("show-comments-btn"),
      commentCount: document.getElementById("comment-count"),

      // Comment Section Elements
      commentsSection: document.querySelector(".comentarios-seccion"),
      totalCommentsCount: document.getElementById("total-comments-count"),
      commentInput: document.getElementById("comment-input"),
      postCommentBtn: document.getElementById("post-comment-btn"),
      commentMessage: document.getElementById("comment-message"),
      commentsList: document.getElementById("comments-list"),

      // Report Comment Modal Elements
      reportCommentModal: document.getElementById("reportCommentModal"),
      reportCommentReason: document.getElementById("reportCommentReason"),
      reportCommentDetails: document.getElementById("reportCommentDetails"),
      confirmReportComment: document.getElementById("confirmReportComment"),
      cancelReportComment: document.getElementById("cancelReportComment"),
      reportCommentModalMessage: document.getElementById("reportCommentModalMessage"),
    };

    const API_BASE_URL = "http://localhost:3000/api"; // Base URL for all API calls
    const storyId = new URLSearchParams(window.location.search).get("id");

    let currentStory = null;
    let chapters = [];
    let currentChapterIndex = -1;
    let currentUserId = null; // To store current logged-in user ID
    let currentChapterLikes = []; // Store likes for current chapter
    let currentChapterComments = []; // Store comments for current chapter

    const methods = {
      async fetchAPI(url, options = {}) {
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Error en la respuesta de la API para ${url}: ${response.statusText}`);
          }
          return await response.json();
        } catch (err) {
          console.error(`Error en fetchAPI para ${url}:`, err);
          throw err; // Re-throw the error for the handler to catch
        }
      },

      async fetchCurrentUser() {
        const token = localStorage.getItem("token");
        if (!token) {
          return null;
        }
        try {
          const response = await methods.fetchAPI(`${API_BASE_URL}/user/me`, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          currentUserId = response._id;
          return response;
        } catch (error) {
          console.error("Error al obtener usuario actual:", error);
          currentUserId = null; // Ensure currentUserId is null if fetch fails
          return null;
        }
      },

      async fetchStoryDetails() {
        try {
          const data = await methods.fetchAPI(`${API_BASE_URL}/stories/${storyId}`);
          currentStory = data.story;
          // Populate story details
          htmlElements.authorAvatar.src = currentStory.author?.profileImage || "/images/default-avatar.png";
          htmlElements.storyAuthorName.textContent = currentStory.author?.fullName || "Autor Desconocido";
          htmlElements.storyAuthorUsername.textContent = `@${currentStory.author?.username || 'anonimo'}`;
          htmlElements.storyCategory.textContent = currentStory.tags[0]?.name || "General"; // Assuming first tag is category
          htmlElements.storyTitle.textContent = currentStory.title;
          htmlElements.storyReads.textContent = `${currentStory.reads || 0} lecturas`;
          htmlElements.storyLikesCount.textContent = `${currentStory.likes || 0} me gusta`;
          htmlElements.storyStatus.textContent = methods.mapStatus(currentStory.status);
        } catch (error) {
          alert(`Error al cargar los detalles de la historia: ${error.message}`);
          console.error(error);
        }
      },

      async fetchChapters() {
        try {
          const data = await methods.fetchAPI(`${API_BASE_URL}/stories/${storyId}/chapters`);
          chapters = data.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber); // Sort by chapter number
          methods.populateChapterSelect();
          // Automatically load the first chapter if available, otherwise the last read chapter
          if (chapters.length > 0) {
            const lastReadChapterId = localStorage.getItem(`lastReadChapter_${storyId}`);
            let initialChapterIndex = 0;
            if (lastReadChapterId) {
                const foundIndex = chapters.findIndex(c => c._id === lastReadChapterId);
                if (foundIndex !== -1) {
                    initialChapterIndex = foundIndex;
                }
            }
            methods.loadChapter(initialChapterIndex);
          } else {
            htmlElements.chapterContent.innerHTML = "<p>No hay capítulos disponibles para esta historia.</p>";
          }
        } catch (error) {
          alert(`Error al cargar los capítulos: ${error.message}`);
          console.error(error);
        }
      },

      populateChapterSelect() {
        htmlElements.chapterSelect.innerHTML = "";
        chapters.forEach((chapter, index) => {
          const option = document.createElement("option");
          option.value = index; // Store index to easily navigate chapters array
          option.textContent = `Capítulo ${chapter.chapterNumber}: ${chapter.title}`;
          htmlElements.chapterSelect.appendChild(option);
        });
      },

      async loadChapter(index) {
        if (index < 0 || index >= chapters.length) return;

        currentChapterIndex = index;
        const chapter = chapters[currentChapterIndex];
        htmlElements.chapterSelect.value = index; // Update select dropdown

        // Update chapter details
        htmlElements.chapterTitle.textContent = `Capítulo ${chapter.chapterNumber}: ${chapter.title}`;
        htmlElements.chapterPublishDate.textContent = `Publicado: ${new Date(chapter.publishedAt).toLocaleDateString()} - ${chapter.reads || 0} lecturas`;
        htmlElements.chapterContent.innerHTML = chapter.content; // Render HTML content

        // Update navigation buttons state
        htmlElements.prevChapterBtn.disabled = currentChapterIndex === 0;
        htmlElements.nextChapterBtn.disabled = currentChapterIndex === chapters.length - 1;

        // Save last read chapter
        localStorage.setItem(`lastReadChapter_${storyId}`, chapter._id);

        // Load interactions for the current chapter
        await methods.fetchChapterInteractions(chapter._id);
      },

      async fetchChapterInteractions(chapterId) {
        try {
          const data = await methods.fetchAPI(`${API_BASE_URL}/chapters/${chapterId}/interactions`);
          currentChapterLikes = data.interactions.filter(i => i.interactionType === 'like');
          currentChapterComments = data.interactions.filter(i => i.interactionType === 'comment');
          methods.updateInteractionUI();
          methods.renderComments();
        } catch (error) {
          console.error("Error al cargar interacciones:", error);
          currentChapterLikes = [];
          currentChapterComments = [];
          methods.updateInteractionUI();
          methods.renderComments();
        }
      },

      updateInteractionUI() {
        htmlElements.likeCount.textContent = currentChapterLikes.length;
        const userLiked = currentChapterLikes.some(like => like.userId?._id === currentUserId);
        htmlElements.likeIcon.textContent = userLiked ? '❤️' : '🤍';

        htmlElements.commentCount.textContent = currentChapterComments.length;
        htmlElements.totalCommentsCount.textContent = currentChapterComments.length;
      },

      renderComments() {
        htmlElements.commentsList.innerHTML = "";
        if (currentChapterComments.length === 0) {
          htmlElements.commentsList.innerHTML = "<p>Sé el primero en comentar este capítulo.</p>";
          return;
        }

        currentChapterComments.forEach(comment => {
          const commentItem = document.createElement("div");
          commentItem.classList.add("comentario-item");
          commentItem.dataset.commentId = comment._id; // Store comment ID for reporting/deleting

          const commentDate = new Date(comment.createdAt).toLocaleDateString();

          commentItem.innerHTML = `
            <div class="info-usuario">
              <img src="${comment.userId?.profileImage || '/images/default-avatar.png'}" alt="Avatar" class="avatar" />
              <p class="username">${comment.userId?.username || 'Anónimo'}</p>
            </div>
            <p class="texto-comentario">${comment.text}</p>
            <div class="meta-comentario">
              <span>${commentDate}</span>
              <div class="acciones-comentario">
                ${currentUserId && comment.userId?._id === currentUserId ? `<button class="delete-comment-btn">Eliminar</button>` : ''}
                ${currentUserId && comment.userId?._id !== currentUserId ? `<button class="report-comment-btn">Reportar</button>` : ''}
              </div>
            </div>
          `;
          htmlElements.commentsList.appendChild(commentItem);
        });

        // Add event listeners for new delete/report buttons
        htmlElements.commentsList.querySelectorAll(".delete-comment-btn").forEach(button => {
          button.addEventListener("click", handlers.handleDeleteComment);
        });
        htmlElements.commentsList.querySelectorAll(".report-comment-btn").forEach(button => {
          button.addEventListener("click", handlers.handleReportCommentClick);
        });
      },

      displayModal: (modalElement, show, message = "") => {
        modalElement.style.display = show ? "flex" : "none";
        // Clear message when closing
        if (!show) {
          if (modalElement === htmlElements.reportCommentModal) {
            htmlElements.reportCommentModalMessage.textContent = "";
          }
        } else {
            // Set message when opening
            if (modalElement === htmlElements.reportCommentModal) {
              htmlElements.reportCommentModalMessage.textContent = message;
            }
        }
      },

      mapStatus(status) {
        switch (status) {
          case "draft": return "Borrador";
          case "published": return "Publicado";
          case "archived": return "Archivado";
          default: return "Desconocido";
        }
      },
    };

    const handlers = {
      async handlePageLoad() {
        if (!storyId) {
          alert("No se proporcionó un ID de historia.");
          window.location.href = "/frontend/modules/main/dashboard.html"; // Redirect if no storyId
          return;
        }
        await methods.fetchCurrentUser(); // Fetch user data first
        await methods.fetchStoryDetails();
        await methods.fetchChapters();
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
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Debes iniciar sesión para dar 'me gusta'.");
          window.location.href = "/frontend/modules/auth/login/login.html";
          return;
        }
        if (!chapters[currentChapterIndex]) {
            alert("No hay capítulo cargado.");
            return;
        }
        const chapterId = chapters[currentChapterIndex]._id;

        const userLiked = currentChapterLikes.some(like => like.userId?._id === currentUserId);
        const method = "POST"; // Always POST to toggle/add interaction

        try {
            const response = await methods.fetchAPI(`${API_BASE_URL}/chapters/${chapterId}/interactions`, {
                method: method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ interactionType: "like" }),
            });
            // The backend's addInteractionToChapter service handles toggling likes (adding if not exists, removing if exists)
            // So, after a successful call, re-fetch interactions to update UI
            await methods.fetchChapterInteractions(chapterId);
        } catch (error) {
            console.error("Error al dar 'me gusta':", error);
            alert("Error al procesar el 'me gusta': " + (error.message || "Error desconocido."));
        }
      },

      handleShowComments() {
        htmlElements.commentsSection.style.display = htmlElements.commentsSection.style.display === "none" ? "block" : "none";
      },

      async handlePostComment() {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Debes iniciar sesión para comentar.");
          window.location.href = "/frontend/modules/auth/login/login.html";
          return;
        }
        if (!chapters[currentChapterIndex]) {
            alert("No hay capítulo cargado para comentar.");
            return;
        }
        const chapterId = chapters[currentChapterIndex]._id;
        const commentText = htmlElements.commentInput.value.trim();
        htmlElements.commentMessage.textContent = "";

        if (!commentText) {
          htmlElements.commentMessage.textContent = "El comentario no puede estar vacío.";
          return;
        }

        try {
          const response = await methods.fetchAPI(`${API_BASE_URL}/chapters/${chapterId}/interactions`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ interactionType: "comment", text: commentText }),
          });

          htmlElements.commentInput.value = ""; // Clear input
          htmlElements.commentMessage.textContent = "Comentario publicado.";
          htmlElements.commentMessage.style.color = "green"; // Optional: success message color
          
          // Re-fetch and render comments
          await methods.fetchChapterInteractions(chapterId);
        } catch (error) {
          console.error("Error al publicar comentario:", error);
          htmlElements.commentMessage.textContent = "Error al publicar comentario: " + (error.message || "Error desconocido.");
          htmlElements.commentMessage.style.color = "red"; // Optional: error message color
        }
      },

      async handleDeleteComment(event) {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Debes iniciar sesión para eliminar comentarios.");
          window.location.href = "/frontend/modules/auth/login/login.html";
          return;
        }

        const commentItem = event.target.closest(".comentario-item");
        const commentId = commentItem.dataset.commentId;

        if (!confirm("¿Estás seguro de que quieres eliminar este comentario?")) {
          return;
        }

        try {
          await methods.fetchAPI(`${API_BASE_URL}/interactions/${commentId}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          alert("Comentario eliminado.");
          // Re-fetch and render comments
          await methods.fetchChapterInteractions(chapters[currentChapterIndex]._id);
        } catch (error) {
          console.error("Error al eliminar comentario:", error);
          alert("Error al eliminar comentario: " + (error.message || "Error desconocido."));
        }
      },

      handleReportCommentClick(event) {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Debes iniciar sesión para reportar comentarios.");
          window.location.href = "/frontend/modules/auth/login/login.html";
          return;
        }

        const commentItem = event.target.closest(".comentario-item");
        const commentId = commentItem.dataset.commentId;
        htmlElements.reportCommentModal.dataset.reportingCommentId = commentId; // Store ID for confirm action

        methods.displayModal(htmlElements.reportCommentModal, true);
      },

      async handleConfirmReportComment() {
        const token = localStorage.getItem("token");
        const commentIdToReport = htmlElements.reportCommentModal.dataset.reportingCommentId;
        const reason = htmlElements.reportCommentReason.value;
        const details = htmlElements.reportCommentDetails.value;
        htmlElements.reportCommentModalMessage.textContent = "";

        if (!reason) {
            htmlElements.reportCommentModalMessage.textContent = "Por favor, selecciona una razón para el reporte.";
            return;
        }
        if (!commentIdToReport) {
            htmlElements.reportCommentModalMessage.textContent = "Error: ID de comentario no encontrado para reportar.";
            return;
        }

        try {
          const reportResult = await methods.fetchAPI(`${API_BASE_URL}/reports`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              contentId: commentIdToReport,
              onModel: "Interaction", // Report an Interaction
              reason: reason,
              details: details,
            }),
          });

          alert("¡Comentario reportado con éxito! Gracias por tu contribución.");
          methods.displayModal(htmlElements.reportCommentModal, false);
          delete htmlElements.reportCommentModal.dataset.reportingCommentId; // Clear stored ID
        } catch (error) {
          htmlElements.reportCommentModalMessage.textContent = error.message || "Error al procesar el reporte.";
        }
      },

      handleCancelReportComment() {
        methods.displayModal(htmlElements.reportCommentModal, false);
        delete htmlElements.reportCommentModal.dataset.reportingCommentId;
      },
    };

    const init = () => {
      handlers.handlePageLoad();

      // Chapter navigation
      htmlElements.chapterSelect.addEventListener("change", handlers.handleChapterSelectChange);
      htmlElements.prevChapterBtn.addEventListener("click", handlers.handlePrevChapter);
      htmlElements.nextChapterBtn.addEventListener("click", handlers.handleNextChapter);

      // Interactions
      htmlElements.likeChapterBtn.addEventListener("click", handlers.handleLikeChapter);
      htmlElements.showCommentsBtn.addEventListener("click", handlers.handleShowComments);
      htmlElements.postCommentBtn.addEventListener("click", handlers.handlePostComment);
      
      // Report Comment Modal Buttons
      htmlElements.confirmReportComment.addEventListener("click", handlers.handleConfirmReportComment);
      htmlElements.cancelReportComment.addEventListener("click", handlers.handleCancelReportComment);
    };

    return { init };
  })();

  ReadStoryApp.init();
})();