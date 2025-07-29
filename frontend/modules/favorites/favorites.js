(() => {
  const FavoritesApp = (() => {
    const API_URL = "http://localhost:3000/api/me/favorites";
    const grid = document.getElementById("favorites-grid");

    const fetchFavorites = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.replace("/frontend/modules/auth/login/login.html");
        return null;
      }
      try {
        const response = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(response);
        if (!response.ok) throw new Error("No se pudieron cargar tus favoritos.");
        return await response.json();
      } catch (error) {
        console.error(error);
        grid.innerHTML = `<p>${error.message}</p>`;
        return null;
      }
    };

    const createStoryCard = (story) => {
      const card = document.createElement("a");
      card.className = "story-card";
      card.href = `/frontend/modules/stories/preview-story/preview.html?id=${story._id}`;

      card.innerHTML = `
        <img src="${story.coverImage || "/frontend/resources/profile.png"}" alt="Portada de ${
        story.title
      }" class="story-card-cover">
        <div class="story-card-content">
            <h3>${story.title}</h3>
            <p>por ${story.author?.username || "Autor desconocido"}</p>
        </div>
      `;
      return card;
    };

    const renderFavorites = (data) => {
      grid.innerHTML = "";
      if (data && data.stories && data.stories.length > 0) {
        data.stories.forEach((story) => {
          if (story) {
            grid.appendChild(createStoryCard(story));
          }
        });
      } else {
        grid.innerHTML = "<p>Aún no has añadido ninguna historia a tus favoritos.</p>";
      }
    };

    const init = async () => {
      const favoritesData = await fetchFavorites();
      renderFavorites(favoritesData);
    };

    return { init };
  })();

  document.addEventListener("DOMContentLoaded", FavoritesApp.init);
})();
