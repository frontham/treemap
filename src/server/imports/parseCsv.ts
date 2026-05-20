/**
 * Tiny CSV parser. Handles quoted cells with embedded commas, newlines, and
 * doubled-quote escapes. Returns an array of row objects keyed by the header.
 * Not RFC-perfect (no UTF-8 BOM handling, no streaming) but enough for v1
 * round-trips of our own exports.
 */
export function parseCsv(input: string): Record<string, string>[] {
  const rows = parseRows(input);
  const header = rows[0];
  if (!header) return [];
  return rows
    .slice(1)
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
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = '';
  let inQuotes = false;

  const endCell = () => {
    current.push(cell);
    cell = '';
  };
  const endRow = () => {
    rows.push(current);
    current = [];
  };

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === undefined) break;

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
      endCell();
    } else if (ch === '\n' || ch === '\r') {
      endCell();
      if (ch === '\r' && input[i + 1] === '\n') i++;
      endRow();
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || current.length > 0) {
    endCell();
    endRow();
  }

  return rows;
}
