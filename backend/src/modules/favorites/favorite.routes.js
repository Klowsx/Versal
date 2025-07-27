const favoriteController = require("./favorite.controller");
// Aquí irían los esquemas si los creas.

async function favoriteRoutes(fastify) {
  fastify.register(async function (privateRoutes) {
    privateRoutes.addHook("onRequest", fastify.authenticate);

    // Ruta para obtener la lista de historias favoritas del usuario
    privateRoutes.get("/me/favorites", favoriteController.getFavoriteStories);

    // Ruta para añadir/quitar una historia de favoritos
    privateRoutes.post("/stories/:storyId/favorite", favoriteController.toggleFavorite);
  });
}

module.exports = favoriteRoutes;
