const SPREADSHEET_ID = '1qgIALv6YHE3kZre3AOX6VVYXa1d5CYoEtVoEjG5nLuA';
const FEUILLE_TACHES = 'Taches';
const FEUILLE_HISTORIQUE = 'Historique';
const DOSSIER_SAUVEGARDE = 'Rigoura - Sauvegardes des tâches';

function doGet(e) {
  const p = (e && e.parameter) || {};
  let result;
  try {
    result = traiter_(p);
  } catch (err) {
    result = { ok: false, erreur: String(err && err.message ? err.message : err) };
  }
  const callback = String(p.callback || '');
  if (callback) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$\.]{0,100}$/.test(callback)) {
      return ContentService.createTextOutput(JSON.stringify({ok:false, erreur:'Callback invalide'})).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(result).replace(/</g, '\\u003c') + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function traiter_(p) {
  const secret = PropertiesService.getScriptProperties().getProperty('API_SECRET');
  if (!secret || !p.secret || p.secret !== secret) return {ok:false, erreur:'Acces refuse. Verifiez la cle API.'};
  const action = String(p.action || 'ping');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tasksSheet = obtenirFeuille_(ss, FEUILLE_TACHES, ['ID','Donnees JSON','Supprime','Mis a jour le']);
  const historySheet = obtenirFeuille_(ss, FEUILLE_HISTORIQUE, ['Date','Action','ID']);

  if (action === 'ping') return {ok:true, message:'Rigoura Sync est accessible.'};
  if (action === 'list') {
    const values = tasksSheet.getDataRange().getValues();
    const tasks = [];
    for (let i=1; i<values.length; i++) {
      if (!values[i][0]) continue;
      let task = null;
      try { task = values[i][1] ? JSON.parse(String(values[i][1])) : null; } catch (_) {}
      tasks.push({id:String(values[i][0]), task:task, deleted:values[i][2] === true || String(values[i][2]).toLowerCase() === 'true'});
    }
    return {ok:true, tasks:tasks};
  }
  if (action === 'save') {
    if (!p.data) throw new Error('Donnees manquantes');
    const op = JSON.parse(p.data);
    if (!op || typeof op.id !== 'string' || !op.id || op.id.length > 128) throw new Error('Identifiant invalide');
    if (!op.deleted) {
      const t = op.task;
      if (!t || String(t.id) !== op.id || !['conception','correction','impression','autres'].includes(t.type) || !['EN COURS','TERMINÉ'].includes(t.obs) || typeof t.description !== 'string' || t.description.length > 500 || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) throw new Error('Format de tâche invalide');
    }
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const values = tasksSheet.getDataRange().getValues();
      let row = -1;
      for (let i=1;i<values.length;i++) if (String(values[i][0]) === op.id) { row=i+1; break; }
      const line = [op.id, op.deleted ? '' : JSON.stringify(op.task), Boolean(op.deleted), new Date()];
      if (row > 0) tasksSheet.getRange(row,1,1,4).setValues([line]);
      else tasksSheet.appendRow(line);
      historySheet.appendRow([new Date(), op.deleted ? 'Suppression synchronisée' : 'Tâche synchronisée', op.id]);
    } finally { lock.releaseLock(); }
    return {ok:true, id:op.id};
  }
  if (action === 'backup') {
    const values = tasksSheet.getDataRange().getValues();
    const tasks = [];
    for (let i=1;i<values.length;i++) {
      if (!values[i][0] || values[i][2] === true || String(values[i][2]).toLowerCase() === 'true' || !values[i][1]) continue;
      try { tasks.push(JSON.parse(String(values[i][1]))); } catch (_) {}
    }
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = 'Rigoura_taches_' + stamp + '.json';
    const content = JSON.stringify({version:1, exportedAt:new Date().toISOString(), tasks:tasks}, null, 2);
    const folders = DriveApp.getFoldersByName(DOSSIER_SAUVEGARDE);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(DOSSIER_SAUVEGARDE);
    folder.createFile(filename, content, MimeType.PLAIN_TEXT);
    historySheet.appendRow([new Date(), 'Sauvegarde Google Drive', String(tasks.length) + ' tâche(s)']);
    return {ok:true, filename:filename, count:tasks.length, folder:DOSSIER_SAUVEGARDE};
  }
  throw new Error('Action inconnue');
}

function obtenirFeuille_(ss, nom, headers) {
  let sh = ss.getSheetByName(nom);
  if (!sh) sh = ss.insertSheet(nom);
  const existing = sh.getRange(1,1,1,Math.max(sh.getLastColumn(), headers.length)).getValues()[0];
  if (nom === FEUILLE_TACHES && existing[2] === 'Mis a jour le') {
    // Migration douce de l'ancien format ID / JSON / date vers ID / JSON / supprimé / date.
    sh.insertColumnBefore(3);
  }
  sh.getRange(1,1,1,headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  return sh;
}

function initialiser() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  obtenirFeuille_(ss, FEUILLE_TACHES, ['ID','Donnees JSON','Supprime','Mis a jour le']);
  obtenirFeuille_(ss, FEUILLE_HISTORIQUE, ['Date','Action','ID']);
  Logger.log('Les feuilles Rigoura Sync sont prêtes.');
}
