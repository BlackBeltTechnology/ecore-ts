import { it, describe, expect, beforeEach } from 'vitest';
import {
  create,
  EAnnotation,
  EAttribute,
  EClass,
  EClassifier,
  EInt,
  EList,
  EObject,
  EPackage,
  EReference,
  EString,
  EStringToStringMapEntry,
} from '../src/ecore.js';
import { ResourceSet } from '../src/resource';

describe('Model creation', () => {
  describe('EPackage creation', () => {
    let checkEPackage = (ePackage: typeof EPackage) => {
      expect(ePackage).toBeDefined();
      expect(ePackage.eClass).toEqual(EPackage);

      expect(ePackage.has('name')).toBeDefined();
      expect(ePackage.has('nsURI')).toBeDefined();
      expect(ePackage.has('nsPrefix')).toBeDefined();
      expect(ePackage.has('eClassifiers')).toBeDefined();
      expect(ePackage.has('eSubPackages')).toBeDefined();
    };

    it('should be done using create', () => {
      let MyPackage = create(EPackage);

      checkEPackage(MyPackage);

      MyPackage.set('name', 'myPackage');
      expect(MyPackage.get('name')).toEqual('myPackage');
    });

    it('should be done using create with parameters', () => {
      let MyPackage = create(EPackage, { name: 'myPackage' });

      checkEPackage(MyPackage);
      expect(MyPackage.get('name')).toEqual('myPackage');
    });

    it('should be done using EPackage.create', () => {
      let MyPackage = EPackage.create()!;

      checkEPackage(MyPackage);

      MyPackage.set('name', 'myPackage');
      expect(MyPackage.get('name')).toEqual('myPackage');
    });

    it('should be done using EPackage.create with parameters', () => {
      let MyPackage = EPackage.create({ name: 'myPackage' })!;

      checkEPackage(MyPackage);
      expect(MyPackage.get('name')).toEqual('myPackage');
    });
  });

  describe('EClass creation', () => {
    let checkEClass = (eClass: typeof EClass) => {
      expect(eClass).toBeDefined();
      expect(EClass).toEqual(eClass.eClass);

      expect(eClass.has('eStructuralFeatures')).toBeDefined();
      expect(eClass.has('eSuperTypes')).toBeDefined();
      expect(eClass.has('abstract')).toBeDefined();
      expect(eClass.has('interface')).toBeDefined();
      expect(eClass.has('name')).toBeDefined();
    };

    it('should be done using create', () => {
      let MyClass = create(EClass);

      checkEClass(MyClass);
      MyClass.set('name', 'MyClass');

      expect(MyClass.get('name')).toEqual('MyClass');
      expect(MyClass.get('abstract')).toEqual(false);
      expect(MyClass.get<EList>('eStructuralFeatures')!.size()).toEqual(0);

      MyClass.set('abstract', true);
      expect(MyClass.get('abstract')).toEqual(true);
    });

    it('should be done using EClass.create', () => {
      let MyClass = EClass.create()!;

      checkEClass(MyClass);
      MyClass.set('name', 'MyClass');

      expect(MyClass.get('name')).toEqual('MyClass');
      expect(MyClass.get('abstract')).toEqual(false);
      expect(MyClass.get<EList>('eStructuralFeatures')!.size()).toEqual(0);

      MyClass.set('abstract', true);
      expect(MyClass.get('abstract')).toEqual(true);
    });

    it('should be done using create with parameters', () => {
      let MyClass = create(EClass, {
        name: 'MyClass',
        abstract: false,
      });

      checkEClass(MyClass);
      expect(MyClass.get('name')).toEqual('MyClass');
      expect(MyClass.get('abstract')).toEqual(false);
      expect(MyClass.get<EList>('eStructuralFeatures')!.size()).toEqual(0);
    });

    it('should use eClass value from parameters', () => {
      let MyClass = create(EClassifier, {
        eClass: EClass,
        name: 'MyClass',
        abstract: false,
      });

      checkEClass(MyClass);
      expect(MyClass.get('name')).toEqual('MyClass');
      expect(MyClass.get('abstract')).toEqual(false);
      expect(MyClass.get<EList>('eStructuralFeatures')!.size()).toEqual(0);
    });

    it('should be done using EClass.create with parameters', () => {
      let MyClass = EClass.create({ name: 'MyClass', abstract: false })!;

      checkEClass(MyClass);
      expect(MyClass.get('name')).toEqual('MyClass');
      expect(MyClass.get('abstract')).toEqual(false);
      expect(MyClass.get<EList>('eStructuralFeatures')!.size()).toEqual(0);
    });

    it('should return correct eStructuralFeatures', () => {
      let MyClass = EClass.create()!;
      expect(MyClass.get<EList>('eAllStructuralFeatures')!.length).toEqual(0);

      let Name = EAttribute.create({
        name: 'name',
        eType: EString,
      });
      MyClass.get<EList>('eStructuralFeatures')!.add(Name);

      expect(MyClass.get<EList>('eAllStructuralFeatures')!.length).toEqual(1);
      expect(MyClass.get<EList>('eAllStructuralFeatures')!.at(0)).toEqual(Name);

      let SuperClass = EClass.create()!;
      MyClass.get<EList>('eSuperTypes')!.add(SuperClass);

      expect(MyClass.get<EList>('eAllStructuralFeatures')!.length).toEqual(1);

      let SuperAttr = EAttribute.create({
        name: 'value',
        eType: EString,
      });
      SuperClass.get<EList>('eStructuralFeatures')!.add(SuperAttr);

      expect(SuperClass.get<EList>('eAllStructuralFeatures')!.length).toEqual(
        1,
      );
      expect(MyClass.get<EList>('eAllStructuralFeatures')!.length).toEqual(2);

      let OtherAttr = EAttribute.create({
        name: 'other',
        eType: EString,
      });
      MyClass.get<EList>('eStructuralFeatures')!.add(OtherAttr);

      expect(SuperClass.get<EList>('eAllStructuralFeatures')!.length).toEqual(
        1,
      );
      expect(MyClass.get<EList>('eAllStructuralFeatures')!.length).toEqual(3);
    });
  });

  describe('EAttribute creation', () => {
    let checkEAttribute = (eAttribute: typeof EAttribute) => {
      expect(eAttribute).toBeDefined();
      expect(eAttribute.has('name')).toBeDefined();
      expect(eAttribute.has('lowerBound')).toBeDefined();
      expect(eAttribute.has('upperBound')).toBeDefined();
      expect(eAttribute.has('eType')).toBeDefined();
      expect(eAttribute.has('derived')).toBeDefined();
      expect(eAttribute.has('many')).toBeDefined();
    };

    it('should be done using create', () => {
      let MyAttr = create(EAttribute)!;
      checkEAttribute(MyAttr);

      MyAttr.set('name', 'foo');
      MyAttr.set('eType', EString);
      MyAttr.set('derived', true);

      expect(MyAttr.get('name')).toEqual('foo');
      expect(MyAttr.get('eType')).toEqual(EString);
      expect(MyAttr.get('derived')).toEqual(true);
      expect(MyAttr.get('lowerBound')).toEqual(0);
      expect(MyAttr.get('upperBound')).toEqual(1);
    });

    it('should be done using create with parameters', () => {
      let MyAttr = create(EAttribute, {
        name: 'foo',
        eType: EString,
        derived: true,
      });
      checkEAttribute(MyAttr);

      expect(MyAttr.get('name')).toEqual('foo');
      expect(MyAttr.get('eType')).toEqual(EString);
      expect(MyAttr.get('derived')).toEqual(true);
      expect(MyAttr.get('lowerBound')).toEqual(0);
      expect(MyAttr.get('upperBound')).toEqual(1);
    });
  });

  describe('EReference creation', () => {
    let checkEReference = (eReference: typeof EReference) => {
      expect(eReference).toBeDefined();
      expect(eReference.has('name')).toBeDefined();
      expect(eReference.has('eType')).toBeDefined();
      expect(eReference.has('lowerBound')).toBeDefined();
      expect(eReference.has('upperBound')).toBeDefined();
      expect(eReference.has('derived')).toBeDefined();
      expect(eReference.has('containment')).toBeDefined();
    };

    it('should be done using create', () => {
      let MyRef = create(EReference, {
        name: 'foo',
      });

      checkEReference(MyRef);

      expect(MyRef.get('name')).toEqual('foo');
      expect(MyRef.get('lowerBound')).toEqual(0);
      expect(MyRef.get('upperBound')).toEqual(1);
      //            expect(MyRef.get('derived')).toEqual(false);
      //            expect(MyRef.get('containment')).toEqual(false);
    });

    it('should be done using EReference.create', () => {
      let MyRef = EReference.create({
        name: 'foo',
      })!;

      checkEReference(MyRef);

      expect(MyRef.get('name')).toEqual('foo');
      expect(MyRef.get('lowerBound')).toEqual(0);
      expect(MyRef.get('upperBound')).toEqual(1);

      MyRef.set('derived', true);
      MyRef.set('containment', true);
      expect(MyRef.get('derived')).toEqual(true);
      expect(MyRef.get('containment')).toEqual(true);
    });
  });

  describe('EAnnotation creation', () => {
    let checkEAnnotation = (eAnnotation: typeof EAnnotation) => {
      expect(eAnnotation).toBeDefined();
      expect(eAnnotation.has('source')).toBeDefined();
      expect(eAnnotation.has('details')).toBeDefined();
    };

    it('should be done using create', () => {
      let MyAnn = create(EAnnotation, {
        source: 'foo',
        details: [
          {
            key: 'kk',
            value: 'val',
          },
        ],
      });
      checkEAnnotation(MyAnn);

      expect(MyAnn.get('source')).toEqual('foo');
      expect(MyAnn.get<EList>('details')!.size()).toEqual(1);
      expect(MyAnn.get<EList>('details')!.at<EObject>(0).get('key')).toEqual(
        'kk',
      );
      expect(MyAnn.get<EList>('details')!.at<EObject>(0).get('value')).toEqual(
        'val',
      );
    });

    it('should create details entry with EStringToStringMapEntry.create', () => {
      let d = EStringToStringMapEntry.create({ key: 'k', value: 'v' })!;

      expect(d).toBeDefined();
      expect(d.eClass).toEqual(EStringToStringMapEntry);
      expect(d.has('key')).toBeDefined();
      expect(d.has('value')).toBeDefined();

      expect(d.get('key')).toEqual('k');
      expect(d.get('value')).toEqual('v');
    });
  });

  it('should be done using a json like syntax', () => {
    let p = EPackage.create({
      name: 'p',
      nsPrefix: 'p',
      nsURI: 'http://test/p',
      eClassifiers: [
        {
          eClass: EClass,
          name: 'A',
          eAnnotations: [
            {
              source: 'test',
              details: [
                {
                  key: 'k',
                  value: 'v',
                },
              ],
            },
          ],
          eStructuralFeatures: [
            {
              eClass: EAttribute,
              name: 'aa',
              eType: EString,
            },
            {
              eClass: EReference,
              name: 'bb',
              // eType: '//A'
              eType: () => {
                return p.get<EList>('eClassifiers')!.at(0);
              },
            },
          ],
        },
      ],
    })!;

    expect(p).toBeDefined();

    expect(p.get('name')).toEqual('p');
    expect(p.get<EList>('eClassifiers')!.size()).toEqual(1);

    let A = p.get<EList>('eClassifiers')!.at<EObject>(0);
    expect(A.eClass).toEqual(EClass);
    expect(A.get('name')).toEqual('A');
    expect(A.get<EList>('eAnnotations')!.size()).toEqual(1);

    let Aann = A.get<EList>('eAnnotations')!.at<EObject>(0);
    expect(Aann.get('source')).toEqual('test');
    expect(Aann.get<EList>('details')!.size()).toEqual(1);
    let d = Aann.get<EList>('details')!.at<EObject>(0);
    expect(d.eClass).toEqual(EStringToStringMapEntry);
    expect(d.get('key')).toEqual('k');
    expect(d.get('value')).toEqual('v');

    expect(A.get<EList>('eStructuralFeatures')!.size()).toEqual(2);

    let aa = A.get<EList>('eStructuralFeatures')!.at<EObject>(0);
    expect(aa.eClass).toEqual(EAttribute);
    expect(aa.get('name')).toEqual('aa');
    expect(aa.get('eType')).toEqual(EString);

    let bb = A.get<EList>('eStructuralFeatures')!.at<EObject>(1);
    expect(bb.eClass).toEqual(EReference);
    expect(bb.get('name')).toEqual('bb');
    expect(bb.get('eType')).toEqual(A);
  });
});

