const Interaction = require("../../models/interaction.model");

/**
 * Gestiona una interacción (like/unlike o comentario).
 */
async function addInteraction({ contentId, onModel, userId, interactionType, text }) {
  try {
    if (interactionType === "like") {
      const existingLike = await Interaction.findOne({
        contentId,
        userId,
        interactionType: "like",
      });
      if (existingLike) {
        await existingLike.remove();
        return { status: "unliked" };
      } else {
        const like = await Interaction.create({ contentId, onModel, userId, interactionType });
        return { status: "liked", like };
      }
    }

    // Lógica para 'comment': crea un nuevo comentario
    if (interactionType === "comment") {
      if (!text) return { error: "Comment text is required." };
      const comment = await Interaction.create({
        contentId,
        onModel,
        userId,
        interactionType,
        text,
      });
      return { comment };
    }

    return { error: "Invalid interaction type." };
  } catch (error) {
    return { error: `Failed to add interaction: ${error.message}` };
  }
}

/**
 * Obtiene todas las interacciones de un contenido específico.
 */
async function getInteractionsForContent({ contentId, onModel }) {
  try {
    const interactions = await Interaction.find({ contentId, onModel })
      .populate("userId", "username profileImage")
      .sort({ createdAt: "desc" }); // Ordenar por fecha

    const likes = interactions.filter((i) => i.interactionType === "like");
    const comments = interactions.filter((i) => i.interactionType === "comment");

    return {
      likesCount: likes.length,
      comments,
    };
  } catch (error) {
    return { error: `Failed to get interactions: ${error.message}` };
  }
}

/**
 * Elimina una interacción (like o comentario).
 */
async function deleteInteraction({ interactionId, userId, userRole }) {
  try {
    const interaction = await Interaction.findById(interactionId);
    if (!interaction) {
      return { error: "Interaction not found." };
    }

    // Solo el dueño o un admin pueden eliminar
    if (interaction.userId.toString() !== userId.toString() && userRole !== "admin") {
      return { error: "Unauthorized to delete this interaction." };
    }

    await interaction.remove();
    return { message: "Interaction deleted successfully." };
  } catch (error) {
    return { error: `Failed to delete interaction: ${error.message}` };
  }
}

module.exports = {
  addInteraction,
  getInteractionsForContent,
  deleteInteraction,
};
