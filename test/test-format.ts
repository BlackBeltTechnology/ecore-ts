import fs from 'node:fs';
import { ResourceSet } from '../src/resource';
import { XMI } from '../src/xmi';

let resourceSet = ResourceSet!.create()!;
let resource = resourceSet.create({ uri: 'sample.json' })!;

function loaded(resource: any) {
  console.log(
    resource.get('contents').map((e: any) => {
      return { nsURI: e.get('nsURI') };
    }),
  );
}

fs.readFile('./test/simple.xmi', 'utf8', (err, data) => {
  if (err) return console.log(err);

  (resource as unknown as any).load(loaded, () => {}, JSON.parse(data), XMI);
});
