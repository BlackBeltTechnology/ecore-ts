// JSON serializer and parser for EMF.
//
// See https://github.com/ghillairet/emfjson for details
// about the JSON format used for EMF Models.
//
//
import { isString, isUndefined, isObject, values, flatten } from 'lodash-es';
import {
  EAnnotation,
  EAttribute,
  EClass,
  EObject,
  EOperation,
  EPackage,
  EReference,
  EString,
  EStringToStringMapEntry,
  EcorePackage,
  JSObject,
  create,
} from './ecore.ts';

export let ResourceSet: EObject | undefined;

export const EJSON = {
  dataType: 'json',
  contentType: 'application/json',

  parse(model: any, data: any) {
    if (isString(data)) {
      data = JSON.parse(data);
    }

    const toResolve: any[] = [],
      resourceSet = model.get('resourceSet') || ResourceSet!.create();

    function processFeature(object: any, eObject: any) {
      if (!object || !eObject) return () => {};

      return (feature: any) => {
        if (!feature || feature.get('derived')) return;

        const featureName = feature.get('name'),
          value = object[featureName];

        if (typeof value !== 'undefined') {
          if (feature.isTypeOf('EAttribute')) {
            eObject.set(featureName, value);
          } else if (feature.get('containment')) {
            const eType = feature.get('eType');
            if (feature.get('upperBound') === 1) {
              eObject.set(featureName, parseObject(value, eType));
            } else {
              (value || []).forEach((val: any) => {
                eObject.get(featureName).add(parseObject(val, eType));
              });
            }
          } else {
            toResolve.push({ parent: eObject, feature: feature, value: value });
          }
        }
      };
    }

    function processAnnotation(node: any, eObject: any) {
      if (node.source) {
        eObject.set('source', node.source);
      }

      if (node.details) {
        if (Array.isArray(node.details)) {
        } else {
          const details = eObject.get('details');
          node.details.forEach((v: any, k: any) => {
            details.add(EStringToStringMapEntry.create({ key: k, value: v }));
          });
        }
      }
    }

    function resolveReferences() {
      const index: any = buildIndex(model);

      function setReference(
        parent: any,
        feature: any,
        value: any,
        isMany: any,
      ) {
        const ref = value.$ref;
        let resolved = index[ref];

        if (!resolved) {
          resolved = resourceSet.getEObject(ref);
        }

        if (resolved) {
          if (isMany) {
            parent.get(feature.get('name')).add(resolved);
          } else {
            parent.set(feature.get('name'), resolved);
          }
        }
      }

      toResolve.forEach((resolving) => {
        const parent = resolving.parent,
          feature = resolving.feature,
          value = resolving.value;

        if (feature.get('upperBound') === 1) {
          setReference(parent, feature, value, false);
        } else {
          (Array.isArray(value) ? value : [value]).forEach((val) => {
            setReference(parent, feature, val, true);
          });
        }
      });
    }

    function parseObject(object: any, eClass?: EObject) {
      let child;

      if (object && (eClass || object.eClass)) {
        if (object.eClass) {
          eClass = resourceSet.getEObject(object.eClass);
        }

        try {
          child = create(eClass);
        } catch (e) {
          throw new Error(
            'Cannot parse or cannot find EClass for object' +
              JSON.stringify(object),
          );
        }

        if (child) {
          if (object._id) {
            child._id = object._id;
          }

          if (eClass === EAnnotation) {
            processAnnotation(object, child);
          } else {
            eClass!
              .get('eAllStructuralFeatures')
              .forEach(processFeature(object, child));
          }
        }
      }

      return child;
    }

    if (Array.isArray(data)) {
      data.forEach((object) => {
        model.add(parseObject(object));
      });
    } else {
      model.add(parseObject(data));
    }

    resolveReferences();
  },

  to: (model: any) => {
    const contents = model.get('contents').array(),
      indexes: any = {};
    indexes[model.get('uri')] = buildIndex(model);

    function uri(owner: any, value: any) {
      const valueModel = value.eResource(),
        ownerModel = owner.eResource(),
        external = valueModel !== ownerModel;

      if (!valueModel || !ownerModel) return;
      if (!indexes[valueModel.get('uri')]) {
        indexes[valueModel.get('uri')] = buildIndex(valueModel);
      }

      const index = indexes[valueModel.get('uri')];
      for (const key in index) {
        if (index[key] === value) {
          return external ? valueModel.get('uri') + '#' + key : key;
        }
      }

      return null;
    }

    function processValue(object: any, value: any, isContainment: any) {
      if (isContainment === true) {
        return jsonObject(value);
      } else {
        return { $ref: uri(object, value), eClass: value.eClass.eURI() };
      }
    }

    function processFeature(object: any, data: any) {
      if (!object || !data) return () => {};

      return (num: any, key: any) => {
        if (key[0] === '_') return;
        const feature = object.eClass.getEStructuralFeature(key),
          isSet = object.isSet(key);

        if (!feature || !isSet || feature.get('derived')) return;

        const value = num,
          featureName = feature.get('name'),
          isMany = feature.get('upperBound') !== 1,
          isContainment = feature.get('containment');

        if (feature.isTypeOf('EAttribute')) {
          data[featureName] = value;
        } else {
          if (isMany) {
            data[featureName] = [];
            value.each((val: any) => {
              data[featureName].push(processValue(object, val, isContainment));
            });
          } else {
            data[featureName] = processValue(object, value, isContainment);
          }
        }
      };
    }

    function processAnnotation(object: any, data: any) {
      if (object.values.source) {
        data.source = object.values.source;
      }

      if (object.values.details && object.values.details.size() > 0) {
        data.details = {};
        object.values.details.each((e: any) => {
          const key = e.get('key');
          const value = e.get('value');
          if (key) {
            data.details[key] = value;
          }
        });
      }
    }

    function jsonObject(object: any) {
      const eClass = object.eClass,
        values = object.values,
        data: any = { eClass: eClass.eURI() };

      if (object._id) {
        data._id = object._id;
      }

      if (eClass === EAnnotation) {
        processAnnotation(object, data);
      } else {
        Object.entries(values).forEach(([key, value]) => {
          const cb = processFeature(object, data);
          cb(value, key);
        });
      }

      return data;
    }

    let data;
    if (contents.length === 1) {
      const eObject = contents[0];
      data = jsonObject(eObject);
    } else {
      data = [];
      for (let i = 0; i < contents.length; i++) {
        data.push(jsonObject(contents[i]));
      }
    }
    return data;
  },
};

