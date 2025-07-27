(() => {
  const StoryFormModule = (() => {
    const elements = {
      form: document.getElementById('storyForm'),
      addCharacterBtn: document.getElementById('addCharacterBtn'),
      charactersContainer: document.getElementById('charactersContainer'),
      startWritingBtn: document.getElementById('startWritingBtn'),
    };

    let characterCount = 1;

    const methods = {
      addCharacterInput: () => {
        characterCount++;
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'mainCharacters[]';
        input.placeholder = `Nombre del personaje ${characterCount}`;
        elements.charactersContainer.appendChild(input);
      },

      resetCharacterInputs: () => {
        elements.charactersContainer.innerHTML =
          '<input type="text" name="mainCharacters[]" placeholder="Nombre del personaje 1" />';
        characterCount = 1;
      },

      buildStoryPayload: () => {
        const formData = new FormData(elements.form);
        const story = {
          title: formData.get('title'),
          description: formData.get('description'),
          coverImage: formData.get('coverImage'),
          mainCharacters: [],
          category: formData.get('category'),
          audience: formData.get('audience'),
          tags: [],
          language: formData.get('language'),
          rights: formData.get('rights'),
          adultContent: formData.get('adultContent') === 'on',
        };

        // Extraer personajes
        formData.getAll('mainCharacters[]').forEach(name => {
          if (name.trim()) {
            story.mainCharacters.push({ name: name.trim() });
          }
        });

        // Extraer etiquetas
        const rawTags = formData.get('tags');
        if (rawTags) {
          story.tags = rawTags.split(',').map(tag => tag.trim()).filter(Boolean);
        }

        return story;
      },

      submitForm: async (event) => {
        event.preventDefault();
        const payload = methods.buildStoryPayload();

        try {
          const response = await fetch('/api/story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          const result = await response.json();

          if (response.ok) {
            alert(result.message);
            elements.form.reset();
            methods.resetCharacterInputs();
          } else {
            alert('Error: ' + result.message);
          }
        } catch (error) {
          alert('Error al enviar la historia: ' + error.message);
        }
      },

      redirectToChapterEditor: () => {
        window.location.href = '../write-story/write_story.html';
      },
    };

    const init = () => {
      elements.addCharacterBtn.addEventListener('click', methods.addCharacterInput);
      elements.form.addEventListener('submit', methods.submitForm);
      elements.startWritingBtn.addEventListener('click', methods.redirectToChapterEditor);
    };

    return { init };
  })();

  StoryFormModule.init();
})();
