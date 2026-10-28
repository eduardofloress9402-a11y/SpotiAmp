// Logarithmic bands give bass and mids space instead of spreading the display
// linearly across inaudible upper bins. Levels always come from the audio FFT.
export function frequencyBands(sampleRate,fftSize,count=32){
 const resolution=sampleRate/fftSize;
 const low=45,high=Math.min(16000,sampleRate*.48);
 return Array.from({length:count},(_,i)=>{
  const from=Math.max(1,Math.floor(low*(high/low)**(i/count)/resolution));
  const to=Math.min(fftSize/2,Math.max(from+1,Math.ceil(low*(high/low)**((i+1)/count)/resolution)));
  return {from,to};
 });
}
export function spectrumLevels(decibels,bands){
 return bands.map(({from,to},i)=>{
  let peak=-Infinity,power=0;
  for(let bin=from;bin<to;bin++){
   const db=decibels[bin]??-Infinity;
   peak=Math.max(peak,db);power+=10**(db/10);
  }
  const average=10*Math.log10(power/Math.max(1,to-from));
  const db=peak*.75+average*.25;
  // Modest high-frequency compensation, fixed gain: silence remains silence.
  const tilt=6*i/Math.max(1,bands.length-1);
  return Math.max(0,Math.min(1,(db+tilt+78)/60));
 });
}
export class SpectrumMotion{
 constructor(count=32){this.levels=new Float32Array(count);this.peaks=new Float32Array(count);this.hold=new Float32Array(count);}
 update(targets,seconds){
  const dt=Math.max(0,Math.min(seconds,.1));
  for(let i=0;i<this.levels.length;i++){
   const target=targets[i]||0,previous=this.levels[i];
   // Immediate upward response, short falling tail, independent of refresh rate.
   const level=target>=previous?target:target+(previous-target)*Math.exp(-dt/.085);
   this.levels[i]=level;
   if(level>=this.peaks[i]){this.peaks[i]=level;this.hold[i]=.085;}
   else if(this.hold[i]>0)this.hold[i]-=dt;
   else this.peaks[i]=Math.max(level,this.peaks[i]-dt*1.35);
  }
  return this;
 }
}
