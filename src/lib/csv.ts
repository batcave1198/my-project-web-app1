/**
 * Small, dependency-free CSV parser.
 *
 * Supports quoted fields, escaped quotes (""), commas and newlines inside
 * quotes, CRLF/LF line endings and a UTF-8 BOM. It deliberately does not try
 * to infer types: every cell is a string and the importer validates each one.
 */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  function endField() {
    row.push(field);
    field = "";
  }

  function endRow() {
    endField();
    rows.push(row);
    row = [];
  }

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field === "") {
      inQuotes = true;
    } else if (char === ",") {
      endField();
    } else if (char === "\n") {
      endRow();
    } else if (char === "\r") {
      if (text[i + 1] !== "\n") endRow();
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) endRow();

  return rows;
}
