(() => {
  const PremiumApp = (() => {
    const API_ENDPOINTS = {
      GET_PLANS: `http://localhost:3000/api/products/subscriptions`,
      CREATE_CHECKOUT: `http://localhost:3000/api/transactions/checkout/subscription`,
      GET_USER_STATUS: `http://localhost:3000/api/user/me`,
    };

    let state = {
      currentPlan: null,
    };

    const htmlElements = {
      planName: document.getElementById("plan-name"),
      planDescription: document.getElementById("plan-description"),
      planPrice: document.getElementById("plan-price-amount"),
      buyButton: document.getElementById("buy-button"),
      premiumHeader: document.querySelector(".premium-header"),
      premiumFooter: document.querySelector(".premium-footer"),
    };

    const methods = {
      // Fetch a la API
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
          if (htmlElements.buyButton) {
            htmlElements.buyButton.textContent = "Error al cargar";
            htmlElements.buyButton.disabled = true;
          }
          return null;
        }
      },

      // Renderizar detalles del plan
      renderPlanDetails(plan) {
        if (!plan) return;

        const price = "4.99";

        htmlElements.planName.textContent = plan.name;
        htmlElements.planDescription.textContent = plan.description;
        htmlElements.planPrice.textContent = `$${price}`;
        if (htmlElements.buyButton) {
          htmlElements.buyButton.disabled = false;
        }
      },

      // Renderizar estado Premium
      renderPremiumStatus() {
        htmlElements.premiumHeader.innerHTML = `
          <h1>💎 ¡Ya eres Premium!</h1>
          <p>Disfruta de tu experiencia sin anuncios y gracias por tu apoyo.</p>
        `;
        document.getElementById("plan-details").style.display = "none";

        htmlElements.premiumFooter.innerHTML = `
          <div class="status-box premium">
            <p>✔ Tu suscripción se encuentra activa.</p>
          </div>
        `;
      },
    };

    const handlers = {
      // Cargar el plan de suscripción
      async loadSubscriptionPlan() {
        if (htmlElements.buyButton) {
          htmlElements.buyButton.disabled = true;
        }
        const data = await methods.fetchAPI(API_ENDPOINTS.GET_PLANS);

        if (data && data.plans && data.plans.length > 0) {
          console.log("Planes de suscripción cargados:", data.plans);
          state.currentPlan = data.plans[0];
          methods.renderPlanDetails(state.currentPlan);
        }
      },

      // Manejar el clic en el botón de compra
      async handleBuyClick() {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/frontend/modules/auth/login/login.html";
          return;
        }

        if (!state.currentPlan) {
          alert("El plan no se ha cargado correctamente. Inténtalo de nuevo.");
          return;
        }

        htmlElements.buyButton.textContent = "Procesando...";
        htmlElements.buyButton.disabled = true;

        // Iniciar el proceso de pago
        const result = await methods.fetchAPI(API_ENDPOINTS.CREATE_CHECKOUT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ planId: state.currentPlan.stripePriceId }),
        });

        if (result && result.url) {
          window.location.href = result.url;
        } else {
          alert("No se pudo iniciar el proceso de pago. Por favor, intenta más tarde.");
          htmlElements.buyButton.textContent = "Obtener Premium";
          htmlElements.buyButton.disabled = false;
        }
      },

      // Verificar si el usuario es Premium
      async checkUserStatus() {
        const token = localStorage.getItem("token");
        if (!token) {
          return false;
        }

        const userData = await methods.fetchAPI(API_ENDPOINTS.GET_USER_STATUS, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userData && userData.isPremium) {
          methods.renderPremiumStatus();
          return true;
        }

        return false;
      },
    };

    const init = async () => {
      const isUserPremium = await handlers.checkUserStatus();

      if (!isUserPremium) {
        handlers.loadSubscriptionPlan();
        if (htmlElements.buyButton) {
          htmlElements.buyButton.addEventListener("click", handlers.handleBuyClick);
        }
      }
    };

    return {
      init,
    };
  })();

  document.addEventListener("DOMContentLoaded", PremiumApp.init);
})();
