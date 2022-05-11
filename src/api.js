'use strict';

// https://kb.medical-objects.com.au/display/PUB/HL7v2+parsing
// ~ = sub component
// && = repeating field

if (!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, 'startsWith', {
    value: function (search, rawPos) {
      pos = rawPos > 0 ? rawPos | 0 : 0;
      return this.substring(pos, pos + search.length) === search;
    }
  });
}

const _addBatchSegment = function (data, type) {
  if (data.constructor.name !== 'HL7') throw new Error('HL7 data added is not HL7 constructor');
  return this[type].push(data);
};

const _addToBatch = function (data) {
  if (data.constructor.name !== 'HL7') throw new Error('HL7 data added is not HL7 constructor');
  return this.container.push(data);
};

const _splitBatch = indexes => (data, batch = []) => {
  indexes.sort((a, b) => a - b);
  for (var i = 0; i < indexes.length; i++) {
    let start = indexes[i], end = indexes[i + 1];
    if (i + 1 === indexes.length) end = data.length;
    batch.push(data.slice(start, end));
  }
  return batch;
};

const _getSegIndexes = (names, data, list = []) => {
  for (let i = 0; i < names.length; i++) {
    let regexp = new RegExp(`(\n|\r\n|^|\r)${names[i]}\\|`, 'g'), m;
    while (m = regexp.exec(data)) {
      var s = m[0];
      if (s.indexOf('\r\n') != -1) {
        m.index = m.index + 2;
      } else if (s.indexOf('\n') != -1) {
        m.index++;
      } else if (s.indexOf('\r') != -1) {
        m.index++;
      }
      if (m.index !== null) list.push(m.index);
    }
  }
  return list;
};

const _isBatch = (data, batch) => {
  return (typeof data === 'string' && (data.startsWith('FHS') || data.startsWith('BHS') || batch)) ? true : false;
};

const _batchIterate = function (predicate) {
  for (let i = 0; i < this.container.length; i++) {
    predicate.call(this, i, this.container[i]);
  }
};

const _invalidSegments = function (segs) {
  return segs.some(seg => (seg.match(/[^A-Z0-9]/g) !== null));
};

const _defineLineEndings = function (data, cb) {
  function _mode (assets) {
    const map = assets.reduce((list, asset) => {
      if (!(asset in list)) list[asset] = 0;
      return list[asset]++, list;
    }, {});
    var keys = Object.keys(map), keyValues = keys.map(v => map[v]);
    let max = Math.max.apply(null, keyValues), modes = [];
    keys.forEach(v => {
      if (map[v] === max) modes.push(v);
    });
    return (modes.length) ? cb(null, modes[0]) : cb(new Error('HL7 data must contain valid line endings [\'\\r\\n\', \'\\n\', or \'\\r\'] to be parsed.'), null);
  }
  const eols = (data.match(/\r\n|\r|\n/g) || []);
  return _mode(eols);
};

const _transformSegment = function (opts) {
  let { segment, name, content, isMSH, parseOptions } = opts;
  const { subComponents, repeatingFields } = parseOptions;
  for (let idx = 1; idx < content.length; idx++) {
    let pos = (isMSH) ? idx + 1 : idx;
    if (content[idx].indexOf(subComponents) > -1) {
      let subcomp = content[idx].split(subComponents);
      segment.data[`${name}.${pos}`] = [];
      for (let j = 0; j < subcomp.length; j++) {
        let component = {};
        let subs = subcomp[j].split('^');
        for (let k = 0; k < subs.length; k++) {
          if (subs[k].indexOf(repeatingFields) > -1) {
            let repeating = subs[k].split(repeatingFields);
            component[`${name}.${pos}.${k + 1}`] = [];
            for (let l = 0; l < repeating.length; l++) {
              component[`${name}.${pos}.${k + 1}`].push(repeating[l]);
            }
          } else {
            component[`${name}.${pos}.${k + 1}`] = subs[k];
          }
        }
        segment.data[`${name}.${pos}`].push(component);
      }
    } else if (content[idx].indexOf('^') > -1) {
      let subs = content[idx].split('^');
      segment.data[`${name}.${pos}`] = {};
      for (let j = 0; j < subs.length; j++) {
        if (subs[j].indexOf(repeatingFields) > -1) {
          let repeating = subs[j].split(repeatingFields);
          segment.data[`${name}.${pos}`][`${name}.${pos}.${j + 1}`] = [];
          for (let l = 0; l < repeating.length; l++) {
            segment.data[`${name}.${pos}`][`${name}.${pos}.${j + 1}`].push(repeating[l]);
          }
        } else {
          segment.data[`${name}.${pos}`][`${name}.${pos}.${j + 1}`] = subs[j];
        }
      }
    } else if (content[idx].indexOf(repeatingFields) > -1) {
      let repeating = content[idx].split(repeatingFields);
      segment.data[`${name}.${pos}`] = [];
      for (let l = 0; l < repeating.length; l++) {
        segment.data[`${name}.${pos}`].push(repeating[l]);
      }
    } else {
      segment.data[`${name}.${pos}`] = content[idx];
    }
  }
  return segment;
};

