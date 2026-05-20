export function renderMetadata(metadata) {
  return JSON.stringify(metadata, null, 2);
}

export function renderRows(file) {
  if (!file.columns.length) {
    return "<p>No CSV rows found.</p>";
  }

  const head = file.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
  const body = file.rows.map((row) => {
    const cells = file.columns
      .map((column) => `<td>${escapeHtml(String(row[column] ?? ""))}</td>`)
      .join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

export function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function showError(target, error) {
  target.textContent = `${error.name ?? "Error"}: ${error.message}`;
  target.className = "status bad";
}

export function showOk(target, message) {
  target.textContent = message;
  target.className = "status good";
}
