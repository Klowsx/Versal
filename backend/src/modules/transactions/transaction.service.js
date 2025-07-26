const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Transaction = require("../../models/transaction.model");
const User = require("../../models/user.model"); // Tu modelo de usuario
const { PRODUCTS } = require("./transaction.schema"); // Importa los productos hardcodeados

// Función auxiliar para calcular la fecha de fin de suscripción
const calculateSubscriptionEndDate = (duration) => {
  const now = new Date();
  if (duration === "monthly") {
    // Añade un mes
    now.setMonth(now.getMonth() + 1);
  } else if (duration === "yearly") {
    // Añade un año
    now.setFullYear(now.getFullYear() + 1);
  }
  return now;
};

// 1. Iniciar una compra (crear sesión de Stripe Checkout)
async function initiatePurchase({ userId, purchaseType, itemKey, successUrl, cancelUrl }) {
  try {
    let productDetails;
    let description;
    let amount;
    let currency;

    if (purchaseType === "subscription") {
      productDetails = PRODUCTS.subscriptions[itemKey]; // itemKey será "basic" o "premium"
      if (!productDetails) {
        return { error: "Tipo de suscripción no válido." };
      }
      description = productDetails.name;
      amount = productDetails.price;
      currency = productDetails.currency;
    } else if (purchaseType === "coin_package") {
      productDetails = PRODUCTS.coin_packages[itemKey]; // itemKey será "Pack de 100 Monedas", etc.
      if (!productDetails) {
        return { error: "Nombre del pack de monedas no válido." };
      }
      description = productDetails.name;
      amount = productDetails.price;
      currency = productDetails.currency;
    } else {
      return { error: "Tipo de compra no válido." };
    }

    // Crear una transacción pendiente en tu base de datos
    const newTransaction = new Transaction({
      userId,
      purchaseType,
      description,
      amount,
      paymentStatus: "pending",
      // paymentId se llenará después del webhook
    });
    await newTransaction.save();

    // Crear la sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      client_reference_id: newTransaction._id.toString(), // Enlaza la sesión de Stripe con tu transacción
      metadata: {
        userId: userId.toString(),
        transactionId: newTransaction._id.toString(),
        purchaseType: purchaseType,
        itemKey: itemKey, // El nombre/tipo del producto para referencia en el webhook
      },
    });

    // Actualizar la transacción con el ID de sesión de Stripe
    newTransaction.paymentId = session.id;
    await newTransaction.save();

    return { checkoutUrl: session.url, transactionId: newTransaction._id.toString() };
  } catch (error) {
    console.error("Error al iniciar la compra:", error);
    return { error: "Error al iniciar el proceso de pago." };
  }
}

// 2. Manejar Webhooks de Stripe (Confirmación de Pago)
async function handleStripeWebhook(event) {
  try {
    const eventType = event.type;
    const dataObject = event.data.object;

    console.log(`Webhook recibido: ${eventType}`);

    switch (eventType) {
      case "checkout.session.completed":
        const sessionId = dataObject.id;
        const clientReferenceId = dataObject.client_reference_id; // Nuestro transactionId
        const paymentIntentId = dataObject.payment_intent; // ID del Payment Intent

        const transaction = await Transaction.findById(clientReferenceId);

        if (!transaction) {
          console.error(`Transacción no encontrada para client_reference_id: ${clientReferenceId}`);
          return { error: "Transacción no encontrada." };
        }

        if (transaction.paymentStatus === "successful") {
          console.log(`Transacción ${transaction._id} ya marcada como exitosa. Ignorando.`);
          return { message: "Transacción ya procesada." };
        }

        transaction.paymentStatus = "successful";
        transaction.paymentId = paymentIntentId || sessionId; // Usar Payment Intent ID si está disponible
        await transaction.save();

        // Actualizar el usuario según el tipo de compra
        const user = await User.findById(transaction.userId);
        if (!user) {
          console.error(`Usuario no encontrado para transacción ${transaction._id}`);
          return { error: "Usuario asociado a la transacción no encontrado." };
        }

        // Obtener detalles del producto de PRODUCTS hardcodeado usando itemKey del metadata
        const itemKey = dataObject.metadata.itemKey;
        let productDetailsFromWebhook;
        if (transaction.purchaseType === "subscription") {
          productDetailsFromWebhook = PRODUCTS.subscriptions[itemKey];
        } else if (transaction.purchaseType === "coin_package") {
          productDetailsFromWebhook = PRODUCTS.coin_packages[itemKey];
        }

        if (!productDetailsFromWebhook) {
          console.error(
            `Detalles de producto no encontrados para ${itemKey} en webhook (hardcodeado).`
          );
          return { error: "Producto desconocido en el webhook." };
        }

        if (transaction.purchaseType === "subscription") {
          // Calcula la nueva fecha de fin de suscripción
          const endDate = calculateSubscriptionEndDate(productDetailsFromWebhook.duration);

          // Actualiza la suscripción del usuario
          user.subscription = {
            type: itemKey, // "basic" o "premium"
            status: "active",
            endDate: endDate,
          };
          console.log(
            `Suscripción de usuario ${user._id} actualizada a ${itemKey} hasta ${endDate}`
          );
        } else if (transaction.purchaseType === "coin_package") {
          user.totalCoinsReceived =
            (user.totalCoinsReceived || 0) + productDetailsFromWebhook.coins;
          console.log(
            `Monedas de usuario ${user._id} actualizadas. Total: ${user.totalCoinsReceived}`
          );
        }

        await user.save();
        console.log(`Transacción ${transaction._id} completada y usuario ${user._id} actualizado.`);
        break;

      case "payment_intent.succeeded":
        console.log(
          "Payment Intent Succeeded. (Puede ser manejado por checkout.session.completed)"
        );
        break;

      case "payment_intent.payment_failed":
        console.log("Payment Intent Failed.");
        break;

      default:
        console.log(`Evento Stripe no manejado: ${eventType}`);
    }

    return { received: true };
  } catch (error) {
    console.error("Error al manejar el webhook de Stripe:", error);
    return { error: "Error al procesar el webhook." };
  }
}

// 3. Mostrar historial de pagos
async function getTransactionHistory({ userId }) {
  try {
    const transactions = await Transaction.find({ userId }).sort({ transactionDate: -1 });
    return { transactions };
  } catch (error) {
    console.error("Error al obtener historial de transacciones:", error);
    return { error: "Error al obtener el historial de pagos." };
  }
}

module.exports = {
  initiatePurchase,
  handleStripeWebhook,
  getTransactionHistory,
};
