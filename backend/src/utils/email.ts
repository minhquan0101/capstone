import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // dùng STARTTLS (587)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // ⚠ Chỉ nên dùng khi DEV local, bỏ kiểm tra cert để tránh lỗi
    // "self-signed certificate in certificate chain"
    rejectUnauthorized: false,
  },
});

// Kiểm tra kết nối SMTP khi server khởi động
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to take our messages");
  }
});

export async function sendVerificationEmail(to: string, code: string) {
  const appName = process.env.APP_NAME || "Capstone App";
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "";

  const text = `Mã xác minh email của bạn là: ${code}. Mã có hiệu lực trong 15 phút.`;
  const html = `
    <p>Xin chào,</p>
    <p>Mã xác minh email của bạn là: <b>${code}</b></p>
    <p>Mã có hiệu lực trong 15 phút.</p>
  `;

  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: "Mã xác minh email",
      text,
      html,
    });
    console.log("Verification email sent to", to);
  } catch (err) {
    console.error("Send verification email error:", err);
  }
}
