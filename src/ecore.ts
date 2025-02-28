import { has, isObject, without } from 'lodash-es';
import { EResource } from './resource.ts';

export function create<T extends EObject>(
  eClass: EObject | unknown,
  attributes?: Record<any, any> | string,
): T {
  let attrs: any, eObject;

  if (!attributes) {
    if (eClass instanceof EObject) {
      attrs = {};
      attrs.eClass = eClass;
    } else {
      attrs = eClass;
    }
  } else {
    attrs = attributes;
    attrs.eClass = (attributes as Record<any, any>).eClass || eClass;
  }

  if (!attrs.eClass || attrs.eClass.get('abstract')) {
    throw new Error('Cannot create EObject from undefined or abstract EClass');
  }

  eObject = new EObject(attrs);

  return eObject as T;
}

export class EObject {
  // @ts-ignore
  public _: any;
  public eClass: any;
  public values: Record<any, any>;
  private _callbacks?: Record<any, any>;
  public eContainingFeature: any;
  public eContainer?: EObject | EResource;
  private __updateContents: any;
  private __eContents: any;
  public _id: any;
  // @ts-ignore
  public Registry: ERegistry;

  constructor(attributes: Record<any, any> = {}) {
    this.eClass = attributes.eClass;
    this.values = {};

    // stores function for eOperations.
    if (attributes._) {
      this._ = attributes._;
    }

    // Initialize values according to the eClass features.
    initValues(this);
    setValues(this, attributes);
    this.initOperations(this);
  }

  // @ts-ignore
  getEStructuralFeature(feature: any): any {
    // noop
  }

  on(
    events: string,
    callback: (eObject: EObject | string) => void,
    context?: any,
  ) {
    let calls: Record<any, any>, event, list: any[];
    if (!callback) return this;

    let eventsSplit: string[] = events.split(/\s+/);
    calls = this._callbacks || (this._callbacks = {});

    while ((event = eventsSplit.shift())) {
      list = calls[event] || (calls[event] = []);
      list.push(callback, context);
    }

    return this;
  }

  off(events: string, callback?: any, context?: any) {
    let event, calls, list, i;

    if (!(calls = this._callbacks)) return this;
    if (!(events || callback || context)) {
      delete this._callbacks;
      return this;
    }

    let eventsSplit = events ? events.split(/\s+/) : Object.keys(calls);
    while ((event = eventsSplit.shift())) {
      if (!(list = calls[event]) || !(callback || context)) {
        delete calls[event];
        continue;
      }

      for (i = list.length - 2; i >= 0; i -= 2) {
        if (
          !(
            (callback && list[i] !== callback) ||
            (context && list[i + 1] !== context)
          )
        ) {
          list.splice(i, 2);
        }
      }
    }

    return this;
  }

  trigger(events: string, ...rest: any[]) {
    let event, calls, list, i, length, args, all;
    if (!(calls = this._callbacks)) return this;

    let eventsSplit = events.split(/\s+/);
    for (i = 1, length = arguments.length; i < length; i++) {
      rest[i - 1] = arguments[i];
    }
    // For each event, walk through the list of callbacks twice, first to
    // trigger the event, then to trigger any `"all"` callbacks.
    while ((event = eventsSplit.shift())) {
      if ((all = calls.all)) all = all.slice();
      if ((list = calls[event])) list = list.slice();

      if (list) {
        for (i = 0, length = list.length; i < length; i += 2) {
          list[i].apply(list[i + 1] || this, rest);
        }
      }
      // Execute "all" callbacks.
      if (all) {
        args = [event].concat(rest);
        for (i = 0, length = all.length; i < length; i += 2) {
          all[i].apply(all[i + 1] || this, args);
        }
      }
    }

    return this;
  }

  initOperations(eObject: EObject) {
    if (!eObject || !eObject.eClass) return;
    function eAllOperations(eClass: EObject): EObject[] {
      const eOperations = eClass.get<EList>('eOperations')!.array();
      const superTypes = eClass.get<Array<EObject>>('eAllSuperTypes');
      return Array.from(
        new Set(
          [
            eOperations || [],
            (superTypes || []).map((s) => eAllOperations(s)).flat(),
          ].flat(),
        ),
      );
    }

    const eOperations = eAllOperations(this.eClass);
    if (!eOperations) return;

    eOperations.forEach((op) => {
      this[op.get('name') as keyof EObject] = op._;
    });
  }

  create<T extends EObject>(
    attributes?: Record<any, any> | string,
  ): T | undefined {
    if (this.eClass.get('name') !== 'EClass') return;

    return create<T>(this, attributes);
  }

  has(name: string) {
    return (
      this.values?.hasOwnProperty(name) ||
      getEStructuralFeature(this.eClass, name)
    );
  }

  isSet(name: string) {
    if (!this.has(name)) return false;

    const eClass = this.eClass;
    if (!eClass) return false;

    const value = this.get(name);
    if (value instanceof EList) {
      return value.size() > 0;
    } else {
      return value !== null && typeof value !== 'undefined';
    }
  }

  set(attrs: Record<any, any> | string | null, options?: any) {
    let attr, key: string, val: any, eve;
    if (attrs === null) return this;

    if ((attrs as Record<any, any>).eClass) {
      attrs = (attrs as Record<any, any>).get('name');
    }

    // Handle attrs is a hash or attrs is
    // property and options the value to be set.
    if (!isObject(attrs)) {
      key = attrs as string;
      (attrs = {} as any)[key] = options;
    }

    const eResource = this.eResource();

    for (attr in attrs as Record<any, any>) {
      val = (attrs as Record<any, any>)[attr];
      if (typeof val !== 'undefined' && this.has(attr)) {
        if (this.isSet(attr)) {
          this.unset(attr);
        }

        const feature = getEStructuralFeature(this.eClass, attr),
          isContainment = feature.get('containment');

        const settingContainmentAttribute =
          attr === 'containment' &&
          typeof val === 'string' &&
          this.eClass.values.name === 'EReference';
        if (settingContainmentAttribute) {
          // Convert string 'true' to boolean true
          val = val.toLowerCase() === 'true';
        }

        this.values[attr] = val;

        if (isContainment) {
          val.eContainingFeature = feature;
          val.eContainer = this;
        }
        eve = 'change:' + attr;
        this.trigger('change ' + eve, attr);
        if (eResource) eResource.trigger('change', this);
      }
    }

    return this;
  }

