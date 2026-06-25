const fs = require("fs");
const path = require("path");


//  build one digit box 

function createDigitBox(digit) {
  return `
    <td style="
      width: 44px;
      height: 52px;
      background: white;
      border: 2px solid #dc2626;
      border-radius: 8px;
      text-align: center;
      font-size: 22px;
      font-weight: 700;
      color: #dc2626;
      line-height: 52px;
    ">
      ${digit}
    </td>
  `;
}


// build all digit boxes from the OTP


function createAllDigitBoxes(otp) {
  const digits = otp.split("");
  return digits.map(createDigitBox).join("");
}


//  load the html template from file

function loadHtmlTemplate() {
  const filePath = path.join(__dirname, "otpTemplate.html");
  return fs.readFileSync(filePath, "utf-8");
}

//  main function — combines everything

function otpTemplate(otp) {
  const digitBoxesHtml = createAllDigitBoxes(otp);
  const currentYear = new Date().getFullYear();

  let html = loadHtmlTemplate();

  html = html.replace("{{OTP_DIGIT_BOXES}}", digitBoxesHtml);
  html = html.replace("{{YEAR}}", currentYear);

  return html;
}

module.exports = { otpTemplate };