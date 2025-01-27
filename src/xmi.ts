import { difference } from 'lodash-es';
import sax from 'sax';
import { EList, create } from './ecore.ts';
import { EResource, EResourceSet, Resource, ResourceSet } from './resource.ts';

export const XMI = {
  dataType: 'xml',
  contentType: 'application/xml',

  parse(model: EResource, data: any) {
    if (!sax) throw new Error('Sax is missing.');

    const parser = sax.parser(true),
      resourceSet =
        model.get<EResourceSet>('resourceSet') ||
        ResourceSet!.create<EResourceSet>()!,
      namespaces: any[] = [];

    function findNamespaces(attributes: Record<any, any>) {
      if (!attributes) return;

      Object.entries(attributes).forEach(([key, num]) => {
        if (key.indexOf(':') !== -1) {
          const split = key.split(':');
          if (split[0] === 'xmlns') {
            namespaces.push({ prefix: split[1], uri: num });
          }
        }
      });
    }

    function getNamespace(prefix: string) {
      const ns = namespaces.find((ns) => ns.prefix === prefix);

      return ns ? ns.uri : null;
    }

    function isPrefixed(node: any) {
      return isPrefixedString(node.name);
    }

    function isPrefixedString(string: string) {
      return string.indexOf(':') !== -1;
    }

    function getClassURIFromPrefix(value: string) {
      const split = value.split(':'),
        prefix = split[0],
        className = split[1];

      return getNamespace(prefix) + '#//' + className;
    }

    function getClassURIFromFeatureType(node: any) {
      let eClass;

      if (node.parent && node.parent.eObject) {
        let parent = currentNode.parent.eObject,
          name = node.name,
          eFeature = parent.eClass.getEStructuralFeature(name),
          eType;

        if (eFeature && eFeature.get) {
          eType = eFeature.get('eType');
          const aType = node.attributes['xsi:type'];
          if (aType) {
            eClass = resourceSet.getEObject(getClassURIFromPrefix(aType));
          } else {
            eClass = eType;
          }
        }
      }

      return eClass;
    }

    function findEClass(node: any) {
      if (isPrefixed(node)) {
        return resourceSet.getEObject(getClassURIFromPrefix(node.name));
      } else {
        return getClassURIFromFeatureType(node);
      }
    }

    let currentNode: any,
      rootObject: any,
      toResolve: any = [];

    parser.ontext = (text: string) => {
      if (currentNode && currentNode.waitingForAttributeText) {
        // The attribute was provided as an XMI element,
        // so store it to the parent node as an attribute.
        currentNode.parent.eObject.set(currentNode.name, text);
      }
    };

    parser.onopentag = (node: any) => {
      let eClass, eObject: any, eFeature, parentObject;

      findNamespaces(node.attributes);

      node.children = [];
      node.parent = currentNode;
      if (node.parent) node.parent.children.push(node);
      currentNode = node;

      eClass = findEClass(node);
      if (eClass) {
        const nodeIsAnAttribute =
          currentNode.parent &&
          currentNode.parent.eObject &&
          currentNode.parent.eObject.eClass
            .getEStructuralFeature(node.name)
            .isTypeOf('EAttribute');
        if (nodeIsAnAttribute) {
          // Set flag for parser.context to process and store attribute text
          node.waitingForAttributeText = true;
        } else {
          eObject = currentNode.eObject = create(eClass);

          if (!rootObject) {
            rootObject = eObject;
          }

          Object.entries(node.attributes).forEach(([key, num]) => {
            if (eObject.has(key)) {
              eFeature = eObject.eClass.getEStructuralFeature(key);
              if (eFeature.isTypeOf('EAttribute')) {
                eObject.set(key, num);
              } else {
                toResolve.push({
                  parent: eObject,
                  feature: eFeature,
                  value: num,
                });
              }
            }
            // Special processing for xmi:id's
            if (key === 'xmi:id') {
              eObject._id = num;
            }
          });

          if (node.parent) {
            parentObject = node.parent.eObject;
            if (parentObject && parentObject.has(node.name)) {
              eFeature = parentObject.eClass.getEStructuralFeature(node.name);
              if (eFeature.get('containment')) {
                if (eFeature.get('upperBound') === 1) {
                  parentObject.set(node.name, eObject);
                } else {
                  parentObject.get(node.name).add(eObject);
                }
              } else {
                // resolve proxy element from href
                const attrs = node.attributes;
                const href = attrs ? attrs.href : null;
                if (href) {
                  toResolve.push({
                    parent: parentObject,
                    feature: eFeature,
                    value: href,
                  });
                }
              }
            } else {
              // There are multiple rootObjects.
              if (rootObject && rootObject !== eObject) {
                // There is already a rootObject that has been processed.
                model.add(rootObject);
                rootObject = eObject;
              }
            }
          }
        }
      } else if (eClass === undefined) {
        throw new Error(node.name + ' has undefined/invalid eClass.');
      } //again, eClass may be null
    };

    parser.onclosetag = (_: any) => {
      let parentObject;
      if (currentNode && currentNode.parent) {
        parentObject = currentNode.parent;
        delete currentNode.parent;
        currentNode = parentObject;
      }
    };

    function resolveReferences() {
      const index = model._index();

      function isLocal(uri: any) {
        return uri.substring(0, 1) === '/';
      }

      function setReference(parent: any, feature: any, value: any) {
        let refs = value.split(/\s/),
          isMany = feature.get('upperBound') !== 1,
          resolved;

        if (refs[0] === 'ecore:EDataType') {
          // Throw out first part as it will resolve to a null reference.
          // The second element contains the actual eType
          refs.shift();
        }

        refs.forEach((ref: any) => {
          if (ref[0] === '#') ref = ref.substring(1, ref.length);

          if (isLocal(ref)) {
            resolved = index[ref];
          } else {
            resolved = resourceSet.getEObject(ref);
            if (resolved === null) {
              console.log('Warning: ' + ref + ' is an unresolved reference');
            }
          }
          if (resolved) {
            if (isMany) {
              parent.get(feature.get('name')).add(resolved);
            } else {
              parent.set(feature.get('name'), resolved);
            }
          } else if (resolved === undefined) {
            //Note: resolved is null in certain valid situations
            throw new Error('Undefined reference: ' + ref);
          }
        });
      }

      toResolve.forEach((resolving: any) => {
        const parent = resolving.parent,
          feature = resolving.feature,
          value = resolving.value;

        setReference(parent, feature, value);
      });
    }

    parser.write(data).close();
    model.add(rootObject);
    resolveReferences();
  },

  to: (model: any, indent?: boolean) => {
    let docRoot = '',
      contents = model.get('contents').array(),
      nsPrefix: string,
      nsURI: string,
      contentsFeature = Resource.getEStructuralFeature('contents');

    function escapeXML(text: any) {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };

      return text.replace(/[&<>"']/g, (m: any) => map[m]);
    }

    function processElement(root: any, isSingleInstance?: boolean) {
      docRoot += '<';

      let element;
      if (
        root.eContainingFeature &&
        root.eContainingFeature !== contentsFeature
      ) {
        element = root.eContainingFeature.get('name');
      } else {
        element = nsPrefix + ':' + root.eClass.get('name');
      }

      docRoot += element;

      if (root.eContainer.isKindOf('Resource')) {
        // This is an instance at the top level of the resource
        if (isSingleInstance) {
          // This is the only instance in the resource
          docRoot += ' xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI"';
          docRoot += ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
          docRoot += ' xmlns:' + nsPrefix + '="' + nsURI + '"';
        }
      } else {
        // This is a nested element, need to check if subtype is needed
        if (root.eContainingFeature.get('eType') !== root.eClass) {
          docRoot += ' xsi:type="';
          docRoot += nsPrefix + ':' + root.eClass.get('name') + '"';
        }
      }

      const features = root.eClass.get('eAllStructuralFeatures'),
        attributes = features.filter(
          (feature: any) =>
            !feature.get('derived') &&
            feature.isTypeOf('EAttribute') &&
            root.isSet(feature.get('name')),
        ),
        references = features.filter(
          (feature: any) =>
            !feature.get('derived') &&
            feature.isTypeOf('EReference') &&
            !feature.get('containment') &&
            root.isSet(feature.get('name')),
        );

      // Write the xmi:id if necessary
      if (root._id) {
        docRoot += ' xmi:id="' + root._id + '"';
      }

      attributes.forEach((feature: any) => {
        const featureName = feature.get('name'),
          value = root.get(featureName);

        if (value !== undefined && value !== 'false') {
          docRoot += ' ' + featureName + '="';
          if (typeof value === 'string') {
            docRoot += escapeXML(value);
          } else {
            docRoot += value;
          }
          docRoot += '"';
        }
      });

      const externals: any[] = [];

      references.forEach((feature: any) => {
        const value = root.get(feature.get('name'));
        const arrayValue =
          value instanceof EList ? value.array() : value ? [value] : [];
        const externs = arrayValue.filter(
          (v) => v.eResource() !== root.eResource(),
        );
        if (externs.length) externals.push({ feature: feature, refs: externs });

        const internals = difference(arrayValue, externs);

        const refs = internals.map((v) => v.fragment());
        if (refs.length) {
          docRoot += ' ' + feature.get('name') + '="' + refs.join(' ') + '"';
        }
      });

      if (root.eContents().length === 0 && externals.length === 0) {
        docRoot += '/>';
      } else {
        docRoot += '>';

        externals.forEach((ext) => {
          let feature = ext.feature,
            refs = ext.refs,
            isAbstract = feature.get('eType').get('abstract'),
            prefix;

          refs.forEach((ref: any) => {
            docRoot += '<' + feature.get('name');
            if (isAbstract) {
              prefix = ref.eClass.eContainer.get('nsPrefix');
              docRoot +=
                ' xsi:type="' +
                (prefix ? prefix + ':' : '') +
                ref.eClass.get('name') +
                '"';
            }
            docRoot += ' href="' + ref.eURI() + '"' + ' />';
          });
        });

        const containments = features.filter(
          (feature: any) =>
            feature.isTypeOf('EReference') &&
            feature.get('containment') &&
            root.isSet(feature.get('name')),
        );

        containments.forEach((feature: any) => {
          const values = root.get(feature.get('name'));
          if (feature.get('upperBound') !== 1) {
            values.each((value: any) => {
              processElement(value);
            });
          } else {
            processElement(values);
          }
        });

        docRoot += '</' + element + '>';
      }

      return docRoot;
    }

    // Process the instance(s) in the resource
    if (contents.length === 1) {
      // There is only one instance in this resource
      nsPrefix = contents[0].eClass.eContainer.get('nsPrefix');
      nsURI = contents[0].eClass.eContainer.get('nsURI');
      processElement(contents[0], true);
    } else {
      // There are multiple instances in this resource
      const namespaces: any = {}; // Used to store unique namespaces

      for (const i in contents) {
        nsPrefix = contents[i].eClass.eContainer.get('nsPrefix');
        nsURI = contents[i].eClass.eContainer.get('nsURI');
        namespaces[nsPrefix] = nsURI;
        processElement(contents[i]);
      }

      // Construct the namespace portion of the XMI element
      let nsString = '';
      for (const nsKey in namespaces) {
        nsString += ' xmlns:' + nsKey + '="' + namespaces[nsKey] + '"';
      }

      // Wrap the processed elements with the XMI element
      docRoot =
        '<xmi:XMI xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
        nsString +
        '>' +
        docRoot +
        '</xmi:XMI>';
    }

    // Format the final result
    docRoot = indent ? formatXml(docRoot) : docRoot;
    docRoot = '<?xml version="1.0" encoding="UTF-8"?>\n' + docRoot;

    return docRoot;
  },
};

function formatXml(xml: string) {
  const reg = /(>)(<)(\/*)/g,
    wsexp = / *([^ ].*[^ ]) *\n/g,
    contexp = /(<.+>)(.+\n)/g;

  xml = xml
    .replace(reg, '$1\n$2$3')
    .replace(wsexp, '$1\n')
    .replace(contexp, '$1\n$2');

  let formatted = '',
    lines = xml.split('\n'),
    indent = 0,
    lastType = 'other';

  // 4 types of tags - single, closing, opening, other (text, doctype, comment) - 4*4 = 16 transitions
  const transitions: Record<string, number> = {
    'single->single': 0,
    'single->closing': -1,
    'single->opening': 0,
    'single->other': 0,
    'closing->single': 0,
    'closing->closing': -1,
    'closing->opening': 0,
    'closing->other': 0,
    'opening->single': 1,
    'opening->closing': 0,
    'opening->opening': 1,
    'opening->other': 1,
    'other->single': 0,
    'other->closing': -1,
    'other->opening': 0,
    'other->other': 0,
  };

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const single = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
    const closing = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
    const opening = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
    const type = single
      ? 'single'
      : closing
        ? 'closing'
        : opening
          ? 'opening'
          : 'other';
    const fromTo = lastType + '->' + type;
    lastType = type;
    let padding = '';

    indent += transitions[fromTo];
    for (let j = 0; j < indent; j++) {
      padding += '    ';
    }

    formatted += padding + ln + '\n';
  }

  return formatted;
}
