// Versal/backend/src/modules/chapters/chapter.service.js
const Chapter = require("../../models/chapter.model");
const { Story } = require("../../models/story.model");
const Interaction = require("../../models/interaction.model");
const fs = require("fs"); // Importar fs para operaciones de archivo
const util = require("util"); // Importar util
const path = require("path"); // Importar path
const { pipeline } = require("stream"); // Importar pipeline
const pump = util.promisify(pipeline); // Promisificar pipeline para usar async/await

// Función para crear un nuevo capítulo
async function createChapter(storyId, chapterData) {
  try {
    const story = await Story.findById(storyId);
    if (!story) {
      return { error: "La historia a la que intentas añadir el capítulo no existe." };
    }

    const lastChapter = await Chapter.findOne({ story: storyId }).sort({ chapterNumber: -1 });
    const newChapterNumber = lastChapter ? lastChapter.chapterNumber + 1 : 1;

    const newChapter = new Chapter({
      ...chapterData,
      story: storyId,
      chapterNumber: newChapterNumber,
    });

    await newChapter.save();

    story.chapterCount = await Chapter.countDocuments({ story: storyId });
    await story.save();

    return { chapter: newChapter };
  } catch (error) {
    console.error("Error al crear el capítulo:", error);
    return { error: "Ocurrió un error al crear el capítulo." };
  }
}

// Obtenemos todos los capítulos de una historia
async function getChaptersByStory(storyId) {
  try {
    const chapters = await Chapter.find({ story: storyId }).sort({ chapterNumber: "asc" }).lean();
    return { chapters };
  } catch (error) {
    console.error("Error al obtener los capítulos:", error);
    return { error: "No se pudieron obtener los capítulos de la historia." };
  }
}

// Obtenemos un capítulo por su ID
async function getChapterById(chapterId) {
  try {
    const chapter = await Chapter.findById(chapterId).populate("story", "title author").lean();

    if (!chapter) {
      return { error: "Capítulo no encontrado." };
    }
    return { chapter };
  } catch (error) {
    return { error: "Error al obtener el capítulo." };
  }
}

// Actualizamos un capítulo por su ID
async function updateChapter(chapterId, updateData) {
  try {
    const updatedChapter = await Chapter.findByIdAndUpdate(chapterId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedChapter) {
      return { error: "Capítulo no encontrado." };
    }

    if (updateData.status === "published") {
      await Story.updateOne({ _id: updatedChapter.story }, { status: "published" });
    }

    return { chapter: updatedChapter };
  } catch (error) {
    console.error("Error al actualizar el capítulo:", error);
    return { error: "Ocurrió un error al actualizar el capítulo." };
  }
}

// Eliminamos un capítulo por su ID
async function deleteChapter(chapterId) {
  try {
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return { error: "Capítulo no encontrado." };
    }
    const storyId = chapter.story;

    await Interaction.deleteMany({ contentId: chapterId });

    await Chapter.findByIdAndDelete(chapterId);

    const story = await Story.findById(storyId);
    if (story) {
      story.chapterCount = await Chapter.countDocuments({ story: storyId });
      await story.save();
    }

    return { message: "Capítulo eliminado exitosamente." };
  } catch (error) {
    console.error("Error al eliminar el capítulo:", error);
    return { error: "Ocurrió un error al eliminar el capítulo." };
  }
}

// Función para subir una imagen de capítulo
async function uploadChapterImage(file, req) {
  try {
    const uploadDir = path.join(__dirname, "../../../uploads/chapters");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}-${file.filename}`;
    const uploadPath = path.join(uploadDir, uniqueFilename);

    await pump(file.file, fs.createWriteStream(uploadPath));

    const imageUrl = `${req.protocol}://${req.headers.host}/uploads/chapters/${uniqueFilename}`;

    return { url: imageUrl };
  } catch (error) {
    console.error("Error al subir la imagen del capítulo:", error);
    return { error: `Error al subir la imagen: ${error.message}` };
  }
}

module.exports = {
  createChapter,
  getChaptersByStory,
  getChapterById,
  updateChapter,
  deleteChapter,
  uploadChapterImage, // Exportar la nueva función
};
