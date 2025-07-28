const Chapter = require("../../models/chapter.model");
const { Story } = require("../../models/story.model");
const Interaction = require("../../models/interaction.model");
const fs = require("fs");
const util = require("util");
const path = require("path");
const { pipeline } = require("stream");
const pump = util.promisify(pipeline);

// Servicio para crear un nuevo capítulo
async function createChapter(fullChapterData) {
  const newChapter = await Chapter.create(fullChapterData);
  if (!newChapter) {
    throw new Error("La creación del capítulo falló.");
  }

  await Story.findByIdAndUpdate(fullChapterData.story, {
    $push: { chapters: newChapter._id },
  });

  return newChapter;
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
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) {
    throw new Error("Capítulo no encontrado");
  }

  // Luego, lo eliminamos
  await Chapter.findByIdAndDelete(chapterId);

  await Story.findByIdAndUpdate(chapter.story, {
    $pull: { chapters: chapterId },
  });

  return chapter;
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
