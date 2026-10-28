import test from 'node:test';
import assert from 'node:assert/strict';
import {formatTime,filterTracks,mapTrack} from '../src/spotify.js';
test('búsqueda por artista y canción, sin distinguir mayúsculas',()=>{const tracks=[{name:'One More Time',artist:'Daft Punk'},{name:'Lady',artist:'Modjo'}];assert.equal(filterTracks(tracks,'  DAFT  ').length,1);assert.equal(filterTracks(tracks,'lady')[0].artist,'Modjo');assert.equal(filterTracks(tracks,'missing').length,0);assert.equal(filterTracks(tracks,'').length,2);});
test('duración en minutos y segundos',()=>{assert.equal(formatTime(320),'05:20');assert.equal(formatTime(0),'00:00');assert.equal(formatTime(429),'07:09');});
test('respuesta Spotify se convierte al modelo del reproductor',()=>{assert.deepEqual(mapTrack({id:'1',uri:'spotify:track:1',name:'Song',artists:[{name:'A'},{name:'B'}],duration_ms:123456,album:{name:'Album'},external_urls:{spotify:'https://open.spotify.com/track/1'}}),{id:'1',uri:'spotify:track:1',name:'Song',artist:'A, B',duration:123,album:'Album',url:'https://open.spotify.com/track/1'});});
