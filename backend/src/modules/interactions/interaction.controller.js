const interactionService = require("./interaction.service");

// Añadir una interacción (like o comentario)
async function addInteractionToChapter(request, reply) {
  const { id: chapterId } = request.params;
  const { userId } = request.user;
  const { interactionType, text } = request.body;

  const result = await interactionService.addInteractionToChapter({
    chapterId,
    userId,
    interactionType,
    text,
  });

  if (result.error) return reply.code(400).send(result);
  reply.code(201).send(result);
}

// Obtener interacciones de un capítulo
async function getInteractionsForChapter(request, reply) {
  const { id: chapterId } = request.params;
  const result = await interactionService.getInteractionsForChapter(chapterId);

  if (result.error) return reply.code(404).send(result);
  reply.send(result);
}

// Borrar una interacción
async function deleteInteraction(request, reply) {
  const { interactionId } = request.params;
  const { userId, role } = request.user;

  const result = await interactionService.deleteInteraction({
    interactionId,
    userId,
    userRole: role,
  });

  if (result.error) {
    const statusCode = result.error.includes("Unauthorized") ? 403 : 404;
    return reply.code(statusCode).send({ message: result.error });
  }

  reply.send({ message: "Interaction deleted successfully." });
}

module.exports = {
  getInteractionsForChapter,
  addInteractionToChapter,
  deleteInteraction,
};
