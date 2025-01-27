[Ecore](https://wiki.eclipse.org/Ecore/) ([EMF](https://wiki.eclipse.org/EMF/)) implementation in TypeScript.

## Content

* [Background](#background)
* [Install](#install)
* [Usage](#usage)
* [Contributing](#contributing)
* [History](https://github.com/BlackBeltTechnology/ecore-ts/releases)
* [License](#license)

## Background

This is a fork of [ecore.js](https://github.com/emfjson/ecore.js). As per discussed in [pull/47](https://github.com/emfjson/ecore.js/pull/47),
the original repository is no longer maintained and [BlackBeltTechnology](https://github.com/BlackBeltTechnology) will continue
the maintenance and implementation of potential new features here.

The original license can be found in [archive/LICENSE](./archive/LICENSE).

## Install

### Browser

Using the library as-is via CDN:

```html
<script type="module">
  import { EPackage, ResourceSet, EClass, EAttribute, EString } from 'https://unpkg.com/ecore-ts';

  const rs = ResourceSet.create();
  const hello = rs.create({ uri: 'hello' });
  const helloPackage = EPackage.create({ name: 'hello', nsPrefix: 'hello' , nsURI: 'https://ecore-ts.com/hello'});
  const helloClass = EClass.create({ name: 'Hello' });
  const worldAttribute = EAttribute.create({ name: 'world', eType: EString });

  helloClass.get('eStructuralFeatures').add(worldAttribute);
  helloPackage.get('eClassifiers').add(helloClass);
  hello.get('contents').add(helloPackage);

  console.log(hello.to(JSON));
</script>
```

### Node / NPM

Ecore.ts is available on NPM and can be use as a Node module. To install it simply use the following command from your terminal:

```
npm install ecore-ts
```

## Usage

### Create a model

```javascript
import { EPackage, ResourceSet, EClass, EReference, EAttribute, EString } from 'ecore-ts';

// Resources contain model elements and are identified by a URI.

const resourceSet = ResourceSet.create();
const resource = resourceSet.create({ uri: '/model.json' });

// EClass are used to define domain elements, they are identified
// by name and a set of structural features (attributes and references).

const User = EClass.create({
    name: 'User',
    eStructuralFeatures: [
        // EAttributes are used to define domain elements
        // elements properties.
        EAttribute.create({
            name: 'name',
            upperBound: 1,
            eType: EString
        }),
        // EReference are used to define links between domain
        // elements.
        EReference.create({
            name: 'friends',
            upperBound: -1,
            containment: false,
            eType: () => User,
        }),
    ],
});

// EPackages represent namespaces for a set of EClasses.
// It's properties name, nsURI and nsPrefix must be set.

const SamplePackage = EPackage.create({
    name: 'sample',
    nsURI: 'https://www.example.org/sample',
    nsPrefix: 'sample',
    eClassifiers: [
        User,
    ],
});

// Packages must be added directly to the model's Resource.

resource.add(SamplePackage);

```

Model Elements can also be created separately.

```javascript
import { EClass, EAttribute, EReference, EString } from 'ecore-ts';

const User = EClass.create({ name: 'User' });
const User_name = EAttribute.create({
   name: 'name',
   eType: EString,
});
const User_friends = EReference.create({
   name: 'friends',
   upperBound: -1,
   eType: User,
});
User.get('eStructuralFeatures').add(User_name);
User.get('eStructuralFeatures').add(User_friends);
```

### Create instances

```javascript
const u1 = User.create({ name: 'u1' });
const u2 = User.create({ name: 'u2' });
u1.get('friends').add(u2);

u1.get('friends').each((friend) => { console.log(friend) });
```

### JSON Support

JSON is the default serialization format supported by ecore.ts. The JSON format is
described [here](https://github.com/ghillairet/emfjson) and looks like this:

```json
{
    "eClass" : "/model.json#//User",
    "name" : "u1",
    "friends" : [
        { "$ref" : "/u2.json#/", "eClass": "/model.json#//User" },
        { "$ref" : "/u3.json#/", "eClass": "/model.json#//User" }
    ]
}
```

### XMI Support

Support for XMI has been added in version 0.3.0.

```javascript
import { ResourceSet, XMI } from 'ecore-ts';

var resourceSet = ResourceSet.create();
var resource = resourceSet.create({ uri: 'test2.xmi' });

resource.parse(data, XMI); // data being a string containing the XMI.

resource.to(XMI, true); // returns the XMI string

```

## Contributing

If you want to contribute to this project or simply build from the source, you first need to clone the project by executing the following command in your terminal.

```
> git clone git@github.com:BlackBeltTechnology/ecore-ts.git
```

To build the project or run the tests you first need to install [Node](http://nodejs.org/), [npm](https://www.npmjs.org/) (distributed with Node).

We recommend using [NVM](https://github.com/nvm-sh/nvm), with it, you can easily manage your NodeJS
versions similarly to virtualenvs.

If you are using NVM, all you need to do is to run the following in the repository root:

```bash
nvm install
```

The tests are written using the [Vitest](https://vitest.dev/) library. To run them, execute the following command:

```
> npm test
```

Running a build will create a new distribution in the folder dist. This is done by executing the command:

```
> npm run build
```

That's it, you are now ready to contribute to the project.

## License

Eclipse Public License - v 2.0
