import fs from 'node:fs';
import { it, describe, expect } from 'vitest';
import { EJSON, ResourceSet } from '../src/resource';

describe('Annotations', () => {
  it('should read an ecore file containing annotations', () => {
    let resourceSet = ResourceSet!.create()!;
    let model = resourceSet.create({ uri: 'http://www.example.org/example' })!;

    fs.readFile('./test/models/annotations.json', 'utf8', (err, data) => {
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

          let pp = model.get('contents').at(0);
          let fooClass = pp.get('eClassifiers').at(0);

          expect(fooClass).toBeDefined();
          expect(fooClass.get('eAnnotations').size()).toBe(1);

          let details = fooClass.get('eAnnotations').at(0).get('details');

          expect(details.at(0).get('key')).toBe('displayName');
          expect(details.at(0).get('value')).toBe('value');

          expect(details.at(1).get('key')).toBe('otherName');
          expect(details.at(1).get('value')).toBe('otherValue');
        },
        { format: JSON },
      );
    });
  });

  it('should write annotations as object', () => {
    let resourceSet = ResourceSet!.create()!;
    let model = resourceSet.create({ uri: 'http://www.example.org/example' })!;

    fs.readFile(
      './test/models/annotations.json',
      'utf8',
      (_: any, data: any) => {
        (model as unknown as any).load(
          data,
          (model: any, _: any) => {
            let result = EJSON.to(model);

            expect(
              result.eClassifiers[0].eAnnotations[0].details.displayName,
            ).toBe('value');
            expect(
              result.eClassifiers[0].eAnnotations[0].details.otherName,
            ).toBe('otherValue');
          },
          { format: JSON },
        );
      },
    );
  });
});
