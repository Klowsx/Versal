// versal/backend/src/modules/stories/story.routes.js

const storyController = require("./story.controller");
const {
  createStorySchema,
  getStoryByIdSchema,
  getAllStoriesSchema,
  getAuthorStoriesSchema,
  updateStorySchema,
  deleteStorySchema,
} = require("./story.schema");

async function storyRoutes(fastify) {
  fastify.get("/", { schema: getAllStoriesSchema }, storyController.getAllStories);

  fastify.get("/:id", { schema: getStoryByIdSchema }, storyController.getStoryById);

  // --- Rutas Privadas ---
  fastify.register(async function (privateRoutes) {
    privateRoutes.addHook("onRequest", fastify.authenticate);

    // Crear una nueva historia
    privateRoutes.post("/", { schema: createStorySchema }, storyController.createStory);

    // Obtener historias del autor autenticado
    privateRoutes.get(
      "/me",
      { schema: getAuthorStoriesSchema },
      storyController.getStoriesByAuthor
    );

    // Actualizar una historia existente
    privateRoutes.patch("/:id", { schema: updateStorySchema }, storyController.updateStory);

    // Eliminar una historia
    privateRoutes.delete("/:id", { schema: deleteStorySchema }, storyController.deleteStory);
  });
}

module.exports = storyRoutes;