  unset(attrs: Record<any, any> | string, _?: any) {
    let attr, key, eve;
    if (attrs === null) return this;

    if ((attrs as Record<any, any>).eClass) {
      attrs = (attrs as Record<any, any>).get('name');
    }

    // Handle attrs is a hash or attrs is
    // property and options the value to be set.
    if (!isObject(attrs)) {
      key = attrs;
      (attrs = {} as any)[key] = undefined;
    }

    const eResource = this.eResource();

    for (attr in attrs as Record<any, any>) {
      if (this.has(attr) && this.isSet(attr)) {
        // unset

        const feature = getEStructuralFeature(this.eClass, attr),
          isContainment = Boolean(feature.get('containment')) === true;
        const value: any = this.values[attr];

        if (isContainment) {
          value.eContainingFeature = undefined;
          value.eContainer = undefined;
        }
        this.values[attr] = undefined;
        eve = 'unset:' + attr;
        this.trigger('unset ' + eve, attr);
        if (eResource) eResource.trigger('change', this);
      }
    }

    return this;
  }

  get<T>(feature: EObject | string): T | null {
    if (!feature) return null;

    const featureName = (
      (feature as EObject).eClass
        ? (feature as EObject).get<string>('name')
        : feature
    ) as string;

    if (!has(this.values, featureName) && this.has(featureName)) {
      initValue(this, getEStructuralFeature(this.eClass, featureName));
    }

    const value: any = this.values[featureName];

    if (typeof value === 'function') {
      return (value as Function).apply(this);
    } else {
      return value;
    }
  }

  isTypeOf(type: EObject | string) {
    if (!type || !this.eClass) return false;

    const typeName = (type as EObject).eClass
      ? (type as EObject).get('name')
      : type;

    return this.eClass.get('name') === typeName;
  }

  isKindOf(type: EObject | string) {
    if (!type || !this.eClass) return false;
    if (this.isTypeOf(type)) return true;

    const typeName = (type as EObject).eClass
        ? (type as EObject).get('name')
        : type,
      superTypes = this.eClass.get('eAllSuperTypes');

    return superTypes.some((eSuper: any) => {
      return eSuper.get('name') === typeName;
    });
  }

  eResource(): EObject | null {
    if (this.isKindOf('Resource')) return this;
    if (!this.eContainer) return null;
    if (this.eContainer.isKindOf('Resource')) return this.eContainer;

    return this.eContainer.eResource();
  }

  eContents() {
    if (!this.eClass) return [];

    if (this.__updateContents === undefined) {
      this.__updateContents = true;

      const resource = this.eResource();
      if (resource) {
        resource.on('add remove', () => {
          this.__updateContents = true;
        });
      }
    }

    if (this.__updateContents) {
      const eAllFeatures = this.eClass.get('eAllStructuralFeatures');
      const eContainments = eAllFeatures.filter((feature: any) => {
        return (
          feature.isTypeOf('EReference') &&
          feature.get('containment') &&
          this.isSet(feature.get('name'))
        );
      }, this);

      let value = null;
      this.__eContents = eContainments
        .map((c: any) => {
          value = this.get<EList>(c.get('name'));
          return value ? (value.array ? value.array() : value) : [];
        })
        .flat();

      this.__updateContents = false;
    }

    return this.__eContents;
  }

  eURI(): string {
    // It's possible the adjustments for the id map need to made
    // in the fragment function as the fragment should be the xmi id.
    const eModel = this.eResource();

    return (eModel ? eModel.get('uri') : '') + '#' + this.fragment();
  }

  fragment(): string | null {
    let eContainer = this.eContainer,
      eClass = this.eClass,
      iD = eClass.get('eIDAttribute'),
      eFeature,
      contents,
      fragment: string | null = null;

    // Must be at least contain in a Resource or EObject.
    if (!eContainer) return null;

    // Use ID has fragment
    if (iD) return this.get(iD.get('name'));

    if (this._id) return this._id;

    // ModelElement uses names except for roots
    if (this.isKindOf('EModelElement')) {
      if (!eContainer) {
        return '/';
      } else if (eContainer.isKindOf('Resource')) {
        contents = eContainer.get<EList>('contents')!;
        return contents.size() > 1 ? '/' + contents.indexOf(this) : '/';
      } else {
        return eContainer.fragment() + '/' + this.get('name');
      }
    }

    // Default fragments
    if (eContainer.isKindOf('Resource')) {
      contents = eContainer.get<EList>('contents')!;
      fragment = contents.size() > 1 ? '/' + contents.indexOf(this) : '/';
    } else {
      eFeature = this.eContainingFeature;
      if (eFeature) {
        fragment = eContainer.fragment() + '/@' + eFeature.get('name');
        if (eFeature.get('upperBound') !== 1) {
          fragment +=
            '.' +
            (eContainer as EObject)
              .get<EList>(eFeature.get('name'))!
              .indexOf(this);
        }
      }
    }

    return fragment;
  }
}

function initValues(eObject: EObject) {
  const eClass = eObject.eClass;
  if (!eClass) return;

  const eStructuralFeatures = eClass.get('eAllStructuralFeatures');
  eStructuralFeatures.forEach((eFeature: any) => {
    initValue(eObject, eFeature);
  });
}

