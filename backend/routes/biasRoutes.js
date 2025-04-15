import express from "express";
import { analyzeBias } from "../controllers/biasController.js";
const router = express.Router();

router.post("/analyze-bias", analyzeBias);

export default router;
