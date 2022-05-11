'use strict';
const tap = require('tap');
const fs = require('fs');
const path = require('path');
var HL7 = require('./../src/api');

tap.test('Read in data and initialize HL7 Constructor', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data);
    msg.transform(err => {
      if (err) throw err;
      let hl7 = msg.build();
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
      t.type(hl7, 'string', 'HL7 message should be a string');
    });
    t.end();
  });
});

tap.test('Build Message with Custom Line Endings', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data, { lineEndings: '\n' });
    msg.transform(err => {
      if (err) throw err;
      let hl7 = msg.build();
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
      t.type(hl7, 'string', 'HL7 message should be a string');
    });
    t.end();
  });
});
