const chapterService = require("./chapter.service");
const { Story } = require("../../models/story.model"); // Para verificar permisos

/**
 * Controlador para crear un nuevo capítulo.
 */
async function createChapter(request, reply) {
  try {
    const { storyId } = request.params;
    const { userId } = request.user; // Obtenido del token

    // Verificación: Solo el autor de la historia puede añadir capítulos.
    const story = await Story.findById(storyId);
    if (!story) {
      return reply.code(404).send({ error: "Historia no encontrada." });
    }
    if (story.author.toString() !== userId) {
      return reply
        .code(403)
        .send({ error: "No tienes permiso para añadir capítulos a esta historia." });
    }

    const result = await chapterService.createChapter(storyId, request.body);

    if (result.error) {
      return reply.code(400).send(result);
    }

    reply.code(201).send(result);
  } catch (error) {
    console.error("Error en el controlador createChapter:", error);
    reply.code(500).send({ error: "Ocurrió un error inesperado al crear el capítulo." });
  }
}

/**
 * Controlador para obtener los capítulos de una historia.
 */
async function getChaptersByStory(request, reply) {
  try {
    const { storyId } = request.params;
    const result = await chapterService.getChaptersByStory(storyId);

    if (result.error) {
      return reply.code(404).send(result);
    }
    reply.send(result);
  } catch (error) {
    reply.code(500).send({ error: "Ocurrió un error al obtener los capítulos." });
  }
}

/**
 * Controlador para obtener un capítulo por su ID.
 */
async function getChapterById(request, reply) {
  try {
    const { id } = request.params;
    const result = await chapterService.getChapterById(id);

    if (result.error) {
      return reply.code(404).send(result);
    }
    reply.send(result);
  } catch (error) {
    reply.code(500).send({ error: "Ocurrió un error al obtener el capítulo." });
  }
}

/**
 * Controlador para actualizar un capítulo.
 */
async function updateChapter(request, reply) {
  try {
    const { id } = request.params;
    const { userId } = request.user;

    // Verificación de permisos
    const { chapter } = await chapterService.getChapterById(id);
    if (!chapter) {
      return reply.code(404).send({ error: "Capítulo no encontrado." });
    }
    if (chapter.story.author.toString() !== userId) {
      return reply.code(403).send({ error: "No tienes permiso para editar este capítulo." });
    }

    const result = await chapterService.updateChapter(id, request.body);

    if (result.error) {
      return reply.code(400).send(result);
    }
    reply.send(result);
  } catch (error) {
    reply.code(500).send({ error: "Ocurrió un error al actualizar el capítulo." });
  }
}

/**
 * Controlador para eliminar un capítulo.
 */
async function deleteChapter(request, reply) {
  try {
    const { id } = request.params;
    const { userId } = request.user;

    // Verificación de permisos (similar a update)
    const { chapter } = await chapterService.getChapterById(id);
    if (!chapter) {
      return reply.code(404).send({ error: "Capítulo no encontrado." });
    }
    if (chapter.story.author.toString() !== userId) {
      return reply.code(403).send({ error: "No tienes permiso para eliminar este capítulo." });
    }

    const result = await chapterService.deleteChapter(id);

    if (result.error) {
      return reply.code(404).send(result);
    }
    reply.send(result);
  } catch (error) {
    reply.code(500).send({ error: "Ocurrió un error al eliminar el capítulo." });
  }
}

module.exports = {
  createChapter,
  getChaptersByStory,
  getChapterById,
  updateChapter,
  deleteChapter,
};
