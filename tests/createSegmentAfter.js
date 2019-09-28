'use strict';
const tap = require('tap');
const fs = require('fs');
const path = require('path');
var HL7 = require('./../src/api');

tap.test('Initialize HL7 Constructor and Create Segment After', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data);
    msg.transform(err => {
      if (err) throw err;
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
      const indexOfEVN = msg.getSegment('EVN').index;
      let zib = msg.createSegmentAfter('ZIB', msg.getSegment('EVN'));
      t.match(zib.index, indexOfEVN + 1, 'ZIB is after EVN segment.');
    });
    t.end();
  });
});

tap.test('Initialize HL7 Constructor and Create Segment incorrectly', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    let msg = new HL7(data);
    msg.transform(err => {
      if (err) throw err;
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
      t.throws(function () {
        return msg.createSegmentAfter('ZIB', 'EVN');
      }, new Error('Cannot create segment after because \'afterSegment\' parameter: is invalid.'), 'Throw error because you cant create after without afterSegment parameter.');
    });
    t.end();
  });
});
