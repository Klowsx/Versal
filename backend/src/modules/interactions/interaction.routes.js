const interactionController = require("./interaction.controller");
const {
  addInteractionSchema,
  getInteractionsSchema,
  deleteInteractionSchema,
} = require("./interaction.schema");

async function interactionRoutes(fastify) {
  fastify.register(async function (privateRoutes) {
    privateRoutes.addHook("onRequest", fastify.authenticate);

    privateRoutes.post(
      "/stories/:id/interactions",
      { schema: addInteractionSchema },
      interactionController.addInteractionToContent
    );
    privateRoutes.post(
      "/chapters/:id/interactions",
      { schema: addInteractionSchema },
      interactionController.addInteractionToContent
    );

    privateRoutes.delete(
      "/interactions/:interactionId",
      { schema: deleteInteractionSchema },
      interactionController.deleteInteraction
    );
  });

  fastify.get(
    "/stories/:id/interactions",
    { schema: getInteractionsSchema },
    interactionController.getInteractions
  );
  fastify.get(
    "/chapters/:id/interactions",
    { schema: getInteractionsSchema },
    interactionController.getInteractions
  );
}

module.exports = interactionRoutes;
