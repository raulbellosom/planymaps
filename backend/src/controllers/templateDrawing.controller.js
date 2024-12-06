import { db } from "../lib/db.js";

// Crear un nuevo dibujo de plantilla
export const createTemplateDrawing = async (req, res) => {
  const { type, data, templateLayerId } = req.body;

  try {
    const templateDrawing = await db.templateDrawing.create({
      data: {
        type,
        data,
        templateLayerId,
      },
    });

    res.status(201).json(templateDrawing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los dibujos de plantilla
export const getTemplateDrawings = async (req, res) => {
  try {
    const templateDrawings = await db.templateDrawing.findMany();
    res.status(200).json(templateDrawings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un dibujo de plantilla por ID
export const getTemplateDrawingById = async (req, res) => {
  const { id } = req.params;

  try {
    const templateDrawing = await db.templateDrawing.findUnique({
      where: { id },
    });

    if (!templateDrawing) {
      return res.status(404).json({ message: "TemplateDrawing not found" });
    }

    res.status(200).json(templateDrawing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar un dibujo de plantilla
export const updateTemplateDrawing = async (req, res) => {
  const { id } = req.params;
  const { type, data } = req.body;

  try {
    const templateDrawing = await db.templateDrawing.update({
      where: { id },
      data: { type, data },
    });

    res.status(200).json(templateDrawing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar un dibujo de plantilla
export const deleteTemplateDrawing = async (req, res) => {
  const { id } = req.params;

  try {
    await db.templateDrawing.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
