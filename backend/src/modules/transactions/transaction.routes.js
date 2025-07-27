// Versal/backend/src/modules/transactions/transaction.routes.js
const transactionController = require("./transaction.controller");
const {
  createSubscriptionCheckoutSchema,
  createCoinPackCheckoutSchema,
  stripeWebhookSchema,
  getUserTransactionsSchema,
} = require("./transaction.schema");

async function transactionRoutes(fastify) {
  fastify.post(
    "/stripe-webhook",
    {
      schema: stripeWebhookSchema,
      config: {
        rawBody: true,
      },
    },
    transactionController.stripeWebhook
  );

  fastify.register(async function (privateRoutes) {
    privateRoutes.addHook("onRequest", fastify.authenticate);

    // Ruta para iniciar una sesión de checkout de suscripción
    privateRoutes.post(
      "/checkout/subscription",
      { schema: createSubscriptionCheckoutSchema },
      transactionController.createSubscriptionCheckout
    );

    // Ruta para iniciar una sesión de checkout de compra de pack de monedas
    privateRoutes.post(
      "/checkout/coin-pack",
      { schema: createCoinPackCheckoutSchema },
      transactionController.createCoinPackCheckout
    );

    // Ruta para obtener las transacciones del usuario
    privateRoutes.get(
      "/me",
      { schema: getUserTransactionsSchema },
      transactionController.getUserTransactions
    );
  });
}

module.exports = transactionRoutes;
