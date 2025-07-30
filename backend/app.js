// Versal/backend/app.js
const dotenv = require("dotenv");
dotenv.config();

const fastify = require("fastify")();
const cors = require("@fastify/cors");
const jwt = require("@fastify/jwt");
const path = require("path");

const fastifyMultipart = require("@fastify/multipart");
const fastifyStatic = require("@fastify/static");
const fastifyRawBody = require("fastify-raw-body");

const connectDB = require("./src/config/db");
const storyRoutes = require("./src/modules/stories/story.routes");
const authPlugin = require("./src/plugins/auth.plugin");
const userRoutes = require("./src/modules/users/user.routes");
const transactionRoutes = require("./src/modules/transactions/transaction.routes");
const interactionRoutes = require("./src/modules/interactions/interaction.routes");
const chapterRoutes = require("./src/modules/chapters/chapter.routes");
const favoriteRoutes = require("./src/modules/favorites/favorite.routes");
const reportRoutes = require("./src/modules/reports/report.routes");
const donationRoutes = require("./src/modules/donations/donation.routes");

// Conectar a la base de datos
connectDB();

// Plugins de Fastify
fastify.register(jwt, { secret: process.env.JWT_SECRET });
fastify.register(authPlugin);

fastify.register(fastifyMultipart);

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "uploads"),
  prefix: "/uploads/",
});

fastify.register(fastifyRawBody, {
  field: "rawBody",
  global: false,
  encoding: "utf8",
});

fastify.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

// Rutas de usuario
fastify.register(userRoutes, { prefix: "/api/user" });

// Rutas de las historias
fastify.register(storyRoutes, { prefix: "/api/stories" });

//Rutas de interacciones
fastify.register(interactionRoutes, { prefix: "/api/interactions" });

// Rutas de transacciones
fastify.register(transactionRoutes, { prefix: "/api" });

// Rutas de capítulos
fastify.register(chapterRoutes, { prefix: "/api" });

// Rutas de favoritos
fastify.register(favoriteRoutes, { prefix: "/api" });

// Rutas de reportes
fastify.register(reportRoutes, { prefix: "/api" });

// Rutas de donaciones
fastify.register(donationRoutes, { prefix: "/api" });

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server ejecutándose en ${address}`);
});
