import { it, describe, expect } from 'vitest';
import {
  EAnnotation,
  EAttribute,
  EBoolean,
  EClass,
  EClassifier,
  EcorePackage,
  EDataType,
  EGenericType,
  EList,
  EModelElement,
  ENamedElement,
  EObject,
  EOperation,
  EPackage,
  EParameter,
  EReference,
  EString,
  EStringToStringMapEntry,
  EStructuralFeature,
  ETypedElement,
  ETypeParameter,
} from '../src/ecore';

describe('Ecore', () => {
  describe('#EcorePackage', () => {
    it('should exist', () => {
      expect(EcorePackage).toBeDefined();
      expect(EcorePackage.eClass).toEqual(EPackage);
    });

    it('should contain EPackage attributes', () => {
      let nsURI = EPackage.getEStructuralFeature('nsURI');
      expect(EAttribute).toEqual(nsURI.eClass);
    });
  });

  describe('#EModelElement', () => {
    it('should be abstract', () => {
      expect(EModelElement).toBeDefined();
      expect(EModelElement.get('abstract')).toBe(true);
    });

    it('should have eAnnotations feature', () => {
      expect(EModelElement.get<EList>('eStructuralFeatures')!.size()).toBe(1);

      let eAnnotations = EModelElement.get<EList>(
        'eStructuralFeatures',
      )!.at<EObject>(0);
      expect(eAnnotations.get<string>('name')).toBe('eAnnotations');
      expect(eAnnotations.eClass).toBe(EReference);
      expect(eAnnotations.get('lowerBound')).toBe(0);
      expect(eAnnotations.get('upperBound')).toBe(-1);
      expect(eAnnotations.get('containment')).toBe(true);
    });
  });

  describe('#EAnnotation', () => {
    it('should exist', () => {
      expect(EAnnotation).toBeDefined();
      expect(EAnnotation.get('abstract')).toBe(false);
    });

    it('should have source and details attributes', () => {
      let features = EAnnotation.get<EList>('eStructuralFeatures')!;
      expect(features.size()).toBe(2);

      let source = features.at<EObject>(0);
      expect(source.get('name')).toBe('source');
      expect(source.get('lowerBound')).toBe(0);
      expect(source.get('upperBound')).toBe(1);
      expect(EAttribute).toEqual(source.eClass);
      expect(source.get('eType')).toBe(EString);

      let details = features.at<EObject>(1);
      expect(details.get('name')).toBe('details');
      expect(details.get('lowerBound')).toBe(0);
      expect(details.get('upperBound')).toBe(-1);
      expect(EReference).toEqual(details.eClass);
      expect(EStringToStringMapEntry).toEqual(details.get('eType'));

      expect(details.eClass.getEStructuralFeature).toBeDefined();
    });
  });

  describe('#ENamedElement', () => {
    it('should be abstract', () => {
      expect(ENamedElement).toBeDefined();
      expect(true).toEqual(ENamedElement.get('abstract'));
    });

    it('should contain ENamedElement attributes', () => {
      // name
      let name = ENamedElement.getEStructuralFeature('name');

      expect(name).toBeDefined();
      expect(name.eClass).toEqual(EAttribute);
    });
  });

  describe('#ETypedElement', () => {
    it('should contain ETypedElement', () => {
      expect(ETypedElement).toBeDefined();
      expect(ETypedElement.eClass).toEqual(EClass);
    });

    it('should contain ETypedElement attributes', () => {
      // ordered
      let ordered = ETypedElement.getEStructuralFeature('ordered');
      expect(ordered).toBeDefined();
      expect(ordered.eClass).toEqual(EAttribute);

      // unique
      let unique = ETypedElement.getEStructuralFeature('unique');
      expect(unique).toBeDefined();
      expect(unique.eClass).toEqual(EAttribute);

      // lowerBound
      let lowerBound = ETypedElement.getEStructuralFeature('lowerBound');
      expect(lowerBound).toBeDefined();
      expect(lowerBound.eClass).toEqual(EAttribute);

      // upperBound
      let upperBound = ETypedElement.getEStructuralFeature('upperBound');
      expect(upperBound).toBeDefined();
      expect(upperBound.eClass).toEqual(EAttribute);

      // many
      let many = ETypedElement.getEStructuralFeature('many');
      expect(many).toBeDefined();
      expect(many.eClass).toEqual(EAttribute);

      // required
      let required = ETypedElement.getEStructuralFeature('required');
      expect(required).toBeDefined();
      expect(required.eClass).toEqual(EAttribute);
    });

    it('should contain ETypedElement references', () => {
      let eType = ETypedElement.getEStructuralFeature('eType');

      // eType
      expect(eType).toBeDefined();
      expect(0).toBe(eType.get('lowerBound'));
      expect(1).toBe(eType.get('upperBound'));
      expect(eType.eClass).toEqual(EReference);
      expect(eType.get('eType')).toEqual(EClassifier);
    });
  });

  describe('#EPackage', () => {
    it('should contain EPackage', () => {
      expect(EPackage).toBeDefined();
      expect(EPackage.eClass).toEqual(EClass);
    });

    it('should contain EPackage attributes', () => {
      let nsURI = EPackage.getEStructuralFeature('nsURI');
      expect(nsURI).toBeDefined();
      expect(nsURI.eClass).toEqual(EAttribute);

      let nsPrefix = EPackage.getEStructuralFeature('nsPrefix');
      expect(nsPrefix).toBeDefined();
      expect(nsPrefix.eClass).toEqual(EAttribute);
    });

    it('should contain EPackage references', () => {
      let eClassifiers = EPackage.getEStructuralFeature('eClassifiers');
      expect(eClassifiers).toBeDefined();
      expect(0).toBe(eClassifiers.get('lowerBound'));
      expect(-1).toBe(eClassifiers.get('upperBound'));
      expect(true).toBe(eClassifiers.get('containment'));
      expect(eClassifiers.get('eType')).toEqual(EClassifier);

      let eSubPackages = EPackage.getEStructuralFeature('eSubPackages');
      expect(eSubPackages).toBeDefined();
      expect(0).toBe(eSubPackages.get('lowerBound'));
      expect(-1).toBe(eSubPackages.get('upperBound'));
      expect(true).toBe(eSubPackages.get('containment'));
      expect(eSubPackages.get('eType')).toEqual(EPackage);
    });
  });

  describe('#EClassifier', () => {
    it('should contain EClassifier', () => {
      expect(EClassifier).toBeDefined();
      expect(EClassifier.eClass).toEqual(EClass);
    });
  });

  describe('#EClass', () => {
    it('should contain EClass', () => {
      expect(EClass).toBeDefined();
      expect(EClass.eClass).toEqual(EClass);
    });

    it('should contain EClass attributes', () => {
      let _abstract = EClass.getEStructuralFeature('abstract');
      expect(_abstract).toBeDefined();
      expect(_abstract.eClass).toEqual(EAttribute);

      let _interface = EClass.getEStructuralFeature('interface');
      expect(_interface).toBeDefined();
      expect(_interface.eClass).toEqual(EAttribute);
    });

    it('should contain EClass references', () => {
      let eStructuralFeatures = EClass.getEStructuralFeature(
        'eStructuralFeatures',
      );
      expect(eStructuralFeatures).toBeDefined();
      expect(0).toBe(eStructuralFeatures.get('lowerBound'));
      expect(-1).toBe(eStructuralFeatures.get('upperBound'));
      expect(true).toBe(eStructuralFeatures.get('containment'));
      expect(eStructuralFeatures.get('eType')).toEqual(EStructuralFeature);

      let eSuperTypes = EClass.getEStructuralFeature('eSuperTypes');
      expect(eSuperTypes).toBeDefined();
      expect(0).toBe(eSuperTypes.get('lowerBound'));
      expect(-1).toBe(eSuperTypes.get('upperBound'));
      expect(eSuperTypes.get('many')).toEqual(true);
      expect(false).toBe(eSuperTypes.get('containment'));
      expect(eSuperTypes.get('eType')).toEqual(EClass);

      let eOperations = EClass.getEStructuralFeature('eOperations');
      expect(eOperations).toBeDefined();
      expect(0).toBe(eOperations.get('lowerBound'));
      expect(-1).toBe(eOperations.get('upperBound'));
      expect(true).toBe(eOperations.get('containment'));
      expect(eOperations.get('eType')).toEqual(EOperation);
    });
  }); // end EClass

  describe('#EDataType', () => {
    it('should contain EDataType', () => {
      expect(EDataType).toBeDefined();
      expect(EDataType.eClass).toEqual(EClass);
    });
  }); // end EDataType

  describe('#EStructuralFeature', () => {
    it('should contain EStructuralFeature', () => {
      expect(EStructuralFeature).toBeDefined();
      expect(EStructuralFeature.eClass).toEqual(EClass);
    });

    it('should contain EStructuralFeature attributes', () => {
      // changeable
      let changeable = EStructuralFeature.getEStructuralFeature('changeable');
      expect(changeable).toBeDefined();
      expect(changeable.eClass).toEqual(EAttribute);

      // volatile
      let _volatile = EStructuralFeature.getEStructuralFeature('volatile');
      expect(_volatile).toBeDefined();
      expect(_volatile.eClass).toEqual(EAttribute);

      // transient
      let _transient = EStructuralFeature.getEStructuralFeature('transient');
      expect(_transient).toBeDefined();
      expect(_transient.eClass).toEqual(EAttribute);

      // defaultValueLiteral
      let defaultValueLiteral = EStructuralFeature.getEStructuralFeature(
        'defaultValueLiteral',
      );
      expect(defaultValueLiteral).toBeDefined();
      expect(defaultValueLiteral.eClass).toEqual(EAttribute);

      // defaultValue
      let defaultValue =
        EStructuralFeature.getEStructuralFeature('defaultValue');
      expect(defaultValue).toBeDefined();
      expect(defaultValue.eClass).toEqual(EAttribute);

      // unsettable
      let unsettable = EStructuralFeature.getEStructuralFeature('unsettable');
      expect(unsettable).toBeDefined();
      expect(unsettable.eClass).toEqual(EAttribute);

      // derived
      let derived = EStructuralFeature.getEStructuralFeature('derived');
      expect(derived).toBeDefined();
      expect(derived.eClass).toEqual(EAttribute);
    });
  }); // end EStructuralFeature

  describe('#EAttribute', () => {
    it('should contain EAttribute', () => {
      expect(EAttribute).toBeDefined();
      expect(EAttribute.eClass).toEqual(EClass);
    });

    it('should contain EAttribute attributes', () => {
      // iD
      let iD = EAttribute.getEStructuralFeature('iD');
      expect(iD).toBeDefined();
      expect(iD.eClass).toEqual(EAttribute);
    });
  }); // end EAttribute

  describe('#EReference', () => {
    it('should contain EReference', () => {
      expect(EReference).toBeDefined();
      expect(EReference.eClass).toEqual(EClass);
    });

    it('should contain EReference attributes', () => {
      // isContainment
      let isContainment = EReference.getEStructuralFeature('containment');
      expect(isContainment).toBeDefined();
      expect(isContainment.eClass).toEqual(EAttribute);

      // container
      let container = EReference.getEStructuralFeature('container');
      expect(container).toBeDefined();
      expect(container.eClass).toEqual(EAttribute);

      // resolveProxies
      let resolveProxies = EReference.getEStructuralFeature('resolveProxies');
      expect(resolveProxies).toBeDefined();
      expect(resolveProxies.eClass).toEqual(EAttribute);
    });

    it('should contain EReference references', () => {
      let eReference = EReference;
      // eOpposite
      let eOpposite = EReference.getEStructuralFeature('eOpposite');

      expect(eOpposite).toBeDefined();
      expect(0).toBe(eOpposite.get('lowerBound'));
      expect(1).toBe(eOpposite.get('upperBound'));
      expect(eReference).toBe(eOpposite.get('eType'));
    });
  }); // end EReference

  describe('#EOperation', () => {
    it('should contain EOperation', () => {
      expect(EOperation).toBeDefined();
      expect(EOperation.eClass).toEqual(EClass);
    });

    it('should contain EOperation references', () => {
      let eParameters = EOperation.getEStructuralFeature('eParameters');
      expect(EReference).toEqual(eParameters.eClass);
      expect(true).toEqual(eParameters.get('containment'));
      expect(eParameters.get('lowerBound')).toEqual(0);
      expect(eParameters.get('upperBound')).toEqual(-1);
      expect(eParameters.get('eType')).toEqual(EParameter);

      let eTypeParameters = EOperation.getEStructuralFeature('eTypeParameters');
      expect(EReference).toEqual(eTypeParameters.eClass);
      expect(true).toEqual(eTypeParameters.get('containment'));
      expect(eTypeParameters.get('lowerBound')).toEqual(0);
      expect(eTypeParameters.get('upperBound')).toEqual(-1);
      expect(eTypeParameters.get('eType')).toEqual(ETypeParameter);

      let eGenericExceptions =
        EOperation.getEStructuralFeature('eGenericExceptions');
      expect(EReference).toEqual(eGenericExceptions.eClass);
      expect(true).toEqual(eGenericExceptions.get('containment'));
      expect(eGenericExceptions.get('lowerBound')).toEqual(0);
      expect(eGenericExceptions.get('upperBound')).toEqual(-1);
      expect(eGenericExceptions.get('eType')).toEqual(EGenericType);
    });
  }); // end EOperation

  describe('#EParameter', () => {
    it('should contain EParameter', () => {
      expect(EParameter).toBeDefined();
      expect(EParameter.eClass).toEqual(EClass);
    });
  }); // end EParameter

  describe('#EModelElement', () => {
    it('should have correct attributes', () => {
      expect(true).toBe(EModelElement.get<boolean>('abstract'));
      expect(1).toBe(EModelElement.get<EList>('eSuperTypes')!.size());
    });
  }); // end describe EModelElement

  describe('#ENamedElement', () => {
    it('should have correct attributes', () => {
      expect(true).toBe(ENamedElement.get('abstract'));
      expect(1).toBe(ENamedElement.get<EList>('eSuperTypes')!.size());

      let superType = ENamedElement.get<EList>('eSuperTypes')!.first();

      expect(superType).toEqual(EModelElement);
    });
  }); // end describe ENamedElement

  describe('#ETypedElement', () => {
    it('should have correct attributes', () => {
      expect(true).toBe(ETypedElement.get('abstract'));
      expect(1).toBe(ETypedElement.get<EList>('eSuperTypes')!.size());

      let superType = ETypedElement.get<EList>('eSuperTypes')!.first();

      expect(superType).toEqual(ENamedElement);

      let allSuperTypes = ETypedElement.get<EList>('eAllSuperTypes')!;

      expect(3).toBe(allSuperTypes.length);
      expect(allSuperTypes.includes(ENamedElement)).toBe(true);
      expect(allSuperTypes.includes(EModelElement)).toBe(true);
    });

    it('should have correct features', () => {
      let eGenericType = ETypedElement.getEStructuralFeature('eGenericType');
      expect(EReference).toEqual(eGenericType.eClass);
      expect(EGenericType).toEqual(eGenericType.get('eType'));
      expect(true).toEqual(eGenericType.get('containment'));
      expect(1).toEqual(eGenericType.get('upperBound'));
    });
  }); // end describe ETypedElement

  describe('#EClassifier', () => {
    it('should have correct attributes', () => {
      expect(true).toBe(EClassifier.get('abstract'));
      expect(1).toBe(EClassifier.get<EList>('eSuperTypes')!.size());
    });

    it('should have correct features', () => {
      let eTypeParameters =
        EClassifier.getEStructuralFeature('eTypeParameters');
      expect(EReference).toEqual(eTypeParameters.eClass);
      expect(ETypeParameter).toEqual(eTypeParameters.get('eType'));
      expect(true).toEqual(eTypeParameters.get('containment'));
      expect(-1).toEqual(eTypeParameters.get('upperBound'));
    });
  }); // end describe EClassifier

  describe('#EClass', () => {
    it('should have correct attributes', () => {
      expect(EClass).toEqual(EClass.eClass);

      let abstract = EClass.getEStructuralFeature('abstract');
      expect(EAttribute).toEqual(abstract.eClass);
      expect(EBoolean).toEqual(abstract.get('eType'));
      expect(1).toEqual(abstract.get('upperBound'));

      let interface_ = EClass.getEStructuralFeature('interface');
      expect(EAttribute).toEqual(interface_.eClass);
      expect(EBoolean).toEqual(interface_.get('eType'));
      expect(1).toEqual(interface_.get('upperBound'));
    });

    it('should have correct references', () => {
      let eSuperTypes = EClass.getEStructuralFeature('eSuperTypes');
      expect(EReference).toEqual(eSuperTypes.eClass);
      expect(EClass).toEqual(eSuperTypes.get('eType'));
      expect(eSuperTypes.get('containment')).toBe(false);
      expect(-1).toEqual(eSuperTypes.get('upperBound'));

      let eStructuralFeatures = EClass.getEStructuralFeature(
        'eStructuralFeatures',
      );
      expect(EReference).toEqual(eStructuralFeatures.eClass);
      expect(eStructuralFeatures.get('eType')).toEqual(EStructuralFeature);
      expect(true).toEqual(eStructuralFeatures.get('containment'));
      expect(-1).toEqual(eStructuralFeatures.get('upperBound'));

      let eOperations = EClass.getEStructuralFeature('eOperations');
      expect(EReference).toEqual(eOperations.eClass);
      expect(EOperation).toEqual(eOperations.get('eType'));
      expect(true).toEqual(eOperations.get('containment'));
      expect(-1).toEqual(eOperations.get('upperBound'));

      let eGenericSuperTypes =
        EClass.getEStructuralFeature('eGenericSuperTypes');
      expect(EReference).toEqual(eGenericSuperTypes.eClass);
      expect(EGenericType).toEqual(eGenericSuperTypes.get('eType'));
      expect(true).toEqual(eGenericSuperTypes.get('containment'));
      expect(-1).toEqual(eGenericSuperTypes.get('upperBound'));
    });

    it('should have EClassifier has eSuperTypes', () => {
      let found = EClass.get<EList>('eSuperTypes')!.find((type) => {
        return type === EClassifier;
      });

      expect(found).toBeDefined();
      expect(found).toEqual(EClassifier);
    });
  }); // end describe EClass.

  describe('ETypeParameter', () => {
    it('should have correct attributes', () => {
      expect(0).toEqual(ETypeParameter.get<EList>('eAttributes')!.length);
      expect(1).toEqual(ETypeParameter.get<EList>('eSuperTypes')!.size());
      expect(
        ETypeParameter.get<EList>('eSuperTypes')!.contains(ENamedElement),
      ).toBe(true);
    });

    it('should have correct references', () => {
      let eReferences = ETypeParameter.get<EList>('eReferences')!;

      expect(2).toEqual(eReferences.length);

      let eGenericTypes = ETypeParameter.getEStructuralFeature('eGenericTypes');
      expect(EGenericType).toEqual(eGenericTypes.get('eType'));
      expect(eGenericTypes.get('containment')).not.toBe(true);
      expect(-1).toEqual(eGenericTypes.get('upperBound'));

      let eBounds = ETypeParameter.getEStructuralFeature('eBounds');
      expect(EGenericType).toEqual(eBounds.get('eType'));
      expect(true).toEqual(eBounds.get('containment'));
      expect(-1).toEqual(eBounds.get('upperBound'));
    });
  });

  describe('EGenericType', () => {
    it('should have correct attributes', () => {
      expect(0).toEqual(EGenericType.get<EList>('eAttributes')!.length);
      expect(1).toEqual(EGenericType.get<EList>('eSuperTypes')!.size());
    });

    it('should have correct references', () => {
      expect(5).toEqual(EGenericType.get<EList>('eReferences')!.length);

      let eUpperBound = EGenericType.getEStructuralFeature('eUpperBound');
      expect(EGenericType).toEqual(eUpperBound.get('eType'));
      expect(1).toEqual(eUpperBound.get('upperBound'));
      expect(true).toEqual(eUpperBound.get('containment'));

      let eLowerBound = EGenericType.getEStructuralFeature('eLowerBound');
      expect(EGenericType).toEqual(eLowerBound.get('eType'));
      expect(1).toEqual(eLowerBound.get('upperBound'));
      expect(true).toEqual(eLowerBound.get('containment'));

      let eTypeArguments = EGenericType.getEStructuralFeature('eTypeArguments');
      expect(EGenericType).toEqual(eTypeArguments.get('eType'));
      expect(-1).toEqual(eTypeArguments.get('upperBound'));
      expect(true).toEqual(eTypeArguments.get('containment'));

      let eTypeParameter = EGenericType.getEStructuralFeature('eTypeParameter');
      expect(ETypeParameter).toEqual(eTypeParameter.get('eType'));
      expect(1).toEqual(eTypeParameter.get('upperBound'));
      expect(eTypeParameter.get('containment')).not.toBe(true);

      let eClassifier = EGenericType.getEStructuralFeature('eClassifier');
      expect(EClassifier).toEqual(eClassifier.get('eType'));
      expect(1).toEqual(eClassifier.get('upperBound'));
      expect(eClassifier.get('containment')).not.toBe(true);
    });
  });
});
