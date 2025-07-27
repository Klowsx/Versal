// Versal/backend/src/modules/transactions/transaction.service.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Transaction = require("../../models/transaction.model");
const User = require("../../models/user.model");
const {
  Types: { ObjectId },
} = require("mongoose");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

async function createStripeCheckoutSessionForSubscription(userId, planId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { error: "Usuario no encontrado." };
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          mongoDbUserId: userId.toString(),
        },
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [
        {
          price: planId,
          quantity: 1,
        },
      ],
      success_url: `${FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment-canceled`,
      metadata: {
        userId: userId.toString(),
        type: "subscription",
        planId: planId,
      },
      subscription_data: {
        metadata: {
          mongoDbUserId: userId.toString(),
        },
      },
    });

    const newTransaction = new Transaction({
      userId,
      type: "subscription",
      amount: 0,
      currency: process.env.STRIPE_CURRENCY,
      status: "pending",
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: stripeCustomerId,
      metadata: {
        planId: planId,
      },
    });
    await newTransaction.save();

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error("Error al crear sesión de checkout para suscripción:", error);
    return { error: `Error al crear sesión de checkout para suscripción: ${error.message}` };
  }
}

async function createStripeCheckoutSessionForCoinPack(userId, coinPackId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { error: "Usuario no encontrado." };
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          mongoDbUserId: userId.toString(),
        },
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "payment",
      line_items: [
        {
          price: coinPackId,
          quantity: 1,
        },
      ],
      success_url: `${FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment-canceled`,
      metadata: {
        userId: userId.toString(),
        type: "coin_pack_purchase",
        coinPackId: coinPackId,
      },
    });

    const newTransaction = new Transaction({
      userId,
      type: "coin_pack_purchase",
      amount: 0,
      currency: process.env.STRIPE_CURRENCY,
      status: "pending",
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: stripeCustomerId,
      metadata: {
        coinPackId: coinPackId,
      },
    });
    await newTransaction.save();

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error("Error al crear sesión de checkout para pack de monedas:", error);
    return { error: `Error al crear sesión de checkout para pack de monedas: ${error.message}` };
  }
}

