import { ResourceSet, EPackage, EAttribute, EClass, EString, XMI } from '../../dist/ecore.js';

function main() {

    //
    // How to de/serailize xmi files with ecore.js.
    //
    // XMI is supported in the browser and in node via the sax-js library. Here's how
    // to use it:
    //

    // Create a model

    let p = EPackage.create({
        name: 'p',
        nsPrefix: 'p',
        nsURI: 'http://ecore.js/p',
        eClassifiers: [
            {
                eClass: EClass,
                name: 'Foo',
                eAnnotations: [
                    {
                        source: 'my-source',
                        details: [
                            {
                                key: 'myKey',
                                value: 'my value'
                            }
                        ]
                    }
                ],
                eStructuralFeatures: [
                    {
                        eClass: EAttribute,
                        name: 'bar',
                        eType: EString
                    }
                ]
            }
        ]
    });

    let rs = ResourceSet.create();
    let r = rs.create({ uri: 'p' });
    r.get('contents').add(p);

    let result = r.to(XMI, true);

    // Print the result

    console.log(result);

    // We can now try to load the xmi in another resource

    let r2 = rs.create({ uri: 'p2' });

    // Use the parse method

    r2.parse(result, XMI);

    let p2 = r2.get('contents').first();

    console.log('parsed', p2.get('name'));
    console.log('classes', p2.get('eClassifiers').map((c) => { return c.get('name'); }));
    console.log('annotations', p2.get('eClassifiers').first().get('eAnnotations').map((a) => {
        return a.get('source') + ' : ' + a.get('details').map((d) => { return d.get('key') + ' -> ' + d.get('value'); } );
    }));
    console.log('attributes', p2.get('eClassifiers').first().get('eStructuralFeatures').map((f) => {
        return f.get('name') + ' : ' + f.get('eType').get('name');
    }));

};

window.onload = main;
