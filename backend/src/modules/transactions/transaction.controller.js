const transactionService = require("./transaction.service");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function createSubscriptionCheckout(request, reply) {
  try {
    const { userId } = request.user;
    const { planId } = request.body;

    const result = await transactionService.createStripeCheckoutSessionForSubscription(
      userId,
      planId
    );

    if (result.error) {
      return reply.code(400).send({ error: result.error });
    }

    reply.code(200).send(result);
  } catch (error) {
    console.error("Error en el controlador createSubscriptionCheckout:", error);
    reply
      .code(500)
      .send({ error: "Ocurrió un error inesperado al iniciar el checkout de suscripción." });
  }
}

async function createCoinPackCheckout(request, reply) {
  try {
    const { userId } = request.user;
    const { coinPackId } = request.body;

    const result = await transactionService.createStripeCheckoutSessionForCoinPack(
      userId,
      coinPackId
    );

    if (result.error) {
      return reply.code(400).send({ error: result.error });
    }

    reply.code(200).send(result);
  } catch (error) {
    console.error("Error en el controlador createCoinPackCheckout:", error);
    reply
      .code(500)
      .send({ error: "Ocurrió un error inesperado al iniciar el checkout del pack de monedas." });
  }
}

async function stripeWebhook(request, reply) {
  const sig = request.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(request.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`⚠️  Webhook Error: ${err.message}`);
    return reply.code(400).send(`Webhook Error: ${err.message}`);
  }

  const result = await transactionService.handleStripeWebhookEvent(event);

  if (result.error) {
    console.error("Error procesando el evento de webhook:", result.error);
    return reply.code(500).send({ error: result.error });
  }

  reply.code(200).send({ received: true });
}

async function getUserTransactions(request, reply) {
  try {
    const { userId } = request.user;
    const result = await transactionService.getUserTransactions(userId);

    if (result.error) {
      return reply.code(500).send({ error: result.error });
    }

    reply.code(200).send(result);
  } catch (error) {
    console.error("Error en el controlador getUserTransactions:", error);
    reply.code(500).send({ error: "Ocurrió un error inesperado al obtener tus transacciones." });
  }
}

module.exports = {
  createSubscriptionCheckout,
  createCoinPackCheckout,
  stripeWebhook,
  getUserTransactions,
};
