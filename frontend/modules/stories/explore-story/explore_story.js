(() => {
  const ExploreApp = (() => { // Renamed to ExploreApp for semantic correctness
    const htmlElements = {
      categoriesContainer: document.getElementById("categorias"),
      tagsContainer: document.getElementById("tags"),
      activeFiltersContainer: document.getElementById("activeTagsContainer"),
      clearFiltersBtn: document.getElementById("clearFilters"),
      resultCount: document.getElementById("resultCount"),
      storiesGrid: document.getElementById("historiasGrid"),
      noResultsSection: document.getElementById("noResults"),
      catCount: document.getElementById("catCount"), // Para el contador (1/1) o (0/1)
      tagCount: document.getElementById("tagCount"), // Para el contador (1/1) o (0/1)
      filtrosActivos: document.getElementById("filtrosActivos"), // Contenedor padre de filtros activos
    };

    const API_BASE_URL = "http://localhost:3000/api/stories";

    let allCategories = [];
    let allTags = [];
    let selectedCategory = null; // Puede ser null o el nombre de una categoría
    let selectedTag = null;     // Puede ser null o el nombre de una etiqueta

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
          return null; // Devuelve null en caso de error de red o similar
        }
      },

      async fetchCategories() {
        try {
          const data = await methods.fetchAPI(`${API_BASE_URL}/categories`);
          allCategories = data?.categories || [];
          methods.renderCategories();
        } catch (error) {
          console.error("Error al obtener categorías:", error);
          htmlElements.categoriesContainer.innerHTML = "<p>Error al cargar categorías.</p>";
        }
      },

      async fetchTags() {
        try {
          const data = await methods.fetchAPI(`${API_BASE_URL}/tags`);
          allTags = data?.tags || [];
          methods.renderTags();
        } catch (error) {
          console.error("Error al obtener etiquetas:", error);
          htmlElements.tagsContainer.innerHTML = "<p>Error al cargar etiquetas.</p>";
        }
      },

      renderCategories() {
        htmlElements.categoriesContainer.innerHTML = "";
        allCategories.forEach(category => {
          const button = document.createElement("button");
          button.textContent = category.name;
          button.classList.add("btn-filter");
          if (selectedCategory === category.name) {
            button.classList.add("selected");
          }
          button.addEventListener("click", () => handlers.toggleFilter("category", category.name));
          htmlElements.categoriesContainer.appendChild(button);
        });
        // Update category count (1/1) or (0/1)
        htmlElements.catCount.textContent = `(${selectedCategory ? '1' : '0'}/1)`;
      },

      renderTags() {
        htmlElements.tagsContainer.innerHTML = "";
        allTags.forEach(tag => {
          const button = document.createElement("button");
          button.textContent = tag.name;
          button.classList.add("btn-filter");
          if (selectedTag === tag.name) {
            button.classList.add("selected");
          }
          button.addEventListener("click", () => handlers.toggleFilter("tag", tag.name));
          htmlElements.tagsContainer.appendChild(button);
        });
        // Update tag count (1/1) or (0/1)
        htmlElements.tagCount.textContent = `(${selectedTag ? '1' : '0'}/1)`;
      },

      async filterStories() {
        let storiesToRender = [];
        let fetchedStories = [];

        // Case 1: Both category and tag are selected (frontend filtering)
        if (selectedCategory && selectedTag) {
          try {
            const data = await methods.fetchAPI(`${API_BASE_URL}`); // Fetch all stories
            fetchedStories = data?.stories || [];
            // Apply both filters in the frontend
            storiesToRender = fetchedStories.filter(story => 
                story.tags.some(tag => tag.name === selectedCategory) && // Assuming category is also a tag in data
                story.tags.some(tag => tag.name === selectedTag)
            );
          } catch (error) {
            console.error("Error al obtener todas las historias para filtrar combinado:", error);
            // Fallback: render empty or error message
          }
        } 
        // Case 2: Only category is selected (backend filtering)
        else if (selectedCategory) {
          try {
            const data = await methods.fetchAPI(`${API_BASE_URL}/category/${encodeURIComponent(selectedCategory)}`);
            storiesToRender = data?.stories || [];
          } catch (error) {
            console.error("Error al filtrar por categoría:", error);
          }
        } 
        // Case 3: Only tag is selected (backend filtering)
        else if (selectedTag) {
          try {
            const data = await methods.fetchAPI(`${API_BASE_URL}/tag/${encodeURIComponent(selectedTag)}`);
            storiesToRender = data?.stories || [];
          } catch (error) {
            console.error("Error al filtrar por etiqueta:", error);
          }
        } 
        // Case 4: No filters selected (fetch all stories)
        else {
          try {
            const data = await methods.fetchAPI(`${API_BASE_URL}`);
            storiesToRender = data?.stories || [];
          } catch (error) {
            console.error("Error al obtener todas las historias:", error);
          }
        }
        
        methods.renderStories(storiesToRender);
      },

      // Function to create a story card, matching dashboard.js structure
      createStoryCard(story) {
        const card = document.createElement("a");
        card.href = `/frontend/modules/stories/preview-story/preview.html?id=${story._id}`;
        card.className = "story-card"; // Using .story-card from explore_story.css

        card.innerHTML = `
          <div class="card-image-container">
            <img src="${story.coverImage || '/images/default-cover.jpg'}" alt="${story.title}" class="card-image">
          </div>
          <div class="card-content">
            <h3 class="story-title">${story.title}</h3>
            <p class="story-author">Por ${story.author?.username || 'Anónimo'}</p>
            <div class="story-meta">
              <span>${story.likes || 0} Me gusta</span>
              <span>${story.chapterCount || 0} Capítulos</span>
            </div>
          </div>
        `;
        return card;
      },

      renderStories(stories) {
        htmlElements.storiesGrid.innerHTML = "";
        if (stories.length === 0) {
          htmlElements.noResultsSection.classList.remove("hidden");
          htmlElements.resultCount.textContent = "0 historias encontradas";
        } else {
          htmlElements.noResultsSection.classList.add("hidden");
          htmlElements.resultCount.textContent = `${stories.length} historias encontradas`;
          stories.forEach(story => {
            const storyCardElement = methods.createStoryCard(story);
            htmlElements.storiesGrid.appendChild(storyCardElement);
          });
        }
      },

      updateActiveFiltersUI() {
        htmlElements.activeFiltersContainer.innerHTML = "";
        let hasActiveFilters = false;

        if (selectedCategory) {
          const span = document.createElement("span");
          span.classList.add("active-tag");
          span.textContent = selectedCategory;
          htmlElements.activeFiltersContainer.appendChild(span);
          hasActiveFilters = true;
        }

        if (selectedTag) {
          const span = document.createElement("span");
          span.classList.add("active-tag");
          span.textContent = selectedTag;
          htmlElements.activeFiltersContainer.appendChild(span);
          hasActiveFilters = true;
        }

        if (hasActiveFilters) {
          htmlElements.filtrosActivos.classList.remove("hidden");
        } else {
          htmlElements.filtrosActivos.classList.add("hidden");
        }
      },
    };

    const handlers = {
      async handlePageLoad() {
        await methods.fetchCategories();
        await methods.fetchTags();
        await methods.filterStories(); // Load all stories initially
        methods.updateActiveFiltersUI(); // Update active filters section on load
      },

      toggleFilter(type, name) {
        if (type === "category") {
          if (selectedCategory === name) {
            selectedCategory = null; // Deselect if already selected
          } else {
            selectedCategory = name; // Select new category
          }
        } else if (type === "tag") {
          if (selectedTag === name) {
            selectedTag = null; // Deselect if already selected
          } else {
            selectedTag = name; // Select new tag
          }
        }
        methods.renderCategories(); // Re-render to update selected state and count
        methods.renderTags();       // Re-render to update selected state and count
        methods.updateActiveFiltersUI();
        methods.filterStories();
      },

      clearAllFilters() {
        selectedCategory = null;
        selectedTag = null;
        methods.renderCategories();
        methods.renderTags();
        methods.updateActiveFiltersUI();
        methods.filterStories();
      },
    };

    const init = () => {
      handlers.handlePageLoad();
      htmlElements.clearFiltersBtn.addEventListener("click", handlers.clearAllFilters);
    };

    return { init };
  })();

  ExploreApp.init();
})();