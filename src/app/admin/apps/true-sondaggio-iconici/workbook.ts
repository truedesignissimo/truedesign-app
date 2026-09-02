import { strToU8, zipSync } from "fflate";
import { buildSurveyWorkbookData } from "./excel-data";
import type { SurveyResponse } from "./survey-results";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnName(index: number) {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function cell(value: string | number, row: number, column: number, header = false) {
  const reference = `${columnName(column)}${row}`;
  if (typeof value === "number") {
    return `<c r="${reference}"${header ? ' s="1"' : ""} t="n"><v>${value}</v></c>`;
  }
  return `<c r="${reference}"${header ? ' s="1"' : ""} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function worksheet(rows: Array<Array<string | number>>) {
  const renderedRows = rows.map((values, rowIndex) => {
    const rowNumber = rowIndex + 1;
    return `<row r="${rowNumber}">${values.map((value, columnIndex) => cell(value, rowNumber, columnIndex, rowIndex === 0)).join("")}</row>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <sheetData>${renderedRows}</sheetData>
  <autoFilter ref="A1:${columnName(Math.max(0, (rows[0]?.length ?? 1) - 1))}1"/>
</worksheet>`;
}

export function createSurveyWorkbook(responses: SurveyResponse[]): Uint8Array {
  const data = buildSurveyWorkbookData(responses);
  const summaryRows: Array<Array<string | number>> = [
    ["Indicatore", "Valore"],
    ["Risposte", data.summary.responses],
    ["Preferenze", data.summary.preferences],
    ["Prodotti votati", data.summary.products],
    ["Prima risposta", data.summary.firstResponseAt ?? "—"],
    ["Ultima risposta", data.summary.lastResponseAt ?? "—"],
  ];
  const rankingRows: Array<Array<string | number>> = [
    ["Posizione", "Prodotto", "Voti", "% partecipanti"],
    ...data.ranking.map((row) => [row.position, row.product, row.votes, row.participantShare]),
  ];
  const responseRows: Array<Array<string | number>> = [
    ["Data e ora", "Partecipante", "Scelte"],
    ...data.responses.map((row) => [row.submittedAt, row.participant, row.choices]),
  ];

  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Riepilogo" sheetId="1" r:id="rId1"/>
    <sheet name="Classifica" sheetId="2" r:id="rId2"/>
    <sheet name="Risposte" sheetId="3" r:id="rId3"/>
  </sheets>
</workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    "xl/styles.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF302515"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>
</styleSheet>`),
    "xl/worksheets/sheet1.xml": strToU8(worksheet(summaryRows)),
    "xl/worksheets/sheet2.xml": strToU8(worksheet(rankingRows)),
    "xl/worksheets/sheet3.xml": strToU8(worksheet(responseRows)),
  };

  return zipSync(files, { level: 6 });
}
