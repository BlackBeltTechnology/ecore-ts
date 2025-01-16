import { Resource } from '../../dist/ecore.js';
import { bench } from './bench.js';

let data = {
  model: {
    eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EPackage',
    name: 'example',
    nsURI: 'http://www.example.org/example',
    nsPrefix: 'example',
    eClassifiers: [
      {
        eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EClass',
        name: 'A',
        eStructuralFeatures: [
          {
            eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EAttribute',
            name: 'name',
            eType: {
              $ref: 'http://www.eclipse.org/emf/2002/Ecore#//EString',
              eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EDataType',
            },
          },
        ],
      },
      {
        eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EClass',
        name: 'B',
        eSuperTypes: [{ $ref: '//A' }],
      },
    ],
  },
};

let main = () => {
  console.log('start benchmark');

  let model = Resource.create({ uri: 'simple' });
  let onSuccess = (result) => {};
  let onError = () => {};
  let input = { data: data.model };

  bench(model.load, 1, [onSuccess, onError, input], model);
};

window.onload = main;