let createModel = () => {
  let resourceSet = ResourceSet.create()!;
  let m1 = resourceSet.create({ uri: 'model1' })!;
  let p1 = EPackage.create({
    name: 'p1',
    nsPrefix: 'model1',
    nsURI: 'model1',
  })!;
  let Foo = EClass.create({ name: 'Foo' })!;
  let Bar = EClass.create({ name: 'Bar' })!;
  let BarBar = EClass.create({ name: 'BarBar' })!;
  let FooAnnotation = EAnnotation.create({ source: 'foo' })!;

  Foo.get<EList>('eStructuralFeatures')!
    .add(
      EReference.create({
        name: 'child',
        upperBound: -1,
        eType: Foo,
        containment: true,
      }),
    )
    .add(
      EAttribute.create({
        name: 'label',
        upperBound: 1,
        eType: EString,
      }),
    )
    .add(
      EAttribute.create({
        name: 'numbers',
        upperBound: -1,
        eType: EInt,
      }),
    );

  Foo.get<EList>('eAnnotations')!.add(FooAnnotation);
  Bar.get<EList>('eSuperTypes')!.add(Foo);
  BarBar.get<EList>('eSuperTypes')!.add(Bar);

  p1.get<EList>('eClassifiers')!.add(Foo);
  p1.get<EList>('eClassifiers')!.add(Bar);
  p1.get<EList>('eClassifiers')!.add(BarBar);
  m1.get<EList>('contents')!.add(p1);

  return m1;
};

