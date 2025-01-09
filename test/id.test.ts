import { expect, it, describe } from 'vitest';
import { ResourceSet } from '../src/resource';

describe('ids', () => {
  let rs = ResourceSet!.create()!;
  let r = rs.create('id-test')!;

  let data = {
    eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EPackage',
    _id: '1',
    name: 'p',
    eClassifiers: [
      {
        eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EClass',
        _id: '2',
        name: 'A',
      },
      {
        eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EClass',
        _id: '3',
        name: 'B',
        eSuperTypes: [
          {
            $ref: '2',
          },
        ],
      },
    ],
  };

  (r as unknown as any).parse(data);

  expect(r.get('contents').size()).toBe(1);

  let root = r.get('contents').at(0);
  expect(root.get('eClassifiers').size()).toBe(2);

  let a = root.get('eClassifiers').at(0);
  let b = root.get('eClassifiers').at(1);

  expect(a.get('name')).toBe('A');
  expect(b.get('name')).toBe('B');

  it('should contain one object with _id', () => {
    expect(root._id).toBe('1');
    expect(a._id).toBe('2');
    expect(b._id).toBe('3');
  });

  it('should have for fragment _id', () => {
    expect(root.fragment()).toBe('1');
    expect(a.fragment()).toBe('2');
    expect(b.fragment()).toBe('3');
  });

  it('should be present in resource._index()', () => {
    let idx = (r as unknown as any)._index();

    expect(idx).toBeDefined();
    expect(idx['1']).toEqual(root);
    expect(idx['2']).toEqual(a);
    expect(idx['3']).toEqual(b);
  });

  it('should be accessible from resource.getEObject()', () => {
    let found = (r as unknown as any).getEObject('1');
    expect(found).toEqual(root);

    found = (r as unknown as any).getEObject('2');
    expect(found).toEqual(a);

    found = (r as unknown as any).getEObject('3');
    expect(found).toEqual(b);
  });

  it('should be accessible from resourceSet.getEObject()', () => {
    let found = (rs as unknown as any).getEObject('id-test#1');
    expect(found).toEqual(root);

    found = (rs as unknown as any).getEObject('id-test#2');
    expect(found).toEqual(a);

    found = (rs as unknown as any).getEObject('id-test#3');
    expect(found).toEqual(b);
  });

  it('should be used to resolve references', () => {
    expect(b.get('eSuperTypes').size()).toBe(1);
    expect(b.get('eSuperTypes').at(0)).toBe(a);
  });

  it('should serialize id', () => {
    let data = (r as unknown as any).to();

    expect(data._id).toBeDefined();
    expect(data._id).toBe('1');
    expect(data.eClassifiers.length).toBe(2);
    expect(data.eClassifiers[0]._id).toBe('2');
    expect(data.eClassifiers[1]._id).toBe('3');
  });
});
