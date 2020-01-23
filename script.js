const player = new core.SoundFontPlayer('https://storage.googleapis.com/download.magenta.tensorflow.org/soundfonts_js/salamander');
const allData = [];  // [ {fileName, sequence} ]
let currentSongIndex;
const canvasData = [
  { // Previous.
    canvas: new p5(sketch, document.querySelector('.previous .canvas-container')),
    size: 100
  },
  { // Current.
    canvas: new p5(sketch, document.querySelector('.current .canvas-container')),
    size: 300
  },
  {  // Next.
    canvas: new p5(sketch, document.querySelector('.next .canvas-container')),
    size: 100
  }
];

// FML, these p5 canvases are async?
setTimeout(init, 100);

function init() {
  // Event listeners.
  document.getElementById('btnPlay').addEventListener('click', playOrPause);
  document.getElementById('btnSave').addEventListener('click', saveSong);
  document.getElementById('btnFave').addEventListener('click', faveOrUnfaveSong);
  document.getElementById('btnNext').addEventListener('click', nextSong);
  document.getElementById('btnPrevious').addEventListener('click', previousSong);

  // Get the first 3 songs and update the view when ready.
  Promise.all([getSong(), getSong(), getSong(), getSong()])
  .then(() => {
    setCurrentSong(1);
  });
}

async function getSong() {
  return new Promise((resolve, reject) => {
    const songData = {};
    allData.push(songData);

    songData.fileName =  getRandomMidiFilename();
    core.urlToNoteSequence(songData.fileName).then((ns) => {
      const quantized = core.sequences.quantizeNoteSequence(ns, 4);
      songData.sequence = quantized;
      resolve();
    });
  });
}

function setCurrentSong(index) {
  currentSongIndex = index;
  player.loadSamples(allData[index].sequence);

  // Previous.
  updateCanvas(allData[index - 1], 0);
  // Current.
  updateCanvas(allData[index], 1);
  // Next.
  updateCanvas(allData[index + 1], 2);
}

function updateCanvas(songData, index) {
  const shortFileName = songData.fileName.replace('./midi/', '');
  document.querySelectorAll('.song-title')[index].textContent = shortFileName;
  canvasData[index].canvas.drawAlbum(canvasData[index].size, songData.sequence);
}

function getRandomMidiFilename() {
  const tempFiles = [7425, 7426, 74110, 74252, 74257, 37758];
  const index = Math.floor(Math.random() * tempFiles.length);
  return `./midi/${tempFiles[index]}.mid`;
}

function playOrPause(event) {
  event.target.classList.toggle('active');

  if (player.isPlaying()) {
    player.stop();
  } else {
    player.start(allData[currentSongIndex].sequence);
  }
}

function nextSong() {
  getSong().then(() => setCurrentSong(currentSongIndex + 1));
}

function previousSong() {
  // Loop around if we're at the beginning of the list.
  if (currentSongIndex === 1) {
    setCurrentSong(allData.length - 2);
  } else {
    setCurrentSong(currentSongIndex - 1);
  }
}

function saveSong(event) {
}

function faveOrUnfaveSong(event) {
  event.target.classList.toggle('active');
}

function sketch(p) {
  const BLACK = 0;
  const BACKGROUND = '#f2f4f6';
  const PRIMARY_LIGHT = '#f582ae';
  const SECONDARY_LIGHT = '#00ebc7';
  const TERTIARY_LIGHT = '#ffd803';
  const FOURTH_LIGHT = '#d4d8f0';
  const PRIMARY_DARK = '#232946';
  const COLORS = [SECONDARY_LIGHT, PRIMARY_LIGHT, TERTIARY_LIGHT, PRIMARY_DARK, FOURTH_LIGHT, BLACK];

  p.setup = function() {
    p.createCanvas(10, 10);
    p.rectMode(p.CENTER);
    p.noLoop();
  };

  p.drawAlbum = function(size, ns) {
    p.resizeCanvas(size, size);
    p.background(BACKGROUND);

    const maxVelocity = Math.max(...ns.notes.map(n => n.velocity));

    for (let i = 0; i < ns.notes.length; i++) {
      const note = ns.notes[i];
      const size = note.quantizedEndStep - note.quantizedStartStep;

      const shape = Math.floor(Math.random() * 4);
      const c = p.color(COLORS[Math.floor(Math.random() * COLORS.length)]);
      c.setAlpha(note.velocity / maxVelocity * 255);

      const x = Math.random() * p.width;
      const y = Math.random() * p.height;

      switch(shape) {
        case 0:  // Circle
          drawCircle(x, y, size, c);
          break;
        case 1:  // Rectangle.
          drawRectangle(x, y, size, size * 2, c);
          break;
        case 2: // Rotated rectangle;
          drawRotatedRectangle(x, y, size, size * 2, c);
          break;
        case 3:
          drawRotatedRectangle2(x,y, size, size * 2,c);
          break;
      }
    }
  }

  function setupFillAndStroke(color, size, outline) {
    if (outline) {
      p.noFill();
      p.stroke(color);
      // You know, "a sensible weight".
      const weight = Math.max(1, Math.floor(size/7));
      p.strokeWeight(weight);
    } else {
      p.noStroke();
      p.fill(color);
    }
  }

  function drawCircle(x, y, size, color, outline=false) {
    setupFillAndStroke(color, size, outline);
    p.ellipse(x, y, size, size);
  }

  function _drawRotatedRectangle(x, y, w, h, color, outline=false, angle) {
    setupFillAndStroke(color, w, outline);
    p.push(); // Start a new drawing state
    p.translate(x, y);
    p.rotate(angle); // 45deg.
    p.rect(0, 0, w, h);
    p.pop();
  }

  function drawRotatedRectangle(x, y, w, h, color, outline=false) {
    _drawRotatedRectangle(x, y, w, h, color, outline, -p.PI / 4);
  }
  function drawRotatedRectangle2(x, y, w, h, color, outline=false) {
    _drawRotatedRectangle(x, y, w, h, color, outline, p.PI / 4);
  }

  function drawRectangle(x, y, w, h, color, outline=false) {
    setupFillAndStroke(color, w, outline);
    p.rect(x, y, w, h);
  }

  function drawTriangle(x, y, size, color, outline=false) {
    setupFillAndStroke(color, size, outline);
    p.triangle(
      x, y - size / 2,
      x + size / 2, y + size / 2,
      x - size / 2, y + size / 2
    );
  }
};
