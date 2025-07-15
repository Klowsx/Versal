const userSchemas = require("./user.schema");
const userController = require("./user.controller");

async function userRoutes(fastify, opts) {
  fastify.post(
    "/users/register",
    {
      schema: userSchemas.register,
    },
    userController.register
  );

  fastify.post(
    "/users/login",
    {
      schema: userSchemas.login,
    },
    userController.login
  );

  fastify.get("/users/me", {
    preHandler: [fastify.authenticate],
    handler: userController.getCurrentUser,
  });
}

module.exports = userRoutes;
