'use strict';

const HL7 = require('./../index');
const fs = require('fs');

const output = `${__dirname}/data/output.hl7`;

let hl7 = new HL7();
const timestamp = new Date();

hl7.createSegment('MSH');
hl7.set('MSH', {
  'MSH.2': '^~\\&',
  'MSH.3': 'Example',
  'MSH.4': '123456',
  'MSH.5': '',
  'MSH.6': '',
  'MSH.7': timestamp,
  'MSH.8': '',
  'MSH.9': {
    'MSH.9.1': 'ADT',
    'MSH.9.2': 'A08'
  },
  'MSH.10': '',
  'MSH.11': 'T',
  'MSH.12': '2.3'
});
hl7.createSegment('EVN');
hl7.set('EVN.1', 'A08');
hl7.createSegment('PID');
hl7.set('PID.3.1', '312312');
hl7.set('PID.5', {
  'PID.5.1': 'Smith',
  'PID.5.2': 'John'
});
hl7.set('PID.7.1', '19670822');
hl7.set('PID.8.1', 'M');
hl7.set('PID.11', [{
  'PID.11.1': '123 Example Rd',
  'PID.11.2': '',
  'PID.11.3': 'Pittsburgh',
  'PID.11.4': 'PA',
  'PID.11.4': '15226',
  'PID.11.5': 'USA'
}, {
  'PID.11.1': '321 Sample St',
  'PID.11.2': '',
  'PID.11.3': 'Pittsburgh',
  'PID.11.4': 'PA',
  'PID.11.4': '15317',
  'PID.11.5': 'USA'
}]);
hl7.set('PID.13.1', '(555)555-5555');
hl7.createSegment('PV1');
hl7.set('PV1', {
  'PV1.1': '',
  'PV1.2': 'I',
  'PV1.3': {
    'PV1.3.1': 'Main',
    'PV1.3.2': '802',
    'PV1.3.3': '1'
  },
  'PV1.4': '',
  'PV1.5': '',
  'PV1.6': '',
  'PV1.7': {
    'PV1.7.1': '987654321',
    'PV1.7.2': 'Quaker',
    'PV1.7.3': 'John'
  }
});
hl7.set('PV1.44', timestamp);
hl7.createSegment('IN1');
hl7.set('IN1', {
  'IN1.1': '1',
  'IN1.2': 'EPO',
  'IN1.3': ['80', '81'],
  'IN1.4': 'ACME',
  'IN1.5': {
    'IN1.5.1': 'PO BOX 432110',
    'IN1.5.2': '',
    'IN1.5.3': 'EL PASO',
    'IN1.5.4': 'TX',
    'IN1.5.5': '79998'
  },
  'IN1.6': '',
  'IN1.7': '',
  'IN1.8': '1500004000001',
  'IN1.9': 'ACME INC',
  'IN1.10': '19',
  'IN1.11': 'ACME'
});

fs.writeFileSync(output, hl7.build(), 'utf8');
