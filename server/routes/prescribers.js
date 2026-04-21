import express from "express";
import {
  createPrescriber,
  listPrescribers,
} from "../controllers/prescriberController.js";
import { authorize, verifyToken } from "../middleware/auth.js";

const router = express.Router();

export const routeConfig = {
  basePath: "/api/prescribers",
  module: "Prescribers",
};

router.get("/", verifyToken, listPrescribers);

router.post(
  "/",
  verifyToken,
  authorize(["pharmacist", "admin"]),
  createPrescriber,
);

export default router;
