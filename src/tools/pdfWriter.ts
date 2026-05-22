import vm from "node:vm";
import path from "node:path";
import fs from "node:fs/promises";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export default async function pdfWriter(code: string) {
  // ─────────────────────────────────────────────
  // DOSSIER PDF
  // ─────────────────────────────────────────────

  const pdfFolder = path.join(process.cwd(), "pdf");

  await fs.mkdir(pdfFolder, { recursive: true });

  // ─────────────────────────────────────────────
  // NOM DU FICHIER
  // ─────────────────────────────────────────────

  const fileName = `pdf-${Date.now()}.pdf`;

  const filePath = path.join(pdfFolder, fileName);

  // ─────────────────────────────────────────────
  // PDF
  // ─────────────────────────────────────────────

  const pdfDoc = await PDFDocument.create();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ─────────────────────────────────────────────
  // SANDBOX
  // ─────────────────────────────────────────────

  const sandbox = {
    pdfDoc,
    font,
    rgb,

    console: {
      log: (...args: unknown[]) => {
        console.log("[PDF LOG]:", ...args);
      },
    },
  };

  const context = vm.createContext(sandbox);

  // ─────────────────────────────────────────────
  // EXECUTION IA
  // ─────────────────────────────────────────────

  const wrappedCode = `
    (async () => {
      ${code}
    })()
  `;

  let result: unknown;

  try {
    result = await vm.runInContext(wrappedCode, context, {
      timeout: 5000,
    });
  } catch (error: unknown) {
    return {
      data: null,
      source: "pdfWriter",
      status: "error",
      error:
        error instanceof Error
          ? error.message
          : "Erreur inconnue dans le code IA",
    };
  }

  const pdfBytes = await pdfDoc.save();

  await fs.writeFile(filePath, pdfBytes);

  return {
    data: {
      fileName,
      filePath,
      result,
    },
    source: "pdfWriter",
    status: "success",
  };
}
