const story = require("./storyCreation.model") 

async function createStory(request, reply) {
    try{
        const {
            title,
            descripcion,
            coverImage,
            personajePrincipales,
            categoria,
            etiquetas,
            audiencia,
            idioma,
            derechos,
            clasificacion
        } = request.body

        const nuevaStory = await story.create({
            title,
            descripcion,
            coverImage,
            personajePrincipales,
            categoria,
            etiquetas,
            audiencia,
            idioma,
            derechos,
            clasificacion
        });

        return reply.status(201).send({
            message: "Historia creada con exito",
            story: nuevaStory
        })
    } catch (err) {
        console.error("Error al crear historia", err);
        return reply.status(500).send({
            message: "Error del servidor al crear historia, intente mas tarde"
        });
    }
}

module.exports = {createStory};

