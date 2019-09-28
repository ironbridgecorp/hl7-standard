'use strict';
const HL7 = require('./../src/api');
const fs = require('fs');
const tap = require('tap');
var lastIndex = null;

tap.test('Initialize HL7 Constructor and Test SegmentGenerator', function (t) {
	fs.readFile(__dirname + '/data/message.hl7', 'utf8', (err, hl7Data) => {
		if (err) throw err;
		let msg = new HL7(hl7Data);
		msg.transform(err => {
			for (let [i, rol] of msg.getSegments('ROL').entries()) {
				rol.set('ROL.1.1', 'value');
				rol.set('ROL.1.2', 'info');
				rol.set('ROL.2.1', 'data', 0, 1);
				rol.set('ROL.2.2', 'test', 1, 1);
				rol.set('ROL.3.1', 'value', 1, 0);
				rol.set('ROL.3.2', 'info', 1, 0);
				rol.set('ROL.33', {
					'ROL.33.1': ['one', 1],
					'ROL.33.2': 'two',
				});
				if (lastIndex !== null) t.ok(lastIndex + 1 === i, 'The last index should be 1 less than current index');
				lastIndex = i;
				t.match(rol.get('ROL.1.1'), 'value', 'ROL.1.1 should be: "value"');
				t.match(rol.get('ROL.1.2'), 'info', 'ROL.1.2 should be: "info"');
				t.match(rol.get('ROL.2.1', 0, 1), 'data', 'ROL.2.1 repeat field should be: "data"');
				t.match(rol.get('ROL.2.2', 1, 1), 'test', 'ROL.2.2 repeat component repeat field should be: "test"');
				t.match(rol.get('ROL.3.1', 1, 0), 'value', 'ROL.3.1 repeat component should be: "value"');
				t.match(rol.get('ROL.3.2', 1, 0), 'info', 'ROL.3.2 repeat component should be: "info"');
				t.match(rol.get('ROL.33.2'), 'two', 'ROL.33.2 should be: "two"');
				t.type(rol.get('ROL.33.1', null, 1), 'number', 'Type of ROL.33.1 repeating field should be: "number"')
			}
			t.end();
		});
	});
});
