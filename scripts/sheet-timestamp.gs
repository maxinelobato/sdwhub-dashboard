/**
 * sheet-timestamp.gs — Adiciona e mantém a coluna Timestamp à esquerda de "Nome".
 *
 * Como instalar (uma única vez):
 *   1. Abra a planilha SDW.hub no Google Sheets
 *   2. Menu: Extensões → Apps Script
 *   3. Cole este arquivo inteiro no editor (substitua o conteúdo padrão)
 *   4. Salve (Ctrl+S)
 *   5. No seletor de funções, escolha "setup" → clique em ▶ Executar
 *      (autorize as permissões — é a sua própria planilha)
 *   6. Pronto. Toda linha nova inserida (pelo Typebot ou manualmente)
 *      receberá automaticamente o timestamp em America/Sao_Paulo.
 */

const TIMESTAMP_HEADER = 'Timestamp';
const TIMEZONE = 'America/Sao_Paulo';
const FORMAT = 'yyyy-MM-dd HH:mm:ss';
const TRIGGER_HANDLER = 'onSheetChange';

/** Roda 1x: cria a coluna, faz backfill e instala o trigger automático. */
function setup() {
  ensureTimestampColumn_();
  installChangeTrigger_();
  Logger.log('✓ Coluna Timestamp pronta + trigger instalado.');
}

/** Insere a coluna Timestamp em A se ainda não existir e faz backfill das linhas atuais. */
function ensureTimestampColumn_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  if (headerRow[0] !== TIMESTAMP_HEADER) {
    sheet.insertColumnBefore(1);
    const headerCell = sheet.getRange(1, 1);
    headerCell.setValue(TIMESTAMP_HEADER);
    headerCell.setFontWeight('bold');
    headerCell.setBackground('#492b92');
    headerCell.setFontColor('#ffffff');
    sheet.setColumnWidth(1, 170);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const tsRange = sheet.getRange(2, 1, lastRow - 1, 1);
  const current = tsRange.getValues();
  const now = Utilities.formatDate(new Date(), TIMEZONE, FORMAT);
  let dirty = false;

  for (let i = 0; i < current.length; i++) {
    if (!current[i][0]) {
      current[i][0] = now;
      dirty = true;
    }
  }

  if (dirty) tsRange.setValues(current);
}

/** Trigger nativo: dispara em qualquer mudança de estrutura/linhas. */
function installChangeTrigger_() {
  const existing = ScriptApp.getProjectTriggers();
  for (const t of existing) {
    if (t.getHandlerFunction() === TRIGGER_HANDLER) ScriptApp.deleteTrigger(t);
  }
  ScriptApp.newTrigger(TRIGGER_HANDLER)
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onChange()
    .create();
}

/** Handler: preenche timestamp em qualquer linha nova com a célula A vazia. */
function onSheetChange(e) {
  if (!e || (e.changeType !== 'INSERT_ROW' && e.changeType !== 'EDIT' && e.changeType !== 'OTHER')) {
    return;
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const range = sheet.getRange(2, 1, lastRow - 1, 1);
  const values = range.getValues();
  const now = Utilities.formatDate(new Date(), TIMEZONE, FORMAT);
  let dirty = false;

  for (let i = 0; i < values.length; i++) {
    if (!values[i][0]) {
      values[i][0] = now;
      dirty = true;
    }
  }

  if (dirty) range.setValues(values);
}
