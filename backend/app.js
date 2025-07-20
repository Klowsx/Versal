const dotenv = require("dotenv");
dotenv.config();

const fastify = require("fastify")();
const cors = require("@fastify/cors");
const jwt = require("@fastify/jwt");
const connectDB = require("./src/config/db");

const authPlugin = require("./src/plugins/auth.plugin");
const userRoutes = require("./src/modules/users/user.routes");
const storyCreationRoutes = require("./src/modules/createStory/Detalles/storyCreation.routes");

connectDB();

// Configuración de JWT
fastify.register(jwt, { secret: process.env.JWT_SECRET });

// Middleware de autenticación
fastify.register(authPlugin);

// Rutas de usuario
fastify.register(userRoutes, { prefix: "/api/user", authenticate: fastify.authenticate });

// Rutas de las historias
fastify.register(storyCreationRoutes, { prefix: "/api/story" });

//Inicialización del servidor
fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server ejecutandose ${address}`);
});