// Resource

export const Resource = EClass.create({
  name: 'Resource',
  eSuperTypes: [EObject],
  eStructuralFeatures: [
    {
      eClass: EAttribute,
      name: 'uri',
      lowerBound: 1,
      upperBound: 1,
      eType: EString,
    },
    {
      eClass: EReference,
      name: 'contents',
      upperBound: -1,
      containment: true,
      eType: EObject,
    },
    {
      eClass: EReference,
      name: 'resourceSet',
      upperBound: 1,
      lowerBound: 0,
      eType: ResourceSet,
    },
  ],
  eOperations: [
    {
      eClass: EOperation,
      name: 'add',
      _: function (eObject: any) {
        if (!eObject && !eObject.eClass) return this;

        eObject.eContainer = this;
        (this as unknown as EObject).get('contents').add(eObject);

        return this;
      },
    },
    {
      eClass: EOperation,
      name: 'clear',
      _: function () {
        (this as unknown as EObject).get('contents').clear();
        return this;
      },
    },
    {
      eClass: EOperation,
      name: 'addAll',
      _: function (content: any) {
        if (Array.isArray(content)) {
          content.forEach((eObject) => {
            (this as unknown as any).add(eObject);
          });
        }

        return this;
      },
    },
    {
      eClass: EOperation,
      name: 'getEObject',
      eType: EObject,
      _: function (fragment: any) {
        if (!fragment) return null;

        if ((this as unknown as any)._index()[fragment]) {
          return (this as unknown as any)._index()[fragment];
        }
      },
    },
    {
      eClass: EOperation,
      name: 'each',
      _: function (iterator: any, context: any) {
        return (this as unknown as EObject)
          .get('contents')
          .each(iterator, context);
      },
    },
    {
      eClass: EOperation,
      name: 'to',
      _: function (formatter: any, indent: any) {
        if (formatter && typeof formatter.to === 'function')
          return formatter.to(this, indent);
        else return EJSON.to(this);
      },
    },
    {
      eClass: EOperation,
      name: 'parse',
      _: function (data: any, loader: any) {
        if (loader && typeof loader.parse === 'function')
          loader.parse(this, data);
        else EJSON.parse(this, data);
        return this;
      },
    },
    {
      eClass: EOperation,
      name: 'save',
      _: function (callback: any, options: any) {
        options || (options = {});

        const formatter = options.format ? options.format : EJSON;
        let data;
        try {
          data = (this as unknown as any).to(formatter);
        } catch (e) {
          callback(null, e);
        }

        callback(data, null);
      },
    },
    {
      eClass: EOperation,
      name: 'load',
      _: function (data: any, callback: any, options: any) {
        options || (options = {});

        const loader = options.format || EJSON;

        try {
          (this as unknown as any).parse(data, loader);
        } catch (e) {
          callback(null, e);
        }

        (this as unknown as EObject).trigger('change');
        if (typeof callback === 'function') {
          callback(this, null);
        }
      },
    },
    {
      eClass: EOperation,
      name: 'remove',
      _: function () {
        const resourceSet = (this as unknown as EObject).get('resourceSet');
        if (resourceSet) {
          resourceSet.get('resources').remove(this);
        }
        (this as unknown as any).clear();
      },
    },
    {
      eClass: EOperation,
      name: '_index',
      eType: JSObject,
      _: function () {
        if (isUndefined((this as unknown as any).__updateIndex)) {
          (this as unknown as any).__updateIndex = true;
          (this as unknown as any).on('add remove', () => {
            (this as unknown as any).__updateIndex = true;
          });
        }

        if ((this as unknown as any).__updateIndex) {
          (this as unknown as any).__index = buildIndex(this);
          (this as unknown as any).__updateIndex = false;
        }

        return (this as unknown as any).__index;
      },
    },
  ],
})! as EObject;

