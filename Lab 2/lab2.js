
// context
let gl;  
let shaderProgram;

// viewport info 
let vp_minX, vp_maxX, vp_minY, vp_maxY, vp_width, vp_height;

// point, horizontal line, vertical line, triangle, square
const shapes = [];

// scalars
const pointSizeScalar = 3;
const lineSizeScalar = 1;
const triangleSizeScalar = 1;
const squareSizeScalar = 1;
const customizedShapeScalar = 3;

// default sizes
const defaultPointSize = 1;
const defaultLineSize = 0.1;
const defaultTriangleSize = 0.2;
const defaultSquareSize = 0.2;
const defaultCustomizedShapeSize = 0.2;

// colors 
const presetColors = [[1, 0.18, 0.2],
                      [1, 0.7, 0.18],
                      [0.5, 1, 0.18],
                      [0.18, 0.7, 1],
                      [0.83, 0.31, 0.14]];

let currentShapeIndex = 0;

// transformation params
const moveSpeed = 0.05;
const rotateSpeed = 5; // in degrees
const scaleFactor = 0.05;

let nextShapeColor;

// functions

// main
function webGLStart() {
    initialize();

    resizeShapes();

    document.addEventListener('keydown', onKeyDown, false);
}

// initialize everything
function initialize() {
    let canvas = document.getElementById("Canvas");

    initGL(canvas);
    initShaders();
    setAttrLocations();

    shapes.push(new Shape('p', gl.POINTS, 1, generateColor(presetColors[0], 1, true)));
    shapes.push(new Shape('l', gl.LINES, 2, generateColor(presetColors[1], 2, true)));
    shapes.push(new Shape('t', gl.TRIANGLES, 3, generateColor(presetColors[2], 3, true)));
    shapes.push(new Shape('q', gl.TRIANGLES, 6, generateColor(presetColors[3], 6, true)));
    shapes.push(new Shape('O', gl.TRIANGLES, 27, generateColor(presetColors[4], 27, true)));

    
    initVertices();
    for (let i = 0; i < shapes.length; i++) {
        shapes[i].initialize();
    }

    initScene();
}

// init gl
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.canvasWidth = canvas.width;
        gl.canvasHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

