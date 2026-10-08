import subprocess,os,json,time,pathlib,hashlib,shutil,urllib.request,signal
root=pathlib.Path.cwd(); output=root/'tmp/final-matrix';assert output.is_dir()
env=os.environ.copy();env.pop('CF_WORKERS',None);env.pop('NODE_OPTIONS',None);env['ASTRO_TELEMETRY_DISABLED']='1'
steps=json.loads((output/'execution.json').read_text())
def run(name,args,extra=None,timeout=600):
 e=env.copy();e.update(extra or {})
 started=time.time()
 with (output/(name+'.log')).open('wb') as f:r=subprocess.run(args,env=e,stdout=f,stderr=subprocess.STDOUT,timeout=timeout)
 step={'name':name,'command':args,'env':{'CF_WORKERS':'unset','NODE_OPTIONS':'unset','ASTRO_TELEMETRY_DISABLED':'1',**(extra or {})},'exitCode':r.returncode,'seconds':round(time.time()-started,3)}
 steps.append(step);(output/'execution.json').write_text(json.dumps(steps,indent=2)+'\n');print(json.dumps(step),flush=True)
 if r.returncode:raise SystemExit(r.returncode)

for name,base,port in [('root','/',4347),('project','/Zhenkun-blog-site/',4348)]:
 if name=='project':
  run('build-'+name,['corepack','pnpm','build'],{'DEPLOY_BASE':base})
  run('artifacts-'+name,['node','scripts/zhenkun-verify-ci-artifacts.mjs','--base',base])
  files={str(p.relative_to(root/'dist')):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((root/'dist').rglob('*')) if p.is_file()}
  (output/('manifest-'+name+'.json')).write_text(json.dumps(files,indent=2)+'\n')
  shutil.copytree(root/'dist',root/'tmp'/('final-dist-'+name))
 run('preview-'+name+'-background',['corepack','pnpm','exec','astro','preview','--host','127.0.0.1','--port',str(port)],{'DEPLOY_BASE':base},timeout=30)
 try:
  ready=False
  for _ in range(100):
   try:
    with urllib.request.urlopen('http://127.0.0.1:'+str(port)+base,timeout=1) as r:
     if r.status==200:ready=True;break
   except Exception:time.sleep(.1)
  if not ready:raise RuntimeError('preview readiness timeout')
  run('http-'+name,['python3','scripts/zhenkun-verify-deployment.py','--base',base,'--expected-posts','0','--http','http://127.0.0.1:'+str(port)])
 finally:
  run('preview-'+name+'-stop',['corepack','pnpm','exec','astro','preview','stop'],{'DEPLOY_BASE':base},timeout=30)
 print(json.dumps({'base':base,'previewStopped':True}),flush=True)
print('FINAL_LOCAL_MATRIX_PASS',flush=True)
