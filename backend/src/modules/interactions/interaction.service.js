const Interaction = require("../../models/interaction.model");

// Función para añadir una interacción (like o comentario)
async function addInteractionToChapter({ chapterId, userId, interactionType, text }) {
  try {
    if (interactionType === "like") {
      const existingLike = await Interaction.findOne({
        contentId: chapterId,
        userId,
        interactionType: "like",
      });
      if (existingLike) {
        await existingLike.remove();
        return { status: "unliked" };
      } else {
        const like = await Interaction.create({ contentId: chapterId, userId, interactionType });
        return { status: "liked", like };
      }
    }

    if (interactionType === "comment") {
      if (!text) return { error: "El texto del comentario es requerido." };
      const comment = await Interaction.create({
        contentId: chapterId,
        userId,
        interactionType,
        text,
      });
      return { comment };
    }

    return { error: "Tipo de interacción inválido." };
  } catch (error) {
    return { error: `Error al añadir la interacción: ${error.message}` };
  }
}

// Función para obtener las interacciones (likes y comentarios) de un capítulo
async function getInteractionsForChapter(chapterId) {
  try {
    const interactions = await Interaction.find({ contentId: chapterId })
      .populate("userId", "username profileImage")
      .sort({ createdAt: "desc" });

    return {
      likesCount: interactions.filter((i) => i.interactionType === "like").length,
      comments: interactions.filter((i) => i.interactionType === "comment"),
    };
  } catch (error) {
    return { error: `Error al obtener las interacciones: ${error.message}` };
  }
}

// Función para eliminar una interacción
async function deleteInteraction({ interactionId, userId, userRole }) {
  try {
    const interaction = await Interaction.findById(interactionId);
    if (!interaction) {
      return { error: "Interaction not found." };
    }

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
  getInteractionsForChapter,
  addInteractionToChapter,
  deleteInteraction,
};
