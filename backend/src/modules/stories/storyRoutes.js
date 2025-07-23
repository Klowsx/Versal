const storyCreationRoutes = require("./Detalles/storyCreation.routes");
const storyWritingRoute = require("./Historia/storyWriting.route");
const publicarStoryRoute = require("./Actualizar/publicarStory.route")

async function storyRoutes(fastify, options){
    fastify.register(storyCreationRoutes),
    fastify.register(storyWritingRoute),
    fastify.register(publicarStoryRoute)
}

module.exports = storyRoutes;