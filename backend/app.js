const dotenv = require("dotenv");
dotenv.config();

const fastify = require("fastify")();
const cors = require("@fastify/cors");
const jwt = require("@fastify/jwt");
const connectDB = require("./src/config/db");
const storyCreationRoutes = require("./src/modules/stories/Detalles/storyCreation.routes");
const storyWritingRoute = require("./src/modules/stories/Historia/storyWriting.route");
const publicarStoryRoute = require("./src/modules/stories/Actualizar/publicarStory.route");
const authPlugin = require("./src/plugins/auth.plugin");
const userRoutes = require("./src/modules/users/user.routes");
dotenv.config();
connectDB();
fastify.register(jwt, { secret: process.env.JWT_SECRET });

fastify.register(authPlugin);

//CORS
fastify.register(cors, {
  origin: "*",
  credentials: true,
});

// Rutas de usuario
fastify.register(userRoutes, { prefix: "/api/user", authenticate: fastify.authenticate });

// Rutas de las historias
fastify.register(storyCreationRoutes, { prefix: "/api/story" });
fastify.register(storyWritingRoute, { prefix: "/api/writing" });
fastify.register(publicarStoryRoute, { prefix: "/api/publish"});

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server ejecutandose ${address}`);
});
