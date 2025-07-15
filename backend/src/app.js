const fastify = require("fastify")();
const mongoose = require("mongoose");
require("dotenv").config();

fastify.register(require("./src/modules/users/user.routes"));

mongoose.connect(process.env.MONGO_URL).then(() => {
  fastify.listen({ port: 3000 }, (err) => {
    if (err) throw err;
    console.log("Server listening on port 3000");
  });
});
