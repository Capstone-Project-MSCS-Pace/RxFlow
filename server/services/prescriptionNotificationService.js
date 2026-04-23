import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const DEFAULT_PRESCRIBER_EMAIL = "aditya.srivastava@pace.edu";
const DEFAULT_FRONTEND_BASE_URL = "http://localhost:3000";
const DEFAULT_TOKEN_TTL_HOURS = 72;
const DEFAULT_SMTP_FROM = "no-reply@rxlfow.example.com";

const getFrontendBaseUrl = () =>
  (process.env.CLIENT_APP_BASE_URL || DEFAULT_FRONTEND_BASE_URL).replace(
    /\/+$/,
    "",
  );

const getTokenTtlHours = () => {
  const value = Number(process.env.PRESCRIPTION_REVIEW_TOKEN_TTL_HOURS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TOKEN_TTL_HOURS;
};

const hasSmtpConfig = () => Boolean(process.env.SMTP_HOST);

const resolveRecipientEmail = (prescriberEmail) => {
  const normalizedPrescriberEmail = String(prescriberEmail || "")
    .trim()
    .toLowerCase();

  if (normalizedPrescriberEmail) {
    return normalizedPrescriberEmail;
  }

  return String(
    process.env.PRESCRIPTION_REVIEW_FALLBACK_EMAIL || DEFAULT_PRESCRIBER_EMAIL,
  )
    .trim()
    .toLowerCase();
};

const createTransporter = () => {
  if (!hasSmtpConfig()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,
  });
};

export const generateReviewToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: `${getTokenTtlHours()}h`,
  });

export const buildReviewUrl = (token) => {
  const baseUrl = getFrontendBaseUrl();
  return `${baseUrl}/prescription-review?token=${encodeURIComponent(token)}`;
};

export const resolveReviewTokenRecord = async (token) => {
  const decoded = jwt.verify(String(token || ""), process.env.JWT_SECRET);
  return {
    id: `jwt:${decoded.prescriptionId}:${decoded.exp || "na"}`,
    prescriptionId: decoded.prescriptionId,
    recipientEmail: decoded.recipientEmail || null,
    recipientName: decoded.recipientName || null,
    sentAt: decoded.sentAt || null,
    expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : null,
    usedAt: null,
    decision: null,
  };
};

export const createPrescriptionReviewInvite = async ({
  prescriptionId,
  prescriberName,
  prescriberEmail,
  prescriptionSummary,
}) => {
  const recipientEmail = resolveRecipientEmail(prescriberEmail);
  const token = generateReviewToken({
    prescriptionId,
    recipientEmail,
    recipientName: prescriberName || "Prescriber",
    sentAt: new Date().toISOString(),
  });
  const reviewUrl = buildReviewUrl(token);

  const subject = `Prescription review request for ${prescriberName || "Prescriber"}`;
  const text = [
    "A new prescription is ready for your review.",
    "",
    `Prescriber: ${prescriberName || "Prescriber"}`,
    `Medication: ${prescriptionSummary?.medicationDisplay || "N/A"}`,
    `Quantity: ${prescriptionSummary?.quantityValue ?? "N/A"}`,
    `Patient: ${prescriptionSummary?.patientName || "N/A"}`,
    "",
    "Review link:",
    reviewUrl,
  ].join("\n");

  const transporter = createTransporter();
  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || DEFAULT_SMTP_FROM,
      to: recipientEmail,
      subject,
      text,
      html: `<p>${text.replace(/\n/g, "<br/>")}</p>`,
    });
  } else {
    console.log("[Prescription email stub]", {
      to: recipientEmail,
      subject,
      reviewUrl,
      prescriptionId,
    });
  }

  return {
    reviewToken: {
      id: `jwt:${prescriptionId}`,
      recipientEmail,
      recipientName: prescriberName || "Prescriber",
      expiresAt: new Date(Date.now() + getTokenTtlHours() * 60 * 60 * 1000),
    },
    reviewUrl,
    deliveryMode: transporter ? "smtp" : "stub",
    reviewRecord: {
      id: `jwt:${prescriptionId}`,
      recipientEmail,
      recipientName: prescriberName || "Prescriber",
      expiresAt: new Date(Date.now() + getTokenTtlHours() * 60 * 60 * 1000),
    },
  };
};
