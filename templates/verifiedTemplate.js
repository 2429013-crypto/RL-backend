const fs = require("fs");
const path = require("path");

function loadHtmlTemplate() {
  const filePath = path.join(__dirname, "verifiedTemplate.html");
  return fs.readFileSync(filePath, "utf-8");
}

function verifiedTemplate() {
  const currentYear = new Date().getFullYear();
  let html = loadHtmlTemplate();
  html = html.replace("{{YEAR}}", currentYear);
  return html;
}

module.exports = { verifiedTemplate };
