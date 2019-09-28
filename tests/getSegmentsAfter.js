'use strict';
const tap = require('tap');
const fs = require('fs');
const path = require('path');
var HL7 = require('./../src/api');

tap.test('Initialize HL7 Constructor and Get Segments After Specific Segment', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data);
    msg.transform((err) => {
      if (err) throw err;
      var group = msg.getSegmentsAfter(msg.transformed['MSH'][0], 'CON', false);
      t.match(group.length, 5, 'There should be 5 total CON segments in the test message');
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
    });
    t.end();
  });
});

tap.test('Initialize HL7 Constructor and Get Consecutive Segments After Specific Segment', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data);
    msg.transform((err, hl7) => {
      if (err) throw err;
      var group = msg.getSegmentsAfter(msg.transformed['MSH'][0], 'CON', true);
      t.match(group.length, 3, 'There should be 3 total CON segments that are consecutive in the test message');
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
    });
    t.end();
  });
});

tap.test('Initialize HL7 Constructor and Get Segments After Specific Segment but stop once we reach a defined segment', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data);
    msg.transform((err, hl7) => {
      if (err) throw err;
      var group = msg.getSegmentsAfter(msg.transformed['MSH'][0], 'CON', false, 'NK1');
      t.match(group.length, 3, 'There should be 3 total CON segments that are before the NK1 segments in the test message');
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
    });
    t.end();
  });
});

tap.test('Initialize HL7 Constructor and Test Multiple Stop Segments', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data);
    msg.transform((err, hl7) => {
      if (err) throw err;
      var group = msg.getSegmentsAfter(msg.transformed['MSH'][0], 'CON', false, ['GT1', 'PV2', 'AL1']);
      t.match(group.length, 3, 'There should be 3 total CON segments that are before the NK1 segments in the test message');
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
    });
    t.end();
  });
});


tap.test('Initialize HL7 Constructor and Get Segments After non-existing segment', function (t) {
  let msg = new HL7();
  t.throws(function () {
    return msg.getSegmentsAfter('MSH', 'CON', true, 'NK1');
  }, new Error('Cannot retrieve start position from segment.'),
  'Throw error because we do not have an MSH start segment');
  t.end();
});
