(() => {
  const MyStoriesApp = (() => {
    const API_BASE_URL = "http://localhost:3000/api";
    const API_ENDPOINTS = {
      GET_MY_STORIES: `${API_BASE_URL}/stories/me`,
      UPDATE_STORY: (id) => `${API_BASE_URL}/stories/${id}`,
      DELETE_STORY: (id) => `${API_BASE_URL}/stories/${id}`,
      GET_TAGS: `${API_BASE_URL}/stories/tags`, // Necesario para el modal de edición
      GET_CATEGORIES: `${API_BASE_URL}/stories/categories`, // Necesario para el modal de edición
    };

    const htmlElements = {
      historiasContainer: document.getElementById("historiasContainer"),
      totalHistorias: document.getElementById("totalHistorias"),
      publicadas: document.getElementById("publicadas"),
      borradores: document.getElementById("borradores"),
      lecturasTotales: document.getElementById("lecturasTotales"),
      navbarPlaceholder: document.getElementById("navbar-placeholder"),

      editModal: null,
      editForm: null,
      editTitle: null,
      editDescription: null,
      editCategory: null,
      editTagsContainer: null,
      editIsAdultContent: null,
      editStoryId: null,
    };

    let allStories = [];

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
        if (!token) {
          methods.showNotification("Debes iniciar sesión.", true);
          window.location.href = "/frontend/modules/auth/login/login.html";
          return null;
        }

        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };

        try {
          const response = await fetch(url, options);
          if (response.status === 401 || response.status === 403) {
            methods.showNotification(
              "Sesión expirada o no autorizada. Inicia sesión de nuevo.",
              true
            );
            localStorage.removeItem("token");
            window.location.href = "/frontend/modules/auth/login/login.html";
            return null;
          }
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Error en la petición: ${response.statusText}`);
          }
          return await response.json();
        } catch (err) {
          console.error(`Error en fetchAPI para ${url}:`, err);
          methods.showNotification(`Error: ${err.message}`, true);
          return null;
        }
      },

      async loadMyStories() {
        const data = await methods.fetchAPI(API_ENDPOINTS.GET_MY_STORIES);
        if (data && data.stories) {
          allStories = data.stories;
          methods.renderStories(allStories);
          methods.updateStats(allStories);
        } else {
          htmlElements.historiasContainer.innerHTML =
            '<p class="no-stories-message">Aún no tienes historias. ¡Crea una!</p>';
          methods.updateStats([]);
        }
      },

      updateStats(stories) {
        htmlElements.totalHistorias.textContent = stories.length;
        htmlElements.publicadas.textContent = stories.filter(
          (s) => s.status === "published"
        ).length;
        htmlElements.borradores.textContent = stories.filter((s) => s.status === "draft").length;
        htmlElements.lecturasTotales.textContent = 0;
      },

      renderStories(stories) {
        htmlElements.historiasContainer.innerHTML = "";
        if (stories.length === 0) {
          htmlElements.historiasContainer.innerHTML =
            '<p class="no-stories-message">Aún no tienes historias.</p>';
          return;
        }

        stories.forEach((story) => {
          const card = document.createElement("div");
          card.className = "historia-card";
          card.dataset.storyId = story._id;

          const statusClass =
            story.status === "published"
              ? "publicada"
              : story.status === "draft"
              ? "borrador"
              : "pausada";

          const coverImageSrc = story.coverImage || "/frontend/resources/default-cover.png";
          const categoryName = story.category ? story.category.name : "Sin Categoría";
          const tagsHtml = story.tags.map((tag) => `<span>#${tag.name}</span>`).join("");

          card.innerHTML = `
            <div class="portada">
              <img src="${coverImageSrc}" alt="Portada de ${story.title}" />
              <span class="badge ${statusClass}">${
            story.status === "draft"
              ? "Borrador"
              : story.status === "published"
              ? "Publicada"
              : "Archivada"
          }</span>
              ${story.isAdultContent ? '<span class="badge adult-content">+18</span>' : ""}
            </div>
            <div class="contenido">
              <span class="categoria">${categoryName}</span>
              <h3 class="titulo">${story.title}</h3>
              <p class="descripcion">${story.description}</p>
              <div class="tags">${tagsHtml}</div>
              <div class="acciones">
                <a href="/frontend/modules/stories/preview-story/preview.html?id=${story._id}" class="btn-outline">Ver</a>
                <button class="btn-solid edit-story-btn" data-story-id="${story._id}">Editar historia</button>
                <a href="/frontend/modules/stories/write-story/write_story.html?storyId=${story._id}" class="btn-outline">Editar capítulos</a>
                <button class="btn-outline delete-story-btn" data-story-id="${story._id}">Eliminar</button>
              </div>

            </div>
          `;
          htmlElements.historiasContainer.appendChild(card);
        });

        document.querySelectorAll(".edit-story-btn").forEach((btn) => {
          btn.addEventListener("click", handlers.handleEditClick);
        });
        document.querySelectorAll(".delete-story-btn").forEach((btn) => {
          btn.addEventListener("click", handlers.handleDeleteClick);
        });
      },

      // --- Métodos para el Modal de Edición ---
      createEditModal() {
        if (htmlElements.editModal) return;

        const modalHtml = `
          <div id="editStoryModal" class="modal">
            <div class="modal-content">
              <span class="close-button">&times;</span>
              <h2>Editar Historia</h2>
              <form id="editStoryForm" class="form-grid">
                <input type="hidden" id="edit-story-id" />

                <label for="edit-title">Título</label>
                <input type="text" id="edit-title" name="title" required />

                <label for="edit-description">Descripción</label>
                <textarea id="edit-description" name="description" rows="4" required></textarea>

                <label for="edit-category">Categoría</label>
                <select id="edit-category" name="category" required></select>

                <label>Etiquetas (Max 5)</label>
                <div id="edit-tags-container" class="tags-container-modal"></div>



                <div class="checkbox-container">
                  <input type="checkbox" id="edit-isAdultContent" name="isAdultContent" />
                  <label for="edit-isAdultContent">Contenido para Adultos (+18)</label>
                </div>

                <button type="submit" class="btn-solid modal-save-btn">Guardar Cambios</button>
              </form>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML("beforeend", modalHtml);
        htmlElements.editModal = document.getElementById("editStoryModal");
        htmlElements.editForm = document.getElementById("editStoryForm");
        htmlElements.editTitle = document.getElementById("edit-title");
        htmlElements.editDescription = document.getElementById("edit-description");
        htmlElements.editCategory = document.getElementById("edit-category");
        htmlElements.editTagsContainer = document.getElementById("edit-tags-container");
        htmlElements.editIsAdultContent = document.getElementById("edit-isAdultContent");
        htmlElements.editStoryId = document.getElementById("edit-story-id");

        document
          .querySelector("#editStoryModal .close-button")
          .addEventListener("click", methods.closeEditModal);
        htmlElements.editForm.addEventListener("submit", handlers.handleEditSubmit);
        htmlElements.editTagsContainer.addEventListener(
          "click",
          handlers.handleTagSelectionInModal
        );
      },

      openEditModal(story) {
        if (!htmlElements.editModal) methods.createEditModal();

        htmlElements.editStoryId.value = story._id;
        htmlElements.editTitle.value = story.title;
        htmlElements.editDescription.value = story.description;
        htmlElements.editCategory.value = story.category ? story.category.name : "";
        htmlElements.editIsAdultContent.checked = story.isAdultContent;

        methods.renderTagsInModal(story.tags.map((tag) => tag.name));

        htmlElements.editModal.style.display = "block";
        htmlElements.editModal.classList.add("show-modal");
      },

      closeEditModal() {
        if (htmlElements.editModal) {
          htmlElements.editModal.classList.remove("show-modal");
          setTimeout(() => {
            htmlElements.editModal.style.display = "none";
          }, 300);
        }
      },

      async loadCategoriesAndTagsForModal() {
        const categoriesData = await methods.fetchAPI(API_ENDPOINTS.GET_CATEGORIES);
        if (categoriesData && categoriesData.categories) {
          methods.renderCategoriesInModal(categoriesData.categories);
        }

        const tagsData = await methods.fetchAPI(API_ENDPOINTS.GET_TAGS);
        if (tagsData && tagsData.tags) {
          methods.allAvailableTags = tagsData.tags;
        }
      },

      renderCategoriesInModal(categories) {
        htmlElements.editCategory.innerHTML =
          '<option value="" disabled selected>Selecciona una categoría</option>';
        categories.forEach((cat) => {
          const option = document.createElement("option");
          option.value = cat.name;
          option.textContent = cat.name;
          htmlElements.editCategory.appendChild(option);
        });
      },

      renderTagsInModal(selectedTagNames = []) {
        htmlElements.editTagsContainer.innerHTML = "";
        if (!methods.allAvailableTags) {
          console.warn("Etiquetas disponibles no cargadas para el modal.");
          return;
        }
        methods.allAvailableTags.forEach((tag) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "tag-btn-modal";
          button.textContent = tag.name;
          button.dataset.tagName = tag.name;
          if (selectedTagNames.includes(tag.name)) {
            button.classList.add("selected");
          }
          htmlElements.editTagsContainer.appendChild(button);
        });
      },
    };

    const handlers = {
      async handleEditClick(event) {
        const storyId = event.target.dataset.storyId;
        const storyToEdit = allStories.find((s) => s._id === storyId);
        if (storyToEdit) {
          methods.openEditModal(storyToEdit);
        } else {
          methods.showNotification("Error: Historia no encontrada para editar.", true);
        }
      },

      async handleDeleteClick(event) {
        const storyId = event.target.dataset.storyId;
        const storyToDelete = allStories.find((s) => s._id === storyId);

        if (!storyToDelete) {
          methods.showNotification("Error: Historia no encontrada para eliminar.", true);
          return;
        }

        if (
          confirm(
            `¿Estás seguro de que quieres eliminar la historia "${storyToDelete.title}"? Esta acción es irreversible.`
          )
        ) {
          const result = await methods.fetchAPI(API_ENDPOINTS.DELETE_STORY(storyId), {
            method: "DELETE",
          });

          if (result) {
            methods.showNotification("Historia eliminada exitosamente.");
            methods.loadMyStories();
          } else {
            methods.showNotification("No se pudo eliminar la historia.", true);
          }
        }
      },

      handleTagSelectionInModal(event) {
        const clickedButton = event.target;
        if (!clickedButton.classList.contains("tag-btn-modal")) return;

        const isSelected = clickedButton.classList.contains("selected");
        const selectedCount =
          htmlElements.editTagsContainer.querySelectorAll(".tag-btn-modal.selected").length;

        if (isSelected) {
          clickedButton.classList.remove("selected");
        } else {
          if (selectedCount < 5) {
            clickedButton.classList.add("selected");
          } else {
            methods.showNotification("Puedes seleccionar un máximo de 5 etiquetas.", false);
          }
        }
      },

      async handleEditSubmit(event) {
        event.preventDefault();
        const storyId = htmlElements.editStoryId.value;
        const updatedData = {
          title: htmlElements.editTitle.value,
          description: htmlElements.editDescription.value,
          category: htmlElements.editCategory.value,
          isAdultContent: htmlElements.editIsAdultContent.checked,
        };

        const selectedTagNodes =
          htmlElements.editTagsContainer.querySelectorAll(".tag-btn-modal.selected");
        updatedData.tags = Array.from(selectedTagNodes).map((btn) => btn.dataset.tagName);

        const result = await methods.fetchAPI(API_ENDPOINTS.UPDATE_STORY(storyId), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        });

        if (result && result.story) {
          methods.showNotification("Historia actualizada exitosamente.");
          methods.closeEditModal();
          methods.loadMyStories();
        } else {
          console.error("Fallo al actualizar historia:", result);
        }
      },
    };

    const init = () => {
      fetch("/frontend/modules/main/navbar/navbar.html")
        .then((response) => response.text())
        .then((html) => {
          htmlElements.navbarPlaceholder.innerHTML = html;
        })
        .catch((error) => console.error("Error al cargar el navbar:", error));

      methods.createEditModal();
      methods.loadCategoriesAndTagsForModal();
      methods.loadMyStories();
    };

    return { init };
  })();

  document.addEventListener("DOMContentLoaded", MyStoriesApp.init);
})();
