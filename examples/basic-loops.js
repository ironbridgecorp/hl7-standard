'use strict';

const HL7 = require('./../index');
const fs = require('fs');

const input = `${__dirname}/data/input.hl7`;

const raw = fs.readFileSync(input, 'utf8');

let hl7 = new HL7(raw);

hl7.transform(err => {
  if (err) throw err;

  for (let segment of hl7.getSegments()) {
    // loops through all segments in the message
  }

  for (let obr of hl7.getSegments('OBR')) {
    // loops through only the OBR segments in the message
  }

  for (let [i, segment] of hl7.getSegments().entries()) {
    // for of loop with index of iteration
  }

  let segments = hl7.getSegments();
  for (var i = 0; i < segments.length; i++) {
    // using a standard for loop
  }
});
