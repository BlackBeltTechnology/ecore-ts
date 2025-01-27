import fs from 'node:fs';
import { expect, it, describe } from 'vitest';
import { EResource, ResourceSet } from '../src/resource';
import { XMI } from '../src/xmi';
import { EList, EPackage } from '../src/ecore';

describe('JSON Instances of complex model (test5.xmi)', () => {
  //Read and parse the model file
  let modelSet = ResourceSet.create()!;
  let model = modelSet.create<EResource>({ uri: 'test5.xmi' })!;
  let modelFile = fs.readFileSync('./test/models/test5.xmi', 'utf8');
  model.parse(modelFile, XMI);
  let firstElement = model.get<EList>('contents')!.first();
  EPackage.Registry.register(firstElement);

  // Begin testing of instances

  it('Should read minimized model (instance 1)', () => {
    let instanceSet = ResourceSet.create()!;
    let instance = instanceSet.create<EResource>({
      uri: 'test5-instance1.json',
    })!;
    let instanceFile = fs.readFileSync(
      './test/models/test5-instance1.json',
      'utf8',
    );
    (instance as unknown as any).parse(instanceFile);

    let instanceJSON = instance.to(JSON, true);
    let expectedJSON = {
      eClass: 'test5.xmi#//Info',
      subInfo: [
        {
          eClass: 'test5.xmi#//SubordinateInfo',
          name: 'subinfo1',
        },
        {
          eClass: 'test5.xmi#//SubordinateInfo',
          name: 'subinfo2',
        },
      ],
      name: 'info',
    };

    expect(JSON.stringify(instanceJSON)).toEqual(JSON.stringify(expectedJSON));
  });
});
