(() => {
  const ChapterEditorModule = (() => {
    const API_BASE_URL = "http://localhost:3000/api";

    const state = {
      chapters: [],
      currentChapterIndex: 0,
      storyId: new URLSearchParams(window.location.search).get("storyId"),
    };

    const elements = {
      editor: document.getElementById("editor"),
      titleInput: document.getElementById("title-input"),
      chapterList: document.querySelector(".chapter-list"),
      wordCount: document.getElementById("wordCount"),
      chapterStatus: document.getElementById("chapter-status"),
      newChapterBtn: document.querySelector(".new-chapter"),
      saveBtn: document.querySelector(".save"),
      publishBtn: document.querySelector(".publish"),
      toolbarButtons: document.querySelectorAll(".toolbar button[data-cmd]"),
      insertImageBtn: document.getElementById("insert-image-btn"),
      insertVideoBtn: document.getElementById("insert-video-btn"),
      stats: {
        total: document.getElementById("chapter-count"),
        published: document.getElementById("published-count"),
        words: document.getElementById("total-words"),
      },
    };

    const methods = {
      showNotification: (message, isError = false) => {
        console.log("Notificación intentada:", message, "Es error:", isError);
        const notification = document.createElement("div");
        notification.className = `editor-notification ${isError ? "error" : ""}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.classList.add("show");
        }, 10);
        setTimeout(() => {
          notification.classList.remove("show");
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 500);
        }, 3000);
      },

      loadChapters: async () => {
        if (!state.storyId) {
          alert("Error: No se ha encontrado un ID de historia en la URL.");
          return;
        }
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${API_BASE_URL}/stories/${state.storyId}/chapters`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("No se pudieron cargar los capítulos.");
          const data = await response.json();
          if (data.chapters && data.chapters.length > 0) {
            state.chapters = data.chapters;
          } else {
            state.chapters.push({
              _id: null,
              title: "Capítulo 1",
              content: "Comienza a escribir...",
              status: "draft",
              chapterNumber: 1,
            });
          }
          methods.renderChapterList();
          methods.renderChapter(0);
          methods.updateStats();
        } catch (error) {
          console.error("Error al cargar capítulos:", error);
        }
      },

      saveOrUpdateChapter: async (options = { showNotification: true }) => {
        methods.saveCurrentChapter();
        const chapterData = state.chapters[state.currentChapterIndex];

        if (elements.editor.innerText.trim() === "" || chapterData.title.trim() === "") {
          alert("El capítulo debe tener un título y contenido para poder guardarse.");
          return;
        }

        elements.saveBtn.textContent = "Guardando...";
        elements.saveBtn.disabled = true;

        const token = localStorage.getItem("token");
        const isNewChapter = !chapterData._id;
        const url = isNewChapter
          ? `${API_BASE_URL}/stories/${state.storyId}/chapters`
          : `${API_BASE_URL}/chapters/${chapterData._id}`;
        const method = isNewChapter ? "POST" : "PATCH";
        const body = {
          title: chapterData.title,
          content: chapterData.content,
          status: chapterData.status,
          chapterNumber: chapterData.chapterNumber,
        };

        try {
          const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.message || "La petición al servidor falló.");
          }
          const savedData = await response.json();
          console.log("Respuesta del servidor (savedData):", savedData);
          console.log("¿Es nuevo capítulo?", isNewChapter);

          if (isNewChapter) {
            console.log("ID recibido para nuevo capítulo:", savedData.chapter?._id);
            state.chapters[state.currentChapterIndex]._id = savedData.chapter._id;
            if (options.showNotification) {
              console.log("Mostrando notificación de capítulo creado.");
              methods.showNotification("Capítulo creado ✓");
            }
          } else {
            if (options.showNotification) {
              console.log("Mostrando notificación de capítulo guardado.");
              methods.showNotification("Capítulo guardado ✓");
            }
          }

          if (options.redirectTo) {
            // Un pequeño retraso para que la notificación sea visible, si se muestra.
            setTimeout(
              () => {
                window.location.href = options.redirectTo;
              },
              options.showNotification ? 1000 : 0
            ); // Espera 1 segundo si hay notificación
          }
        } catch (error) {
          console.error("Error capturado en saveOrUpdateChapter:", error);
          methods.showNotification("Error al guardar", true);
        } finally {
          elements.saveBtn.textContent = "Guardar";
          elements.saveBtn.disabled = false;
        }
      },

      deleteChapter: async (chapterId) => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("No se pudo eliminar el capítulo.");

          methods.showNotification("Capítulo eliminado correctamente.");
          await methods.loadChapters();
        } catch (error) {
          methods.showNotification("Error al eliminar", true);
          console.error("Error al eliminar capítulo:", error);
        }
      },

      updateStats: () => {
        elements.stats.total.textContent = state.chapters.length;
        elements.stats.published.textContent = state.chapters.filter(
          (c) => c.status === "published"
        ).length;
        const totalWords = state.chapters.reduce((sum, ch) => {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = ch.content || "";
          return sum + (tempDiv.innerText || "").trim().split(/\s+/).filter(Boolean).length;
        }, 0);
        elements.stats.words.textContent = totalWords;
      },

      updateWordCount: () => {
        const count = elements.editor.innerText.trim().split(/\s+/).filter(Boolean).length;
        elements.wordCount.textContent = count;
      },

      syncChapterListItem: (index) => {
        const li = elements.chapterList.children[index];
        if (li) {
          const titleLabel = li.querySelector(".chapter-title-label");
          const chapterTitle = state.chapters[index].title.trim();
          titleLabel.textContent = chapterTitle ? `- ${chapterTitle}` : "- Sin título";
        }
      },

      renderChapterList: () => {
        elements.chapterList.innerHTML = "";
        state.chapters.forEach((chap, index) => {
          const li = document.createElement("li");
          li.className = "chapter";
          li.innerHTML = `Capítulo ${index + 1} <span class="chapter-title-label"></span>`;
          elements.chapterList.appendChild(li);
          li.addEventListener("click", () => methods.renderChapter(index));
          li.addEventListener("dblclick", (e) => methods.handleChapterMenu(e, index));
          methods.syncChapterListItem(index);
        });
      },

      renderChapter: (index) => {
        if (!state.chapters[index]) {
          // Si el índice no existe (ej. al borrar)
          if (state.chapters.length > 0) methods.renderChapter(0); // Renderiza el primero
          return;
        }
        state.currentChapterIndex = index;
        const chap = state.chapters[index];
        elements.titleInput.value = chap.title;
        elements.editor.innerHTML = chap.content;
        elements.chapterStatus.textContent = chap.status === "draft" ? "Borrador" : "Publicado";
        Array.from(elements.chapterList.children).forEach((el, i) => {
          el.classList.toggle("active", i === index);
        });
        methods.updateWordCount();
        methods.updateToolbar();
      },

      saveCurrentChapter: () => {
        const index = state.currentChapterIndex;
        if (index < 0 || index >= state.chapters.length) return;
        const chap = state.chapters[index];
        chap.title = elements.titleInput.value;
        chap.content = elements.editor.innerHTML;
        methods.syncChapterListItem(index);
        methods.updateWordCount();
        methods.updateStats();
      },

      updateToolbar: () => {
        elements.toolbarButtons.forEach((btn) => {
          const cmd = btn.dataset.cmd;
          try {
            btn.classList.toggle("active", document.queryCommandState(cmd));
          } catch (e) {}
        });
      },

      handleChapterMenu: (e, index) => {
        e.preventDefault();
        e.stopPropagation();
        const existingMenu = document.querySelector(".popup-menu");
        if (existingMenu) existingMenu.remove();

        const rect = e.currentTarget.getBoundingClientRect();
        const menu = document.createElement("div");
        menu.className = "popup-menu";
        menu.style.top = `${rect.bottom + window.scrollY}px`;
        menu.style.left = `${rect.left + window.scrollX}px`;
        const chapterToUpdate = state.chapters[index];
        const currentStatus = chapterToUpdate.status;

        menu.innerHTML = `<button data-act="status">${
          currentStatus === "draft" ? "Marcar como Publicado" : "Marcar como Borrador"
        }</button><button data-act="eliminar">Eliminar capítulo</button>`;
        document.body.appendChild(menu);

        menu.addEventListener("click", async (evt) => {
          const act = evt.target.dataset.act;
          menu.remove();

          if (act === "status") {
            chapterToUpdate.status = currentStatus === "draft" ? "published" : "draft";
            state.currentChapterIndex = index; // Aseguramos el índice correcto
            await methods.saveOrUpdateChapter();
            methods.renderChapter(index);
            methods.updateStats();
          } else if (act === "eliminar") {
            // ¡NUEVA VALIDACIÓN DE BORRADO!
            if (!chapterToUpdate._id) {
              // Si no tiene ID, solo existe en el frontend
              state.chapters.splice(index, 1);
              methods.renderChapterList();
              methods.renderChapter(
                state.currentChapterIndex > 0 ? state.currentChapterIndex - 1 : 0
              );
              methods.updateStats();
              return;
            }

            // Si sí tiene ID, procedemos con el borrado en el backend
            if (
              confirm(`¿Seguro de eliminar "${chapterToUpdate.title || `Capítulo ${index + 1}`}"?`)
            ) {
              if (state.chapters.length <= 1) {
                alert("No puedes eliminar el único capítulo de la historia.");
                return;
              }
              await methods.deleteChapter(chapterToUpdate._id);
            }
          }
        });

        setTimeout(
          () => document.addEventListener("click", () => menu.remove(), { once: true }),
          0
        );
      },

      setupEventListeners: () => {
        elements.saveBtn.addEventListener("click", () => {
          methods.saveOrUpdateChapter({
            showNotification: true,
            redirectTo: `../create-story/mystory.html`,
          });
        });

        elements.newChapterBtn.addEventListener("click", () => {
          methods.saveCurrentChapter();
          const maxChapterNumber = state.chapters.reduce(
            (max, chap) => Math.max(max, chap.chapterNumber),
            0
          );
          const newChapterNumber = maxChapterNumber + 1;

          const newChapter = {
            _id: null,
            title: `Capítulo ${newChapterNumber}`,
            content: "",
            status: "draft",
            chapterNumber: newChapterNumber,
          };
          state.chapters.push(newChapter);

          const newIndex = state.chapters.length - 1;
          methods.renderChapterList();
          methods.renderChapter(newIndex);
          elements.titleInput.focus();
        });

        elements.publishBtn.addEventListener("click", async () => {
          methods.saveCurrentChapter();
          if (elements.editor.innerText.trim() === "" || elements.titleInput.value.trim() === "") {
            alert("No puedes publicar un capítulo sin título o contenido.");
            return;
          }
          const chapter = state.chapters[state.currentChapterIndex];
          chapter.status = "published";
          await methods.saveOrUpdateChapter();
          elements.chapterStatus.textContent = "Publicado";
          methods.updateStats();
        });

        elements.titleInput.addEventListener("input", methods.saveCurrentChapter);
        elements.editor.addEventListener("input", methods.saveCurrentChapter);
        elements.editor.addEventListener("keyup", methods.updateToolbar);
        elements.editor.addEventListener("mouseup", methods.updateToolbar);
        document.addEventListener("selectionchange", () => {
          if (document.activeElement === elements.editor) methods.updateToolbar();
        });
        elements.toolbarButtons.forEach((btn) => {
          btn.addEventListener("click", () => {
            document.execCommand(btn.dataset.cmd, false, btn.dataset.value || null);
            elements.editor.focus();
            methods.updateToolbar();
            methods.saveCurrentChapter();
          });
        });
        elements.insertImageBtn.addEventListener("click", () => {
          const fileInput = document.createElement("input");
          fileInput.type = "file";
          fileInput.accept = "image/*";
          fileInput.onchange = () => {
            const file = fileInput.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                const imageHTML = `<img src="${reader.result}" style="max-width: 50%; height: auto; display: block; margin: 10px auto; border-radius: 8px;" />`;
                document.execCommand("insertHTML", false, `<br>${imageHTML}<br>`);
                methods.saveCurrentChapter();
              };
              reader.readAsDataURL(file);
            }
          };
          fileInput.click();
        });
        elements.insertVideoBtn.addEventListener("click", () => {
          const url = prompt("Pega la URL del video de YouTube:");
          if (url) {
            let embedUrl = url.replace("watch?v=", "embed/");
            const iframe = `<br><iframe src="${embedUrl}" width="100%" height="315" frameborder="0" allowfullscreen></iframe><br>`;
            document.execCommand("insertHTML", false, iframe);
            methods.saveCurrentChapter();
          }
        });
      },
    };

    const init = () => {
      document.addEventListener("DOMContentLoaded", () => {
        methods.setupEventListeners();
        methods.loadChapters();
      });
    };

    return { init };
  })();

  ChapterEditorModule.init();
})();