const EClassResource = Resource;

class URIConverter {
  public uriMap: Record<any, any> = {};

  map(key: any, value: any) {
    this.uriMap[key] = value;
  }

  normalize(uri: any): any {
    const split = uri.split('#'),
      base = split[0],
      normalized = this.uriMap[base];

    if (normalized) return normalized;

    let slashIndex = base.lastIndexOf('/') + 1,
      sliced,
      rest;

    sliced = base.slice(0, slashIndex);

    if (sliced === base) return uri;

    rest = base.slice(slashIndex, base.length);

    return this.normalize(sliced) + rest;
  }
}

// ResourceSet
//

ResourceSet = EClass.create({
  name: 'ResourceSet',
  eSuperTypes: [EObject],
  eStructuralFeatures: [
    {
      eClass: EAttribute,
      name: 'uri',
      upperBound: 1,
      lowerBound: 0,
      eType: EString,
    },
    {
      eClass: EReference,
      name: 'resources',
      upperBound: -1,
      containment: true,
      eType: EClassResource,
    },
  ],
  eOperations: [
    {
      eClass: EOperation,
      eType: Resource,
      upperBound: 1,
      name: 'create',
      _: function (uri: any) {
        const attrs: any = isObject(uri) ? uri : { uri: uri };

        if (!attrs.uri) {
          throw new Error('Cannot create Resource, missing URI parameter');
        }

        let resource = (this as unknown as EObject)
          .get('resources')
          .find((e: any) => e.get('uri') === attrs.uri);

        if (resource) return resource;

        resource = Resource.create(attrs);
        resource.set('resourceSet', this);
        (this as unknown as EObject).get('resources').add(resource);
        (this as unknown as EObject).trigger('add', resource);

        return resource;
      },
    },
    {
      eClass: EOperation,
      eType: EObject,
      upperBound: 1,
      name: 'getEObject',
      _: function (uri: any) {
        let split = uri.split('#'),
          base = split[0],
          fragment = split[1],
          resource: any;

        if (!fragment) {
          return null;
        }

        const ePackage = EPackage.Registry.getEPackage(base);

        if (ePackage) {
          resource = ePackage.eResource();

          if (!resource) {
            resource = (this as unknown as EObject).create({ uri: base });
            resource.add(ePackage);
            (this as unknown as EObject).get('resources').add(resource);
            resource.set('resourceSet', this);
          }
        }

        if (resource) {
          return resource.getEObject(fragment);
        }

        resource = (this as unknown as EObject)
          .get('resources')
          .find((e: any) => e.get('uri') === base);

        return resource ? resource.getEObject(fragment) : null;
      },
    },
    {
      eClass: EOperation,
      eType: EObject,
      upperBound: -1,
      name: 'elements',
      _: function (type: any) {
        const filter = (el: any) => (!type ? true : el.isKindOf(type));
        const contents = (this as unknown as EObject)
          .get('resources')
          .map((m: any) => values(m._index()).filter(filter));
        return flatten(contents);
      },
    },
    {
      eClass: EOperation,
      eType: JSObject,
      upperBound: 1,
      name: 'uriConverter',
      _: function () {
        if (!(this as unknown as any)._converter) {
          (this as unknown as any)._converter = new URIConverter();
        }

        return (this as unknown as any)._converter;
      },
    },
    {
      eClass: EOperation,
      eType: JSObject,
      upperBound: 1,
      name: 'toJSON',
      _: function () {
        const result: any = {
          total: (this as unknown as EObject).get('resources').size(),
          resources: [],
        };

        (this as unknown as EObject).get('resources').each((resource: any) => {
          result.resources.push({
            uri: resource.get('uri'),
            length: resource.get('contents').size(),
            contents: resource.get('contents').map((c: any) => {
              return { eURI: c.eURI(), eClass: c.eClass.eURI() };
            }),
          });
        });

        return result;
      },
    },
    {
      eClass: EOperation,
      name: 'parse',
      _: function (data: any) {
        if (!data || !data.resources) return;

        data.resources.forEach((resource: any) => {
          if (resource.uri) {
            const resourceSet = (this as unknown as any).get('resourceSet');
            if (resourceSet) {
              resourceSet.create({ uri: resource.uri });
            }
          }
        });
      },
    },
  ],
})!;

