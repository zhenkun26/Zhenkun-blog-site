import subprocess,os,json,time,pathlib,hashlib,shutil,urllib.request,signal
root=pathlib.Path.cwd(); output=root/'tmp/final-matrix';output.mkdir(exist_ok=False)
env=os.environ.copy();env.pop('CF_WORKERS',None);env.pop('NODE_OPTIONS',None);env['ASTRO_TELEMETRY_DISABLED']='1'
steps=[]
def run(name,args,extra=None,timeout=600):
 e=env.copy();e.update(extra or {})
 started=time.time()
 with (output/(name+'.log')).open('wb') as f:r=subprocess.run(args,env=e,stdout=f,stderr=subprocess.STDOUT,timeout=timeout)
 step={'name':name,'command':args,'env':{'CF_WORKERS':'unset','NODE_OPTIONS':'unset','ASTRO_TELEMETRY_DISABLED':'1',**(extra or {})},'exitCode':r.returncode,'seconds':round(time.time()-started,3)}
 steps.append(step);(output/'execution.json').write_text(json.dumps(steps,indent=2)+'\n');print(json.dumps(step),flush=True)
 if r.returncode:raise SystemExit(r.returncode)
run('peers',['corepack','pnpm','peers','check'])
run('biome',['corepack','pnpm','exec','biome','ci','src','scripts/zhenkun-security-audit.mjs','scripts/zhenkun-test-security-audit.mjs','scripts/zhenkun-security-policy.json','scripts/zhenkun-cache-remediation.mjs','scripts/zhenkun-cache-repair-contract.json','scripts/zhenkun-test-cache-policy.mjs','scripts/zhenkun-test-astro-cache-generator.mjs'])
run('astro-check',['corepack','pnpm','check'])
run('types',['corepack','pnpm','type-check'])
run('strict-parent-types',['corepack','pnpm','exec','tsc','--ignoreConfig','--noEmit','--strict','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','scripts/zhenkun-swup-parent-types.ts'])
run('native',['node','--test',*sorted(str(p) for p in pathlib.Path('scripts').glob('zhenkun-test-*.mjs'))])
for name,base,port in [('root','/',4347),('project','/Zhenkun-blog-site/',4348)]:
 run('build-'+name,['corepack','pnpm','build'],{'DEPLOY_BASE':base})
 run('artifacts-'+name,['node','scripts/zhenkun-verify-ci-artifacts.mjs','--base',base])
 files={str(p.relative_to(root/'dist')):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((root/'dist').rglob('*')) if p.is_file()}
 (output/('manifest-'+name+'.json')).write_text(json.dumps(files,indent=2)+'\n')
 snapshot=root/'tmp'/('final-dist-'+name);shutil.copytree(root/'dist',snapshot)
 # Use the actual Astro preview for the same DEPLOY_BASE and compare served bytes.
 previewEnv=env.copy();previewEnv['DEPLOY_BASE']=base
 log=(output/('preview-'+name+'.log')).open('wb')
 server=subprocess.Popen(['corepack','pnpm','preview','--host','127.0.0.1','--port',str(port)],env=previewEnv,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
 try:
  ready=False
  for _ in range(100):
   if server.poll() is not None:raise RuntimeError('preview exited before readiness')
   try:
    with urllib.request.urlopen('http://127.0.0.1:'+str(port)+base,timeout=1) as r:
     if r.status==200:ready=True;break
   except Exception:time.sleep(.1)
  if not ready:raise RuntimeError('preview readiness timeout')
  run('http-'+name,['python3','scripts/zhenkun-verify-deployment.py','--base',base,'--expected-posts','0','--http','http://127.0.0.1:'+str(port)])
 finally:
  os.killpg(server.pid,signal.SIGTERM)
  try:server.wait(timeout=10)
  except subprocess.TimeoutExpired:raise RuntimeError('owned preview did not stop')
  log.close()
 print(json.dumps({'base':base,'artifactFiles':len(files),'previewStopped':True}),flush=True)
print('FINAL_LOCAL_MATRIX_PASS',flush=True)
