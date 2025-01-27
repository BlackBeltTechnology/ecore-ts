import { union, flatten } from 'lodash-es';
import { EObject, EOperation } from './ecore.ts';
import { EResourceSet } from './resource.ts';

export interface Descriptor {
  label: string;
  owner: EObject;
  feature: EObject;
  type: EObject;
}

function isNotAbstract(type: EObject): boolean {
  return !type.get<boolean>('abstract');
}

function getSubTypes(type: EObject | unknown): EObject[] {
  if (!type || !(type as EObject).eClass) return [];

  const allSubTypes = (type as EObject).get<Array<EObject>>('eAllSubTypes')!;

  return union<EObject>([type as EObject], allSubTypes).filter(isNotAbstract);
}

function childTypes(
  object: EObject,
  createDescriptor?: Function,
): Array<Descriptor | EObject> {
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

function siblingTypes(
  object: EObject,
  createDescriptor?: Function,
): Array<Descriptor | EObject> {
  if (!object) return [];

  const eContainer = object.eContainer!;
  const siblings = childTypes(eContainer, createDescriptor);

  return siblings;
}

function createDescriptor(
  object: EObject,
  feature: EObject,
  types: EObject[],
): Array<Descriptor | EObject> {
  return types.map((type: any) => ({
    label: 'New ' + type.get('name'),
    owner: object,
    feature: feature,
    type: type,
  }));
}

function childDescriptors(object: EObject): Array<Descriptor | EObject> {
  return childTypes(object, createDescriptor);
}

function siblingDescriptors(object: EObject): Array<Descriptor | EObject> {
  return siblingTypes(object, createDescriptor);
}

function textNamedElement(object: EObject): string {
  return object.get('name') || '';
}

function textTypedElement(object: EObject): string {
  const type = object.get<EObject>('eType');
  const isOp = object.eClass === EOperation;
  const typeName = type ? type.get('name') : null;

  return (
    object.get('name') + (isOp ? '()' : '') + (typeName ? ' : ' + typeName : '')
  );
}

function choiceOfValues(owner: EObject, feature: EObject): any[] {
  if (
    owner == null ||
    owner.eResource() == null ||
    owner.eResource()!.get('resourceSet') == null
  )
    throw new Error('Bad argument');

  const type = feature.get('eType');
  const resourceSet = owner.eResource()!.get<EResourceSet>('resourceSet')!;
  const elements = resourceSet.elements();

  return elements.filter((e: any) => e.isKindOf(type));
}

export const Edit = {
  childTypes: childTypes,
  siblingTypes: siblingTypes,
  childDescriptors: childDescriptors,
  siblingDescriptors: siblingDescriptors,
  choiceOfValues: choiceOfValues,

  _get(fn: string, object: EObject) {
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

  text(object: EObject) {
    return this._get('text', object);
  },

  icon(object: EObject) {
    return this._get('icon', object);
  },

  label(object: EObject) {
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
    text(object: EObject) {
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
    text(object: EObject) {
      return object.get('source');
    },
    label(object: EObject) {
      return object.get('source');
    },
    icon: 'icon-EAnnotation',
  },
  EStringToStringMapEntry: {
    text(object: EObject) {
      return object.get('key') + ' -> ' + object.get('value');
    },
    label(object: EObject) {
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
    text(object: EObject) {
      return object.get('uri');
    },
    label(object: EObject) {
      return object.get('uri');
    },
    icon: 'icon-EObject',
  },
};
