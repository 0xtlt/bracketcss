function bracketcss(code) {
    let variables = {};
    let transpiled_css = "";

    let lines = code.split("\n").map(line => line.trim()).filter(line => line.length !== 0);

    let mediaQuery = false;
    let cssQuery = [];
    let breakPoints = [];
    let typeBreak = "max";

    let brackets = 0;

    for(let n = 0; n < lines.length; n++) {
        let line = lines[n];

        //variable definition
        if(line[0] === "$") {
            const variable = /\$(([a-zA-Z0-9_-])+):(.*);/.exec(line);

            variables[variable[1]] = variable[3].trim();
        }

        //replace variable
        line = line.replace(/\${(([a-zA-Z0-9_-])+)}/g, content => {
            let tmp = /\${(([a-zA-Z0-9_-])+)}/.exec(content);
            return variables[tmp[1]];
        })

        if(mediaQuery) {
            cssQuery.push(line);
            if(line.includes("{")) {
                brackets++;
            }

            if(line.includes("}")) {
                brackets--;
            }

            if(brackets === 0) {
                transpiled_css += block(cssQuery, breakPoints, typeBreak);

                cssQuery = [];
                breakPoints = [];

                mediaQuery = false;
            }
        } else {
            if(line.toLowerCase().includes("@media screen and")) {
                const tmp = /@media screen and \(?(([a-zA-Z0-9-])+):( )?\[(([a-zA-Z0-9, ])+)\]/.exec(line.toLowerCase());

                typeBreak = tmp[1];
                breakPoints = tmp[4].replace(/ /g, "").split(",");

                brackets = 1;
                
                mediaQuery = true;
            } else {
                transpiled_css += "\n" + line;
            }
        }
    }
    
    transpiled_css = transpiled_css.replace(/\$(([a-zA-Z0-9_-])+):(.*);/g, "").replace(/\n/g, "").trim();

    return transpiled_css;
}

//The block function is used to make the media queries using bracketcss
function block(code = [], breakpoints = [], type = "max") {
    let style = {};
    breakpoints.forEach(bp => style[bp] = {});
    const eq = {...breakpoints};
    
    let objectData = null

    for(let n = 0; n < code.length; n++) {
        let line = code[n];
        
        if(line[line.length - 1] === "{") {
            objectData = line.substr(0, line.length-1).trim();
            breakpoints.forEach(bp => style[bp][objectData] ? "" : style[bp][objectData] = []);
        } else if(line[line.length - 1] === "}") {
            objectData = null;
        } else if(objectData) {
            let property = /(.*):( )?(.*)/.exec(line.trim());

            if(property[3][0] !== "[") {
                breakpoints.forEach(bp => style[bp][objectData].push(line));
            } else {
                let values = property[3].substr(1)
                values = values.substr(0, values.includes(";") ? values.length - 2 : values.length - 1).split(",").map(value => value.trim());
                values.forEach((value, index) => {
                    style[eq[index]][objectData].push(`${property[1]}: ${value};`);
                })
            }
        }
    }

    // media queries GENERATOR

    let style_css = "";

    breakpoints.forEach(bp => {
        style_css += `@media screen and (${type}: ${bp}){`;
        style_css += `${Object.keys(style[bp]).map(object => `${object}{${style[bp][object].join("")}}`)}`;
        style_css += `}`;
    });

    return style_css;
}

module.exports = bracketcss;