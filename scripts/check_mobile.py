"""Prueba funcional: Python Playwright + Chromium, servidor iniciado. BASE_URL admite /SpotiAmp/."""
import os, math, wave, struct, tempfile, json
from pathlib import Path
from playwright.sync_api import sync_playwright
base=os.environ.get('BASE_URL','http://127.0.0.1:5173/').rstrip('/')+'/'
with tempfile.TemporaryDirectory() as tmp, sync_playwright() as p:
 files=[]
 for name,hz in [('Daft Test - Sine',440),('Modjo Test - Second',880)]:
  target=Path(tmp)/(name+'.wav')
  with wave.open(str(target),'wb') as wav:
   wav.setparams((1,2,22050,0,'NONE','not compressed'))
   wav.writeframes(b''.join(struct.pack('<h',int(5000*math.sin(2*math.pi*hz*i/22050))) for i in range(22050*12)))
  files.append(str(target))
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 context=browser.new_context()
 page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 for width,height in [(320,740),(390,844),(430,932),(1440,1000)]:
  page.set_viewport_size({'width':width,'height':height});page.goto(base,wait_until='networkidle')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  assert page.locator('#play').is_disabled()
  page.locator('#files').set_input_files(files)
  page.wait_for_function("document.querySelector('#play-state').textContent==='REPRODUCIENDO'")
  assert page.locator('.track').count()==2
  page.wait_for_function("document.querySelector('#duration').textContent==='00:12'")
  page.wait_for_function("(()=>{const c=document.querySelector('#spectrum-canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=0;i<d.length;i+=4)if(d[i+1]>100&&d[i+1]>d[i]*1.1)return true;return false;})()")
  page.locator('#pause').click();page.wait_for_function("!document.querySelector('.player').classList.contains('playing')")
  page.locator('#play').click();page.wait_for_function("document.querySelector('.player').classList.contains('playing')")
  page.locator('#seek').evaluate("e=>{e.value=5;e.dispatchEvent(new Event('change'))}")
  page.wait_for_function("document.querySelector('#time').textContent==='00:05'")
  page.locator('#volume').evaluate("e=>{e.value=30;e.dispatchEvent(new Event('input'));e.dispatchEvent(new Event('change'))}")
  assert page.locator('#volume-value').inner_text()=='30%'
  eq=page.locator('.equalizer input').nth(4)
  assert eq.is_enabled();eq.evaluate("e=>{e.value=-12;e.dispatchEvent(new Event('input'))}")
  assert 'dB' in page.locator('#status').inner_text()
  page.locator('#eq-preset').select_option('bass');assert page.locator('.equalizer input').nth(1).input_value()=='8'
  page.locator('#eq-power').click();assert page.locator('#eq-power').get_attribute('aria-pressed')=='false'
  assert page.locator('#eq-curve-line').get_attribute('d').startswith('M0 13')
  page.locator('#eq-power').click();assert page.locator('#eq-power').get_attribute('aria-pressed')=='true'
  page.locator('#eq-reset').click();assert eq.input_value()=='0'
  page.locator('#next').click();page.wait_for_function("document.querySelector('#track-title').textContent.includes('Second')")
  page.locator('#previous').click();page.wait_for_function("document.querySelector('#track-title').textContent.includes('Sine')")
  page.locator('#shuffle').click();assert page.locator('#shuffle').get_attribute('aria-pressed')=='true'
  page.locator('#next').click();page.wait_for_function("document.querySelector('#track-title').textContent.includes('Second')")
  page.locator('#repeat').click();assert page.locator('#repeat').get_attribute('aria-pressed')=='true'
  page.locator('#seek').evaluate("e=>{e.value=11;e.dispatchEvent(new Event('change'))}")
  page.wait_for_function("parseInt(document.querySelector('#time').textContent.slice(-2))<3",timeout=5000)
  page.locator('#stop').click();assert page.locator('#time').inner_text()=='00:00'
  page.locator('#search').fill('daft');assert page.locator('.track').count()==1
  page.locator('#search').fill('missing');assert page.locator('.empty').is_visible()
  page.locator('#search').fill('')
  page.screenshot(path=f'/tmp/spotiamp-real-{width}.png',full_page=True)
 # Verify the actual Web Audio gain/filter frequency response using an isolated real engine.
 measurements=page.evaluate("""async()=>{const {LocalAudio}=await import('./src/local-audio.js');const engine=new LocalAudio(()=>{},()=>{},()=>{});await engine.init();engine.equalize(4,-12);engine.volume(.3);engine.equalize(0,-6);await new Promise(r=>setTimeout(r,200));const f=new Float32Array([600]),mag=new Float32Array(1),phase=new Float32Array(1);engine.filters[3].getFrequencyResponse(f,mag,phase);return {db:20*Math.log10(mag[0]),volume:engine.master.gain.value,pre:engine.preamp.gain.value};}""")
 assert measurements['db']<-11,measurements
 assert abs(measurements['volume']-.3)<.01,measurements
 assert abs(measurements['pre']-.501)<.01,measurements
 # Mock Spotify responses and inspect every outgoing playback command.
 calls=[]
 item={'type':'track','id':'test','uri':'spotify:track:test','name':'Spotify Test','artists':[{'name':'Artist'}],'duration_ms':12000,'album':{'name':'Album'}}
 def route_api(route):
  req=route.request;calls.append((req.method,req.url,req.post_data))
  if '/search?' in req.url:route.fulfill(json={'tracks':{'items':[item]}})
  elif req.method=='GET':route.fulfill(json={'item':item,'progress_ms':2000,'is_playing':True,'shuffle_state':False,'repeat_state':'off','device':{'name':'Mock device','volume_percent':70,'supports_volume':True}})
  else:route.fulfill(status=204)
 page.route('https://api.spotify.com/**',route_api)
 page.evaluate("sessionStorage.setItem('spotiamp-token',JSON.stringify({access_token:'test-fixture',expires:Date.now()+3600000}))")
 page.locator('#source').select_option('spotify');page.wait_for_function("document.querySelector('#track-title').textContent.includes('Spotify Test')")
 assert page.locator('.equalizer input').first.is_disabled()
 for id in ['play','pause','stop','next','previous','shuffle','repeat']:page.locator('#'+id).click()
 page.locator('#seek').evaluate("e=>{e.value=4;e.dispatchEvent(new Event('change'))}")
 page.locator('#volume').evaluate("e=>{e.value=42;e.dispatchEvent(new Event('input'));e.dispatchEvent(new Event('change'))}")
 page.locator('#search').fill('test');page.locator('#search-form').evaluate("e=>e.requestSubmit()")
 page.wait_for_selector('.track');page.locator('.track').click();page.wait_for_timeout(250)
 for fragment in ['/play','/pause','/seek?position_ms=0','/seek?position_ms=4000','/next','/previous','/shuffle?state=true','/repeat?state=track','/volume?volume_percent=42','/search?']:
  assert any(fragment in url for _,url,_ in calls),fragment
 assert any(body and 'spotify:track:test' in body for _,_,body in calls)
 page.locator('#connect').click();assert page.locator('#redirect-uri').input_value()==base;page.locator('#close-settings').click()
 page.locator('#source').select_option('local')
 page.evaluate('navigator.serviceWorker.ready')
 assert page.evaluate("caches.keys().then(keys=>caches.open(keys.find(k=>k.endsWith('-v8')))).then(c=>c.keys()).then(k=>k.length===12)")
 context.set_offline(True);page.reload(wait_until='load');page.locator('#source').select_option('local')
 assert page.locator('#open-files').is_visible()
 page.locator('#files').set_input_files(files)
 page.wait_for_function("document.querySelector('#play-state').textContent==='REPRODUCIENDO'")
 assert not errors,errors
 browser.close()
 print('PASS: audio WAV real, analizador, EQ (-12dB), volumen, preamplificación, transporte, seek, repeat al finalizar, shuffle, búsqueda, Spotify con API simulada, offline y 4 tamaños.')
