import fs from 'node:fs';
import { it, describe, expect } from 'vitest';
import { EJSON, EResource, ResourceSet } from '../src/resource';
import { EList, EObject } from '../src/ecore';

describe('Annotations', () => {
  it('should read an ecore file containing annotations', () => {
    let resourceSet = ResourceSet.create()!;
    let model = resourceSet.create<EResource>({
      uri: 'http://www.example.org/example',
    })!;

    fs.readFile('./test/models/annotations.json', 'utf8', (err, data) => {
      if (err) {
        console.log(err);
        return;
      }

      model.load(
        data,
        (model: EResource, err: any) => {
          if (err) {
            console.log(err);
            return;
          }

          let pp = model.get<EList>('contents')!.at<EObject>(0);
          let fooClass = pp.get<EList>('eClassifiers')!.at<EObject>(0);

          expect(fooClass).toBeDefined();
          expect(fooClass.get<EList>('eAnnotations')!.size()).toBe(1);

          let details = fooClass
            .get<EList>('eAnnotations')!
            .at<EObject>(0)
            .get<EList>('details')!;

          expect(details.at<EObject>(0).get('key')).toBe('displayName');
          expect(details.at<EObject>(0).get('value')).toBe('value');

          expect(details.at<EObject>(1).get('key')).toBe('otherName');
          expect(details.at<EObject>(1).get('value')).toBe('otherValue');
        },
        { format: JSON },
      );
    });
  });

  it('should write annotations as object', () => {
    let resourceSet = ResourceSet.create()!;
    let model = resourceSet.create<EResource>({
      uri: 'http://www.example.org/example',
    })!;

    fs.readFile(
      './test/models/annotations.json',
      'utf8',
      (_: any, data: any) => {
        model.load(
          data,
          (model: EResource, _: any) => {
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
