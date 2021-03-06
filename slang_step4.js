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

function RuntimeContext() {
    var rST = new SymbolTable();
    this.getTable = function () {
        return rST;
    };
    this.setTable = function (new_rST) {
        rST = new_rST;
    };
}

function CompilationContext() {
    var cST = new SymbolTable();
    this.getTable = function () {
        return cST;
    };
    this.setTable = function (new_cST) {
        cST = new_cST;
    };
}

function Expression() {
    this.evaluate = function (runtimeContext) {};
    this.typeCheck = function (compilationContext) {};
    this.getType = function () {};
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
        TOK_UNQUOTED_STRING: "UQ-STR",
        TOK_SEMI: ";",
        TOK_VAR_NUMBER: "NUMERIC",
        TOK_VAR_STRING: "STRING",
        TOK_VAR_BOOL: "BOOLEAN",
        TOK_NUMERIC: "NUMBER",
        TOK_COMMENT: "//",
        TOK_BOOL_TRUE: "TRUE",
        TOK_BOOL_FALSE: "FALSE",
        TOK_STRING: "CHARS",
        TOK_ASSIGN: "="
    };
})();

var TYPE_INFO = (function () {
    return {
        TYPE_ILLEGAL: -1, // Not a valid Type
        TYPE_NUMERIC: 0,
        TYPE_BOOL: 1,
        TYPE_STRING: 2
    };
})();

function SYMBOL_INFO(name, type, value) {
    this.symbolName = name;
    this.symbolType = type;
    this.symbolValue = value;
}

function SymbolTable() {
    var repo = {};
    this.add = function (sInfo) {
        repo[sInfo.symbolName] = sInfo;
        return true;
    };
    this.get = function (name) {
        return repo[name];
    };
    this.assignToTable = function (variable, sInfo) {
        var varName = variable.getName();
        sInfo.symbolName = varName;
        repo[varName] = sInfo;
    };
    this.assignToVariable = function (varName, sInfo) {
        repo[varName] = sInfo;
    };
    this.getAll = function () {
        return repo;
    };
}

function BooleanConstant(value) {
    var info = new SYMBOL_INFO(null, TYPE_INFO.TYPE_BOOL, value);
    this.evaluate = function (runtimeContext) {
        return info;
    };
    this.typeCheck = function (compilationContext) {
        return info.symbolType;
    };
    this.getType = function () {
        return info.symbolType;
    };
}

function NumericConstant(value) {
    var info = new SYMBOL_INFO(null, TYPE_INFO.TYPE_NUMERIC, parseFloat(value, 10));
    this.evaluate = function (runtimeContext) {
        return info;
    };
    this.typeCheck = function (compilationContext) {
        return info.symbolType;
    };
    this.getType = function () {
        return info.symbolType;
    };
}

function StringLiteral(value) {
    var info = new SYMBOL_INFO(null, TYPE_INFO.TYPE_STRING, value);
    this.evaluate = function (runtimeContext) {
        return info;
    };
    this.typeCheck = function (compilationContext) {
        return info.symbolType;
    };
    this.getType = function () {
        return info.symbolType;
    };
}

function Variable(inf) {
    var mName = inf.symbolName,
        mType = TYPE_INFO.TYPE_ILLEGAL;
    this.getName = function () {
        return mName;
    };
    this.evaluate = function (runtimeContext) {
        var sTable = runtimeContext.getTable();
        if (sTable === null) {
            return null;
        } else {
            return sTable.get(mName);
        }
    };
    this.typeCheck = function (compilationContext) {
        var sTable = compilationContext.getTable(),
            sInfo = null;
        if (sTable !== null) {
            sInfo = sTable.get(mName);
            if (sInfo !== null) {
                mType = sInfo.symbolType;
            }
        }
        return mType;
    };
    this.getType = function () {
        return mType;
    };
}

function StringVariable(compilationContext, name, value) {
    var sInfo = new SYMBOL_INFO(name, TYPE_INFO.TYPE_STRING, value),
        sTable = compilationContext.getTable();
    Variable.call(this, sInfo); //constructor chaining for inheritance
    sTable.add(sInfo);
}

