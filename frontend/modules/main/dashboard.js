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
            throw new Error(error.message || "Error desconocido");
          }
          return await response.json();
        } catch (err) {
          console.error("Error en fetchAPI:", err);
          return [];
        }
      },

      createFeaturedCard(story) {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${story.title}</h3>
          <p>por ${story.autor || "Autor desconocido"}</p>
          <span>${story.reads || "0"} lecturas · ⭐ ${story.rating || "5.0"}</span>
        `;
        return card;
      },

      createRecommendedCard(story) {
        const card = document.createElement("div");
        card.className = "card small";
        card.innerHTML = `
          <h4>${story.title}</h4>
          <p>${story.autor || "Autor desconocido"}</p>
          <span>${story.reads || "0"} · ❤️ ${story.votes || "0"}</span>
        `;
        return card;
      },
    };

    const handlers = {
      async loadStories() {
        const stories = await methods.fetchAPI(API_URL);
        if (!stories.length) return;

        // Historias destacadas (primeras 3)
        const featured = stories.slice(0, 3);
        featured.forEach((story) => {
          const el = methods.createFeaturedCard(story);
          htmlElements.featuredContainer.appendChild(el);
        });

        // Recomendadas (siguientes 6)
        const recommended = stories.slice(3, 9);
        recommended.forEach((story) => {
          const el = methods.createRecommendedCard(story);
          htmlElements.recommendedContainer.appendChild(el);
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
