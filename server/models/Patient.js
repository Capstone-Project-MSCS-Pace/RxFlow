import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import { getDefaultPharmacyId } from "../services/schemaCompatService.js";

const Patient = sequelize.define(
  "Patient",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "patient_id",
    },
    pharmacyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "pharmacy_id",
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "last_name",
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "dob",
    },
  },
  {
    tableName: "patient",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

Patient.beforeValidate(async (patient) => {
  if (!patient.pharmacyId) {
    const pharmacyId = await getDefaultPharmacyId();
    if (!pharmacyId) {
      throw new Error("At least one pharmacy row must exist before creating patients.");
    }
    patient.pharmacyId = pharmacyId;
  }
});

export default Patient;
