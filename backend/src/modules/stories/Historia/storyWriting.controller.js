const { default: mongoose } = require("mongoose");
const storywriting = require("./storyWriting.model");

async function writeStory(request, reply){
    try {
        const {title, 
        descripcion,
        storyId} = request.body

        const storywrite = await storywriting.create({
            title,
            descripcion,
            storyId
        });

        return reply.status(201).send({
            message: "Historia guardada con exito",
            storywriting: storywrite
        })

    
    } catch (error) {
        console.error("Error al crear historia", error);
        return reply.status(500).send({
            message: "Error del servidor al crear historia, intente mas tarde"
    });

    }
}

async function getLatestDraft(request, reply) {

    try {

        const { storyId } = request.params;
        const storyObjectId = new mongoose.Types.ObjectId(storyId);

        const ultimo = await storywriting.findOne({ storyId: storyObjectId, esBorrador: true}).sort({updatedAt: -1});

        if (!ultimo){
            return reply.status(404).send({message: "No se encontró borrador"});
        }

        return reply.send(ultimo);

    } catch (error) {
        console.error("Error al obtener borrador", error);
        return reply.status(500).send({message: "Error al buscar borrador"});
    }
    
}

module.exports = {writeStory, getLatestDraft};