/**
 * Tiny CSV parser. Handles quoted cells with embedded commas, newlines, and
 * doubled-quote escapes. Returns an array of row objects keyed by the header.
 * Not RFC-perfect (no UTF-8 BOM handling, no streaming) but enough for v1
 * round-trips of our own exports.
 */
export function parseCsv(input: string): Record<string, string>[] {
  const rows = parseRows(input);
  if (rows.length === 0) return [];
  const [header, ...data] = rows;
  return data
    .filter((cells) => cells.length > 0 && cells.some((c) => c.length > 0))
    .map((cells) => {
      const row: Record<string, string> = {};
      header.forEach((key, i) => {
        row[key] = cells[i] ?? '';
      });
      return row;
    });
}

function parseRows(input: string): string[][] {
  const rows: string[][] = [[]];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      rows[rows.length - 1].push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      rows[rows.length - 1].push(cell);
      cell = '';
      if (ch === '\r' && input[i + 1] === '\n') i++;
      rows.push([]);
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || rows[rows.length - 1].length > 0) {
    rows[rows.length - 1].push(cell);
  }

  return rows;
}
