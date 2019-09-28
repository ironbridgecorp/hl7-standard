'use strict';

const HL7 = require('./../index');
const fs = require('fs');

const input = `${__dirname}/data/input.hl7`;
const output = `${__dirname}/data/output.hl7`;

const raw = fs.readFileSync(input, 'utf8');

let hl7 = new HL7(raw);

try {
  hl7.transform();
  hl7.createSegment('ZIB');
  hl7.set('ZIB', {
    'ZIB.1.1': '1',
    'ZIB.2.1': '',
    'ZIB.3.1': '',
    'ZIB.4': {
      'ZIB.4.1': 'base64',
      'ZIB.4.2': 'dGhpcyBpcyBpbiBwbGFjZSBvZiBhIHBkZiB3aGljaCBjYW4gYmUgZW1iZWRkZWQgaW4gaGw3'
    }
  });
  fs.writeFileSync(output, hl7.build(), 'utf8');
} catch (e) {
  console.error(e);
}
