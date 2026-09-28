/**
 * Story's 7th Birthday — RSVP receiver
 * ------------------------------------
 * Paste this whole file into your Google Sheet: Extensions → Apps Script → Code.gs
 * Then: Deploy → New deployment → Web app
 *   - Execute as: Me
 *   - Who has access: Anyone
 * Copy the Web App URL (ends in /exec) into CONFIG.SCRIPT_URL in index.html.
 *
 * Optional: run setupSheets() once from the editor to create the tabs and summary.
 */

const SHEET_NAME = 'RSVPs';
const SUMMARY_NAME = 'Summary';
const MAX_COMPANIONS = 5;
const RSVP_DEADLINE = new Date('2026-10-24T23:59:59+08:00');
const HEADERS = ['Timestamp', 'Attending', 'Full Name', 'No. of Companions', 'Companion Names', 'Total Headcount', 'Times Updated'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    if (new Date() > RSVP_DEADLINE) {
      return json_({ ok: false, error: 'RSVPs are now closed. Please message the family directly.' });
    }

    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const attending = data.attending === 'Yes' ? 'Yes' : data.attending === 'No' ? 'No' : '';
    const fullName = clean_(data.fullName);
    let names = Array.isArray(data.companionNames) ? data.companionNames.map(clean_).filter(String) : [];
    let companions = Number(data.companions) || 0;

    if (!attending) return json_({ ok: false, error: 'Please choose whether you can attend.' });
    if (fullName.length < 3) return json_({ ok: false, error: 'Please enter your full name.' });

    if (attending === 'No') { companions = 0; names = []; }
    if (companions < 0 || companions > MAX_COMPANIONS) {
      return json_({ ok: false, error: 'You can bring up to ' + MAX_COMPANIONS + ' companions.' });
    }
    if (names.length !== companions) {
      return json_({ ok: false, error: 'Please fill in a name for each person attending with you.' });
    }

    const sheet = getSheet_();
    const row = [
      new Date(),
      attending,
      safe_(fullName),
      companions,
      safe_(names.join(', ')),
      attending === 'Yes' ? companions + 1 : 0
    ];

    // Same name (case/spacing-insensitive) → update that row instead of adding a duplicate
    const existing = findRowByName_(sheet, fullName);
    if (existing) {
      const updates = Number(sheet.getRange(existing, 7).getValue()) || 0;
      sheet.getRange(existing, 1, 1, 7).setValues([row.concat(updates + 1)]);
    } else {
      sheet.appendRow(row.concat(0));
    }

    return json_({ ok: true, updated: Boolean(existing) });
  } catch (err) {
    return json_({ ok: false, error: 'Something went wrong saving your RSVP. Please try again.' });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the Web App URL in a browser shows this — handy to confirm the deployment works.
function doGet() {
  return json_({ ok: true, message: "Story's RSVP endpoint is running." });
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  getSheet_();
  let sum = ss.getSheetByName(SUMMARY_NAME);
  if (!sum) sum = ss.insertSheet(SUMMARY_NAME);
  sum.clear();
  sum.getRange('A1:B6').setValues([
    ['Summary', ''],
    ['Responses', '=COUNTA(' + SHEET_NAME + '!C2:C)'],
    ['Attending (Yes)', '=COUNTIF(' + SHEET_NAME + '!B2:B,"Yes")'],
    ['Not attending (No)', '=COUNTIF(' + SHEET_NAME + '!B2:B,"No")'],
    ['Companions', '=SUMIF(' + SHEET_NAME + '!B2:B,"Yes",' + SHEET_NAME + '!D2:D)'],
    ['Total expected guests', '=SUM(' + SHEET_NAME + '!F2:F)']
  ]);
  sum.getRange('A1').setFontWeight('bold').setFontSize(14);
  sum.getRange('A2:A6').setFontWeight('bold');
  sum.getRange('B6').setFontWeight('bold').setBackground('#FCE1EB');
  sum.autoResizeColumns(1, 2);
}

/* ---------- helpers ---------- */

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#FCE1EB');
    sheet.setFrozenRows(1);
    sheet.getRange('A:A').setNumberFormat('mmm d, yyyy h:mm am/pm');
  }
  return sheet;
}

function findRowByName_(sheet, name) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const key = name.toLowerCase();
  const values = sheet.getRange(2, 3, last - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (clean_(values[i][0]).toLowerCase() === key) return i + 2;
  }
  return 0;
}

function clean_(s) {
  return String(s == null ? '' : s).replace(/^'/, '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

// Stops text like "=HYPERLINK(...)" from being treated as a spreadsheet formula
function safe_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
