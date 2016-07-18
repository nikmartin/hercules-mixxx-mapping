// http://ts.hercules.com/download/sound/manuals/DJ_Instinct/QSG/DJCInstinct_Technical_specifications.pdf

function HCI () {}

// ----------   Global variables    ----------
//               [decka, deckb]
HCI.scratching = [false, false];
HCI.pitchSpeedFast = true; // temporary Pitch Speed of +/-  true =
HCI.vinylButton = false;
HCI.pitchSwitches = [];
HCI.pitchSwitches['A'] = [0, 0];
HCI.pitchSwitches['B'] = [0, 0];

HCI.pitchB = [0, 0];

HCI.PlaylistMode = 'File';
HCI.timerPlaylist = false;

// ----------   Functions    ----------

// called when the MIDI device is opened & set up
HCI.init = function (id, debugging) {
  HCI.id = id;
  HCI.FastPosition = [0, 0];
  HCI.jogFastPosition = [0, 0];

  HCI.allLedOff();
  midi.sendShortMsg(0x80, 0x39, 0x00); // LED Folder
  midi.sendShortMsg(0x90, 0x38, 0x7F); // LED File

  print('***** Hercules DJ Instinct S Control id: "' + id + '" initialized.');
};

// Called when the MIDI device is closed
HCI.shutdown = function (id) {
  HCI.allLedOff();
  print('***** Hercules DJ Instinct Control S id: "' + id + '" shutdown.');
};

// === MISC TO MANAGE LEDS ===

HCI.allLedOff = function () {
  // Switch off all LEDs
};

function debug (msg, channel, control, value, status, group) {
  group = group || '-';
  print(msg + ' channel:' + channel + ' control:' + control + ' value:' + value + ' status: ' + status + ' group:' + group);
}

// Use VinylButton as "Shift"-Button
HCI.vinylButtonHandler = function (channel, control, value, status) {
  if (value === ButtonState.pressed) {
    HCI.vinylButton = true;
    midi.sendShortMsg(0x90, 0x35, 0x7F); // LED Scratchmode
    print('***** Scratch Mode ON');
  } else {
    HCI.vinylButton = false;
    midi.sendShortMsg(0x80, 0x35, 0x00); // LED Scratchmode
    print('***** Scratch Mode OFF');
  }
};

// The button that enables/disables scratching
HCI.wheelTouch = function (channel, control, value, status) {
  debug('wheelTouch:', channel, control, value, status);
  /*
  ButtonControl 26 = deck a
  Button = Control 52 = deck B
  */
  var alpha = 1.0 / 8;
  var beta = alpha / 32;
  var speed = 33 + 1 / 3;
  switch (control) {
    case 26: // deck A
      if (value === 0x7F && !HCI.scratching[0]) { // catch only first touch

        engine.scratchEnable(1, 128, speed, alpha, beta);
        // Keep track of whether we're scratching on this virtual deck
        HCI.scratching[0] = true;
      } else { //  button up
        engine.scratchDisable(1);
        HCI.scratching[0] = false;
      }
      break;
    case 52: // deck B
      if (value === 0x7F && !HCI.scratching[1]) { // catch only first touch

        engine.scratchEnable(2, 128, 33 + 1 / 3, alpha, beta);
        // Keep track of whether we're scratching on this virtual deck
        HCI.scratching[1] = true;
      } else { //  button up
        engine.scratchDisable(2);
        HCI.scratching[1] = false;
      }
    default:
      break;

  }
};

HCI.wheelTurn = function (channel, control, value, status, group) {
  debug('wheelTurn:', channel, control, value, status, group);
  /*
  control 48 = Deck A
  control 49 = Deck B
  */
  // print('playing? ' + engine.getValue(group, 'play'))
  // See if we're  scratching.
  if (!HCI.scratching[0] && !HCI.scratching[1]) {
    if (!engine.getValue(group, 'play')) {
      if (value === 1) {
        engine.setValue('[Playlist]', 'SelectNextTrack', true);
      } else {
        engine.setValue('[Playlist]', 'SelectPrevTrack', true);
      }
    }
    return;
  }

  var newValue;
  if (value - 64 > 0) {
    newValue = value - 128; // 7F, 7E, 7D
  }  else {
    newValue = value;
  }
  switch (control) {
    case 50: // deck a
      engine.scratchTick(1, newValue);
      break;
    case 51: // deckb
      engine.scratchTick(2, newValue);
      break;
    default:
      break;
  }
};

HCI.knobIncrement = function (group, action, minValue, maxValue, centralValue, step, sign) {
  // This function allows you to increment a non-linear value like the volume's knob
  // sign must be 1 for positive increment, -1 for negative increment
  semiStep = step / 2;
  rangeWidthLeft = centralValue - minValue;
  rangeWidthRight = maxValue - centralValue;
  actual = engine.getValue(group, action);

  if (actual < 1) {
    increment = ((rangeWidthLeft) / semiStep) * sign;
  } else if (actual > 1) {
    increment = ((rangeWidthRight) / semiStep) * sign;
  } else if (actual === 1) {
    increment = (sign === 1) ? rangeWidthRight / semiStep : (rangeWidthLeft / semiStep) * sign;
  }

  if (sign === 1 && actual < maxValue) {
    newValue = actual + increment;
  } else if (sign === -1 && actual > minValue) {
    newValue = actual + increment;
  }

  return newValue;
};

