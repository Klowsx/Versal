const mongoose = require("mongoose"); // Necesario para mongoose.Types.ObjectId
const Interaction = require("../../models/interaction.model");
const { Story } = require("../../models/story.model"); // Importar el modelo Story
const Chapter = require("../../models/chapter.model"); // Importar el modelo Chapter

/**
 * Función auxiliar para recalcular y actualizar el campo totalLikes de una historia.
 * @param {string} storyId - El ID de la historia a actualizar.
 */
async function updateStoryTotalLikes(storyId) {
  try {
    // Agregación para sumar los likes de todos los capítulos de una historia
    const totalLikesResult = await Interaction.aggregate([
      {
        $lookup: {
          from: "chapters", // Nombre de la colección de capítulos (plural por defecto de Mongoose)
          localField: "contentId", // Campo en la colección 'interactions' (es el chapterId)
          foreignField: "_id", // Campo en la colección 'chapters'
          as: "chapterInfo",
        },
      },
      {
        $unwind: "$chapterInfo", // Desestructura el array 'chapterInfo' para procesar cada capítulo
      },
      {
        $match: {
          "chapterInfo.story": new mongoose.Types.ObjectId(storyId), // Filtra por el ID de la historia
          interactionType: "like", // Solo cuenta las interacciones de tipo 'like'
        },
      },
      {
        $group: {
          _id: null, // Agrupa todos los resultados en un solo documento
          totalLikes: { $sum: 1 }, // Cuenta el número de 'likes' (cada like es un documento)
        },
      },
    ]);

    const newTotalLikes = totalLikesResult.length > 0 ? totalLikesResult[0].totalLikes : 0;

    // Actualiza el campo totalLikes en el modelo Story
    await Story.findByIdAndUpdate(storyId, { totalLikes: newTotalLikes });
    console.log(`Story ${storyId} totalLikes updated to ${newTotalLikes}`);
  } catch (error) {
    console.error(`Error updating totalLikes for story ${storyId}:`, error);
  }
}

// Función para añadir una interacción (like o comentario)
async function addInteractionToChapter({ chapterId, userId, interactionType, text }) {
  try {
    if (interactionType === "like") {
      const existingLike = await Interaction.findOne({
        contentId: chapterId,
        userId,
        interactionType: "like",
      });

      let storyId = null;
      // Obtener el ID de la historia a la que pertenece este capítulo
      const chapter = await Chapter.findById(chapterId);
      if (chapter && chapter.story) {
        // Asume que el modelo Chapter tiene un campo 'story'
        storyId = chapter.story;
      }

      if (existingLike) {
        await existingLike.deleteOne(); // Eliminar el like existente (es un "unlike")
        if (storyId) {
          await updateStoryTotalLikes(storyId); // Actualizar el total de likes de la historia
        }
        return { status: "unliked", message: "Me gusta quitado." };
      } else {
        const like = await Interaction.create({ contentId: chapterId, userId, interactionType }); // Crear un nuevo like
        if (storyId) {
          await updateStoryTotalLikes(storyId); // Actualizar el total de likes de la historia
        }
        return { status: "liked", like, message: "¡Me gusta!" };
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
      return { comment, message: "Comentario publicado." };
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

    return { interactions };
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

    const isLike = interaction.interactionType === "like";
    const chapterIdAffected = interaction.contentId; // El contentId es el chapterId en este caso

    await interaction.deleteOne(); // Eliminar la interacción

    if (isLike) {
      // Si la interacción eliminada era un like, actualiza el contador de likes de la historia
      const chapter = await Chapter.findById(chapterIdAffected);
      if (chapter && chapter.story) {
        // Asume que el modelo Chapter tiene un campo 'story'
        await updateStoryTotalLikes(chapter.story);
      }
    }
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
