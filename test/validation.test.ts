import fs from 'node:fs';
import { it, describe, expect } from 'vitest';
import { ResourceSet } from '../src/resource';
import { XMI } from '../src/xmi';
import { EList, EPackage } from '../src/ecore';

describe('Parsing of invalid model files', () => {
  it('should detect an invalid eSuperType', () => {
    //test6.xmi is the same as test5.xmi except for name changing and
    //the eSuperType of 'SpecialItem' on line 16 is 'Invalid'.
    //Present behavior is that the offending eSuperType entry is
    //simply removed silently.

    let modelSet = ResourceSet.create()!;
    let model = modelSet.create({ uri: 'test6.xmi' })!;
    let modelFile = fs.readFileSync('./test/models/test6.xmi', 'utf8');
    let passFlag = false;
    try {
      (model as unknown as any).parse(modelFile, XMI);
    } catch (err) {
      passFlag = true;
    }
    expect(passFlag).toBe(true);

    //		firstElement = model.get('contents').first();
    //		EPackage.Registry.register(firstElement);
    //
    //		workingPath = EPackage.Registry
    //						   .getEPackage('http://www.example.org/test6')
    //						   .values.eClassifiers._internal[1]
    //						   .values.eAnnotations._owner;
    //
    //		superTypes = workingPath.values.eSuperTypes;
    //		// name === workingpath.values.name
    //		// # of supertypes === workingPath.values.eSuperTypes._size
    //		// Since 'SpecialItem' has no valid supertypes, its size is zero
    //		assert.equal(superTypes._size, 0);
  });

  it('should detect invalid class types in instances', () => {
    // This test should detect that an instance of test5.xmi
    // has an invalid type. Child 2 in test5-instance4.xmi has
    // invalid type. The correct version of instance4 is instance1.
    let modelSet = ResourceSet.create()!;
    let model = modelSet.create({ uri: 'test5.xmi' })!;
    let modelFile = fs.readFileSync('./test/models/test5.xmi', 'utf8');
    (model as unknown as any).parse(modelFile, XMI);
    let firstElement = model.get<EList>('contents')!.first();
    EPackage.Registry.register(firstElement);

    let instanceSet = ResourceSet.create()!;
    let instance = instanceSet.create({ uri: 'test5-instance4.xmi' })!;
    let instanceFile = fs.readFileSync(
      './test/models/test5-instance4.xmi',
      'utf8',
    );

    try {
      (instance as unknown as any).parse(instanceFile, XMI);
    } catch (err: any) {
      expect(err.toString()).toBe('Error: child has undefined/invalid eClass.');
    }
  });
});
