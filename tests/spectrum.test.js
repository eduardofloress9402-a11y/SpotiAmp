import test from 'node:test';
import assert from 'node:assert/strict';
import {frequencyBands,spectrumLevels,SpectrumMotion} from '../src/spectrum.js';
test('silence has no fabricated motion and log bands cover audible range',()=>{
 for(const rate of [22050,44100,48000]){
  const bands=frequencyBands(rate,2048);assert.equal(bands.length,32);
  assert.ok(bands.every(b=>b.from>=1&&b.to>b.from&&b.to<=1024));
  assert.ok(bands[31].to>bands[0].to*50);
  const levels=spectrumLevels(new Float32Array(1024).fill(-Infinity),bands);
  assert.ok(levels.every(v=>v===0));
 }
});
test('bass and treble move different bands and quiet audio stays visible',()=>{
 const bands=frequencyBands(48000,2048);const fft=new Float32Array(1024).fill(-Infinity);
 fft[Math.round(120/(48000/2048))]=-40;
 const bass=spectrumLevels(fft,bands);
 assert.ok(bass.slice(0,12).some(v=>v>.4));assert.ok(bass.slice(20).every(v=>v===0));
 fft.fill(-Infinity);fft[Math.round(6000/(48000/2048))]=-35;
 const treble=spectrumLevels(fft,bands);assert.ok(treble.slice(20).some(v=>v>.4));assert.ok(treble.slice(0,12).every(v=>v===0));
});
test('instant attacks, quick decay, held peaks, and consistent refresh rates',()=>{
 const m=new SpectrumMotion(1);m.update([.9],1/60);assert.ok(m.levels[0]>.89);
 for(let i=0;i<4;i++)m.update([0],1/60);
 assert.ok(m.levels[0]<.42);assert.ok(m.peaks[0]>.89);
 for(let i=0;i<90;i++)m.update([0],1/60);
 assert.ok(m.levels[0]<.001);assert.ok(m.peaks[0]<.001);
 const a=new SpectrumMotion(1),b=new SpectrumMotion(1);a.update([1],1/60);b.update([1],1/120);
 for(let i=0;i<12;i++)a.update([0],1/60);
 for(let i=0;i<24;i++)b.update([0],1/120);
 assert.ok(Math.abs(a.levels[0]-b.levels[0])<.001);
});
