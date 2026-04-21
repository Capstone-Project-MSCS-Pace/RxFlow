import { Op } from "sequelize";
import Prescriber from "../models/Prescriber.js";

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
