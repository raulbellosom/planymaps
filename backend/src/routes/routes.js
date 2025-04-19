import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from "../controllers/template.controller.js";
import {
  createMap,
  getMaps,
  getMapById,
  updateMap,
  deleteMap,
} from "../controllers/map.controller.js";
import {
  createLayer,
  getLayers,
  getLayerById,
  updateLayer,
  deleteLayer,
  updateLayersOrder,
} from "../controllers/layer.controller.js";
import {
  createTemplateDrawing,
  getTemplateDrawings,
  getTemplateDrawingById,
  updateTemplateDrawing,
  deleteTemplateDrawing,
} from "../controllers/templateDrawing.controller.js";
import {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
} from "../controllers/contact.controller.js";
import {
  processImages,
  upload,
} from "../controllers/uploadImages.controller.js";
import {
  createDrawing,
  deleteAllDrawingsByLayer,
  deleteDrawing,
  updateDrawing,
} from "../controllers/drawing.controller.js";
const router = express.Router();

// Rutas para Template
router.post("/templates", protect, createTemplate);
router.get("/templates", protect, getTemplates);
router.get("/templates/:id", protect, getTemplateById);
router.put("/templates/:id", protect, updateTemplate);
router.delete("/templates/:id", protect, deleteTemplate);

// Rutas para Map
router.post("/maps", protect, upload.single("image"), processImages, createMap);
router.get("/maps", protect, getMaps);
router.get("/maps/:id", protect, getMapById);
router.put(
  "/maps/:id",
  protect,
  upload.single("image"),
  processImages,
  updateMap
);
router.delete("/maps/:id", protect, deleteMap);

// Rutas para Layer
router.post(
  "/layers",
  (req, res, next) => {
    req.imageType = "map";
    next();
  },
  upload.single("image"),
  processImages,
  protect,
  createLayer
);
router.put("/layers/order", protect, updateLayersOrder);
router.get("/layers/mapId/:id", protect, getLayers);
router.get("/layers/:id", protect, getLayerById);
router.put(
  "/layers/:id",
  (req, res, next) => {
    req.imageType = "map";
    next();
  },
  upload.single("image"),
  processImages,
  protect,
  updateLayer
);
router.delete("/layers/:id", protect, deleteLayer);

// Rutas para Drawing
router.post("/drawings", protect, createDrawing); // Crear un nuevo trazo
router.put("/drawings/:id", protect, updateDrawing); // Actualizar un trazo existente
router.delete("/drawings/:id", protect, deleteDrawing); // Eliminar un trazo por su ID
router.delete("/drawings/layer/:layerId", protect, deleteAllDrawingsByLayer); // Eliminar todos los trazos de una capa específica

// Rutas para TemplateDrawing
router.post("/templateDrawings", protect, createTemplateDrawing);
router.get("/templateDrawings", protect, getTemplateDrawings);
router.get("/templateDrawings/:id", protect, getTemplateDrawingById);
router.put("/templateDrawings/:id", protect, updateTemplateDrawing);
router.delete("/templateDrawings/:id", protect, deleteTemplateDrawing);

// Rutas para Contact
router.post("/contacts", protect, createContact);
router.get("/contacts", protect, getContacts);
router.get("/contacts/:id", protect, getContactById);
router.put("/contacts/:id", protect, updateContact);
router.delete("/contacts/:id", protect, deleteContact);

export default router;
