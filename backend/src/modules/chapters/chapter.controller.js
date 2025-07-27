const fs = require("fs");
const util = require("util");
const path = require("path");
const { pipeline } = require("stream");
const pump = util.promisify(pipeline);

const chapterService = require("./chapter.service");
const { Story } = require("../../models/story.model");

// Controlador para crear un nuevo capítulo
async function createChapter(request, reply) {
  try {
    const { storyId } = request.params;
    const { userId } = request.user;

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

// Controlador para obtener los capítulos de una historia
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

// Controlador para obtener un capítulo por ID
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

// Controlador para actualizar un capítulo
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

async function uploadChapterImage(request, reply) {
  try {
    const { userId } = request.user; // Obtener el ID del usuario autenticado
    // Nota: Aquí podrías añadir una verificación si quieres que solo autores específicos
    // o aquellos con historias puedan subir imágenes, pero por ahora solo se requiere autenticación.

    const part = await request.file(); // Obtener la primera parte del archivo multipart

    if (!part) {
      return reply.code(400).send({ error: "No se encontró ningún archivo en la petición." });
    }

    const result = await chapterService.uploadChapterImage(part, request);

    if (result.error) {
      return reply.code(500).send({ error: result.error });
    }

    reply.code(200).send(result); // Devuelve la URL pública de la imagen
  } catch (error) {
    console.error("Error en el controlador uploadChapterImage:", error);
    reply.code(500).send({ error: "Ocurrió un error inesperado al subir la imagen del capítulo." });
  }
}

module.exports = {
  createChapter,
  getChaptersByStory,
  getChapterById,
  updateChapter,
  uploadChapterImage,
  deleteChapter,
};
