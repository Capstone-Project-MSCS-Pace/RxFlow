import { Op } from "sequelize";
import Patient from "../models/Patient.js";
import PatientInsurance from "../models/PatientInsurance.js";
import AuditLog from "../models/AuditLog.js";
import {
  buildActorContext,
  writeAuditLog,
} from "../services/auditLogService.js";

const toLimit = (value, fallback = 25, max = 100) =>
  Math.min(Math.max(Number(value) || fallback, 1), max);

const toOffset = (page = 1, limit = 25) =>
  (Math.max(Number(page), 1) - 1) * limit;

const serializePatient = (patient) => {
  const plain = patient?.toJSON ? patient.toJSON() : patient;
  return {
    ...plain,
    patientNumber: `PT${String(plain.id || "").padStart(6, "0")}`,
    middleName: null,
    gender: null,
    email: null,
    phonePrimary: null,
    phoneSecondary: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    zipCode: null,
    mrn: null,
    notes: null,
  };
};

export const searchPatients = async (req, res) => {
  try {
    const { q: searchTerm = "", page = 1 } = req.query;
    const limit = toLimit(req.query.limit, 25, 100);
    const offset = toOffset(page, limit);

    const whereClause = searchTerm
      ? {
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${searchTerm}%` } },
            { lastName: { [Op.iLike]: `%${searchTerm}%` } },
          ],
        }
      : {};

    const { count, rows } = await Patient.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: rows.map(serializePatient),
      pagination: {
        total: count,
        page: Number(page),
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to search patients.",
    });
  }
};

export const getPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: serializePatient(patient),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get patient.",
    });
  }
};

export const createPatient = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth } = req.body || {};

    if (!firstName || !lastName || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: firstName, lastName, dateOfBirth.",
      });
    }

    const patient = await Patient.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      dateOfBirth: String(dateOfBirth).slice(0, 10),
    });

    await writeAuditLog({
      entityType: "patient",
      entityId: patient.id,
      action: "created",
      summary: `Created patient ${patient.firstName} ${patient.lastName}.`,
      metadata: serializePatient(patient),
      ...buildActorContext(req),
    });

    return res.status(201).json({
      success: true,
      message: "Patient created successfully.",
      data: serializePatient(patient),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create patient.",
    });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    const updates = {};
    if (req.body.firstName !== undefined) {
      updates.firstName = String(req.body.firstName).trim();
    }
    if (req.body.lastName !== undefined) {
      updates.lastName = String(req.body.lastName).trim();
    }
    if (req.body.dateOfBirth !== undefined) {
      updates.dateOfBirth = req.body.dateOfBirth
        ? String(req.body.dateOfBirth).slice(0, 10)
        : null;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one of: firstName, lastName, dateOfBirth.",
      });
    }

    const before = serializePatient(patient);
    await patient.update(updates);

    await writeAuditLog({
      entityType: "patient",
      entityId: patient.id,
      action: "updated",
      summary: `Updated patient ${patient.firstName} ${patient.lastName}.`,
      metadata: {
        before,
        after: serializePatient(patient),
      },
      ...buildActorContext(req),
    });

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully.",
      data: serializePatient(patient),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update patient.",
    });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    const snapshot = serializePatient(patient);
    await patient.destroy();

    await writeAuditLog({
      entityType: "patient",
      entityId: Number(id),
      action: "deleted",
      summary: `Deleted patient ${snapshot.firstName} ${snapshot.lastName}.`,
      metadata: snapshot,
      ...buildActorContext(req),
    });

    return res.status(200).json({
      success: true,
      message: "Patient deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete patient.",
    });
  }
};

export const getPatientAudits = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1 } = req.query;
    const limit = toLimit(req.query.limit, 25, 100);
    const offset = toOffset(page, limit);

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where: {
        entityTable: "patient",
        entityId: Number(patientId),
      },
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        patientId: Number(patientId),
        fieldName: "patient",
        oldValue: row.changes?.before ? JSON.stringify(row.changes.before) : null,
        newValue: row.changes?.after ? JSON.stringify(row.changes.after) : null,
        changedByUserId: row.userId,
        createdat: row.created_at,
      })),
      pagination: {
        total: count,
        page: Number(page),
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get patient audits.",
    });
  }
};

export const listPatientInsurances = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    const insurances = await PatientInsurance.findAll({
      where: { patient_id: id },
      order: [["insurance_id", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: insurances,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load patient insurance records.",
    });
  }
};

export const addPatientInsurance = async (req, res) => {
  try {
    const { id } = req.params;
    const { provider_name, member_id, bin_number, pcn_number } = req.body || {};

    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    if (!provider_name || !member_id || !bin_number) {
      return res.status(400).json({
        success: false,
        message: "provider_name, member_id, and bin_number are required.",
      });
    }

    const insurance = await PatientInsurance.create({
      patient_id: Number(id),
      provider_name: String(provider_name).trim(),
      member_id: String(member_id).trim(),
      bin_number: String(bin_number).trim(),
      pcn_number: pcn_number ? String(pcn_number).trim() : null,
    });

    await writeAuditLog({
      entityType: "insurance",
      entityId: insurance.insurance_id,
      action: "created",
      summary: `Added insurance ${insurance.provider_name} for patient ${patient.id}.`,
      metadata: insurance.toJSON(),
      ...buildActorContext(req),
    });

    return res.status(201).json({
      success: true,
      message: "Patient insurance added successfully.",
      data: insurance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add patient insurance.",
    });
  }
};

export const updatePatientInsurance = async (req, res) => {
  try {
    const { id, insuranceId } = req.params;
    const patient = await Patient.findByPk(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    const insurance = await PatientInsurance.findOne({
      where: {
        insurance_id: Number(insuranceId),
        patient_id: Number(id),
      },
    });

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: "Insurance record not found.",
      });
    }

    const updates = {};
    if (req.body.provider_name !== undefined) {
      updates.provider_name = String(req.body.provider_name).trim();
    }
    if (req.body.member_id !== undefined) {
      updates.member_id = String(req.body.member_id).trim();
    }
    if (req.body.bin_number !== undefined) {
      updates.bin_number = String(req.body.bin_number).trim();
    }
    if (req.body.pcn_number !== undefined) {
      updates.pcn_number = req.body.pcn_number
        ? String(req.body.pcn_number).trim()
        : null;
    }

    const nextProvider = updates.provider_name ?? insurance.provider_name;
    const nextMember = updates.member_id ?? insurance.member_id;
    const nextBin = updates.bin_number ?? insurance.bin_number;

    if (!nextProvider || !nextMember || !nextBin) {
      return res.status(400).json({
        success: false,
        message: "provider_name, member_id, and bin_number are required.",
      });
    }

    const before = insurance.toJSON();
    await insurance.update(updates);

    await writeAuditLog({
      entityType: "insurance",
      entityId: insurance.insurance_id,
      action: "updated",
      summary: `Updated insurance ${insurance.provider_name} for patient ${patient.id}.`,
      metadata: { before, after: insurance.toJSON() },
      ...buildActorContext(req),
    });

    return res.status(200).json({
      success: true,
      message: "Patient insurance updated successfully.",
      data: insurance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update patient insurance.",
    });
  }
};

export const deletePatientInsurance = async (req, res) => {
  try {
    const { id, insuranceId } = req.params;
    const patient = await Patient.findByPk(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    const insurance = await PatientInsurance.findOne({
      where: {
        insurance_id: Number(insuranceId),
        patient_id: Number(id),
      },
    });

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: "Insurance record not found.",
      });
    }

    const snapshot = insurance.toJSON();
    await insurance.destroy();

    await writeAuditLog({
      entityType: "insurance",
      entityId: Number(insuranceId),
      action: "deleted",
      summary: `Deleted insurance ${snapshot.provider_name} for patient ${patient.id}.`,
      metadata: snapshot,
      ...buildActorContext(req),
    });

    return res.status(200).json({
      success: true,
      message: "Patient insurance deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete patient insurance.",
    });
  }
};
