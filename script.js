const FILE_PREFIX = 'https://magentadata.storage.googleapis.com/piano_transformer_midi/';
// Update this if the format we store the data into local storage has changed.
const STORAGE_VERSION = '0.0.1';
const STORAGE_KEYS = {FAVES: 'faves', VERSION: 'data_version'};

const player = new core.SoundFontPlayer('https://storage.googleapis.com/download.magenta.tensorflow.org/soundfonts_js/salamander');
const allData = [];  // [ {path, fileName, sequence} ]
let currentSongIndex;
let secondsElapsed, progressInterval;
const canvas =  new p5(sketch, document.querySelector('.canvas-container'));
const HAS_LOCAL_STORAGE = typeof(Storage) !== 'undefined';

// FML, these p5 canvases are async?
setTimeout(init, 100);

function init() {
  // Event listeners.
  document.getElementById('btnPlay').addEventListener('click', playOrPause);
  document.getElementById('btnFave').addEventListener('click', faveOrUnfaveSong);
  document.getElementById('btnPlaylist').addEventListener('click', togglePlaylist);
  document.getElementById('btnSave').addEventListener('click', save);
  document.getElementById('btnHelp').addEventListener('click', toggleHelp);
  document.getElementById('btnNext').addEventListener('click', () => nextSong());
  document.getElementById('btnPrevious').addEventListener('click', () => previousSong());

  const hash = window.location.hash.substr(1).trim();
  const initialMidi = hash !== '' ? `${FILE_PREFIX}${hash}` : undefined;

  // Get a current song and a previous song so that we can click previous, i guess.
  Promise.all([getSong(), getSong(initialMidi)])
  .then(() => changeSong(1, true));

  // If we don't have local storage, we don't have playlists.
  if (!HAS_LOCAL_STORAGE) {
    document.getElementById('btnFave').hidden = true;
    document.getElementById('btnPlaylist').hidden = true;
  } else {
    // Check if we have to nuke the playlists because they're in the wrong format.
    const version = getFromLocalStorage(STORAGE_KEYS.VERSION);
    if (version !== STORAGE_VERSION) {
      window.localStorage.clear();
      saveToLocalStorage(STORAGE_KEYS.VERSION, STORAGE_VERSION);
    }
  }
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
    removeSongFromPlaylist(currentSongIndex);
  } else {
    btn.classList.add('active');
    addSongToPlaylist(currentSongIndex);
  }

  if (document.querySelector('.playlist').classList.contains('showing')) {
    refreshPlayListIfVisible();
  }
}

function save() {
  const song = allData[currentSongIndex];
  window.saveAs(
    new File([window.core.sequenceProtoToMidi(song.sequence)],
    song.fileName));
}

function togglePlaylist(event) {
    // If an existing popup is open, close it.
  document.querySelector('.help').classList.remove('showing');
  document.querySelector('#btnHelp').classList.remove('active');

  event.target.classList.toggle('active');
  const el = document.querySelector('.playlist');
  el.classList.toggle('showing');
  refreshPlayListIfVisible();
}

function toggleHelp(event) {
  // If an existing popup is open, close it.
  document.querySelector('.playlist').classList.remove('showing');
  document.querySelector('#btnPlaylist').classList.remove('active');

  event.target.classList.toggle('active');
  const el = document.querySelector('.help');
  el.classList.toggle('showing');
}

/*
 * Helpers.
 */
function pausePlayer(andStop = false) {
  if (andStop) {
    player.stop();
    document.querySelector('.current-time').textContent = '0:00';
    document.querySelector('progress').value = 0;
    secondsElapsed = 0;
  } else {
    player.pause();
  }
  clearInterval(progressInterval);
  document.getElementById('btnPlay').classList.remove('active');
  document.querySelector('.album').classList.remove('rotating');
}

function startPlayer() {
  const state = player.getPlayState();
  if (state === 'stopped') {
    secondsElapsed = 0;
    player.start(allData[currentSongIndex].sequence).then(nextSong);
  } else {
    player.resume();
  }
  progressInterval = setInterval(updateProgressBar, 1000);
  document.getElementById('btnPlay').classList.add('active');
  document.querySelector('.album').classList.add('rotating');
}

