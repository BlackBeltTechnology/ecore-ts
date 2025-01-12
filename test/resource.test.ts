import fs from 'node:fs';
import { it, describe, expect } from 'vitest';
import { Resource, ResourceSet } from '../src/resource';
import {
  EClass,
  EPackage,
  EReference,
  EString,
  create,
  EAttribute,
} from '../src/ecore';

describe('Resource', () => {
  describe('buildIndex', () => {
    it('should build correct index for EModelElements', () => {
      let m = Resource.create({ uri: 'http://www.example.org/example' })!;
      let p = EPackage.create({ name: 'p' })!;
      let c1 = EClass.create({ name: 'C1' })!;
      let c1_label = EClass.create({
        name: 'label',
        eType: EString,
      });
      p.get('eClassifiers').add(c1);
      c1.get('eStructuralFeatures').add(c1_label);
      (m as unknown as any).add(p);

      expect((m as unknown as any).getEObject('/')).toEqual(p);
      expect((m as unknown as any).getEObject('//C1')).toEqual(c1);
      expect((m as unknown as any).getEObject('//C1/label')).toEqual(c1_label);
    });

    it('should build correct index for EModelElements with multiple roots', () => {
      let resourceSet = ResourceSet!.create()!;
      let r = resourceSet.create({ uri: 'test' })!;
      let p1 = EPackage.create({
        name: 'p1',
        nsPrefix: 'p1',
        nsURI: 'test/p1',
      })!;
      let c1 = EClass.create({ name: 'C1' })!;
      let c1_label = EClass.create({
        name: 'label',
        eType: EString,
      })!;
      c1.get('eStructuralFeatures').add(c1_label);
      p1.get('eClassifiers').add(c1);
      let p2 = EPackage.create({
        name: 'p2',
        nsPrefix: 'p2',
        nsURI: 'test/p2',
      })!;
      let c2 = EClass.create({ name: 'C2' })!;
      p2.get('eClassifiers').add(c2);
      r.get('contents').add(p1).add(p2);

      expect((r as unknown as any).getEObject('/0')).toEqual(p1);
      expect((r as unknown as any).getEObject('/1')).toEqual(p2);
      expect((r as unknown as any).getEObject('/0/C1')).toEqual(c1);
      expect((r as unknown as any).getEObject('/0/C1/label')).toEqual(c1_label);
      expect((r as unknown as any).getEObject('/1/C2')).toEqual(c2);
    });

    describe('index for instance models', () => {
      let testModel = Resource.create({ uri: 'test.json' })!;
      let testPackage = EPackage.create({
        name: 'test',
        nsURI: 'http://www.example.org/test',
        nsPrefix: 'test',
      })!;
      (testModel as unknown as any).add(testPackage);
      let Container = EClass.create({ name: 'Container' })!;
      testPackage.get('eClassifiers').add(Container);
      let Container_child = EReference.create({
        name: 'child',
        upperBound: -1,
        containment: true,
      })!;

      Container.get('eStructuralFeatures').add(Container_child);
      let Child = EClass.create({ name: 'Child' })!;
      testPackage.get('eClassifiers').add(Child);
      let Child_manyRefs = EReference.create({
        name: 'manyRefs',
        upperBound: -1,
      });
      Child.get('eStructuralFeatures').add(Child_manyRefs);

      it('should be correct', () => {
        let m = Resource.create({ uri: 'instance.json' });
        let contain = create(Container);
        let c1 = create(Child);
        let c2 = create(Child);
        contain.get('child').add(c1);
        contain.get('child').add(c2);
        (m as unknown as any).add(contain);

        expect(contain).toBeDefined();
        expect(2).toBe(contain.get('child').size());

        expect(contain).toEqual((m as unknown as any).getEObject('/'));
        expect(c1).toEqual((m as unknown as any).getEObject('//@child.0'));
        expect(c2).toEqual((m as unknown as any).getEObject('//@child.1'));
      });

      it('should be correct if multiple roots', () => {
        let m = Resource.create({ uri: 'instance.json' });
        let c1 = create(Child);
        let c2 = create(Child);
        (m as unknown as any).add(c1).add(c2);

        expect(2).toBe((m as unknown as any).get('contents').size());
        expect(c1).toEqual((m as unknown as any).getEObject('/0'));
        expect(c2).toEqual((m as unknown as any).getEObject('/1'));
      });
    });
  });

  describe('Registry', () => {
    it('should contain ecore model', () => {
      expect(EPackage.Registry).toBeDefined();
      expect(EPackage.Registry._ePackages).toBeDefined();

      expect(
        EPackage.Registry._ePackages['http://www.eclipse.org/emf/2002/Ecore'],
      ).toBeDefined();
    });
  });

  describe('#load', () => {
    it('should read model made of single object', () => {
      let model = {
        eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EPackage',
        name: 'foo',
      };

      (Resource.create({ uri: 'simple.json' })! as unknown as any).load(
        model,
        (result: any, err: any) => {
          expect(result).toBeDefined();
          expect(err).toBe(null);

          expect(1).toBe(result.get('contents').size());

          let root = result.get('contents').at(0);
          expect(root).toBeDefined();
          expect('EPackage').toBe(root.eClass.get('name'));
          expect('foo').toBe(root.get('name'));
        },
      );
    });

    it('should read model made of array of objects', () => {
      let model = [
        {
          eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EPackage',
          name: 'foo',
        },
        {
          eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EPackage',
          name: 'bar',
        },
        {
          eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EPackage',
          name: 'acme',
        },
      ];

      (Resource.create({ uri: 'simple.json' })! as unknown as any).load(
        model,
        (result: any, err: any) => {
          expect(result).toBeDefined();
          expect(err).toBe(null);
          expect(3).toBe(result.get('contents').size());

          let r1 = result.get('contents').at(0);
          expect(r1).toBeDefined();
          expect('EPackage').toBe(r1.eClass.get('name'));
          expect('foo').toBe(r1.get('name'));

          let r2 = result.get('contents').at(1);
          expect(r2).toBeDefined();
          expect('EPackage').toBe(r2.eClass.get('name'));
          expect('bar').toBe(r2.get('name'));

          let r3 = result.get('contents').at(2);
          expect(r3).toBeDefined();
          expect('EPackage').toBe(r3.eClass.get('name'));
          expect('acme').toBe(r3.get('name'));
        },
      );
    });

    it('should write model made of more than one root element into an array', () => {
      let model = [
        {
          eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EPackage',
          name: 'foo',
        },
        {
          eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EPackage',
          name: 'bar',
        },
        {
          eClass: 'http://www.eclipse.org/emf/2002/Ecore#//EPackage',
          name: 'acme',
        },
      ];

      let rs = ResourceSet!.create()!;
      (rs.create({ uri: 'simple.json' })! as unknown as any).load(
        model,
        (resource: any, err: any) => {
          expect(err).toBe(null);
          expect(3).toBe(resource.get('contents').size());
          let json = resource.to();
          expect(json).toBeDefined();
          expect(Array.isArray(json)).toBe(true);
          expect(3).toBe(json.length);
        },
      );
    });
  });

  describe('load model from filesystem', () => {
    it('should build the model', () => {
      let model = Resource.create({ uri: 'simple.json' });

      fs.readFile(
        './test/models/simple.json',
        'utf8',
        (err: any, data: any) => {
          if (err) {
            return console.log(err);
          }

          (model as unknown as any).load(data, (model: any, _: any) => {
            let contents = model.get('contents').array();
            expect(contents).toBeDefined();
            expect(contents.length).toBe(1);

            let root = contents[0];
            expect(root.eClass).toEqual(EPackage);
            expect(root.get('name')).toEqual('example');
            expect(root.get('nsPrefix')).toEqual('example');
            expect(root.get('nsURI')).toEqual('http://www.example.org/example');

            expect(root.get('eClassifiers').size()).toBe(2);

            let eClassA = root.get('eClassifiers').at(0);
            expect(eClassA).toBeDefined();
            expect(eClassA.eClass).toEqual(EClass);
            expect(eClassA.get('name')).toEqual('A');

            expect(eClassA.get('eStructuralFeatures').size()).toBe(1);

            let eClassA_name = eClassA.get('eStructuralFeatures').at(0);
            expect(eClassA_name).toBeDefined();
            expect(eClassA_name.eClass).toEqual(EAttribute);
            expect(eClassA_name.get('name')).toEqual('name');
            expect(eClassA_name.get('eType')).toEqual(EString);

            let eClassB = root.get('eClassifiers').at(1);
            expect(eClassB).toBeDefined();
            expect(eClassB.eClass).toEqual(EClass);
            expect(eClassB.get('name')).toEqual('B');

            expect(eClassB.get('eSuperTypes').size()).toBe(1);
            expect(eClassB.get('eSuperTypes').at(0)).toEqual(eClassA);
          });
        },
      );
    });
  }); // end load

  describe('toJSON', () => {
    it('should produce a valid JSON', () => {
      let model = Resource.create({ uri: 'simple.json' });

      fs.readFile(
        './test/models/simple.json',
        'utf8',
        (err: any, data: any) => {
          if (err) {
            return console.log(err);
          }

          (model as unknown as any).load(data, (model: any, _: any) => {
            let json = model.to(JSON);

            expect(json).toBeDefined();
            expect(json.eClass).toEqual(
              'http://www.eclipse.org/emf/2002/Ecore#//EPackage',
            );
            expect(json.name).toEqual('example');
            expect(json.nsURI).toEqual('http://www.example.org/example');
            expect(json.nsPrefix).toEqual('example');

            expect(json.eClassifiers.length).toBe(2);

            let first = json.eClassifiers[0];
            expect(first.eClass).toEqual(
              'http://www.eclipse.org/emf/2002/Ecore#//EClass',
            );
            expect(first.name).toBe('A');
            expect(first.eStructuralFeatures.length).toBe(1);

            let first_features = first.eStructuralFeatures[0];
            expect(first_features.eClass).toEqual(
              'http://www.eclipse.org/emf/2002/Ecore#//EAttribute',
            );
            expect(first_features.name).toBe('name');
            expect(first_features.eType.$ref).toEqual(
              'http://www.eclipse.org/emf/2002/Ecore#//EString',
            );
            expect(first_features.eType.eClass).toEqual(
              'http://www.eclipse.org/emf/2002/Ecore#//EDataType',
            );

            let second = json.eClassifiers[1];
            expect(second.eClass).toEqual(
              'http://www.eclipse.org/emf/2002/Ecore#//EClass',
            );
            expect(second.name).toBe('B');
            expect(second.eSuperTypes.length).toBe(1);
            expect(second.eSuperTypes[0].$ref).toBe('//A');
            expect(second.eSuperTypes[0].eClass).toEqual(
              'http://www.eclipse.org/emf/2002/Ecore#//EClass',
            );
            expect(second.eStructuralFeatures).toBe(undefined);
          });
        },
      );
    });
  }); // end toJSON
});