function initValue(eObject: EObject, eFeature: EObject) {
  if (!eObject || !eFeature) return;

  const featureName = eFeature.get<string>('name')!,
    defaultValue = eFeature.values.defaultValue,
    upperBound = eFeature.get('upperBound'),
    isDerived = eFeature.values.derived === true,
    // isContainment = eFeature.values.containment === true,
    value = eObject.values[featureName];

  const setDefaultUniqueValue = () => {
    let _default;
    if (defaultValue === null || defaultValue === undefined) {
      _default = null;
    } else if (defaultValue === 0) {
      _default = 0;
    } else if (defaultValue === false) {
      _default = false;
    } else {
      _default = defaultValue;
    }
    return _default;
  };

  if (value === null || value === undefined) {
    if (isDerived) {
      eObject.values[featureName] = eFeature.values._;
    } else if (upperBound === 1 || !upperBound) {
      eObject.values[featureName] = setDefaultUniqueValue();
    } else if (value instanceof EList) {
      value._setFeature(eFeature);
    } else if (eFeature.isTypeOf('EAttribute')) {
      eObject.values[featureName] = [];
    } else {
      eObject.values[featureName] = new EList(eObject, eFeature);
    }
  }
}

function getEStructuralFeature(eClass: EObject, featureName: string) {
  return eClass.get<EList>('eAllStructuralFeatures')!.find((feature: any) => {
    return feature.values.name === featureName;
  });
}

function setValues(eObject: EObject, attributes: Record<any, any>) {
  if (!eObject.eClass) return;

  const getOrCreate = (eType: EObject, value: any) => {
    if (typeof value === 'function') return value;
    if (value instanceof EObject) return value;
    return create(eType, value);
  };

  const createSingle = (
    key: string,
    value: any,
    isReference: boolean,
    eType: EObject,
  ) => {
    if (isReference) {
      eObject.set(key, getOrCreate(eType, value));
    } else {
      eObject.set(key, value);
    }
  };

  const createMany = (
    key: string,
    value: any,
    isReference: boolean,
    eType: EObject,
  ) => {
    const values = Array.isArray(value) ? value : [value];
    values.forEach((current) => {
      if (isReference) {
        eObject.get<EList>(key)!.add(getOrCreate(eType, current));
      } else {
        eObject.get<EList>(key)!.push(current);
      }
    });
  };

  Object.entries(attributes).forEach(([key, value]) => {
    const eFeature = getEStructuralFeature(eObject.eClass, key);

    if (eFeature && value !== undefined) {
      if (eFeature.get('upperBound') === 1) {
        createSingle(
          key,
          value,
          eFeature.eClass === EReference,
          eFeature.get('eType'),
        );
      } else {
        createMany(
          key,
          value,
          eFeature.eClass === EReference,
          eFeature.get('eType'),
        );
      }
    }
  });
}

export class EList<T extends EObject = any> {
  private _internal: any[] = [];
  private readonly _owner: any;
  private _size = 0;
  public _feature: any;
  private _isContainment = false;

  constructor(owner: any, feature?: any) {
    this._internal = [];
    this._owner = owner;
    this._size = 0;
    this._setFeature(feature);
  }

  get length(): number {
    return this._size;
  }

  _setFeature(feature: any) {
    if (feature) {
      this._feature = feature;
      this._isContainment = this._feature.get('containment');

      this._internal.forEach((e) => {
        if (this._isContainment) {
          e.eContainer = this._owner;
          e.eContainingFeature = this._feature;
        }
      }, this);
    }
  }

  add(eObject: T | unknown) {
    if (!eObject || !(eObject instanceof EObject)) return this;

    if (this._isContainment) {
      eObject.eContainingFeature = this._feature;
      eObject.eContainer = this._owner;
    }

    this._size++;
    this._internal.push(eObject);

    let eResource = this._owner.eResource(),
      eve = 'add';

    if (this._feature) eve += ':' + this._feature.get('name');
    this._owner.trigger(eve, eObject);
    if (eResource) eResource.trigger('add', this);

    return this;
  }

  push(eObject: T | unknown): void {
    this.add(eObject);
  }

  addAll() {
    Array.from(arguments || [])
      .flat()
      .forEach((value) => {
        this.add(value);
      });

    return this;
  }

  remove(eObject: T) {
    let eve = 'remove',
      eResource = this._owner.eResource();

    this._internal = without(this._internal, eObject);
    this._size = this._size - 1;
    if (this._feature) eve += ':' + this._feature.get('name');
    this._owner.trigger(eve, eObject);
    if (eResource) eResource.trigger('remove', this);

    return this;
  }

  clear() {
    const array = this.array();
    for (let i = 0; i < array.length; i++) {
      this.remove(array[i]);
    }
    return this;
  }

  size() {
    return this._size;
  }

  at<T>(position: number): T | EObject {
    if (this._size < position) {
      throw new Error('Index Out Of Range');
    }
    return this._internal[position];
  }

  array(): T[] {
    return this._internal;
  }

  forEach(iterator: (e: T) => void): void {
    this._internal.forEach(iterator);
  }

  first(): T | EObject | undefined {
    return this._internal[0];
  }

  last(): T | undefined {
    return this._internal[this._internal.length - 1];
  }

  each(iterator: (e: T) => void) {
    return this._internal.forEach(iterator);
  }

  filter(iterator: (e: T) => any) {
    return this._internal.filter(iterator);
  }

  find(iterator: (e: T) => any) {
    return this._internal.find(iterator);
  }

  map(iterator: (e: T) => any) {
    return this._internal.map(iterator);
  }

  contains(object: T | unknown) {
    return this._internal.includes(object);
  }

  includes(object: T | unknown) {
    return this.contains(object);
  }

  indexOf(object: T | unknown): number {
    return this._internal.indexOf(object);
  }
}

