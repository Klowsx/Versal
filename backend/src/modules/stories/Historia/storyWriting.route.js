const { writeStory, getLatestDraft } = require("./storyWriting.controller");

async function storyWritingRoute(fastify, options) {
  fastify.post("/", {
    handler: writeStory,
  });
  fastify.get("/draft/:storyId", {
    handler: getLatestDraft
  });
}

module.exports = storyWritingRoute;
