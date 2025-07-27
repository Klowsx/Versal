const storyService = require("./story.service");

// Controlador para crear una nueva historia
async function createStory(request, reply) {
  try {
    const { userId } = request.user;
    const result = await storyService.createStory({ ...request.body, authorId: userId });

    if (result.error) {
      return reply.code(400).send({ error: result.error });
    }

    reply.code(201).send(result);
  } catch (error) {
    console.error("Error en el controlador createStory:", error);
    reply.code(500).send({ error: "Ocurrió un error inesperado al crear la historia." });
  }
}

// Controlador para obtener una historia por ID
async function getStoryById(request, reply) {
  try {
    const { id } = request.params;
    const result = await storyService.getStoryById(id);

    if (result.error) {
      return reply.code(404).send({ error: "Historia no encontrada." });
    }

    reply.send(result);
  } catch (error) {
    console.error("Error en el controlador getStoryById:", error);
    reply.code(500).send({ error: "Ocurrió un error inesperado al obtener la historia." });
  }
}

// Controlador para obtener todas las historias publicadas
async function getAllStories(request, reply) {
  try {
    const filters = request.query;
    const result = await storyService.getAllStories(filters);

    if (result.error) {
      return reply.code(500).send({ error: result.error });
    }

    reply.send(result);
  } catch (error) {
    console.error("Error en el controlador getAllStories:", error);
    reply.code(500).send({ error: "Ocurrió un error inesperado al obtener las historias." });
  }
}

// Controlador para obtener las historias de un autor específico
async function getStoriesByAuthor(request, reply) {
  try {
    const { userId } = request.user;
    const result = await storyService.getStoriesByAuthor(userId);

    if (result.error) {
      return reply.code(500).send({ error: result.error });
    }

    reply.send(result);
  } catch (error) {
    console.error("Error en el controlador getStoriesByAuthor:", error);
    reply.code(500).send({ error: "Ocurrió un error inesperado al obtener tus historias." });
  }
}

// Controlador para actualizar una historia
async function updateStory(request, reply) {
  try {
    const { id } = request.params;
    const { userId } = request.user;

    const { story: existingStory } = await storyService.getStoryById(id);
    if (!existingStory) {
      return reply.code(404).send({ error: "Historia no encontrada." });
    }
    if (existingStory.author._id.toString() !== userId.toString()) {
      return reply.code(403).send({ error: "No tienes permiso para editar esta historia." });
    }

    const result = await storyService.updateStory(id, request.body);

    if (result.error) {
      return reply.code(400).send({ error: result.error });
    }

    reply.send(result);
  } catch (error) {
    console.error("Error en el controlador updateStory:", error);
    reply.code(500).send({ error: "Ocurrió un error inesperado al actualizar la historia." });
  }
}

//Eliminar una historia
async function deleteStory(request, reply) {
  try {
    const { id } = request.params;
    const { userId } = request.user;

    const { story: existingStory } = await storyService.getStoryById(id);
    if (!existingStory) {
      return reply.code(404).send({ error: "Historia no encontrada." });
    }
    if (existingStory.author._id.toString() !== userId.toString()) {
      return reply.code(403).send({ error: "No tienes permiso para eliminar esta historia." });
    }
    const result = await storyService.deleteStory(id);
    console.log("Result:", result);

    if (result.error) {
      return reply.code(500).send({ error: result.error });
    }

    reply.send({ message: "Historia eliminada exitosamente." });
  } catch (error) {
    console.error("Error en el controlador deleteStory:", error);
    reply.code(500).send({ error: "Ocurrió un error inesperado al eliminar la historia." });
  }
}

// Controlador para obtener historias por categoría
async function getStoriesByCategory(request, reply) {
  try {
    const { categoryName } = request.params;
    const result = await storyService.getStoriesByCategory(categoryName);
    if (result.error) {
      return reply.code(500).send(result);
    }
    reply.send(result);
  } catch (error) {
    reply.code(500).send({ error: "Ocurrió un error inesperado." });
  }
}

// Controlador para obtener historias por etiqueta
async function getStoriesByTag(request, reply) {
  try {
    const { tagName } = request.params;
    const result = await storyService.getStoriesByTag(tagName);
    if (result.error) {
      return reply.code(500).send(result);
    }
    reply.send(result);
  } catch (error) {
    reply.code(500).send({ error: "Ocurrió un error inesperado." });
  }
}

module.exports = {
  createStory,
  getStoryById,
  getAllStories,
  getStoriesByAuthor,
  updateStory,
  deleteStory,
  getStoriesByCategory,
  getStoriesByTag,
};
