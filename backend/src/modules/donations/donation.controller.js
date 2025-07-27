const donationService = require("./donation.service");

async function makeDonation(request, reply) {
  try {
    const { userId: donatorId } = request.user;
    const { storyId } = request.params;
    const { amount, message } = request.body;

    const result = await donationService.makeDonation(donatorId, storyId, amount, message);

    if (result.error) {
      return reply.code(400).send(result);
    }

    reply.code(201).send(result);
  } catch (error) {
    console.error("Error en el controlador makeDonation:", error);
    reply.code(500).send({ error: "Ocurrió un error inesperado al procesar la donación." });
  }
}

module.exports = {
  makeDonation,
};
