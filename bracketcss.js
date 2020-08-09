const vm = require('vm');
const context = {
    result: null
};
vm.createContext(context);
let globalChild = {};

/**
 * @param {string} bracketcss 
 * @returns {string|object} css | error
 */
function bracketcss(code = "") {
    let logFunction = false;
    let bracketFunction = 0;
    let ableToImport = true;
    let errors = [];
    let variables = {};

    let transpiled_css = "";

    let lines = code.split("\n").map(line => line.trim());

    let mediaQuery = false;
    let mediaQueryBracketLevel = 0;
    let cssQuery = [];
    let breakPoints = [];
    let typeBreak = "max";
    let cssBlock = [];

    let brackets = 0;

    for (let n = 0; n < lines.length; n++) {
        let line = lines[n];

        //function definition
        if (bracketFunction) {
            logFunction += line;
            bracketFunction += line.match(/{/g) ? line.match(/{/g).length : 0;
            bracketFunction -= line.match(/}/g) ? line.match(/}/g).length : 0;

            if (!bracketFunction) {
                vm.runInContext(logFunction, context);
            }
        }

        if (line.substr(0, 3) === "fnc") {
            logFunction = line.replace('fnc', 'function');
            bracketFunction = 1;
        }

        //variable definition
        if (line[0] === "$" && !logFunction) {
            const variable = /\$(([a-zA-Z0-9_-])+):(.*);/.exec(line);

            variables[variable[1]] = variable[3].trim();
        }

        //replace variable
        if (!logFunction) {
            line = line.replace(/\${(([a-zA-Z0-9_-])+)}/g, content => {
                let tmp = /\${(([a-zA-Z0-9_-])+)}/.exec(content);

                if (!variables[tmp[1]]) {
                    let error = `error at line : ${n}, variable "${tmp[1]}" is not defined`;
                    errors.push(error);
                    return error;
                } else {
                    return variables[tmp[1]];
                }
            });

            //then execute function
            if (line.match(/\(/)) {
                let values = line.split(":").splice(1).join(":");
                let property = line.split(":")[0];

                line = `${property}:${lineFunctions(values)}`;
            }
        }

        if (line.includes("{") && !logFunction) {
            ableToImport = false;
            brackets++;
        } else if (line.includes("}") && !logFunction) {
            brackets--;
        }

        if (ableToImport && line[0] === "@" && !logFunction) {
            transpiled_css += line;
        } else if (!logFunction) {
            if (mediaQuery) {
                cssQuery.push(line);

                if (brackets === mediaQueryBracketLevel) {
                    transpiled_css += v2Block(cssQuery, breakPoints, typeBreak);

                    cssQuery = [];
                    breakPoints = [];

                    mediaQuery = false;
                }
            } else {
                if (line.toLowerCase().includes("@media screen and")) {
                    mediaQueryBracketLevel = brackets;
                    const tmp = /@media screen and \(?(([a-zA-Z0-9-])+):( )?\[(([a-zA-Z0-9, ])+)\]/.exec(line.toLowerCase());

                    typeBreak = tmp[1];
                    breakPoints = tmp[4].replace(/ /g, "").split(",");

                    mediaQuery = true;
                } else {
                    cssBlock.push(line);

                    if (brackets === 0) {
                        if (cssBlock.filter(line => line.length).length) {
                            let importAfterGlobal = make(wrapperBlock(cssBlock));
                            transpiled_css += makeGlobalChild() + importAfterGlobal;
                        }

                        cssBlock = [];
                    }
                }
            }
        }

        if (!bracketFunction && logFunction) {
            logFunction = false;
        }
    }

    transpiled_css = transpiled_css.replace(/\$(([a-zA-Z0-9_-])+):(.*);/g, "").replace(/\n/g, "").trim();

    if (errors.length) {
        console.error(`${errors.length} error${errors.length === 1 ? "" : "s"} have been detected :`);
        errors.forEach(error => {
            console.error(error);
        })
    }

    return errors.length ? errors : transpiled_css;
}

function makeChild(child, prefix = null, withBlocks = false) {
    if (withBlocks) {
        return Object.keys(child).map(key => {
            if (Object.keys(child[key].children).length) {
                globalChild[`${prefix ? prefix + " "+ key : key}`] = child[key];
                return makeChild(child[key].children, prefix ? prefix + " " + key : key, withBlocks);
            } else {
                return [`${prefix ? prefix + " "+ key : key}{`, ...child[key].code, `}`];
            }
        });
    } else {
        return Object.keys(child).map(key => {
            if (Object.keys(child[key].children).length) {
                globalChild[`${prefix ? prefix + " "+ key : key}`] = child[key];
                return makeChild(child[key].children, prefix ? prefix + " " + key : key, withBlocks);
            } else {
                return `${prefix ? prefix + " "+ key : key}{${child[key].code.join("")}}`;
            }
        });
    }
}

function makeGlobalChild() {
    let tmp = [];
    Object.keys(globalChild).forEach(key => {
        globalChild[key].children = {};

        tmp = [...tmp, ...makeChild(globalChild, null, true)];
    });

    tmp = tmp.flat(Infinity);

    globalChild = {};

    return tmp.join("");
}

function make(object, withBlocks = false) {
    let ref = object.main;

    let result = null;

    if (withBlocks) {
        result = makeChild(ref.children, null, withBlocks).flat(Infinity);
    } else {
        result = makeChild(ref.children, null, withBlocks).flat(Infinity).join("");
    }

    return result;
}

function wrapperBlock(code) {
    let style = {
        main: {
            children: {}
        }
    };
    let cssPath = [];

    let refCode = null;

    for (let n = 0; n < code.length; n++) {
        let line = code[n];

        if (line[line.length - 1] === "{") {
            let tmp = line.substr(0, line.length - 1).trim();
            cssPath.push(tmp);
            let exist = null;
            let el = style.main;
            cssPath.forEach((element, index) => {
                if (element[0] === "&" && index) {
                    console.warn("& element is undefined");
                } else {
                    exist = el.children[element];
                    if (!exist) {
                        el.children[element] = {
                            children: {},
                            code: []
                        }
                    }

                    refCode = el.children[element].code;

                    el = el.children[element];
                }
            })
        } else if (line[line.length - 1] === "}") {
            cssPath.splice(cssPath.length - 1, 1);
        } else {
            if (refCode && line.length) {
                refCode.push(line);
            }
        }
    }

    return style;
}

function v2Block(code = [], breakpoints = [], type = "max") {
    // ---> first the global treatment with the new method
    let firstStep = make(wrapperBlock(code), true);

    Object.keys(globalChild).forEach(key => {
        globalChild[key].children = {};

        firstStep = [...makeChild(globalChild, null, true), ...firstStep];
    });

    firstStep = firstStep.flat(Infinity);

    globalChild = {};

    // ---> then block processing using the old method
    return block(firstStep, breakpoints, type);
}

//The block function is used to make the media queries using bracketcss
function block(code = [], breakpoints = [], type = "max") {
    let style = {};
    breakpoints.forEach(bp => style[bp] = {});
    const eq = {
        ...breakpoints
    };

    let objectData = null

    for (let n = 0; n < code.length; n++) {
        let line = code[n].trim();

        if (line[line.length - 1] === "{") {
            objectData = line.substr(0, line.length - 1).trim();
            breakpoints.forEach(bp => style[bp][objectData] ? "" : style[bp][objectData] = []);
        } else if (line[line.length - 1] === "}") {
            objectData = null;
        } else if (objectData) {
            let property = /(.*):( )?(.*)/.exec(line.trim());

            if (property[3][0] !== "[") {
                breakpoints.forEach(bp => style[bp][objectData].includes(line) ? "" : style[bp][objectData].push(line));
            } else {
                let values = property[3].substr(1)
                values = values.substr(0, values.includes(";") ? values.length - 2 : values.length - 1).split(",").map(value => value.trim());
                values.forEach((value, index) => {
                    if (!style[eq[index]][objectData].includes(`${property[1]}: ${value};`)) {
                        style[eq[index]][objectData].push(`${property[1]}: ${value};`);
                    }
                })
            }
        }
    }

    // media queries GENERATOR

    let style_css = "";

    breakpoints.forEach(bp => {
        style_css += `@media screen and (${type}: ${bp}){`;
        style_css += `${Object.keys(style[bp]).map(object => `${object}{${style[bp][object].join("")}}`).join("")}`;
        style_css += `}`;
    });

    return style_css;
}

/**
 * lineFunctions will convert every functions into his result
 * @param {string} line 
 * @returns {string} line
 */
function lineFunctions(line = "") {
    line = line.trim();
    let elements = line.split("");
    let tab = 0;
    let toCompute = '';
    let prepared = false;
    let valid = false;

    for (let i = 0; i < elements.length; i++) {
        let char = elements[i];

        if (!valid && /^(([a-zA-Z_])+)$/.test(char)) {
            //prevent [function, function] crash
            valid = true;
        }

        if (valid) {
            if (char === '(') {
                tab++;
            } else if (char === ')') {
                tab--;

                if (!tab) {
                    valid = false;
                    prepared = true;
                }
            }

            toCompute += char;

            //execute in VM
            if (prepared) {
                prepared = false;
                vm.runInContext(`result = ${toCompute}`, context);
                line = line.replace(toCompute, context.result)
                toCompute = "";
            }
        }
    }

    return line;
}

module.exports = bracketcss;