/** LT128 evidence only. Copy into a FRESH patched Conductor server/scripts/.
 * Node22 --expose-gc --import tsx scripts/lt128Benchmark.ts
 * Requires owned loopback conductor_test_lt128_* DB; leaves synthetic data intact.
 * No product code replacement, provider, real credential or mutation endpoint.
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { cpus, platform, arch } from 'node:os';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import User from '../models/user.js';
import Project from '../models/project.js';
import { criteria, conformanceReport, pageFingerprint } from '../util/conformance.js';
import { loadConformance, compactPage } from '../util/conformanceReads.js';
import { queueCandidates } from '../util/remediationqueue.js';
import { conformanceRecords } from '../api/conformance.js';

const uri=process.env.CONDUCTOR_TEST_MONGO_URI||'';
assert.match(uri,/^mongodb:\/\/127\.0\.0\.1:\d+\/conductor_test_lt128_[\w-]+$/);
const output=process.env.LT128_OUTPUT||'/tmp/conductor-lt128-implementation-benchmark.json';
const samples=Number(process.env.LT128_SAMPLES||20);
assert.ok(Number.isInteger(samples)&&samples>=20);
Object.assign(process.env,{SECRETKEY:randomBytes(48).toString('hex'),PRODUCTIONURLS:'http://localhost',ORG_ID:'libretexts',APP_ENV:'remedy_test',STRIPE_SECRET_KEY:'sk_test_synthetic_not_real',OPENAI_API_KEY:'synthetic_not_real',REMEDY_ENABLED:'true',REMEDY_ORG_ID:'libretexts',REMEDY_API_KEY:'synthetic_not_real',REMEDY_API_BASE_URL:'http://127.0.0.1:1',QDRANT_URL:'http://127.0.0.1:1',QDRANT_PORT:'1',QDRANT_API_KEY:'synthetic_not_real'});
// Any accidental provider path is a test failure. This phase calls read routes only.
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input:any,init?:any)=>{const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);assert.ok(['127.0.0.1','localhost'].includes(url.hostname),'Non-loopback HTTP is forbidden in this harness');return originalFetch(input,init);};
axios.defaults.adapter=async config=>{throw Error('Unexpected provider request: '+new URL(config.url||'http://invalid').origin);};
const projectID='lt128bench',actor=randomUUID(),outsider=randomUUID(),password=randomBytes(24).toString('hex');
const now=Date.now(),at=new Date(now).toISOString(),scope={version:'lt128-scope',boundaries:'All 500 synthetic full pages',processes:'All synthetic complete reading states',platformVersion:'Synthetic fixture'};
const sections=Array.from({length:500},(_,i)=>({_id:new mongoose.Types.ObjectId((70000+i).toString(16).padStart(24,'0')),sectionTitle:`Synthetic ${i}`,sectionURL:`https://fixture.invalid/${i}`,pageID:String(i),wcagReview:{sourceHash:`s${i}`,scannedAt:at,criteria:criteria.map(c=>({...c,status:'manual_review'})),rendered:{sourceHash:`s${i}`,renderedHash:'r',platformHash:'p',browser:'synthetic',axeVersion:'4',state:'complete',scannedAt:at,violations:[]}}}));
const result:any={synthetic:true,createdAt:new Date().toISOString(),node:process.version,host:{platform:platform(),arch:arch(),cpu:cpus()[0]?.model},samples,definitions:{cold:'First invocation/request for that measurement after fixture seed, fresh process; Mongo and OS caches NOT flushed. API/auth bootstrap excluded.',warm:'20 serial subsequent invocations, nearest-rank p95; no retries.',memory:'Combined in-process server+HTTP client+harness; sampled RSS/heap and process high-water RSS, not isolated server peak.',rows:'Mongo command monitoring counts decoded batch documents, not storage-engine examined keys/docs. Query plans captured separately.',latency:'End-to-end loopback HTTP body read + JSON parse; production functions measured separately. Cold+20 warm samples exclude row/byte instrumentation; a separate extra invocation records driver batches.'},scenarios:[],checks:[]};
let server:http.Server|undefined,origin='',cookie='',outsideCookie='',active:any=null;
const commands=new Map<number,any>();
const round=(n:number)=>Math.round(n*100)/100;
const summary=(values:number[])=>({min:round(Math.min(...values)),median:round([...values].sort((a,b)=>a-b)[Math.floor(values.length/2)]),p95:round([...values].sort((a,b)=>a-b)[Math.ceil(values.length*.95)-1]),max:round(Math.max(...values))});
let requestCount=0,windowStart=Date.now();
async function request(path:string,authCookie=cookie){
  if(++requestCount%350===0){const pause=60_100-(Date.now()-windowStart);if(pause>0)await new Promise(r=>setTimeout(r,pause));windowStart=Date.now();}
  const response=await fetch(origin+'/api/v1'+path,{redirect:'manual',headers:authCookie?{cookie:authCookie}:{}});
  const text=await response.text();let data:any;try{data=JSON.parse(text);}catch{data=null;}
  return {status:response.status,bytes:Buffer.byteLength(text),data};
}
async function measure(name:string,fn:()=>Promise<any>|any,warm=samples){
  global.gc?.();const before=process.memoryUsage(),stat:any={name,coldMs:0,warmMs:[],decodedRows:{},commands:{},driverBatchBytes:0,rssPeak:before.rss,heapPeak:before.heapUsed};
  active=null;const timer=setInterval(()=>{const m=process.memoryUsage();stat.rssPeak=Math.max(stat.rssPeak,m.rss);stat.heapPeak=Math.max(stat.heapPeak,m.heapUsed);},5);
  let last:any;
  try{for(let i=0;i<=warm;i++){const start=performance.now();last=await fn();const ms=performance.now()-start;if(i===0)stat.coldMs=round(ms);else stat.warmMs.push(round(ms));const m=process.memoryUsage();stat.rssPeak=Math.max(stat.rssPeak,m.rss);stat.heapPeak=Math.max(stat.heapPeak,m.heapUsed);}}
  finally{clearInterval(timer);active=null;}
  // Driver JSON sizing is deliberately outside latency samples.
  active=stat;try{await fn();}finally{active=null;}
  global.gc?.();stat.warm=stat.warmMs.length?summary(stat.warmMs):null;stat.heapRetainedDelta=process.memoryUsage().heapUsed-before.heapUsed;stat.processMaxRSS=process.resourceUsage().maxRSS*1024;stat.latencyInvocations=warm+1;stat.instrumentedInvocations=1;stat.invocations=warm+2;
  stat.decodedRowsPerInvocation=Object.fromEntries(Object.entries(stat.decodedRows).map(([k,v])=>[k,Number(v)]));
  if(last?.bytes!==undefined){stat.responseBytes=last.bytes;stat.status=last.status;}
  return {stat,last};
}
const check=(name:string,condition:any)=>{assert.ok(condition,name);result.checks.push(name);};
try{
  await mongoose.connect(uri,{monitorCommands:true});
  check('Owned synthetic database starts empty',(await mongoose.connection.db!.listCollections().toArray()).length===0);
  const client=mongoose.connection.getClient();
  client.on('commandStarted',(e:any)=>{if(active)commands.set(e.requestId,{stat:active,name:e.commandName,collection:e.command.find||e.command.aggregate||e.command.count||e.command.getMore&&e.command.collection});});
  client.on('commandSucceeded',(e:any)=>{const c=commands.get(e.requestId);if(!c)return;commands.delete(e.requestId);const rows=e.reply.cursor?.firstBatch||e.reply.cursor?.nextBatch||[];const key=c.collection||c.name;c.stat.decodedRows[key]=(c.stat.decodedRows[key]||0)+rows.length;c.stat.commands[c.name]=(c.stat.commands[c.name]||0)+1;c.stat.driverBatchBytes+=Buffer.byteLength(JSON.stringify(rows));});
  for(const [id,name] of [[actor,'editor'],[outsider,'outsider']])await User.create({uuid:id,centralID:'synthetic-'+name,email:`${name}@lt128.example.invalid`,firstName:'Synthetic',lastName:name,authType:'traditional',password:await bcrypt.hash(password,4),roles:[{org:'libretexts',role:'user'}]});
  await Project.create({projectID,orgID:'libretexts',title:'Synthetic only',members:[actor],leads:[],liaisons:[],auditors:[],tags:[],a11yReview:sections});
  const {default:api}=await import('../api.js');
  const app=express();app.use(cookieParser());app.use('/api/v1',api);server=http.createServer(app);
  await new Promise<void>(resolve=>server!.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${(server.address() as any).port}`;
  for(const name of ['editor','outsider']){const response=await fetch(origin+'/api/v1/auth/fallback-auth',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:`${name}@lt128.example.invalid`,password})});assert.equal(response.status,302);const c=response.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');if(name==='editor')cookie=c;else outsideCookie=c;}
  const base=`/project/${projectID}/accessibility/workqueue`;
  // First authorized GET creates exactly the current optional collections/indexes.
  assert.equal((await request(base)).status,200);
  const Records=conformanceRecords(),raw=Records.collection,Work=mongoose.connection.db!.collection('remediationworkitems');
  await raw.insertOne({projectID,kind:'scope',actor,at:new Date(now),createdAt:new Date(now),data:scope});
  const reviewDocs=sections.flatMap((s,i)=>criteria.map(c=>({_id:new mongoose.Types.ObjectId(),projectID,sectionID:String(s._id),criterionID:c.id,kind:'review',actor,at:new Date(now),createdAt:new Date(now),data:{criterionID:c.id,status:i===2?'fail':'pass',fingerprint:pageFingerprint(s),scopeVersion:scope.version,notes:`Synthetic reviewer evidence ${i}/${c.id}; `.repeat(8),environment:'Synthetic browser and keyboard',evidenceURLs:['https://fixture.invalid/evidence'],checks:c.checklist}})));
  await raw.insertMany(reviewDocs);
  const taskIDs=Array.from({length:500},(_,i)=>new mongoose.Types.ObjectId((90000+i).toString(16).padStart(24,'0')));
  await Work.insertMany(taskIDs.map((_id,i)=>({_id,projectID,key:`task-${i}`,sectionID:String(sections[i]._id),sectionTitle:`Synthetic ${i}`,sectionURL:`https://fixture.invalid/${i}`,criterionID:'1.1.1',title:`Synthetic task ${i}`,status:i>=400?'verified':'todo',priority:'normal',assignee:actor,version:0,createdAt:new Date(now),history:Array.from({length:250},(_,n)=>({actor,at:new Date(now-250+n),status:'todo',note:`Synthetic immutable note ${i}/${n}`})),scanEvidence:[{action:'scan',at,note:'Synthetic evidence 1'},{action:'scan',at,note:'Synthetic evidence 2'}]})));
  result.fixture={pages:500,criteria:criteria.length,initialReviews:reviewDocs.length,queueItems:500,queueHistoryEvents:125000,queueScanEvidenceEvents:1000,reviewNotesBytes:Buffer.byteLength(reviewDocs[0].data.notes)};
  result.indexes={reviews:await raw.indexes(),queue:await Work.indexes()};
  for(const suffix of ['/conformance','/conformance/report','/items/report']){
    check('Unauthenticated denied '+suffix,(await request(base+suffix,'')).status!==200);
    check('Outsider denied '+suffix,(await request(base+suffix,outsideCookie)).status===403);
  }
  const project=await Project.findOne({projectID}).lean();assert.ok(project);
  for(const phase of ['matching-25k','mixed-25k','mixed-125k']){
    if(phase==='mixed-25k'){
      // Only fixture setup changes current section state; journals are never rewritten.
      sections.forEach((s,i)=>{if(i%10===0)s.wcagReview.sourceHash=`changed-${i}`;if(i%10===1)s.wcagReview.rendered.state='failed';});
      await Project.updateOne({projectID},{$set:{a11yReview:sections}});
      project!.a11yReview=sections as any;
    }
    if(phase==='mixed-125k'){
      for(let generation=1;generation<=4;generation++)await raw.insertMany(reviewDocs.map(({_id,...r},i)=>({...r,_id:new mongoose.Types.ObjectId(),at:new Date(now-generation*1000),createdAt:new Date(now-generation*1000),data:{...r.data,notes:`Superseded synthetic generation ${generation} ${i}`,fingerprint:'old-source-'+generation,scopeVersion:'old-scope-'+generation}})));
    }
    const scenario:any={name:phase,reviews:await raw.countDocuments({projectID,kind:'review'}),measurements:[]};result.scenarios.push(scenario);
    const journalBefore=createHash('sha256').update(JSON.stringify(await raw.find({projectID}).sort({_id:1}).toArray())).digest('hex');
    const history=await raw.find({projectID,kind:'review'}).sort({createdAt:-1,_id:-1}).toArray();
    const auditedReviews=history.map(r=>({...r.data,_id:r._id,sectionID:r.sectionID,actor:r.actor,at:r.at}));
    const oracle=conformanceReport(project,scope,auditedReviews,[],now);
    const pure=await measure('production-conformanceReport',()=>conformanceReport(project,scope,auditedReviews,[],now),0);
    pure.stat.outputBytes=Buffer.byteLength(JSON.stringify(pure.last));scenario.measurements.push(pure.stat);
    const load=await measure('production-loadConformance',()=>loadConformance(project,Records,{now}),0);scenario.measurements.push(load.stat);
    check(phase+' actual loader matches oracle digest',load.last.report.digest===oracle.digest);
    check(phase+' actual loader matches oracle verified total',load.last.report.verifiedCriteria===oracle.verifiedCriteria);
    const httpSummary=await measure('authenticated-summary',()=>request(base+'/conformance'));scenario.measurements.push(httpSummary.stat);
    assert.equal(httpSummary.last.status,200);const report=httpSummary.last.data.report;
    check(phase+' first page 100 and summary <=1MiB',report.pages.length===100&&httpSummary.last.bytes<=1048576);
    check(phase+' summary uses exact whole-project totals',report.totalCriteria===25000&&report.verifiedCriteria===oracle.verifiedCriteria&&report.digest===oracle.digest);
    scenario.semanticCounts={total:oracle.totalCriteria,verified:oracle.verifiedCriteria,statuses:Object.fromEntries(['pass','fail','stale','unreviewed'].map(status=>[status,oracle.pages.flatMap(p=>p.criteria).filter(c=>c.status===status).length])),blockedPages:oracle.pages.filter(p=>p.blockers.length).length};
    const continuation=await measure('authenticated-summary-next-page',()=>request(base+'/conformance?cursor='+encodeURIComponent(httpSummary.last.data.nextCursor)),0);scenario.measurements.push(continuation.stat);assert.equal(continuation.last.status,200);
    const detail=await measure('authenticated-one-criterion',()=>request(base+`/conformance/pages/${sections[3]._id}/criteria/1.1.1`),0);scenario.measurements.push(detail.stat);assert.equal(detail.last.status,200);
    let allPages=report.pages,cursor=httpSummary.last.data.nextCursor;
    while(cursor){const next=await request(base+'/conformance?cursor='+encodeURIComponent(cursor));assert.equal(next.status,200);allPages=allPages.concat(next.data.report.pages);cursor=next.data.nextCursor;}
    check(phase+' cursor visits every page exactly once',allPages.length===500&&new Set(allPages.map((p:any)=>p.sectionID)).size===500);
    const exported=await measure('authenticated-full-export',()=>request(base+'/conformance/report'),0);scenario.measurements.push(exported.stat);assert.equal(exported.last.status,200);
    check(phase+' full export complete, exact journal length and digest',exported.last.data.complete===true&&exported.last.data.pages.length===500&&exported.last.data.recordHistory.length===scenario.reviews+1&&exported.last.data.digest===oracle.digest);
    check(phase+' full export keeps reviewer notes',exported.last.data.recordHistory.find((r:any)=>r._id===String(reviewDocs[3]._id))?.data.notes===reviewDocs[3].data.notes);
    scenario.journalSHA256=createHash('sha256').update(JSON.stringify(await raw.find({projectID}).sort({_id:1}).toArray())).digest('hex');
    if(phase==='matching-25k'){
      const q=await measure('authenticated-queue',()=>request(base));scenario.measurements.push(q.stat);assert.equal(q.last.status,200);
      check('Queue bounded100 excludes history/scanEvidence',q.last.data.items.length===100&&q.last.data.items.every((i:any)=>!i.history&&!i.scanEvidence));
      const filtered=await request(base+'?view=bounded-v2&status=open');
      scenario.queueFilterEvidence={requestedStatus:'todo',returnedStatuses:[...new Set(filtered.data.items.map((i:any)=>i.status))],visibleOpenInFirstPage:filtered.data.items.filter((i:any)=>i.status!=='verified').length,actualOpenCount:await Work.countDocuments({projectID,status:{$ne:'verified'}}),hasNextCursor:!!filtered.data.nextCursor};
      check('Fixed queue finds older open tasks before pagination',scenario.queueFilterEvidence.visibleOpenInFirstPage===100&&scenario.queueFilterEvidence.actualOpenCount===400&&filtered.data.lists.items.total===400);
      const queueSHA=async()=>createHash('sha256').update(JSON.stringify(await Work.find({projectID}).sort({_id:1}).toArray())).digest('hex');
      const queueBefore=await queueSHA();
      const upper=(await Work.findOne({projectID},{sort:{_id:-1},projection:{_id:1}}))!._id;
      const plans=async()=>{
        const result:any={};
        for(const status of ['all','open','verified']){
          const filter={projectID,_id:{$lte:upper},...(status==='all'?{}:{status:status==='open'?{$in:['todo','in_progress','needs_review','blocked']}:status})};
          result[status]={batch:await Work.find(filter).project({history:0,scanEvidence:0}).sort({_id:-1}).limit(101).explain('executionStats'),count:await Work.aggregate([{$match:filter},{$count:'total'}]).explain('executionStats')};
        }return result;
      };
      result.queueIndexTrials={productStartup:await plans()};
      for(const status of ['open','all','verified','todo']){
        const measured=await measure('authenticated-queue-v2-'+status,()=>request(base+'?view=bounded-v2&status='+status));scenario.measurements.push(measured.stat);assert.equal(measured.last.status,200);check('Queue v2 '+status+' bounded complete metadata',measured.last.bytes<=1048576&&measured.last.data.lists.items.returned===100&&measured.last.data.lists.items.total===(status==='all'?500:status==='verified'?100:400));
      }
      let queuePage=filtered,queueIDs=queuePage.data.items.map((x:any)=>x._id),batchCount=1;
      while(queuePage.data.nextCursor){queuePage=await request(base+'?view=bounded-v2&status=open&cursor='+encodeURIComponent(queuePage.data.nextCursor));assert.equal(queuePage.status,200);assert.equal(queuePage.data.lists.items.complete,false);queueIDs.push(...queuePage.data.items.map((x:any)=>x._id));batchCount++;}
      check('All four100-row open batches exactly cover400 older tasks',batchCount===4&&queueIDs.length===400&&new Set(queueIDs).size===400);
      result.queueJournalSHA256=await queueSHA();check('Queue reads preserve full journal SHA',queueBefore===result.queueJournalSHA256);
      const h=await measure('authenticated-task-history',()=>request(base+`/${taskIDs[0]}/history`));scenario.measurements.push(h.stat);assert.equal(h.last.status,200);
      const queueExport=await measure('authenticated-queue-export',()=>request(base+'/items/report'),0);scenario.measurements.push(queueExport.stat);
      check('Queue export complete all500/125k history',queueExport.last.data.complete===true&&queueExport.last.data.items.length===500&&queueExport.last.data.items.reduce((n:number,i:any)=>n+i.history.length,0)===125000);
      const candidates=await measure('production-queueCandidates-50-manual',()=>queueCandidates(sections[0]));candidates.stat.count=candidates.last.length;scenario.measurements.push(candidates.stat);
      result.queryPlans={queue:await Work.find({projectID}).sort({_id:-1}).project({history:0,scanEvidence:0}).limit(101).explain('executionStats'),reviews:await raw.find({projectID,kind:'review',sectionID:{$in:sections.map(s=>String(s._id))},'data.criterionID':{$in:criteria.map(c=>c.id)}}).sort({createdAt:-1,_id:-1}).project({_id:1,sectionID:1,'data.criterionID':1,'data.scopeVersion':1,'data.fingerprint':1,'data.status':1}).explain('executionStats')};
    }
    check(phase+' all reads preserve journal SHA',journalBefore===createHash('sha256').update(JSON.stringify(await raw.find({projectID}).sort({_id:1}).toArray())).digest('hex'));
    // Save after each phase so an interrupted export still leaves exact partial evidence.
    writeFileSync(output,JSON.stringify(result,null,2)+'\n');
    process.stdout.write(JSON.stringify({phase,reviews:scenario.reviews,counts:scenario.semanticCounts,measurements:scenario.measurements.map((m:any)=>({name:m.name,coldMs:m.coldMs,warm:m.warm,bytes:m.responseBytes,rows:m.decodedRowsPerInvocation}))})+'\n');
  }
  result.success=true;writeFileSync(output,JSON.stringify(result,null,2)+'\n');
}catch(error){result.failure=String(error);writeFileSync(output,JSON.stringify(result,null,2)+'\n');throw error;}
finally{if(server)await new Promise<void>(resolve=>server!.close(()=>resolve()));await mongoose.disconnect();}
