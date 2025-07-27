(() => {
  const CoinsApp = (() => {
    const BASE_API_URL = "http://localhost:3000/api";

    const API_ENDPOINTS = {
      GET_PACKS: `${BASE_API_URL}/products/coin-packs`,
      CREATE_CHECKOUT: `${BASE_API_URL}/transactions/checkout/coin-pack`,
    };

    const htmlElements = {
      packsContainer: document.getElementById("coin-packs-container"),
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
          console.error(`Error en fetchAPI para ${url}:`, err);
          htmlElements.packsContainer.innerHTML =
            "<p>No se pudieron cargar los paquetes. Intenta recargar la página.</p>";
          return null;
        }
      },

      createPackCard(pack) {
        const card = document.createElement("div");
        card.className = "pack-card";

        card.dataset.stripePriceId = pack.stripePriceId;

        const price = (pack.coins / 20).toFixed(2);

        card.innerHTML = `
            <h3 class="name">${pack.name}</h3>
            <p class="description">${pack.description}</p>
            <p class="coins">
            <span class=monedita>⍟</span>
            ${pack.coins}</p>
            <p class="price">${price} USD</p>
            <button class="buy-btn">Comprar</button>
        `;
        return card;
      },
    };

    const handlers = {
      async loadCoinPacks() {
        const data = await methods.fetchAPI(API_ENDPOINTS.GET_PACKS);
        console.log("Datos de packs:", data);
        if (data && data.packs && data.packs.length > 0) {
          htmlElements.packsContainer.innerHTML = "";
          data.packs.forEach((pack) => {
            const card = methods.createPackCard(pack);
            htmlElements.packsContainer.appendChild(card);
          });
        } else {
          htmlElements.packsContainer.innerHTML =
            "<p>No hay paquetes de monedas disponibles en este momento.</p>";
        }
      },

      async handleBuyClick(event) {
        if (!event.target.classList.contains("buy-btn")) {
          return;
        }

        const buyButton = event.target;
        const card = buyButton.closest(".pack-card");
        const coinPackId = card.dataset.stripePriceId;

        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/frontend/modules/auth/login/login.html";
          return;
        }

        buyButton.textContent = "Procesando...";
        buyButton.disabled = true;

        const result = await methods.fetchAPI(API_ENDPOINTS.CREATE_CHECKOUT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ coinPackId }),
        });

        if (result && result.url) {
          window.location.href = result.url;
        } else {
          alert("No se pudo iniciar el proceso de pago. Por favor, intenta más tarde.");
          buyButton.textContent = "Comprar";
          buyButton.disabled = false;
        }
      },
    };

    const init = () => {
      handlers.loadCoinPacks();

      htmlElements.packsContainer.addEventListener("click", handlers.handleBuyClick);
    };

    return {
      init,
    };
  })();

  document.addEventListener("DOMContentLoaded", CoinsApp.init);
})();
