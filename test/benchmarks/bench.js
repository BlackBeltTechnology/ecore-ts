/**
 * Figure out how long it takes for a method to execute.
 *
 * @param {func} method to test
 * @param {int} iterations number of executions.
 * @param {Array} args to pass in.
 * @param {T} context the context to call the method in.
 * @return {int} the time it took, in milliseconds to execute.
 */
export const bench = (method, iterations, args, context) => {
  let time = 0;
  let timer = (action) => {
    let d = +new Date();
    if (time < 1 || action === 'start') {
      time = d;
      return 0;
    } else if (action === 'stop') {
      let t = d - time;
      time = 0;
      return t;
    } else {
      return d - time;
    }
  };

  let result = [];
  let i = 0;
  timer('start');
  while (i < iterations) {
    result.push(method.apply(context, args));
    i++;
  }

  let execTime = timer('stop');

  if (typeof console === 'object') {
    console.log('Mean execution time was: ', execTime / iterations);
    console.log('Sum execution time was: ', execTime);
    console.log('Result of the method call was:', result[0]);
  }

  return execTime;
};
