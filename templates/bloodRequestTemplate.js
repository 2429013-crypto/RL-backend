const fs = require("fs");
const path = require("path");

// Build priority badge 
function createPriorityBadge(priority) {
  const badges = {
    Emergency: `<span style="display: inline-block; background: #fef2f2; color: #dc2626; border: 1px solid #dc2626; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 20px; letter-spacing: 1px;">🚨 EMERGENCY</span>`,
    Medium: `<span style="display: inline-block; background: #fff7ed; color: #ea580c; border: 1px solid #ea580c; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 20px; letter-spacing: 1px;">⚠️ MEDIUM PRIORITY</span>`,
    Low: `<span style="display: inline-block; background: #f0fdf4; color: #16a34a; border: 1px solid #16a34a; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 20px; letter-spacing: 1px;">🟢 LOW PRIORITY</span>`,
  };
  return badges[priority] || badges["Low"];
}

// Format date — 
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// load hTML template from file
function loadHtmlTemplate() {
  const filePath = path.join(__dirname, "bloodRequestTemplate.html");
  return fs.readFileSync(filePath, "utf-8");
}

// Main function 
function bloodRequestTemplate({
  donorName,
  bloodGroup,
  patientName,
  hospitalName,
  location,
  unitsNeeded,
  requiredBy,
  priority,
  contactNumber,
  requestId,
  appUrl,
}) {
  const priorityBadge = createPriorityBadge(priority);
  const currentYear = new Date().getFullYear();

  let html = loadHtmlTemplate();
  html = html.replace(/{{DONOR_NAME}}/g, donorName);
  html = html.replace(/{{BLOOD_GROUP}}/g, bloodGroup);
  html = html.replace(/{{PATIENT_NAME}}/g, patientName);
  html = html.replace(/{{UNITS_NEEDED}}/g, unitsNeeded);
  html = html.replace(/{{HOSPITAL_NAME}}/g, hospitalName);
  html = html.replace(/{{LOCATION}}/g, location);
  html = html.replace(/{{REQUIRED_BY}}/g, formatDate(requiredBy));
  html = html.replace(/{{CONTACT_NUMBER}}/g, contactNumber);
  html = html.replace(/{{PRIORITY_BADGE}}/g, priorityBadge);
  html = html.replace(/{{APP_URL}}/g, appUrl);
  html = html.replace(/{{REQUEST_ID}}/g, requestId);
  html = html.replace(/{{YEAR}}/g, currentYear);
  return html;
}

module.exports = { bloodRequestTemplate };