async function handleStripeWebhookEvent(event) {
  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        console.log("checkout.session.completed", session.id);

        const transaction = await Transaction.findOne({ stripeCheckoutSessionId: session.id });

        if (transaction) {
          // Verificar si ya fue procesada (para evitar re-procesar eventos duplicados)
          if (transaction.status === "completed") {
            console.log(
              `Transacción ${transaction._id} ya está completada. Ignorando evento duplicado.`
            );
            return { message: "Evento ya procesado." };
          }

          // Obtener el PaymentIntent para pagos únicos (coin packs) o Subscription para suscripciones
          let paymentIntentOrSubscription;
          if (session.mode === "payment" && session.payment_intent) {
            paymentIntentOrSubscription = await stripe.paymentIntents.retrieve(
              session.payment_intent
            );
            transaction.stripePaymentIntentId = paymentIntentOrSubscription.id;
          } else if (session.mode === "subscription" && session.subscription) {
            paymentIntentOrSubscription = await stripe.subscriptions.retrieve(session.subscription);
            transaction.stripeSubscriptionId = paymentIntentOrSubscription.id;
          }

          transaction.status = "completed";
          transaction.amount = session.amount_total / 100; // Stripe devuelve en céntimos
          transaction.currency = session.currency;
          transaction.stripeCustomerId = session.customer;
          await transaction.save();

          // Lógica adicional basada en el tipo de transacción
          const userId = session.metadata.userId; // Obtenido del metadata que enviamos al crear la sesión
          const user = await User.findById(userId);

          if (user) {
            if (session.metadata.type === "subscription") {
              // Actualizar el estado de suscripción del usuario
              user.isPremium = true;
              user.premiumSubscriptionId = transaction.stripeSubscriptionId;
              user.subscriptionPlanId = session.metadata.planId; // Guardar el plan ID de Stripe
              // Opcional: Si tienes un esquema de suscripción anidado como el original, puedes actualizarlo aquí también:
              user.subscription.type = "premium";
              user.subscription.status = "active";
              user.subscription.endDate = null; // O calcula una fecha de fin si tu plan es de duración fija
              await user.save();
              console.log(`Usuario ${user.username} suscrito a premium.`);
            } else if (session.metadata.type === "coin_pack_purchase") {
              const coinPackId = session.metadata.coinPackId;
              const coinsToAdd = getCoinsForPack(coinPackId); // Obtener la cantidad de monedas

              if (coinsToAdd > 0) {
                // *** CAMBIO CLAVE AQUÍ: Usamos $inc para una actualización atómica de monedas ***
                await User.findByIdAndUpdate(
                  user._id,
                  { $inc: { coins: coinsToAdd } },
                  { new: true } // Para obtener el documento actualizado si lo necesitas
                );
                console.log(
                  `Usuario ${user.username} compró ${coinsToAdd} monedas. Monedas añadidas atómicamente.`
                );
                // Nota: `user` objeto local no se actualizará con el nuevo valor de `coins` sin refetch
              } else {
                console.warn(
                  `No se encontraron monedas para el pack: ${coinPackId}. No se añadieron monedas al usuario ${user.username}.`
                );
              }
            }
          }
        } else {
          console.warn(
            `Sesión de Checkout ${session.id} completada, pero no se encontró la transacción correspondiente en la DB.`
          );
        }
        break;

      case "invoice.payment_succeeded":
        const invoice = event.data.object;
        console.log("invoice.payment_succeeded", invoice.id);
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const userIdFromMetadata = subscription.metadata.mongoDbUserId;

          if (userIdFromMetadata) {
            const user = await User.findById(userIdFromMetadata);
            if (user && !user.isPremium) {
              user.isPremium = true;
              user.premiumSubscriptionId = subscription.id;
              await user.save();
              console.log(`Usuario ${user.username} reactivó suscripción por renovación.`);
            }

            const newTransaction = new Transaction({
              userId: new ObjectId(userIdFromMetadata),
              type: "subscription",
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: "completed",
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer,
              stripePaymentIntentId: invoice.payment_intent,
              metadata: {
                renewal: true,
                invoiceId: invoice.id,
                planId: subscription.items.data[0].price.id,
              },
            });
            await newTransaction.save();
          }
        }
        break;

      case "invoice.payment_failed":
        const failedInvoice = event.data.object;
        console.log("invoice.payment_failed", failedInvoice.id);
        if (failedInvoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription);
          const userIdFromMetadata = subscription.metadata.mongoDbUserId;
          if (userIdFromMetadata) {
            const user = await User.findById(userIdFromMetadata);
            if (user) {
              console.log(`Pago de suscripción fallido para usuario ${user.username}.`);
            }
          }
        }
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object;
        console.log("customer.subscription.deleted", deletedSubscription.id);

        const userIdSubDeleted = deletedSubscription.metadata.mongoDbUserId;
        if (userIdSubDeleted) {
          const user = await User.findById(userIdSubDeleted);
          if (user) {
            user.isPremium = false;
            user.premiumSubscriptionId = undefined;
            user.subscriptionPlanId = undefined;

            user.subscription.type = "basic";
            user.subscription.status = "expired";
            user.subscription.endDate = new Date();
            await user.save();
            console.log(`Suscripción eliminada para el usuario ${user.username}.`);
          }
        }

        await Transaction.updateMany(
          { stripeSubscriptionId: deletedSubscription.id, status: "completed" },
          { $set: { status: "canceled" } }
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  } catch (error) {
    console.error("Error al manejar evento de webhook de Stripe:", error);
    return { error: "Error al manejar evento de webhook de Stripe." };
  }
}

function getCoinsForPack(coinPackId) {
  const coinPacksMap = {
    price_1RpOvtR09FDM2B1YL43aCKKi: 100,
    price_1RpOi7R09FDM2B1Y6ifORS0i: 500,
    price_1RpOtXR09FDM2B1YmqgNXXiC: 1000,
  };

  const coins = coinPacksMap[coinPackId];
  if (coins === undefined) {
    console.warn(
      `Advertencia: No se encontró la cantidad de monedas para el pack con Stripe Price ID: ${coinPackId}`
    );
    return 0;
  }
  return coins;
}

async function getUserTransactions(userId) {
  try {
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 }).lean();
    return { transactions };
  } catch (error) {
    console.error(`Error obteniendo transacciones para el usuario ${userId}:`, error);
    return { error: "Error al obtener transacciones del usuario." };
  }
}

module.exports = {
  createStripeCheckoutSessionForSubscription,
  createStripeCheckoutSessionForCoinPack,
  handleStripeWebhookEvent,
  getUserTransactions,
};
