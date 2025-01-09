import { union, flatten } from 'lodash-es';
import { EOperation } from './ecore.ts';

function isNotAbstract(type: any) {
  return !type.get('abstract');
}

function getSubTypes(type: any) {
  if (!type || !type.eClass) return [];

  const allSubTypes = type.get('eAllSubTypes');

  return union([type], allSubTypes).filter(isNotAbstract);
}

function childTypes(object: any, createDescriptor: any) {
  if (!object) return [];

  const allContainments = object.eClass.get('eAllContainments');
  const allSubTypes = (feature: any) => {
    const types = getSubTypes(feature.get('eType'));

    if (createDescriptor && typeof createDescriptor === 'function') {
      return createDescriptor(object, feature, types);
    } else {
      return types;
    }
  };

  return flatten(allContainments.map(allSubTypes));
}

function siblingTypes(object: any, createDescriptor: any) {
  if (!object) return [];

  const eContainer = object.eContainer;
  const siblings = childTypes(eContainer, createDescriptor);

  return siblings;
}

function createDescriptor(object: any, feature: any, types: any) {
  return types.map((type: any) => ({
    label: 'New ' + type.get('name'),
    owner: object,
    feature: feature,
    type: type,
  }));
}

function childDescriptors(object: any) {
  return childTypes(object, createDescriptor);
}

function siblingDescriptors(object: any) {
  return siblingTypes(object, createDescriptor);
}

function textNamedElement(object: any) {
  return object.get('name') || '';
}

function textTypedElement(object: any) {
  const type = object.get('eType');
  const isOp = object.eClass === EOperation;
  const typeName = type ? type.get('name') : null;

  return (
    object.get('name') + (isOp ? '()' : '') + (typeName ? ' : ' + typeName : '')
  );
}

function choiceOfValues(owner: any, feature: any) {
  if (
    owner == null ||
    owner.eResource() == null ||
    owner.eResource().get('resourceSet') == null
  )
    throw new Error('Bad argument');

  const type = feature.get('eType');
  const resourceSet = owner.eResource().get('resourceSet');
  const elements = resourceSet.elements();

  return elements.filter((e: any) => e.isKindOf(type));
}

export const Edit = {
  childTypes: childTypes,
  siblingTypes: siblingTypes,
  childDescriptors: childDescriptors,
  siblingDescriptors: siblingDescriptors,
  choiceOfValues: choiceOfValues,

  _get(fn: any, object: any) {
    if (!object || !object.eClass) return null;

    const eClass = object.eClass.get('name');
    if ((this as unknown as any)[eClass]) {
      if (typeof (this as unknown as any)[eClass][fn] === 'function') {
        return (this as unknown as any)[eClass][fn](object);
      } else {
        return (this as unknown as any)[eClass][fn];
      }
    } else {
      return object.eClass.get('name');
    }
  },

  text(object: any) {
    return this._get('text', object);
  },

  icon(object: any) {
    return this._get('icon', object);
  },

  label(object: any) {
    return this._get('label', object);
  },

  EClass: {
    text: textNamedElement,
    label: textNamedElement,
    icon: 'icon-EClass',
  },
  EDataType: {
    text: textNamedElement,
    label: textNamedElement,
    icon: 'icon-EDataType',
  },
  EEnum: {
    text: textNamedElement,
    label: textNamedElement,
    icon: 'icon-EEnum',
  },
  EEnumLiteral: {
    text(object: any) {
      return object.get('name') + ' = ' + object.get('value');
    },
    label: textNamedElement,
    icon: 'icon-EEnumLiteral',
  },
  EAttribute: {
    text: textTypedElement,
    label: textNamedElement,
    icon: 'icon-EAttribute',
  },
  EReference: {
    text: textTypedElement,
    label: textNamedElement,
    icon: 'icon-EReference',
  },
  EOperation: {
    text: textTypedElement,
    label: textNamedElement,
    icon: 'icon-EOperation',
  },
  EPackage: {
    text: textNamedElement,
    label: textNamedElement,
    icon: 'icon-EPackage',
  },
  EAnnotation: {
    text(object: any) {
      return object.get('source');
    },
    label(object: any) {
      return object.get('source');
    },
    icon: 'icon-EAnnotation',
  },
  EStringToStringMapEntry: {
    text(object: any) {
      return object.get('key') + ' -> ' + object.get('value');
    },
    label(object: any) {
      return object.get('key');
    },
    icon: 'icon-EStringToStringMapEntry',
  },
  ResourceSet: {
    text: 'resourceSet',
    label: '',
    icon: 'icon-EObject',
  },
  Resource: {
    text(object: any) {
      return object.get('uri');
    },
    label(object: any) {
      return object.get('uri');
    },
    icon: 'icon-EObject',
  },
};