const progressBar = document.querySelector('progress');
const currentTime = document.querySelector('.current-time');
function updateProgressBar() {
  secondsElapsed++;
  progressBar.value = secondsElapsed;
  currentTime.textContent = formatSeconds(secondsElapsed);
}

// Next/previous should also start the song.
function nextSong() {
  getSong().then(() => changeSong(currentSongIndex + 1));
}

function previousSong() {
  // Loop around if we're at the beginning of the list.
  const index = currentSongIndex === 1 ? allData.length - 2 : currentSongIndex - 1;
  changeSong(index);
}

function changeSong(index, noAutoplay = false) {
  pausePlayer(true);

  // Update to this song.
  currentSongIndex = index;
  window.location.hash = allData[index].fileName;

  // Get ready for playing, and start playing if we need to.
  // This takes the longes so start early.
  const sequence = allData[index].sequence;
  player.loadSamples(sequence).then(() => {
    if (!noAutoplay) {
      startPlayer();
    }
  });

  // Set up the progress bar.
  const seconds = Math.round(sequence.totalTime);
  const totalTime = formatSeconds(seconds);
  document.querySelector('.total-time').textContent = totalTime;

  const progressBar = document.querySelector('progress');
  progressBar.max = seconds;
  progressBar.value = 0;

  // Set up the album art.
  updateCanvas(allData[index]);
  updateFaveButton();
}

function updateFaveButton() {
  if (!HAS_LOCAL_STORAGE) return;
  const btn = document.getElementById('btnFave');
  const faves = getFromLocalStorage(STORAGE_KEYS.FAVES);

  const index = faves.findIndex(x => x.name === allData[currentSongIndex].fileName);
  // Is the current song a favourite song?
  if (index !== -1) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
}

function refreshPlayListIfVisible() {
  if (!HAS_LOCAL_STORAGE ||
    !document.querySelector('.playlist').classList.contains('showing')) {
    return;
  }

  const faves = getFromLocalStorage(STORAGE_KEYS.FAVES);
  const ul = document.querySelector('.playlist ul');
  ul.innerHTML = '';

  // Header.
  const li = document.createElement('li');
  li.className = 'list-header';
  li.innerHTML = `<div>title</div><div>length</div><div></div>`;
  ul.appendChild(li);

  for (let i = 0; i < faves.length; i++) {
    const li = document.createElement('li');
    li.innerHTML = `
    <div>${faves[i].name}</div>
    <div>${faves[i].totalTime}</div>
    <div class="horizontal">
      <button title="play song" class="play" data-filename=${faves[i].name}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
      <button title="un-favourite song" class="remove" data-index=${i}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    </div>`;

    ul.appendChild(li);
    li.onclick = (event) => {
      const className = event.target.className;
      if (className === 'remove') {
        document.getElementById('btnFave').classList.remove('active');
        removeSongFromPlaylist(event.target.dataset.index);
      } else if (className === 'play') {

        getSong(`${FILE_PREFIX}${event.target.dataset.filename}`).then(
          () => changeSong(allData.length - 1));
      }
    }
  }
}

function addSongToPlaylist(index) {
  if (!HAS_LOCAL_STORAGE) return;
  const faves = getFromLocalStorage(STORAGE_KEYS.FAVES);
  const song = allData[currentSongIndex]
  faves.push({
    name: song.fileName,
    totalTime: formatSeconds(song.sequence.totalTime)
  });
  saveToLocalStorage(STORAGE_KEYS.FAVES, faves);
  refreshPlayListIfVisible();
}

function removeSongFromPlaylist(index) {
  if (!HAS_LOCAL_STORAGE) return;
  const faves = getFromLocalStorage(STORAGE_KEYS.FAVES);
  faves.splice(index, 1);
  saveToLocalStorage(STORAGE_KEYS.FAVES, faves);
  refreshPlayListIfVisible();
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

function getFromLocalStorage(key) {
  return JSON.parse(window.localStorage.getItem(key) || '[]');
}

function saveToLocalStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

// From https://stackoverflow.com/questions/3733227/javascript-seconds-to-minutes-and-seconds.
function formatSeconds(s) {
  s = Math.round(s);
  return(s-(s%=60))/60+(9<s?':':':0')+s;
}

/*
 * Album art.
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
