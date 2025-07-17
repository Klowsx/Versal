const mongoose = require("mongoose");

const storycreationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            default: 'historia sin titulo'
        },
        descripcion: {
            type: String,
            maxlength: 2000
        },
        coverImage: {
            type: String
        },
        personajePrincipales: [{
            name: {type: String, required: true}
        }],
        categoria: {
            type: String,
            enum: [
                "Accion",
                "Aventura",
                "Romance",
                "Chick-lit",
                "Ciencia ficcion",
                "De todo",
                "Espiritual",
                "FanFiction",
                "Fantasia",
                "Ficcion general",
                "Ficcion historica",
                "Historia corta",
                "Hombres lobo",
                "Humor",
                "Misterio/Suspenso",
                "No ficcion",
                "Novela juvenil",
                "Paranormal",
                "Poesia",
                "Romance",
                "Terror",
                "Vampiros"
            ]
        },
        etiquetas: [{type: String}],
        audiencia: {
            type: String,
            enum: [
                "Juvenil",
                "Jovenes Adultos",
                "Adultos"
            ]
        },
        idioma: {
            type: String,
        },
        derechos: {
            type: String,
        },
        clasificacion: {
            type: Boolean,
            default: false
        },
 
    },{timestamps: true}    
);

module.exports = mongoose.model("storyCreation", storycreationSchema);
