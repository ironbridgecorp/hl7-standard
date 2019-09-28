'use strict';
const tap = require('tap');
const fs = require('fs');
const path = require('path');
var HL7 = require('./../src/api');

tap.test('Initialize HL7 Constructor and Get Single Segment', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data);
    msg.transform(err => {
      if (err) throw err;
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
      const con = msg.getSegments('CON');
      t.match(Array.isArray(con), true, 'Result of getSegments should be an array');
      t.match(con.length, 5, 'Should be a total of 5 CON segments returned');
      let segmentType = [...new Set(con.map(c => c.type))];
      t.match(segmentType.length == 1 && segmentType[0] == 'CON', true, 'Should only contain CON segments');
    });
    t.end();
  });
});
