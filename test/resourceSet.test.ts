import { it, describe, expect } from 'vitest';
import { Resource, ResourceSet } from '../src/resource';
import { EClass, EList, EPackage } from '../src/ecore';

describe('ResourceSet', () => {
  describe('#constructor', () => {
    it('should instantiate a ResourceSet correctly', () => {
      let resourceSet = ResourceSet.create()!;

      expect(resourceSet).toBeDefined();
      expect(resourceSet.eClass).toEqual(ResourceSet);
      expect(resourceSet.isTypeOf('ResourceSet')).toBeDefined();
      expect(resourceSet.isTypeOf(ResourceSet)).toBeDefined();
    });
  });

  describe('#create', () => {
    it('should return a new instance of Resource', () => {
      let resourceSet = ResourceSet.create()!;
      let resource = resourceSet.create('res1')!;

      expect(resource).toBeDefined();
      expect(resource.eClass).toEqual(Resource);

      let resource2 = resourceSet.create({ uri: 'res2' })!;
      expect(resource2).toBeDefined();
      expect(resource2.eClass).toEqual(Resource);
    });

    it('should return Resource if Resource already created', () => {
      let resourceSet = ResourceSet.create()!;
      let resource = resourceSet.create('res1')!;

      expect(resource).toBeDefined();
      expect(resource.eClass).toEqual(Resource);

      let resource2 = resourceSet.create({ uri: 'res1' });
      expect(resource2).toEqual(resource);
    });

    it('should add the resource to the list of resources', () => {
      let resourceSet = ResourceSet.create()!;
      expect(resourceSet.get<EList>('resources')!.size()).toEqual(0);

      let resource = resourceSet.create('res1')!;
      expect(resourceSet.get<EList>('resources')!.size()).toEqual(1);
      expect(resourceSet.get<EList>('resources')!.at(0)).toEqual(resource);
    });
  });

  describe('#elements', () => {
    it('should return all elements in the resourceSet if no parameter', () => {
      let resourceSet = ResourceSet.create()!;
      let r = resourceSet.create({ uri: 'test' })!;
      let P = EPackage.create({
        name: 'P',
        nsURI: 'test',
        nsPrefix: 'P',
      })!;
      let A = EClass.create({ name: 'A' })!;
      let B = EClass.create({ name: 'B' })!;
      B.get<EList>('eSuperTypes')!.add(A);
      P.get<EList>('eClassifiers')!.add(A).add(B);
      r.get<EList>('contents')!.add(P);
      let r2 = resourceSet.create({ uri: 'test-instance' })!;
      let a1 = A.create()!;
      let a2 = A.create()!;
      let b1 = B.create()!;
      r2.get<EList>('contents')!.add(a1).add(a2).add(b1);

      let elements = (resourceSet as unknown as any).elements();
      expect(elements).toBeDefined();
      expect(elements.length).toEqual(6);
    });

    it('should return all elements that are of type provided as parameter', () => {
      let resourceSet = ResourceSet.create()!;
      let r = resourceSet.create({ uri: 'test' })!;
      let P = EPackage.create({
        name: 'P',
        nsURI: 'test',
        nsPrefix: 'P',
      })!;
      let A = EClass.create({ name: 'A' })!;
      let B = EClass.create({ name: 'B' })!;
      B.get<EList>('eSuperTypes')!.add(A);
      P.get<EList>('eClassifiers')!.add(A).add(B);
      r.get<EList>('contents')!.add(P);
      let r2 = resourceSet.create({ uri: 'test-instance' })!;
      let a1 = A.create();
      let a2 = A.create();
      let b1 = B.create();
      r2.get<EList>('contents')!.add(a1).add(a2).add(b1);

      let elementsEClass = (resourceSet as unknown as any).elements('EClass');
      expect(elementsEClass).toBeDefined();
      expect(elementsEClass.length).toEqual(2);

      let elementsA = (resourceSet as unknown as any).elements('A');
      expect(elementsA).toBeDefined();
      expect(elementsA.length).toEqual(3);

      let elementsB = (resourceSet as unknown as any).elements('B');
      expect(elementsB).toBeDefined();
      expect(elementsB.length).toEqual(1);
    });
  });

  describe('#uriConverter', () => {
    it('should return unique URIConverter per resourceSet', () => {
      let resourceSet = ResourceSet.create()!;
      let c1 = (resourceSet as unknown as any).uriConverter();
      let c2 = (resourceSet as unknown as any).uriConverter();

      expect(c2).toEqual(c1);
    });

    it('should work on full uris', () => {
      let resourceSet = ResourceSet.create()!;
      let converter = (resourceSet as unknown as any).uriConverter();
      converter.map(
        'http://www.example.org/sample',
        'http://www.another.org/sample',
      );

      let normalized = converter.normalize('http://www.example.org/sample');
      expect(normalized).toEqual('http://www.another.org/sample');
    });

    it('should work on uri with fragment', () => {
      let resourceSet = ResourceSet.create()!;
      let converter = (resourceSet as unknown as any).uriConverter();
      converter.map(
        'http://www.example.org/sample',
        'http://www.another.org/sample',
      );

      let normalized = converter.normalize(
        'http://www.example.org/sample#frag?q=query',
      );
      expect(normalized).toEqual('http://www.another.org/sample');
    });

    it('should work on uri with fragment', () => {
      let resourceSet = ResourceSet.create()!;
      let converter = (resourceSet as unknown as any).uriConverter();
      let normalized = converter.normalize('http://www.example.org/sample');
      expect(normalized).toEqual('http://www.example.org/sample');
    });

    it('should work on uri starting with slash', () => {
      let resourceSet = ResourceSet.create()!;
      let converter = (resourceSet as unknown as any).uriConverter();
      let normalized = converter.normalize('/sample');

      expect(normalized).toEqual('/sample');

      converter.map('/models/', 'http://www.example.org/models/');
      normalized = converter.normalize('/models/sample');
      expect(normalized).toEqual('http://www.example.org/models/sample');
    });

    it('should work on uri with no slashes', () => {
      let resourceSet = ResourceSet.create()!;
      let converter = (resourceSet as unknown as any).uriConverter();
      let normalized = converter.normalize('sample');
      expect(normalized).toEqual('sample');
    });

    it('should work on uris with missing segments', () => {
      let resourceSet = ResourceSet.create()!;
      let converter = (resourceSet as unknown as any).uriConverter();
      converter.map('http://www.example.org/', 'http://www.another.org/');

      let normalized = converter.normalize('http://www.example.org/sample');
      expect(normalized).toEqual('http://www.another.org/sample');
    });
  });
});
