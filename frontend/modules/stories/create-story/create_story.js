(() => {
  const CreateStoryApp = (() => {
    const API_BASE_URL = "http://localhost:3000/api";
    const API_ENDPOINTS = {
      CREATE_STORY: `${API_BASE_URL}/stories`,
      GET_TAGS: `${API_BASE_URL}/stories/tags`,
      GET_CATEGORIES: `${API_BASE_URL}/stories/categories`,
    };

    const htmlElements = {
      storyForm: document.getElementById("create-story-form"),
      title: document.getElementById("title"),
      description: document.getElementById("description"),
      coverImage: document.getElementById("coverImage"),
      category: document.getElementById("category"),
      tagsContainer: document.getElementById("tags-container"),
      language: document.getElementById("language"),
      isAdultContent: document.getElementById("isAdultContent"),
      charactersList: document.getElementById("characters-list"),
      addCharacterBtn: document.getElementById("add-character-btn"),
    };

    const methods = {
      async fetchAPI(url, options = {}) {
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Error desconocido");
          }
          return await response.json();
        } catch (err) {
          console.error(`Error en fetchAPI para ${url}:`, err);
          return null;
        }
      },

      renderCategories(categories) {
        htmlElements.category.innerHTML =
          '<option value="" disabled selected>Selecciona una categoría</option>';
        categories.forEach((cat) => {
          const option = document.createElement("option");
          option.value = cat.name;
          option.textContent = cat.name;
          htmlElements.category.appendChild(option);
        });
      },

      renderTags(tags) {
        htmlElements.tagsContainer.innerHTML = "";
        tags.forEach((tag) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "tag-btn";
          button.textContent = tag.name;
          button.dataset.tagName = tag.name;
          htmlElements.tagsContainer.appendChild(button);
        });
      },
    };

    const handlers = {
      async loadCategories() {
        const data = await methods.fetchAPI(API_ENDPOINTS.GET_CATEGORIES);
        if (data && data.categories) {
          methods.renderCategories(data.categories);
        }
      },
      addCharacterField() {
        const characterId = Date.now();
        const newField = document.createElement("div");
        newField.className = "character-entry";
        newField.id = `character-${characterId}`;
        newField.innerHTML = `
          <div>
            <input type="text" class="character-name" placeholder="Nombre del Personaje" required />
          </div>
          <button type="button" class="remove-btn" data-remove-id="${characterId}">×</button>
        `;
        htmlElements.charactersList.appendChild(newField);
      },

      removeCharacterField(event) {
        if (event.target.classList.contains("remove-btn")) {
          const idToRemove = event.target.dataset.removeId;
          const fieldToRemove = document.getElementById(`character-${idToRemove}`);
          if (fieldToRemove) {
            fieldToRemove.remove();
          }
        }
      },

      async loadTags() {
        const data = await methods.fetchAPI(API_ENDPOINTS.GET_TAGS);
        if (data && data.tags) {
          methods.renderTags(data.tags);
        }
      },

      handleTagSelection(event) {
        const clickedButton = event.target;
        if (!clickedButton.classList.contains("tag-btn")) return;

        const isSelected = clickedButton.classList.contains("selected");
        const selectedCount =
          htmlElements.tagsContainer.querySelectorAll(".tag-btn.selected").length;

        if (isSelected) {
          clickedButton.classList.remove("selected");
        } else {
          if (selectedCount < 5) {
            clickedButton.classList.add("selected");
          } else {
            alert("Puedes seleccionar un máximo de 5 etiquetas.");
          }
        }
      },

      async submitForm(event) {
        event.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Debes iniciar sesión para crear una historia.");
          window.location.href = "/frontend/modules/auth/login/login.html";
          return;
        }

        const formData = new FormData();
        formData.append("title", htmlElements.title.value);
        formData.append("description", htmlElements.description.value);
        formData.append("coverImage", htmlElements.coverImage.files[0]);
        formData.append("category", htmlElements.category.value);
        formData.append("language", htmlElements.language.value);
        formData.append("isAdultContent", htmlElements.isAdultContent.checked);

        const selectedTagNodes = htmlElements.tagsContainer.querySelectorAll(".tag-btn.selected");
        const selectedTagsArray = Array.from(selectedTagNodes).map((btn) => btn.dataset.tagName);
        formData.append("tags", JSON.stringify(selectedTagsArray));

        const characterEntries = htmlElements.charactersList.querySelectorAll(".character-entry");
        const charactersArray = Array.from(characterEntries).map((entry) => {
          const name = entry.querySelector(".character-name").value;
          return { name };
        });
        formData.append("characters", JSON.stringify(charactersArray));

        const result = await methods.fetchAPI(API_ENDPOINTS.CREATE_STORY, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (result && result.story) {
          const storyId = result.story._id; 
          window.location.href = `/frontend/modules/stories/write-story/write_story.html?storyId=${storyId}`;
        } else {
          alert(`Error al crear la historia: ${result ? result.error : "Error desconocido"}`);
        }
      },
    };

    const init = () => {
      handlers.loadCategories();
      handlers.loadTags();

      htmlElements.addCharacterBtn.addEventListener("click", handlers.addCharacterField);
      htmlElements.charactersList.addEventListener("click", handlers.removeCharacterField);
      htmlElements.tagsContainer.addEventListener("click", handlers.handleTagSelection);
      htmlElements.storyForm.addEventListener("submit", handlers.submitForm);
    };

    return { init };
  })();

  document.addEventListener("DOMContentLoaded", CreateStoryApp.init);
})();
