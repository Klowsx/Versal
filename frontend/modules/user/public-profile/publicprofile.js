(() => {
  const PublicProfileApp = (() => {
    const htmlElements = {
      profileContent: document.getElementById("profile-content"),
      bio: document.getElementById("bio"),
      storyCount: document.getElementById("story-count"),
      storiesGrid: document.getElementById("stories-grid"),
      storyTitle: document.getElementById("story-title"),
      navbarPlaceholder: document.getElementById("navbar-placeholder"),

      userListModal: document.getElementById("user-list-modal"),
      modalTitle: document.getElementById("modal-title"),
      modalUserList: document.getElementById("modal-user-list"),
      closeModalBtn: document.querySelector("#user-list-modal .close-button"),
    };

    const API_USER_BASE_URL = "http://localhost:3000/api/user";
    const API_STORY_BASE_URL = "http://localhost:3000/api/stories";

    const profileUserId = new URLSearchParams(window.location.search).get("id");

    let isFollowing = false;
    let isBlocked = false;

    const methods = {
      showNotification: (message, isError = false) => {
        const notification = document.createElement("div");
        notification.className = `editor-notification ${isError ? "error" : ""}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add("show"), 10);
        setTimeout(() => {
          notification.classList.remove("show");
          setTimeout(
            () => document.body.contains(notification) && document.body.removeChild(notification),
            500
          );
        }, 3000);
      },

      fetchAPI: async (url, options = {}) => {
        const token = localStorage.getItem("token");
        const headers = { ...options.headers };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        if (
          !(options.body instanceof FormData) &&
          options.body !== undefined &&
          !headers["Content-Type"]
        ) {
          headers["Content-Type"] = "application/json";
          options.body = JSON.stringify(options.body);
        }
        try {
          const response = await fetch(url, { ...options, headers });
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              methods.showNotification("Sesión expirada.", true);
              localStorage.removeItem("token");
              setTimeout(
                () => (window.location.href = "/frontend/modules/auth/login/login.html"),
                1500
              );
              return null;
            }
            const error = await response
              .json()
              .catch(() => ({ message: `Error ${response.status}` }));
            throw new Error(error.message || "Error desconocido");
          }
          if (response.status === 204 || response.headers.get("Content-Length") === "0") {
            return { success: true };
          }
          return await response.json();
        } catch (err) {
          console.error(`Error en fetchAPI para ${url}:`, err.message);
          methods.showNotification(err.message, true);
          return null;
        }
      },

      renderProfileHero(user, isMyProfile) {
        htmlElements.profileContent.innerHTML = `
          <div class="avatar-container">
            <img src="${
              user.profileImage || "/frontend/resources/profile.png"
            }" alt="Avatar" class="avatar" />
          </div>
          <div class="name-username">
            <h1>${user.username || "Usuario"}</h1>
            <p>@${user.username?.toLowerCase() || "desconocido"}</p>
          </div>
          ${
            isMyProfile
              ? ""
              : `
            <div class="follow-section">
              <button class="btn-primary" id="follow-unfollow-btn">Seguir</button>
              <button class="btn-outline" id="block-unblock-btn">Bloquear</button>
            </div>
          `
          }
          <div class="stats">
            <div id="show-followers-btn">
            
              <span class="stat-label">Seguidores:</span>
              <span class="stat-number">${user.followers?.length || 0}</span>
            </div>
            <div id="show-following-btn">
              <span class="stat-label">Seguidos:</span>
              <span class="stat-number">${user.following?.length || 0}</span>
            </div>
          </div>
        `;

        document
          .getElementById("show-followers-btn")
          .addEventListener("click", handlers.handleShowFollowers);
        document
          .getElementById("show-following-btn")
          .addEventListener("click", handlers.handleShowFollowing);

        if (!isMyProfile) {
          document
            .getElementById("follow-unfollow-btn")
            .addEventListener("click", handlers.handleFollowToggle);
          document
            .getElementById("block-unblock-btn")
            .addEventListener("click", handlers.handleBlockToggle);
        }
      },

      updateFollowButtonUI() {
        const btn = document.getElementById("follow-unfollow-btn");
        if (!btn) return;
        btn.textContent = isFollowing ? "Dejar de seguir" : "Seguir";
        btn.className = isFollowing ? "btn-primary btn-unfollow" : "btn-primary btn-follow";
      },

      updateBlockButtonUI() {
        const btn = document.getElementById("block-unblock-btn");
        if (!btn) return;
        btn.textContent = isBlocked ? "Desbloquear" : "Bloquear";
        btn.className = isBlocked ? "btn-outline btn-unblock" : "btn-outline btn-block";
      },

      renderStoryCard(story) {
        const storyCard = document.createElement("a");
        storyCard.href = `/frontend/modules/stories/preview-story/preview.html?id=${story._id}`;
        storyCard.className = "story-card";
        storyCard.innerHTML = `
          <img src="${story.coverImage || "/frontend/resources/default-cover.png"}" alt="${
          story.title
        }" class="story-cover" />
          <div class="story-info">
            <h3>${story.title}</h3>
            <div class="story-stats">Capítulos: ${story.chapterCount || 0}</div>
            <p>${
              story.description ? story.description.substring(0, 70) + "..." : "Sin descripción"
            }</p>
            <div class="badges">
              ${story.category ? `<span class="badge categoria">${story.category.name}</span>` : ""}
              ${
                story.status
                  ? `<span class="badge estado ${
                      story.status === "published"
                        ? "completada"
                        : story.status === "draft"
                        ? "en-curso"
                        : "pausada"
                    }">${methods.mapStatus(story.status)}</span>`
                  : ""
              }
            </div>
          </div>
        `;
        return storyCard;
      },

      mapStatus(status) {
        switch (status) {
          case "draft":
            return "Borrador";
          case "published":
            return "Publicada";
          case "archived":
            return "Archivada";
          default:
            return "Desconocido";
        }
      },
    };
    const handlers = {
      async loadProfileAndStories() {
        fetch("/frontend/modules/main/navbar/navbar.html")
          .then((res) => res.text())
          .then((html) => (htmlElements.navbarPlaceholder.innerHTML = html));

        if (!localStorage.getItem("token") || !profileUserId) {
          window.location.href = "/frontend/modules/auth/login/login.html";
          return;
        }

        const [currentUserData, profileData] = await Promise.all([
          methods.fetchAPI(`${API_USER_BASE_URL}/me`),
          methods.fetchAPI(`${API_USER_BASE_URL}/${profileUserId}`),
        ]);

        if (!profileData) {
          document.querySelector(
            "main"
          ).innerHTML = `<div class="card" style="text-align: center;"><h1>Usuario no encontrado</h1><p>El perfil que buscas no existe o fue eliminado.</p></div>`;
          return;
        }

        if (!currentUserData) return;

        const isMyProfile = profileUserId === currentUserData._id;

        methods.renderProfileHero(profileData, isMyProfile);

        if (!isMyProfile) {
          isFollowing = currentUserData.following.includes(profileData._id);
          isBlocked = currentUserData.blockedUsers.includes(profileData._id);
          methods.updateFollowButtonUI();
          methods.updateBlockButtonUI();
        }

        htmlElements.bio.textContent = profileData.bio || "No hay biografía disponible.";
        const storiesData = await methods.fetchAPI(`${API_STORY_BASE_URL}/author/${profileUserId}`);
        const userStories = storiesData?.stories || [];
        htmlElements.storyCount.textContent = userStories.length;
        htmlElements.storiesGrid.innerHTML = "";

        if (isBlocked) {
          htmlElements.bio.parentElement.style.display = "none";
          htmlElements.storiesGrid.parentElement.style.display = "none";
        } else if (userStories.length > 0) {
          userStories.forEach((story) => {
            const storyCard = methods.renderStoryCard(story);
            htmlElements.storiesGrid.appendChild(storyCard);
          });
        } else {
          htmlElements.storiesGrid.innerHTML = "<p>Este usuario aún no ha publicado historias.</p>";
        }
      },

      handleShowFollowers() {
        handlers.openUserListModal("Seguidores", `${API_USER_BASE_URL}/${profileUserId}/followers`);
      },

      handleShowFollowing() {
        handlers.openUserListModal("Siguiendo", `${API_USER_BASE_URL}/${profileUserId}/following`);
      },

      async openUserListModal(title, apiUrl) {
        htmlElements.modalTitle.textContent = title;
        htmlElements.modalUserList.innerHTML = "<p>Cargando...</p>";
        htmlElements.userListModal.style.display = "flex";

        const users = await methods.fetchAPI(apiUrl);
        htmlElements.modalUserList.innerHTML = "";

        if (users && users.length > 0) {
          users.forEach((user) => {
            const userItem = document.createElement("a");
            userItem.className = "user-list-item";
            userItem.href = `/frontend/modules/user/public-profile/publicprofile.html?id=${user._id}`;
            userItem.innerHTML = `
              <img src="${user.profileImage || "/frontend/resources/profile.png"}" alt="${
              user.username
            }" />
              <span>${user.username}</span>
            `;
            htmlElements.modalUserList.appendChild(userItem);
          });
        } else {
          htmlElements.modalUserList.innerHTML = `<p>No se encontraron usuarios.</p>`;
        }
      },

      closeModal() {
        if (htmlElements.userListModal) {
          htmlElements.userListModal.style.display = "none";
        }
      },

      async handleFollowToggle() {
        const btn = document.getElementById("follow-unfollow-btn");
        btn.disabled = true;
        const apiEndpoint = isFollowing ? `/unfollow` : `/follow`;
        const result = await methods.fetchAPI(
          `${API_USER_BASE_URL}/${profileUserId}${apiEndpoint}`,
          { method: "POST" }
        );
        if (result?.success) {
          const followersCountEl = document.getElementById("followers-count");
          const count = parseInt(followersCountEl.textContent, 10);
          isFollowing = !isFollowing;
          followersCountEl.textContent = isFollowing ? count + 1 : count - 1;
          methods.updateFollowButtonUI();
          methods.showNotification(
            isFollowing ? "¡Ahora sigues a este usuario!" : "Has dejado de seguir al usuario."
          );
        }
        btn.disabled = false;
      },

      async handleBlockToggle() {
        const btn = document.getElementById("block-unblock-btn");
        btn.disabled = true;
        const apiEndpoint = isBlocked ? `/unblock` : `/block`;
        const result = await methods.fetchAPI(
          `${API_USER_BASE_URL}/${profileUserId}${apiEndpoint}`,
          { method: "POST" }
        );
        if (result?.success) {
          isBlocked = !isBlocked;
          methods.updateBlockButtonUI();
          methods.showNotification(isBlocked ? "Usuario bloqueado." : "Usuario desbloqueado.");
          const bioSection = htmlElements.bio.parentElement;
          const storiesSection = htmlElements.storiesGrid.parentElement;
          bioSection.style.display = isBlocked ? "none" : "block";
          storiesSection.style.display = isBlocked ? "none" : "block";
        }
        btn.disabled = false;
      },
    };

    return {
      init: () => {
        document.addEventListener("DOMContentLoaded", handlers.loadProfileAndStories);

        htmlElements.closeModalBtn.addEventListener("click", handlers.closeModal);
        window.addEventListener("click", (event) => {
          if (event.target === htmlElements.userListModal) {
            handlers.closeModal();
          }
        });
      },
    };
  })();

  PublicProfileApp.init();
})();
