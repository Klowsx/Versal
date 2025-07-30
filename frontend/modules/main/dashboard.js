(() => {
  const App = (() => {
    const API_URL = "http://localhost:3000/api/stories";

    const htmlElements = {
      featuredContainer: document.getElementById("featured-stories"),
      recommendedContainer: document.getElementById("recommended-stories"),
    };

    const methods = {
      async fetchAPI(url, options = {}) {
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Error desconocido en la API");
          }
          return await response.json();
        } catch (err) {
          console.error("Error en fetchAPI:", err);
          return { stories: [] }; 
        }
      },

      createFeaturedCard(story) {
        const card = document.createElement("a"); 
        card.href = `/frontend/modules/stories/preview-story/preview.html?id=${story._id}`;
        card.className = "card";
       
        card.innerHTML = `
          <div class="card-image-container">
            <img src="${story.coverImage || '/images/default-cover.jpg'}" alt="${story.title}" class="card-image">
          </div>
          <div class="card-content">
            <h3>${story.title}</h3>
            <p>por ${story.author?.username || "Autor desconocido"}</p>
            <span>Capítulos: ${story.chapterCount || "0"} · Estado: ${story.status || "Desconocido"}</span>
            </div>
        `;
        return card;
      },

      createRecommendedCard(story) {
        const card = document.createElement("a"); 
        card.href = `/frontend/modules/stories/preview-story/preview.html?id=${story._id}`;
        card.className = "card small";
        card.innerHTML = `
          <div class="card-image-container">
            <img src="${story.coverImage || '/images/default-cover.jpg'}" alt="${story.title}" class="card-image-small">
          </div>
          <div class="card-content">
            <h4>${story.title}</h4>
            <p>${story.author?.username || "Autor desconocido"}</p>
            <span>Idioma: ${story.language || "N/A"}</span>
            </div>
        `;
        return card;
      },
    };

    const handlers = {
      async loadStories() {
        const response = await methods.fetchAPI(API_URL);
        const stories = response.stories || []; 

        if (!stories.length) {
            console.log("No se encontraron historias para mostrar.");
            return;
        }

        const featured = stories.slice(0, 3);
        featured.forEach((story) => {
          const el = methods.createFeaturedCard(story);
          if (htmlElements.featuredContainer) {
            htmlElements.featuredContainer.appendChild(el);
          }
        });

        const recommended = stories.slice(3, 9);
        recommended.forEach((story) => {
          const el = methods.createRecommendedCard(story);
          if (htmlElements.recommendedContainer) {
            htmlElements.recommendedContainer.appendChild(el);
          }
        });
      },
    };

    const init = () => {
      handlers.loadStories();
    };

    return { init };
  })();

  App.init();
})();