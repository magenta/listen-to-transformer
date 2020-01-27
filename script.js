const FILE_PREFIX = 'https://magentadata.storage.googleapis.com/piano_transformer_midi/';

const player = new core.SoundFontPlayer('https://storage.googleapis.com/download.magenta.tensorflow.org/soundfonts_js/salamander');
const allData = [];  // [ {path, fileName, sequence} ]
let currentSongIndex;
const canvas =  new p5(sketch, document.querySelector('.canvas-container'));
const HAS_LOCAL_STORAGE = typeof(Storage) !== 'undefined';

// FML, these p5 canvases are async?
setTimeout(init, 100);

function init() {
  // Event listeners.
  document.getElementById('btnPlay').addEventListener('click', playOrPause);
  document.getElementById('btnFave').addEventListener('click', faveOrUnfaveSong);
  document.getElementById('btnPlaylist').addEventListener('click', togglePlaylist);
  document.getElementById('btnHelp').addEventListener('click', toggleHelp);
  document.getElementById('btnNext').addEventListener('click', () => nextSong());
  document.getElementById('btnPrevious').addEventListener('click', () => previousSong());

  const progressBar = document.querySelector('progress');
  const currentTime = document.querySelector('.current-time');
  player.callbackObject = {
    run: (note) => {
      progressBar.value = note.startTime;
      currentTime.textContent = formatSeconds(Math.round(note.startTime));
    },
    stop: nextSong
  }
  // Get the first 3 songs and update the view when ready.
  Promise.all([getSong(), getSong()])
  .then(() => {
    setCurrentSong(1);
  });
}

async function getSong(path) {
  if (!path) {
    path = getRandomMidiFilename();
  }
  const songData = {};
  allData.push(songData);
  songData.path = path;
  songData.fileName = songData.path.replace(FILE_PREFIX, '');
  const ns = await core.urlToNoteSequence(path);
  const quantized = core.sequences.quantizeNoteSequence(ns, 4);
  songData.sequence = quantized;
  return quantized;
}

function setCurrentSong(index, startPlaying = false) {
  currentSongIndex = index;
  const sequence = allData[index].sequence;

  // Set up the progress bar.
  const seconds = Math.round(sequence.totalTime);
  const totalTime = formatSeconds(seconds);
  document.querySelector('.total-time').textContent = totalTime;

  const progressBar = document.querySelector('progress');
  progressBar.max = seconds;
  progressBar.value = 0;

  // Get ready for playing, and start playing if we need to.
  player.loadSamples(sequence).then(() => {
    if (startPlaying) {
      startPlayer();
    }
  });

  // Set up the album art.
  updateCanvas(allData[index]);
  updateFaveButton();
}

/*
 * Event listeners.
 */
function playOrPause() {
  const state = player.getPlayState();
  if (state === 'started') {
    pausePlayer();
  } else {
    startPlayer();
  }
}

function faveOrUnfaveSong(event) {
  const btn = event.target;
  if (btn.classList.contains('active')) {
    btn.classList.remove('active');
    removeSongFromPlaylist(allData[currentSongIndex].fileName);
  } else {
    btn.classList.add('active');
    addSongToPlaylist(allData[currentSongIndex].fileName);
  }

  if (document.querySelector('.playlist').classList.contains('showing')) {
    refreshPlayListIfVisible();
  }
}

function togglePlaylist(event) {
  event.target.classList.toggle('active');
  const el = document.querySelector('.playlist');
  el.classList.toggle('showing');
  refreshPlayListIfVisible();
}

function toggleHelp(event) {
  event.target.classList.toggle('active');
  const el = document.querySelector('.help');
  el.classList.toggle('showing');
}

