(() => {
  const EditProfileModule = (() => {
    const API_BASE_URL = "http://localhost:3000/api/user";

    const elements = {
      form: document.getElementById("editProfileForm"),

      avatar: document.getElementById("avatar"),
      fullName: document.getElementById("fullName"),
      username: document.getElementById("username"),
      badge: document.getElementById("badge"),
      joinDate: document.getElementById("joinDate"),

      fileInput: document.getElementById("upload"),
      formFullName: document.getElementById("formFullName"),
      formUsername: document.getElementById("formUsername"),
      formEmail: document.getElementById("formEmail"),
      formBio: document.getElementById("formBio"),
      charCounter: document.getElementById("counter"),

      oldPassword: document.getElementById("oldPassword"),
      newPassword: document.getElementById("newPassword"),
      confirmPassword: document.getElementById("confirmPassword"),

      cancelBtn: document.querySelector(".btn.cancel"),
    };

    const methods = {
      loadAndPopulateUserData: async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            alert("Sesión no válida. Por favor, inicia sesión.");
            window.location.href = "/login.html";
            return;
          }

          const response = await fetch(`${API_BASE_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error("No se pudo cargar la información de tu perfil.");

          const user = await response.json();

          elements.avatar.src = user.profileImage || "../../../resources/profile.png";
          elements.fullName.textContent = user.fullName;
          elements.username.textContent = `@${user.username}`;
          elements.badge.textContent =
            user.subscription?.type === "premium" ? "💎 Premium" : "✨ Básico";
          if (user.createdAt) {
            const date = new Date(user.createdAt).toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
            });
            elements.joinDate.textContent = `Miembro desde ${date}`;
          }

          elements.formFullName.value = user.fullName;
          elements.formUsername.value = user.username;
          elements.formEmail.value = user.email;
          elements.formBio.value = user.bio || "";
          methods.updateCharCounter();
        } catch (error) {
          console.error("Error al cargar el perfil:", error);
          alert(error.message);
        }
      },

      previewImage: () => {
        const file = elements.fileInput.files[0];
        if (file) {
          elements.avatar.src = URL.createObjectURL(file);
        }
      },

      updateCharCounter: () => {
        if (elements.formBio && elements.charCounter) {
          elements.charCounter.textContent = `${elements.formBio.value.length}/200`;
        }
      },

      handleFormSubmit: async (event) => {
        event.preventDefault();
        const saveButton = event.target.querySelector(".btn.save");
        saveButton.disabled = true;
        saveButton.textContent = "Guardando...";

        try {
          const oldPass = elements.oldPassword.value;
          const newPass = elements.newPassword.value;
          if (oldPass && newPass) {
            await methods.submitPasswordChange(oldPass, newPass);
          }

          console.log("Intentando actualizar perfil");
          await methods.submitProfileUpdate();

          alert("Perfil actualizado correctamente.");

          window.location.href = "/frontend/modules/user/profile/profile.html";
        } catch (error) {
          console.error("Fallo el envío del formulario:", error);
        } finally {
          saveButton.disabled = false;
          saveButton.textContent = "Guardar Cambios";
        }
      },

      submitProfileUpdate: async () => {
        const formData = new FormData(elements.form);

        const file = elements.fileInput.files[0];

        if (!file || file.size === 0) {
          formData.delete("profileImage");
        }

        formData.delete("oldPassword");
        formData.delete("newPassword");
        formData.delete("confirmPassword");

        try {
          const response = await fetch(`${API_BASE_URL}/me`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
          });

          if (!response.ok) throw new Error("Error al actualizar la información del perfil.");
        } catch (error) {
          alert(`Error de perfil: ${error.message}`);
          throw error;
        }
      },

      submitPasswordChange: async (oldPassword, newPassword) => {
        if (newPassword !== elements.confirmPassword.value) {
          throw new Error("Las nuevas contraseñas no coinciden.");
        }

        try {
          const response = await fetch(`${API_BASE_URL}/me/password`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ oldPassword, newPassword }),
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "No se pudo cambiar la contraseña.");
        } catch (error) {
          alert(`Error de contraseña: ${error.message}`);
          throw error;
        }
      },
    };


    const init = () => {
      if (!elements.form) return;
      document.addEventListener("DOMContentLoaded", methods.loadAndPopulateUserData);
      elements.form.addEventListener("submit", methods.handleFormSubmit);
      elements.fileInput.addEventListener("change", methods.previewImage);
      elements.formBio.addEventListener("input", methods.updateCharCounter);
      elements.cancelBtn.addEventListener("click", () => window.history.back());
    };

    return { init };
  })();

  EditProfileModule.init();
})();
