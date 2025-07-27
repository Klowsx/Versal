(() => {
  const StoryFormModule = (() => {
    const elements = {
      form: document.getElementById('storyForm'),
      addCharacterBtn: document.getElementById('addCharacterBtn'),
      charactersContainer: document.getElementById('charactersContainer'),
      startWritingBtn: document.getElementById('startWritingBtn'),
      categorySelect: document.getElementById('category'),
    };

    let characterCount = 1;

    const methods = {
      loadCategories: async () => {
        try {
          const res = await fetch('http://localhost:3000/api/categories');
          if (!res.ok) throw new Error('No se pudo obtener las categorías');
          const { categories } = await res.json();

          elements.categorySelect.innerHTML = '<option disabled selected value="">Selecciona una categoría</option>';
          categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            elements.categorySelect.appendChild(option);
          });
        } catch (error) {
          console.error('Error cargando categorías:', error);
          elements.categorySelect.innerHTML = '<option disabled value="">Error al cargar categorías</option>';
          alert('⚠️ Error al cargar las categorías. Intenta recargar la página.');
        }
      },

      addCharacterInput: () => {
        characterCount++;

        const wrapper = document.createElement('div');
        wrapper.classList.add('character-input-wrapper');

        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'mainCharacters[]';
        input.placeholder = `Nombre del personaje ${characterCount}`;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.classList.add('delete-character-btn');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Eliminar personaje';

        deleteBtn.addEventListener('click', () => {
          wrapper.remove();
          characterCount--;
        });

        wrapper.appendChild(input);
        wrapper.appendChild(deleteBtn);
        elements.charactersContainer.appendChild(wrapper);
      },

      resetCharacterInputs: () => {
        elements.charactersContainer.innerHTML =
          '<input type="text" name="mainCharacters[]" placeholder="Nombre del personaje 1" />';
        characterCount = 1;
      },

      submitForm: async (event) => {
        event.preventDefault();
        const formData = new FormData(elements.form);

        // Procesar personajes
        const characters = formData.getAll('mainCharacters[]')
          .filter(name => name.trim())
          .map(name => ({ name }));
        formData.delete('mainCharacters[]');
        formData.append('characters', JSON.stringify(characters));

        // Procesar etiquetas
        const rawTags = formData.get('tags');
        if (rawTags) {
          formData.set('tags', JSON.stringify(rawTags.split(',').map(t => t.trim()).filter(Boolean)));
        }

        // Convertir checkbox a boolean
        formData.set('isAdultContent', elements.form.adultContent.checked);
        formData.delete('adultContent');

        try {
          const response = await fetch('http://localhost:3000/api/stories', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (response.ok) {
            alert('✅ ¡Historia creada con éxito!');
            window.location.href = '/frontend/modules/main/profile.html';
          } else {
            alert(`❌ Error al crear la historia: ${result.message || 'Revisa los campos.'}`);
          }
        } catch (error) {
          alert(`⚠️ Error inesperado al enviar la historia: ${error.message}`);
        }
      },

      redirectToChapterEditor: () => {
        window.location.href = '../write-story/write_story.html';
      },
    };

    const init = () => {
      methods.loadCategories();
      elements.addCharacterBtn.addEventListener('click', methods.addCharacterInput);
      elements.form.addEventListener('submit', methods.submitForm);
      elements.startWritingBtn.addEventListener('click', methods.redirectToChapterEditor);
    };

    return { init };
  })();

  StoryFormModule.init();
})();
