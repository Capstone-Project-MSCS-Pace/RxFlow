import { Op } from "sequelize";
import Prescriber from "../models/Prescriber.js";
import {
  buildActorContext,
  writeAuditLog,
} from "../services/auditLogService.js";

const toLimit = (value, fallback = 25, max = 100) =>
  Math.min(Math.max(Number(value) || fallback, 1), max);

export const listPrescribers = async (req, res) => {
  try {
    const limit = toLimit(req.query?.limit, 25, 100);
    const page = Math.max(Number(req.query?.page) || 1, 1);
    const q = String(req.query?.q || "").trim();

    const where = q
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${q}%` } },
            { contact: { [Op.iLike]: `%${q}%` } },
            { email: { [Op.iLike]: `%${q}%` } },
            { npi: { [Op.iLike]: `%${q}%` } },
          ],
        }
      : {};

    const { rows, count } = await Prescriber.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [["createdat", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.max(Math.ceil(count / limit), 1),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to list prescribers.",
    });
  }
};

export const createPrescriber = async (req, res) => {
  try {
    const { name, contact, email, npi } = req.body || {};

    if (!name || !contact || !email || !npi) {
      return res.status(400).json({
        success: false,
        message: "name, contact, email, and npi are required.",
      });
    }

    const normalizedNpi = String(npi).trim();
    if (!/^\d{10}$/.test(normalizedNpi)) {
      return res.status(400).json({
        success: false,
        message: "npi must be a 10-digit number.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await Prescriber.findOne({
      where: {
        [Op.or]: [{ email: normalizedEmail }, { npi: normalizedNpi }],
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          existing.email === normalizedEmail
            ? "A prescriber with this email already exists."
            : "A prescriber with this NPI already exists.",
      });
    }

    const prescriber = await Prescriber.create({
      name: String(name).trim(),
      contact: String(contact).trim(),
      email: normalizedEmail,
      npi: normalizedNpi,
    });

    return res.status(201).json({
      success: true,
      message: "Prescriber created successfully.",
      data: prescriber,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create prescriber.",
    });
  }
};

export const updatePrescriber = async (req, res) => {
  try {
    const { id } = req.params;
    const prescriber = await Prescriber.findByPk(id);

    if (!prescriber) {
      return res.status(404).json({
        success: false,
        message: "Prescriber not found.",
      });
    }

    const { name, contact, email, npi } = req.body || {};
    const updates = {};

    if (name !== undefined) {
      updates.name = String(name).trim();
    }

    if (contact !== undefined) {
      updates.contact = String(contact).trim();
    }

    if (email !== undefined) {
      updates.email = String(email).trim().toLowerCase();
    }

    if (npi !== undefined) {
      const normalizedNpi = String(npi).trim();
      if (!/^\d{10}$/.test(normalizedNpi)) {
        return res.status(400).json({
          success: false,
          message: "npi must be a 10-digit number.",
        });
      }
      updates.npi = normalizedNpi;
    }

    const nextEmail = updates.email ?? prescriber.email;
    const nextNpi = updates.npi ?? prescriber.npi;

    const existing = await Prescriber.findOne({
      where: {
        id: { [Op.ne]: id },
        [Op.or]: [{ email: nextEmail }, { npi: nextNpi }],
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          existing.email === nextEmail
            ? "A prescriber with this email already exists."
            : "A prescriber with this NPI already exists.",
      });
    }

    const before = prescriber.toJSON();
    await prescriber.update(updates);

    await writeAuditLog({
      entityType: "prescriber",
      entityId: prescriber.id,
      action: "updated",
      summary: `Updated prescriber ${prescriber.name}.`,
      metadata: {
        before,
        after: prescriber.toJSON(),
      },
      ...buildActorContext(req),
    });

    return res.status(200).json({
      success: true,
      message: "Prescriber updated successfully.",
      data: prescriber,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update prescriber.",
    });
  }
};

export const deletePrescriber = async (req, res) => {
  try {
    const { id } = req.params;
    const prescriber = await Prescriber.findByPk(id);

    if (!prescriber) {
      return res.status(404).json({
        success: false,
        message: "Prescriber not found.",
      });
    }

    const snapshot = prescriber.toJSON();
    await prescriber.destroy();

    await writeAuditLog({
      entityType: "prescriber",
      entityId: id,
      action: "deleted",
      summary: `Deleted prescriber ${snapshot.name}.`,
      metadata: snapshot,
      ...buildActorContext(req),
    });

    return res.status(200).json({
      success: true,
      message: "Prescriber deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete prescriber.",
    });
  }
};
