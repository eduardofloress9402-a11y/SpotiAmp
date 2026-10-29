import {SpectrumSurface,SpectrumMotion,frequencyBands,spectrumLevels} from './spectrum.js';
// A worker keeps animating even when an unrelated UI task occupies the main thread.
// Older browsers use the same renderer and timing on the main thread.
export class SpectrumDisplay {
 constructor(canvas){
  this.canvas=canvas;this.worker=null;this.activeWorker=false;this.surface=null;
  this.motion=new SpectrumMotion(32);this.levels=new Float32Array(32);this.silence=new Float32Array(32);
  this.size={width:0,height:0,scale:Math.min(devicePixelRatio||1,1.5)};this.lastTime=0;this.lastSample=null;
  this.observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;this.size={...this.size,width,height};if(this.activeWorker)this.worker.postMessage({type:'resize',...this.size});else this.surface?.resize(width,height,this.size.scale);});
  this.observer.observe(canvas);
  if(typeof Worker!=='undefined'&&canvas.transferControlToOffscreen){
   try{
    this.worker=new Worker(new URL('./spectrum-worker.js',import.meta.url),{type:'module'});
    this.worker.onmessage=event=>{
     if(event.data.type!=='ready')return;
     try{const offscreen=this.canvas.transferControlToOffscreen();this.worker.postMessage({type:'init',canvas:offscreen,...this.size},[offscreen]);this.activeWorker=true;clearTimeout(this.timeout);if(this.lastSample)this.update(this.lastSample);}catch{this.fallback();}
    };
    this.worker.onerror=event=>{event.preventDefault();this.fallback();};
    this.timeout=setTimeout(()=>{if(!this.activeWorker)this.fallback();},2500);
   }catch{this.fallback();}
  }else this.fallback();
 }
 fallback(){
  clearTimeout(this.timeout);this.worker?.terminate();this.worker=null;this.activeWorker=false;
  // A transferred canvas cannot regain a main-thread context. Replace it cleanly.
  const replacement=this.canvas.cloneNode();this.observer.unobserve(this.canvas);this.canvas.replaceWith(replacement);this.canvas=replacement;this.observer.observe(replacement);
  this.surface=new SpectrumSurface(replacement);this.surface.resize(this.size.width,this.size.height,this.size.scale);this.surface.draw(this.motion.levels,this.motion.peaks);
 }
 update(sample){
  const wasLive=this.lastSample?.live;this.lastSample=sample;
  if(this.activeWorker){if(!sample.live&&wasLive===false)return;this.worker.postMessage({type:'sample',live:sample.live,...(sample.live?{data:sample.data,sampleRate:sample.sampleRate,fftSize:sample.fftSize}:{})});return;}
  if(!this.surface)return;
  if(!sample.live&&wasLive===false&&this.motion.peaks.every(value=>value<.001))return;
  if(sample.live){
   this.bandMap??=frequencyBands(sample.sampleRate,sample.fftSize,32);
   spectrumLevels(sample.data,this.bandMap,this.levels);
  }
  this.motion.update(sample.live?this.levels:this.silence,this.lastTime?(sample.now-this.lastTime)/1000:1/60);this.lastTime=sample.now;
  this.surface.draw(this.motion.levels,this.motion.peaks);
 }
}
