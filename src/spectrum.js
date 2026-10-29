// Mel-spaced bands avoid repeated low FFT bins moving as a single block.
export function frequencyBands(sampleRate,fftSize,count=32){
 const resolution=sampleRate/fftSize;
 const low=40,high=Math.min(16000,sampleRate*.48);
 const edge=i=>(700+low)*((700+high)/(700+low))**(i/count)-700;
 return Array.from({length:count},(_,i)=>{
  const from=Math.max(1,Math.floor(edge(i)/resolution));
  const to=Math.min(fftSize/2,Math.max(from+1,Math.ceil(edge(i+1)/resolution)));
  return {from,to};
 });
}
export function spectrumLevels(decibels,bands,output=new Float32Array(bands.length)){
 const floor=10**((-78+20)/34);
 bands.forEach(({from,to},i)=>{
  let peak=-Infinity,power=0;
  for(let bin=from;bin<to;bin++){
   const db=decibels[bin]??-Infinity;
   peak=Math.max(peak,db);power+=10**(db/10);
  }
  const average=10*Math.log10(power/Math.max(1,to-from));
  const db=peak*.75+average*.25+4*i/Math.max(1,bands.length-1);
  // A compressed amplitude scale leaves headroom between quiet bands and hits.
  // Mapping dB directly to bar height made most of the display stay high.
  const amplitude=Math.max(0,(10**((db+20)/34)-floor)/(1-floor));
  // Lift smaller hits without pinning all louder bands to the ceiling.
  output[i]=Math.min(1,1.8*amplitude/(1+.8*amplitude));
 });
 return output;
}
export class SpectrumMotion{
 constructor(count=32){
  this.levels=new Float32Array(count);this.peaks=new Float32Array(count);
  this.hold=new Float32Array(count);this.velocity=new Float32Array(count);this.peakFall=new Float32Array(count);
 }
 update(targets,seconds){
  const dt=Math.max(0,Math.min(seconds,.1));
  for(let i=0;i<this.levels.length;i++){
   const target=Math.max(0,Math.min(1,targets[i]||0)),previous=this.levels[i];
   // Critically damped tracking preserves velocity when the signal changes.
   // Unlike the old rise/fall branches, it does not snap to a new direction.
   // Exact integration keeps the same timing at 30, 60 and 120Hz.
   const omega=target>=previous?110:18;
   const displacement=previous-target;
   const transient=(this.velocity[i]+omega*displacement)*dt;
   const decay=Math.exp(-omega*dt);
   let level=target+(displacement+transient)*decay;
   this.velocity[i]=(this.velocity[i]-omega*transient)*decay;
   if(level<0||level>1){level=Math.max(0,Math.min(1,level));this.velocity[i]=0;}
   if(target===0&&level<.0001&&Math.abs(this.velocity[i])<.002){level=0;this.velocity[i]=0;}
   this.levels[i]=level;
   if(level>=this.peaks[i]){this.peaks[i]=level;this.hold[i]=.14;this.peakFall[i]=.08;}
   else{
    const fallTime=Math.max(0,dt-this.hold[i]);this.hold[i]=Math.max(0,this.hold[i]-dt);
    this.peaks[i]=Math.max(level,this.peaks[i]-this.peakFall[i]*fallTime-.9*fallTime*fallTime);
    this.peakFall[i]=Math.min(1.8,this.peakFall[i]+1.8*fallTime);
   }
  }
  return this;
 }
}

// Draw the whole meter in one canvas. No per-frame element resizing or CSS masks.
export class SpectrumCanvas {
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});
  this.width=0;this.height=0;this.scale=1;
  this.resizeObserver=new ResizeObserver(entries=>{
   const {width,height}=entries[0].contentRect;
   this.resize(width,height);
  });
  this.resizeObserver.observe(canvas);
 }
 resize(width,height){
  if(!width||!height)return;
  this.width=width;this.height=height;this.scale=Math.min(devicePixelRatio||1,2);
  this.canvas.width=Math.round(width*this.scale);this.canvas.height=Math.round(height*this.scale);
  this.ctx.setTransform(this.scale,0,0,this.scale,0,0);
  const gradient=this.ctx.createLinearGradient(0,height,0,0);
  gradient.addColorStop(0,'#278c17');gradient.addColorStop(.55,'#62d02a');
  gradient.addColorStop(.8,'#bfd638');gradient.addColorStop(.94,'#d6a43a');gradient.addColorStop(1,'#c87b30');
  this.gradient=gradient;
  this.background=document.createElement('canvas');this.background.width=this.canvas.width;this.background.height=this.canvas.height;
  const bg=this.background.getContext('2d');bg.scale(this.scale,this.scale);bg.fillStyle='#000a02';bg.fillRect(0,0,width,height);
  bg.fillStyle='#193124';for(let x=1;x<width;x+=3)for(let y=1;y<height;y+=3)bg.fillRect(x,y,.5,.5);
  if(this.levels)this.draw(this.levels,this.peaks);
 }
 draw(levels,peaks){
  this.levels=levels;this.peaks=peaks;
  if(!this.width)return;
  const {ctx,width,height}=this;
  ctx.drawImage(this.background,0,0,this.background.width,this.background.height,0,0,width,height);
  const step=width/levels.length,gap=Math.min(1,step*.22),barWidth=step-gap;
  ctx.fillStyle=this.gradient;
  for(let i=0;i<levels.length;i++){
   const h=levels[i]*(height-1);
   if(h>.05)ctx.fillRect(i*step,height-h,barWidth,h);
  }
  // Translucent LED separators keep the top edge moving at fractional heights.
  ctx.fillStyle='#000a0260';for(let y=height-3;y>0;y-=3)ctx.fillRect(0,y,width,.65);
  ctx.fillStyle='#cbd4ce';for(let i=0;i<peaks.length;i++){
   if(peaks[i]>.015)ctx.fillRect(i*step,Math.max(0,height-peaks[i]*(height-1)-1),barWidth,1);
  }
 }
}
