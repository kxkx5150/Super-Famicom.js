let c = document.getElementById("output");
let ctx = c.getContext("2d");
let imgData = ctx.getImageData(0, 0, 512, 480);
let loopId = 0;
let loaded = false;
let paused = false;
let romArr = new Uint8Array([]);
let snes = new Snes();
let audioHandler = new AudioHandler();
let logging = false;
let noPpu = false;
let controlsP1 = {
  z: 0, // B
  a: 1, // Y
  shift: 2, // select
  enter: 3, // start
  arrowup: 4, // up
  arrowdown: 5, // down
  arrowleft: 6, // left
  arrowright: 7, // right
  x: 8, // A
  s: 9, // X
  d: 10, // L
  c: 11 // R
}
document.getElementById("rom").onchange = function (e) {
  //audioHandler.resume();
  let freader = new FileReader();
  freader.onload = function () {
    let buf = freader.result;
    romArr = new Uint8Array(buf);
    loadRom(romArr);
  }
  freader.readAsArrayBuffer(e.target.files[0]);
}
document.getElementById("pause").onclick = function () {
  if (paused && loaded) {
    loopId = requestAnimationFrame(update);
    audioHandler.start();
    paused = false;
    document.getElementById("pause").textContent = "Pause";
  } else {
    cancelAnimationFrame(loopId);
    audioHandler.stop();
    paused = true;
    document.getElementById("pause").textContent = "Continue";
  }
}
document.getElementById("reset").onclick = function (e) {
  snes.reset(false);
}
document.getElementById("ishirom").onchange = function (e) {
  if (loaded) {
    loadRom(romArr);
  }
}
function loadRom(rom) {
  let hiRom = document.getElementById("ishirom").checked;
  if (snes.loadRom(rom, hiRom)) {
    snes.reset(true);
    if (!loaded && !paused) {
      loopId = requestAnimationFrame(update);
      audioHandler.start();
    }
    loaded = true;
  }
}
function runFrame() {
  if (logging) {
    do {
      snes.cycle();
      // TODO: some way of tracing the spc again
      // if((snes.xPos % 20) === 0 && snes.apu.spc.cyclesLeft === 0) {
      // }
    } while (
      snes.cpuCyclesLeft > 0 ||
      (snes.xPos >= 536 && snes.xPos < 576) ||
      snes.hdmaTimer > 0
    );
  } else {
    snes.runFrame(noPpu);
  }
  snes.setPixels(imgData.data);
  ctx.putImageData(imgData, 0, 0);
  snes.setSamples(audioHandler.sampleBufferL, audioHandler.sampleBufferR);
  audioHandler.nextBuffer();
}
function update() {
  runFrame();
  loopId = requestAnimationFrame(update);
}
window.onkeydown = function (e) {
  switch (e.key) {
    case "l":
    case "L": {
      logging = !logging;
      break;
    }
    case "p":
    case "P": {
      noPpu = !noPpu;
      break;
    }
  }
  if (controlsP1[e.key.toLowerCase()] !== undefined) {
    e.preventDefault();
    snes.setPad1ButtonPressed(controlsP1[e.key.toLowerCase()]);
  }
}
window.onkeyup = function (e) {
  if (controlsP1[e.key.toLowerCase()] !== undefined) {
    e.preventDefault();
    snes.setPad1ButtonReleased(controlsP1[e.key.toLowerCase()]);
  }
}
function log(text) {console.log(text)}
function getByteRep(val) {
  return ("0" + val.toString(16)).slice(-2).toUpperCase();
}
function getWordRep(val) {
  return ("000" + val.toString(16)).slice(-4).toUpperCase();
}
function getLongRep(val) {
  return ("00000" + val.toString(16)).slice(-6).toUpperCase();
}
function clearArray(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = 0;
  }
}