// set attribute locations
function setAttrLocations() {
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

// generate colors
function generateColor(color, num, gradient) {
    let color_0 = color;
    let color_1 = color;
    let color_2 = color;
    if (gradient) {
        color_0 = [1, color[1], color[2]];
        color_1 = [color[0], 1, color[2]];
        color_2 = [1, color[1], color[2]];
    }

    let colors = [color_0, color_1, color_2];
    let result = [];
    for (let i = 0; i < num; i++) {
        result = result.concat(colors[i % 3])
    }

    return result;
}

// init the scene
function initScene() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    vp_minX = 0; vp_maxX = gl.canvasWidth; vp_width = vp_maxX - vp_minX + 1;
    vp_minY = 0; vp_maxY = gl.canvasHeight; vp_height = vp_maxY - vp_minY + 1;
    gl.viewport(vp_minX, vp_minY, vp_width, vp_height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

// init vertices
function initVertices() {
    let offset = 0;

    shapes[0].vertices = [0, 0, 0];

    offset = defaultLineSize * lineSizeScalar / 2;
    shapes[1].vertices = [-offset, 0, 0, 
                          offset, 0, 0];
    
    offset = defaultTriangleSize * triangleSizeScalar / 2;
    shapes[2].vertices = [-offset, -offset, 0, 
                          offset, -offset, 0,
                          offset, offset, 0];    
    
    offset = defaultSquareSize * squareSizeScalar / 2;
    shapes[3].vertices = [-offset, -offset, 0, 
                          offset, -offset, 0,
                          offset, offset, 0,
                          -offset, -offset, 0, 
                          -offset, offset, 0,
                          offset, offset, 0];                   
    
    offset = defaultCustomizedShapeSize * customizedShapeScalar / 2;
    shapes[4].vertices = [0, offset, 0,
                          0, 0, 0,
                          -0.87 * offset, -0.5 * offset, 0,
                          0, offset, 0,
                          0, 0, 0,
                          0.87 * offset, -0.5 * offset, 0,
                          -0.87 * offset, -0.5 * offset, 0,
                          0, 0, 0,
                          0.87 * offset, -0.5 * offset, 0,
                          0, offset, 0,
                          -0.43 * offset, 0.75 * offset, 0,
                          -0.43 * offset, 0.25 * offset, 0,
                          -0.43 * offset, 0.25 * offset, 0,
                          -0.87 * offset, 0, 0,
                          -0.87 * offset, -0.5 * offset, 0,
                          0, offset, 0,
                          0.43 * offset, 0.75 * offset, 0,
                          0.43 * offset, 0.25 * offset, 0,
                          0.43 * offset, 0.25 * offset, 0,
                          0.87 * offset, 0, 0, 
                          0.87 * offset, -0.5 * offset, 0,
                          0, -0.5 * offset, 0,
                          -0.43 * offset, -0.75 * offset, 0,
                          -0.87 * offset, -0.5 * offset, 0,
                          0, -0.5 * offset, 0,
                          0.43 * offset, -0.75 * offset, 0,
                          0.87 * offset, -0.5 * offset, 0];
}

// draw all stuffs
function drawAll() {
    
    gl.viewport(vp_minX, vp_minY, vp_width, vp_height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (let i = 0; i < shapes.length; i++) {
        shapes[i].draw();
    }
}

// act when keys are pressed
function onKeyDown(event) {
    event.preventDefault();

    let inputKey = event.key;
    
    for (let i = 0; i < shapes.length; i++) 
        if (inputKey == shapes[i].name) 
            addNewPosition(i);

    if (shapes[currentShapeIndex].matrixStack.length > 0) {
        let matrix = shapes[currentShapeIndex].matrixStack.top;

        switch (inputKey) {
            // move left
            case 'a':
                mat4.translate(matrix, [-moveSpeed, 0, 0]);
                
                break;
            //move up
            case 'w':
                mat4.translate(matrix, [0, moveSpeed, 0]);
                
                break;
            // move down
            case 's':
                mat4.translate(matrix, [0, -moveSpeed, 0]);

                break;
            // move right
            case 'd':
                mat4.translate(matrix, [moveSpeed, 0, 0]);
                
                break;
            // rotate counter clockwise
            case 'R':
                mat4.rotate(matrix, degToRad(10), [0, 0, 1]);
                
                break;
            // scale smaller
            case 'e':
                mat4.scale(matrix, [1 - scaleFactor, 1 - scaleFactor, 1 - scaleFactor]);
                
                break;
            // scale bigger
            case 'E':
                mat4.scale(matrix, [1 + scaleFactor, 1 + scaleFactor, 1 + scaleFactor]);
                
                break;
            // change shape of current object
            case '1':
                let prevIndex = currentShapeIndex;
                currentShapeIndex++;
                if (currentShapeIndex >= shapes.length)
                    currentShapeIndex = 0;

                shapes[currentShapeIndex].pushMatrix(matrix);
                shapes[prevIndex].popMatrix();

                break;
            // change color of current object
            case '2':
                let color = shapes[currentShapeIndex].colorStack.top;
                let colorIndex = -1;
                for (let i = 0; i < presetColors.length; i++) {
                    let equal = true;
                    presetColor = generateColor(presetColors[i], shapes[currentShapeIndex].vertices.length / vertexSize, true);
                    for (let j = 0; j < color.length; j++) 
                        if (presetColor[j] != color[j]) 
                            equal = false;
                        
                    if (equal) {
                        colorIndex = i;
                        break;
                    }
                }
                colorIndex++;
                if (colorIndex >= presetColors.length)
                    colorIndex = 0;

                color = generateColor(presetColors[colorIndex], shapes[currentShapeIndex].vertices.length / vertexSize, true);
                shapes[currentShapeIndex].colorStack.modifyTop(color);

                break;
            // change color to red
            case 'r':
                nextShapeColor = [1, 0, 0];

                break;
            // change color to green
            case 'g':
                nextShapeColor = [0, 1, 0];

                break;
            // change color to blue
            case 'b':
                nextShapeColor = [0, 0, 1];

                break;
            // clear 
            case 'c':
                clearScene();
                return;
            default:
                break;
        }
    }

    drawAll();
        
}

// add random vertices
function addNewPosition(index) {
    
    if (nextShapeColor != null) {
        shapes[index].defaultColor = generateColor(nextShapeColor, shapes[index].vertices.length, false);
        nextShapeColor = null;
    }

    let x = Math.random() * 2 - 1;
    let y = Math.random() * 2 - 1;

    let matrix = mat4.create();
    mat4.identity(matrix);
    mat4.translate(matrix, [x,y,0]);
    shapes[index].pushMatrix(matrix);
    currentShapeIndex = index;


}


// resize objects based on scalars
function resizeShapes() {
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "pointSize"), defaultPointSize * pointSizeScalar);
}

// clear the scene
function clearScene() {
    for (let i = 0; i < shapes.length; i++) {
        shapes[i].clear();
    }
    initScene();
}

// convert degrees to radian
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}
