(() => {
  const StoryDetailApp = (() => {
    const htmlElements = {
      cover: document.getElementById("story-cover"),
      title: document.getElementById("story-title"),
      author: document.getElementById("story-author"),
      avatar: document.getElementById("author-avatar"),
      tagsContainer: document.getElementById("story-tags"),
      likes: document.getElementById("story-likes"),
      synopsis1: document.getElementById("synopsis-1"),
      status: document.getElementById("story-status"),
      chapters: document.getElementById("story-chapters"),
      language: document.getElementById("story-language"),
      readBtn: document.getElementById("read-now"),
      donateBtn: document.getElementById("donate"),
      
      // Elementos del modal
      donationModal: document.getElementById("donationModal"),
      donationAmountInput: document.getElementById("donationAmount"),
      availableCoinsSpan: document.getElementById("availableCoins"),
      confirmDonationBtn: document.getElementById("confirmDonation"),
      cancelDonationBtn: document.getElementById("cancelDonation"),
      modalMessage: document.getElementById("modalMessage"),
    };

    const API_URL = "http://localhost:3000/api/stories/";
    const USER_API_URL = "http://localhost:3000/api/user/me";
    const DONATION_API_BASE_URL = "http://localhost:3000/api/stories";
    const storyId = new URLSearchParams(window.location.search).get("id");

    let currentStoryAuthorId = null;
    let currentUserId = null;
    let currentUserCoins = 0;

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
          console.error(`Error en fetchAPI para ${url}:`, err);
          return null;
        }
      },

      async fetchStoryById(id) {
        try {
          const res = await fetch(`${API_URL}${id}`);
          if (!res.ok) throw new Error("No se pudo obtener la historia");
          const data = await res.json();
          if (data && data.story && data.story.author) {
              currentStoryAuthorId = data.story.author._id;
          }
          return data;
        } catch (err) {
          console.error("Error en fetchStoryById:", err);
          alert(err.message || "Error cargando la historia.");
          return null;
        }
      },

      async fetchCurrentUser() {
        const token = localStorage.getItem("token");
        if (!token) {
          return null;
        }
        try {
          const response = await fetch(USER_API_URL, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) {
            console.error("Error al obtener usuario actual:", response.statusText);
            return null;
          }
          const userData = await response.json();
          currentUserId = userData._id;
          currentUserCoins = userData.coins;
          return userData;
        } catch (error) {
          console.error("Error al obtener usuario actual:", error);
          return null;
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

      displayModal: (show) => {
        htmlElements.donationModal.style.display = show ? "flex" : "none";
        htmlElements.modalMessage.textContent = "";
        if (show) {
            htmlElements.availableCoinsSpan.textContent = currentUserCoins;
            htmlElements.donationAmountInput.value = 10;
        }
      },
    };

    const handlers = {
      async handlePageLoad() {
        if (!storyId) {
          alert("No se proporcionó un ID de historia.");
          return;
        }

        const storyData = await methods.fetchStoryById(storyId);
        if (!storyData || !storyData.story) return;

        const story = storyData.story;

        console.log("Objeto de historia recibido por el frontend:", story);

        htmlElements.cover.src = story.coverImage || "/images/default-cover.jpg";
        htmlElements.title.textContent = story.title;
        htmlElements.author.textContent = story.author?.username || "Anónimo";

        if (story.author?.profileImage) {
          htmlElements.avatar.style.backgroundImage = `url(${story.author.profileImage})`;
        }

        htmlElements.tagsContainer.innerHTML = "";
        story.tags.forEach(tag => {
          const span = document.createElement("span");
          span.textContent = tag.name;
          htmlElements.tagsContainer.appendChild(span);
        });

        htmlElements.likes.textContent = `${story.likes || 0} me gusta`;

        const descLines = story.description?.split('\n') || [];
        htmlElements.synopsis1.textContent = descLines[0] || "";


        // Asignación de los valores a los elementos HTML
        if (htmlElements.status) {
          htmlElements.status.textContent = methods.mapStatus(story.status);
        }
        if (htmlElements.chapters) {
          htmlElements.chapters.textContent = story.chapterCount ?? 0;
        }
        
        // El campo 'language' no aparece en tu console.log, lo que sugiere que el backend no lo está enviando.
        // Asegúrate de que tu modelo y esquema de backend incluyan 'language'.
        if (htmlElements.language) {
          htmlElements.language.textContent = story.language || "Español";
        } else {
          console.error("Elemento 'story-language' no encontrado en el DOM.");
        }

        await methods.fetchCurrentUser();
      },

      handleReadNowClick() {
        if (storyId) {
          window.location.href = "/frontend/modules/stories/read-story/read_story.html?id=" + storyId;
        }
      },

      async handleDonateClick() {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Debes iniciar sesión para donar.");
          window.location.href = "/frontend/modules/auth/login/login.html";
          return;
        }

        await methods.fetchCurrentUser();
        methods.displayModal(true);
      },

      async handleConfirmDonation() {
        const amount = parseInt(htmlElements.donationAmountInput.value, 10);
        htmlElements.modalMessage.textContent = "";

        if (isNaN(amount) || amount <= 0) {
            htmlElements.modalMessage.textContent = "Por favor, ingresa una cantidad válida.";
            return;
        }

        if (currentUserId === currentStoryAuthorId) {
            htmlElements.modalMessage.textContent = "No puedes donar monedas a tu propia historia.";
            return;
        }

        if (currentUserCoins < amount) {
            const confirmBuy = confirm(`No tienes suficientes monedas. Te faltan ${amount - currentUserCoins} ⍟. ¿Deseas comprar más monedas?`);
            if (confirmBuy) {
                window.location.href = "/frontend/modules/coins/coins.html";
            }
            return;
        }

        const token = localStorage.getItem("token");
        const donationResult = await methods.fetchAPI(`${DONATION_API_BASE_URL}/${storyId}/donate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ amount }),
        });

        if (donationResult && !donationResult.error) {
          alert("¡Donación realizada con éxito! Gracias por tu apoyo.");
          methods.displayModal(false);
          await methods.fetchCurrentUser();
        } else {
          htmlElements.modalMessage.textContent = donationResult.error || "Error al procesar la donación.";
        }
      },

      handleCancelDonation() {
        methods.displayModal(false);
      },
    };

    const init = () => {
      handlers.handlePageLoad();
      htmlElements.readBtn.addEventListener("click", handlers.handleReadNowClick);
      htmlElements.donateBtn.addEventListener("click", handlers.handleDonateClick);
      htmlElements.confirmDonationBtn.addEventListener("click", handlers.handleConfirmDonation);
      htmlElements.cancelDonationBtn.addEventListener("click", handlers.handleCancelDonation);
    };

    return { init };
  })();

  StoryDetailApp.init();
})();