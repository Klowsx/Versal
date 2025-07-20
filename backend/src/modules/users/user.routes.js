const userController = require("./user.controller");
const {
  registerUserSchema,
  registerResponseSchema,
  loginResponseSchema,
  loginUserSchema,
  updateProfileSchema,
  changePasswordSchema,
  userIdParamSchema,
  userBase,
} = require("./user.schema");

async function userRoutes(fastify) {
  // Registro
  fastify.post(
    "/register",
    {
      schema: {
        body: registerUserSchema,
        response: {
          201: registerResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await userController.register(request, reply);

      if (result.error) {
        return reply.code(400).send({ error: result.error });
      }

      const token = fastify.jwt.sign({ userId: result.user._id, role: result.user.role });
      reply.code(201).send({ user: result.user, token });
    }
  );

  // Login
  fastify.post(
    "/login",
    {
      schema: {
        body: loginUserSchema,
        response: {
          200: loginResponseSchema,
        },
      },
    },
    async (request, reply) => {
      console.log("Cuerpo de la petición:", request.body);

      const result = await userController.login(request, reply);
      console.log("Resultado de userController.login:", result);

      if (!result.user || !result.user._id) {
        console.error("Login fallido: Usuario o _id no válidos en el resultado.", result.user);
        return reply.code(401).send({ error: "Credenciales inválidas o usuario no encontrado." });
      }

      console.log("Usuario válido encontrado:", result.user._id);

      let token;
      try {
        token = fastify.jwt.sign({ userId: result.user._id, role: result.user.role });
        console.log(
          "Token firmado exitosamente. Token generado:",
          token ? "GENERADO" : "UNDEFINED/NULL"
        );
      } catch (jwtSignError) {
        console.error("ERROR al firmar el JWT:", jwtSignError);
        return reply.code(500).send({ error: "Error interno al generar el token." });
      }

      reply.code(200).send({ user: result.user, token });
    }
  );

  // Rutas protegidas
  fastify.register(async function (privateRoutes) {
    privateRoutes.addHook("onRequest", fastify.authenticate);

    // Perfil
    privateRoutes.get("/me", userController.getCurrentUser);

    // Actualizar perfil
    privateRoutes.put(
      "/me",
      { schema: { body: updateProfileSchema } },
      userController.updateProfile
    );

    // Obtener perfil por ID
    privateRoutes.get(
      "/:id",
      {
        schema: {
          params: userIdParamSchema,
          response: {
            200: userBase,
          },
        },
      },
      userController.getUserProfileById
    );

    // Cambiar contraseña
    privateRoutes.put(
      "/me/password",
      { schema: { body: changePasswordSchema } },
      userController.changePassword
    );

    // Seguidores / Seguidos
    privateRoutes.get("/me/followers", userController.getFollowers);
    privateRoutes.get("/me/following", userController.getFollowing);

    // Bloqueados
    privateRoutes.get("/me/blocked", userController.getBlockedUsers);

    // Interacciones con otros usuarios
    privateRoutes.post(
      "/:id/follow",
      { schema: { params: userIdParamSchema } },
      userController.followUser
    );

    privateRoutes.post(
      "/:id/unfollow",
      { schema: { params: userIdParamSchema } },
      userController.unfollowUser
    );

    privateRoutes.post(
      "/:id/block",
      { schema: { params: userIdParamSchema } },
      userController.blockUser
    );

    privateRoutes.post(
      "/:id/unblock",
      { schema: { params: userIdParamSchema } },
      userController.unblockUser
    );
  });

  // Admin
  fastify.register(async function (adminRoutes) {
    adminRoutes.addHook("onRequest", async (req, reply) => {
      await fastify.authenticate(req, reply);
      console.log("Verificando rol de usuario para acceso a rutas de administrador...");
      console.log("Rol del usuario:", req.user.role);
      if (req.user.role !== "admin") {
        return reply.code(403).send({ error: "Acceso denegado: solo administradores" });
      }
    });
    adminRoutes.get("/all", userController.getAllUsers);
    adminRoutes.delete("/:userId", userController.deleteUser);
    adminRoutes.put("/:userId/role", userController.updateUserRole);
  });
}

module.exports = userRoutes;
