// CSV parsing utilities
function csvEscape(value) {
  let stringValue = value === null || value === undefined ? '' : String(value);
  // Protect against CSV Formula Injection (CWE-1236)
  if (/^[=+\-@\t\r]/.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function pipeJoinList(value) {
  if (!Array.isArray(value)) return '';
  return value.map((entry) => String(entry).trim()).filter(Boolean).join('|');
}

function parseDelimitedList(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }
  return value
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseCsvBoolean(value) {
  return String(value).trim().toLowerCase() === 'true';
}

function parseCsvNumber(value, fallback = 0) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function parseCsvRows(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }
      currentRow.push(currentCell);
      if (currentRow.some((cell) => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += character;
  }

  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((cell) => cell !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseCsvVariants(value) {
  if (!value || String(value).trim() === '') {
    return [];
  }
  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue)
      ? parsedValue.map((variant) => ({
          sku: String(variant?.sku || '').trim(),
          attributes: variant?.attributes || {},
          stockQuantity: Number(variant?.stockQuantity || 0),
          price: variant?.price === null || variant?.price === undefined || variant?.price === ''
            ? null
            : Number(variant.price),
          inStock: Boolean(variant?.inStock),
        }))
      : [];
  } catch (error) {
    return [];
  }
}

module.exports = {
  csvEscape,
  pipeJoinList,
  parseDelimitedList,
  parseCsvBoolean,
  parseCsvNumber,
  parseCsvRows,
  parseCsvVariants,
};
