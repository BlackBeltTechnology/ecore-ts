//////////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////////

import fs from 'node:fs';
import { ResourceSet, EPackage, XMI } from '../../dist/ecore.js';

let resourceSet = ResourceSet.create();

//////////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////////
function processFile(file) {

  let resource = resourceSet.create({ uri : file });

  let fileContents = fs.readFileSync(file, 'utf8');

  if (catchError) {
    try {
      resource.parse(fileContents, XMI);
    } catch(err) {
      console.log('*** Failed parsing file: ' + file);
      console.trace(err);
      return;
    }
  } else {
    resource.parse(fileContents, XMI);
  }

  let firstElement = resource.get('contents').first();
  if(firstElement.eClass.values.name === 'EPackage') {
    // This is an EPackage, so add it to the registry
    console.log("::: Adding to registry: " + firstElement.get('name'));
    EPackage.Registry.register(firstElement);
  }

  if (showJSON) {
    console.log("::: JSON Dump of " + file);
    console.log(JSON.stringify(resource.to(JSON), null, 4));
  }

  if (showXMI) {
    console.log("::: XMI Dump of " + file);
    console.log(resource.to(XMI, true));
  }

}

//////////////////////////////////////////////////////////////////////////
//  Main Processing
//////////////////////////////////////////////////////////////////////////

let showJSON = false;
let showXMI = false;
let showModel = false;
let catchError = false;

for(let argidx = 2; argidx < process.argv.length; argidx++) {
  // Process each file that is passed on the command line
  let argument = process.argv[argidx];

  if (argument === "-showJSON") {
    showJSON = !showJSON;
  } else if (argument === "-showXMI") {
    showXMI = !showXMI;
  } else if (argument === "-catchError") {
    catchError = !catchError;
  } else {
    let fileName = argument;
    console.log('::: Processing ' + fileName);
    processFile(fileName);
  }
}
