const interactionService = require("./interaction.service");

async function addInteractionToContent(request, reply) {
  const { id } = request.params;
  const { onModel, interactionType, text } = request.body;
  const { userId } = request.user;

  const result = await interactionService.addInteraction({
    contentId: id,
    onModel,
    userId,
    interactionType,
    text,
  });

  if (result.error) {
    return reply.code(400).send({ message: result.error });
  }

  reply.code(201).send(result);
}

async function getInteractions(request, reply) {
  const { id } = request.params;
  const onModel = request.raw.url.includes("/stories/") ? "Story" : "Chapter";

  const result = await interactionService.getInteractionsForContent({ contentId: id, onModel });

  if (result.error) {
    return reply.code(404).send({ message: result.error });
  }

  reply.send(result);
}

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
  addInteractionToContent,
  getInteractions,
  deleteInteraction,
};
