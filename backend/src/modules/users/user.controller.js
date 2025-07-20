const userService = require("./user.service");

//Registro de usuario
async function register(request, reply) {
  const { email, password, username, fullName } = request.body;

  const result = await userService.registerUser({ email, password, username, fullName });

  if (result.error) {
    return reply.code(400).send({ error: result.error });
  }

  return result;
}

//Login de usuario
async function login(request, reply) {
  const { email, password } = request.body;

  const result = await userService.loginUser({ email, password });

  if (result.error) {
    return reply.code(401).send({ error: result.error });
  }

  return result;
}

// Obtener usuario actual
async function getCurrentUser(req, reply) {
  const user = await userService.getUserById({ userId: req.user.userId });
  if (!user) return reply.code(404).send({ message: "Usuario no encontrado" });
  reply.send(user);
}

// Obtener perfil de usuario por ID
async function getUserProfileById(req, reply) {
  const { id } = req.params;
  const user = await userService.getUserById({ userId: id });

  if (!user) {
    return reply.code(404).send({ message: "Usuario no encontrado" });
  }

  //filtrar campos sensibles si no quieres que sean públicos
  const publicUser = { ...user };
  delete publicUser.password; // No enviar la contraseña
  delete publicUser.email; // No enviar el email
  delete publicUser.subscription; // No enviar la suscripción
  delete publicUser.totalCoinsReceived; // No enviar las monedas recibidas

  reply.send(publicUser);
}

// Actualizar usuario
async function updateProfile(req, reply) {
  const updatedUser = await userService.updateUser({
    userId: req.user.userId,
    data: req.body,
  });
  reply.send(updatedUser);
}

// Cambiar contraseña
async function changePassword(req, reply) {
  const { oldPassword, newPassword } = req.body;
  const result = await userService.changePassword({
    userId: req.user.userId,
    oldPassword,
    newPassword,
  });

  if (result.error) {
    return reply.code(400).send({ error: result.error });
  }

  reply.send({ message: result.message });
}

// Seguir usuario
async function followUser(req, reply) {
  const result = await userService.followUser({
    currentUserId: req.user.userId,
    targetUserId: req.params.id,
  });

  reply.send(result);
}

// Dejar de seguir usuario
async function unfollowUser(req, reply) {
  const result = await userService.unfollowUser({
    currentUserId: req.user.userId,
    targetUserId: req.params.id,
  });

  reply.send(result);
}

// Ver seguidores
async function getFollowers(req, reply) {
  const followers = await userService.getFollowers({ userId: req.user.userId });
  reply.send(followers);
}

// Ver seguidos
async function getFollowing(req, reply) {
  const following = await userService.getFollowing({ userId: req.user.userId });
  reply.send(following);
}

// Ver usuarios bloqueados
async function getBlockedUsers(req, reply) {
  const blockedUsers = await userService.getBlockedUsers({ userId: req.user.userId });
  reply.send(blockedUsers);
}

// Bloquear usuario
async function blockUser(req, reply) {
  const result = await userService.blockUser({
    currentUserId: req.user.userId,
    targetUserId: req.params.id,
  });

  reply.send(result);
}

// Desbloquear usuario
async function unblockUser(req, reply) {
  const result = await userService.unblockUser({
    currentUserId: req.user.userId,
    targetUserId: req.params.id,
  });

  reply.send(result);
}

// ADMIN
// Obtener todos los usuarios
async function getAllUsers(req, reply) {
  const users = await userService.getAllUsers();
  reply.send(users);
}

// Borrar usuario
async function deleteUser(req, reply) {
  const { userId } = req.params;
  const result = await userService.deleteUser({ userId });
  reply.send(result);
}

// Actualizar rol de usuario
async function updateUserRole(req, reply) {
  const { userId } = req.params;
  const { role } = req.body;

  const result = await userService.updateUserRole({ userId, role });
  reply.send(result);
}

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getAllUsers,
  deleteUser,
  updateUserRole,
  getUserProfileById,
};
