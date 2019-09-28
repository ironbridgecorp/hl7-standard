'use strict';
const tap = require('tap');
const fs = require('fs');
const path = require('path');
var HL7 = require('./../src/api');

tap.test('Initialize HL7 Constructor and Move Segment Before', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data);
    msg.transform(err => {
      if (err) throw err;
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
      const indexOfEVN = msg.getSegment('EVN').index;
      let zib = msg.createSegment('ZIB');
      msg.moveSegmentBefore(zib, msg.getSegment('EVN'));
      t.match(zib.index, indexOfEVN, 'ZIB is before EVN segment.');
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
        return msg.moveSegmentAfter('ZIB', msg.getSegment('EVN'));
      }, new Error('Cannot create segment before because \'segment\' parameter: is invalid.'), 'Throw error because you cant move segment without valid segment parameter.');
    });
    t.end();
  });
});
