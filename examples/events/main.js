import { ResourceSet, EReference, EPackage, EAttribute, EClass, EString } from '../../dist/ecore.js';

function main() {

    let rs = ResourceSet.create();

    //
    // init model
    //

    let r = rs.create({ uri: 'res' });
    let p = EPackage.create({
        name: 'model',
        nsPrefix: 'model',
        nsURI: 'http://ecore.js/model'
    });
    let Person = EClass.create({
        name: 'Person'
    });
    let Person_name = EAttribute.create({
        name: 'name',
        eType: EString
    });
    Person.get('eStructuralFeatures').add(Person_name);
    p.get('eClassifiers').add(Person);
    r.get('contents').add(p);

    // listen to added features on Person

    Person.on('add:eStructuralFeatures', (feature) => {
        console.log(feature.get('name'), 'has been added');
    });

    let Person_knows = EReference.create({
        name: 'knows',
        upperBound: -1,
        eType: Person
    });
    Person.get('eStructuralFeatures').add(Person_knows);

    // create instances

    let p1 = Person.create();

    // listen to set feature

    p1.on('change', (f) => {
        console.log('change feature:', f, 'new value is:', p1.get(f));
    });

    let p2 = Person.create({ name: 'John' });
    let p3 = Person.create({ name: 'Phil' });

    let r2 = rs.create({ uri: 'r2' });
    r2.get('contents').add(p1).add(p2).add(p3);

    // listen to changes at resource level

    r2.on('add change', (o) => {
        console.log('object changed', o);
    });

    p1.get('knows').add(p2);
    p2.set('name', 'Victor');
    p1.get('knows').add(p3);

    p1.set('name', 'Paul');

    // stop events

    r2.off();

    p2.get('knows').add(p1);
};

window.onload = main;
