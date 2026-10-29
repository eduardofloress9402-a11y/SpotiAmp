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
export function spectrumLevels(decibels,bands){
 const floor=10**((-78+20)/34);
 return bands.map(({from,to},i)=>{
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
  return Math.min(1,1.8*amplitude/(1+.8*amplitude));
 });
}
export class SpectrumMotion{
 constructor(count=32){
  this.levels=new Float32Array(count);this.peaks=new Float32Array(count);
  this.hold=new Float32Array(count);this.fall=new Float32Array(count);this.peakFall=new Float32Array(count);
 }
 update(targets,seconds){
  const dt=Math.max(0,Math.min(seconds,.1));
  for(let i=0;i<this.levels.length;i++){
   const target=Math.max(0,Math.min(1,targets[i]||0)),previous=this.levels[i];
   let level;
   if(target>=previous){
    // A short rise softens square jumps without smearing the beat.
    level=target+(previous-target)*Math.exp(-dt/.014);this.fall[i]=2.8;
   }else{
    const speed=this.fall[i];
    level=Math.max(target,previous-speed*dt-4*dt*dt);
    this.fall[i]=speed+8*dt;
   }
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
