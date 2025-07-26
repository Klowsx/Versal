const dotenv = require("dotenv");
dotenv.config();

const fastify = require("fastify")();
const cors = require("@fastify/cors");
const jwt = require("@fastify/jwt");
const connectDB = require("./src/config/db");
const storyRoutes = require("./src/modules/stories/story.routes");
const authPlugin = require("./src/plugins/auth.plugin");
const userRoutes = require("./src/modules/users/user.routes");
const transactionRoutes = require("./src/modules/transactions/transaction.routes");
const interactionRoutes = require("./src/modules/interactions/interaction.routes"); // <-- AÑADIDO

// Conectar a la base de datos
connectDB();

// Registrar plugins
fastify.register(jwt, { secret: process.env.JWT_SECRET });
fastify.register(authPlugin);

//CORS
fastify.register(cors, {
  origin: "*",
  credentials: true,
});

// Rutas de usuario
fastify.register(userRoutes, { prefix: "/api/user" });

// Rutas de las historias
fastify.register(storyRoutes, { prefix: "/api/stories" });

//Rutas de interacciones
fastify.register(interactionRoutes, { prefix: "/api/interactions" });

// Rutas de transacciones
fastify.register(transactionRoutes, { prefix: "/api/transactions" });

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server ejecutandose ${address}`);
});
