import { it, describe, expect } from 'vitest';
import {
  EAttribute,
  EClass,
  EcorePackage,
  EObject,
  EString,
} from '../src/ecore';
import { ResourceSet } from '../src/resource';

describe('Events', () => {
  it('should be available in all EObject instances', () => {
    expect(EcorePackage.on).toBeDefined();
    expect(EClass.on).toBeDefined();
    expect(EObject.prototype.on).toBeDefined();
    expect(EObject.prototype.off).toBeDefined();
    expect(EObject.prototype.trigger).toBeDefined();
  });

  describe('#on', () => {
    it('should be triggerd', () => {
      let Test = EClass.create({ name: 'Test' })!;
      Test.on('eve', () => {
        Test.set('name', 'Tested');
      });
      Test.trigger('eve');

      expect(Test.get('name')).toBe('Tested');
    });

    it('should bind and trigger multiple events', () => {
      let Test = EAttribute.create({ name: 'Test', upperBound: 0 })!;
      Test.on('a b c', () => {
        Test.set({ upperBound: Test.get('upperBound') + 1 });
      });

      expect(Test.get('upperBound')).toBe(0);

      Test.trigger('a');
      expect(Test.get('upperBound')).toBe(1);

      Test.trigger('a b');
      expect(Test.get('upperBound')).toBe(3);

      Test.trigger('c');
      expect(Test.get('upperBound')).toBe(4);

      (Test as unknown as any).off('a c');

      Test.trigger('a b c');
      expect(Test.get('upperBound')).toBe(5);
    });
  });

  describe('#set', () => {
    it('should trigger a change event after setting a property', () => {
      let Test = EClass.create({ name: 'Test' })!;
      Test.on('change', (changed: any) => {
        expect(changed).toBe('name');
        expect(Test.get(changed)).toBe('TestTest');
      });
      Test.on('change:name', (changed: any) => {
        expect(changed).toBe('name');
        expect(Test.get(changed)).toBe('TestTest');
      });
      Test.set('name', 'TestTest');
    });
  });

  describe('#EList.add', () => {
    it('should trigger an add event', () => {
      let Test = EClass.create({ name: 'Test' })!;
      let Name = EAttribute.create({
        name: 'name',
        eType: EString,
      })!;
      Test.on('add:eStructuralFeatures', (added: any) => {
        expect(added).toEqual(Name);
      });
      Test.get('eStructuralFeatures').add(Name);
    });
  });

  describe('#ResourceSet.create', () => {
    it('should trigger an add event', () => {
      let resourceSet = ResourceSet!.create()!;

      resourceSet.on('add', (resource: any) => {
        expect(resource).toBeDefined();
        expect(resourceSet.get('resources').size()).toBe(1);
        expect(resourceSet.get('resources').at(0).get('uri')).toBe(
          'sample.ecore',
        );
      });

      resourceSet.create({ uri: 'sample.ecore' });
    });
  });
});
