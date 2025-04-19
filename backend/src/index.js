import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import pingRoutes from "./routes/ping.routes.js";
import permissionRoutes from "./routes/permission.routes.js";
import roleRoutes from "./routes/role.routes.js";
import rolePermissionRoutes from "./routes/rolePermission.routes.js";
import routes from "./routes/routes.js";

dotenv.config();

const app = express();
const APP_URL = process.env.APP_URL || "http://localhost:5173";

console.log("APP_URL", APP_URL);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors([APP_URL]));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/role-permissions", rolePermissionRoutes);
app.use("/api/ping", pingRoutes);
app.use("/api", routes);
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
