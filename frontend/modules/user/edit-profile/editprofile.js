document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("editProfileForm");
  if (!form) {
    console.error("No se encontró el formulario con id editProfileForm");
    return;
  }

  const fileInput = document.getElementById("upload"); // input type=file
  const avatarImg = document.getElementById("avatar");

  // Mostrar preview de imagen seleccionada
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      avatarImg.src = URL.createObjectURL(file);
    }
  });

  // Enviar formulario para actualizar perfil
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    try {
      const res = await fetch("http://localhost:3000/api/users/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          // NO pongas Content-Type si usas FormData
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Error al actualizar perfil");

      alert("Perfil actualizado correctamente");
      // Opcional: recarga o redirección
      // window.location.href = "/perfil";
    } catch (err) {
      console.error(err);
      alert("Error al actualizar perfil");
    }
  });

  // Opcional: lógica para contador de caracteres en biografía
  const bioTextarea = form.querySelector("textarea[name='biografia']");
  const counter = document.getElementById("counter");
  if (bioTextarea && counter) {
    bioTextarea.addEventListener("input", () => {
      counter.textContent = `${bioTextarea.value.length}/200`;
    });
  }

  // Botón cancelar (ejemplo para limpiar o volver atrás)
  const cancelBtn = form.querySelector(".btn.cancel");
  cancelBtn.addEventListener("click", () => {
    // Por ejemplo, recarga la página o redirige
    window.location.href = "/perfil";
  });
});
