import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Prescriber = sequelize.define(
  "Prescriber",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "prescriber_id",
    },
    npi: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "npi_number",
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
    contact: {
      type: DataTypes.STRING,
      field: "contact_details",
    },
    name: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.firstName || ""} ${this.lastName || ""}`.trim();
      },
      set(value) {
        const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
        this.setDataValue("firstName", parts.shift() || "Unknown");
        this.setDataValue("lastName", parts.join(" ") || "Prescriber");
      },
    },
    email: {
      type: DataTypes.VIRTUAL,
      get() {
        return null;
      },
    },
  },
  {
    tableName: "prescriber",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

export default Prescriber;
