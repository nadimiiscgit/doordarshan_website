(function () {
  'use strict';

  function showMessage(message, type) {
    if (typeof toast === 'function') toast(message, type || 'success');
  }

  function handleFileUpload(file) {
    if (!file) return;
    const input = document.getElementById('csv-file');
    if (!/\.csv$/i.test(file.name)) {
      showMessage('❌ Please upload a .csv file. Save Excel workbooks as CSV first.', 'error');
      if (input) input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage('❌ CSV files must be smaller than 5 MB.', 'error');
      if (input) input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = event => parseAndPreviewCSV(String(event.target.result || ''));
    reader.onerror = () => showMessage('❌ The selected CSV could not be read.', 'error');
    reader.readAsText(file);
  }

  function makeCell(value, header) {
    const cell = document.createElement(header ? 'th' : 'td');
    cell.style.cssText = header
      ? 'padding:8px 12px;text-align:left;vertical-align:top;'
      : 'padding:8px 12px;vertical-align:top;';
    cell.textContent = String(value == null ? '' : value);
    return cell;
  }

  function parseAndPreviewCSV(text) {
    if (!window.ProductCsvImport) {
      showMessage('❌ CSV import module is unavailable. Reload the admin page.', 'error');
      return;
    }

    let parsed;
    try {
      parsed = window.ProductCsvImport.parseProductCsv(text);
    } catch (error) {
      currentCsvImportPlan = null;
      document.getElementById('upload-actions').style.display = 'none';
      document.getElementById('csv-preview').replaceChildren();
      showMessage('❌ ' + error.message, 'error');
      return;
    }

    currentCsvImportPlan = window.ProductCsvImport.buildImportPlan(
      parsed,
      adminProductsLoadedFromDB ? liveProducts : null,
      liveCategories
    );

    const preview = document.getElementById('csv-preview');
    preview.replaceChildren();
    const summary = document.createElement('div');
    summary.style.cssText = 'margin-top:16px;padding:12px;border-radius:8px;border:1px solid;font-size:0.85rem;margin-bottom:12px;';
    summary.style.background = currentCsvImportPlan.errors.length ? '#FEF2F2' : '#F0FDF4';
    summary.style.borderColor = currentCsvImportPlan.errors.length ? '#FCA5A5' : '#86EFAC';
    summary.style.color = currentCsvImportPlan.errors.length ? '#B91C1C' : '#15803D';
    summary.textContent = parsed.mode === 'stock'
      ? `Stock-only CSV: ${parsed.rows.length} rows parsed. This file has no price/MRP field; prices will remain unchanged. Only exact matches to existing products can be updated. ${currentCsvImportPlan.errors.length} row error(s).`
      : `Catalogue CSV: ${parsed.rows.length} rows parsed. ${currentCsvImportPlan.records.length} ready to import; ${currentCsvImportPlan.errors.length} row error(s).`;
    preview.appendChild(summary);

    const recordByNumber = new Map(currentCsvImportPlan.records.map(record => [record.recordNumber, record]));
    const errorsByNumber = new Map();
    currentCsvImportPlan.errors.forEach(error => {
      const list = errorsByNumber.get(error.recordNumber) || [];
      list.push(error.message);
      errorsByNumber.set(error.recordNumber, list);
    });

    const tableWrap = document.createElement('div');
    tableWrap.style.cssText = 'overflow-x:auto;max-height:300px;border:1px solid var(--border);border-radius:10px;';
    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:0.82rem;';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.cssText = 'background:var(--bg);position:sticky;top:0;';
    ['CSV row', 'Product name', 'Brand', 'Category', 'MRP', 'Rate / price', 'Stock', 'Result']
      .forEach(label => headerRow.appendChild(makeCell(label, true)));
    thead.appendChild(headerRow);

    const tbody = document.createElement('tbody');
    parsed.rows.slice(0, 100).forEach(row => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border)';
      const matched = recordByNumber.get(row.recordNumber);
      const rowErrors = errorsByNumber.get(row.recordNumber) || [];
      const result = rowErrors.length
        ? rowErrors.join(' ')
        : matched
          ? (matched.mode === 'stock' ? `Ready — matches ${matched.name}` : `Ready — target product ID ${matched.id}`)
          : 'Not ready';
      const values = [
        row.recordNumber,
        row.name,
        row.brand || '—',
        row.category || '—',
        row.mrp == null ? '—' : row.mrp.toLocaleString('en-IN'),
        row.price == null ? (parsed.mode === 'stock' ? 'Not in source' : '—') : row.price.toLocaleString('en-IN'),
        row.stock == null ? '—' : row.stock,
        result
      ];
      values.forEach(value => tr.appendChild(makeCell(value, false)));
      tbody.appendChild(tr);
    });
    table.append(thead, tbody);
    tableWrap.appendChild(table);
    preview.appendChild(tableWrap);

    if (parsed.rows.length > 100) {
      const limitNote = document.createElement('p');
      limitNote.textContent = `Showing the first 100 of ${parsed.rows.length} rows. All rows are included in validation.`;
      preview.appendChild(limitNote);
    }

    if (currentCsvImportPlan.errors.length) {
      const errorList = document.createElement('ul');
      errorList.style.cssText = 'margin:12px 0;padding-left:24px;color:#B91C1C;';
      currentCsvImportPlan.errors.slice(0, 100).forEach(error => {
        const item = document.createElement('li');
        item.textContent = error.recordNumber ? `CSV row ${error.recordNumber}: ${error.message}` : error.message;
        errorList.appendChild(item);
      });
      preview.appendChild(errorList);
    }

    const actions = document.getElementById('upload-actions');
    const confirmButton = document.getElementById('confirm-upload-btn');
    actions.style.display = 'block';
    confirmButton.disabled = currentCsvImportPlan.errors.length > 0 || !currentCsvImportPlan.records.length || !adminProductsLoadedFromDB;
    confirmButton.textContent = parsed.mode === 'stock'
      ? `Confirm stock update (${currentCsvImportPlan.records.length})`
      : `Confirm product import (${currentCsvImportPlan.records.length})`;
    confirmButton.onclick = () => importCSVRows(currentCsvImportPlan);
  }

  async function importCSVRows(plan) {
    if (!plan || plan.errors.length || !plan.records.length) {
      showMessage('❌ Resolve every CSV row error before importing.', 'error');
      return;
    }
    if (typeof ensureAdminWriteReady !== 'function' || !await ensureAdminWriteReady()) return;

    const confirmButton = document.getElementById('confirm-upload-btn');
    confirmButton.disabled = true;
    try {
      if (plan.mode === 'stock') {
        await updateProductStocksInDB(plan.records);
      } else {
        const dbRecords = plan.records.map(({ mode, recordNumber, ...record }) => record);
        await upsertProductsToDB(dbRecords);
      }

      await loadAdminData();
      if (!adminProductsLoadedFromDB) throw new Error('The write completed, but the live catalogue could not be reloaded. Check Products before retrying.');
      showMessage(plan.mode === 'stock'
        ? `✅ Updated stock for ${plan.records.length} matched products. Prices were not changed.`
        : `✅ Imported ${plan.records.length} products to the database.`);
      document.getElementById('csv-preview').replaceChildren();
      document.getElementById('upload-actions').style.display = 'none';
      document.getElementById('csv-file').value = '';
      currentCsvImportPlan = null;
    } catch (error) {
      console.error('CSV import failed:', error);
      if (Number.isInteger(error.completed) && error.completed > 0) {
        showMessage(`⚠️ Stock update partially completed (${error.completed}/${error.total}). Reload and review stock before retrying. ${error.message}`, 'error');
        await loadAdminData();
      } else {
        showMessage('❌ CSV import failed: ' + error.message, 'error');
      }
    } finally {
      if (currentCsvImportPlan) {
        confirmButton.disabled = currentCsvImportPlan.errors.length > 0 || !currentCsvImportPlan.records.length || !adminProductsLoadedFromDB;
      }
    }
  }

  window.handleFileUpload = handleFileUpload;
  window.parseAndPreviewCSV = parseAndPreviewCSV;
  window.importCSVRows = importCSVRows;
})();
