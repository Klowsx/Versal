const dotenv = require("dotenv");
dotenv.config();

const fastify = require("fastify")();
const cors = require("@fastify/cors");
const jwt = require("@fastify/jwt");
const path = require('path');

// --- IMPORTS CORREGIDOS ---
// Se importa cada librería con su nombre correcto.
const fastifyMultipart = require('@fastify/multipart');
const fastifyStatic = require('@fastify/static');

// Tus módulos
const connectDB = require("./src/config/db");
const storyRoutes = require("./src/modules/stories/story.routes");
const authPlugin = require("./src/plugins/auth.plugin");
const userRoutes = require("./src/modules/users/user.routes");
const interactionRoutes = require("./src/modules/interactions/interaction.routes");

// Conectar a la base de datos
connectDB();

// --- REGISTRO DE PLUGINS CORREGIDO ---

// Plugins de Fastify
fastify.register(jwt, { secret: process.env.JWT_SECRET });
fastify.register(authPlugin);

// 1. Registra el plugin para procesar la subida de archivos.
fastify.register(fastifyMultipart);

// 2. Registra el plugin para servir los archivos ya guardados.
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'uploads'),
  prefix: '/uploads/',
});

// 3. CORS mejorado para aceptar las peticiones de actualización.
fastify.register(cors, {
  origin: "*", // En producción, cambia '*' por la URL de tu frontend.
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});


// --- RUTAS DE LA APLICACIÓN ---

// Rutas de usuario
fastify.register(userRoutes, { prefix: "/api/user" });

// Rutas de las historias
fastify.register(storyRoutes, { prefix: "/api/stories" });

// Rutas de interacciones
fastify.register(interactionRoutes, { prefix: "/api/interactions" });

// Iniciar el servidor
fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server ejecutándose en ${address}`);
});