const userSchemas = require("./user.schema");
const userController = require("./user.controller");

async function userRoutes(fastify) {
  fastify.post("/register", { schema: userSchemas.register }, userController.register);

  fastify.post("/login", { schema: userSchemas.login }, userController.login);

  fastify.get("/me", {
    preHandler: fastify.authenticate,
    handler: userController.getCurrentUser,
  });
}

module.exports = userRoutes;