describe('Instance creation', () => {
  let model = createModel()!;
  let p1 = model.get<EList>('contents')!.at<EObject>(0);
  let Foo = p1.get<EList>('eClassifiers')!.at<EObject>(0);
  let Bar = p1.get<EList>('eClassifiers')!.at<EObject>(1);
  let BarBar = p1.get<EList>('eClassifiers')!.at<EObject>(2);

  describe('creation of an EClass', () => {
    it('should return correct subtypes', () => {
      // allSubTypes makes use of EPackage.Registry to lookup
      // EClasses
      EPackage.Registry.register(p1);

      let FooSubs = Foo.get<EList>('eAllSubTypes')!;
      expect(FooSubs.length).toEqual(2);
      expect(FooSubs.includes(Bar)).toBe(true);
      expect(FooSubs.includes(BarBar)).toBe(true);
    });

    it('should have correct annotations', () => {
      expect(Foo.get<EList>('eAnnotations')!.size()).toEqual(1);

      let ann = Foo.get<EList>('eAnnotations')!.at<EObject>(0);
      expect(ann.get('source')).toEqual('foo');
    });

    it('should create instances with correct values passed in create', () => {
      let f = Foo.create({ label: 'f', numbers: [1, 2, 3] })!;

      expect(f).toBeDefined();
      expect(f.eClass).toEqual(Foo);
      expect(f.get('label')).toEqual('f');
      expect(f.get('numbers')).toEqual([1, 2, 3]);
    });
  });

  describe('creation of an EObject', () => {
    let User: EObject;

    beforeEach(() => {
      User = EClass.create({ name: 'User' })!;
      let User_name = EAttribute.create({
        name: 'name',
        eType: EString,
      });
      let User_friends = EReference.create({
        name: 'friends',
        eType: User,
      });
      User.get<EList>('eStructuralFeatures')!.add(User_name);
      User.get<EList>('eStructuralFeatures')!.add(User_friends);
    });

    it('should be an instanceof User', () => {
      let u1 = create(User);

      expect(u1).toBeDefined();
      expect(User).toEqual(u1.eClass);
      expect(u1.isTypeOf('User')).toBeDefined();
    });

    it('should have 2 structural features, name & friends', () => {
      let u1 = create(User);
      expect(u1.has('name')).toBeDefined();
      expect(u1.has('friends')).toBeDefined();
    });

    it('should set feature using feature name', () => {
      let u1 = create(User);
      u1.set('name', 'Paul');

      expect(u1.get('name')).toEqual('Paul');
    });

    it('should set feature using feature object', () => {
      let u1 = create(User);
      let feature = User.getEStructuralFeature('name');

      expect(feature).toBeDefined();

      u1.set(feature, 'Paul');

      expect(u1.get('name')).toEqual('Paul');
    });

    it('should set feature using hash parameters', () => {
      let u1 = create(User);

      u1.set({ name: 'Paul' });

      expect(u1.get('name')).toEqual('Paul');
    });
  });
});
