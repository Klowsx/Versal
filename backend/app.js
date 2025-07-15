const fastify = require("fastify")();
const dotenv = require("dotenv");
const jwt = require("@fastify/jwt");
const connectDB = require("./src/config/db");
const userRoutes = require("./src/modules/users/user.routes");
const authPlugin = require("./src/plugins/auth.plugin");
dotenv.config();
connectDB();
fastify.register(jwt, { secret: process.env.JWT_SECRET });

fastify.register(authPlugin);
fastify.register(userRoutes, { prefix: "/api/auth" });

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server ejecutandose ${address}`);
});