export const EClass = new EObject(),
  EString = new EObject(),
  EInt = new EObject(),
  EBoolean = new EObject(),
  EDouble = new EObject(),
  EDate = new EObject(),
  EIntegerObject = new EObject(),
  EFloatObject = new EObject(),
  ELongObject = new EObject(),
  EMap = new EObject(),
  EDiagnosticChain = new EObject(),
  JSObject = new EObject(),
  EClass_abstract = new EObject(),
  EClass_interface = new EObject(),
  EClass_eStructuralFeatures = new EObject(),
  EClass_eOperations = new EObject(),
  EClass_eSuperTypes = new EObject();

EClass.eClass = EClass;
EClass.values = {
  name: 'EClass',
  abstract: false,
  interface: false,
  eStructuralFeatures: new EList(EClass),
  eOperations: new EList(EClass),
  eSuperTypes: new EList(EClass),

  // Derived Features

  eAllSuperTypes() {
    if (!this._eAllSuperTypes) {
      const compute = (eClass: EObject) => {
        const superTypes = eClass.get<EList>('eSuperTypes')!.array(),
          eAllSuperTypes = superTypes
            .map((s: any) => s.get('eAllSuperTypes'))
            .flat();

        return Array.from(new Set([eAllSuperTypes, superTypes].flat()));
      };

      this.on('add:eSuperTypes remove:eSuperTypes', () => {
        this._eAllSuperTypes = compute(this as EObject);
      });

      this._eAllSuperTypes = compute(this as EObject);
    }

    return this._eAllSuperTypes;
  },
  eAllSubTypes() {
    let eClasses, subTypes, resourceSet;

    resourceSet = this.eResource().get('resourceSet');
    if (resourceSet) {
      eClasses = resourceSet.elements('EClass');
    } else {
      eClasses = EPackage.Registry.elements('EClass');
    }
    subTypes = eClasses.filter((c: any) => {
      return c.get('eAllSuperTypes').includes(this);
    });

    return Array.isArray(subTypes) ? subTypes : [];
  },
  eReferences() {
    let eFeatures, eReferences;

    eFeatures = this.get('eStructuralFeatures')!;
    eReferences = eFeatures.filter((f: any) => f.isTypeOf('EReference'));

    return eReferences;
  },
  eAttributes() {
    let eFeatures, eAttributes;

    eFeatures = this.get('eStructuralFeatures')!;
    eAttributes = eFeatures.filter((f: any) => {
      return f.isTypeOf('EAttribute');
    });

    return eAttributes;
  },
  eIDAttribute() {
    let eAttributes, eID;

    eAttributes = this.get('eAllAttributes');
    eID = eAttributes.filter((a: any) => a.get('iD') === true);

    // Return the first reference with a true iD flag
    return Array.isArray(eID) ? eID[0] : null;
  },
  eAllStructuralFeatures() {
    const compute = (eClass: EObject) => {
      let eSuperFeatures, eAllFeatures, eSuperTypes;
      eSuperTypes = eClass.get<EList>('eAllSuperTypes');
      eAllFeatures = eClass.values.eStructuralFeatures.array();
      eSuperFeatures = (eSuperTypes || [])
        .map((s: any) => s.values.eStructuralFeatures.array())
        .flat();

      return Array.from(
        new Set([eSuperFeatures || [], eAllFeatures || []].flat()),
      );
    };

    return compute(this as EObject);
  },
  eAllAttributes() {
    const eAllFeatures = this.get('eAllStructuralFeatures'),
      eAllAttributes = (eAllFeatures || []).filter(
        (f: any) => f.eClass === EAttribute,
      );

    return eAllAttributes;
  },
  eAllContainments() {
    const eAllFeatures = this.get('eAllStructuralFeatures'),
      eAllContainments = eAllFeatures.filter(
        (f: any) => f.eClass === EReference && f.get('containment'),
      );

    return eAllContainments;
  },
  eAllReferences() {
    const eAllFeatures = this.get('eAllStructuralFeatures'),
      eAllReferences = eAllFeatures.filter(
        (f: any) => f.eClass === EReference && !f.get('containment'),
      );

    return eAllReferences;
  },
};

EClass_abstract.values = {
  name: 'abstract',
  lowerBound: 0,
  upperBound: 1,
  defaultValueLiteral: 'false',
  defaultValue: false,
  eType: EBoolean,
};
EClass_interface.values = {
  name: 'interface',
  lowerBound: 0,
  upperBound: 1,
  defaultValueLiteral: 'false',
  defaultValue: false,
  eType: EBoolean,
};
EClass_eStructuralFeatures.values = {
  name: 'eStructuralFeatures',
  lowerBound: 0,
  upperBound: -1,
  containment: true,
};
EClass_eSuperTypes.values = {
  name: 'eSuperTypes',
  lowerBound: 0,
  upperBound: -1,
  containment: false,
};
EClass_eOperations.values = {
  name: 'eOperations',
  lowerBound: 0,
  upperBound: -1,
  containment: true,
};
EClass.get<EList>('eStructuralFeatures')!
  .add(EClass_abstract)
  .add(EClass_interface)
  .add(EClass_eSuperTypes)
  .add(EClass_eStructuralFeatures)
  .add(EClass_eOperations);

// EClass derived features
//  - eAllStructuralFeatures
//  - eAllSuperTypes
//  - eAllSubTypes (added, not in ecore)
//  - eAllAttributes
//  - eAllContainments
//  - eAllReferences
//  - eReferences
//  - eAttributes
//  - eIDAttribute

