const { createStory } = require("./storyCreation.controller");

async function storyCreationRoutes(fastify, options) {
  fastify.post("/", {
    handler: createStory,
  });
}

module.exports = storyCreationRoutes;
