const favoriteService = require("./favorite.service");

async function toggleFavorite(request, reply) {
  try {
    const { storyId } = request.params;
    const { userId } = request.user;
    const result = await favoriteService.toggleFavorite(userId, storyId);

    if (result.error) {
      return reply.code(500).send(result);
    }
    reply.send(result);
  } catch (error) {
    reply.code(500).send({ error: "Ocurrió un error inesperado." });
  }
}

async function getFavoriteStories(request, reply) {
  try {
    const { userId } = request.user;
    const result = await favoriteService.getFavoriteStoriesByUser(userId);

    if (result.error) {
      return reply.code(500).send(result);
    }
    reply.send(result);
  } catch (error) {
    reply.code(500).send({ error: "Ocurrió un error inesperado." });
  }
}

module.exports = {
  toggleFavorite,
  getFavoriteStories,
};
