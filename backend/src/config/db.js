const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log("✅ MongoDB conectado");
  } catch (err) {
    console.error("❌ Error de conexion en MongoDB", err);
    process.exit(1);
  }
}

module.exports = connectDB;
