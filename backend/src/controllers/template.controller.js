import { db } from "../lib/db.js";

// Crear una nueva plantilla
export const createTemplate = async (req, res) => {
  const { name, description, imageUrl, visibility, createdById } = req.body;

  try {
    const template = await db.template.create({
      data: {
        name,
        description,
        imageUrl,
        visibility,
        createdById,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todas las plantillas
export const getTemplates = async (req, res) => {
  try {
    const templates = await db.template.findMany();
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una plantilla por ID
export const getTemplateById = async (req, res) => {
  const { id } = req.params;

  try {
    const template = await db.template.findUnique({ where: { id } });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.status(200).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar una plantilla
export const updateTemplate = async (req, res) => {
  const { id } = req.params;
  const { name, description, imageUrl, visibility } = req.body;

  try {
    const template = await db.template.update({
      where: { id },
      data: { name, description, imageUrl, visibility },
    });

    res.status(200).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar una plantilla
export const deleteTemplate = async (req, res) => {
  const { id } = req.params;

  try {
    await db.template.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
