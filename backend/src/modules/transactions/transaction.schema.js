// Definición de los "productos" que se pueden comprar.
// ESTO ESTÁ HARDCODEADO EN EL CÓDIGO. NO NECESITA DB NI SEEDER.
const PRODUCTS = {
  subscriptions: {
    basic: {
      // Usar "basic" como clave, ya que es el 'type' en tu user.model.js
      name: "Suscripción Básica",
      price: 1000, // En centavos (ej. $10.00 USD)
      currency: "usd",
      duration: "monthly", // Duración para calcular endDate
    },
    premium: {
      // Usar "premium" como clave
      name: "Suscripción Premium",
      price: 5000, // En centavos (ej. $50.00 USD)
      currency: "usd",
      duration: "yearly", // Duración para calcular endDate
    },
  },
  coin_packages: {
    "Pack de 100 Monedas": {
      // Usar el nombre completo como clave para packs
      name: "Pack de 100 Monedas",
      coins: 100,
      price: 500,
      currency: "usd",
    },
    "Pack de 500 Monedas": {
      name: "Pack de 500 Monedas",
      coins: 500,
      price: 2000,
      currency: "usd",
    },
    "Pack de 1000 Monedas": {
      name: "Pack de 1000 Monedas",
      coins: 1000,
      price: 3500,
      currency: "usd",
    },
  },
};

// Esquema base para una transacción (para respuestas)
const transactionBaseSchema = {
  type: "object",
  properties: {
    _id: { type: "string" },
    userId: { type: "string" },
    purchaseType: { type: "string", enum: ["subscription", "coin_package"] },
    description: { type: "string" },
    amount: { type: "number" },
    transactionDate: { type: "string", format: "date-time" },
    paymentStatus: { type: "string", enum: ["successful", "failed"] },
    paymentId: { type: "string", nullable: true },
  },
  required: [
    "_id",
    "userId",
    "purchaseType",
    "description",
    "amount",
    "transactionDate",
    "paymentStatus",
  ],
};

// Esquema para iniciar una compra de suscripción
const initiateSubscriptionPurchaseSchema = {
  type: "object",
  properties: {
    // El enum se refiere a los 'type' de suscripción en tu modelo de usuario
    subscriptionType: { type: "string", enum: ["basic", "premium"] },
  },
  required: ["subscriptionType"],
};

// Esquema para iniciar una compra de pack de monedas
const initiateCoinPackPurchaseSchema = {
  type: "object",
  properties: {
    // El enum se refiere a los 'name' de los packs de monedas hardcodeados
    packName: { type: "string", enum: Object.keys(PRODUCTS.coin_packages) },
  },
  required: ["packName"],
};

// Esquema de respuesta para iniciar una compra (devuelve la URL de Stripe Checkout)
const purchaseInitiateResponseSchema = {
  type: "object",
  properties: {
    checkoutUrl: { type: "string", format: "uri" },
    transactionId: { type: "string" },
  },
  required: ["checkoutUrl", "transactionId"],
};

// Esquema de respuesta para el historial de transacciones (array de transacciones)
const transactionHistoryResponseSchema = {
  type: "array",
  items: transactionBaseSchema,
};

// Esquema para el webhook de Stripe (simplificado para lo esencial que Stripe envía)
const stripeWebhookEventSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    object: { type: "string", const: "event" },
    type: { type: "string" },
    data: {
      type: "object",
      properties: {
        object: { type: "object" },
      },
      required: ["object"],
    },
  },
  required: ["id", "object", "type", "data"],
};

module.exports = {
  PRODUCTS,
  transactionBaseSchema,
  initiateSubscriptionPurchaseSchema,
  initiateCoinPackPurchaseSchema,
  purchaseInitiateResponseSchema,
  transactionHistoryResponseSchema,
  stripeWebhookEventSchema,
};
