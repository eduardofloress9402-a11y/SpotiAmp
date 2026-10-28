export const bands=[60,170,310,600,1000,3000,6000,12000,14000,16000];
export class LocalAudio {
 constructor(onUpdate,onEnded,onError){
  this.audio=new Audio();this.audio.preload='metadata';this.audio.volume=1;this.level=.7;
  for(const event of ['timeupdate','durationchange','play','pause','loadedmetadata'])this.audio.addEventListener(event,()=>onUpdate(this));
  this.audio.addEventListener('ended',onEnded);this.audio.addEventListener('error',()=>onError('No se pudo reproducir este archivo. Probá con MP3, WAV o un formato compatible con tu navegador.'));
 }
 async init(){
  if(!this.context){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw new Error('Este navegador no permite procesar audio. Probá con Chrome o Safari actualizado.');
   this.context=new Context();this.source=this.context.createMediaElementSource(this.audio);this.preamp=this.context.createGain();this.preamp.gain.value=1;this.filters=bands.map(f=>{const filter=this.context.createBiquadFilter();filter.type='peaking';filter.frequency.value=f;filter.Q.value=1;return filter;});this.analyser=this.context.createAnalyser();this.analyser.fftSize=256;this.master=this.context.createGain();this.master.gain.value=this.level;
   let node=this.source;for(const next of [this.preamp,...this.filters,this.analyser,this.master,this.context.destination]){node.connect(next);node=next;}this.data=new Uint8Array(this.analyser.frequencyBinCount);
  }await this.context.resume();
 }
 async play(track){await this.init();if(track&&this.audio.src!==track.url){this.audio.src=track.url;this.audio.load();}if(!this.audio.src)throw new Error('Primero agregá una canción desde + ARCHIVOS.');await this.audio.play();}
 pause(){this.audio.pause();}
 stop(){this.pause();if(this.audio.src)this.audio.currentTime=0;}
 seek(seconds){if(Number.isFinite(this.audio.duration))this.audio.currentTime=Math.max(0,Math.min(seconds,this.audio.duration));}
 volume(value){this.level=value;if(this.master)this.master.gain.setTargetAtTime(value,this.context.currentTime,.015);}
 equalize(index,db){if(!this.context)return;if(index===0)this.preamp.gain.setTargetAtTime(10**(db/20),this.context.currentTime,.02);else this.filters[index-1].gain.setTargetAtTime(db,this.context.currentTime,.02);}
}
