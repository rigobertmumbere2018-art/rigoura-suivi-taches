const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const ExcelJS = require("exceljs");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false }));

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BACKUP_API_TOKEN;
const RECIPIENTS = ["Rigobertmumbere2018@gmail.com", "Ourebiaccessible@gmail.com"];

function auth(req, res, next) {
  const supplied = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!TOKEN || supplied.length !== TOKEN.length ||
      !require("crypto").timingSafeEqual(Buffer.from(supplied), Buffer.from(TOKEN))) {
    return res.status(401).json({ error: "Accès refusé : jeton API invalide." });
  }
  next();
}
function dateLabel(value) {
  if (!value) return "";
  const d = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(d.getTime()) ? String(value) : new Intl.DateTimeFormat("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" }).format(d);
}
app.get("/health", (_req, res) => res.json({ ok: true, service: "Rigoura backup mailer" }));
app.post("/api/send-backup", auth, async (req, res) => {
  try {
    const tasks = req.body && req.body.tasks;
    if (!Array.isArray(tasks) || tasks.length > 5000) return res.status(400).json({ error: "Liste de tâches invalide." });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "RIGOURA DESIGN";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Suivi des tâches");
    sheet.columns = [
      { header: "taches", key: "type", width: 18 },
      { header: "description", key: "description", width: 48 },
      { header: "obs", key: "obs", width: 18 },
      { header: "date", key: "date", width: 30 }
    ];
    tasks.slice().sort((a,b)=>String(a.date||"").localeCompare(String(b.date||""))).forEach(t => {
      sheet.addRow({ type: String(t.type || ""), description: String(t.description || ""), obs: String(t.obs || ""), date: dateLabel(t.date) });
    });
    const header = sheet.getRow(1);
    header.height = 24;
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };
    header.alignment = { vertical: "middle" };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = { from: "A1", to: "D1" };
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell(cell => { cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb: rowNumber % 2 ? "FFDBE6F1" : "FFB9CDE3" } }; });
      }
      row.eachCell(cell => { cell.border = { bottom:{style:"thin", color:{argb:"FFFFFFFF"}} }; cell.alignment = { vertical:"top", wrapText:true }; });
    });
    const buffer = await workbook.xlsx.writeBuffer();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const stamp = new Date().toISOString().slice(0,10);
    await transporter.sendMail({
      from: `"RIGOURA DESIGN — Suivi des tâches" <${from}>`,
      to: RECIPIENTS.join(", "),
      subject: `Sauvegarde du suivi des tâches — ${stamp}`,
      text: `Bonjour,\n\nVeuillez trouver en pièce jointe la sauvegarde Excel du suivi des tâches Rigoura Design.\nNombre de tâches : ${tasks.length}.\nDate de sauvegarde : ${new Date().toLocaleString("fr-FR")}.\n\nEnvoi automatique du logiciel Rigoura Suivi des tâches.`,
      attachments: [{ filename: `Rigoura_suivi_taches_${stamp}.xlsx`, content: Buffer.from(buffer), contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }]
    });
    return res.json({ ok: true, sentTo: RECIPIENTS, count: tasks.length });
  } catch (err) {
    console.error("Backup email failed:", err.message);
    return res.status(502).json({ error: "Le service n’a pas pu envoyer l’e-mail. Vérifie sa configuration SMTP." });
  }
});
app.listen(PORT, () => console.log(`Rigoura mail service listening on ${PORT}`));
