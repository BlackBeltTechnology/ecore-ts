import fs from 'node:fs';
import { it, describe, expect, beforeEach } from 'vitest';
import { EResource, ResourceSet } from '../src/resource';
import {
  EAttribute,
  EClass,
  EDiagnosticChain,
  EFloatObject,
  EGenericType,
  EInt,
  EIntegerObject,
  EList,
  ELongObject,
  EMap,
  EObject,
  EOperation,
  EPackage,
  EParameter,
  EReference,
  EString,
} from '../src/ecore';
import { XMI } from '../src/xmi';

describe('#XMI', () => {
  describe('#parse', () => {
    it('should parse test1 correctly', () => {
      let resourceSet = ResourceSet.create()!;
      let model = resourceSet.create({ uri: 'test1.xmi' })!;

      fs.readFile('./test/models/test1.xmi', 'utf8', (err, data) => {
        if (err) return console.log(err);

        (model as unknown as any).load(
          data,
          function (model: EResource, err: any) {
            expect(err).toBe(null);

            let contents = model.get<EList>('contents')!;
            expect(contents.size()).toBe(1);

            let root = contents.at<EObject>(0);
            expect(root.eClass).toEqual(EPackage);
            expect(root.get('name')).toBe('test');
            expect(root.get('nsPrefix')).toBe('test');
            expect(root.get('nsURI')).toBe('http:///www.eclipselabs.org/test');

            let eClassifiers = root.get<EList>('eClassifiers')!;
            expect(eClassifiers.size()).toBe(1);

            let rootClass = eClassifiers.at<EObject>(0);
            expect(rootClass.eClass).toEqual(EClass);
            expect(rootClass.get('name')).toBe('Root');
            expect(rootClass.get<EList>('eStructuralFeatures')!.size()).toBe(1);

            let rootClassLabel = rootClass
              .get<EList>('eStructuralFeatures')!
              .at<EObject>(0);
            expect(rootClassLabel.eClass).toEqual(EAttribute);

            expect(rootClassLabel.get('eType')).toEqual(EString);
          },
          { format: XMI },
        );
      });
    });

    it('should parse test2 correctly', () => {
      let resourceSet = ResourceSet.create()!;
      let model = resourceSet.create<EResource>({ uri: 'test2.xmi' })!;

      fs.readFile('./test/models/test2.xmi', 'utf8', (err, data) => {
        if (err) return console.log(err);

        model.load(
          data,
          (model: EResource, err: any) => {
            expect(err).toBe(null);

            let contents = model.get<EList>('contents')!;
            expect(contents.size()).toBe(1);

            let root = contents.at<EObject>(0);
            expect(root.eClass).toEqual(EPackage);
            expect(root.get('name')).toBe('test');
            expect(root.get('nsPrefix')).toBe('test');
            expect(root.get('nsURI')).toBe('http:///www.eclipselabs.org/test');

            let eClassifiers = root.get<EList>('eClassifiers')!;
            expect(eClassifiers.size()).toBe(1);

            let rootClass = eClassifiers.at<EObject>(0);
            expect(rootClass.eClass).toEqual(EClass);
            expect(rootClass.get('name')).toBe('Root');
            expect(rootClass.get<EList>('eStructuralFeatures')!.size()).toBe(2);

            let rootClassLabel = rootClass
              .get<EList>('eStructuralFeatures')!
              .at<EObject>(0);
            expect(rootClassLabel.eClass).toEqual(EAttribute);
            expect(rootClassLabel.get('name')).toBe('label');
            expect(rootClassLabel.get('eType')).toEqual(EString);

            let rootClassNumber = rootClass
              .get<EList>('eStructuralFeatures')!
              .at<EObject>(1);
            expect(rootClassNumber.eClass).toEqual(EAttribute);
            expect(rootClassNumber.get('name')).toBe('number');
            expect(rootClassNumber.get('eType')).toEqual(EInt);
          },
          { format: XMI },
        );
      });
    });

    it('should parse test3 correctly', () => {
      let resourceSet = ResourceSet.create()!;
      let model = resourceSet.create<EResource>({ uri: 'test3.xmi' })!;

      fs.readFile('./test/models/test3.xmi', 'utf8', (err, data) => {
        if (err) return console.log(err);

        model.load(
          data,
          function (model: EResource, err: any) {
            expect(err).toBe(null);

            let contents = model.get<EList>('contents')!;
            expect(contents.size()).toBe(1);

            let root = contents.at<EObject>(0);
            expect(root.eClass).toEqual(EPackage);
            expect(root.get('name')).toBe('test');
            expect(root.get('nsPrefix')).toBe('test');
            expect(root.get('nsURI')).toBe('http:///www.eclipselabs.org/test');

            let eClassifiers = root.get<EList>('eClassifiers')!;
            expect(eClassifiers.size()).toBe(1);

            let rootClass = eClassifiers.at<EObject>(0);
            expect(rootClass.eClass).toEqual(EClass);
            expect(rootClass.get('name')).toBe('Root');
            expect(rootClass.get<EList>('eStructuralFeatures')!.size()).toBe(3);
            expect(rootClass.get<EList>('eOperations')!.size()).toBe(1);

            let rootClassInteger = rootClass
              .get<EList>('eStructuralFeatures')!
              .at<EObject>(0);
            expect(rootClassInteger.eClass).toEqual(EAttribute);
            expect(rootClassInteger.get('name')).toBe('integerObject');
            expect(rootClassInteger.get('eType')).toEqual(EIntegerObject);

            let rootClassFloat = rootClass
              .get<EList>('eStructuralFeatures')!
              .at<EObject>(1);
            expect(rootClassFloat.eClass).toEqual(EAttribute);
            expect(rootClassFloat.get('name')).toBe('floatObject');
            expect(rootClassFloat.get('eType')).toEqual(EFloatObject);

            let rootClassLong = rootClass
              .get<EList>('eStructuralFeatures')!
              .at<EObject>(2);
            expect(rootClassLong.eClass).toEqual(EAttribute);
            expect(rootClassLong.get('name')).toBe('longObject');
            expect(rootClassLong.get('eType')).toEqual(ELongObject);

            let rootClassOperation = rootClass
              .get<EList>('eOperations')!
              .at<EObject>(0);
            expect(rootClassOperation.eClass).toEqual(EOperation);
            expect(rootClassOperation.get('name')).toBe('validationOperation');
            expect(rootClassOperation.get<EList>('eParameters')!.size()).toBe(
              2,
            );

            let operationParameterDiagnostics = rootClassOperation
              .get<EList>('eParameters')!
              .at<EObject>(0);
            expect(operationParameterDiagnostics.eClass).toEqual(EParameter);
            expect(operationParameterDiagnostics.get('name')).toBe(
              'diagnostics',
            );
            expect(operationParameterDiagnostics.get('eType')).toEqual(
              EDiagnosticChain,
            );

            let operationParameterContext = rootClassOperation
              .get<EList>('eParameters')!
              .at<EObject>(1);
            expect(operationParameterContext.eClass).toEqual(EParameter);
            expect(operationParameterContext.get('name')).toBe('context');

            let operationParameterContextType =
              operationParameterContext.get<EObject>('eGenericType')!;
            expect(operationParameterContextType.eClass).toEqual(EGenericType);
            expect(
              operationParameterContextType
                .get<EList>('eTypeArguments')!
                .size(),
            ).toBe(2);
            expect(operationParameterContextType.get('eClassifier')).toEqual(
              EMap,
            );
          },
          { format: XMI },
        );
      });
    });
  });

  describe('Containment feature with upper bound equal to 1:', () => {
    let resourceSet: EObject, resource, A: EObject, B: EObject;

    beforeEach(() => {
      resourceSet = ResourceSet.create()!;

      let P = EPackage.create({
        name: 'sample',
        nsPrefix: 'sample',
        nsURI: 'http://www.example.org/sample',
      })!;

      A = EClass.create({ name: 'A' })!;
      B = EClass.create({ name: 'B' })!;

      let A_B = EReference.create({
        name: 'b',
        upperBound: 1,
        containment: true,
        eType: () => {
          return B;
        },
      })!;

      A.get<EList>('eStructuralFeatures')!.add(A_B);

      P.get<EList>('eClassifiers')!.add(A).add(B);

      resource = resourceSet.create('model')!;
      (resource as unknown as any).add(P);
    });

    it('should serialize test3 correctly', () => {
      let r = resourceSet.create({ uri: 'test3.xmi' })!,
        a = A.create({})!,
        b = B.create({})!;

      a.set('b', b);

      r.get<EList>('contents')!.add(a);

      let expected =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '\n' +
        '<sample:A xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:sample="http://www.example.org/sample">' +
        '<b/>' +
        '</sample:A>';

      expect((r as unknown as any).to(XMI)).toEqual(expected);
    });

    it('should unset correctly b1', () => {
      let a = A.create({})!,
        b1 = B.create({})!,
        b2 = B.create({})!;

      a.set('b', b1);
      a.set('b', b2);

      expect(b1.eContainer).toBeUndefined();
      expect(b1.eContainingFeature).toBeUndefined();
    });
  });
});
