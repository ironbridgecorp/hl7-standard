'use strict';
const tap = require('tap');
const fs = require('fs');
const path = require('path');
var HL7 = require('./../src/api');

tap.test('Initialize HL7 Constructor without initial data', function (t) {
  let msg = new HL7();
  t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
  t.end();
});

tap.test('Read in data and initialize HL7 Constructor', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data);
    msg.transform((err, hl7) => {
      if (err) throw err;
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
    });
    t.end();
  });
});

tap.test('Initialize HL7 Constructor and transform without callback', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data);
    msg.transform();
    let pid = msg.getSegment('PID');
    t.match(pid.constructor.name, 'Segment', 'getSegment should return single PID segment constructor');
    t.end();
  });
});

tap.test('Read in data and transform HL7 with \\r eol characters', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message2.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data);
    msg.transform((err, hl7) => {
      if (err) throw err;
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
      t.match(msg.get('MSA.1.1'), 'AR', 'Expected MSA.1.1 to contain "AR"');
      t.match(msg.get('ERR.1.6'), 'HL70357', 'Expected ERR.1.6 to contain "HL70357"');
    });
    t.end();
  });
});

tap.test('Read in data and transform HL7 with \\n eol characters', function (t) {
  fs.readFile(path.join(__dirname, 'data', 'message3.hl7'), 'utf8', (err, data) => {
    if (err) throw err;
    let msg = new HL7(data);
    msg.transform((err, hl7) => {
      if (err) throw err;
      t.match(msg.constructor.name, 'HL7', 'Constructor is \'HL7\'');
      t.match(msg.get('PID.3.1'), '123456', 'Expected PID.3.1 to contain "123456"');
      t.match(msg.transformed['ORC'][0].constructor.name, 'Segment', 'Expected ORC segment to be parsed');
      t.match(msg.transformed['RXA'][0].constructor.name, 'Segment', 'Expected RXA segment to be parsed');
      t.match(msg.transformed['OBX'][0].constructor.name, 'Segment', 'Expected OBX segments to be parsed');
    });
    t.end();
  });
});

tap.test('Read in data and transform HL7 with \\r\\n eol characters', function (t) {
  let data = 'MSH|^~\&|5.0^IBI^L|^^|DBO^IBI^L|QS4444^^|20171025213259||ACK^V01^ACK|5465156441.100178620|P|2.3.1|\r\n';
  data += 'MSA|AR|QS444437861000000042|Not logged in: User login failed|||207^^HL70357|\r\n';
  data += 'ERR|^^^207^^HL70357|\r\n';
  let msg = new HL7(data);
  msg.transform(err => {
    if (err) throw err;
    t.match(msg.transformed['MSH'][0].constructor.name, 'Segment', 'Expected MSH segment to be parsed');
    t.match(msg.transformed['MSA'][0].constructor.name, 'Segment', 'Expected MSA segment to be parsed');
    t.match(msg.transformed['ERR'][0].constructor.name, 'Segment', 'Expected ERR segments to be parsed');
  });
  t.end();
});

tap.test('Initialize HL7 Constructor with random string that is not HL7', function (t) {
  let msg = new HL7('bad data');
  msg.transform(err => {
    t.throws(function () {
      if (err) throw err;
    }, new Error(
      'Expected raw data to be HL7'
    ), 'Throw error because of bad data');
  });
  t.end();
});

tap.test('Initialize HL7 Constructor with HL7 that has no eol characters', function (t) {
  let msg = new HL7('MSH|^~\&|5.0^IBI^L|^^|DBO^IBI^L|QS4444^^|');
  msg.transform(err => {
    t.throws(function () {
      if (err) throw err;
    }, new Error(
      "HL7 data must contain valid line endings ['\\r\\n', '\\n', or '\\r'] to be parsed."
    ), 'Throw error because of bad data');
  });
  t.end();
});

tap.test('Initialize HL7 Constructor with HL7 that has multiple eol characters', function (t) {
  let msg = new HL7('MSH|^~\&|5.0^IBI^L|^^|DBO^IBI^L|QS4444^^|\rPID||||||\nPV1||||||||\r\nZEF|||||||');
  msg.transform(err => {
    t.throws(function () {
      if (err) throw err;
    }, new Error(
      'HL7 Data contains invalid EOL characters'
    ), 'Throw error because of bad data');
  });
  t.end();
});
