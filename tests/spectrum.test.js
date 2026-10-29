import test from 'node:test';
import assert from 'node:assert/strict';
import {frequencyBands,spectrumLevels,SpectrumMotion} from '../src/spectrum.js';
test('silence is empty, audible range is covered and neighboring bands use different bins',()=>{
 for(const rate of [22050,44100,48000]){
  const bands=frequencyBands(rate,2048);assert.equal(bands.length,32);
  assert.ok(bands.every(b=>b.from>=1&&b.to>b.from&&b.to<=1024));
  assert.equal(new Set(bands.map(b=>b.from)).size,32);
  assert.ok(bands[31].to>bands[0].to*50);
  assert.ok(spectrumLevels(new Float32Array(1024).fill(-Infinity),bands).every(v=>v===0));
 }
});
test('separate frequency response and amplitude headroom instead of a wall of high bars',()=>{
 const bands=frequencyBands(48000,2048),fft=new Float32Array(1024).fill(-Infinity);
 fft[Math.round(120/(48000/2048))]=-40;
 const bass=spectrumLevels(fft,bands);
 assert.ok(bass.slice(0,12).some(v=>v>.1));assert.ok(bass.slice(20).every(v=>v===0));
 fft.fill(-Infinity);fft[Math.round(6000/(48000/2048))]=-35;
 const treble=spectrumLevels(fft,bands);assert.ok(treble.slice(20).some(v=>v>.2));assert.ok(treble.slice(0,12).every(v=>v===0));
 const quiet=spectrumLevels(new Float32Array(1024).fill(-50),bands);
 const loud=spectrumLevels(new Float32Array(1024).fill(-25),bands);
 assert.ok(quiet.every((v,i)=>v>0&&v<loud[i]*.3));assert.ok(loud.every(v=>v<1));
});
test('smooth fast rise, controlled fall, separately floating peaks and refresh-independent motion',()=>{
 const m=new SpectrumMotion(1);m.update([.9],1/60);
 assert.ok(m.levels[0]>.4&&m.levels[0]<.6,'first frame responds without an instantaneous square jump');
 for(let i=0;i<2;i++)m.update([.9],1/60);
 assert.ok(m.levels[0]>.87,'near full response in 50ms');
 const peak=m.peaks[0];for(let i=0;i<6;i++)m.update([0],1/60);
 assert.ok(m.levels[0]>.4&&m.levels[0]<.65);assert.ok(Math.abs(m.peaks[0]-peak)<.001);
 for(let i=0;i<12;i++)m.update([0],1/60);
 assert.ok(m.levels[0]<.04);assert.ok(m.peaks[0]>.7,'peaks remain floating after bars fall');
 for(let i=0;i<90;i++)m.update([0],1/60);
 assert.ok(m.levels[0]===0&&m.peaks[0]===0);
 const a=new SpectrumMotion(1),b=new SpectrumMotion(1);a.update([1],.1);b.update([1],.1);
 for(let i=0;i<12;i++)a.update([0],1/60);
 for(let i=0;i<24;i++)b.update([0],1/120);
 assert.ok(Math.abs(a.levels[0]-b.levels[0])<.001);
 assert.ok(Math.abs(a.peaks[0]-b.peaks[0])<.001);
});

test('changes in target preserve continuous position and velocity rather than making a sharp corner',()=>{
 const motion=new SpectrumMotion(1);motion.update([.8],.04);
 const before=motion.levels[0],velocity=motion.velocity[0];
 motion.update([0],.00001);
 assert.ok(Math.abs(motion.levels[0]-before)<.001);
 assert.ok(Math.abs(motion.velocity[0]-velocity)<.01);
 const slow=new SpectrumMotion(1),fast=new SpectrumMotion(1);
 for(let i=0;i<3;i++)slow.update([.8],1/30);
 for(let i=0;i<12;i++)fast.update([.8],1/120);
 assert.ok(Math.abs(slow.levels[0]-fast.levels[0])<.001);
 for(let i=0;i<9;i++)slow.update([0],1/30);
 for(let i=0;i<36;i++)fast.update([0],1/120);
 assert.ok(Math.abs(slow.levels[0]-fast.levels[0])<.001);
});
