import fs from 'node:fs';
import { ResourceSet } from '../src/resource';
import { XMI } from '../src/xmi';
import { EList, EObject } from '../src/ecore';

let resourceSet = ResourceSet.create()!;
let resource = resourceSet.create({ uri: 'sample.json' })!;

function loaded(resource: EObject) {
  console.log(
    resource.get<EList>('contents')!.map((e) => {
      return { nsURI: e.get('nsURI') };
    }),
  );
}

fs.readFile('./test/simple.xmi', 'utf8', (err, data) => {
  if (err) return console.log(err);

  (resource as unknown as any).load(loaded, () => {}, JSON.parse(data), XMI);
});
