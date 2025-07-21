const { publishStory } = require("./publicarStory.controller");

async function publicarStoryRoute(fastify, options) {
  fastify.patch("/", {
    handler: publishStory
  });
}

module.exports = publicarStoryRoute;
