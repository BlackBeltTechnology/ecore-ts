#!/bin/bash

set -e

node simpleTest.js TestModel.ecore
node simpleTest.js TestModel.ecore test1.testmodel
node simpleTest.js TestModel.ecore test2.testmodel
node simpleTest.js TestModel.ecore test1.testmodel test2.testmodel
node simpleTest.js TestModel.ecore test3a.testmodel test3b.testmodel test3c.testmodel
node simpleTest.js TestModel.ecore test4a.testmodel test4b.testmodel
