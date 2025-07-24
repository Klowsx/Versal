(() => {
  const loadNavbar = async () => {
    const response = await fetch("/frontend/modules/main/navbar/navbar.html");
    const html = await response.text();
    document.getElementById("navbar-placeholder").innerHTML = html;

    await loadCategorias();
  };

  const loadCategorias = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/categorias");
      const categorias = await res.json();

      const container = document.getElementById("categorias-dropdown");
      container.innerHTML = "";

      categorias.forEach((cat) => {
        const a = document.createElement("a");
        a.href = `/categoria.html?id=${cat._id}`;
        a.textContent = cat.nombre;
        container.appendChild(a);
      });
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    }
  };

  document.addEventListener("DOMContentLoaded", loadNavbar);
})();