const _buildSegment = function (line, fields, segment, opts) {
  const { subComponents, repeatingFields } = opts;
  for (let j = 0; j < fields.length; j++) {
    let component = segment.data[fields[j]];
    if (Array.isArray(component)) {
      for (let m = 0; m < component.length; m++) {
        if (typeof component[m] === 'object') {
          let subcomponents = Object.keys(component[m]);
          if (!subcomponents.length) line += subComponents;
          for (let n = 0; n < subcomponents.length; n++) {
            let subcompvalue = component[m][subcomponents[n]];
            if (Array.isArray(subcompvalue)) {
              for (let o = 0; o < subcompvalue.length; o++) {
                if (o + 1 === subcompvalue.length && n + 1 === subcomponents.length && m + 1 === component.length) {
                  line += `${subcompvalue[o]}|`;
                } else if (o + 1 === subcompvalue.length && n + 1 === subcomponents.length) {
                  line += `${subcompvalue[o]}${subComponents}`;
                } else if (o + 1 === subcompvalue.length) {
                  line += `${subcompvalue[o]}^`;
                } else {
                  line += `${subcompvalue[o]}${repeatingFields}`;
                }
              }
            } else {
              if (n + 1 === subcomponents.length && m + 1 === component.length) {
                line += `${subcompvalue}|`;
              } else if (n + 1 === subcomponents.length) {
                line += `${subcompvalue}${subComponents}`;
              } else {
                line += `${subcompvalue}^`;
              }
            }
          }
        } else {
          if (m + 1 === component.length) {
            line += `${component[m]}|`;
          } else {
            line += `${component[m]}${subComponents}`;
          }
        }
      }
    } else if (typeof component === 'object') {
      let subcomponents = Object.keys(component);
      for (let n = 0; n < subcomponents.length; n++) {
        let subcompvalue = component[subcomponents[n]];
        if (Array.isArray(subcompvalue)) {
          for (let o = 0; o < subcompvalue.length; o++) {
            if (o + 1 === subcompvalue.length && n + 1 === subcomponents.length) {
              line += `${subcompvalue[o]}|`;
            } else if (o + 1 === subcompvalue.length) {
              line += `${subcompvalue[o]}^`;
            } else {
              line += `${subcompvalue[o]}${repeatingFields}`;
            }
          }
        } else {
          if (n + 1 === subcomponents.length) {
            line += `${subcompvalue}|`;
          } else {
            line += `${subcompvalue}^`;
          }
        }
      }
    } else {
      line += `${component}|`;
    }
  }
  return line;
};

const _build = function (data, parseOpts) {
  const segments = Object.keys(data);
  var lines = [];
  for (let i = 0; i < segments.length; i++) {
    let segment = data[segments[i]];
    if (Array.isArray(segment)) {
      for (let r = 0; r < segment.length; r++) {
        if (!segment[r]) continue;
        let line = segments[i] + '|';
        let fields = Object.keys(segment[r].data);
        let index = segment[r].index;
        lines.push({ index, line: _buildSegment(line, fields, segment[r], parseOpts) });
      }
    } else {
      let line = segments[i] + '|';
      let fields = Object.keys(segment.data);
      let index = segment.index;
      lines.push({ index, line: _buildSegment(line, fields, segment, parseOpts) });
    }
  }
  return lines;
};

const _defineField = function (field) {
  if (typeof field !== 'string') throw new Error(`Cannot set/get HL7 field: ${field}. The parameter 'field' must be a string.`);
  const notation = field.split('.');
  const segment = (typeof notation[0] !== 'undefined' && notation[0].length === 3) ? notation[0] : null;
  const section = (typeof notation[1] !== 'undefined') ? `${notation[0]}.${notation[1]}` : null;
  const sub = (typeof notation[2] !== 'undefined') ? `${notation[0]}.${notation[1]}.${notation[2]}` : null;
  return {notation, segment, section, sub};
};

