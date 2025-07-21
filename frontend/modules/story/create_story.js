(() => {
  const StoryFormApp = (() => {
    const elements = {
      form: document.getElementById('storyForm'),
      addPersonajeBtn: document.getElementById('addPersonajeBtn'),
      personajesContainer: document.getElementById('personajesContainer'),
      startWritingBtn: document.getElementById('startWritingBtn'),
    };

    let personajeCount = 1;

    const methods = {
      addPersonajeInput: () => {
        personajeCount++;
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'personajePrincipales[]';
        input.placeholder = `Nombre del personaje ${personajeCount}`;
        elements.personajesContainer.appendChild(input);
      },

      resetPersonajes: () => {
        elements.personajesContainer.innerHTML =
          '<input type="text" name="personajePrincipales[]" placeholder="Nombre del personaje 1" />';
        personajeCount = 1;
      },

      buildStoryData: () => {
        const formData = new FormData(elements.form);
        const data = {
          title: formData.get('title'),
          descripcion: formData.get('descripcion'),
          coverImage: formData.get('coverImage'),
          personajePrincipales: [],
          categoria: formData.get('categoria'),
          audiencia: formData.get('audiencia'),
          etiquetas: [],
          idioma: formData.get('idioma'),
          derechos: formData.get('derechos'),
          clasificacion: formData.get('clasificacion') === 'on'
        };

        // Personajes
        formData.getAll('personajePrincipales[]').forEach(name => {
          if (name.trim()) {
            data.personajePrincipales.push({ name: name.trim() });
          }
        });

        // Etiquetas
        const etiquetasRaw = formData.get('etiquetas');
        if (etiquetasRaw) {
          data.etiquetas = etiquetasRaw
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        }

        return data;
      },

      submitForm: async (e) => {
        e.preventDefault();
        const storyData = methods.buildStoryData();

        try {
          const res = await fetch('/api/story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(storyData),
          });

          const result = await res.json();

          if (res.ok) {
            alert(result.message);
            elements.form.reset();
            methods.resetPersonajes();
          } else {
            alert('Error: ' + result.message);
          }
        } catch (error) {
          alert('Error al enviar la historia: ' + error.message);
        }
      },

      redirectToWrite: () => {
        window.location.href = '/frontend/modules/story/write_chapter.html';
      },
    };

    const init = () => {
      elements.addPersonajeBtn.addEventListener('click', methods.addPersonajeInput);
      elements.form.addEventListener('submit', methods.submitForm);
      elements.startWritingBtn.addEventListener('click', methods.redirectToWrite);
    };

    return { init };
  })();

  StoryFormApp.init();
})();
