const chapterController = require("./chapter.controller");
const {
  createChapterSchema,
  getChaptersByStorySchema,
  getChapterByIdSchema,
  updateChapterSchema,
  deleteChapterSchema,
} = require("./chapter.schema");

async function chapterRoutes(fastify) {
  // --- Rutas Públicas ---
  // Obtener capítulos de una historia
  fastify.get(
    "/stories/:storyId/chapters",
    { schema: getChaptersByStorySchema },
    chapterController.getChaptersByStory
  );

  // Obtener un capítulo por ID
  fastify.get("/chapters/:id", { schema: getChapterByIdSchema }, chapterController.getChapterById);

  // --- Rutas Privadas ---
  fastify.register(async function (privateRoutes) {
    privateRoutes.addHook("onRequest", fastify.authenticate);

    // Crear un nuevo capítulo
    privateRoutes.post(
      "/stories/:storyId/chapters",
      { schema: createChapterSchema },
      chapterController.createChapter
    );

    // Actualizar un capítulo
    privateRoutes.patch(
      "/chapters/:id",
      { schema: updateChapterSchema },
      chapterController.updateChapter
    );

    // Eliminar un capítulo
    privateRoutes.delete(
      "/chapters/:id",
      { schema: deleteChapterSchema },
      chapterController.deleteChapter
    );
  });
}

module.exports = chapterRoutes;
