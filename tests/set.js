'use strict';
const HL7 = require('./../src/api');
const fs = require('fs');
const tap = require('tap');

tap.test('Initialize HL7 Constructor and Test Set Method', function (t) {
  fs.readFile(__dirname + '/data/message.hl7', 'utf8', (err, hl7Data) => {
    if (err) throw err;
    let msg = new HL7(hl7Data);
    msg.transform(err => {
      msg.set('PID.1.1', 'data');
      msg.set('PID.1.2', 'value');
      msg.set('PID.2.1', 'item', 0, 0, 1);
      msg.set('PID.2.2', 'info', 0, 0, 1);
      msg.set('PID.2.1', 'data', 0, 1, 1);
      msg.set('PD1.1.1', 'value', 0, 2, 2);
      msg.set('ROL.1.1', 'item', 1);
      msg.set('ROL.1.1', 'info', 2);
      msg.set('ROL.1.1', 'test', 2, 1);
      msg.set('ROL.1.1', 'data', 2, 1, 1);
      msg.set('ROL.1.2', 'value', 2);
      msg.set('ROL.2.2', 'info', 2, 1, 1);
      t.match(msg.transformed.PID[0].data['PID.1']['PID.1.1'], 'data', 'PID.1.1 should be: "data"');
      t.match(msg.transformed.PID[0].data['PID.1']['PID.1.2'], 'value', 'PID.1.2 should be: "value"');
      t.match(msg.transformed.PID[0].data['PID.2'][0]['PID.2.1'][1], 'item', 'PID.2.1 repeating field should be: "item"');
      t.match(msg.transformed.PID[0].data['PID.2'][0]['PID.2.2'][1], 'info', 'PID.2.2 repeating field should be: "info"');
      t.match(msg.transformed.PID[0].data['PID.2'][1]['PID.2.1'][1], 'data', 'PID.2.1 repeating component, repeating field should be: "data"');
      t.match(msg.transformed.PD1[0].data['PD1.1'][2]['PD1.1.1'][2], 'value', 'PID.1.1 second repeating component, second repeating field should be: "value"');
      t.match(msg.transformed.ROL[1].data['ROL.1']['ROL.1.1'], 'item', 'ROL.1.1 (Second ROL) should be: "item"');
      t.match(msg.transformed.ROL[2].data['ROL.1'][0]['ROL.1.1'], 'info', 'ROL.1.1 (Third ROL) should be: "info"');
      t.match(msg.transformed.ROL[2].data['ROL.1'][1]['ROL.1.1'][0], 'test', 'ROL.1.1 (Third ROL) repeating component should be: "test"');
      t.match(msg.transformed.ROL[2].data['ROL.1'][1]['ROL.1.1'][1], 'data', 'ROL.1.1 (Third ROL) repeatubg component, repeating field should be: "data"');
      t.match(msg.transformed.ROL[2].data['ROL.1'][0]['ROL.1.2'], 'value', 'ROL.1.2 (Third ROL) should be: "value"');
      t.match(msg.transformed.ROL[2].data['ROL.2'][1]['ROL.2.2'][1], 'info', 'ROL.2.2 (Third ROL) repeating component, repeating field should be: "info"');
      t.end();
    });
  });
});

tap.test('Initialize HL7 Constructor and Test Set Method', function (t) {
  fs.readFile(__dirname + '/data/message.hl7', 'utf8', (err, hl7Data) => {
    if (err) throw err;
    let msg = new HL7(hl7Data);
    msg.transform(err => {
      msg.set('PID.2', {
        'PID.2.1': 'one',
        'PID.2.2': 'two',
        'PID.2.3': ['3', 'three']
      });
      msg.set('ROL.2', [{
        'ROL.2.1': 'one',
        'ROL.2.2': 'two',
        'ROL.2.3': 'three'
      }, {
        'ROL.2.1': '1',
        'ROL.2.2': '2',
        'ROL.2.3': ['', '', '', '3']
      }]);
      t.match(msg.get('PID.2.1'), 'one', 'PID.2.1 should be: "one"');
      t.match(msg.get('PID.2.2'), 'two', 'PID.2.1 should be: "two"');
      t.match(msg.get('PID.2.3', null, null, 1), 'three', 'PID.2.1 should be: "three"');
      t.match(msg.get('ROL.2.1'), 'one', 'ROL.2.1 should be: "one"');
      t.match(msg.get('ROL.2.2', null, 1), '2', 'ROL.2.1 should be: "2"');
      t.match(msg.get('ROL.2.3', null, 1, 3), '3', 'ROL.2.1 should be: "3"');
      t.end();
    });
  });
});

tap.test('Initialize HL7 Constructor and Perform Faulty Set', function (t) {
  fs.readFile(__dirname + '/data/message.hl7', 'utf8', (err, hl7Data) => {
    if (err) throw err;
    let msg = new HL7(hl7Data);
    msg.transform(err => {
      t.throws(function () {
        msg.set('NTE.2.1', 'note');
      }, new Error('Values cannot be set on segment that does not exist: NTE'), 'Throw error because segment doesn\'t exist');
      t.throws(function () {
        msg.set('PID', ['one', 'two']);
      }, new Error(`Must provide object notation in order to overwrite existing segment`), 'Throw error because object notation is required');
      t.throws(function () {
        if (err) throw err;
        msg.set('PID.10.1', {'PID.10.1': 'cannot do this'});
      }, new Error('DataType must be a string or an array to set field'), 'Throw error because data must be a string or an array');
      t.throws(function () {
        if (err) throw err;
        msg.set('PID.10.1', ['one', 'two'], null, null, 3);
      }, new Error('DataType must be a string to set field'), 'Throw error because data must be a string');
    });
    t.end();
  });
});
