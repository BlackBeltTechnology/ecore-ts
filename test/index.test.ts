import { expect, it, describe, beforeEach } from 'vitest';
import { EResource, ResourceSet } from '../src/resource';
import { EClass, EList, EObject, EPackage } from '../src/ecore';

describe('index', () => {
  let resource: EResource;

  beforeEach(() => {
    let resourceSet = ResourceSet.create()!;

    let p = EPackage.create({ name: 'p' })!;
    let a = EClass.create({ name: 'A' })!;
    let b = EClass.create({ name: 'B' })!;

    p.get<EList>('eClassifiers')!.add(a).add(b);

    resource = resourceSet.create<EResource>('test')!;
    resource.add(p);
  });

  it('should have index', () => {
    let index = resource._index();
    expect(index).toBeDefined();
    expect(Object.keys(index).length).toBe(3);
  });

  it('should be updated when adding an element', () => {
    expect(resource._index()).toBeDefined();

    resource.on('add', (_: any) => {
      expect(resource.__updateIndex).toBe(true);

      let index = resource._index();
      expect(Object.keys(index).length).toBe(4);

      expect(resource.__index).toEqual(index);
    });

    let c = EClass.create({ name: 'C' })!;
    resource
      .get<EList>('contents')!
      .at<EObject>(0)
      .get<EList>('eClassifiers')!
      .add(c);
  });

  it('should be update when removing an element', () => {
    let index = resource._index();
    expect(Object.keys(index).length).toBe(3);

    resource.on('remove', (_: any) => {
      expect(resource.__updateIndex).toBe(true);
      index = resource._index();
      expect(Object.keys(index).length).toBe(2);
    });

    let root = resource.get<EList>('contents')!.at<EObject>(0);
    root
      .get<EList>('eClassifiers')!
      .remove(root.get<EList>('eClassifiers')!.at(1));
  });
});
