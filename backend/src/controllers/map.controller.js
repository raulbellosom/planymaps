import { db } from "../lib/db.js";

// Crear un nuevo mapa
export const createMap = async (req, res) => {
  const user = req.user;
  const { name, description, imageUrl, visibility, templateId } = req.body;
  try {
    const map = await db.map.create({
      data: {
        name,
        description,
        imageUrl,
        visibility,
        templateId,
        createdById: user.id,
      },
    });

    res.status(201).json(map);
  } catch (error) {
    console.log("Error on createMap", error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los mapas
export const getMaps = async (req, res) => {
  try {
    const maps = await db.map.findMany({
      where: {
        enabled: true,
        createdById: req.user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        createdById: true,
        templateId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.status(200).json(maps);
  } catch (error) {
    console.log("Error on getMaps", error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener un mapa por ID
export const getMapById = async (req, res) => {
  const { id } = req.params;

  try {
    const map = await db.map.findUnique({ where: { id } });

    if (!map) {
      return res.status(404).json({ message: "Map not found" });
    }

    res.status(200).json(map);
  } catch (error) {
    console.log("Error on getMapById", error);
    res.status(500).json({ message: error.message });
  }
};

// Actualizar un mapa
export const updateMap = async (req, res) => {
  const { id } = req.params;
  const { name, description, imageUrl, visibility } = req.body;

  try {
    const map = await db.map.update({
      where: { id },
      data: { name, description, imageUrl, visibility },
    });

    res.status(200).json(map);
  } catch (error) {
    console.log("Error on updateMap", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteMap = async (req, res) => {
  const { id } = req.params;

  try {
    await db.map.update({
      where: { id },
      data: { enabled: false },
    });
    res.status(204).send();
  } catch (error) {
    console.log("Error on deleteMap", error);
    res.status(500).json({ message: error.message });
  }
};
