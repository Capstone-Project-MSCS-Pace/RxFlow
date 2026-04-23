import { Sequelize } from "sequelize";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Sequelize instance at module load
const dialectOptions = {};

// Add SSL configuration for AWS RDS
if (process.env.DB_HOST && process.env.DB_HOST.includes("rds.amazonaws.com")) {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false,
  };

  // Add certificate if available
  const certPath = path.join(__dirname, "..", "certs", "global-bundle.pem");
  if (fs.existsSync(certPath)) {
    dialectOptions.ssl.ca = fs.readFileSync(certPath).toString();
  }
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

const ensureSchemaFromDdl = async () => {
  const result = await sequelize.query(
    `SELECT to_regclass('public.role') AS role_table`,
  );
  const roleTable = result?.[0]?.[0]?.role_table;

  if (roleTable) {
    return;
  }

  const ddlPath = path.join(__dirname, "..", "models", "schema", "schema_ddl.sql");
  const ddl = fs.readFileSync(ddlPath, "utf8");
  await sequelize.query(ddl);
};

const ensureDefaultPharmacy = async () => {
  const activeStatusResult = await sequelize.query(
    `SELECT id FROM pharmacy_status WHERE lower(status) = 'active' LIMIT 1`,
  );
  const activeStatusId = activeStatusResult?.[0]?.[0]?.id;

  if (!activeStatusId) {
    throw new Error("Active pharmacy status is missing from pharmacy_status.");
  }

  const pharmacyResult = await sequelize.query(
    `SELECT pharmacy_id FROM pharmacy ORDER BY pharmacy_id ASC LIMIT 1`,
  );
  const existingPharmacyId = pharmacyResult?.[0]?.[0]?.pharmacy_id;

  if (existingPharmacyId) {
    return existingPharmacyId;
  }

  const insertResult = await sequelize.query(
    `
      INSERT INTO pharmacy (name, license_number, subscription_tier, status_id)
      VALUES ('RxFlow Demo Pharmacy', 'RXFLOW-DEMO-LICENSE', 'Standard', ${Number(activeStatusId)})
      RETURNING pharmacy_id
    `,
  );

  return insertResult?.[0]?.[0]?.pharmacy_id || null;
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`PostgreSQL Connected: ${process.env.DB_HOST}`);

    await ensureSchemaFromDdl();
    await ensureDefaultPharmacy();
    console.log("Database ready using strict DDL tables");

    return sequelize;
  } catch (error) {
    console.error(`Error connecting to PostgreSQL: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
export { sequelize };
