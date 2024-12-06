// middleware/authorization.js
import { db } from "../lib/db.js";

export const verifyRole = (entity, action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Busca al usuario y su rol
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      next();
    } catch (error) {
      console.log("error on verifyRole", error);
      res.status(500).json({ message: error.message });
    }
  };
};
