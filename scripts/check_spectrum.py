"""Verifica respuesta visual a pulsos reales de graves/agudos y silencio."""
import math,os,struct,tempfile,wave,statistics
from pathlib import Path
from playwright.sync_api import sync_playwright
base=os.environ.get('BASE_URL','http://127.0.0.1:5173/')
with tempfile.TemporaryDirectory() as tmp,sync_playwright() as p:
 target=Path(tmp)/'Pulse test.wav';rate=44100
 with wave.open(str(target),'wb') as wav:
  wav.setparams((1,2,rate,0,'NONE','not compressed'))
  samples=[]
  for i in range(rate*6):
   t=i/rate;cycle=int(t/.6);phase=t% .6;hz=120 if cycle%2==0 else 6000
   samples.append(struct.pack('<h',int(4000*math.sin(2*math.pi*hz*t)) if phase<.27 else 0))
  wav.writeframes(b''.join(samples))
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 page=browser.new_page(viewport={'width':390,'height':844})
 page.add_init_script('const NativeAudio=window.Audio;window.Audio=class extends NativeAudio{constructor(...args){super(...args);window.testAudio=this;}};')
 page.goto(base,wait_until='networkidle');page.locator('#files').set_input_files(str(target))
 page.wait_for_function("window.testAudio&&!window.testAudio.paused")
 samples=page.evaluate("""()=>new Promise(resolve=>{const samples=[],start=performance.now(),canvas=document.querySelector('#spectrum-canvas');window.meterMutations=0;const observer=new MutationObserver(list=>window.meterMutations+=list.length);observer.observe(document.querySelector('.spectrum'),{attributes:true,childList:true,subtree:true});function sample(){const a=window.testAudio,ctx=canvas.getContext('2d'),{width,height}=canvas;const pixels=ctx.getImageData(0,0,width,height).data;const heights=Array.from({length:32},(_,i)=>{const x=Math.min(width-1,Math.floor((i+.4)*width/32));for(let y=0;y<height;y++){const n=(y*width+x)*4;if(pixels[n+1]>65&&pixels[n+1]>pixels[n]*1.12)return (height-y)/height*100;}return 0;});samples.push({time:a.currentTime,low:Math.max(...heights.slice(0,12)),high:Math.max(...heights.slice(20)),max:Math.max(...heights)});if(performance.now()-start>3000){observer.disconnect();resolve(samples);}else requestAnimationFrame(sample);}sample();})""")
 low=[s for s in samples if int(s['time']/.6)%2==0 and .08<s['time']%.6<.24]
 high=[s for s in samples if int(s['time']/.6)%2==1 and .08<s['time']%.6<.24]
 silence=[s['max'] for s in samples if .50<s['time']%.6<.58]
 assert len(low)>5 and len(high)>5 and len(silence)>5
 assert statistics.mean(s['low'] for s in low)>50
 assert statistics.mean(s['high'] for s in high)>50
 assert statistics.mean(s['low']-s['high'] for s in low)>20
 assert statistics.mean(s['high']-s['low'] for s in high)>20
 assert statistics.mean(silence)<18,statistics.mean(silence)
 assert page.locator('#spectrum-canvas').count()==1
 assert page.evaluate('window.meterMutations')==0, 'El dibujo no debe modificar elementos HTML en cada cuadro'
 page.locator('#pause').click();page.wait_for_timeout(1100)
 assert page.evaluate("""(()=>{const c=document.querySelector('#spectrum-canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=0;i<d.length;i+=4)if(d[i+1]>65&&d[i+1]>d[i]*1.12)return false;return true;})()""")
 browser.close()
 print('PASS: pulsos de 120 Hz y 6 kHz activan bandas distintas; ataque visible, caída rápida en silencio y reposo sin animación artificial y cero modificaciones del DOM durante la animación.')
