import { inflateRawSync } from "node:zlib";

function readZipFile(buffer: Buffer, path: string) {
  const signature = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const directoryEnd = buffer.lastIndexOf(signature);
  if (directoryEnd < 0) throw new Error("Invalid XLSX archive: ZIP directory not found");
  const entries = buffer.readUInt16LE(directoryEnd + 10);
  let offset = buffer.readUInt32LE(directoryEnd + 16);

  for (let index = 0; index < entries; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Invalid XLSX archive: malformed ZIP directory");
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);

    if (name === path) {
      if (buffer.readUInt32LE(localOffset) !== 0x04034b50) {
        throw new Error(`Invalid XLSX archive: malformed ${path}`);
      }
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
      if (method === 0) return compressed;
      if (method === 8) return inflateRawSync(compressed);
      throw new Error(`Unsupported XLSX compression method: ${method}`);
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return null;
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function columnIndex(reference: string) {
  const letters = reference.match(/^[A-Z]+/i)?.[0]?.toUpperCase();
  if (!letters) return -1;
  let index = 0;
  for (const letter of letters) index = index * 26 + letter.charCodeAt(0) - 64;
  return index - 1;
}

function readSharedStrings(xml: string | null) {
  if (!xml) return [];
  return [...xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((item) =>
    [...item[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
      .map((text) => decodeXml(text[1]))
      .join(""),
  );
}

function readCellValue(attributes: string, content: string, sharedStrings: string[]) {
  const type = attributes.match(/\bt="([^"]+)"/)?.[1];
  const value = content.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/)?.[1];
  if (type === "inlineStr") {
    return [...content.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
      .map((item) => decodeXml(item[1]))
      .join("");
  }
  if (value === undefined) return null;
  const decoded = decodeXml(value);
  if (type === "s") return sharedStrings[Number(decoded)] ?? "";
  if (type === "str") return decoded;
  if (type === "b") return decoded === "1";
  const number = Number(decoded);
  return Number.isFinite(number) ? number : decoded;
}

export function readFirstWorksheet(data: ArrayBuffer) {
  const archive = Buffer.from(data);
  const sheetXml = readZipFile(archive, "xl/worksheets/sheet1.xml")?.toString("utf8");
  if (!sheetXml) throw new Error("XLSX workbook has no first worksheet");
  const sharedStrings = readSharedStrings(
    readZipFile(archive, "xl/sharedStrings.xml")?.toString("utf8") ?? null,
  );
  const rows: unknown[][] = [];

  for (const rowMatch of sheetXml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(rowMatch[1].match(/\br="(\d+)"/)?.[1] ?? rows.length + 1);
    const row: unknown[] = [];
    const cells = /<c\b([^>]*?)(?:\s*\/>|>([\s\S]*?)<\/c>)/g;
    for (const cellMatch of rowMatch[2].matchAll(cells)) {
      const reference = cellMatch[1].match(/\br="([A-Z]+\d+)"/i)?.[1];
      const index = reference ? columnIndex(reference) : -1;
      if (index < 0) continue;
      row[index] = readCellValue(cellMatch[1], cellMatch[2] ?? "", sharedStrings);
    }
    rows[rowNumber - 1] = row;
  }
  return rows;
}
