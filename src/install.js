const button=document.querySelector('#install');
const dialog=document.querySelector('#install-help');
let prompt;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
if(standalone())button.hidden=true;
addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;button.hidden=false;});
addEventListener('appinstalled',()=>{button.hidden=true;prompt=null;});
button.addEventListener('click',async()=>{if(prompt){await prompt.prompt();await prompt.userChoice;prompt=null;}else dialog.showModal();});
document.querySelector('#close-install').onclick=()=>dialog.close();
if('serviceWorker' in navigator&&window.isSecureContext){navigator.serviceWorker.register('/sw.js').catch(()=>{document.querySelector('#install-note').textContent='La instalación no está disponible ahora. Podés seguir usando SpotiAmp en el navegador.';});}
