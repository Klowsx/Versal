const Favorite = require("../../models/favorite.model");

async function toggleFavorite(userId, storyId) {
  try {
    const existingFavorite = await Favorite.findOne({ userId, storyId });

    if (existingFavorite) {
      await Favorite.deleteOne({ _id: existingFavorite._id });
      return { status: "unfavorited" };
    } else {
      await Favorite.create({ userId, storyId });
      return { status: "favorited" };
    }
  } catch (error) {
    console.error("Error en toggleFavorite:", error);
    return { error: "Ocurrió un error al gestionar los favoritos." };
  }
}

async function getFavoriteStoriesByUser(userId) {
  try {
    const favorites = await Favorite.find({ userId })
      .populate({
        path: "storyId",
        model: "Story",
        populate: {
          path: "author",
          model: "User",
          select: "username profileImage",
        },
      })
      .lean();

    const stories = favorites.map((fav) => fav.storyId);

    return { stories };
  } catch (error) {
    console.error("Error en getFavoriteStoriesByUser:", error);
    return { error: "Ocurrió un error al obtener las historias favoritas." };
  }
}

module.exports = {
  toggleFavorite,
  getFavoriteStoriesByUser,
};
