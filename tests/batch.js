'use strict';
const HL7 = require('./../src/api');
const fs = require('fs');
const tap = require('tap');

tap.test('Test Various Properties of Batch Hl7', function (t) {
	fs.readFile(__dirname + '/data/batch.hl7', 'utf8', (err, hl7Data) => {
		if (err) throw err;
		let msg = new HL7(hl7Data);
		msg.transform(err => {
      if (err) throw err;
			t.match(msg.isBatch(), true, 'Should be batch');
			t.match(msg.raw, hl7Data, 'Raw data of msg object should be the whole batch');
			t.match(msg.header[0].raw, 'FHS|^~\\&|1231|||||||||', 'FHS should be in the header array');
			t.match(msg.header[1].raw, 'BHS|^~\\&|1312|||||||||', 'BHS should be in the header array');
			t.match(msg.trailer[0].raw, 'BTS|||||||||||', 'BTS should be in the trailer array');
			t.match(msg.trailer[1].raw, 'FTS|||||||||||', 'FTS should be in the trailer array');
			t.match(msg.header[0].constructor.name, 'HL7', 'Header should be an hl7 object');
			t.match(msg.header[1].constructor.name, 'HL7', 'Header should be an hl7 object');
			t.match(msg.trailer[0].constructor.name, 'HL7', 'Trailer should be an hl7 object');
			t.match(msg.trailer[1].constructor.name, 'HL7', 'Trailer should be an hl7 object');
			t.match(msg.container[0].constructor.name, 'HL7', 'Message 1 inside should be hl7');
			t.match(msg.container[1].constructor.name, 'HL7', 'Message 2 inside should be hl7');
			t.match(msg.container.length, 2, 'There should only be 2 hl7 messages in the batch')
			t.match(msg.getSegmentsAfter, null, 'getSegmentsAfter should no longer be a function');
			t.match(msg.createSegment, null, 'createSegment should no longer be a function');
			t.match(msg.get, null, 'get should no longer be a function');
			t.match(msg.set, null, 'set should no longer be a function');
			msg.iterate((i, mesg) => {
				if (i !== null) {
					t.match(mesg.constructor.name, 'HL7', 'Iterate should traverse container of hl7 messages');
				}
			});
			t.end();
		});
	});
});
