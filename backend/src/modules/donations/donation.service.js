const mongoose = require("mongoose");
const Donation = require("./donation.model");
const User = require("../../models/user.model");
const { Story } = require("../../models/story.model");
const Transaction = require("../../models/transaction.model");

async function makeDonation(donatorId, storyId, amount, message) {
  try {
    if (amount <= 0) {
      return { error: "La cantidad a donar debe ser positiva." };
    }

    const [donator, story] = await Promise.all([User.findById(donatorId), Story.findById(storyId)]);

    if (!donator) return { error: "El usuario donador no fue encontrado." };
    if (!story) return { error: "La historia no fue encontrada." };

    const recipientId = story.author;

    if (donatorId.toString() === recipientId.toString()) {
      return { error: "No puedes donarte monedas a ti mismo." };
    }
    if (donator.coins < amount) {
      return { error: "No tienes suficientes monedas para realizar esta donación." };
    }

    await User.updateOne({ _id: donatorId }, { $inc: { coins: -amount } });

    await User.updateOne({ _id: recipientId }, { $inc: { coins: amount } });

    const newDonation = await Donation.create({
      donatorId,
      recipientId,
      storyId,
      amount,
      message,
    });

    await Transaction.create({
      userId: donatorId,
      type: "donation",
      amount: amount,
      currency: "coins",
      status: "completed",
      metadata: {
        recipientId,
        storyId,
      },
    });

    return { success: true, donation: newDonation };
  } catch (error) {
    console.error("Error al procesar la donación:", error);
    return { error: "Ocurrió un error inesperado al procesar la donación." };
  }
}

module.exports = { makeDonation };
