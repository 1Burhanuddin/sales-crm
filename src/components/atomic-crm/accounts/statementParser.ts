// Parses a Bank of Baroda (and likely similar Indian bank) statement PDF
// into transaction rows, running entirely client-side (pdfjs-dist, lazy
// loaded) — matching this repo's own useImportFromJson.ts precedent of
// avoiding Edge Functions for large-file work, since they're memory/time
// constrained.
//
// This is NOT a simple "one line = one row" regex parser. Calibrated
// against a real statement: each transaction's numeric columns (serial,
// dates, debit/credit/balance) sit on their own text line, but the
// description column wraps across 1-2 *separate* lines that straddle that
// numeric line above and below it (the row is vertically centered on its
// tallest cell). So parsing works by:
//   1. Grouping all text items on a page into rows by y-position.
//   2. Finding "anchor" rows — a row with a bare integer in the Serial
//      column — which carry the date/debit/credit/balance for one
//      transaction.
//   3. Assigning every *other* row on the page to the nearest anchor (by
//      midpoint between consecutive anchors' y) and pulling its
//      description-column text into that transaction.
// A repeated table header and page footer land inside the description
// column's x-range too, so both are located and excluded before anchors
// are collected.

export type ParsedTransaction = {
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number; // signed: positive = credit/income, negative = debit/expense
  balanceAfter?: number;
  /** false only when a running balance exists on both this and the
   * previous row and they don't reconcile — surfaced in the review UI,
   * never blocks import. undefined when there's nothing to check against. */
  balanceOk?: boolean;
};

export type StatementParseResult = {
  transactions: ParsedTransaction[];
  pageCount: number;
};

type PositionedText = { x: number; y: number; text: string };
type Row = { y: number; items: PositionedText[] };

// Column x-ranges in PDF points, empirically calibrated against a real BOB
// statement. Generous margins on each side to tolerate minor per-document
// drift.
const COLUMNS = {
  serial: [-Infinity, 45],
  txnDate: [45, 95],
  valueDate: [95, 145],
  description: [145, 320],
  chequeNumber: [320, 395],
  debit: [395, 455],
  credit: [455, 530],
  balance: [530, Infinity],
} as const satisfies Record<string, readonly [number, number]>;

const inColumn = (x: number, [min, max]: readonly [number, number]) =>
  x >= min && x < max;

const textInColumn = (items: PositionedText[], column: readonly [number, number]) =>
  items
    .filter((item) => inColumn(item.x, column))
    .map((item) => item.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const parseAmount = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-") return null;
  const n = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** dd-mm-yyyy (as used on BOB statements) -> yyyy-mm-dd */
const parseIndianDate = (raw: string): string | null => {
  const m = raw.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
};

async function getPageRows(page: {
  getTextContent: () => Promise<{ items: unknown[] }>;
}): Promise<Row[]> {
  const content = await page.getTextContent();
  const items: PositionedText[] = content.items
    .filter(
      (item): item is { str: string; transform: number[] } =>
        typeof item === "object" &&
        item !== null &&
        "str" in item &&
        typeof (item as { str: unknown }).str === "string" &&
        (item as { str: string }).str.trim() !== "",
    )
    .map((item) => ({
      x: item.transform[4],
      y: item.transform[5],
      text: item.str.trim(),
    }));

  const rows = new Map<number, PositionedText[]>();
  for (const item of items) {
    // PDF coordinates aren't pixel-perfect between text runs on the same
    // visual line; round to absorb sub-point jitter without merging
    // genuinely different lines (observed line pitch is ~9pt).
    const key = Math.round(item.y / 2) * 2;
    const bucket = rows.get(key);
    if (bucket) bucket.push(item);
    else rows.set(key, [item]);
  }

  // PDF space has its origin at the bottom-left of the page (y grows
  // upward), so descending y is top-to-bottom reading order.
  return [...rows.entries()]
    .sort(([a], [b]) => b - a)
    .map(([y, rowItems]) => ({
      y,
      items: rowItems.sort((a, b) => a.x - b.x),
    }));
}

function parsePageRows(rows: Row[]): ParsedTransaction[] {
  const headerRow = rows.find((r) => r.items.some((i) => i.text === "Serial"));
  const footerRow = rows.find((r) => r.items.some((i) => i.text.startsWith("Note:")));
  const upperBound = headerRow?.y ?? Infinity;
  const lowerBound = footerRow?.y ?? -Infinity;
  const bodyRows = rows.filter((r) => r.y < upperBound && r.y > lowerBound);

  const anchors = bodyRows
    .map((row) => ({
      row,
      serial: textInColumn(row.items, COLUMNS.serial),
    }))
    .filter((a) => /^\d+$/.test(a.serial));

  const transactions: ParsedTransaction[] = [];

  anchors.forEach(({ row: anchorRow }, i) => {
    const prevY = i > 0 ? anchors[i - 1].row.y : upperBound;
    const nextY = i < anchors.length - 1 ? anchors[i + 1].row.y : lowerBound;
    const rangeTop = (prevY + anchorRow.y) / 2;
    const rangeBottom = (anchorRow.y + nextY) / 2;

    const description = bodyRows
      .filter((r) => r.y <= rangeTop && r.y >= rangeBottom)
      .map((r) => textInColumn(r.items, COLUMNS.description))
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (description.toLowerCase().includes("opening balance")) return;

    const date = parseIndianDate(textInColumn(anchorRow.items, COLUMNS.txnDate));
    if (!date) return;

    const debit = parseAmount(textInColumn(anchorRow.items, COLUMNS.debit));
    const credit = parseAmount(textInColumn(anchorRow.items, COLUMNS.credit));
    const amount = debit != null ? -debit : credit != null ? credit : null;
    if (amount == null) return;

    const balanceAfter =
      parseAmount(textInColumn(anchorRow.items, COLUMNS.balance)) ?? undefined;

    transactions.push({
      date,
      description: description || "(no description)",
      amount,
      balanceAfter,
    });
  });

  return transactions;
}

/** Thrown when the PDF is password-protected and no (or the wrong)
 * password was supplied — callers should re-prompt and retry. */
export class StatementPasswordRequiredError extends Error {}

export async function parseStatementPdf(
  file: File,
  password?: string,
): Promise<StatementParseResult> {
  const pdfjsLib = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  let doc;
  try {
    doc = await pdfjsLib.getDocument({ data: buffer, password }).promise;
  } catch (err) {
    // pdfjs-dist throws PasswordException (name === "PasswordException")
    // for both "no password given" and "wrong password" cases.
    if (err instanceof Error && err.name === "PasswordException") {
      throw new StatementPasswordRequiredError(err.message);
    }
    throw err;
  }

  const transactions: ParsedTransaction[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const rows = await getPageRows(page);
    transactions.push(...parsePageRows(rows));
  }

  // Self-verify using the running balance column, where available on
  // consecutive rows — flags parsing errors without blocking import.
  for (let i = 1; i < transactions.length; i++) {
    const prev = transactions[i - 1];
    const curr = transactions[i];
    if (prev.balanceAfter == null || curr.balanceAfter == null) continue;
    const expected = Math.round((prev.balanceAfter + curr.amount) * 100) / 100;
    curr.balanceOk = Math.abs(expected - curr.balanceAfter) < 0.01;
  }

  return { transactions, pageCount: doc.numPages };
}
