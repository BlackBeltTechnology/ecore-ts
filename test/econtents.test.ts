import { it, describe, expect, beforeEach } from 'vitest';
import { EResource, ResourceSet } from '../src/resource';
import { EClass, EList, EPackage } from '../src/ecore';

describe('EObject.eContents', () => {
  let resource, p: typeof EPackage;

  beforeEach(() => {
    let resourceSet = ResourceSet.create()!;

    p = EPackage.create<typeof EPackage>({ name: 'p' })!;
    let a = EClass.create({ name: 'A' })!;
    let b = EClass.create({ name: 'B' })!;

    p.get<EList>('eClassifiers')!.add(a).add(b);

    resource = resourceSet.create<EResource>('test')!;
    resource.add(p);
  });

  it('should return content of the object', () => {
    let contents = p.eContents();

    expect(contents).toBeDefined();
    expect(contents.length).toEqual(2);
  });

  it('should be updated when adding an element', () => {
    p.get<EList>('eClassifiers')!.add(EClass.create({ name: 'C' }));

    let contents = p.eContents();

    expect(contents).toBeDefined();
    expect(contents.length).toEqual(3);
    expect(p.eContents()).toEqual(contents);
  });

  it('should be updated when removing an element', () => {
    p.get<EList>('eClassifiers')!.remove(p.get<EList>('eClassifiers')!.at(1));

    let contents = p.eContents();

    expect(contents).toBeDefined();
    expect(contents.length).toBe(1);
    expect(p.eContents()).toEqual(contents);
  });
});
