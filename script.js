const player = new core.SoundFontPlayer('https://storage.googleapis.com/download.magenta.tensorflow.org/soundfonts_js/salamander');

// [previous, current, next]
const PREVIOUS = 0;
const CURRENT = 1;
const NEXT = 2;
const currentView = [
  {
    canvas: new p5(sketch, document.querySelector('.previous .canvas-container')),
    size: 100,
    sequence: null,
    fileName: null
  },
  {
    canvas: new p5(sketch, document.querySelector('.current .canvas-container')),
    size: 300,
    sequence: null,
    fileName: null
  },
  {
    canvas: new p5(sketch, document.querySelector('.next .canvas-container')),
    size: 100,
    sequence: null,
    fileName: null
  }
];
const data = [];

// FML, these p5 canvases are async?
setTimeout(init, 100);

document.getElementById('btnPlay').addEventListener('click', playOrPause);
document.getElementById('btnSave').addEventListener('click', save);
document.getElementById('btnFave').addEventListener('click', fave);

function init() {
  Promise.all([getSong(), getSong(), getSong()])
  .then(() => {
    setCurrentSong(CURRENT);
  });
}

async function getSong() {
  return new Promise((resolve, reject) => {
    const thisOne = {};
    data.push(thisOne);

    const fileName = getRandomMidiFilename();
    thisOne.fileName = fileName;

    core.urlToNoteSequence(fileName).then((ns) => {
      const quantized = core.sequences.quantizeNoteSequence(ns, 4);
      thisOne.sequence = quantized;
      player.loadSamples(quantized);
      resolve();
    });
  });
}

function setCurrentSong(index) {

  const thisOne = data[index];

  const fileName = filePath.replace('./midi/', '');
  document.querySelectorAll('.song-title')[index].textContent = fileName;
  thisOne.fileName = fileName;
  fileHistory.push = filePath;
 thisOne.sequence = quantized;
    thisOne.canvas.drawAlbum(thisOne.size, quantized);
}


function getRandomMidiFilename() {
  const tempFiles = [7425, 7426, 74110, 74252, 74257, 37758];
  const index = Math.floor(Math.random() * tempFiles.length);
  return `./midi/${tempFiles[index]}.mid`;

  // TODO: this should go back in when it can fetch these files.
  // const prefix = 'https://iansimon.users.x20web.corp.google.com/piano_transformer_radio';
  // const index = Math.floor(Math.random() * 99999);
  // return index < 50000 ?
  //     `${prefix}/midi0_4/${index}.mid` :
  //     `${prefix}/midi5_9/${index}.mid`;
}

function playOrPause(event) {
  event.target.classList.toggle('active');

  if (player.isPlaying()) {
    player.stop();
  } else {
    player.start(data[CURRENT].sequence);
  }
}

function nextSong() {
  getSong()
  // current -> next
  // previous -> current
  // next -> new

}

function previousSong() {
  // current -> previous
  // next -> current
  // previous -> new
}

function save(event) {
}

function fave(event) {
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
