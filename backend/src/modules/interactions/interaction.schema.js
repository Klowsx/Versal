const properties = {
  interaction: {
    type: "object",
    properties: {
      _id: { type: "string", format: "uuid" },
      contentId: { type: "string", format: "uuid" },
      onModel: { type: "string", enum: ["Story", "Chapter"] },
      userId: { type: "string", format: "uuid" },
      interactionType: { type: "string", enum: ["like", "comment"] },
      text: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
};

const headers = {
  type: "object",
  properties: {
    authorization: { type: "string" },
  },
  required: ["authorization"],
};

const addInteractionSchema = {
  tags: ["Interactions"],
  description: "Añade un like o un comentario a una historia o capítulo.",
  headers,
  params: {
    type: "object",
    properties: {
      id: { type: "string", description: "ID de la Historia o Capítulo" },
    },
    required: ["id"],
  },
  body: {
    type: "object",
    required: ["onModel", "interactionType"],
    properties: {
      onModel: { type: "string", enum: ["Story", "Chapter"] },
      interactionType: { type: "string", enum: ["like", "comment"] },
      text: { type: "string", description: 'Requerido si interactionType es "comment"' },
    },
  },
  response: {
    201: {
      description: "Interacción creada exitosamente",
      type: "object",
      properties: {
        status: { type: "string" },
        comment: properties.interaction,
        like: properties.interaction,
      },
    },
  },
};

const getInteractionsSchema = {
  tags: ["Interactions"],
  description: "Obtiene los likes y comentarios de una historia o capítulo.",
  params: {
    type: "object",
    properties: {
      id: { type: "string", description: "ID de la Historia o Capítulo" },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        likesCount: { type: "number" },
        comments: {
          type: "array",
          items: properties.interaction,
        },
      },
    },
  },
};

const deleteInteractionSchema = {
  tags: ["Interactions"],
  description: "Elimina una interacción (like o comentario).",
  headers,
  params: {
    type: "object",
    properties: {
      interactionId: { type: "string", description: "ID de la interacción a eliminar" },
    },
    required: ["interactionId"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
    },
  },
};

module.exports = {
  addInteractionSchema,
  getInteractionsSchema,
  deleteInteractionSchema,
};
