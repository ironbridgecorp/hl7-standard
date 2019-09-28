'use strict';
const tap = require('tap');
const fs = require('fs');
const path = require('path');
var HL7 = require('./../src/api');

tap.test('Initialize HL7 Constructor and Move Segment After', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data);
    msg.transform(err => {
      if (err) throw err;
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
      const indexOfEVN = msg.getSegment('EVN').index;
      let zib = msg.createSegment('ZIB');
      msg.moveSegmentAfter(zib, msg.getSegment('EVN'));
      t.match(zib.index, indexOfEVN + 1, 'ZIB is after EVN segment.');
    });
    t.end();
  });
});

tap.test('Initialize HL7 Constructor and Move Segment incorrectly', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    let msg = new HL7(data);
    msg.transform(err => {
      if (err) throw err;
      let zib = msg.createSegment('ZIB');
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
      t.throws(function () {
        return msg.moveSegmentAfter(zib, 'EVN');
      }, new Error('Cannot create segment before because \'afterSegment\' parameter: is invalid.'), 'Throw error because you cant move segment after without afterSegment parameter.');
    });
    t.end();
  });
});
