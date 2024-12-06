import { db } from "../lib/db.js";

// Crear una nueva capa
export const createLayer = async (req, res) => {
  const { name, mapId } = req.body;

  try {
    const layer = await db.layer.create({
      data: {
        name,
        mapId,
      },
    });

    res.status(201).json(layer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todas las capas
export const getLayers = async (req, res) => {
  try {
    const layers = await db.layer.findMany();
    res.status(200).json(layers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una capa por ID
export const getLayerById = async (req, res) => {
  const { id } = req.params;

  try {
    const layer = await db.layer.findUnique({ where: { id } });

    if (!layer) {
      return res.status(404).json({ message: "Layer not found" });
    }

    res.status(200).json(layer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar una capa
export const updateLayer = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const layer = await db.layer.update({
      where: { id },
      data: { name },
    });

    res.status(200).json(layer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar una capa
export const deleteLayer = async (req, res) => {
  const { id } = req.params;

  try {
    await db.layer.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
