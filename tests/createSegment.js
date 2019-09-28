'use strict';
const tap = require('tap');
var HL7 = require('./../src/api');

tap.test('Initialize HL7 Constructor and Create Segment', function (t) {
  let msg = new HL7();
  var msh = msg.createSegment('MSH');
  var pid = msg.createSegment('PID');
  t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
  t.match(msh.constructor.name, 'Segment', 'Constructor is \'Segment\'');
  t.match(msh, msg.transformed['MSH'][0], 'Segment matches the transformed data for this new Segment');
  t.match(msh.index, 1, 'MSH Segment should be the first index');
  t.match(pid.index, 2, 'PID Segment should be the second index');
  t.end();
});

tap.test('Initialize HL7 Constructor and Create Segment incorrectly', function (t) {
  let msg = new HL7();
  t.throws(function () {
    return msg.createSegment();
  }, new Error('Cannot create segment because \'segment\' parameter: is invalid.'),
  'Throw error because you cant create blank segment.');
  t.end();
});