const EClass_eAllStructuralFeatures = new EObject();
EClass_eAllStructuralFeatures.values = {
  name: 'eAllStructuralFeatures',
  lowerBound: 0,
  upperBound: -1,
  derived: true,
  containment: false,
  _: EClass.values.eAllStructuralFeatures,
};
const EClass_eAllSuperTypes = new EObject();
EClass_eAllSuperTypes.values = {
  name: 'eAllSuperTypes',
  lowerBound: 0,
  upperBound: -1,
  derived: true,
  containment: false,
  _: EClass.values.eAllSuperTypes,
};
const EClass_eAllSubTypes = new EObject();
EClass_eAllSubTypes.values = {
  name: 'eAllSubTypes',
  lowerBound: 0,
  upperBound: -1,
  derived: true,
  containment: false,
  _: EClass.values.eAllSubTypes,
};
const EClass_eAllAttributes = new EObject();
EClass_eAllAttributes.values = {
  name: 'eAllAttributes',
  lowerBound: 0,
  upperBound: -1,
  derived: true,
  containment: false,
  _: EClass.values.eAllAttributes,
};
const EClass_eAllContainments = new EObject();
EClass_eAllContainments.values = {
  name: 'eAllContainments',
  lowerBound: 0,
  upperBound: -1,
  derived: true,
  containment: false,
  _: EClass.values.eAllContainments,
};
const EClass_eAllReferences = new EObject();
EClass_eAllReferences.values = {
  name: 'eAllReferences',
  lowerBound: 0,
  upperBound: -1,
  derived: true,
  containment: false,
  _: EClass.values.eAllReferences,
};
const EClass_eReferences = new EObject();
EClass_eReferences.values = {
  name: 'eReferences',
  lowerBound: 0,
  upperBound: -1,
  derived: true,
  containment: false,
  _: EClass.values.eReferences,
};
const EClass_eAttributes = new EObject();
EClass_eAttributes.values = {
  name: 'eAttributes',
  lowerBound: 0,
  upperBound: -1,
  derived: true,
  containment: false,
  _: EClass.values.eAttributes,
};
const EClass_eIDAttribute = new EObject();
EClass_eIDAttribute.values = {
  name: 'eIDAttribute',
  lowerBound: 0,
  upperBound: 1,
  derived: true,
  containment: false,
  _: EClass.values.eIDAttribute,
};

EClass.get<EList>('eStructuralFeatures')!
  .add(EClass_eAllStructuralFeatures)
  .add(EClass_eAllSuperTypes)
  .add(EClass_eAllSubTypes)
  .add(EClass_eAllAttributes)
  .add(EClass_eAllReferences)
  .add(EClass_eAllContainments)
  .add(EClass_eAttributes)
  .add(EClass_eReferences)
  .add(EClass_eIDAttribute);

// EClass EOperations

EClass.getEStructuralFeature = function (feature: any) {
  let featureName;

  featureName = feature.eClass ? feature.get('name') : feature;

  return this.get<EList>('eAllStructuralFeatures')!.find((f: any) => {
    return f.get('name') === featureName;
  });
};

const EClass_getEStructuralFeature = new EObject();
EClass_getEStructuralFeature.values = {
  name: 'getEStructuralFeature',
  lowerBound: 0,
  upperBound: 1,
  eParameters: new EList(this),
};
EClass_getEStructuralFeature._ = EClass.getEStructuralFeature;

EClass.get<EList>('eOperations')!.add(EClass_getEStructuralFeature);

// Setting feature reference for ELists.
EClass.values.eStructuralFeatures._setFeature(EClass_eStructuralFeatures);
EClass.values.eSuperTypes._setFeature(EClass_eSuperTypes);
EClass.values.eOperations._setFeature(EClass_eOperations);

// Initialize remaining EClasses

export const EObjectClass = EClass.create()!,
  EModelElement = EClass.create()!,
  EAnnotation = EClass.create()!,
  ENamedElement = EClass.create()!,
  EPackage = EClass.create()!,
  EClassifier = EClass.create()!,
  EDataType = EClass.create()!,
  EEnum = EClass.create()!,
  ETypedElement = EClass.create()!,
  EStructuralFeature = EClass.create()!,
  EAttribute = EClass.create()!,
  EReference = EClass.create()!,
  EOperation = EClass.create()!,
  EParameter = EClass.create()!,
  EEnumLiteral = EClass.create()!,
  EGenericType = EClass.create()!,
  ETypeParameter = EClass.create()!;

// Set eClass and necessary values for EClass features.

// abstract
EClass_abstract.eClass = EAttribute;
// interface
EClass_interface.eClass = EAttribute;
// eStructuralFeatures
EClass_eStructuralFeatures.eClass = EReference;
EClass_eStructuralFeatures.values.eType = EStructuralFeature;
// eSuperTypes
EClass_eSuperTypes.eClass = EReference;
EClass_eSuperTypes.values.eType = EClass;
// eOperations
EClass_eOperations.eClass = EReference;
EClass_eOperations.values.eType = EOperation;
// eAllStructuralFeatures
EClass_eAllStructuralFeatures.eClass = EReference;
EClass_eAllStructuralFeatures.values.eType = EStructuralFeature;
// eAllSuperTypes
EClass_eAllSuperTypes.eClass = EReference;
EClass_eAllSuperTypes.values.eType = EClass;
// eAllSubTypes
EClass_eAllSubTypes.eClass = EReference;
EClass_eAllSubTypes.values.eType = EClass;
// eAllAttributes
EClass_eAllAttributes.eClass = EReference;
EClass_eAllAttributes.values.eType = EAttribute;
// eAllReferences
EClass_eAllReferences.eClass = EReference;
EClass_eAllReferences.values.eType = EReference;
// eAllContainments
EClass_eAllContainments.eClass = EReference;
EClass_eAllContainments.values.eType = EReference;
// eAttributes
EClass_eAttributes.eClass = EReference;
EClass_eAttributes.values.eType = EAttribute;
// eReferences
EClass_eReferences.eClass = EReference;
EClass_eReferences.values.eType = EReference;
// eIDAttribute
EClass_eIDAttribute.eClass = EReference;
EClass_eIDAttribute.values.eType = EAttribute;
// getEStructuralFeature
EClass_getEStructuralFeature.eClass = EOperation;
EClass_getEStructuralFeature.values.eType = EStructuralFeature;