function BooleanVariable(compilationContext, name, value) {
    var sInfo = new SYMBOL_INFO(name, TYPE_INFO.TYPE_BOOL, value),
        sTable = compilationContext.getTable();
    Variable.call(this, sInfo); //constructor chaining for inheritance
    sTable.add(sInfo);
}

function NumericVariable(compilationContext, name, value) {
    var sInfo = new SYMBOL_INFO(name, TYPE_INFO.TYPE_NUMERIC, value),
        sTable = compilationContext.getTable();
    Variable.call(this, sInfo); //constructor chaining for inheritance
    sTable.add(sInfo);
}

function BinaryPlus(exp1, exp2) {
    var tInfo;
    this.evaluate = function (runtimeContext) {
        var evalLeft = exp1.evaluate(runtimeContext),
            evalRight = exp2.evaluate(runtimeContext),
            retVal = null;
        if ((exp1.getType() === TYPE_INFO.TYPE_STRING) && (exp2.getType() === TYPE_INFO.TYPE_STRING)) {
            retVal = evalLeft.symbolValue + evalRight.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_STRING, retVal);
        } else if ((exp1.getType() === TYPE_INFO.TYPE_NUMERIC) && (exp2.getType() === TYPE_INFO.TYPE_NUMERIC)) {
            retVal = evalLeft.symbolValue + evalRight.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_NUMERIC, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (compilationContext) {
        var evalLeftType = exp1.typeCheck(compilationContext),
            evalRightType = exp2.typeCheck(compilationContext);
        if (evalLeftType === evalRightType && evalLeftType !== TYPE_INFO.TYPE_BOOL) {
            tInfo = evalLeftType;
            return tInfo;
        } else {
            throw new SlangException('Type Mismatch Failure!');
        }
    };
    this.getType = function () {
        return tInfo;
    };
}

function BinaryMinus(exp1, exp2) {
    var tInfo;
    this.evaluate = function (runtimeContext) {
        var evalLeft = exp1.evaluate(runtimeContext),
            evalRight = exp2.evaluate(runtimeContext),
            retVal = null;
        if ((exp1.getType() === TYPE_INFO.TYPE_NUMERIC) && (exp2.getType() === TYPE_INFO.TYPE_NUMERIC)) {
            retVal = evalLeft.symbolValue - evalRight.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_NUMERIC, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (compilationContext) {
        var evalLeftType = exp1.typeCheck(compilationContext),
            evalRightType = exp2.typeCheck(compilationContext);
        if (evalLeftType === evalRightType && evalLeftType === TYPE_INFO.TYPE_NUMERIC) {
            tInfo = evalLeftType;
            return tInfo;
        } else {
            throw new SlangException('Type Mismatch Failure!');
        }
    };
    this.getType = function () {
        return tInfo;
    };
}

function Mul(exp1, exp2) {
    var tInfo;
    this.evaluate = function (runtimeContext) {
        var evalLeft = exp1.evaluate(runtimeContext),
            evalRight = exp2.evaluate(runtimeContext),
            retVal = null;
        if ((exp1.getType() === TYPE_INFO.TYPE_NUMERIC) && (exp2.getType() === TYPE_INFO.TYPE_NUMERIC)) {
            retVal = evalLeft.symbolValue * evalRight.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_NUMERIC, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (compilationContext) {
        var evalLeftType = exp1.typeCheck(compilationContext),
            evalRightType = exp2.typeCheck(compilationContext);
        if (evalLeftType === evalRightType && evalLeftType === TYPE_INFO.TYPE_NUMERIC) {
            tInfo = evalLeftType;
            return tInfo;
        } else {
            throw new SlangException('Type Mismatch Failure!');
        }
    };
    this.getType = function () {
        return tInfo;
    };
}

function Div(exp1, exp2) {
    var tInfo;
    this.evaluate = function (runtimeContext) {
        var evalLeft = exp1.evaluate(runtimeContext),
            evalRight = exp2.evaluate(runtimeContext),
            retVal = null;
        if ((exp1.getType() === TYPE_INFO.TYPE_NUMERIC) && (exp2.getType() === TYPE_INFO.TYPE_NUMERIC)) {
            retVal = evalLeft.symbolValue / evalRight.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_NUMERIC, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (compilationContext) {
        var evalLeftType = exp1.typeCheck(compilationContext),
            evalRightType = exp2.typeCheck(compilationContext);
        if (evalLeftType === evalRightType && evalLeftType === TYPE_INFO.TYPE_NUMERIC) {
            tInfo = evalLeftType;
            return tInfo;
        } else {
            throw new SlangException('Type Mismatch Failure!');
        }
    };
    this.getType = function () {
        return tInfo;
    };
}

function UnaryPlus(exp1) {
    var tInfo;
    this.evaluate = function (runtimeContext) {
        var evalLeft = exp1.evaluate(runtimeContext),
            retVal = null;
        if (exp1.getType() === TYPE_INFO.TYPE_NUMERIC) {
            retVal = evalLeft.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_NUMERIC, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (compilationContext) {
        var evalLeftType = exp1.typeCheck(compilationContext);
        if (evalLeftType === TYPE_INFO.TYPE_NUMERIC) {
            tInfo = evalLeftType;
            return tInfo;
        } else {
            throw new SlangException('Type Mismatch Failure!');
        }
    };
    this.getType = function () {
        return tInfo;
    };
}

function UnaryMinus(exp1) {
    var tInfo;
    this.evaluate = function (runtimeContext) {
        var evalLeft = exp1.evaluate(runtimeContext),
            retVal = null;
        if (exp1.getType() === TYPE_INFO.TYPE_NUMERIC) {
            retVal = -evalLeft.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_NUMERIC, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (compilationContext) {
        var evalLeftType = exp1.typeCheck(compilationContext);
        if (evalLeftType === TYPE_INFO.TYPE_NUMERIC) {
            tInfo = evalLeftType;
            return tInfo;
        } else {
            throw new SlangException('Type Mismatch Failure!');
        }
    };
    this.getType = function () {
        return tInfo;
    };
}

function PrintStatement(exp) {
    this.execute = function (runtimeContext) {
        var out = exp.evaluate(runtimeContext);
        console.log("PRINTING >> ", out);
        return true;
    };
}

function VariableDeclStatement(inf) {
    var variable = null;
    this.execute = function (runtimeContext) {
        var sTable = runtimeContext.getTable();
        sTable.add(inf);
        variable = new Variable(inf);
        return null;
    };
}

function AssignmentStatement(exp) {
    var variable = null;
    this.setVariable = function (variableN) {
        variable = variableN;
    };
    this.setSymbol = function (sInfo) {
        variable = new Variable(sInfo);
    };
    this.execute = function (runtimeContext) {
        var retVal = exp.evaluate(runtimeContext);
        runtimeContext.getTable().assignToTable(variable, retVal);
        return null;
    };
}

function Lexer(expr) {
    var index = 0,
        length = expr.length,
        number = null,
        currentToken = null,
        lastToken = null,
        lastString = null,
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
                expr.charAt(index).match(/[0-9]/g) !== null) {
                str += expr.charAt(index);
                index += 1;
            }
            number = parseFloat(str, 10);
            tok = TOKEN.TOK_NUMERIC;
            break;
        case "=":
            tok = TOKEN.TOK_ASSIGN;
            index += 1;
            break;
        case ';':
            tok = TOKEN.TOK_SEMI;
            index += 1;
            break;
        case '"':
            index += 1;
            while (index < length &&
                expr.charAt(index) !== '"') {
                str += expr.charAt(index);
                index += 1;
            }
            index += 1;
            lastString = str;
            tok = TOKEN.TOK_STRING;
            break;
        default:
            if (token.match(/[a-zA-Z]/g) !== null) {
                while (index < length &&
                    expr.charAt(index).match(/[a-zA-Z0-9_]/g) !== null) {
                    str += expr.charAt(index);
                    index += 1;
                }
                lastString = str;
                switch (lastString) {
                case 'PRINT':
                    tok = TOKEN.TOK_PRINT;
                    break;
                case 'BOOLEAN':
                    tok = TOKEN.TOK_VAR_BOOL;
                    break;
                case 'NUMERIC':
                    tok = TOKEN.TOK_VAR_NUMBER;
                    break;
                case 'STRING':
                    tok = TOKEN.TOK_VAR_STRING;
                    break;
                case 'TRUE':
                    tok = TOKEN.TOK_BOOL_TRUE;
                    break;
                case 'FALSE':
                    tok = TOKEN.TOK_BOOL_FALSE;
                    break;
                default:
                    tok = TOKEN.TOK_UNQUOTED_STRING;
                }
            } else {
                console.log("SlangException Token: ", tok);
                throw new SlangException('Invalid token encountered!');
            }
        }
        console.log('TOKEN: ', tok === TOKEN.TOK_NUMERIC ? number : tok); //Printing Extracted Tokens
        return tok;
    };
    this.getNumber = function () {
        return number;
    };
    this.getLastString = function () {
        return lastString;
    };
}

function RDParser(str) {
    var that = this;
    Lexer.call(this, str); //constructor chaining for inheritance
    this.currentToken = TOKEN.TOK_NULL;
    this.parse = function (compilationContext) {
        that.currentToken = that.getToken();
        return that.statementList(compilationContext);
    };
    this.statementList = function (compilationContext) {
        var stmts = [],
            stmt = null;
        while (that.currentToken !== TOKEN.TOK_NULL) {
            stmt = that.statement(compilationContext);
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
    this.expr = function (compilationContext) {
        var token,
            retVal = that.term(compilationContext);
        while (that.currentToken === TOKEN.TOK_PLUS || that.currentToken === TOKEN.TOK_SUB) {
            token = that.currentToken;
            that.currentToken = that.getToken();
            var expr1 = that.expr(compilationContext); //recursion
            retVal = ((token === TOKEN.TOK_PLUS) ? new BinaryPlus(retVal, expr1) : new BinaryMinus(retVal, expr1));
        }
        return retVal;
    };
    this.term = function (compilationContext) {
        var token,
            retVal = that.factor(compilationContext);
        while (that.currentToken === TOKEN.TOK_MUL || that.currentToken === TOKEN.TOK_DIV) {
            token = that.currentToken;
            that.currentToken = that.getToken();
            var expr1 = that.term(compilationContext); //recursion
            retVal = ((token === TOKEN.TOK_MUL) ? new Mul(retVal, expr1) : new Div(retVal, expr1));
        }
        return retVal;
    };
    this.factor = function (compilationContext) {
        var token,
            sInfo = null,
            retVal = null;
        if (that.currentToken === TOKEN.TOK_NUMERIC) {
            retVal = new NumericConstant(that.getNumber());
            that.currentToken = that.getToken();
        } else if (that.currentToken === TOKEN.TOK_STRING) {
            retVal = new StringLiteral(that.getLastString());
            that.currentToken = that.getToken();
        } else if (that.currentToken === TOKEN.TOK_BOOL_TRUE || that.currentToken === TOKEN.TOK_BOOL_FALSE) {
            retVal = new BooleanConstant(that.currentToken === TOKEN.TOK_BOOL_TRUE);
            that.currentToken = that.getToken();
        } else if (that.currentToken === TOKEN.TOK_OPAREN) {
            that.currentToken = that.getToken();
            retVal = that.expr(compilationContext); //recursion
            if (that.currentToken !== TOKEN.TOK_CPAREN) {
                throw new SlangException('Missing Closing Parenthesis!');
            }
            that.currentToken = that.getToken();
        } else if (that.currentToken === TOKEN.TOK_PLUS || that.currentToken === TOKEN.TOK_SUB) {
            token = that.currentToken;
            that.currentToken = that.getToken();
            retVal = that.factor(compilationContext); //recursion
            retVal = ((token === TOKEN.TOK_PLUS) ? new UnaryPlus(retVal) : new UnaryMinus(retVal));
        } else if (that.currentToken === TOKEN.TOK_UNQUOTED_STRING) {
            sInfo = compilationContext.getTable().get(that.getLastString()) || null;
            if (sInfo === null) {
                throw new SlangException(that.getLastString() + ' - Undefined Symbol!');
            } else {
                that.currentToken = that.getToken();
                retVal = new Variable(sInfo);
            }
        } else {
            throw new SlangException('Illegal Token!');
        }
        return retVal;
    };
    this.statement = function (compilationContext) {
        var retVal = null;
        switch (that.currentToken) {
        case TOKEN.TOK_VAR_STRING:
        case TOKEN.TOK_VAR_NUMBER:
        case TOKEN.TOK_VAR_BOOL:
            retVal = that.parseVariableStatement(compilationContext);
            that.currentToken = that.getToken();
            break;
        case TOKEN.TOK_PRINT:
            retVal = that.parsePrintStatement(compilationContext);
            that.currentToken = that.getToken();
            break;
        case TOKEN.TOK_UNQUOTED_STRING:
            retVal = that.parseAssignmentStatement(compilationContext);
            that.currentToken = that.getToken();
            break;
        default:
            throw new SlangException('Invalid Statement!');
        }
        return retVal;
    };
    this.parsePrintStatement = function (compilationContext) {
        that.currentToken = that.getToken();
        var expr1 = that.expr(compilationContext);
        expr1.typeCheck(compilationContext);
        if (that.currentToken !== TOKEN.TOK_SEMI) {
            throw new SlangException("; is Expected!");
        }
        return new PrintStatement(expr1);
    };
    this.parseVariableStatement = function (compilationContext) {
        var token = that.currentToken;
        that.currentToken = that.getToken();
        if (that.currentToken === TOKEN.TOK_UNQUOTED_STRING) {
            var sInfo = new SYMBOL_INFO(that.getLastString(), ((token === TOKEN.TOK_VAR_BOOL) ? TYPE_INFO.TYPE_BOOL : ((token === TOKEN.TOK_VAR_NUMBER) ? TYPE_INFO.TYPE_NUMERIC : TYPE_INFO.TYPE_STRING)), null);
            that.currentToken = that.getToken();
            if (that.currentToken === TOKEN.TOK_SEMI) {
                compilationContext.getTable().add(sInfo);
                return new VariableDeclStatement(sInfo);
            } else {
                throw new SlangException("Slang Compilation Error> ; Expected!");
            }
        } else {
            throw new SlangException("Slang Compilation Error> Invalid variable declaration!");
        }
    };
    this.parseAssignmentStatement = function (compilationContext) {
        var variable = that.getLastString(),
            sInfo = compilationContext.getTable().get(variable) || null,
            expr1 = null,
            stmt = null;
        if (sInfo === null) {
            throw new SlangException("Slang Compilation Error> " + variable + " - Variable Not Found!");
        }
        that.currentToken = that.getToken();
        if (that.currentToken !== TOKEN.TOK_ASSIGN) {
            throw new SlangException("Slang Compilation Error> = Expected!");
        }
        that.currentToken = that.getToken();
        expr1 = that.expr(compilationContext);
        if (expr1.typeCheck(compilationContext) !== sInfo.symbolType) {
            throw new SlangException("Slang Compilation Error> Type Mismatch In Assigment!");
        }
        if (that.currentToken !== TOKEN.TOK_SEMI) {
            throw new SlangException("Slang Compilation Error> ; Expected!");
        }
        stmt = new AssignmentStatement(expr1);
        stmt.setSymbol(sInfo);
        return stmt;
    };
}

function TestStatementsSet1() {
    var program1 = "PRINT 10;PRINT 2*10;PRINT 5/4;PRINT (2*3+5* 30 + -(4*5+3));";
    var program2 = "NUMERIC a;a = 2*3+5* 30 + -(4*5+3);PRINT a;";
    var program3 = "PRINT \"Hello \" + \"World\";";
    var program4 = "STRING b;b = \"Hello \";PRINT b + \"World\";";
    var program5 = "BOOLEAN c;c = TRUE; PRINT c;c=FALSE;PRINT c;";
    var program6 = "a=-1;a=-a; PRINT a;a=---1;PRINT a*4+10;";
    var parser = new RDParser(program1 + program2 + program3 + program4 + program5 + program6);
    var compilationContext = new CompilationContext();
    var stmts = parser.parse(compilationContext);
    console.log("Compilation Success!.........................................................");
    var runtimeContext = new RuntimeContext();
    for (var stmt in stmts) {
        stmts[stmt].execute(runtimeContext);
    }
}

TestStatementsSet1();