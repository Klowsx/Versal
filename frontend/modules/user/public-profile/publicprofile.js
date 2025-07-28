(() => {
  const PublicProfileApp = (() => {
    const htmlElements = {
      profileContent: document.getElementById("profile-content"), // Contenedor principal de la información del perfil
      bio: document.getElementById("bio"),
      storyTitle: document.getElementById("story-title"), // Título "Historias"
      storyCount: document.getElementById("story-count"), // Badge de conteo de historias
      storiesGrid: document.getElementById("stories-grid"), // Grid para las historias
    };

    const API_BASE_URL = "http://localhost:3000/api/user/me";

    const profileUserId = new URLSearchParams(window.location.search).get("id"); 

    let currentLoggedInUserId = null; // ID del usuario actualmente logueado

    // --- Métodos de Ayuda ---
    const methods = {
      // Función genérica para hacer peticiones a la API
      async fetchAPI(url, options = {}) {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          ...options.headers, // Permite añadir headers adicionales
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`; // Incluye el token si existe
        }
        try {
          const response = await fetch(url, { ...options, headers });
          if (response.status === 401) { // No autorizado, redirige al login
            alert("Debes iniciar sesión para acceder a esta función.");
            window.location.href = "/frontend/modules/auth/login/login.html";
            return null;
          }
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Error en la API: ${response.status}`);
          }
          return await response.json();
        } catch (err) {
          console.error(`Error en fetchAPI para ${url}:`, err);
          alert(err.message || "Ocurrió un error al conectar con el servidor.");
          return null;
        }
      },

      // Renderiza la sección del hero del perfil
      renderProfileHero(user, isMyProfile, isFollowing) {
        // Limpia el contenido previo del hero
        htmlElements.profileContent.innerHTML = ''; 

        const heroContentHtml = `
          <div class="avatar-container">
            <img src="${user.profileImage || '/frontend/resources/profile.png'}" alt="Avatar" class="avatar" id="profile-avatar" />
            ${user.isVerified ? '<span class="verificado">✓</span>' : ''}
          </div>
          <div class="name-username">
            <h1 id="profile-username">${user.username || 'Usuario Desconocido'}</h1>
            <p>@${user.username ? user.username.toLowerCase() : 'desconocido'}</p> 
          </div>
          <div class="follow-section">
            ${!isMyProfile ? `<button class="btn-follow" id="follow-unfollow-btn">${isFollowing ? 'Dejar de seguir' : 'Seguir'}</button>` : ''}
          </div>
          <div class="stats">
            <div>
              <span class="stat-number" id="followers-count">${user.followersCount || 0}</span>
              <span class="stat-label">Seguidores</span>
            </div>
            <div>
              <span class="stat-number" id="following-count">${user.followingCount || 0}</span>
              <span class="stat-label">Seguidos</span>
            </div>
          </div>
          ${user.isPremium ? '<span class="badge premium">⭐ Premium</span>' : ''}
        `;
        htmlElements.profileContent.innerHTML = heroContentHtml;

        // Adjunta el event listener al botón de seguir/dejar de seguir
        if (!isMyProfile) {
          const followBtn = document.getElementById('follow-unfollow-btn');
          if (followBtn) {
            followBtn.addEventListener('click', handlers.handleFollowToggle);
          }
        }
      },

      // Renderiza una tarjeta de historia individual
      renderStoryCard(story) {
        const storyCard = document.createElement("a");
        storyCard.href = `/frontend/modules/stories/preview-story/preview.html?id=${story._id}`;
        storyCard.className = "story-card";
        storyCard.innerHTML = `
          <img src="${story.coverImage || '/images/default-cover.jpg'}" alt="${story.title}" class="story-cover" />
          <div class="story-info">
            <h3>${story.title}</h3>
            <div class="story-stats">Capítulos: ${story.chapterCount || 0}</div>
            <p>${story.description ? story.description.substring(0, 70) + '...' : 'Sin descripción'}</p>
            <div class="badges">
              ${story.category ? `<span class="badge categoria">${story.category.name}</span>` : ''}
              ${story.status ? `<span class="badge estado ${story.status === 'published' ? 'completada' : story.status === 'draft' ? 'en-curso' : 'pausada'}">${methods.mapStatus(story.status)}</span>` : ''}
            </div>
          </div>
        `;
        return storyCard;
      },

      // Mapea el estado de la historia a un texto legible
      mapStatus(status) {
        switch (status) {
          case "draft": return "Borrador";
          case "published": return "Publicada";
          case "archived": return "Archivada";
          default: return "Desconocido";
        }
      },
    };

    // --- Manejadores de Eventos ---
    const handlers = {
      async loadProfileAndStories() {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Debes iniciar sesión para ver perfiles.");
          window.location.href = "/frontend/modules/auth/login/login.html";
          return;
        }

        // 1. Obtener el ID del usuario actualmente logueado
        const currentUserResponse = await methods.fetchAPI(`${API_BASE_URL}`);
        if (!currentUserResponse) return;
        currentLoggedInUserId = currentUserResponse._id;

        let profileToLoadId = profileUserId;
        let isMyProfile = false;

        // Si no hay ID en la URL o el ID es el del usuario logueado, carga el perfil propio
        if (!profileToLoadId || profileToLoadId === currentLoggedInUserId) {
          profileToLoadId = currentLoggedInUserId;
          isMyProfile = true;
        }

        // 2. Obtener los datos del perfil (propio o ajeno)
        const profileData = await methods.fetchAPI(`${API_BASE_URL}/user/${profileToLoadId}`);
        if (!profileData) return;
        const userProfile = profileData; // Asumiendo que la API devuelve el objeto de usuario directamente

        // 3. Verificar si el usuario logueado sigue a este perfil (solo si no es su propio perfil)
        let isFollowing = false;
        if (!isMyProfile) {
          const followingList = await methods.fetchAPI(`${API_BASE_URL}/user/me/following`);
          if (followingList && followingList.following) {
            isFollowing = followingList.following.some(f => f._id === userProfile._id);
          }
        }
        
        // 4. Renderizar la sección hero del perfil
        methods.renderProfileHero(userProfile, isMyProfile, isFollowing);

        // 5. Renderizar la biografía
        htmlElements.bio.textContent = userProfile.bio || "No hay biografía.";

        // 6. Obtener las historias del usuario del perfil
        // Asumiendo que esta ruta devuelve las historias del autor especificado
        const userStoriesResponse = await methods.fetchAPI(`${API_BASE_URL}/stories/author/${userProfile._id}`);
        if (!userStoriesResponse || !userStoriesResponse.stories) {
          htmlElements.storiesGrid.innerHTML = '<p>No se encontraron historias.</p>';
          htmlElements.storyCount.textContent = '0';
          return;
        }
        const userStories = userStoriesResponse.stories;

        // 7. Renderizar las historias
        htmlElements.storyCount.textContent = userStories.length;
        htmlElements.storiesGrid.innerHTML = ''; // Limpiar contenido previo
        if (userStories.length > 0) {
          userStories.forEach(story => {
            htmlElements.storiesGrid.appendChild(methods.renderStoryCard(story));
          });
        } else {
          htmlElements.storiesGrid.innerHTML = '<p>No hay historias publicadas por este usuario.</p>';
        }
      },

      // Maneja la acción de seguir/dejar de seguir
      async handleFollowToggle(event) {
        const btn = event.target;
        const userIdToFollow = profileUserId; // El ID del perfil que se está viendo

        if (!userIdToFollow) return; 

        const currentText = btn.textContent;
        let apiEndpoint = '';
        let successMessage = '';
        let errorMessage = '';

        if (currentText === 'Seguir') {
          apiEndpoint = `${API_BASE_URL}/user/${userIdToFollow}/follow`;
          successMessage = '¡Usuario seguido con éxito!';
          errorMessage = 'Error al seguir al usuario.';
        } else { // 'Dejar de seguir'
          apiEndpoint = `${API_BASE_URL}/user/${userIdToFollow}/unfollow`;
          successMessage = 'Usuario dejado de seguir.';
          errorMessage = 'Error al dejar de seguir al usuario.';
        }

        const result = await methods.fetchAPI(apiEndpoint, { method: 'POST' });

        if (result && !result.error) {
          alert(successMessage);
          // Recargar los datos del perfil para actualizar contadores y estado del botón
          handlers.loadProfileAndStories(); 
        } else {
          alert(errorMessage + (result ? ` ${result.message}` : ''));
        }
      },
    };

    // --- Inicialización ---
    const init = () => {
      handlers.loadProfileAndStories();
    };

    return { init };
  })();

  PublicProfileApp.init();
})();