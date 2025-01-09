import fs from 'node:fs';
import { it, describe, expect } from 'vitest';
import { ResourceSet } from '../src/resource';
import { EPackage, EString } from '../src/ecore';
import { XMI } from '../src/xmi';

describe('Generics', () => {
  it('should read an ecore file containing generics', () => {
    let resourceSet = ResourceSet!.create()!;
    let model = resourceSet.create({ uri: 'http://emfjson.org/generics' })!;

    fs.readFile('./test/models/generic.ecore', 'utf8', (err, data) => {
      if (err) {
        console.log(err);
        return;
      }

      (model as unknown as any).load(
        data,
        (model: any, err: any) => {
          if (err) {
            console.log(err);
            return;
          }

          let contents = model.get('contents');
          expect(contents.size()).toBe(1);
          expect(contents.at(0).eClass).toEqual(EPackage);

          let pp = contents.at(0);

          let valueHolderClass = pp.get('eClassifiers').find((e: any) => {
            return e.get('name') === 'ValueHolder';
          });
          expect(valueHolderClass).toBeDefined();
          //assert.equal(valueHolderClass.get('abstract'), true);
          expect(valueHolderClass.get('eTypeParameters').size()).toBe(1);
          expect(valueHolderClass.get('eStructuralFeatures').size()).toBe(1);

          let typeParameter = valueHolderClass.get('eTypeParameters').at(0);
          expect(typeParameter.get('name')).toBe('T');

          let feature = valueHolderClass.get('eStructuralFeatures').at(0);
          expect(feature.get('eGenericType').get('eTypeParameter')).toEqual(
            typeParameter,
          );

          let stringHolderClass = pp.get('eClassifiers').find((e: any) => {
            return e.get('name') === 'StringHolder';
          });
          expect(stringHolderClass).toBeDefined();
          //assert.equal(stringHolderClass.get('abstract'), false);
          expect(stringHolderClass.get('eGenericSuperTypes').size()).toEqual(1);

          let genericType = stringHolderClass.get('eGenericSuperTypes').at(0);
          expect(genericType.get('eClassifier')).toEqual(valueHolderClass);
          expect(genericType.get('eTypeArguments').size()).toBe(1);
          expect(
            genericType.get('eTypeArguments').at(0).get('eClassifier'),
          ).toEqual(EString);
        },
        { format: XMI },
      );
    });
  });
});