const _segmentExists = function (segment, index) {
  let segmentExists = (typeof this.transformed[segment] !== 'undefined') ? true : false, isArray = false;
  if (segmentExists) isArray = (Array.isArray(this.transformed[segment])) ? true : false;
  if (isArray) segmentExists = (typeof this.transformed[segment][(index) ? index : 0] !== 'undefined') ? true : false;
  return { segmentExists, isArray };
};

const _sectionExists = function (reference, section, sectionIndex) {
  let isArray = false, isAtIndex = false;
  let sectionExists = (typeof reference.data[section] !== 'undefined') ? true : false;
  if (sectionExists) {
    isArray = (Array.isArray(reference.data[section])) ? true : false;
    if (typeof sectionIndex === 'number' && isArray) isAtIndex = (typeof reference.data[section][(sectionIndex) ? sectionIndex : 0] !== 'undefined') ? true : false;
  }
  return { sectionExists, isAtIndex, isArray };
};

const _subSectionExists = function (reference, sub, subIndex) {
  let isArray = false, isAtIndex = false;
  let subSectionExists = (typeof reference[sub] !== 'undefined') ? true : false;
  if (subSectionExists) {
    isArray = (Array.isArray(reference[sub])) ? true : false;
    if (typeof subIndex === 'number' && isArray) isAtIndex = (typeof reference[sub][(subIndex) ? subIndex : 0] !== 'undefined') ? true : false;
  }
  return { subSectionExists, isAtIndex, isArray };
};

const _createSection = function (reference, position) {
  for (let i = (reference.type !== 'MSH') ? 1 : 2; i <= position; i++) {
    if (typeof reference.data[`${reference.type}.${i}`] === 'undefined') reference.data[`${reference.type}.${i}`] = '';
  }
  return reference;
};

const _createSectionAtIndex = function (reference, isArray, section = 0) {
  reference = (isArray) ? reference : [(typeof reference !== 'undefined') ? reference : {}];
  for (let i = 0; i <= section; i++) {
    if (typeof reference[i] === 'undefined') reference[i] = {};
  }
  return reference;
};

const _createSubSection = function (reference, section, position) {
  reference = (typeof reference !== 'object') ? {} : reference;
  for (let i = 1; i <= position; i++) {
    if (typeof reference[`${section}.${i}`] === 'undefined') reference[`${section}.${i}`] = '';
  }
  return reference;
};

const _createSubSectionAtIndex = function (reference, isArray, sub = 0) {
  reference = (isArray) ? reference : [(typeof reference !== 'undefined') ? reference : ''];
  for (let i = 0; i <= sub; i++) {
    if (typeof reference[i] === 'undefined') reference[i] = '';
  }
  return reference;
};

const _validSegment = function (segment) {
  return (typeof segment === 'string' && segment.length === 3) ? true : false;
};

const _moveSegment = function (from, forward) {
  const segments = Object.keys(this.transformed);
  for (let i = 0; i < segments.length; i++) {
    for (let j = 0; j < this.transformed[segments[i]].length; j++) {
      if (this.transformed[segments[i]][j] && this.transformed[segments[i]][j].index >= from) {
        if (forward) {
          this.transformed[segments[i]][j].index++;
        } else {
          this.transformed[segments[i]][j].index--;
        }
      }
    }
  }
  return this;
};

const _cleanse = function (categories) {
  for (let i = 0; i < categories.length; i++) {
    let j = this.transformed[categories[i]].length;
    while (j >= 0) {
      if (!this.transformed[categories[i]][j]) this.transformed[categories[i]].splice(j, 1);
      j--;
    }
  }
};

const _SegmentGenerator = function (type) {
  return new (function Segment (scope, type) {
    this.type = type;
    this.data = {};
    this.set = function (ref, field, value, sectionIndex, subIndex) {
      let idx = (Array.isArray(ref.transformed[this.type])) ? ref.transformed[this.type].indexOf(this) : 0;
      return ref.set.call(ref, field, value, idx, sectionIndex, subIndex);
    }.bind(this, scope);
    this.get = function (ref, field, sectionIndex, subIndex) {
      let idx = (Array.isArray(ref.transformed[this.type])) ? ref.transformed[this.type].indexOf(this) : 0;
      return ref.get.call(ref, field, idx, sectionIndex, subIndex);
    }.bind(this, scope);
  }.bind(this))(this, type);
};

