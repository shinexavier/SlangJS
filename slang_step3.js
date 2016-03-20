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

var TOKEN = (function () {
    return {
        ILLEGAL_TOKEN: -1, // Not a Token
        TOK_NULL: 0, //End of string
        TOK_PLUS: "+",
        TOK_MUL: "*",
        TOK_DIV: "/",
        TOK_SUB: "-",
        TOK_OPAREN: "(",
        TOK_CPAREN: ")",
        TOK_DOUBLE: "dbl",
        TOK_PRINT: "PRINT",
        TOK_UNQUOTED_STRING: "uqSTR",
        TOK_SEMI: ";"
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

function PrintStatement(exp) {
    this.execute = function (runtimeContext) {
        var out = exp.evaluate(runtimeContext);
        console.log("PRINTING >> ", out);
        return true;
    };
}

function Lexer(expr) {
    var index = 0,
        length = expr.length,
        number = null,
        tok = TOKEN.ILLEGAL_TOKEN;
    this.getToken = function () {
        var token = expr.charAt(index),
            str = '';
        while (index < length && (token === ' ' || token === '\t')) {
            index += 1;
            token = expr.charAt(index);
        }
        if (index === length) {
            return TOKEN.TOK_NULL;
        }
        switch (token) {
        case '+':
            tok = TOKEN.TOK_PLUS;
            index += 1;
            break;
        case '-':
            tok = TOKEN.TOK_SUB;
            index += 1;
            break;
        case '/':
            tok = TOKEN.TOK_DIV;
            index += 1;
            break;
        case '*':
            tok = TOKEN.TOK_MUL;
            index += 1;
            break;
        case '(':
            tok = TOKEN.TOK_OPAREN;
            index += 1;
            break;
        case ')':
            tok = TOKEN.TOK_CPAREN;
            index += 1;
            break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            while (index < length &&
                expr.charAt(index) === '0' ||
                expr.charAt(index) === '1' ||
                expr.charAt(index) === '2' ||
                expr.charAt(index) === '3' ||
                expr.charAt(index) === '4' ||
                expr.charAt(index) === '5' ||
                expr.charAt(index) === '6' ||
                expr.charAt(index) === '7' ||
                expr.charAt(index) === '8' ||
                expr.charAt(index) === '9') {
                str += expr.charAt(index);
                index += 1;
            }
            number = parseFloat(str, 10);
            tok = TOKEN.TOK_DOUBLE;
            break;
        case ';':
            tok = TOKEN.TOK_SEMI;
            index += 1;
            break;
        default:
            if (token.match(/[a-zA-Z]/g) !== null) {
                while (index < length &&
                    expr.charAt(index).match(/[a-zA-Z0-9_]/g) !== null) {
                    str += expr.charAt(index);
                    index += 1;
                }
                switch (str) {
                case 'PRINT':
                    tok = TOKEN.TOK_PRINT;
                    break;
                default:
                    tok = TOKEN.TOK_UNQUOTED_STRING;
                }
            } else {
                console.log("SlangException Token: ", tok);
                throw new SlangException('Invalid token encountered!');
            }
        }
        console.log('TOKEN: ', tok === TOKEN.TOK_DOUBLE ? number : tok); //Printing Extracted Tokens
        return tok;
    };
    this.getNumber = function () {
        return number;
    };
}

function RDParser(str) {
    var that = this;
    Lexer.call(this, str); //constructor chaining for inheritance
    this.currentToken = TOKEN.TOK_NULL;
    this.parse = function () {
        that.currentToken = that.getToken();
        return that.statementList();
    };
    this.statementList = function () {
        var stmts = [],
            stmt = null;
        while (that.currentToken !== TOKEN.TOK_NULL) {
            stmt = that.statement();
            if (stmt !== null) {
                stmts.push(stmt);
            }
        }
        return stmts;
    };
    this.callExpr = function () {
        that.currentToken = that.getToken();
        return that.expr();
    };
    this.expr = function () {
        var token,
            retVal = that.term();
        while (that.currentToken === TOKEN.TOK_PLUS || that.currentToken === TOKEN.TOK_SUB) {
            token = that.currentToken;
            that.currentToken = that.getToken();
            var expr1 = that.expr(); //recursion
            retVal = new BinaryExp(retVal, expr1, ((token === TOKEN.TOK_PLUS) ? OPERATOR.PLUS : OPERATOR.MINUS));
        }
        return retVal;
    };
    this.term = function () {
        var token,
            retVal = that.factor();
        while (that.currentToken === TOKEN.TOK_MUL || that.currentToken === TOKEN.TOK_DIV) {
            token = that.currentToken;
            that.currentToken = that.getToken();
            var expr1 = that.term(); //recursion
            retVal = new BinaryExp(retVal, expr1, ((token === TOKEN.TOK_MUL) ? OPERATOR.MUL : OPERATOR.DIV));
        }
        return retVal;
    };
    this.factor = function () {
        var token,
            retVal = null;
        if (that.currentToken === TOKEN.TOK_DOUBLE) {
            retVal = new NumericConstant(that.getNumber());
            that.currentToken = that.getToken();
        } else if (that.currentToken === TOKEN.TOK_OPAREN) {
            that.currentToken = that.getToken();
            retVal = that.expr(); //recursion
            if (that.currentToken !== TOKEN.TOK_CPAREN) {
                throw new SlangException('Missing Closing Parenthesis!');
            }
            that.currentToken = that.getToken();
        } else if (that.currentToken === TOKEN.TOK_PLUS || that.currentToken === TOKEN.TOK_SUB) {
            token = that.currentToken;
            that.currentToken = that.getToken();
            retVal = that.factor(); //recursion
            retVal = new UnaryExp(retVal, ((token === TOKEN.TOK_PLUS) ? OPERATOR.PLUS : OPERATOR.MINUS));
        } else {
            throw new SlangException('Illegal Token!');
        }
        return retVal;
    };
    this.statement = function () {
        var retVal = null;
        switch (that.currentToken) {
        case TOKEN.TOK_PRINT:
            retVal = that.parsePrintStatement();
            that.currentToken = that.getToken();
            break;
        default:
            throw new SlangException('Invalid Statement!');
        }
        return retVal;
    };
    this.parsePrintStatement = function () {
        that.currentToken = that.getToken();
        var expr1 = that.expr();
        if (that.currentToken !== TOKEN.TOK_SEMI) {
            throw new SlangException("; is Expected!");
        }
        return new PrintStatement(expr1);
    };
}

function TestStatementsSet1() {
    var stmt = "PRINT 10;PRINT 2*10;PRINT 5/4;";
    var parser = new RDParser(stmt);
    var outList = parser.parse();
    for (var stmt in outList) {
        outList[stmt].execute(null);
    }
}

TestStatementsSet1();