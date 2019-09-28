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
      const msh = msg.getSegment('MSH');
      t.match(Array.isArray(msh), false, 'Result of getSegment should not be an array');
      t.match(msh.constructor.name, 'Segment', 'Result of getSegment should be a single Segment constructor');
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
        return msg.getSegment('MSHH');
      }, new Error('Cannot get segment after because \'segment\' parameter: is invalid.'), 'Throw error because you cant get segment without passing a valid segment name');
    });
    t.end();
  });
});
