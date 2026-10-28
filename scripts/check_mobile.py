"""Opcional: pip install playwright; requiere Chromium. BASE_URL permite cambiar el servidor."""
import os
from playwright.sync_api import sync_playwright
base=os.environ.get('BASE_URL','http://127.0.0.1:5173')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context()
 page=context.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 for width,height in [(320,740),(390,844),(430,932),(1440,1000)]:
  page.set_viewport_size({'width':width,'height':height})
  page.goto(base,wait_until='networkidle')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  assert page.locator('.track').count()==6
  if width<600:
   assert not page.locator('.intro').is_visible()
   assert page.locator('#play').bounding_box()['height']>=44
  page.locator('#search').fill('modjo')
  assert page.locator('.track').count()==1
  page.locator('.track').click()
  assert 'Modjo' in page.locator('#track-title').inner_text()
  page.locator('#pause').click()
  page.locator('#install').click()
  if page.locator('#install-help').is_visible():page.locator('#close-install').click()
  page.locator('#search').fill('')
  page.screenshot(path=f'/tmp/spotiamp-{width}.png',full_page=True)
 assert page.evaluate("fetch('/manifest.webmanifest').then(r=>r.json()).then(m=>m.display==='standalone'&&m.icons.length===3)")
 page.evaluate('navigator.serviceWorker.ready')
 assert page.evaluate("caches.open('spotiamp-shell-v1').then(c=>c.keys()).then(k=>k.length===10)")
 context.set_offline(True)
 page.reload(wait_until='load')
 assert page.locator('.track').count()==6
 page.locator('#search').fill('modjo')
 assert page.locator('.track').count()==1
 assert not errors,errors
 browser.close()
 print('PASS: 320/390/430/1440px, controles táctiles, búsqueda, selección, pausa, manifest, caché y demo offline.')
