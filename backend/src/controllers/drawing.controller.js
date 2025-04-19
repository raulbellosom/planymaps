import { db } from "../lib/db.js";

/**
 * Crear un nuevo trazo para una capa específica.
 * @param {Request} req
 * @param {Response} res
 */
export const createDrawing = async (req, res) => {
  const { layerId, type, data } = req.body;

  if (!layerId || !type || !data) {
    return res
      .status(400)
      .json({ error: "Faltan campos requeridos: layerId, type o data." });
  }

  try {
    // Verificar que la capa exista
    const layer = await db.layer.findFirst({ where: { id: layerId } });
    if (!layer) {
      return res.status(404).json({ error: "La capa no existe." });
    }

    // Eliminar todos los trazos anteriores asociados a la capa
    await db.drawing.deleteMany({ where: { layerId } });
    // Crear el nuevo trazo
    await db.drawing.create({
      data: {
        type,
        data,
        layerId,
      },
    });

    // Obtener la capa con el nuevo trazo e imágenes actualizados
    const updatedLayer = await db.layer.findFirst({
      where: { id: layerId },
      include: {
        drawings: true,
        image: true,
      },
    });

    res.status(201).json(updatedLayer);
  } catch (error) {
    console.error("Error al crear el trazo:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

/**
 * Actualizar un trazo existente.
 * @param {Request} req
 * @param {Response} res
 */
export const updateDrawing = async (req, res) => {
  const { id } = req.params;
  const { type, data } = req.body;

  if (!type && !data) {
    return res
      .status(400)
      .json({ error: "No hay nada que actualizar. Proporcione type o data." });
  }

  try {
    // Verificar que el trazo exista
    const drawing = await db.drawing.findFirst({ where: { id } });
    if (!drawing) {
      return res.status(404).json({ error: "El trazo no existe." });
    }

    // Actualizar el trazo
    const updatedDrawing = await db.drawing.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(data && { data }),
      },
    });

    res.status(200).json(updatedDrawing);
  } catch (error) {
    console.error("Error al actualizar el trazo:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

/**
 * Eliminar un trazo por su ID.
 * @param {Request} req
 * @param {Response} res
 */
export const deleteDrawing = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que el trazo exista
    const drawing = await db.drawing.findFirst({ where: { id } });
    if (!drawing) {
      return res.status(404).json({ error: "El trazo no existe." });
    }

    // Eliminar el trazo
    await db.drawing.delete({ where: { id } });

    res.status(200).json({ message: "El trazo se eliminó correctamente." });
  } catch (error) {
    console.error("Error al eliminar el trazo:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

/**
 * Eliminar todos los trazos de una capa específica.
 * @param {Request} req
 * @param {Response} res
 */
export const deleteAllDrawingsByLayer = async (req, res) => {
  const { layerId } = req.params;

  try {
    // Verificar que la capa exista
    const layer = await db.layer.findFirst({ where: { id: layerId } });
    if (!layer) {
      return res.status(404).json({ error: "La capa no existe." });
    }

    // Eliminar todos los trazos asociados a la capa
    await db.drawing.deleteMany({ where: { layerId } });

    res.status(200).json({
      message: "Todos los trazos de la capa se eliminaron correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar los trazos de la capa:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};
