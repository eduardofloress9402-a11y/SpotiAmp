import {SpectrumMotion,SpectrumSurface,frequencyBands,spectrumLevels} from './spectrum.js';
const count=32,motion=new SpectrumMotion(count),levels=new Float32Array(count),silence=new Float32Array(count);
let surface=null,live=false,bandMap=null,sampleRate=0,frame=0,lastTime=0,drawnFrames=0;
const schedule=typeof requestAnimationFrame==='function'?requestAnimationFrame:fn=>setTimeout(()=>fn(performance.now()),1000/60);
const cancel=typeof cancelAnimationFrame==='function'?cancelAnimationFrame:clearTimeout;
function wake(){if(!frame)frame=schedule(draw);}
function draw(){
 const now=performance.now();
 frame=0;
 motion.update(live?levels:silence,lastTime?(now-lastTime)/1000:1/60);lastTime=now;
 surface?.draw(motion.levels,motion.peaks);drawnFrames++;
 if(live||motion.peaks.some(value=>value>.001))wake();else lastTime=0;
}
self.onmessage=event=>{
 const message=event.data;
 if(message.type==='probe'){self.postMessage({type:'probe',id:message.id,frames:drawnFrames});
 }else if(message.type==='init'){
  surface=new SpectrumSurface(message.canvas);surface.resize(message.width,message.height,message.scale);wake();
 }else if(message.type==='resize'){
  surface?.resize(message.width,message.height,message.scale);wake();
 }else if(message.type==='sample'){
  live=message.live;
  if(live){
   if(!bandMap||sampleRate!==message.sampleRate){sampleRate=message.sampleRate;bandMap=frequencyBands(sampleRate,message.fftSize,count);}
   spectrumLevels(message.data,bandMap,levels);
  }
  if(surface){
   const now=performance.now();
   // Consume a fresh sample immediately instead of waiting another display frame.
   if(!lastTime||now-lastTime>=7){if(frame)cancel(frame);frame=0;draw(now);}
   else wake();
  }
 }
};
self.postMessage({type:'ready'});
