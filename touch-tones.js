"use strict";

// TODO:
//
// queue and chain notes?
// Dial tone machine / beat box?
// dial whole phone number sound?
// whistly image (stackoverflow employee eval)?
//
// FFT and D3 for frequency and time domain views?


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

  this.playing = false;

  return this;
};

DualTone.prototype.disconnect = function () {
  if (this.lowOscillator) {
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
  console.info('Setting frequencies:', frequencies);

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

  this.disconnect();
  this.playing = false;

  return this;
};

DualTone.prototype.play = function (key, duration) {
  if (this.playing) {
    // Add to queue?
    console.error('Already playing');
    return this;
  }

  if (this.toneMap && this.toneMap[key] !== undefined) {
    this.setFrequencies(this.toneMap[key]);
  }
  duration = duration || 200;

  var lowOscillator = this.lowOscillator.start(0);
  var highOscillator = this.highOscillator.start(0);

  var stop =  function (tone) {
    tone.stop();
  };
  this.playing = true;
  window.setTimeout(stop, duration, this);

  return this;
};


// Set up UI

var drawTouchPad = function (keys) {
  var cellHeight = 88;
  var cellWidth = 88;
  var cellMargin = 2;

  var svg = d3.select('#keypad')
    .append('svg')
      .attr('width', 4*(cellHeight+cellMargin))
      .attr('height', 4*(cellHeight+cellMargin));

  var xPosition = function (value, index) {
    return (cellWidth + cellMargin) * (index % 4);
  };

  var yPosition = function (value, index) {
    return (cellWidth + cellMargin) * (index / 4 | 0);
  };

  var playTone = function (value) {
    tone.play(value);
  };

  var newKeys = svg.selectAll('rect')
    .data(keys)
    .enter();

  newKeys = newKeys.append('g')
    .attr('class', 'button')
    .attr('x', xPosition)
    .attr('y', yPosition)
    .on('click', playTone);

  newKeys.append('rect')
    .attr('x', xPosition)
    .attr('y', yPosition)
    .attr('height', cellHeight)
    .attr('width', cellWidth);


  newKeys.append('text')
    .attr('x', function (value, index) {
      return (cellWidth + cellMargin) * (index % 4) + cellWidth / 2;
    })
    .attr('y', function (value, index) {
      return (cellHeight + cellMargin) * (1+(index / 4 | 0)) - 20;
    })
    .text(function (value) { return value; });

};

drawTouchPad('123A456B789C*0#D'.split(''));

var frequencies = touchToneFreqs();
var tone = new DualTone(frequencies);
