import { it, describe, expect } from 'vitest';
import { ResourceSet } from '../src/resource';
import { Edit } from '../src/edit';
import {
  EAnnotation,
  EClass,
  EDataType,
  EEnum,
  EPackage,
  EReference,
} from '../src/ecore';

let createResource = (name: any) => {
  let resourceSet = ResourceSet!.create()!;
  return resourceSet.create(name);
};

describe('Edit', () => {
  describe('#childTypes', () => {
    expect(Edit.childTypes).toBeDefined();
    expect(typeof Edit.childTypes).toBe('function');

    it('should return the types EClass, EDataType EEnum, EPackage and EAnnotation from a EPackage object', () => {
      let resource = createResource('model.json')!;
      let p = EPackage.create({ name: 'p' })!;
      resource.get('contents').add(p);

      let types = Edit.childTypes(p);

      expect(types).toBeDefined();
      expect(types.length).toBe(5);

      let names = types.map((e: any) => {
        return e.get('name');
      });

      expect(names.includes(null)).toBe(false);
      expect(names.includes('EClass')).toBe(true);
      expect(names.includes('EDataType')).toBe(true);
      expect(names.includes('EAnnotation')).toBe(true);
      expect(names.includes('EPackage')).toBe(true);
      expect(names.includes('EEnum')).toBe(true);
    });

    it('should return the correct child types from a EClass object', () => {
      let resource = createResource('model.json')!;
      let c = EClass.create({ name: 'c' })!;
      resource.get('contents').add(c);

      let types = Edit.childTypes(c);

      expect(types).toBeDefined();
      expect(types.length).toBe(6);

      let names = types.map((e: any) => {
        return e.get('name');
      });

      expect(names.includes(null)).toBe(false);
      expect(names.includes('EAnnotation')).toBe(true);
      expect(names.includes('EAttribute')).toBe(true);
      expect(names.includes('EReference')).toBe(true);
      expect(names.includes('EOperation')).toBe(true);
      expect(names.includes('ETypeParameter')).toBe(true);
      expect(names.includes('EGenericType')).toBe(true);
    });
  });

  describe('#childDescriptors', () => {
    expect(Edit.childDescriptors).toBeDefined();
    expect(typeof Edit.childDescriptors).toBe('function');

    it('should return descriptors for each child types of a EPackage object', () => {
      let resource = createResource('model.json')!;
      let p = EPackage.create({ name: 'p' })!;
      resource.get('contents').add(p);

      let descriptors = Edit.childDescriptors(p);

      expect(descriptors).toBeDefined();
      expect(descriptors.length).toBe(5);

      let descriptor = descriptors.find((e) => {
        return e.type === EClass;
      });

      expect(descriptor).toBeDefined();
      expect(descriptor.label).toEqual('New EClass');
      expect(descriptor.owner).toEqual(p);
      expect(descriptor.feature).toEqual(p.get('eClassifiers')._feature);
      expect(descriptor.type).toEqual(EClass);

      descriptor = descriptors.find((e: any) => {
        return e.type === EDataType;
      });

      expect(descriptor).toBeDefined();
      expect(descriptor.label).toEqual('New EDataType');
      expect(descriptor.owner).toEqual(p);
      expect(descriptor.feature).toEqual(p.get('eClassifiers')._feature);
      expect(descriptor.type).toEqual(EDataType);

      descriptor = descriptors.find((e: any) => {
        return e.type === EEnum;
      });

      expect(descriptor).toBeDefined();
      expect(descriptor.label).toEqual('New EEnum');
      expect(descriptor.owner).toEqual(p);
      expect(descriptor.feature).toEqual(p.get('eClassifiers')._feature);
      expect(descriptor.type).toEqual(EEnum);

      descriptor = descriptors.find((e: any) => {
        return e.type === EAnnotation;
      });

      expect(descriptor).toBeDefined();
      expect(descriptor.label).toEqual('New EAnnotation');
      expect(descriptor.owner).toEqual(p);
      expect(descriptor.feature).toEqual(p.get('eAnnotations')._feature);
      expect(descriptor.type).toEqual(EAnnotation);

      descriptor = descriptors.find((e: any) => {
        return e.type === EPackage;
      });

      expect(descriptor).toBeDefined();
      expect(descriptor.label).toEqual('New EPackage');
      expect(descriptor.owner).toEqual(p);
      expect(descriptor.feature).toEqual(p.get('eSubPackages')._feature);
      expect(descriptor.type).toEqual(EPackage);
    });
  });

  describe('#siblingTypes', () => {
    expect(Edit.siblingTypes).toBeDefined();
    expect(typeof Edit.siblingTypes).toBe('function');

    it('should return the type EClass EDataType EAnnotation EPackage and EEnum from a EClass object', () => {
      let resource = createResource('model.json')!;
      let p = EPackage.create({ name: 'p' })!;
      let c = EClass.create({ name: 'c' })!;
      p.get('eClassifiers').add(c);
      resource.get('contents').add(p);

      let types = Edit.siblingTypes(c);

      expect(types).toBeDefined();
      expect(types.length).toBe(5);

      let names = types.map((e: any) => {
        return e.get('name');
      });

      expect(names.includes(null)).toBe(false);
      expect(names.includes('EClass')).toBeDefined();
      expect(names.includes('EDataType')).toBe(true);
      expect(names.includes('EAnnotation')).toBe(true);
      expect(names.includes('EPackage')).toBe(true);
      expect(names.includes('EEnum')).toBe(true);
    });
  });

  describe('#siblingDescriptors', () => {
    expect(Edit.siblingDescriptors).toBeDefined();
    expect(typeof Edit.siblingDescriptors).toBe('function');

    it('should return descriptors for each sibling types of a EClass object', () => {
      let resource = createResource('model.json')!;
      let p = EPackage.create({ name: 'p' })!;
      let c = EClass.create({ name: 'c' })!;
      p.get('eClassifiers').add(c);
      resource.get('contents').add(p);

      let descriptors = Edit.siblingDescriptors(c);

      expect(descriptors).toBeDefined();
      expect(descriptors.length).toBe(5);

      let descriptor = descriptors.find((e) => {
        return e.type === EClass;
      });

      expect(descriptor).toBeDefined();
      expect(descriptor.label).toEqual('New EClass');
      expect(descriptor.owner).toEqual(p);
      expect(descriptor.feature).toEqual(p.get('eClassifiers')._feature);
      expect(descriptor.type).toEqual(EClass);

      descriptor = descriptors.find((e: any) => {
        return e.type === EDataType;
      });

      expect(descriptor).toBeDefined();
      expect(descriptor.label).toEqual('New EDataType');
      expect(descriptor.owner).toEqual(p);
      expect(descriptor.feature).toEqual(p.get('eClassifiers')._feature);
      expect(descriptor.type).toEqual(EDataType);

      descriptor = descriptors.find((e: any) => {
        return e.type === EEnum;
      });

      expect(descriptor).toBeDefined();
      expect(descriptor.label).toEqual('New EEnum');
      expect(descriptor.owner).toEqual(p);
      expect(descriptor.feature).toEqual(p.get('eClassifiers')._feature);
      expect(descriptor.type).toEqual(EEnum);

      descriptor = descriptors.find((e: any) => {
        return e.type === EAnnotation;
      });

      expect(descriptor).toBeDefined();
      expect(descriptor.label).toEqual('New EAnnotation');
      expect(descriptor.owner).toEqual(p);
      expect(descriptor.feature).toEqual(p.get('eAnnotations')._feature);
      expect(descriptor.type).toEqual(EAnnotation);

      descriptor = descriptors.find((e: any) => {
        return e.type === EPackage;
      });

      expect(descriptor).toBeDefined();
      expect(descriptor.label).toEqual('New EPackage');
      expect(descriptor.owner).toEqual(p);
      expect(descriptor.feature).toEqual(p.get('eSubPackages')._feature);
      expect(descriptor.type).toEqual(EPackage);
    });
  });

  describe('#choiceOfValues', () => {
    expect(Edit.choiceOfValues).toBeDefined();
    expect(typeof Edit.choiceOfValues).toBe('function');

    it('should return a correct list of choices', () => {
      let resource = createResource('model.json')!;
      let p = EPackage.create({ name: 'p' })!;
      let c1 = EClass.create({ name: 'c1' })!;
      let c2 = EClass.create({ name: 'c2' })!;

      let r1 = EReference.create({ name: 'r1' })!;
      c1.get('eStructuralFeatures').add(r1);

      p.get('eClassifiers').add(c1).add(c2);

      resource.get('contents').add(p);

      let choices = Edit.choiceOfValues(
        c1,
        c1.eClass.getEStructuralFeature('eSuperTypes'),
      );

      expect(choices.length).toEqual(2);
      expect(choices.includes(c1)).toBeDefined();
      expect(choices.includes(c2)).toBeDefined();

      choices = Edit.choiceOfValues(
        r1,
        r1.eClass.getEStructuralFeature('eType'),
      );
      expect(choices.length).toEqual(2);
      expect(choices.includes(c1)).toBeDefined();
      expect(choices.includes(c2)).toBeDefined();
    });
  });
});
