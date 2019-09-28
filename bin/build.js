'use strict';
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const input = path.resolve(__dirname, '..', 'builds', '._.mirth.js');
const output = path.resolve(__dirname, '..', 'builds', 'mirth.min.js');

let raw = fs.readFileSync(input, 'utf8');
const regexp = new RegExp('module.exports=', 'g');
raw = raw.replace(regexp, 'var HL7=');
fs.writeFileSync(output, raw, 'utf8');

rimraf.sync(input);
