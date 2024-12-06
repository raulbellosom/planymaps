import { db } from "../lib/db.js";

// Crear una nueva capa
export const createLayer = async (req, res) => {
  const { layerData } = req.body;
  const { name, mapId, order } = JSON.parse(layerData);

  const layers = await db.layer.findMany({ where: { mapId } });
  const layerName = name?.length > 0 ? name : `Capa ${layers.length + 1}`;
  try {
    const layer = await db.layer.create({
      data: {
        name: layerName,
        mapId,
        order: parseInt(order, 10),
      },
    });

    if (req.processedFiles) {
      const file = req.processedFiles;
      const image = {
        url: file.url,
        filetype: file.type,
        metadata: file.metadata,
        thumbnail: file.thumbnail,
        layerId: layer.id,
      };

      await db.image.createMany({ data: image });
    }

    const allLayers = await db.layer.findMany({
      where: { mapId },
      include: { image: true },
    });

    res.status(201).json({ data: allLayers });
  } catch (error) {
    console.log("Error on createLayer", error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener todas las capas
export const getLayers = async (req, res) => {
  try {
    const id = req.params.id;
    const layers = await db.layer.findMany({
      where: { mapId: id },
      include: { image: true },
    });
    res.status(200).json(layers);
  } catch (error) {
    console.log("Error on getLayers", error);
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
    console.log("Error on getLayerById", error);
    res.status(500).json({ message: error.message });
  }
};

// Actualizar una capa
export const updateLayer = async (req, res) => {
  const { id } = req.params;
  const { layerData } = req.body;
  const { name, mapId, order } = JSON.parse(layerData);
  try {
    const layerExists = await db.layer.findUnique({ where: { id } });

    if (!layerExists) {
      console.log("Layer not found");
      return res.status(404).json({ message: "Layer not found" });
    }

    const layers = await db.layer.findMany({ where: { mapId } });
    const layerName = name?.length > 0 ? name : `Capa ${layers.length + 1}`;

    const layer = await db.layer.update({
      where: { id },
      data: { name: layerName, order: parseInt(order, 10) },
    });

    if (req.processedFiles) {
      // Eliminar la imagen anterior
      await db.image.deleteMany({ where: { layerId: id } });

      const file = req.processedFiles;
      const image = {
        url: file.url,
        filetype: file.type,
        metadata: file.metadata,
        thumbnail: file.thumbnail,
        layerId: layer.id,
      };

      await db.image.createMany({ data: image });
    }

    const allLayers = await db.layer.findMany({
      where: { mapId },
      include: { image: true },
    });

    res.status(200).json({ data: allLayers });
  } catch (error) {
    console.log("Error on updateLayer", error);
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
    console.log("Error on deleteLayer", error);
    res.status(500).json({ message: error.message });
  }
};

// Actualizar el orden de las capas
export const updateLayersOrder = async (req, res) => {
  const layers = req.body;

  try {
    const promises = layers.map(async (layer, index) => {
      await db.layer.update({
        where: { id: layer.id },
        data: { order: index },
      });
    });

    await Promise.all(promises);

    res.status(200).send();
  } catch (error) {
    console.log("Error on updateLayersOrder", error);
    res.status(500).json({ message: error.message });
  }
};
