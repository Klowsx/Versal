(() => {
  let currentFilter = "todas"; // Filtro por defecto

  const loadNavbar = async () => {
    try {
      const response = await fetch("/frontend/modules/main/navbar/navbar.html");
      const html = await response.text();
      const placeholder = document.getElementById("navbar-placeholder");

      if (!placeholder) {
        console.error("No se encontró el contenedor con id 'navbar-placeholder'");
        return;
      }

      placeholder.innerHTML = html;

      setupExplorarMenu();
      setupBusqueda();
    } catch (err) {
      console.error("Error al cargar el navbar:", err);
    }
  };

  const setupExplorarMenu = () => {
    const dropdown = document.getElementById("categorias-dropdown");

    if (!dropdown) {
      console.error("No se encontró el dropdown de categorías");
      return;
    }

    dropdown.innerHTML = `
      <a href="#" data-filter="todas">Todas</a>
      <a href="#" data-filter="categoria">Categorías</a>
      <a href="#" data-filter="etiqueta">Etiquetas</a>
    `;

    dropdown.querySelectorAll("a").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        currentFilter = el.dataset.filter;
        updateFilterIndicator(currentFilter);
      });
    });
  };

  const updateFilterIndicator = (filtro) => {
    let text = "";
    if (filtro !== "todas") {
      text = `Buscando por: ${filtro}`;
    }

    let existing = document.getElementById("filter-indicator");

    if (!existing) {
      existing = document.createElement("div");
      existing.id = "filter-indicator";
      existing.className = "filter-indicator";
      document.querySelector(".search-container").appendChild(existing);
    }

    existing.textContent = text;
  };

  const setupBusqueda = () => {
    const input = document.querySelector(".search-container input");

    if (!input) {
      console.error("No se encontró el input de búsqueda");
      return;
    }

    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        const query = input.value.trim();
        if (!query) return;

        let url = "/api/stories";

        if (currentFilter === "categoria") {
          url += `?categoria=${encodeURIComponent(query)}`;
        } else if (currentFilter === "etiqueta") {
          url += `?etiqueta=${encodeURIComponent(query)}`;
        } else {
          url += `?q=${encodeURIComponent(query)}`;
        }

        // Fetch de prueba
        fetch(url)
          .then((res) => res.json())
          .then((data) => {
            console.log("Resultados:", data);
            // TODO: Renderizar o redirigir resultados
          })
          .catch((err) => console.error("Error al buscar historias:", err));
      }
    });
  };

  document.addEventListener("DOMContentLoaded", loadNavbar);
})();
