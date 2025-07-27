(() => {
  const ChapterEditorModule = (() => {
    // --------------------------------------------------
    // 1. STATE & ELEMENTS (Private variables)
    // --------------------------------------------------
    const state = {
      chapters: [{ title: "Capítulo 1", content: "Comienza a escribir tu historia aquí...", status: "Borrador" }],
      currentChapterIndex: 0,
    };

    const elements = {
      editor: document.getElementById("editor"),
      titleInput: document.getElementById("title-input"),
      chapterList: document.querySelector(".chapter-list"),
      wordCount: document.getElementById("wordCount"),
      chapterStatus: document.getElementById("chapter-status"),
      newChapterBtn: document.querySelector(".new-chapter"),
      toolbarButtons: document.querySelectorAll(".toolbar button[data-cmd]"),
      insertImageBtn: document.getElementById("insert-image-btn"),
      insertVideoBtn: document.getElementById("insert-video-btn"),
      stats: {
        total: document.getElementById("chapter-count"),
        published: document.getElementById("published-count"),
        words: document.getElementById("total-words"),
      },
    };

    // --------------------------------------------------
    // 2. METHODS (Private functions)
    // --------------------------------------------------
    const methods = {
      updateStats: () => {
        elements.stats.total.textContent = state.chapters.length;
        elements.stats.published.textContent = state.chapters.filter(c => c.status === "Publicado").length;
        const totalWords = state.chapters.reduce((sum, ch) => {
            const tempDiv = document.createElement('div');
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
        elements.chapterList.innerHTML = '';
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
        if (index < 0 || index >= state.chapters.length) return;
        state.currentChapterIndex = index;
        const chap = state.chapters[index];
        elements.titleInput.value = chap.title;
        elements.editor.innerHTML = chap.content;
        elements.chapterStatus.textContent = chap.status;
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
        elements.toolbarButtons.forEach(btn => {
            const cmd = btn.dataset.cmd;
            btn.classList.toggle('active', document.queryCommandState(cmd));
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
        const currentStatus = state.chapters[index].status;

        menu.innerHTML = `<button data-act="status">${currentStatus === "Borrador" ? "Marcar como Publicado" : "Marcar como Borrador"}</button><button data-act="eliminar">Eliminar capítulo</button>`;
        document.body.appendChild(menu);

        menu.addEventListener("click", (evt) => {
            const act = evt.target.dataset.act;
            if (act === "status") {
                state.chapters[index].status = currentStatus === "Borrador" ? "Publicado" : "Borrador";
                if (index === state.currentChapterIndex) {
                    elements.chapterStatus.textContent = state.chapters[index].status;
                }
            } else if (act === "eliminar") {
                if (confirm(`¿Seguro de eliminar el "${state.chapters[index].title || `Capítulo ${index + 1}`}"?`)) {
                    state.chapters.splice(index, 1);
                    if (state.chapters.length === 0) {
                        state.chapters.push({ title: "Capítulo 1", content: "", status: "Borrador" });
                    }
                    methods.renderChapterList();
                    const newIndex = state.currentChapterIndex >= state.chapters.length ? state.chapters.length - 1 : state.currentChapterIndex;
                    methods.renderChapter(newIndex);
                }
            }
            methods.updateStats();
            menu.remove();
        });

        setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
      },

      setupEventListeners: () => {
        elements.titleInput.addEventListener("input", methods.saveCurrentChapter);
        elements.editor.addEventListener("input", methods.saveCurrentChapter);
        
        elements.editor.addEventListener('keyup', methods.updateToolbar);
        elements.editor.addEventListener('mouseup', methods.updateToolbar);
        document.addEventListener('selectionchange', () => {
            if (document.activeElement === elements.editor) {
                methods.updateToolbar();
            }
        });

        elements.newChapterBtn.addEventListener("click", () => {
            methods.saveCurrentChapter();
            const newIndex = state.chapters.length;
            state.chapters.push({ title: `Capítulo ${newIndex + 1}`, content: "", status: "Borrador" });
            methods.renderChapterList();
            methods.renderChapter(newIndex);
            methods.updateStats();
        });

        elements.toolbarButtons.forEach(btn => {
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
                        // AQUÍ ESTÁ EL CAMBIO: El max-width ahora es del 50%
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
            const url = prompt("Pega la URL del video de YouTube o Vimeo:");
            if (url) {
                let embedUrl = url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/").replace("vimeo.com/", "player.vimeo.com/video/");
                const iframe = `<br><iframe src="${embedUrl}" width="100%" height="315" frameborder="0" allowfullscreen></iframe><br>`;
                document.execCommand("insertHTML", false, iframe);
                methods.saveCurrentChapter();
            }
        });
      }
    };

    // --------------------------------------------------
    // 3. PUBLIC INTERFACE (Initialization)
    // --------------------------------------------------
    const init = () => {
      document.addEventListener('DOMContentLoaded', () => {
          methods.setupEventListeners();
          methods.renderChapterList();
          methods.renderChapter(0);
          methods.updateStats();
      });
    };

    return { init };
  })();

  ChapterEditorModule.init();
})();