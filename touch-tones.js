// TODO: Karplus-Strong
// TODO: queue and chain notes?
// Dial whole phone numbers
// Dial tone machine / beat box?
// Frequency and time domain views? D3 for these and buttons?


var touchToneFreqs = function () {
  // Construct map of touch tone frequency combinations in Hz

  var specialTones = {
    'US': {
      busy: [480, 620],
      ringback: [440, 480],
      dial: [350, 440]
    }
  };

  var tones = {
    lows: [697, 770, 852, 941],
    his: [1209, 1336, 1477, 1633],
    keys: [
      1,    4,   7,  '*', 
      2,    5,   8,   0, 
      3,    6,   9,  '#', 
      'A',  'B', 'C', 'D'
    ]
  };

  var keyMap = specialTones['US'];
  for (var h = 0; h < tones.his.length; h++) {
    for (var l = 0; l < tones.lows.length; l++){
      keyMap[tones.keys[l+h*4]] = [tones.lows[l], tones.his[h]];
    }
  }

  // Overwrite ourselves to memoize result
  touchToneFreqs = function () {
    return keyMap;
  };
  // Expose private data for building the UI
  touchToneFreqs.tones = tones;
  return keyMap;
};


// DualTone Class
var DualTone = function (toneMap) {
  if (!(this instanceof DualTone)) {
    throw new Error("Must instantiate with new.");
  }

  this.toneMap = toneMap;
  this.context = new webkitAudioContext();

  return this;
};

DualTone.prototype.disconnect = function () {
  if (this.lowOscillator) {
    console.log('disconnecting');
    this.lowOscillator.disconnect(0);
    delete this.lowOscillator;
  }
  if (this.highOscillator) {
    this.highOscillator.disconnect(0);
    delete this.highOscillator;
  }
  return this;
};

DualTone.prototype.setFrequencies = function (frequencies) {
  console.info('setting frequencies', frequencies);
  var context = this.context;

  this.lowOscillator = context.createOscillator();
  this.highOscillator = context.createOscillator();

  this.lowOscillator.connect(context.destination);
  this.highOscillator.connect(context.destination);

  this.lowOscillator.frequency.value = frequencies[0];
  this.highOscillator.frequency.value = frequencies[1];

  return this;
};

DualTone.prototype.stop = function () {
  this.lowOscillator.stop(0);
  this.highOscillator.stop(0);

  return this;
};

DualTone.prototype.play = function (key, duration) {
  if (this.toneMap && this.toneMap[key] !== undefined) {
    this.setFrequencies(this.toneMap[key]);
  }
  duration = duration || 200;

  var lowOscillator = this.lowOscillator.start(0);
  var highOscillator = this.highOscillator.start(0);

  var stop =  function (tone) { 
    tone.stop().disconnect();
  };
  window.setTimeout(stop, duration, this);

  return this;
};


// UI
var tone = new DualTone(touchToneFreqs());
tone.play('2');


var dialer = document.querySelector('#dialer');

var findButton = function (el) {
  // recurse up to the svg element looking for the data-button value
  console.log(el, el.dataSet, el.tagName);
  if (el.dataSet && el.dataSet.button) {
    return el.dataSet.button;
  } else if (el.parentNode && el.parentNode.tagName !== 'svg') {
    return findButton(el.parentNode);
  } else {
    return null;
  }
};

var hi = function (event) {
  console.log(this, event, findButton(event.target));
};
dialer.addEventListener('click', hi, false);