// Set Types Hierarchy.
EModelElement.get<EList>('eSuperTypes')!.add(EObjectClass);
EAnnotation.get<EList>('eSuperTypes')!.add(EModelElement);
ENamedElement.get<EList>('eSuperTypes')!.add(EModelElement);
EPackage.get<EList>('eSuperTypes')!.add(ENamedElement);
EClassifier.get<EList>('eSuperTypes')!.add(ENamedElement);
EClass.get<EList>('eSuperTypes')!.add(EClassifier);
EDataType.get<EList>('eSuperTypes')!.add(EClassifier);
EEnum.get<EList>('eSuperTypes')!.add(EDataType);
EEnumLiteral.get<EList>('eSuperTypes')!.add(ENamedElement);
ETypedElement.get<EList>('eSuperTypes')!.add(ENamedElement);
EStructuralFeature.get<EList>('eSuperTypes')!.add(ETypedElement);
EAttribute.get<EList>('eSuperTypes')!.add(EStructuralFeature);
EReference.get<EList>('eSuperTypes')!.add(EStructuralFeature);
EOperation.get<EList>('eSuperTypes')!.add(ETypedElement);
EParameter.get<EList>('eSuperTypes')!.add(ETypedElement);
ETypeParameter.get<EList>('eSuperTypes')!.add(ENamedElement);
EGenericType.get<EList>('eSuperTypes')!.add(EObjectClass);

// ETypedElement
//  - attributes:
//      - ordered: Boolean
//      - unique: Boolean
//      - lowerBound: Integer
//      - upperBound: Integer
//      - many: Boolean
//      - required: Boolean
//  - references:
//      - eType: EClassifier

const ETypedElement_eType = new EObject(),
  ETypedElement_ordered = new EObject(),
  ETypedElement_unique = new EObject(),
  ETypedElement_lowerBound = new EObject(),
  ETypedElement_upperBound = new EObject(),
  ETypedElement_many = new EObject(),
  ETypedElement_required = new EObject();

ETypedElement_eType.eClass = EReference;
ETypedElement_eType.values = {
  name: 'eType',
  lowerBound: 0,
  upperBound: 1,
  containment: false,
  eType: EClassifier,
};
ETypedElement_ordered.eClass = EAttribute;
ETypedElement_ordered.values = {
  name: 'ordered',
  lowerBound: 0,
  upperBound: 1,
  defaultValueLiteral: 'true',
  defaultValue: true,
  eType: EBoolean,
};
ETypedElement_unique.eClass = EAttribute;
ETypedElement_unique.values = {
  name: 'unique',
  lowerBound: 0,
  upperBound: 1,
  defaultValueLiteral: 'true',
  defaultValue: true,
  eType: EBoolean,
};
ETypedElement_lowerBound.eClass = EAttribute;
ETypedElement_lowerBound.values = {
  name: 'lowerBound',
  lowerBound: 0,
  upperBound: 1,
  defaultValueLiteral: '0',
  defaultValue: 0,
  eType: EInt,
};
ETypedElement_upperBound.eClass = EAttribute;
ETypedElement_upperBound.values = {
  name: 'upperBound',
  lowerBound: 0,
  upperBound: 1,
  defaultValueLiteral: '1',
  defaultValue: 1,
  eType: EInt,
};
ETypedElement_many.eClass = EAttribute;
ETypedElement_many.values = {
  name: 'many',
  lowerBound: 0,
  upperBound: 1,
  eType: EBoolean,
  derived: true,
  _: function () {
    return this.get('upperBound') !== 1;
  },
};
ETypedElement_required.eClass = EAttribute;
ETypedElement_required.values = {
  name: 'required',
  lowerBound: 0,
  upperBound: 1,
  eType: EBoolean,
  derived: true,
  _: function () {
    return this.get('lowerBound') === 1;
  },
};

ETypedElement.get<EList>('eStructuralFeatures')!
  .add(ETypedElement_eType)
  .add(ETypedElement_ordered)
  .add(ETypedElement_unique)
  .add(ETypedElement_lowerBound)
  .add(ETypedElement_upperBound)
  .add(ETypedElement_many)
  .add(ETypedElement_required);

// EModelElement
//  - references:
//      - eAnnotations
//  - operations:
//      - getEAnnotation(source): EAnnotation

const EModelElement_eAnnotations = new EObject();
EModelElement_eAnnotations.eClass = EReference;
EModelElement_eAnnotations.values = {
  name: 'eAnnotations',
  eType: EAnnotation,
  lowerBound: 0,
  upperBound: -1,
  containment: true,
};

EModelElement.get<EList>('eStructuralFeatures')!.add(
  EModelElement_eAnnotations,
);

const ENamedElement_name = new EObject();
ENamedElement_name.eClass = EAttribute;
ENamedElement_name.values = {
  name: 'name',
  lowerBound: 0,
  upperBound: 1,
  eType: EString,
};

ENamedElement.get<EList>('eStructuralFeatures')!.add(ENamedElement_name);

const EStructuralFeature_changeable = EAttribute.create({
    name: 'changeable',
    eType: EBoolean,
  })!,
  EStructuralFeature_volatile = EAttribute.create({
    name: 'volatile',
    eType: EBoolean,
  })!,
  EStructuralFeature_transient = EAttribute.create({
    name: 'transient',
    eType: EBoolean,
  })!,
  EStructuralFeature_defaultValueLiteral = EAttribute.create({
    name: 'defaultValueLiteral',
    eType: EString,
  })!,
  EStructuralFeature_defaultValue = EAttribute.create({
    name: 'defaultValue',
    eType: JSObject,
    derived: true,
  })!,
  EStructuralFeature_unsettable = EAttribute.create({
    name: 'unsettable',
    eType: EBoolean,
  })!,
  EStructuralFeature_derived = EAttribute.create({
    name: 'derived',
    eType: EBoolean,
  })!;

EStructuralFeature.get<EList>('eStructuralFeatures')!
  .add(EStructuralFeature_changeable)
  .add(EStructuralFeature_volatile)
  .add(EStructuralFeature_transient)
  .add(EStructuralFeature_defaultValueLiteral)
  .add(EStructuralFeature_defaultValue)
  .add(EStructuralFeature_unsettable)
  .add(EStructuralFeature_derived);