function refreshPlayListIfVisible() {
  if (!document.querySelector('.playlist').classList.contains('showing')) {
    return;
  }

  const favesString =  window.localStorage.getItem('faves') || '[]';
  const faves = JSON.parse(favesString);

  const ul = document.querySelector('.playlist ul');
  ul.innerHTML = '';

  for (let i = 0; i < faves.length; i++) {
    const li = document.createElement('li');
    li.innerHTML = `<div>${faves[i]}</div><button>remove</button>`;
    ul.appendChild(li);
    li.onclick = (event) => {
      if (event.target.localName === 'button') {
        removeSongFromPlaylist(event.target.previousElementSibling.textContent);
      } else if (event.target.localName === 'div') {
        getSong(`${FILE_PREFIX}${event.target.textContent}`).then(
          () => setCurrentSong(allData.length - 1));
      } else {
        console.error('meep');
      }
    }
  }
}

/*
 * Helpers.
 */
function pausePlayer(andStop = false) {
  if (andStop) {
    player.stop();
    document.querySelector('.current-time').textContent = '0:00';
    document.querySelector('progress').value = 0;
  } else {
    player.pause();
  }
  document.getElementById('btnPlay').classList.remove('active');
  document.querySelector('.album').classList.remove('rotating');
}

function startPlayer() {
  const state = player.getPlayState();
  if (state === 'stopped') {
    player.start(allData[currentSongIndex].sequence).then(nextSong);
  } else {
    player.resume();
  }
  document.getElementById('btnPlay').classList.add('active');
  document.querySelector('.album').classList.add('rotating');
}

// Next/previous should also start the song.
function nextSong() {
  pausePlayer(true);
  getSong().then(() => setCurrentSong(currentSongIndex + 1, true));
}

function previousSong() {
  pausePlayer(true);

  // Loop around if we're at the beginning of the list.
  if (currentSongIndex === 1) {
    setCurrentSong(allData.length - 2, true);
  } else {
    setCurrentSong(currentSongIndex - 1, true);
  }
}

function updateFaveButton() {
  const btn = document.getElementById('btnFave');
  const favesString =  window.localStorage.getItem('faves') || '[]';
  const faves = JSON.parse(favesString);

  // Is the current song a favourite song?
  if (faves.indexOf(allData[currentSongIndex].fileName) !== -1) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
}

function updateCanvas(songData) {
  document.querySelector('.song-title').textContent = songData.fileName
  canvas.drawAlbum(songData.sequence);
}

function getRandomMidiFilename() {
  const numFiles = 99975;
  const index = Math.floor(Math.random() * numFiles);
  return `${FILE_PREFIX}${index}.mid`;
}

function addSongToPlaylist(song) {
  const favesString =  window.localStorage.getItem('faves') || '[]';
  const faves = JSON.parse(favesString);
  faves.push(song);
  window.localStorage.setItem('faves', JSON.stringify(faves));
  refreshPlayListIfVisible();
}

function removeSongFromPlaylist(song) {
  const favesString =  window.localStorage.getItem('faves') || '[]';
  const faves = JSON.parse(favesString);
  const index = faves.indexOf(song);
  faves.splice(index, 1);
  window.localStorage.setItem('faves', JSON.stringify(faves));
  refreshPlayListIfVisible();
}

// From https://stackoverflow.com/questions/3733227/javascript-seconds-to-minutes-and-seconds.
function formatSeconds(s) {
  return(s-(s%=60))/60+(9<s?':':':0')+s;
}

/*
 * Album art
 */
function sketch(p) {
  const BLACK = 0;
  const BACKGROUND = '#f2f4f6';
  const PRIMARY_LIGHT = '#f582ae';
  const SECONDARY_LIGHT = '#00ebc7';
  const TERTIARY_LIGHT = '#ffd803';
  const FOURTH_LIGHT = '#d4d8f0';
  const PRIMARY_DARK = '#232946';
  const COLORS = [SECONDARY_LIGHT, PRIMARY_LIGHT, TERTIARY_LIGHT, PRIMARY_DARK, FOURTH_LIGHT, BLACK];
  const CANVAS_SIZE = 300;

  p.setup = function() {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.rectMode(p.CENTER);
    p.noLoop();
  };

  p.drawAlbum = function(ns) {
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
