import express from "express";
import {
  createPrescriber,
  deletePrescriber,
  listPrescribers,
  updatePrescriber,
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

router.patch(
  "/:id",
  verifyToken,
  authorize(["pharmacist", "admin"]),
  updatePrescriber,
);

router.delete(
  "/:id",
  verifyToken,
  authorize(["pharmacist", "admin"]),
  deletePrescriber,
);

export default router;
