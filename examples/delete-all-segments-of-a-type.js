'use strict';

const HL7 = require('./../index');
const fs = require('fs');

const input = `${__dirname}/data/input.hl7`;
const output = `${__dirname}/data/output.hl7`;

const raw = fs.readFileSync(input, 'utf8');

let hl7 = new HL7(raw);

hl7.transform(err => {
  if (err) throw err;
  hl7.deleteSegments(hl7.getSegments('NTE'));
  fs.writeFileSync(output, hl7.build(), 'utf8');
});
