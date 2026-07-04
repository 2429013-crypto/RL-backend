const fs = require("fs");
const path = require("path");

// cleans dangerous characters so usertyped text can never break the email's HTML like hospital
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function loadHtmlTemplate() {
  const filePath = path.join(__dirname, "fulfilledTemplate.html");
  return fs.readFileSync(filePath, "utf-8");
}

function fulfilledTemplate({ patientName, hospitalName, bloodGroup, unitsNeeded }) {
  const currentYear = new Date().getFullYear();
  let html = loadHtmlTemplate();

  html = html.replace(/{{PATIENT_NAME}}/g, escapeHtml(patientName));
  html = html.replace(/{{HOSPITAL_NAME}}/g, escapeHtml(hospitalName));
  html = html.replace(/{{BLOOD_GROUP}}/g, escapeHtml(bloodGroup));
  html = html.replace(/{{UNITS_NEEDED}}/g, escapeHtml(unitsNeeded));
  html = html.replace(/{{YEAR}}/g, currentYear);

  return html;
}

module.exports = { fulfilledTemplate };