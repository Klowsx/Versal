const userService = require("./user.service");

async function register(request, reply) {
  const { email, password, username, fullName } = request.body;

  const result = await userService.registerUser({ email, password, username, fullName });

  if (result.error) {
    return reply.code(400).send({ error: result.error });
  }

  reply.code(201).send({ user: result.user, token: result.token });
}

async function login(request, reply) {
  const { email, password } = request.body;

  const result = await userService.loginUser({ email, password });

  if (result.error) {
    return reply.code(401).send({ error: result.error });
  }

  reply.send({ user: result.user, token: result.token });
}

const getCurrentUser = async (req, reply) => {
  const user = req.user;
  reply.send({
    _id: user._id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  });
};

module.exports = { register, login, getCurrentUser };
