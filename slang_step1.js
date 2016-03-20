/*The MIT License (MIT)

Copyright (c) 2016 shinexavier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

function SlangException(message) {
    this.name = 'SlangException';
    this.message = message;
    this.toString = function () {
        return this.name + this.message;
    };
}

function Expression() {
    this.evaluate = function (runtimeContext) {};
}

function Statement() {
    this.execute = function (runtimeContext) {};
}

var OPERATOR = (function () {
    return {
        PLUS: '+',
        MINUS: '-',
        MUL: '*',
        DIV: '/'
    };
})();

function NumericConstant(value) {
    this.evaluate = function (runtimeContext) {
        var out = parseFloat(value, 10);
        if (isNaN(out)) {
            throw new SlangException('Not a valid number!');
        } else {
            return value;
        }
    };
}

function BinaryExp(exp1, exp2, op) {
    this.evaluate = function (runtimeContext) {
        switch (op) {
        case '+':
            return exp1.evaluate(runtimeContext) + exp2.evaluate(runtimeContext);
        case '-':
            return exp1.evaluate(runtimeContext) - exp2.evaluate(runtimeContext);
        case '/':
            return exp1.evaluate(runtimeContext) / exp2.evaluate(runtimeContext);
        case '*':
            return exp1.evaluate(runtimeContext) * exp2.evaluate(runtimeContext);
        default:
            throw new SlangException('Not a valid operation!');
        }
    };
}

function UnaryExp(exp1, op) {
    this.evaluate = function (runtimeContext) {
        switch (op) {
        case '+':
            return exp1.evaluate(runtimeContext);
        case '-':
            return -exp1.evaluate(runtimeContext);
        default:
            throw new SlangException('Not a valid operation!');
        }
    };
}

// AST for 5*10
var e = new BinaryExp(new NumericConstant(5),
    new NumericConstant(10),
    OPERATOR.MUL);
console.log("RESULT1................ ", e.evaluate(null));

// AST for -(10 + (30 + 50 ) )
e = new UnaryExp(
    new BinaryExp(new NumericConstant(10),
        new BinaryExp(new NumericConstant(30),
            new NumericConstant(50),
            OPERATOR.PLUS),
        OPERATOR.PLUS),
    OPERATOR.MINUS);
console.log("RESULT2................ ", e.evaluate(null));