const register = {
  body: {
    type: "object",
    required: ["email", "password", "username"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      username: { type: "string" },
    },
  },
};

const login = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },
};

const getCurrentUser = {
  response: {
    200: {
      type: "object",
      properties: {
        _id: { type: "string" },
        username: { type: "string" },
        email: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
    },
  },
};

module.exports = { register, login, getCurrentUser };
