const transactionService = require("./transaction.service");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Necesario para constructEvent

// Iniciar compra de suscripción
async function initiateSubscriptionPurchase(request, reply) {
  const { subscriptionType } = request.body;
  const userId = request.user.userId; // ID del usuario autenticado

  // URLs de éxito y cancelación para Stripe Checkout
  // Estas URLs deben ser accesibles desde el frontend de tu aplicación
  const successUrl = `${process.env.FRONTEND_URL}/payment-success`; // Ajusta esto a tu URL real
  const cancelUrl = `${process.env.FRONTEND_URL}/payment-cancel`; // Ajusta esto a tu URL real

  const result = await transactionService.initiatePurchase({
    userId,
    purchaseType: "subscription",
    itemKey: subscriptionType, // "basic" o "premium"
    successUrl,
    cancelUrl,
  });

  if (result.error) {
    return reply.code(400).send({ error: result.error });
  }

  reply.code(200).send(result); // Devuelve checkoutUrl y transactionId
}

// Iniciar compra de pack de monedas
async function initiateCoinPackPurchase(request, reply) {
  const { packName } = request.body;
  const userId = request.user.userId; // ID del usuario autenticado

  const successUrl = `${process.env.FRONTEND_URL}/payment-success`; // Ajusta esto
  const cancelUrl = `${process.env.FRONTEND_URL}/payment-cancel`; // Ajusta esto

  const result = await transactionService.initiatePurchase({
    userId,
    purchaseType: "coin_package",
    itemKey: packName, // "Pack de 100 Monedas", etc.
    successUrl,
    cancelUrl,
  });

  if (result.error) {
    return reply.code(400).send({ error: result.error });
  }

  reply.code(200).send(result);
}

// Manejar Webhooks de Stripe
// Esta ruta no está protegida por JWT, Stripe la llama directamente
async function handleStripeWebhook(request, reply) {
  const sig = request.headers["stripe-signature"];
  let event;

  try {
    // Construir el evento de Stripe para verificar la firma
    // Asegúrate de que process.env.STRIPE_WEBHOOK_SECRET esté configurado
    event = stripe.webhooks.constructEvent(request.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`⚠️  Error de verificación de webhook: ${err.message}`);
    return reply.code(400).send(`Webhook Error: ${err.message}`);
  }

  const result = await transactionService.handleStripeWebhook(event);

  if (result.error) {
    console.error("Error en el servicio al manejar webhook:", result.error);
    return reply.code(500).send({ error: result.error });
  }

  reply.code(200).send({ received: true }); // Stripe espera un 200 OK
}

// Mostrar historial de pagos del usuario autenticado
async function getTransactionHistory(request, reply) {
  const userId = request.user.userId; // ID del usuario autenticado

  const result = await transactionService.getTransactionHistory({ userId });

  if (result.error) {
    return reply.code(500).send({ error: result.error });
  }

  reply.code(200).send(result.transactions);
}

module.exports = {
  initiateSubscriptionPurchase,
  initiateCoinPackPurchase,
  handleStripeWebhook,
  getTransactionHistory,
};