EStructuralFeature_defaultValue.set({ derived: true });

const EReference_containment = EAttribute.create({
    name: 'containment',
    eType: EBoolean,
  }),
  EReference_container = EAttribute.create({
    name: 'container',
    eType: EBoolean,
  }),
  EReference_resolveProxies = EAttribute.create({
    name: 'resolveProxies',
    eType: EBoolean,
  }),
  EReference_eOpposite = EReference.create({
    name: 'eOpposite',
    eType: EReference,
  });

EReference.get<EList>('eStructuralFeatures')!
  .add(EReference_containment)
  .add(EReference_container)
  .add(EReference_resolveProxies)
  .add(EReference_eOpposite);

const EAttribute_iD = EAttribute.create({ name: 'iD', eType: EBoolean });
EAttribute.get<EList>('eStructuralFeatures')!.add(EAttribute_iD);

// Set attributes values for EClasses.

EObjectClass.set({ name: 'EObject' });
EModelElement.set({ name: 'EModelElement', abstract: true });
EAnnotation.set({ name: 'EAnnotation' });
ENamedElement.set({ name: 'ENamedElement', abstract: true });
EPackage.set({ name: 'EPackage' });
EClassifier.set({ name: 'EClassifier', abstract: true });
EDataType.set({ name: 'EDataType' });
EEnum.set({ name: 'EEnum' });
ETypedElement.set({ name: 'ETypedElement', abstract: true });
EStructuralFeature.set({ name: 'EStructuralFeature', abstract: true });
EAttribute.set({ name: 'EAttribute' });
EReference.set({ name: 'EReference' });
EOperation.set({ name: 'EOperation' });
EParameter.set({ name: 'EParameter' });
EEnumLiteral.set({ name: 'EEnumLiteral' });
ETypeParameter.set({ name: 'ETypeParameter' });
EGenericType.set({ name: 'EGenericType' });

const EOperation_eParameters = EReference.create({
  name: 'eParameters',
  eType: EParameter,
  containment: true,
  lowerBound: 0,
  upperBound: -1,
});

EOperation.get<EList>('eStructuralFeatures')!.add(EOperation_eParameters);

const EEnum_eLiterals = EReference.create({
  name: 'eLiterals',
  eType: EEnumLiteral,
  containment: true,
  lowerBound: 0,
  upperBound: -1,
});

EEnum.get<EList>('eStructuralFeatures')!.add(EEnum_eLiterals);

EEnumLiteral.get<EList>('eStructuralFeatures')!
  .add(EAttribute.create({ name: 'literal', eType: EString }))
  .add(EAttribute.create({ name: 'value', eType: EInt }));

// EStringToStringMapEntry
//  - attributes
//    - key: EString
//    - value: EString

export const EStringToStringMapEntry = EClass.create({
  name: 'EStringToStringMapEntry',
})!;

export const EStringToStringMapEntry_key = EAttribute.create({
  name: 'key',
  lowerBound: 0,
  upperBound: 1,
  eType: EString,
})!;

export const EStringToStringMapEntry_value = EAttribute.create({
  name: 'value',
  lowerBound: 0,
  upperBound: 1,
  eType: EString,
})!;

EStringToStringMapEntry.get<EList>('eStructuralFeatures')!
  .add(EStringToStringMapEntry_key)
  .add(EStringToStringMapEntry_value);

// EAnnotation
// - attributes:
//  - source: EString
// - references:
//  - details[*]: EStringToStringMapEntry

const EAnnotation_source = EAttribute.create({
  name: 'source',
  upperBound: 1,
  lowerBound: 0,
  eType: EString,
})!;
const EAnnotation_details = EReference.create({
  name: 'details',
  upperBound: -1,
  lowerBound: 0,
  containment: true,
  eType: EStringToStringMapEntry,
})!;

EAnnotation.get<EList>('eStructuralFeatures')!
  .add(EAnnotation_source)
  .add(EAnnotation_details);

// EGenericType
//

const EGenericType_eTypeParameter = EReference.create({
  name: 'eTypeParameter',
  eType: ETypeParameter,
  containment: false,
  lowerBound: 0,
  upperBound: 1,
})!;

const EGenericType_eUpperBound = EReference.create({
  name: 'eUpperBound',
  containment: true,
  eType: EGenericType,
})!;

const EGenericType_eLowerBound = EReference.create({
  name: 'eLowerBound',
  containment: true,
  eType: EGenericType,
})!;

const EGenericType_eTypeArguments = EReference.create({
  name: 'eTypeArguments',
  containment: true,
  upperBound: -1,
  eType: EGenericType,
})!;

const EGenericType_eClassifier = EReference.create({
  name: 'eClassifier',
  eType: EClassifier,
})!;

EGenericType.get<EList>('eStructuralFeatures')!
  .add(EGenericType_eTypeParameter)
  .add(EGenericType_eUpperBound)
  .add(EGenericType_eLowerBound)
  .add(EGenericType_eTypeArguments)
  .add(EGenericType_eClassifier);

const ETypedElement_eGenericType = EReference.create({
  name: 'eGenericType',
  upperBound: 1,
  containment: true,
  eType: EGenericType,
})!;

ETypedElement.get<EList>('eStructuralFeatures')!.add(
  ETypedElement_eGenericType,
);

const EClass_eGenericTypes = EReference.create({
  name: 'eGenericSuperTypes',
  upperBound: -1,
  containment: true,
  eType: EGenericType,
})!;

EClass.get<EList>('eStructuralFeatures')!.add(EClass_eGenericTypes);

const EOperation_eGenericExceptions = EReference.create({
  name: 'eGenericExceptions',
  upperBound: -1,
  containment: true,
  eType: EGenericType,
})!;

