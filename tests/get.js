'use strict';

const HL7 = require('./../src/api');
const fs = require('fs');
const tap = require('tap');

tap.test('Initialize HL7 Constructor and Test Get', function (t) {
	fs.readFile(__dirname + '/data/message.hl7', 'utf8', (err, hl7Data) => {
		if (err) throw err;
		let msg = new HL7(hl7Data);
		msg.transform(err => {
			t.match(msg.get('ROL.4.7', null, 0, 1), 'one', 'ROL.4.1 repeating component and repeating field should be: "one"');
			t.match(msg.get('ROL.4.1', 1), 'two', 'ROL.4.1 repeating component should be: "two"');
			t.match(msg.get('CON.2.2'), null, 'CON.2.2 should be: "null"');
			t.match(msg.get('CON.1')['CON.1.1'], '1', 'CON.1 should be: "{ CON.1.1: \'1\' }"');
			t.match(msg.get('CON.1', 1), '2', 'CON.1 repeating component should be: "2"');
			t.type(msg.get('PID.2'), 'object', 'Type of PID.2 should be: "object"');
			t.end();
		});
	});
});
