const transactionController = require("./transaction.controller");
const {
  initiateSubscriptionPurchaseSchema,
  initiateCoinPackPurchaseSchema,
  purchaseInitiateResponseSchema,
  transactionHistoryResponseSchema,
  stripeWebhookEventSchema,
} = require("./transaction.schema");

async function transactionRoutes(fastify) {
  // Rutas protegidas (requieren token JWT)
  fastify.register(async function (privateRoutes) {
    privateRoutes.addHook("onRequest", fastify.authenticate); // Aplica el hook de autenticación

    // Iniciar compra de suscripción
    privateRoutes.post(
      "/purchase/subscription",
      {
        schema: {
          body: initiateSubscriptionPurchaseSchema,
          response: {
            200: purchaseInitiateResponseSchema,
          },
        },
      },
      transactionController.initiateSubscriptionPurchase
    );

    // Iniciar compra de pack de monedas
    privateRoutes.post(
      "/purchase/coin-pack",
      {
        schema: {
          body: initiateCoinPackPurchaseSchema,
          response: {
            200: purchaseInitiateResponseSchema,
          },
        },
      },
      transactionController.initiateCoinPackPurchase
    );

    // Obtener historial de transacciones
    privateRoutes.get(
      "/history",
      {
        schema: {
          response: {
            200: transactionHistoryResponseSchema,
          },
        },
      },
      transactionController.getTransactionHistory
    );
  });

  // Ruta para el webhook de Stripe (NO protegida por JWT)
  // Stripe enviará eventos a esta URL.
  // Es crucial que esta ruta sea POST y no requiera autenticación JWT.
  fastify.post(
    "/webhook/stripe",
    {
      // No hay esquema de cuerpo aquí, ya que el cuerpo del webhook es variable y Stripe lo valida con la firma.
      // Puedes añadir un esquema de respuesta si quieres documentar el 200 OK.
      schema: {
        response: {
          200: { type: "object", properties: { received: { type: "boolean" } } },
        },
      },
    },
    transactionController.handleStripeWebhook
  );
}

module.exports = transactionRoutes;
