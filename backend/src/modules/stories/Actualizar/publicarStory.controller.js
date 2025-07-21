const Story = require("../story.model");

async function publishStory(request, reply) {
  try {
    const { storyId } = request.params;

    const updatedStory = await Story.findByIdAndUpdate(
      storyId,
      { status: "published" },
      { new: true }
    );

    if (!updatedStory) {
      return reply.status(404).send({ message: "Historia no encontrada" });
    }

    return reply.send({
      message: "Historia publicada con éxito",
      story: updatedStory
    });
  } catch (error) {
    console.error("Error al publicar historia:", error);
    return reply.status(500).send({ message: "Error del servidor" });
  }
}

module.exports = { publishStory };
