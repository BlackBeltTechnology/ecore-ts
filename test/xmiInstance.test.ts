import fs from 'node:fs';
import { it, describe, expect } from 'vitest';
import { ResourceSet } from '../src/resource';
import { XMI } from '../src/xmi';
import { EPackage } from '../src/ecore';

describe('XMI Instances of complex model (test5.xmi)', () => {
  //Read and parse the model file
  let modelSet = ResourceSet!.create()!;
  let model = modelSet.create({ uri: 'test5.xmi' })!;
  let modelFile = fs.readFileSync('./test/models/test5.xmi', 'utf8');
  (model as unknown as any).parse(modelFile, XMI);
  let firstElement = model.get('contents').first();
  EPackage.Registry.register(firstElement);

  // Begin testing of instances

  it('should parse reflexive relations (instance 1)', () => {
    let instanceSet = ResourceSet!.create()!;
    let instance = instanceSet.create({ uri: 'test5-instance1.xmi' })!;
    let instanceFile = fs.readFileSync(
      './test/models/test5-instance1.xmi',
      'utf8',
    );
    (instance as unknown as any).parse(instanceFile, XMI);

    expect((instance as unknown as any).to(XMI, true)).toEqual(instanceFile);
  });

  it('should parse nested instance data (instance 2)', () => {
    let instanceSet = ResourceSet!.create()!;
    let instance = instanceSet.create({ uri: 'test5-instance2.xmi' })!;
    let instanceFile = fs.readFileSync(
      './test/models/test5-instance2.xmi',
      'utf8',
    );
    (instance as unknown as any).parse(instanceFile, XMI);

    let instanceJSON = (instance as unknown as any).to(JSON, false);
    let expectedJSON = {
      eClass: 'test5.xmi#//Simple',
      name: 'SimpleTest',
      info: [
        { eClass: 'test5.xmi#//Info', value: '1', name: 'Info 1' },
        {
          eClass: 'test5.xmi#//Info',
          value: '2',
          subInfo: [
            { eClass: 'test5.xmi#//SubordinateInfo', name: 'Sub 2-1' },
            {
              eClass: 'test5.xmi#//SubordinateInfo',
              test: 'true',
              name: 'Sub 2-2',
            },
            { eClass: 'test5.xmi#//SubordinateInfo', name: 'Sub 2-3' },
          ],
          name: 'Info 2',
        },
        { eClass: 'test5.xmi#//Info', value: '3', name: 'Info 3' },
      ],
    };
    //console.log(util.inspect(instanceJSON, false, null));
    expect(JSON.stringify(instanceJSON)).toEqual(JSON.stringify(expectedJSON));
    expect((instance as unknown as any).to(XMI, true)).toEqual(instanceFile);
  });

  it('should parse references (instances-3)', () => {
    let instanceSet = ResourceSet!.create()!;

    let instance3a = instanceSet.create({ uri: 'test5-instance3a.xmi' })!;
    let instance3b = instanceSet.create({ uri: 'test5-instance3b.xmi' })!;
    let instance3c = instanceSet.create({ uri: 'test5-instance3c.xmi' })!;

    let i3aFile = fs.readFileSync('./test/models/test5-instance3a.xmi', 'utf8');
    let i3bFile = fs.readFileSync('./test/models/test5-instance3b.xmi', 'utf8');
    let i3cFile = fs.readFileSync('./test/models/test5-instance3c.xmi', 'utf8');

    (instance3a as unknown as any).parse(i3aFile, XMI);
    (instance3b as unknown as any).parse(i3bFile, XMI);
    (instance3c as unknown as any).parse(i3cFile, XMI);

    expect((instance3a as unknown as any).to(XMI, true)).toEqual(i3aFile);
    expect((instance3b as unknown as any).to(XMI, true)).toEqual(i3bFile);
    expect((instance3c as unknown as any).to(XMI, true)).toEqual(i3cFile);
  });

  it('should parse attributes which are XMI elements (instance-5b)', () => {
    let instanceSet = ResourceSet!.create()!;
    let instance = instanceSet.create({ uri: 'test5-instance5b.xmi' })!;
    let instanceFile = fs.readFileSync(
      './test/models/test5-instance5b.xmi',
      'utf8',
    );
    (instance as unknown as any).parse(instanceFile, XMI);

    expect(instance.eContents()[0].values['newString']).toEqual('A string.');
    //equivalent: expect(instance.values.contents._internal[0].values.newString).toEqual('A String.');
  });

  it('should parse an XMI file with multiple instances and namespaces', () => {
    let newmodelSet = ResourceSet!.create()!;
    let newmodel = newmodelSet.create({ uri: 'test1.xmi' })!;
    let newmodelFile = fs.readFileSync('./test/models/test1.xmi', 'utf8');
    (newmodel as unknown as any).parse(newmodelFile, XMI);
    let newfirstElement = newmodel.get('contents').first();
    EPackage.Registry.register(newfirstElement);

    let multiInstanceSet = ResourceSet!.create()!;
    let multiInstance = multiInstanceSet.create({
      uri: 'test5-multipleinstances.xmi',
    })!;
    let multiInstanceFile = fs.readFileSync(
      './test/models/test5-multipleinstances.xmi',
      'utf8',
    );
    (multiInstance as unknown as any).parse(multiInstanceFile, XMI);

    expect((multiInstance as unknown as any).to(XMI, true)).toEqual(
      multiInstanceFile,
    );
  });

  it('should escape invalid characters in attributes when printing', () => {
    let instanceSet = ResourceSet!.create()!;
    let instance = instanceSet.create({ uri: 'test5-instance6.xmi' })!;
    let instanceFile = fs.readFileSync(
      './test/models/test5-instance6.xmi',
      'utf8',
    );
    (instance as unknown as any).parse(instanceFile, XMI);

    expect((instance as unknown as any).to(XMI, true)).toEqual(instanceFile);
  });

  it('should parse instances with xmi:id', () => {
    let instanceSet = ResourceSet!.create()!;
    let instance = instanceSet.create({ uri: 'test5-idtest1.xmi' })!;
    let instanceFile = fs.readFileSync(
      './test/models/test5-idtest1.xmi',
      'utf8',
    );
    (instance as unknown as any).parse(instanceFile, XMI);

    expect((instance as unknown as any).to(XMI, true)).toEqual(instanceFile);
  });

  it('should parse references via xmi:id and href', () => {
    let instanceSet = ResourceSet!.create()!;
    let instance1 = instanceSet.create({ uri: 'test5-idtest1.xmi' })!;
    let instance1File = fs.readFileSync(
      './test/models/test5-idtest1.xmi',
      'utf8',
    );
    (instance1 as unknown as any).parse(instance1File, XMI);

    let instance2 = instanceSet.create({ uri: 'test5-idtest2.xmi' })!;
    let instance2File = fs.readFileSync(
      './test/models/test5-idtest2.xmi',
      'utf8',
    );
    (instance2 as unknown as any).parse(instance2File, XMI);

    expect((instance2 as unknown as any).to(XMI, true)).toEqual(instance2File);
  });
});
