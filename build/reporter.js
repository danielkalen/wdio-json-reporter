'use strict';

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

/**
 * Initialize a new `Json` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */

var JsonReporter = (function (_events$EventEmitter) {
    _inherits(JsonReporter, _events$EventEmitter);

    function JsonReporter(baseReporter, config) {
        var _this = this;

        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

        _classCallCheck(this, JsonReporter);

        _get(Object.getPrototypeOf(JsonReporter.prototype), 'constructor', this).call(this);

        this.baseReporter = baseReporter;
        this.config = config;
        this.options = options;

        var epilogue = this.baseReporter.epilogue;

        if (options.combined) {
            var resultJsons = [];
        }

        if (options.stream) {
            var output, data, stats;
            this.on('start', function (data) {
                output = ['start', {}];
                console.log(output);
            });
            this.on('end', function () {
                stats = _this.baseReporter.stats;
                data = ({ start: stats.start, end: stats.end, duration: stats._duration })[('suites', 'tests', 'passes', 'failures', 'pending')].forEach(function (item) {
                    return data[item] = stats.counts[item];
                });
                output = ['end', data];
                console.log(output);
            });
            this.on('suite:start', function (data) {
                output = ['suite', { title: data.title, fullTitle: data.fullTitle, parent: data.parent }];
                console.log(output);
            });
            this.on('test:end', function (arg) {
                stats = baseReporter.stats.runners[arg.cid].specs[arg.specHash].suites[arg.parentUid].tests[arg.uid];
                data = { title: arg.title, fullTitle: arg.fullTitle, duration: stats._duration };
                if (stats.state === 'fail') {
                    data.err = stats.error.message;
                    data.stack = stats.error.stack;
                    data.expected = stats.error.expected;
                    data.actual = stats.error.actual;
                }
                output = [stats.state, data];
                console.log(output);
            });
        } else {
            this.on('end', function () {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _getIterator(_Object$keys(_this.baseReporter.stats.runners)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var cid = _step.value;

                        var runnerInfo = _this.baseReporter.stats.runners[cid];
                        var start = _this.baseReporter.stats.start;
                        var end = _this.baseReporter.stats.end;
                        var json = _this.prepareJson(start, end, runnerInfo);
                        if (options.combined) {
                            resultJsons.push(json);
                        } else {
                            _this.write(json, runnerInfo.sanitizedCapabilities, cid);
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator['return']) {
                            _iterator['return']();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                if (options.combined) {
                    _this.combineJsons(resultJsons);
                }
                if (!options.suppressEpilogue) {
                    epilogue.call(baseReporter);
                }
            });
        }
    }

    _createClass(JsonReporter, [{
        key: 'prepareJson',
        value: function prepareJson(start, end, runnerInfo) {
            var resultSet = {};
            var skippedCount = 0;
            var passedCount = 0;
            var failedCount = 0;
            resultSet.start = start;
            resultSet.end = end;
            resultSet.capabilities = runnerInfo.capabilities;
            resultSet.host = runnerInfo.config.host;
            resultSet.port = runnerInfo.config.port;
            resultSet.baseUrl = runnerInfo.config.baseUrl;
            resultSet.waitForTimeout = runnerInfo.config.waitForTimeout;
            resultSet.framework = runnerInfo.config.framework;
            resultSet.mochaOpts = runnerInfo.config.mochaOpts;
            resultSet.suites = [];

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(_Object$keys(runnerInfo.specs)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var specId = _step2.value;

                    var spec = runnerInfo.specs[specId];

                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = _getIterator(_Object$keys(spec.suites)), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var suiteName = _step3.value;

                            var suite = spec.suites[suiteName];
                            var testSuite = {};

                            testSuite.name = suite.title;
                            testSuite.duration = suite._duration;
                            testSuite.start = suite.start;
                            testSuite.end = suite.end;
                            testSuite.tests = [];
                            testSuite.hooks = [];

                            var _iteratorNormalCompletion4 = true;
                            var _didIteratorError4 = false;
                            var _iteratorError4 = undefined;

                            try {
                                for (var _iterator4 = _getIterator(_Object$keys(suite.hooks)), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                    var hookName = _step4.value;

                                    var hook = suite.hooks[hookName];
                                    var hookResult = {};

                                    hookResult.start = hook.start;
                                    hookResult.end = hook.end;
                                    hookResult.duration = hook.duration;
                                    hookResult.title = hook.title;
                                    hookResult.associatedSuite = hook.parent;
                                    hookResult.associatedTest = hook.currentTest;
                                    testSuite.hooks.push(hookResult);
                                }
                            } catch (err) {
                                _didIteratorError4 = true;
                                _iteratorError4 = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion4 && _iterator4['return']) {
                                        _iterator4['return']();
                                    }
                                } finally {
                                    if (_didIteratorError4) {
                                        throw _iteratorError4;
                                    }
                                }
                            }

                            var _iteratorNormalCompletion5 = true;
                            var _didIteratorError5 = false;
                            var _iteratorError5 = undefined;

                            try {
                                for (var _iterator5 = _getIterator(_Object$keys(suite.tests)), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                                    var testName = _step5.value;

                                    var test = suite.tests[testName];
                                    var testCase = {};

                                    testCase.name = test.title;
                                    testCase.start = test.start;
                                    testCase.end = test.end;
                                    testCase.duration = test.duration;

                                    if (test.state === 'pending') {
                                        skippedCount = skippedCount + 1;
                                        testCase.state = 'skipped';
                                    } else if (test.state === 'pass') {
                                        passedCount = passedCount + 1;
                                        testCase.state = test.state;
                                    } else if (test.state === 'fail') {
                                        failedCount = failedCount + 1;
                                        testCase.state = test.state;
                                    } else {
                                        testCase.state = test.state;
                                    }

                                    if (test.error) {
                                        if (test.error.type) {
                                            testCase.errorType = test.error.type;
                                        }
                                        if (test.error.message) {
                                            testCase.error = test.error.message;
                                        }
                                        if (test.error.stack) {
                                            testCase.standardError = test.error.stack;
                                        }
                                    }

                                    testSuite.tests.push(testCase);
                                }
                            } catch (err) {
                                _didIteratorError5 = true;
                                _iteratorError5 = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion5 && _iterator5['return']) {
                                        _iterator5['return']();
                                    }
                                } finally {
                                    if (_didIteratorError5) {
                                        throw _iteratorError5;
                                    }
                                }
                            }

                            resultSet.state = {};
                            resultSet.state.passed = passedCount;
                            resultSet.state.failed = failedCount;
                            resultSet.state.skipped = skippedCount;
                            resultSet.suites.push(testSuite);
                        }
                    } catch (err) {
                        _didIteratorError3 = true;
                        _iteratorError3 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                                _iterator3['return']();
                            }
                        } finally {
                            if (_didIteratorError3) {
                                throw _iteratorError3;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                        _iterator2['return']();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            return resultSet;
        }
    }, {
        key: 'combineJsons',
        value: function combineJsons(resultJsons) {
            var resultSet = {};
            var runnerInfo = resultJsons[0];
            resultSet.state = {};
            resultSet.state.passed = 0;
            resultSet.state.failed = 0;
            resultSet.state.skipped = 0;
            resultSet.start = runnerInfo.start;
            resultSet.end = runnerInfo.end;
            resultSet.capabilities = runnerInfo.capabilities;
            resultSet.host = runnerInfo.host;
            resultSet.port = runnerInfo.port;
            resultSet.baseUrl = runnerInfo.baseUrl;
            resultSet.waitForTimeout = runnerInfo.waitForTimeout;
            resultSet.framework = runnerInfo.framework;
            resultSet.mochaOpts = runnerInfo.mochaOpts;
            resultSet.suites = [];

            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = _getIterator(resultJsons), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var json = _step6.value;

                    resultSet.suites.push.apply(resultSet.suites, json.suites);
                    if (json.state) {
                        resultSet.state.passed += json.state.passed;
                        resultSet.state.skipped += json.state.skipped;
                        resultSet.state.failed += json.state.failed;
                    }
                }
            } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion6 && _iterator6['return']) {
                        _iterator6['return']();
                    }
                } finally {
                    if (_didIteratorError6) {
                        throw _iteratorError6;
                    }
                }
            }

            this.write(resultSet, resultJsons[0].capabilities.browserName);
        }
    }, {
        key: 'write',
        value: function write(json, browserName, cid) {
            if (this.options.useStdout) {
                return console.log(JSON.stringify(json));
            }

            if (!this.options || typeof this.options.outputDir !== 'string') {
                return console.log('Cannot write json report: empty or invalid \'outputDir\'.');
            }

            try {
                var dir = _path2['default'].resolve(this.options.outputDir);
                var filename = this.options.filename ? this.options.filename + (this.options.combined ? '.json' : '-' + cid + '.json') : 'WDIO.json.' + browserName + '.' + _uuid2['default'].v1() + '.json';
                var filepath = _path2['default'].join(dir, filename);
                _mkdirp2['default'].sync(dir);
                _fs2['default'].writeFileSync(filepath, JSON.stringify(json));
                console.log('Wrote json report to [' + this.options.outputDir + '].');
            } catch (e) {
                console.log('Failed to write json report to [' + this.options.outputDir + ']. Error: ' + e);
            }
        }
    }, {
        key: 'format',
        value: function format(val) {
            return JSON.stringify(this.baseReporter.limit(val));
        }
    }]);

    return JsonReporter;
})(_events2['default'].EventEmitter);

exports['default'] = JsonReporter;
module.exports = exports['default'];
