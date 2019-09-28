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
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
      t.match(typeof msg.transformed['EVN'] !== 'undefined', true, 'EVN Segment exists');
      const indexOfEVN = msg.transformed['EVN'].index;
      msg.deleteSegments(msg.getSegments('EVN'));
      t.match(msg.transformed['EVN'].length > 0, false, 'EVN has been deleted.');
      const indexOfPID = msg.transformed['PID'].index;
      t.match(indexOfPID, indexOfEVN, 'EVN index should now be the index of the PID Segment since all segments slide up 1 position after delete.');
    });
    t.end();
  });
});
