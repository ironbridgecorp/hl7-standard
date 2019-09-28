'use strict';

const HL7 = require('./../index');
const fs = require('fs');

const input = `${__dirname}/data/input.hl7`;
const output = `${__dirname}/data/output.hl7`;

const raw = fs.readFileSync(input, 'utf8');

let hl7 = new HL7(raw);

hl7.transform(err => {
  if (err) throw err;
  for (let obr of hl7.getSegments('OBR')) {
    if (obr.get('OBR.4.1') === '681X') {
      let nteGroup = hl7.getSegmentsAfter(obr, 'NTE', true, 'OBR');
      hl7.deleteSegments(nteGroup);
    }
  }
  fs.writeFileSync(output, hl7.build(), 'utf8');
});