module.exports = class HL7 {
  constructor (data = '', opts = {}) {
    this.raw = (typeof data === 'string') ? data : '';
    this.transformed = {};
    this.encoded = '';
    this.parseOptions = {
      subComponents: (opts.subComponents) ? opts.subComponents : '~',
      repeatingFields: (opts.repeatingFields) ? opts.repeatingFields : '&',
      lineEndings: (opts.lineEndings) ? opts.lineEndings : '\r\n'
    };
    this.forceBatch = false;
    this.isBatch = () => this.forceBatch;
    this.lastIndex = 0;
  }

  /**
   * Transforms raw HL7 data to 'hl7-standard' constructor format for message manipulation
   *
   * @param {Function} callback function used to control transformation errors, optional
   * @param {Boolean} batch boolean specifying if message should be treated as a batch message, optional
   * @api public
   */

  transform (cb, batch = false) {
    if (!this.raw.startsWith('MSH') && !this.raw.startsWith('FHS') && !this.raw.startsWith('BHS') && !this.raw.startsWith('BTS') && !this.raw.startsWith('FTS')) {
      let error = new Error('Expected raw data to be HL7');
      if (cb) return cb(error, null);
      throw error;
    }
    if (!batch && _isBatch(this.raw, this.forceBatch)) {
      delete this.transformed;
      this.header = [];
      this.trailer = [];
      this.container = [];
      this.forceBatch = true;
      this.get = null;
      this.set = null;
      this.createSegment = null;
      this.getSegmentsAfter = null;
      this.iterate = null;
      var b = _splitBatch([..._getSegIndexes(['FHS', 'BHS', 'MSH', 'BTS', 'FTS'], this.raw)])(this.raw);
      for (let i = 0; i < b.length; i++) {
        let hl7 = new HL7(b[i]);
        hl7.transform(err => {
          if (err) throw err;
          if (hl7.transformed['FHS'] || hl7.transformed['BHS']) _addBatchSegment.call(this, hl7, 'header');
          if (hl7.transformed['BTS'] || hl7.transformed['FTS']) _addBatchSegment.call(this, hl7, 'trailer');
          if (hl7.transformed['MSH']) _addToBatch.call(this, hl7);
        }, true);
      }
      this.iterate = _batchIterate;
      if (cb) return cb(null, this.container);
    } else {
      _defineLineEndings(this.raw, (err, lr) => {
        if (err) {
          if (cb) return cb(err, null);
          throw err;
        }
        const {parseOptions} = this;
        var lines = this.raw.split(lr).filter(line => line.indexOf('|') > -1), isMSH = false;
        this.lastIndex = lines.length - 1;
        for (let i = 0; i < lines.length; i++) {
          let name = lines[i].substring(0, 3);
          isMSH = (name === 'MSH') ? true : false;
          if (Object.keys(this.transformed).indexOf(name) > -1) {
            if (Array.isArray(this.transformed[name])) {
              let segment = _SegmentGenerator.call(this, name);
              segment.index = i;
              let content = lines[i].split('|');
              segment = _transformSegment({segment, name, content, isMSH, parseOptions});
              this.transformed[name].push(segment);
            } else {
              let tmp = this.transformed[name];
              this.transformed[name] = new Array();
              this.transformed[name].push(tmp);
              let segment = _SegmentGenerator.call(this, name);
              segment.index = i;
              let content = lines[i].split('|');
              segment = _transformSegment({segment, name, content, isMSH, parseOptions});
              this.transformed[name].push(segment);
            }
          } else {
            let segment = _SegmentGenerator.call(this, name);
            segment.index = i;
            let content = lines[i].split('|');
            segment = _transformSegment({segment, name, content, isMSH, parseOptions});
            this.transformed[name] = [segment];
          }
        }
        if (this.transformed['MSH']) this.transformed['MSH'][0].data['MSH.2'] = '^~\\&';
        if (_invalidSegments(Object.keys(this.transformed))) {
          let error = new Error('HL7 Data contains invalid EOL characters');
          if (cb) return cb(error, null);
          throw error;
        } else {
          if (cb) return cb(null, this.transformed);
        }
      });
    }
  }

  /**
   * Builds a new HL7 message from transformed data
   *
   * @return {String|Object|Array} set value
   * @api public
   */

  build () {
    const { transformed, parseOptions } = this;
    this.encoded = '';
    if (this.isBatch()) {
      this.header.forEach(data => {
        this.encoded += _build(data.transformed, parseOptions).sort((a, b) => a.index - b.index).map(line => line.line).join(parseOptions.lineEndings);
        this.encoded += parseOptions.lineEndings;
      });
      this.container.forEach(data => {
        this.encoded += _build(data.transformed, parseOptions).sort((a, b) => a.index - b.index).map(line => line.line).join(parseOptions.lineEndings);
        this.encoded += parseOptions.lineEndings;
      });
      this.trailer.forEach(data => {
        this.encoded += _build(data.transformed, parseOptions).sort((a, b) => a.index - b.index).map(line => line.line).join(parseOptions.lineEndings);
        this.encoded += parseOptions.lineEndings;
      });
    } else {
      this.encoded += _build(transformed, parseOptions).sort((a, b) => a.index - b.index).map(line => line.line).join(parseOptions.lineEndings);
    }
    return this.encoded;
  }

  /**
   * Sets a value on a transformed segment
   *
   * @param {String} field name of field being set, required
   * @param {String} value index of segment relative to other segments of same type, optional
   * @param {String} sectionIndex index of section within segment being set, optional
   * @param {String} subIndex index of value in repeating field, optional
   * @return {String|Object|Array} set value
   * @api public
   */

  set (field, value, index, sectionIndex, subIndex) {
    const { notation, segment, section, sub } = _defineField(field);
    let segmentStatus = _segmentExists.apply(this, [segment, index]);
    if (segmentStatus.segmentExists) {
      let segmentRef = (segmentStatus.isArray) ? this.transformed[segment][(index) ? index : 0] : this.transformed[segment];
      if (section !== null) {
        let sectionStatus = _sectionExists.apply(this, [segmentRef, section, sectionIndex]);
        if (!sectionStatus.sectionExists) segmentRef = _createSection(segmentRef, notation[1]);
        if (!sectionStatus.isAtIndex && typeof sectionIndex === 'number') segmentRef.data[section] = _createSectionAtIndex(segmentRef.data[section], sectionStatus.isArray, sectionIndex);
        let sectionRef = (Array.isArray(segmentRef.data[section])) ? segmentRef.data[section][(sectionIndex) ? sectionIndex : 0] : segmentRef.data[section];
        if (sub !== null) {
          let subSectionStatus = _subSectionExists.apply(this, [sectionRef, sub, subIndex]);
          if (!subSectionStatus.subSectionExists) {
            if (Array.isArray(segmentRef.data[section])) {
              segmentRef.data[section][(sectionIndex) ? sectionIndex : 0] = _createSubSection(segmentRef.data[section][(sectionIndex) ? sectionIndex : 0], section, notation[2]);
            } else {
              segmentRef.data[section] = _createSubSection(segmentRef.data[section], section, notation[2]);
            }
          }
          if (!subSectionStatus.isAtIndex && typeof subIndex === 'number') {
            if (Array.isArray(segmentRef.data[section])) {
              if (Array.isArray(segmentRef.data[section][(sectionIndex) ? sectionIndex : 0][sub])) {
                segmentRef.data[section][(sectionIndex) ? sectionIndex : 0][sub][(subIndex) ? subIndex : 0] = _createSubSectionAtIndex(segmentRef.data[section][(sectionIndex) ? sectionIndex : 0][sub][(subIndex) ? subIndex : 0], subSectionStatus.isArray, subIndex);
              } else {
                segmentRef.data[section][(sectionIndex) ? sectionIndex : 0][sub] = _createSubSectionAtIndex(segmentRef.data[section][(sectionIndex) ? sectionIndex : 0][sub], subSectionStatus.isArray, subIndex);
              }
            } else {
              if (Array.isArray(segmentRef.data[section][sub])) {
                segmentRef.data[section][sub][(subIndex) ? subIndex : 0] = _createSubSectionAtIndex(segmentRef.data[section][sub][(subIndex) ? subIndex : 0], subSectionStatus.isArray, subIndex);
              } else {
                segmentRef.data[section][sub] = _createSubSectionAtIndex(segmentRef.data[section][sub], subSectionStatus.isArray, subIndex);
              }
            }
          }
          if (Array.isArray(segmentRef.data[section])) {
            if (Array.isArray(segmentRef.data[section][(sectionIndex) ? sectionIndex : 0][sub])) {
              if (typeof value === 'string') {
                return segmentRef.data[section][(sectionIndex) ? sectionIndex : 0][sub][(subIndex) ? subIndex : 0] = value;
              } else {
                throw new Error('DataType must be a string to set field');
              }
            } else {
              if (typeof value === 'string' || Array.isArray(value)) {
                return segmentRef.data[section][(sectionIndex) ? sectionIndex : 0][sub] = value;
              } else {
                throw new Error('DataType must be a string or an array to set field');
              }
            }
          } else {
            if (Array.isArray(segmentRef.data[section][sub])) {
              if (typeof value === 'string') {
                return segmentRef.data[section][sub][(subIndex) ? subIndex : 0] = value;
              } else {
                throw new Error('DataType must be a string to set field');
              }
            } else {
              if (typeof value === 'string' || Array.isArray(value)) {
                return segmentRef.data[section][sub] = value;
              } else {
                throw new Error('DataType must be a string or an array to set field');
              }
            }
          }
        } else {
          if (Array.isArray(segmentRef.data[section])) {
            return segmentRef.data[section][(sectionIndex) ? sectionIndex : 0] = value;
          } else {
            return segmentRef.data[section] = value;
          }
        }
      } else {
        if (typeof value === 'object' && (!Array.isArray(value))) {
          return segmentRef.data = value;
        } else {
          throw new Error('Must provide object notation in order to overwrite existing segment');
        }
      }
    } else {
      throw new Error(`Values cannot be set on segment that does not exist: ${segment}`);
    }
  }

  /**
   * Gets a value from a transformed segment returning an array, object, or string
   *
   * @param {String} field name of field being requested, required
   * @param {Number} index index of segment relative to other segments of same type, optional
   * @param {Number} sectionIndex index of section within segment being requested, optional
   * @param {Number} subIndex index of value in repeating field, optional
   * @return {String|Object|Array} value at specified segment position
   * @api public
   */

  get (field, index, sectionIndex, subIndex) {
    index = index || 0;
    sectionIndex = sectionIndex || 0;
    subIndex = subIndex || 0;
    const {notation, segment, section, sub} = _defineField(field);
    if (segment !== null && section !== null && sub !== null) {
      if (typeof this.transformed[segment] !== 'undefined') {
        if (typeof this.transformed[segment][index].data[section] !== 'undefined') {
          if (Array.isArray(this.transformed[segment][index].data[section])) {
            if (typeof this.transformed[segment][index].data[section][sectionIndex][sub] !== 'undefined') {
              if (Array.isArray(this.transformed[segment][index].data[section][sectionIndex][sub])) {
                return this.transformed[segment][index].data[section][sectionIndex][sub][subIndex];
              } else {
                return this.transformed[segment][index].data[section][sectionIndex][sub];
              }
            } else {
              let val = this.transformed[segment][index].data[section][sectionIndex];
              return ((notation[2] == 1) && (typeof val === 'string')) ? val : null;
            }
          } else {
            if (typeof this.transformed[segment][index].data[section][sub] !== 'undefined') {
              if (Array.isArray(this.transformed[segment][index].data[section][sub])) {
                return this.transformed[segment][index].data[section][sub][subIndex];
              } else {
                return this.transformed[segment][index].data[section][sub];
              }
            } else {
              let val = this.transformed[segment][index].data[section];
              return ((notation[2] == 1) && (typeof val === 'string')) ? val : null;
            }
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else if (segment !== null && section !== null) {
      if (typeof this.transformed[segment] !== 'undefined') {
        if (typeof this.transformed[segment][index].data[section] !== 'undefined') {
          if (Array.isArray(this.transformed[segment][index].data[section])) {
            return this.transformed[segment][index].data[section][sectionIndex];
          } else {
            return this.transformed[segment][index].data[section];
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else if (segment !== null) {
      if (typeof this.transformed[segment] !== 'undefined') {
        return this.transformed[segment][index].data;
      } else {
        return null;
      }
    } else {
      throw new Error('Segment name must be provided as parameter to get function');
    }
  }

  /**
   * Gets a single segment constructor, if multiple exist, it will return the first one.
   *
   * @param {String} segment name, must be 3 char, required
   * @return {Object} 'Segment' constructor with get and set methods
   * @api public
   */

  getSegment (segment) {
    if (!_validSegment(segment)) throw new Error('Cannot get segment after because \'segment\' parameter: is invalid.');
    return this.transformed[segment] && this.transformed[segment][0] ? this.transformed[segment][0] : null;
  }

  /**
   * Gets all segment constructors by segment type, if no segment is specified, method will
   * return all segments in the message
   *
   * @param {String} segment name, optional
   * @return {Array} list of all 'Segment' constructors, with get and set methods, by that type
   * @api public
   */

  getSegments (segment) {
    if (segment) {
      if (!_validSegment(segment)) throw new Error('Cannot get segments because \'segment\' parameter: is invalid.');
      return this.transformed[segment] ? this.transformed[segment] : [];
    } else {
      return Object.keys(this.transformed).reduce((a, b) => {
        a = a.concat(this.transformed[b]);
        return a;
      }, []);
    }
  }

  /**
   * Creates a single segment at the end of the hl7 message
   *
   * @param {String} segment name, optional
   * @return {Array} list of all 'Segment' constructors, with get and set methods, by that type
   * @api public
   */

  createSegment (segment) {
    if (!_validSegment(segment)) throw new Error('Cannot create segment because \'segment\' parameter: is invalid.');
    const exists = (typeof this.transformed[segment] !== 'undefined') ? true : false;
    this.lastIndex++;
    if (exists) {
      if (Array.isArray(this.transformed[segment])) {
        let seg = _SegmentGenerator.call(this, segment);
        seg.index = this.lastIndex;
        this.transformed[segment].push(seg);
        return seg;
      } else {
        let current = this.transformed[segment];
        this.transformed[segment] = [];
        let seg = _SegmentGenerator.call(this, segment);
        seg.index = this.lastIndex;
        this.transformed[segment] = this.transformed[segment].concat([current, seg]);
        return seg;
      }
    } else {
      let seg = _SegmentGenerator.call(this, segment);
      seg.index = this.lastIndex;
      this.transformed[segment] = [seg];
      return seg;
    }
  }

  /**
   * Creates a single segment after an already existing, specified segment
   *
   * @param {String} segment name, required
   * @param {Object} afterSegment 'Segment' constructor, required
   * @return {Object} newly created 'Segment' constructor
   * @api public
   */

  createSegmentAfter (segment, afterSegment = {}) {
    if (!_validSegment(segment)) throw new Error('Cannot create segment after because \'segment\' parameter: is invalid.');
    const exists = (typeof this.transformed[segment] !== 'undefined') ? true : false;
    if (afterSegment.constructor.name !== 'Segment') throw new Error('Cannot create segment after because \'afterSegment\' parameter: is invalid.');
    this.lastIndex++;
    const newIndex = afterSegment.index + 1;
    if (exists) {
      if (Array.isArray(this.transformed[segment])) {
        _moveSegment.call(this, newIndex, true);
        let seg = _SegmentGenerator.call(this, segment);
        seg.index = newIndex;
        this.transformed[segment].push(seg);
        return seg;
      } else {
        _moveSegment.call(this, newIndex, true);
        let current = this.transformed[segment];
        this.transformed[segment] = [];
        let seg = _SegmentGenerator.call(this, segment);
        seg.index = newIndex;
        this.transformed[segment] = this.transformed[segment].concat([current, seg]);
        return seg;
      }
    } else {
      _moveSegment.call(this, newIndex, true);
      let seg = _SegmentGenerator.call(this, segment);
      seg.index = newIndex;
      this.transformed[segment] = [seg];
      return seg;
    }
  }

  /**
   * Creates a single segment before an already existing, specified segment
   *
   * @param {String} segment name, required
   * @param {Object} beforeSegment 'Segment' constructor, required
   * @return {Object} newly created 'Segment' constructor
   * @api public
   */

  createSegmentBefore (segment, beforeSegment = {}) {
    if (!_validSegment(segment)) throw new Error('Cannot create segment before because \'segment\' parameter: is invalid.');
    const exists = (typeof this.transformed[segment] !== 'undefined') ? true : false;
    if (beforeSegment.constructor.name !== 'Segment') throw new Error('Cannot create segment before because \'beforeSegment\' parameter: is invalid.');
    this.lastIndex++;
    const newIndex = beforeSegment.index - 1;
    if (exists) {
      if (Array.isArray(this.transformed[segment])) {
        _moveSegment.call(this, newIndex, false);
        let seg = _SegmentGenerator.call(this, segment);
        seg.index = newIndex;
        this.transformed[segment].push(seg);
        return seg;
      } else {
        _moveSegment.call(this, newIndex, false);
        let current = this.transformed[segment];
        this.transformed[segment] = [];
        let seg = _SegmentGenerator.call(this, segment);
        seg.index = newIndex;
        this.transformed[segment] = this.transformed[segment].concat([current, seg]);
        return seg;
      }
    } else {
      _moveSegment.call(this, newIndex, false);
      let seg = _SegmentGenerator.call(this, segment);
      seg.index = newIndex;
      this.transformed[segment] = [seg];
      return seg;
    }
  }

  /**
   * Deletes a single segment from the HL7 message
   *
   * @param {Object} segment 'Segment' constructor to be deleted, required
   * @api public
   */

  deleteSegment (segment) {
    if (segment.constructor.name !== 'Segment') throw new Error('Cannot delete segment because \'segment\' parameter: is invalid.');
    this.deleteSegments.call(this, [ segment ]);
  }

  /**
   * Deletes multiple segments from the HL7 message
   *
   * @param {Array} segments array of 'Segment' constructors to be deleted, required
   * @api public
   */

  deleteSegments (segments) {
    if (!Array.isArray(segments)) segments = [ segments ];
    const segmentTypes = segments.map(({ type }) => type).filter((a, b, list) => b === list.indexOf(a));
    var i = 0;
    const length = segments.length - 1;
    while (i <= length) {
      delete this.transformed[segments[i].type][this.transformed[segments[i].type].indexOf(segments[i])];
      i++;
    }
    _cleanse.call(this, segmentTypes);
  }

  /**
   * Returns all requested 'Segment' constructors at occur in the HL7 message after a specified start point
   *
   * @param {Object} start 'Segment' constructor that marks the starting point for the retrieval of segments, required
   * @param {String} name name of segment that you wish to retrieve, required
   * @param {Boolean} consecutive boolean telling the method to only grab segments that are consecutive or back to back in the HL7 message, optional
   * @param {String|Array} stop segment name or list of segment names that would trigger the method to stop collecting matching segments, optional
   * @api public
   */

  getSegmentsAfter (start, name, consecutive, stop) {
    var group = [], previousIndex = null, stopSeg = null;
    consecutive = consecutive || false;
    if (typeof start !== 'undefined' && start.constructor.name === 'Segment') {
      if (typeof stop !== 'undefined') {
        if (Array.isArray(stop)) {
          var multiStop = [], stopIndex = null;
          for (let i = 0; i < stop.length; i++) {
            if (typeof this.transformed[stop[i]] !== 'undefined') {
              stopIndex = (Array.isArray(this.transformed[stop[i]])) ? this.transformed[stop[i]].map(j => j.index).find(x => x > start.index) : this.transformed[stop[i]].index;
              if (typeof stopIndex === 'undefined') stopIndex = null;
              if (stopIndex !== null) {
                if (start.index > stopIndex) stopIndex = null;
                if (stopIndex !== null) multiStop.push(stopIndex);
              }
            }
          }
          stopSeg = (multiStop.length) ? Math.min(...multiStop) : null;
        } else {
          if (typeof this.transformed[stop] !== 'undefined') {
            stopSeg = (Array.isArray(this.transformed[stop])) ? this.transformed[stop].map(i => i.index).find(x => x > start.index) : this.transformed[stop].index;
            if (typeof stopSeg === 'undefined') stopSeg = null;
            if (stopSeg !== null) {
              if (start.index > stopSeg) stopSeg = null;
            }
          }
        }
      }
      if (_validSegment(name)) {
        if (typeof this.transformed[name] !== 'undefined') {
          for (let i = 0; i < this.transformed[name].length; i++) {
            if (this.transformed[name][i].index > start.index) {
              if (consecutive) {
                if (previousIndex === null) {
                  group.push(this.transformed[name][i]);
                } else {
                  if (previousIndex + 1 === this.transformed[name][i].index) {
                    group.push(this.transformed[name][i]);
                  } else {
                    return group;
                  }
                }
                previousIndex = this.transformed[name][i].index;
              } else {
                if (stopSeg !== null) {
                  if (this.transformed[name][i].index < stopSeg) {
                    group.push(this.transformed[name][i]);
                  } else {
                    return group;
                  }
                } else {
                  group.push(this.transformed[name][i]);
                }
              }
            }
          }
          return group;
        } else {
          return group;
        }
      } else {
        throw new Error(`Cannot get segments because segment name is invalid: ${name}`);
      }
    } else {
      throw new Error('Cannot retrieve start position from segment.');
    }
  }

  /**
   * Moves existing segment after another existing segment
   *
   * @param {Object} segment 'Segment' constructor that is being moved, required
   * @param {Object} afterSegment 'Segment' constructor that marks where the segment is being moved after, required
   * @api public
   */

  moveSegmentAfter (segment, afterSegment) {
    if (segment.constructor.name !== 'Segment') throw new Error('Cannot create segment before because \'segment\' parameter: is invalid.');
    if (afterSegment.constructor.name !== 'Segment') throw new Error('Cannot create segment before because \'afterSegment\' parameter: is invalid.');
    const newIndex = afterSegment.index + 1;
    _moveSegment.call(this, newIndex, true);
    segment.index = newIndex;
  }

  /**
   * Moves existing segment before another existing segment
   *
   * @param {Object} segment 'Segment' constructor that is being moved, required
   * @param {Object} beforeSegment 'Segment' constructor that marks where the segment is being moved before, required
   * @api public
   */

  moveSegmentBefore (segment, beforeSegment) {
    if (segment.constructor.name !== 'Segment') throw new Error('Cannot create segment before because \'segment\' parameter: is invalid.');
    if (beforeSegment.constructor.name !== 'Segment') throw new Error('Cannot create segment before because \'beforeSegment\' parameter: is invalid.');
    const newIndex = beforeSegment.index;
    _moveSegment.call(this, newIndex, true);
    segment.index = newIndex;
  }
};
