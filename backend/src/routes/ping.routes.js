import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();

const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    // sum 2 + 2 and return the result
    const ping = await prisma.$queryRaw`SELECT 2 + 2 AS result`;
    res.json(ping);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