EOperation.get<EList>('eStructuralFeatures')!.add(
  EOperation_eGenericExceptions,
);

// ETypeParameter
//

const ETypeParameter_eBounds = EReference.create({
  name: 'eBounds',
  containment: true,
  upperBound: -1,
  eType: EGenericType,
})!;

const ETypeParameter_eGenericTypes = EReference.create({
  name: 'eGenericTypes',
  containment: false,
  upperBound: -1,
  eType: EGenericType,
})!;

ETypeParameter.get<EList>('eStructuralFeatures')!
  .add(ETypeParameter_eBounds)
  .add(ETypeParameter_eGenericTypes);

const EClassifier_eTypeParameters = EReference.create({
  name: 'eTypeParameters',
  upperBound: -1,
  containment: true,
  eType: ETypeParameter,
})!;

EClassifier.get<EList>('eStructuralFeatures')!.add(EClassifier_eTypeParameters);

const EOperation_eTypeParameters = EReference.create({
  name: 'eTypeParameters',
  upperBound: -1,
  containment: true,
  eType: ETypeParameter,
})!;

EOperation.get<EList>('eStructuralFeatures')!.add(EOperation_eTypeParameters);

// Setting core datatypes values

EString.eClass = EDataType;
EString.set({ name: 'EString' });
EInt.eClass = EDataType;
EInt.set({ name: 'EInt' });
EBoolean.eClass = EDataType;
EBoolean.set({ name: 'EBoolean' });
EDate.eClass = EDataType;
EDate.set({ name: 'EDate' });
EDouble.eClass = EDataType;
EDouble.set({ name: 'EDouble' });
EIntegerObject.eClass = EDataType;
EIntegerObject.set({ name: 'EIntegerObject' });
EFloatObject.eClass = EDataType;
EFloatObject.set({ name: 'EFloatObject' });
ELongObject.eClass = EDataType;
ELongObject.set({ name: 'ELongObject' });
EMap.eClass = EDataType;
EMap.set({ name: 'EMap' });
EDiagnosticChain.eClass = EDataType;
EDiagnosticChain.set({ name: 'EDiagnosticChain' });
JSObject.eClass = EDataType;
JSObject.set({ name: 'JSObject' });

// Additional datatypes

const ELong = EDataType.create({
  name: 'ELong',
})!;
const EFloat = EDataType.create({
  name: 'EFloat',
})!;
const EShort = EDataType.create({
  name: 'EShort',
})!;
const EDoubleObject = EDataType.create({
  name: 'EDoubleObject',
})!;

const EPackage_eClassifiers = EReference.create({
  name: 'eClassifiers',
  lowerBound: 0,
  upperBound: -1,
  containment: true,
  eType: EClassifier,
})!;

const EPackage_eSubPackages = EReference.create({
  name: 'eSubPackages',
  lowerBound: 0,
  upperBound: -1,
  containment: true,
  eType: EPackage,
})!;

EPackage.get<EList>('eStructuralFeatures')!
  .add(EAttribute.create({ name: 'nsURI', eType: EString }))
  .add(EAttribute.create({ name: 'nsPrefix', eType: EString }))
  .add(EPackage_eClassifiers)
  .add(EPackage_eSubPackages);

// EcorePackage

export const EcorePackage = EPackage.create({
  name: 'ecore',
  nsPrefix: 'ecore',
  nsURI: 'http://www.eclipse.org/emf/2002/Ecore',
})!;

EcorePackage.get<EList>('eClassifiers')!
  .add(EObjectClass)
  .add(EModelElement)
  .add(EAnnotation)
  .add(ENamedElement)
  .add(EPackage)
  .add(EClassifier)
  .add(EClass)
  .add(EDataType)
  .add(ETypedElement)
  .add(EStructuralFeature)
  .add(EAttribute)
  .add(EReference)
  .add(EOperation)
  .add(EParameter)
  .add(EEnum)
  .add(EEnumLiteral)
  .add(ETypeParameter)
  .add(EGenericType)
  .add(EStringToStringMapEntry)
  .add(EString)
  .add(EBoolean)
  .add(EInt)
  .add(EDouble)
  .add(EIntegerObject)
  .add(EFloatObject)
  .add(ELongObject)
  .add(EMap)
  .add(EDiagnosticChain)
  .add(EDate)
  .add(EShort)
  .add(EFloat)
  .add(ELong)
  .add(EDoubleObject)
  .add(JSObject);

// EPackage Registry
//
// Stores all created EPackages

export interface ERegistry {
  _ePackages: Record<any, any>;
  getEPackage: (nsURI: string) => any;
  register: (ePackage: typeof EPackage) => void;
  ePackages: () => any[];
  elements: (type: EObject | unknown) => any[];
}

EPackage.Registry = {
  _ePackages: {},

  getEPackage(nsURI: string) {
    return this._ePackages[nsURI];
  },

  register(ePackage: typeof EPackage) {
    if (!ePackage.isSet('nsURI')) {
      throw new Error('Cannot register EPackage without nsURI');
    }

    ePackage.get<EList>('eSubPackages')!.each((ePackage: any) => {
      this.register(ePackage);
    });

    this._ePackages[ePackage.get<string>('nsURI')!] = ePackage;
  },

  ePackages() {
    return Object.values(this._ePackages);
  },

  elements(type: EObject | unknown) {
    const filter = (el: any) => {
      if (!type) return true;
      else if ((type as EObject).eClass) {
        return el.eClass === type;
      } else {
        return el.eClass.get('name') === type;
      }
    };

    const ePackages = this.ePackages();
    const content = (eObject: EObject) => {
      return eObject.eContents().map((c: any) => {
        return [c, content(c)];
      });
    };
    const map = (p: typeof EPackage) => content(p);
    let contents = [ePackages, ePackages.map(map)];
    contents = contents.flat(Infinity);
    contents = contents.filter(filter);

    return contents;
  },
};

EPackage.Registry.register(EcorePackage);
