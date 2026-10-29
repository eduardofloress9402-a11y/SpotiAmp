"""Verifica independencia del hilo de dibujo y fallback, con audio de prueba generado."""
import os,math,struct,tempfile,wave
from pathlib import Path
from playwright.sync_api import sync_playwright
base=os.environ.get('BASE_URL','http://127.0.0.1:5173/')
with tempfile.TemporaryDirectory() as tmp,sync_playwright() as p:
 target=Path(tmp)/'Worker test.wav'
 with wave.open(str(target),'wb') as wav:
  wav.setparams((1,2,22050,0,'NONE','not compressed'))
  wav.writeframes(b''.join(struct.pack('<h',int(4000*math.sin(2*math.pi*440*i/22050))) for i in range(22050*8)))
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 for fallback in [False,True]:
  context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=3)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  if fallback:page.add_init_script('HTMLCanvasElement.prototype.transferControlToOffscreen=undefined;')
  else:page.add_init_script("const NativeWorker=window.Worker;window.Worker=class extends NativeWorker{constructor(...args){super(...args);if(String(args[0]).includes('spectrum-worker'))window.testWorker=this;}};")
  page.goto(base,wait_until='networkidle');page.locator('#files').set_input_files(str(target))
  page.wait_for_function("document.querySelector('#play-state').textContent==='REPRODUCIENDO'")
  page.wait_for_function("(()=>{const c=document.querySelector('#spectrum-canvas'),b=document.createElement('canvas');b.width=c.width;b.height=c.height;const x=b.getContext('2d');x.drawImage(c,0,0);const d=x.getImageData(0,0,b.width,b.height).data;for(let i=0;i<d.length;i+=4)if(d[i+1]>100&&d[i+1]>d[i]*1.2)return true;return false;})()")
  ratio=page.evaluate("(()=>{const c=document.querySelector('#spectrum-canvas');return c.width/c.getBoundingClientRect().width;})()")
  assert ratio<=1.51,ratio
  if not fallback:
   page.evaluate("window.probeWorker=()=>new Promise(resolve=>{const id=Math.random();function handler(e){if(e.data.type==='probe'&&e.data.id===id){window.testWorker.removeEventListener('message',handler);resolve(e.data.frames);}}window.testWorker.addEventListener('message',handler);window.testWorker.postMessage({type:'probe',id});});")
   measured=page.evaluate("async()=>{const before=await window.probeWorker();const start=performance.now();while(performance.now()-start<350){}const after=await window.probeWorker();return after-before;}")
   assert measured>=10,measured
   print(f'PASS: {measured} cuadros dibujados mientras el hilo principal estuvo ocupado 350ms.')
  page.locator('#pause').click();page.wait_for_timeout(1800)
  if not fallback:
   idle=page.evaluate("async()=>{const before=await window.probeWorker();await new Promise(r=>setTimeout(r,400));return (await window.probeWorker())-before;}")
   assert idle==0,idle
  assert not errors,errors
  context.close();print('PASS: fallback' if fallback else 'PASS: worker y reposo sin dibujar.')
 browser.close()
