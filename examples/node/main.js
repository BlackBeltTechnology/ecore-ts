import fs from 'node:fs';
import { Resource, XMI } from '../../dist/ecore.js';

let callback = (model, err) => {
    if (err) {
        console.log('fail loading model', err);
        return;
    }

    let ePackage = model.get('contents').first();

    console.log('loaded ePackage', ePackage.get('name'));
    console.log('eClassifiers', ePackage.get('eClassifiers').map((c) => {
        return c.get('name') + ' superTypes(' + c.get('eSuperTypes').map((s) => {
            return s.get('name');
        }).join(', ') + ') features(' + c.get('eStructuralFeatures').map((f) => {
            return f.get('name') + ' : ' + f.get('eType').get('name');
        }).join(', ') + ')';
    }));
};

fs.readFile('./model.json', 'utf8', (err, data) => {
    if (err) return console.log(err);

    Resource.create({ uri: 'model.json' }).load(data, callback);
});

fs.readFile('./model.xmi', 'utf8', (err, data) => {
    if (err) return console.log(err);

    Resource.create({ uri: 'model.xmi' }).load(data, callback, {format: XMI});
});

