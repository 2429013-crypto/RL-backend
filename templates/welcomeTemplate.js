const path = require("path");
const fs = require("fs");

const welcomeTemplate = (email) => {
  const templatePath = path.join(__dirname, "welcomeTemplate.html");
  let html = fs.readFileSync(templatePath, "utf-8");
  html = html.replace("{{EMAIL}}", email);
  html = html.replace("{{YEAR}}", new Date().getFullYear());
  return html;
};

module.exports = { welcomeTemplate };