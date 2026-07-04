const fs = require("fs");
const path = require("path");

// Cleans dangerous characters so user-typed text can never break the email's HTML
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
  const filePath = path.join(__dirname, "acceptedTemplate.html");
  return fs.readFileSync(filePath, "utf-8");
}

function acceptedTemplate({
  requesterName,
  donorName,
  donorBloodGroup,
  donorPhone,
  patientName,
  hospitalName,
  contactNumber,
  serialNumber,
  totalDonors,
  unitsNeeded,
}) {
  const currentYear = new Date().getFullYear();
  const progressPercent = Math.min(
    Math.round((totalDonors / unitsNeeded) * 100),
    100,
  );

  let html = loadHtmlTemplate();

  html = html.replace("{{REQUESTER_NAME}}", escapeHtml(requesterName));
  html = html.replace("{{DONOR_NAME}}", escapeHtml(donorName));
  html = html.replace("{{DONOR_BLOOD_GROUP}}", escapeHtml(donorBloodGroup));
  html = html.replace("{{SERIAL_NUMBER}}", escapeHtml(serialNumber));
  html = html.replace(/{{UNITS_NEEDED}}/g, escapeHtml(unitsNeeded));
  html = html.replace("{{PATIENT_NAME}}", escapeHtml(patientName));
  html = html.replace("{{HOSPITAL_NAME}}", escapeHtml(hospitalName));
  html = html.replace("{{DONOR_PHONE}}", escapeHtml(donorPhone || "Not provided"));
html = html.replace("{{CONTACT_NUMBER}}", escapeHtml(contactNumber || "Not provided"));
  html = html.replace("{{YEAR}}", currentYear);

  const progressBar = `
<div style="width:100%;margin:20px 0 28px 0;box-sizing:border-box;">
  <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">
    Donors confirmed:
    <strong style="color: #111827;">
      ${escapeHtml(totalDonors)} of ${escapeHtml(unitsNeeded)}
    </strong>
  </div>

  <div style="background:#f3f4f6;border-radius:999px;height:8px;overflow:hidden;">
    <div
      style="
        background:#dc2626;
        height:8px;
        border-radius:999px;
        width:${progressPercent}%;
      "
    ></div>
  </div>
</div>
`;

  html = html.replace("{{PROGRESS_BAR}}", progressBar);

  return html;
}

module.exports = { acceptedTemplate };