// Pitch +/-
HCI.pitch = function (midino, control, value, status, group) {
  debug('pitch: ', midino, control, value, status, group);
  var speed = (HCI.vinylButton === true) ? '' : '_small';
  var state = (value === 127) ? 1 : 0;
  switch (control) {
    case 0x11:
      HCI.pitchSwitches['A'][0] = state;
      engine.setValue(group, 'rate_temp_down' + speed, state);
      break;
    case 0x12:
      HCI.pitchSwitches['A'][1] = state;
      engine.setValue(group, 'rate_temp_up' + speed, state);
      break;
    case 0x2B:
      HCI.pitchSwitches['B'][0] = state;
      engine.setValue(group, 'rate_temp_down' + speed, state);
      break;
    case 0x2C:
      HCI.pitchSwitches['B'][1] = state;
      engine.setValue(group, 'rate_temp_up' + speed, state);
      break;
  }
  // when buttons + and - pressed simultanously
  if (HCI.pitchSwitches['A'][0] && HCI.pitchSwitches['A'][1]) {
    // reset pitch to 0
    engine.setValue(group, 'rate', 0);
  }
  if (HCI.pitchSwitches['B'][0] && HCI.pitchSwitches['B'][1]) {
    engine.setValue(group, 'rate', 0);
  }
};

// Up/Down-Switches
HCI.tempPitch = function (midino, control, value, status, group) {
  debug('tempPitch: ', midino, control, value, status, group);
  var rate = (value === 127) ? 'rate_temp_down' : 'rate_temp_up';
  if (HCI.vinylButton === false) {
    rate = rate + '_small';
  }
  print(rate);
  script.toggleControl(group, rate);
};

HCI.playlistModeFolder = function (channel, control, value, status, group) {
  debug('playlistModeFolder: ', channel, control, value, status, group);
  if (value === 127) { // Button pressed
    if (HCI.PlaylistMode === 'Folder') {
      engine.setValue(group, 'ToggleSelectedSidebarItem', true);
    } else {
      HCI.PlaylistMode = 'Folder';
    }
    midi.sendShortMsg(0x90, 0x39, 0x7F); // LED Folder
    midi.sendShortMsg(0x80, 0x38, 0x00); // LED File
  }
};

HCI.playlistModeFile = function (channel, control, value, status, group) {
  debug('playlistModeFile: ' , channel, control, value, status, group);
  if (value === 0x7F) { // Button pressed
    if (HCI.PlaylistMode === 'File') {
      engine.setValue(group, 'LoadSelectedIntoFirstStopped', true);
    } else {
      HCI.PlaylistMode = 'File';
    }
    midi.sendShortMsg(0x80, 0x39, 0x00); // LED Folder
    midi.sendShortMsg(0x90, 0x38, 0x7F); // LED File
  }
};

HCI.PlaylistPrev = function (channel, control, value, status, group) {
  print('HCI.PlaylistPrev ' + channel + ',' + control + ',' + value + ',' + status + ',' + group + '#');
  if (value === 0x7F) { // Button pressed
    if (HCI.PlaylistMode === 'File') {
      if (!HCI.timerPlaylist) {
        HCI.timerPlaylist = engine.beginTimer(100, 'HCI.PlaylistPrev(' + channel + ',' + control + ',' + value + ',' + status + ',"' + group + '")', false);
      }
      engine.setValue(group, 'SelectPrevTrack', true);
    } else {
      if (HCI.PlaylistMode === 'Folder') {
        engine.setValue(group, 'SelectPrevPlaylist', true);
      } else {
        print('Unknown PlaylistMode: ' + HCI.PlaylistMode);
      }
    }
  } else { // Buttonrelese
    if (HCI.timerPlaylist) {
      engine.stopTimer(HCI.timerPlaylist);
      HCI.timerPlaylist = false;
    }
  }
};

HCI.PlaylistNext = function (channel, control, value, status, group) {
  if (value === 0x7F) { // Button pressed
    if (HCI.PlaylistMode === 'File') {
      if (!HCI.timerPlaylist) {
        HCI.timerPlaylist = engine.beginTimer(100, 'HCI.PlaylistNext(' + channel + ',' + control + ',' + value + ',' + status + ',"' + group + '")', false);
      }
      engine.setValue(group, 'SelectNextTrack', true);
    } else {
      if (HCI.PlaylistMode === 'Folder') {
        engine.setValue(group, 'SelectNextPlaylist', true);
      } else {
        print('Unknown PlaylistMode: ' + HCI.PlaylistMode);
      }
    }
  } else { // Button relese
    if (HCI.timerPlaylist) {
      engine.stopTimer(HCI.timerPlaylist);
      HCI.timerPlaylist = false;
    }
  }
};

HCI.hotCue = function (midino, control, value, status, group) {
  print('HCI.hotCue ' + midino + ',' + control + ',' + value + ',' + status + ',' + group + '#');
  var number = 1;
  if (control === 0xe || control === 0x28) {
    number = 2;
  } else if (control === 0xf || control === 0x29) {
    number = 3;
  } else if (control === 0x10 || control === 0x2a) {
    number = 4;
  }

  var action = 'hotcue_' + number + '_';
  if (HCI.vinylButton === false) {
    action += 'activate';
  } else {
    action += 'clear';
  }
  engine.setValue(group, action, value === 0x7F ? 1 : 0);
};
