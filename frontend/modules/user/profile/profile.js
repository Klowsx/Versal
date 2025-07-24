(() => {
  const App = (() => {
    const API_URL = "http://localhost:3000/api/user/me";

    const htmlElements = {
      profileImage: document.getElementById("avatar"),
      fullName: document.getElementById("fullName"),
      username: document.getElementById("username"),
      badge: document.getElementById("badge"),
      nombre: document.getElementById("nombre"),
      userTag: document.getElementById("userTag"),
      email: document.getElementById("email"),
      bio: document.getElementById("bio"),
      histCount: document.getElementById("histCount"),
      favCount: document.getElementById("favCount"),
      followersCount: document.getElementById("followersCount"),
      followingCount: document.getElementById("followingCount"),
    };

    const methods = {
      async fetchProfile() {
        try {
          const token = localStorage.getItem("token");
          console.log("Token:", token);

          const res = await fetch(API_URL, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) throw new Error("Error al obtener perfil");

          return await res.json();
        } catch (error) {
          console.error("Error al obtener perfil:", error);
          alert("Hubo un error al cargar tu perfil.");
          return null;
        }
      },

      displayProfile(data) {
        htmlElements.profileImage.src = data.profileImage || "../../../resources/profile.png";
        htmlElements.fullName.textContent = data.fullName;
        htmlElements.username.textContent = `@${data.username}`;
        htmlElements.badge.textContent =
          data.subscription?.type === "premium" ? "💎 Premium" : "🌟 Básico";

        htmlElements.nombre.textContent = data.fullName.split(" ")[0] || "...";
        htmlElements.userTag.textContent = `@${data.username}`;
        htmlElements.email.textContent = data.email;
        htmlElements.bio.textContent = data.bio || "Sin biografía.";

        htmlElements.histCount.textContent = data.histCount || 0;
        htmlElements.favCount.textContent = data.favCount || 0;
        htmlElements.followersCount.textContent = data.followers?.length || 0;
        htmlElements.followingCount.textContent = data.following?.length || 0;
      },
    };

    const handlers = {
      async loadProfile() {
        const data = await methods.fetchProfile();
        if (data) {
          methods.displayProfile(data);
        }
      },
    };

    const init = () => {
      window.addEventListener("DOMContentLoaded", handlers.loadProfile);
    };

    return { init };
  })();

  App.init();
})();
