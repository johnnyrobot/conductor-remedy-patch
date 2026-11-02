/** Evidence only: fresh server child, separate HTTP client process, existing OWNED fixture.
 * Copy beside other probes in scratch server/scripts. Replaces only the owned
 * synthetic editor's password for real fallback login; no journal/source edits.
 */
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
const uri=process.env.CONDUCTOR_TEST_MONGO_URI||'';
assert.match(uri,/^mongodb:\/\/127\.0\.0\.1:\d+\/conductor_test_lt128_[\w-]+$/);
if(process.env.LT128_MEMORY_CHILD==='true'){
  Object.assign(process.env,{SECRETKEY:randomBytes(48).toString('hex'),PRODUCTIONURLS:'http://localhost',ORG_ID:'libretexts',APP_ENV:'remedy_test',STRIPE_SECRET_KEY:'sk_test_synthetic_not_real',OPENAI_API_KEY:'synthetic_not_real',QDRANT_URL:'http://127.0.0.1:1',QDRANT_PORT:'1',QDRANT_API_KEY:'synthetic_not_real',REMEDY_ENABLED:'true',REMEDY_ORG_ID:'libretexts',REMEDY_API_KEY:'synthetic_not_real',REMEDY_API_BASE_URL:'http://127.0.0.1:1'});
  const nativeFetch=globalThis.fetch;
  globalThis.fetch=async(input:any,init?:any)=>{const u=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);assert.ok(['127.0.0.1','localhost'].includes(u.hostname));return nativeFetch(input,init);};
  const [{default:mongoose},{default:bcrypt},{default:express},{default:cookieParser},{default:http},{default:axios}]=await Promise.all([import('mongoose'),import('bcryptjs'),import('express'),import('cookie-parser'),import('node:http'),import('axios')]);
  axios.defaults.adapter=async()=>{throw Error('Provider HTTP forbidden');};
  await mongoose.connect(uri);
  const {default:User}=await import('../models/user.js');
  const password=randomBytes(24).toString('hex');
  assert.equal((await User.updateOne({email:'editor@lt128.example.invalid'},{$set:{password:await bcrypt.hash(password,4)}})).matchedCount,1);
  const {default:api}=await import('../api.js');
  const app=express();app.use(cookieParser());app.use('/api/v1',api);const server=http.createServer(app);
  await new Promise<void>(r=>server.listen(41828,'127.0.0.1',r));
  let timer:any,initial:any,peak:any;
  process.on('message',async(message:any)=>{
    if(message.kind==='start'){global.gc?.();initial=process.memoryUsage();peak={...initial};timer=setInterval(()=>{const m=process.memoryUsage();for(const key of ['rss','heapUsed','external'])peak[key]=Math.max(peak[key],m[key]);},2);process.send?.({kind:'started'});}
    if(message.kind==='stop'){clearInterval(timer);const m=process.memoryUsage();for(const key of ['rss','heapUsed','external'])peak[key]=Math.max(peak[key],m[key]);global.gc?.();process.send?.({kind:'measured',initial,peak,retained:process.memoryUsage(),maxRSS:process.resourceUsage().maxRSS*1024});}
    if(message.kind==='close'){await new Promise<void>(r=>server.close(()=>r()));await mongoose.disconnect();process.exit(0);}
  });
  process.send?.({kind:'ready',origin:`http://127.0.0.1:${(server.address() as any).port}`,password});
}else{
  const child=fork(fileURLToPath(import.meta.url),[],{execArgv:['--expose-gc','--import','tsx'],env:{...process.env,LT128_MEMORY_CHILD:'true'},stdio:['ignore','ignore','pipe','ipc']});
  const queue:any[]=[],waiting:any[]=[];child.on('message',m=>waiting.length?waiting.shift()(m):queue.push(m));
  let stderr='';child.stderr?.on('data',chunk=>stderr+=chunk.toString());
  const receive=()=>queue.length?Promise.resolve(queue.shift()):new Promise<any>((resolve,reject)=>{waiting.push(resolve);const timer=setTimeout(()=>reject(Error('Child message timeout')),120000);timer.unref();});
  const out:any={synthetic:true,definition:'Fresh isolated server process. Parent consumes HTTP bodies; child memory excludes fixture construction, oracle and client buffers. 2ms samples plus endpoint readings; sampled maxima can undercount transient peaks. No OS cache flush.',measurements:[]};
  try{
    const ready=await receive();assert.equal(ready.kind,'ready');
    const login=await fetch(ready.origin+'/api/v1/auth/fallback-auth',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'editor@lt128.example.invalid',password:ready.password})});assert.equal(login.status,302);
    const cookie=login.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
    for(const suffix of ['?view=bounded-v2&status=open','?view=bounded-v2&status=all','?view=bounded-v2&status=verified','/conformance','/conformance/report','/items/report']){
      child.send({kind:'start'});assert.equal((await receive()).kind,'started');
      const times:number[]=[];let body='';const total=suffix.endsWith('/report')?1:21;
      for(let iteration=0;iteration<total;iteration++){const start=performance.now();const response=await fetch(ready.origin+'/api/v1/project/lt128bench/accessibility/workqueue'+suffix,{headers:{cookie}});body=await response.text();assert.equal(response.status,200);times.push(performance.now()-start);}
      const sorted=times.slice(1).sort((a,b)=>a-b);
      child.send({kind:'stop'});const memory=await receive();assert.equal(memory.kind,'measured');
      if(suffix.endsWith('/report'))assert.equal(JSON.parse(body).complete,true);
      out.measurements.push({suffix,coldMilliseconds:times[0],warmMilliseconds:times.slice(1),p95:sorted.length?sorted[Math.ceil(sorted.length*.95)-1]:null,responseBytes:Buffer.byteLength(body),memory});
    }
    out.success=true;out.startupWarnings=stderr;
    writeFileSync(process.env.LT128_OUTPUT||'/tmp/conductor-lt128-implementation-memory.json',JSON.stringify(out,null,2)+'\n');
    process.stdout.write(JSON.stringify(out.measurements.map((m:any)=>({suffix:m.suffix,p95:m.p95,initialRSSMiB:m.memory.initial.rss/1048576,peakRSSMiB:m.memory.peak.rss/1048576,heapRetainedDeltaMiB:(m.memory.retained.heapUsed-m.memory.initial.heapUsed)/1048576})))+'\n');
  }finally{child.send({kind:'close'});}
}
