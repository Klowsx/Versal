const fp = require("fastify-plugin");
const jwt = require("jsonwebtoken");

module.exports = fp(async function (fastify) {
  fastify.decorate("authenticate", async function (request, reply) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) throw new Error();

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      request.user = decoded;
    } catch {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
});
