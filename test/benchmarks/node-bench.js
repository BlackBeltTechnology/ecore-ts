import fs from 'node:fs';
import { Resource, XMI } from '../../dist/ecore.js';
import { bench } from './bench.js';

let model = Resource.create({ uri: 'simple' });
let onSuccess = (result) => {};
let onError = () => {};

fs.readFile('../models/simple.json', 'utf8', (err, data) => {
  if (err) {
    return console.log(err);
  }

  let input = { data: JSON.parse(data) };

  bench(model.load, 20, [onSuccess, onError, input], model);
});

fs.readFile('../models/test1.xmi', 'utf8', (err, data) => {
  if (err) {
    return console.log(err);
  }

  let input = { data: data, format: XMI };

  bench(model.load, 20, [onSuccess, onError, input], model);
});

fs.readFile('../models/test2.xmi', 'utf8', (err, data) => {
  if (err) {
    return console.log(err);
  }

  let input = { data: data, format: XMI };

  bench(model.load, 20, [onSuccess, onError, input], model);
});
