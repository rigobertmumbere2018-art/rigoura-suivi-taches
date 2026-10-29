import express from 'express';
import cors from 'cors';
import pg from 'pg';
import crypto from 'node:crypto';
import {google} from 'googleapis';
import ExcelJS from 'exceljs';

const app=express();app.disable('x-powered-by');app.use(express.json({limit:'3mb'}));
const allowed=(process.env.APP_ORIGIN||'').split(',').map(s=>s.trim()).filter(Boolean);
app.use(cors({origin:(origin,cb)=>cb(null,!origin||allowed.includes(origin)),methods:['GET','POST'],allowedHeaders:['Authorization','Content-Type']}));
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?.includes('localhost')?false:{rejectUnauthorized:false}});
const ready=pool.query(`CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, task JSONB, deleted BOOLEAN NOT NULL DEFAULT FALSE, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()); CREATE TABLE IF NOT EXISTS applied_ops (id TEXT PRIMARY KEY);`);
function auth(req,res,next){const a=(req.headers.authorization||'').replace(/^Bearer /,'');const b=process.env.APP_TOKEN||'';if(!a||!b||Buffer.byteLength(a)!==Buffer.byteLength(b)||!crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b)))return res.status(401).json({error:'Accès non autorisé'});next()}
app.get('/api/health',(_req,res)=>res.json({ok:true}));
app.post('/api/sync',auth,async(req,res)=>{
 const ops=req.body.operations||[];
 if(!Array.isArray(ops)||ops.length>1000)return res.status(400).json({error:'Liste invalide'});
 const c=await pool.connect();try{await ready;await c.query('BEGIN');
  for(const op of ops){
   if(typeof op.opId!=='string'||typeof op.id!=='string'||op.id.length>128||op.opId.length>128)throw Error('Opération invalide');
   const fresh=await c.query('INSERT INTO applied_ops(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id',[op.opId]);if(!fresh.rowCount)continue;
   if(op.deleted){await c.query('INSERT INTO tasks(id,task,deleted) VALUES($1,NULL,TRUE) ON CONFLICT(id) DO UPDATE SET task=NULL,deleted=TRUE,updated_at=NOW()',[op.id]);continue}
   const t=op.task;
   if(!t||String(t.id)!==op.id||!['conception','correction','impression'].includes(t.type)||!['EN COURS','TERMINÉ'].includes(t.obs)||typeof t.description!=='string'||t.description.length>500||!/^\d{4}-\d{2}-\d{2}$/.test(t.date))throw Error('Tâche invalide');
   await c.query('INSERT INTO tasks(id,task,deleted) VALUES($1,$2,FALSE) ON CONFLICT(id) DO UPDATE SET task=$2,deleted=FALSE,updated_at=NOW()',[op.id,JSON.stringify(t)]);
  }
  const result=await c.query('SELECT id,task,deleted FROM tasks ORDER BY updated_at ASC');await c.query('COMMIT');res.json({tasks:result.rows});
 }catch(e){await c.query('ROLLBACK');res.status(400).json({error:e.message})}finally{c.release()}
});
async function backup(){await ready;
 const {rows}=await pool.query('SELECT task FROM tasks WHERE deleted=FALSE ORDER BY (task->>\'date\') ASC');
 const tasks=rows.map(r=>r.task);const date=new Date().toISOString().replace(/[:.]/g,'-');
 const book=new ExcelJS.Workbook();const sheet=book.addWorksheet('Tâches');sheet.columns=[{header:'taches',key:'type',width:18},{header:'description',key:'description',width:65},{header:'obs',key:'obs',width:18},{header:'date',key:'date',width:18}];tasks.forEach(t=>sheet.addRow(t));sheet.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF103C69'}};
 const xlsx=await book.xlsx.writeBuffer();const json=Buffer.from(JSON.stringify({version:1,exportedAt:new Date().toISOString(),tasks},null,2));
 const oauth=new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET);oauth.setCredentials({refresh_token:process.env.GOOGLE_REFRESH_TOKEN});const drive=google.drive({version:'v3',auth:oauth});
 const folder=process.env.GOOGLE_DRIVE_FOLDER_ID;if(!folder)throw Error('GOOGLE_DRIVE_FOLDER_ID absent');
 async function upload(filename,mime,bytes){const {Readable}=await import('node:stream');return drive.files.create({requestBody:{name:filename,parents:[folder]},media:{mimeType:mime,body:Readable.from(bytes)},fields:'id,name'});}
 await upload('Rigoura_taches_'+date+'.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',xlsx);
 await upload('Rigoura_taches_'+date+'.json','application/json',json);
 return {filename:'Rigoura_taches_'+date+'.xlsx',count:tasks.length};
}
app.post('/api/backup-drive',auth,async(_req,res)=>{try{res.json(await backup())}catch(e){console.error(e);res.status(500).json({error:'Sauvegarde Google Drive impossible : vérifier la configuration OAuth et le dossier.'})}});
app.post('/api/backup-scheduled',auth,async(_req,res)=>{try{res.json(await backup())}catch(e){console.error(e);res.status(500).json({error:'Échec sauvegarde planifiée'})}});
const port=Number(process.env.PORT||3000);ready.then(()=>app.listen(port,()=>console.log('Rigoura sync prêt sur',port))).catch(e=>{console.error(e);process.exit(1)});
