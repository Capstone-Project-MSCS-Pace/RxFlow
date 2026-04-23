import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Patient from "./Patient.js";

const PatientAuditLog = sequelize.define(
  "PatientAuditLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "patient_id",
      references: {
        model: "patient",
        key: "patient_id",
      },
    },
    fieldName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "changed_by_user_id",
    },
  },
  {
    tableName: "patient_audit_logs",
    timestamps: true,
    createdAt: "createdat",
    updatedAt: false,
    underscored: false,
  },
);

PatientAuditLog.belongsTo(Patient, {
  foreignKey: "patientId",
  targetKey: "id",
  onDelete: "CASCADE",
});

export default PatientAuditLog;
