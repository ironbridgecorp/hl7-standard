![Alt text](https://hl7-standard-images.s3.amazonaws.com/hl7-standard.svg)

*A simple, lightweight HL7 module for tranforming, manipulating, or creating HL7 messages*

## Description & Features

HL7-Standard is a javascript based library that aims to make handling HL7 data simpler.  This lightweight library is able to be used as a stand-alone js scripting module or dropped into an application like mirth to aid in difficult transformations.

- [Mirth Compatibility]()

## API Methods

HL7-Standard enables users to quickly manipulate HL7 data using JSON. It consists of the following methods:

- [transform]()
- [build]()
- [get]()
- [getSegment]()
- [getSegments]()
- [getSegmentsAfter]()
- [set]()
- [createSegment]()
- [createSegmentAfter]()
- [createSegmentBefore]()
- [deleteSegment]()
- [deleteSegments]()
- [moveSegmentAfter]()
- [moveSegmentBefore]()

### transform

### build

### get

```js

let familyName = hl7.get('PID.5.1'); //Reynolds

let patientLanguage = hl7.get('PID.15'); // { 'PID.15.1':'en', 'PID.15.2':'English' }

```

### getSegment
### getSegments
### getSegmentsAfter
### set

```js

hl7.set('PID.5.1', 'Reynolds');

hl7.set('PID.15', { 'PID.15.1':'en', 'PID.15.2':'English' });

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

```

### createSegment
### createSegmentAfter
### createSegmentBefore
### deleteSegment
### deleteSegments
### moveSegmentAfter
### moveSegmentBefore

## Usage Syntax & Examples