const EClassResourceSet = ResourceSet;

EClassResource.getEStructuralFeature('resourceSet').set(
  'eType',
  EClassResourceSet,
);

const EPackageResource = EPackage.create({
  name: 'resources',
  nsPrefix: 'resources',
  nsURI: 'http://www.eclipselabs.org/ecore/2012/resources',
  eClassifiers: [EClassResourceSet, EClassResource],
})!;

const EcoreResource = Resource.create({ uri: EcorePackage.get('nsURI') })!;
(EcoreResource as unknown as any).add(EcorePackage);
const ResourceResource = Resource.create({
  uri: EPackageResource.get('nsURI'),
})!;
(ResourceResource as unknown as any).add(EPackageResource);

EPackage.Registry.register(EPackageResource);

function buildIndex(model: any) {
  const index: any = {},
    contents = model.get('contents').array();

  if (contents.length) {
    const build = (object: any, idx: any) => {
      const eContents = object.eContents();
      index[idx] = object;

      eContents.forEach((e: any) => {
        build(e, e.fragment());
      });
    };

    let root, iD;
    if (contents.length === 1) {
      root = contents[0];
      if (root._id) {
        build(root, root._id);
      } else {
        iD = root.eClass.get('eIDAttribute') || null;
        if (iD) {
          build(root, root.get(iD.get('name')));
        } else {
          build(root, '/');
        }
      }
    } else {
      for (let i = 0; i < contents.length; i++) {
        root = contents[i];
        if (root._id) {
          build(root, root._id);
        } else {
          iD = root.eClass.get('eIDAttribute') || null;
          if (iD) {
            build(root, root.get(iD.get('name')));
          } else {
            build(root, '/' + i);
          }
        }
      }
    }
  }

  return index;
}
