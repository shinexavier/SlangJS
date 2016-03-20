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

var readline = require('readline'),
    fs = require('fs');

Array.prototype.find = function (predicate) {
    if (this === null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
            return value;
        }
    }
    return undefined;
};

function SlangException(message) {
    this.name = 'SlangException';
    this.message = message;
    this.toString = function () {
        return this.name + this.message;
    };
}

function RuntimeContext(program) {
    var rST = new SymbolTable(),
        prog = program || null;
    this.getProgram = function () {
        return prog;
    };
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
        TOK_COMMA: ",",
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
        TOK_ASSIGN: "=",
        TOK_EQ: "==",
        TOK_NEQ: "<>",
        TOK_GT: ">",
        TOK_GTE: ">=",
        TOK_LT: "<",
        TOK_LTE: "<=",
        TOK_AND: "&&",
        TOK_OR: "||",
        TOK_NOT: "!",
        TOK_IF: "IF",
        TOK_THEN: "THEN",
        TOK_ELSE: "ELSE",
        TOK_ENDIF: "ENDIF",
        TOK_WHILE: "WHILE",
        TOK_WEND: "WEND",
        TOK_FUNCTION: "FUNCTION",
        TOK_END: "END",
        TOK_RETURN: "RETURN"
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

var RELATION_OPERATOR = (function () {
    return {
        TOK_EQ: -1,
        TOK_NEQ: 0,
        TOK_GT: 1,
        TOK_GTE: 2,
        TOK_LT: 3,
        TOK_LTE: 4
    };
})();

function SYMBOL_INFO(name, type, value) {
    this.symbolName = name;
    this.symbolType = type;
    this.symbolValue = value;
}

function FUNCTION_INFO(name, returnType, formals) {
    this.functionName = name;
    this.functionFormals = formals;
    this.functionReturnType = returnType;
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
    this.typeCheck = function (procedureBuilder) {
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
    this.typeCheck = function (procedureBuilder) {
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
    this.typeCheck = function (procedureBuilder) {
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
    this.typeCheck = function (procedureBuilder) {
        var sTable = procedureBuilder.getTable(),
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

function StringVariable(procedureBuilder, name, value) {
    var sInfo = new SYMBOL_INFO(name, TYPE_INFO.TYPE_STRING, value),
        sTable = procedureBuilder.getTable();
    Variable.call(this, sInfo); //constructor chaining for inheritance
    sTable.add(sInfo);
}

function BooleanVariable(procedureBuilder, name, value) {
    var sInfo = new SYMBOL_INFO(name, TYPE_INFO.TYPE_BOOL, value),
        sTable = procedureBuilder.getTable();
    Variable.call(this, sInfo); //constructor chaining for inheritance
    sTable.add(sInfo);
}

function NumericVariable(procedureBuilder, name, value) {
    var sInfo = new SYMBOL_INFO(name, TYPE_INFO.TYPE_NUMERIC, value),
        sTable = procedureBuilder.getTable();
    Variable.call(this, sInfo); //constructor chaining for inheritance
    sTable.add(sInfo);
}

function RelationExp(exp1, exp2, mOp) {
    var tInfo,
        operandType,
        mOperator = mOp;
    this.evaluate = function (runtimeContext) {
        var evalLeft = exp1.evaluate(runtimeContext),
            evalRight = exp2.evaluate(runtimeContext),
            retVal = null;
        if ((evalLeft.symbolType === TYPE_INFO.TYPE_STRING) && (evalRight.symbolType === TYPE_INFO.TYPE_STRING)) {
            switch (mOperator) {
            case RELATION_OPERATOR.TOK_EQ:
                retVal = evalLeft.symbolValue === evalRight.symbolValue;
                break;
            case RELATION_OPERATOR.TOK_NEQ:
                retVal = evalLeft.symbolValue !== evalRight.symbolValue;
                break;
            default:
                retVal = false;
                break;
            }
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_BOOL, retVal);
        } else if ((evalLeft.symbolType === TYPE_INFO.TYPE_NUMERIC) && (evalRight.symbolType === TYPE_INFO.TYPE_NUMERIC)) {
            switch (mOperator) {
            case RELATION_OPERATOR.TOK_EQ:
                retVal = evalLeft.symbolValue === evalRight.symbolValue;
                break;
            case RELATION_OPERATOR.TOK_NEQ:
                retVal = evalLeft.symbolValue !== evalRight.symbolValue;
                break;
            case RELATION_OPERATOR.TOK_GT:
                retVal = evalLeft.symbolValue > evalRight.symbolValue;
                break;
            case RELATION_OPERATOR.TOK_GTE:
                retVal = evalLeft.symbolValue >= evalRight.symbolValue;
                break;
            case RELATION_OPERATOR.TOK_LT:
                retVal = evalLeft.symbolValue < evalRight.symbolValue;
                break;
            case RELATION_OPERATOR.TOK_LTE:
                retVal = evalLeft.symbolValue <= evalRight.symbolValue;
                break;
            }
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_BOOL, retVal);
        } else if ((evalLeft.symbolType === TYPE_INFO.TYPE_BOOL) && (evalRight.symbolType === TYPE_INFO.TYPE_BOOL)) {
            switch (mOperator) {
            case RELATION_OPERATOR.TOK_EQ:
                retVal = evalLeft.symbolValue === evalRight.symbolValue;
                break;
            case RELATION_OPERATOR.TOK_NEQ:
                retVal = evalLeft.symbolValue !== evalRight.symbolValue;
                break;
            default:
                retVal = false;
                break;
            }
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_BOOL, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (procedureBuilder) {
        var evalLeftType = exp1.typeCheck(procedureBuilder),
            evalRightType = exp2.typeCheck(procedureBuilder);
        if (evalLeftType !== evalRightType) {
            throw new SlangException('Type Mismatch Failure!');
        }
        if (evalLeftType === TYPE_INFO.TYPE_STRING && (mOperator !== RELATION_OPERATOR.TOK_EQ && mOperator !== RELATION_OPERATOR.TOK_NEQ)) {
            throw new SlangException('Only == and != supported for STRING type!');
        }
        if (evalLeftType === TYPE_INFO.TYPE_BOOL && (mOperator !== RELATION_OPERATOR.TOK_EQ && mOperator !== RELATION_OPERATOR.TOK_NEQ)) {
            throw new SlangException('Only == and != supported for BOOLEAN type!');
        }
        operandType = evalLeftType;
        tInfo = TYPE_INFO.TYPE_BOOL;
        return tInfo;
    };
    this.getType = function () {
        return tInfo;
    };
}

function LogicalExp(exp1, exp2, mOp) {
    var tInfo,
        mOperator = mOp;
    this.evaluate = function (runtimeContext) {
        var evalLeft = exp1.evaluate(runtimeContext),
            evalRight = exp2.evaluate(runtimeContext),
            retVal = null;
        if ((evalLeft.symbolType === TYPE_INFO.TYPE_BOOL) && (evalRight.symbolType === TYPE_INFO.TYPE_BOOL)) {
            switch (mOperator) {
            case RELATION_OPERATOR.TOK_AND:
                retVal = evalLeft.symbolValue && evalRight.symbolValue;
                break;
            case RELATION_OPERATOR.TOK_OR:
                retVal = evalLeft.symbolValue || evalRight.symbolValue;
                break;
            default:
                return null;
            }
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_BOOL, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (procedureBuilder) {
        var evalLeftType = exp1.typeCheck(procedureBuilder),
            evalRightType = exp2.typeCheck(procedureBuilder);
        if (evalLeftType === evalRightType && evalLeftType === TYPE_INFO.TYPE_BOOL) {
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

function CallExp(procedure, actuals, procedureName, recursive) {
    var proc = procedure,
        procName = typeof procedureName !== 'undefined' ? procedureName : null,
        isRecursive = typeof recursive !== 'undefined' ? recursive : false,
        tInfo = null;
    this.evaluate = function (runtimeContext) {
        var ctx = null,
            expEvalList = [],
            exp = null;
        if (proc !== null) {
            ctx = new RuntimeContext(runtimeContext.getProgram());
        } else {
            proc = runtimeContext.getProgram().find(procName);
            ctx = new RuntimeContext(runtimeContext.getProgram());
        }
        for (exp in actuals) {
            if (actuals.hasOwnProperty(exp) === true) {
                expEvalList.push(actuals[exp].evaluate(runtimeContext));
            }
        }
        var x = proc.execute(ctx, expEvalList);
        return x;
    };
    this.typeCheck = function (procedureBuilder) {
        if (proc !== null) {
            tInfo = proc.typeCheck(procedureBuilder);
        } else {
            tInfo = procedureBuilder.getType();
        }
        return tInfo;
    };
    this.getType = function () {
        return tInfo;
    };
}

function TModule(procedures) {
    var procs = procedures,
        that = this;
    this.compile = function () {
        var proc;
        compiledProcs = [];
        for (proc in procs) {
            if (procs.hasOwnProperty(proc) === true) {
                proc.compile();
            }
        }
        return true;
    };
    this.execute = function (runtimeContext, actuals) {
        var proc = that.find("MAIN");
        if (proc !== null) {
            proc.execute(runtimeContext, actuals);
        }
        return null;
    };
    this.find = function (procName) {
        return procs.find(function (procedure) {
            return procedure.getProcedureName() === procName;
        }) || null;
    };
}

function TModuleBuilder() {
    var procs = [],
        protos = [];
    this.isFunction = function (name) {
        return protos.find(function (proto) {
            return proto.functionName === name;
        }) !== undefined ? true : false;
    };
    this.add = function (procedure) {
        procs.push(procedure);
        return true;
    };
    this.addFunctionPrototype = function (name, returnType, formals) {
        protos.push(new FUNCTION_INFO(name, returnType, formals));
    };
    this.checkFunctionPrototype = function (name, returnType, formals) {
        var i = 0,
            fInfo = protos.find(function (proto) {
                return (proto.functionName === name &&
                    proto.functionReturnType === returnType &&
                    proto.functionFormals.length === formals.length);
            });
        if (fInfo !== undefined) {
            while (i < formals.length) {
                if (formals[i] !== fInfo.functionFormals[i]) {
                    return false;
                }
                i += 1;
            }
            return true;
        } else {
            return false;
        }
    };
    this.getProgram = function () {
        return new TModule(procs);
    };
    this.getProcedure = function (procName) {
        return procs.find(function (procedure) {
            return procedure.getProcedureName() === procName;
        }) || null;
    };
}

function ProcedureBuilder(procedureName, compilationContext) {
    var pName = procedureName,
        mFormals = [],
        mStmts = [],
        tInfo = TYPE_INFO.TYPE_ILLEGAL;
    this.addLocal = function (sInfo) {
        compilationContext.getTable().add(sInfo);
        return true;
    };
    this.addFormals = function (sInfo) {
        mFormals.push(sInfo);
        return true;
    };
    this.typeCheck = function (exp) {
        return exp.typeCheck(compilationContext);
    };
    this.addStatement = function (stmt) {
        mStmts.push(stmt);
    };
    this.getSymbol = function (sName) {
        return compilationContext.getTable().get(sName);
    };
    this.checkProto = function (name) {
        return true;
    };
    this.getType = function () {
        return tInfo;
    };
    this.setType = function (returnType) {
        tInfo = returnType;
    };
    this.getTable = function () {
        return compilationContext.getTable();
    };
    this.getCompilationContext = function () {
        return compilationContext;
    };
    this.getProcedureName = function () {
        return pName;
    };
    this.setProcedureName = function (procName) {
        pName = procName;
    };
    this.getProcedure = function () {
        return new Procedure(pName, mFormals, mStmts, compilationContext.getTable(), tInfo);
    };
}

function Procedure(procedureName, formals, statements, locals, type) {
    var mName = procedureName,
        mFormals = formals,
        mStatements = statements,
        mLocals = locals,
        tInfo = type,
        retVal = null;
    this.typeCheck = function (procedureBuilder) {
        return TYPE_INFO.TYPE_NUMERIC;
    };
    this.getReturnValue = function () {
        return retVal;
    };
    this.getProcedureName = function () {
        return mName;
    };
    this.getFormals = function () {
        return mFormals;
    };
    this.getType = function () {
        return tInfo;
    };
    this.compile = function (context) {
        var i = 0,
            sInfo = null,
            type = null,
            statement = null;
        for (statement in mStatements) {
            if (mStatements.hasOwnProperty(statement) === true) {
                mStatements[statement].compile(context);
            }
        }
        return true;
    };
    this.execute = function (runtimeContext, actuals) {
        var i = 0,
            sInfo = null,
            statement = null;
        if (mFormals !== null && actuals !== null) {
            for (sInfo in mFormals) {
                if (mFormals.hasOwnProperty(sInfo) === true) {
                    actuals[i].symbolName = mFormals[sInfo].symbolName;
                    runtimeContext.getTable().add(actuals[i]);
                    i += 1;
                }
            }
        }
        for (statement in mStatements) {
            if (mStatements.hasOwnProperty(statement) === true) {
                retVal = mStatements[statement].execute(runtimeContext);
                if (retVal !== null) {
                    return retVal;
                }
            }
        }
        return null;
    };
}

function BinaryPlus(exp1, exp2) {
    var tInfo;
    this.evaluate = function (runtimeContext) {
        var evalLeft = exp1.evaluate(runtimeContext),
            evalRight = exp2.evaluate(runtimeContext),
            retVal = null;
        if ((evalLeft.symbolType === TYPE_INFO.TYPE_STRING) && (evalRight.symbolType === TYPE_INFO.TYPE_STRING)) {
            retVal = evalLeft.symbolValue + evalRight.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_STRING, retVal);
        } else if ((evalLeft.symbolType === TYPE_INFO.TYPE_NUMERIC) && (evalRight.symbolType === TYPE_INFO.TYPE_NUMERIC)) {
            retVal = evalLeft.symbolValue + evalRight.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_NUMERIC, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (procedureBuilder) {
        var evalLeftType = exp1.typeCheck(procedureBuilder),
            evalRightType = exp2.typeCheck(procedureBuilder);
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
        if ((evalLeft.symbolType === TYPE_INFO.TYPE_NUMERIC) && (evalRight.symbolType === TYPE_INFO.TYPE_NUMERIC)) {
            retVal = evalLeft.symbolValue - evalRight.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_NUMERIC, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (procedureBuilder) {
        var evalLeftType = exp1.typeCheck(procedureBuilder),
            evalRightType = exp2.typeCheck(procedureBuilder);
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
        if ((evalLeft.symbolType === TYPE_INFO.TYPE_NUMERIC) && (evalRight.symbolType === TYPE_INFO.TYPE_NUMERIC)) {
            retVal = evalLeft.symbolValue * evalRight.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_NUMERIC, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (procedureBuilder) {
        var evalLeftType = exp1.typeCheck(procedureBuilder);
        var evalRightType = exp2.typeCheck(procedureBuilder);
        if (evalLeftType === evalRightType && evalLeftType === TYPE_INFO.TYPE_NUMERIC) {
            tInfo = evalLeftType;
            return tInfo;
        } else {
            console.log("evalLeftType : ", evalLeftType, " evalRightType : ", evalRightType);
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
        if ((evalLeft.symbolType === TYPE_INFO.TYPE_NUMERIC) && (evalRight.symbolType === TYPE_INFO.TYPE_NUMERIC)) {
            retVal = evalLeft.symbolValue / evalRight.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_NUMERIC, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (procedureBuilder) {
        var evalLeftType = exp1.typeCheck(procedureBuilder),
            evalRightType = exp2.typeCheck(procedureBuilder);
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

function LogicalNot(exp1) {
    var tInfo;
    this.evaluate = function (runtimeContext) {
        var evalLeft = exp1.evaluate(runtimeContext),
            retVal = null;
        if (evalLeft.symbolType === TYPE_INFO.TYPE_BOOL) {
            retVal = !evalLeft.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_BOOL, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (procedureBuilder) {
        var evalLeftType = exp1.typeCheck(procedureBuilder);
        if (evalLeftType === TYPE_INFO.TYPE_BOOL) {
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
        if (evalLeft.symbolType === TYPE_INFO.TYPE_NUMERIC) {
            retVal = evalLeft.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_NUMERIC, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (procedureBuilder) {
        var evalLeftType = exp1.typeCheck(procedureBuilder);
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
        if (evalLeft.symbolType === TYPE_INFO.TYPE_NUMERIC) {
            retVal = -evalLeft.symbolValue;
            return new SYMBOL_INFO(null, TYPE_INFO.TYPE_NUMERIC, retVal);
        } else {
            throw new SlangException('Type Mismatch!');
        }
    };
    this.typeCheck = function (procedureBuilder) {
        var evalLeftType = exp1.typeCheck(procedureBuilder);
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
        return null;
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

function IfStatement(condition, ifStmts, elseStmts) {
    this.execute = function (runtimeContext) {
        var sInfo = condition.evaluate(runtimeContext),
            stmt = null,
            retVal = null;
        if (sInfo === null || sInfo.symbolType !== TYPE_INFO.TYPE_BOOL) {
            return null;
        }
        if (sInfo.symbolValue === true) {
            for (stmt in ifStmts) {
                if (ifStmts.hasOwnProperty(stmt) === true) {
                    retVal = ifStmts[stmt].execute(runtimeContext);
                    if (retVal !== null) {
                        return retVal;
                    }
                }
            }
        } else if (elseStmts !== null) {
            for (stmt in elseStmts) {
                if (elseStmts.hasOwnProperty(stmt) === true) {
                    retVal = elseStmts[stmt].execute(runtimeContext);
                    if (retVal !== null) {
                        return retVal;
                    }
                }
            }
        }
        return null;
    };
}

function WhileStatement(condition, stmts) {
    var that = this;
    this.execute = function (runtimeContext) {
        var sInfo = condition.evaluate(runtimeContext);
        if (sInfo === null || sInfo.symbolType !== TYPE_INFO.TYPE_BOOL) {
            return null;
        }
        if (sInfo.symbolValue !== true) {
            return null;
        }
        sInfo = null;
        for (var stmt in stmts) {
            if (stmts.hasOwnProperty(stmt) === true) {
                sInfo = stmts[stmt].execute(runtimeContext);
                if (sInfo !== null) {
                    return sInfo;
                }
            }
        }
        that.execute(runtimeContext);
    };
}

function ReturnStatement(exp) {
    this.execute = function (runtimeContext) {
        var sInfo = (exp === null) ? null : exp.evaluate(runtimeContext);
        return sInfo;
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
            if (expr.charAt(index + 1) === '=') {
                tok = TOKEN.TOK_EQ;
                index += 2;
            } else {
                tok = TOKEN.TOK_ASSIGN;
                index += 1;
            }
            break;
        case ';':
            tok = TOKEN.TOK_SEMI;
            index += 1;
            break;
        case '!':
            tok = TOKEN.TOK_NOT;
            index += 1;
            break;
        case '>':
            if (expr.charAt(index + 1) === '=') {
                tok = TOKEN.TOK_GTE;
                index += 2;
            } else {
                tok = TOKEN.TOK_GT;
                index += 1;
            }
            break;
        case '<':
            if (expr.charAt(index + 1) === '=') {
                tok = TOKEN.TOK_LTE;
                index += 2;
            } else if (expr.charAt(index + 1) === '>') {
                tok = TOKEN.TOK_NEQ;
                index += 2;
            } else {
                tok = TOKEN.TOK_LT;
                index += 1;
            }
            break;
        case '&':
            if (expr.charAt(index + 1) === '&') {
                tok = TOKEN.TOK_AND;
                index += 2;
            } else {
                tok = TOKEN.ILLEGAL_TOKEN;
                index += 1;
            }
            break;
        case '|':
            if (expr.charAt(index + 1) === '|') {
                tok = TOKEN.TOK_OR;
                index += 2;
            } else {
                tok = TOKEN.ILLEGAL_TOKEN;
                index += 1;
            }
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
        case ',':
            tok = TOKEN.TOK_COMMA;
            index += 1;
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
                case 'IF':
                    tok = TOKEN.TOK_IF;
                    break;
                case 'ELSE':
                    tok = TOKEN.TOK_ELSE;
                    break;
                case 'THEN':
                    tok = TOKEN.TOK_THEN;
                    break;
                case 'ENDIF':
                    tok = TOKEN.TOK_ENDIF;
                    break;
                case 'WHILE':
                    tok = TOKEN.TOK_WHILE;
                    break;
                case 'WEND':
                    tok = TOKEN.TOK_WEND;
                    break;
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
                case 'FUNCTION':
                    tok = TOKEN.TOK_FUNCTION;
                    break;
                case 'END':
                    tok = TOKEN.TOK_END;
                    break;
                case 'RETURN':
                    tok = TOKEN.TOK_RETURN;
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
    var that = this,
        prog = new TModuleBuilder();
    Lexer.call(this, str); //constructor chaining for inheritance
    this.currentToken = TOKEN.TOK_NULL;
    this.parse = function () {
        that.currentToken = that.getToken();
        return that.parseFunctions();
    };
    this.parseFunctions = function () {
        var procedureBuilder = null,
            procedure = null;
        while (that.currentToken === TOKEN.TOK_FUNCTION) {
            procedureBuilder = that.parseFunction();
            procedure = procedureBuilder.getProcedure();
            if (procedure === null) {
                throw new SlangException("Slang Compilation Error> Error While Parsing Functions!");
            }
            prog.add(procedure);
            that.currentToken = that.getToken();
        }
        return prog.getProgram();
    };
    this.statementList = function (procedureBuilder) {
        var stmts = [],
            stmt = null;
        while (that.currentToken !== TOKEN.TOK_ELSE &&
            that.currentToken !== TOKEN.TOK_ENDIF &&
            that.currentToken !== TOKEN.TOK_WEND &&
            that.currentToken !== TOKEN.TOK_END) {
            stmt = that.statement(procedureBuilder);
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
    this.expr = function (procedureBuilder) {
        return that.bExpr(procedureBuilder);
    };
    this.bExpr = function (procedureBuilder) {
        var token,
            retVal = that.lExpr(procedureBuilder);
        while (that.currentToken === TOKEN.TOK_AND || that.currentToken === TOKEN.TOK_OR) {
            token = that.currentToken;
            that.currentToken = that.getToken();
            var exp = that.bExpr(procedureBuilder); //recursion
            retVal = ((token === TOKEN.TOK_AND) ? new LogicalExp(retVal, exp, RELATION_OPERATOR.TOK_AND) : new LogicalExp(retVal, exp, RELATION_OPERATOR.TOK_OR));
        }
        return retVal;
    };
    this.lExpr = function (procedureBuilder) {
        var token,
            retVal = that.rExpr(procedureBuilder);
        while (that.currentToken === TOKEN.TOK_EQ ||
            that.currentToken === TOKEN.TOK_NEQ ||
            that.currentToken === TOKEN.TOK_LT ||
            that.currentToken === TOKEN.TOK_LTE ||
            that.currentToken === TOKEN.TOK_GT ||
            that.currentToken === TOKEN.TOK_GTE) {
            token = that.currentToken;
            that.currentToken = that.getToken();
            var exp = that.lExpr(procedureBuilder); //recursion
            switch (token) {
            case TOKEN.TOK_EQ:
                retVal = new RelationExp(retVal, exp, RELATION_OPERATOR.TOK_EQ);
                break;
            case TOKEN.TOK_NEQ:
                retVal = new RelationExp(retVal, exp, RELATION_OPERATOR.TOK_NEQ);
                break;
            case TOKEN.TOK_LT:
                retVal = new RelationExp(retVal, exp, RELATION_OPERATOR.TOK_LT);
                break;
            case TOKEN.TOK_LTE:
                retVal = new RelationExp(retVal, exp, RELATION_OPERATOR.TOK_LTE);
                break;
            case TOKEN.TOK_GT:
                retVal = new RelationExp(retVal, exp, RELATION_OPERATOR.TOK_GT);
                break;
            case TOKEN.TOK_GTE:
                retVal = new RelationExp(retVal, exp, RELATION_OPERATOR.TOK_GTE);
                break;
            }
        }
        return retVal;
    };
    this.rExpr = function (procedureBuilder) {
        var token,
            retVal = that.term(procedureBuilder);
        while (that.currentToken === TOKEN.TOK_PLUS || that.currentToken === TOKEN.TOK_SUB) {
            token = that.currentToken;
            that.currentToken = that.getToken();
            var exp = that.rExpr(procedureBuilder); //recursion
            retVal = ((token === TOKEN.TOK_PLUS) ? new BinaryPlus(retVal, exp) : new BinaryMinus(retVal, exp));
        }
        return retVal;
    };
    this.term = function (procedureBuilder) {
        var token,
            retVal = that.factor(procedureBuilder);
        while (that.currentToken === TOKEN.TOK_MUL || that.currentToken === TOKEN.TOK_DIV) {
            token = that.currentToken;
            that.currentToken = that.getToken();
            var exp = that.term(procedureBuilder); //recursion
            retVal = ((token === TOKEN.TOK_MUL) ? new Mul(retVal, exp) : new Div(retVal, exp));
        }
        return retVal;
    };
    this.factor = function (procedureBuilder) {
        var token,
            sInfo = null,
            retVal = null,
            proc = null;
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
            retVal = that.bExpr(procedureBuilder); //recursion
            if (that.currentToken !== TOKEN.TOK_CPAREN) {
                throw new SlangException('Missing Closing Parenthesis!');
            }
            that.currentToken = that.getToken();
        } else if (that.currentToken === TOKEN.TOK_PLUS || that.currentToken === TOKEN.TOK_SUB) {
            token = that.currentToken;
            that.currentToken = that.getToken();
            retVal = that.factor(procedureBuilder); //recursion
            retVal = ((token === TOKEN.TOK_PLUS) ? new UnaryPlus(retVal) : new UnaryMinus(retVal));
        } else if (that.currentToken === TOKEN.TOK_NOT) {
            that.currentToken = that.getToken();
            retVal = that.factor(procedureBuilder); //recursion
            retVal = new LogicalNot(retVal);
        } else if (that.currentToken === TOKEN.TOK_UNQUOTED_STRING) {
            if (prog.isFunction(that.getLastString()) === false) {
                sInfo = procedureBuilder.getSymbol(that.getLastString()) || null;
                if (sInfo === null) {
                    throw new SlangException(that.getLastString() + ' - Undefined Symbol!');
                } else {
                    retVal = new Variable(sInfo);
                }
            } else {
                proc = prog.getProcedure(that.getLastString());
                retVal = that.parseCallProcedure(procedureBuilder, proc);
            }
            that.currentToken = that.getToken();
        } else {
            throw new SlangException('Illegal Token!');
        }
        return retVal;
    };
    this.statement = function (procedureBuilder) {
        var retVal = null;
        switch (that.currentToken) {
        case TOKEN.TOK_VAR_STRING:
        case TOKEN.TOK_VAR_NUMBER:
        case TOKEN.TOK_VAR_BOOL:
            retVal = that.parseVariableStatement(procedureBuilder);
            that.currentToken = that.getToken();
            break;
        case TOKEN.TOK_PRINT:
            retVal = that.parsePrintStatement(procedureBuilder);
            that.currentToken = that.getToken();
            break;
        case TOKEN.TOK_IF:
            retVal = that.parseIfStatement(procedureBuilder);
            that.currentToken = that.getToken();
            break;
        case TOKEN.TOK_WHILE:
            retVal = that.parseWhileStatement(procedureBuilder);
            that.currentToken = that.getToken();
            break;
        case TOKEN.TOK_RETURN:
            retVal = that.parseReturnStatement(procedureBuilder);
            that.currentToken = that.getToken();
            break;
        case TOKEN.TOK_UNQUOTED_STRING:
            retVal = that.parseAssignmentStatement(procedureBuilder);
            that.currentToken = that.getToken();
            break;
        default:
            console.log(that.currentToken);
            throw new SlangException('Invalid Statement!');
        }
        return retVal;
    };
    this.parseIfStatement = function (procedureBuilder) {
        var truePart = null,
            falsePart = null;
        that.currentToken = that.getToken();
        var exp = that.bExpr(procedureBuilder);
        if (exp.typeCheck(procedureBuilder) !== TYPE_INFO.TYPE_BOOL) {
            throw new SlangException("Slang Compilation Error> Expected a BOOLEAN expression!");
        }
        if (that.currentToken !== TOKEN.TOK_THEN) {
            throw new SlangException("Slang Compilation Error> THEN Expected!");
        }
        that.currentToken = that.getToken();
        truePart = that.statementList(procedureBuilder);
        if (that.currentToken === TOKEN.TOK_ENDIF) {
            return new IfStatement(exp, truePart, falsePart);
        }
        if (that.currentToken !== TOKEN.TOK_ELSE) {
            throw new SlangException('ELSE Expected!');
        }
        that.currentToken = that.getToken();
        falsePart = that.statementList(procedureBuilder);
        if (that.currentToken !== TOKEN.TOK_ENDIF) {
            throw new SlangException('ENDIF Expected!');
        }
        return new IfStatement(exp, truePart, falsePart);
    };
    this.parseWhileStatement = function (procedureBuilder) {
        that.currentToken = that.getToken();
        var exp = that.bExpr(procedureBuilder);
        if (exp.typeCheck(procedureBuilder) !== TYPE_INFO.TYPE_BOOL) {
            throw new SlangException("Slang Compilation Error> Expected a BOOLEAN expression!");
        }
        var body = that.statementList(procedureBuilder);
        if (that.currentToken !== TOKEN.TOK_WEND) {
            throw new SlangException('WEND Expected!');
        }
        return new WhileStatement(exp, body);
    };
    this.parsePrintStatement = function (procedureBuilder) {
        that.currentToken = that.getToken();
        var exp = that.bExpr(procedureBuilder);
        exp.typeCheck(procedureBuilder);
        if (that.currentToken !== TOKEN.TOK_SEMI) {
            throw new SlangException("; is Expected!");
        }
        return new PrintStatement(exp);
    };
    this.parseVariableStatement = function (procedureBuilder) {
        var token = that.currentToken;
        that.currentToken = that.getToken();
        if (that.currentToken === TOKEN.TOK_UNQUOTED_STRING) {
            var sInfo = new SYMBOL_INFO(that.getLastString(), ((token === TOKEN.TOK_VAR_BOOL) ? TYPE_INFO.TYPE_BOOL : ((token === TOKEN.TOK_VAR_NUMBER) ? TYPE_INFO.TYPE_NUMERIC : TYPE_INFO.TYPE_STRING)), null);
            that.currentToken = that.getToken();
            if (that.currentToken === TOKEN.TOK_SEMI) {
                procedureBuilder.getTable().add(sInfo);
                return new VariableDeclStatement(sInfo);
            } else {
                throw new SlangException("Slang Compilation Error> ; Expected!");
            }
        } else {
            throw new SlangException("Slang Compilation Error> Invalid variable declaration!");
        }
    };
    this.parseAssignmentStatement = function (procedureBuilder) {
        var variable = that.getLastString(),
            sInfo = procedureBuilder.getTable().get(variable) || null,
            exp = null,
            stmt = null;
        if (sInfo === null) {
            throw new SlangException("Slang Compilation Error> " + variable + " - Variable Not Found!");
        }
        that.currentToken = that.getToken();
        if (that.currentToken !== TOKEN.TOK_ASSIGN) {
            throw new SlangException("Slang Compilation Error> = Expected!");
        }
        that.currentToken = that.getToken();
        exp = that.bExpr(procedureBuilder);
        if (exp.typeCheck(procedureBuilder) !== sInfo.symbolType) {
            throw new SlangException("Slang Compilation Error> Type Mismatch In Assigment!");
        }
        if (that.currentToken !== TOKEN.TOK_SEMI) {
            throw new SlangException("Slang Compilation Error> ; Expected!");
        }
        stmt = new AssignmentStatement(exp);
        stmt.setSymbol(sInfo);
        return stmt;
    };
    this.parseCallProcedure = function (procedureBuilder, procedure) {
        var exp = null,
            actualParams = [];
        that.currentToken = that.getToken();
        if (that.currentToken !== TOKEN.TOK_OPAREN) {
            throw new SlangException("Slang Compilation Error> Opening Parenthesis Expected!");
        }
        that.currentToken = that.getToken();
        while (true) {
            exp = that.bExpr(procedureBuilder);
            exp.typeCheck(procedureBuilder);
            if (that.currentToken === TOKEN.TOK_COMMA) {
                actualParams.push(exp);
                that.currentToken = that.getToken();
                continue;
            }
            if (that.currentToken !== TOKEN.TOK_CPAREN) {
                throw new SlangException("Slang Compilation Error> Closing Parenthesis Expected!");
            } else {
                actualParams.push(exp);
                break;
            }
        }
        if (procedure !== null) {
            return new CallExp(procedure, actualParams, procedureBuilder.getProcedureName(), false);
        } else {
            return new CallExp(null, actualParams, procedureBuilder.getProcedureName(), true);
        }
    };
    this.parseFunction = function () {
        var procedureBuilder = new ProcedureBuilder("", new CompilationContext()),
            returnType = null,
            statement = null,
            statements = null;
        if (that.currentToken !== TOKEN.TOK_FUNCTION) {
            return null;
        }
        that.currentToken = that.getToken();
        if (!(that.currentToken === TOKEN.TOK_VAR_NUMBER ||
                that.currentToken === TOKEN.TOK_VAR_BOOL ||
                that.currentToken === TOKEN.TOK_VAR_STRING)) {
            return null;
        }
        returnType = that.currentToken === TOKEN.TOK_VAR_BOOL ? TYPE_INFO.TYPE_BOOL : (that.currentToken === TOKEN.TOK_VAR_NUMBER ? TYPE_INFO.TYPE_NUMERIC : TYPE_INFO.TYPE_STRING);
        procedureBuilder.setType(returnType); //Assign Return Type
        that.currentToken = that.getToken();
        if (that.currentToken !== TOKEN.TOK_UNQUOTED_STRING) {
            return null;
        }
        procedureBuilder.setProcedureName(that.getLastString());
        that.currentToken = that.getToken();
        if (that.currentToken !== TOKEN.TOK_OPAREN) {
            return null;
        }
        that.parseFormalParameters(procedureBuilder);
        if (that.currentToken !== TOKEN.TOK_CPAREN) {
            return null;
        }
        that.currentToken = that.getToken();
        statements = that.statementList(procedureBuilder);
        if (that.currentToken !== TOKEN.TOK_END) {
            throw new SlangException("Slang Compilation Error> END Expected!");
        }
        for (statement in statements) {
            if (statements.hasOwnProperty(statement) === true) {
                procedureBuilder.addStatement(statements[statement]);
            }
        }
        return procedureBuilder;
    };
    this.parseFormalParameters = function (procedureBuilder) {
        var typeInfos = [],
            sInfo = null,
            paramType = null;
        if (that.currentToken !== TOKEN.TOK_OPAREN) {
            throw new SlangException("Slang Compilation Error> Opening Parenthesis Expected!");
        }
        that.currentToken = that.getToken();
        while (that.currentToken === TOKEN.TOK_VAR_NUMBER ||
            that.currentToken === TOKEN.TOK_VAR_BOOL ||
            that.currentToken === TOKEN.TOK_VAR_STRING) {
            paramType = that.currentToken === TOKEN.TOK_VAR_BOOL ? TYPE_INFO.TYPE_BOOL : (that.currentToken === TOKEN.TOK_VAR_NUMBER ? TYPE_INFO.TYPE_NUMERIC : TYPE_INFO.TYPE_STRING);
            that.currentToken = that.getToken();
            if (that.currentToken !== TOKEN.TOK_UNQUOTED_STRING) {
                throw new SlangException("Slang Compilation Error> Variable Name Expected!");
            }
            sInfo = new SYMBOL_INFO(that.getLastString(), paramType, null);
            typeInfos.push(paramType);
            procedureBuilder.addFormals(sInfo);
            procedureBuilder.addLocal(sInfo);
            that.currentToken = that.getToken();
            if (that.currentToken !== TOKEN.TOK_COMMA) {
                break;
            }
            that.currentToken = that.getToken();
        }
        prog.addFunctionPrototype(procedureBuilder.getProcedureName(), procedureBuilder.getType(), typeInfos);
        return true;
    };
    this.parseReturnStatement = function (procedureBuilder) {
        var exp = null;
        that.currentToken = that.getToken();
        exp = that.bExpr(procedureBuilder);
        if (that.currentToken !== TOKEN.TOK_SEMI) {
            throw new SlangException("Slang Compilation Error> ; Expected!");
        }
        exp.typeCheck(procedureBuilder);
        return new ReturnStatement(exp);
    };
}

function runProgram(fileName) {
    var code,
        parser,
        program,
        runtimeContext;
    fs.readFile('./programs/' + fileName + '.slang', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        code = data.replace(/(\r\n|\n|\r)/gm, " ");
        parser = new RDParser(code);
        program = parser.parse();
        console.log("SlangJS > Parsing Complete!...................................................");
        runtimeContext = new RuntimeContext(program);
        program.execute(runtimeContext, null);
        console.log("SlangJS > Interpretation Complete!............................................");
    });
}

runProgram("Fact");