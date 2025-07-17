const dotenv = require("dotenv");
const fastify = require("fastify")();
const jwt = require("@fastify/jwt");
const connectDB = require("./src/config/db");
const userRoutes = require("./src/modules/users/user.routes");
const authPlugin = require("./src/plugins/auth.plugin");
const storyCreationRoutes = require("./src/modules/createStory/Detalles/storyCreation.routes");
dotenv.config();
connectDB();
fastify.register(jwt, { secret: process.env.JWT_SECRET });

fastify.register(authPlugin);
fastify.register(userRoutes, { prefix: "/api/auth" });
fastify.register(storyCreationRoutes, { prefix: "/api/story" });


fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server ejecutandose ${address}`);
});
