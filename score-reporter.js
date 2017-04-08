const minReporter = require('mocha/lib/reporters/min')
const inherits = require('mocha/lib/utils').inherits;

function scoreReporter(runner) {
  minReporter.call(this, runner);
	let level = 0;

	runner.scoreTree = {};
	let root = runner.scoreTree;

	runner.on('suite', s => {
		if (level === 1) {
			root[s.title] = {};
			root = root[s.title];
		}

		if (level === 2) {
			root[s.title] = {};
			root = root[s.title];
		}

		level++;
	});

	runner.on('pass', () => {
		root.passed = root.passed ? ++root.passed : 1;
		root.total = root.total ? ++root.total : 1;
	});

	runner.on('fail', () => {
    if (typeof root.passed === 'undefined') {
      root.passed = 0;
    }

		root.total = root.total ? ++root.total : 1;
	})

	runner.on('suite end', s => {
		if (level === 2) {
			root = runner.scoreTree;
		}

		if (level === 3) {
			root = runner.scoreTree[s.parent.title];
		}

		level--;
	});

  runner.on('end', () => {
    const scoreWeight = require('./score-weight.json');
    const { scoreTree } = runner;

    let total = 0;

    for (let className in scoreTree) {
      const suites = scoreTree[className];
      const classWeight = scoreWeight[className].weight;
      const suitesWieghts = scoreWeight[className].suitesWeights;

      for (let suiteName in suites) {
        const currentSuite = suites[suiteName];
        const currentSuiteCompleteness = currentSuite.passed / currentSuite.total;
        const totalSuiteWeight = Object.keys(suitesWieghts).map(key => suitesWieghts[key]).reduce((a, b) => a + b, 0);
        const currentSuiteWeight = suitesWieghts[suiteName];
        total += (currentSuiteWeight / totalSuiteWeight) * currentSuiteCompleteness * classWeight
      }
    }

    console.log('Total score:', total.toFixed(2));
    console.log('=================================');
  })
}

inherits(scoreReporter, minReporter);

module.exports = scoreReporter;
