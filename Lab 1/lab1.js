// context
let gl;  
let shaderProgram;

// viewport info 
let vp_minX, vp_maxX, vp_minY, vp_maxY, vp_width, vp_height;

// point, horizontal line, vertical line, triangle, square
const shapes = ['p', 'h', 'v', 't', 'q'];

// position buffers
const vertexPositionBufferMap = new Map();

// vertices
const vertexSize = 3;
const verticesMap = new Map();
for (let i = 0; i < shapes.length; i++)  {
    verticesMap.set(shapes[i], []);
}

// scalars
const pointSizeScalar = 3;
const lineSizeScalar = 1;
const triangleSizeScalar = 1;
const squareSizeScalar = 1;

// default sizes
const defaultPointSize = 1;
const defaultLineSize = 0.1;
const defaultTriangleSize = 0.2;
const defaultSquareSize = 0.2;

// colors 
const colorMap = new Map();
colorMap.set(shapes[0], [1, 0.18, 0.2]);
colorMap.set(shapes[1], [1, 0.7, 0.18 ]);
colorMap.set(shapes[2], [0.5, 1, 0.18 ]);
colorMap.set(shapes[3], [0.18, 0.7, 1 ]);
colorMap.set(shapes[4], [0.6, 0.18, 1]);


// functions

// main
function webGLStart() {
    let canvas = document.getElementById("Canvas");

    initGL(canvas);
    initShaders();

    ResizeShapes();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    initScene();

    document.addEventListener('keydown', onKeyDown, false);
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

// create buffers
function CreateBuffers(shape) {
    
    CreatePositionBuffer(shape);
    CreateColorBuffer(shape);
}

// create single position buffer
function CreatePositionBuffer(shape) {
    vertexPositionBufferMap.set(shape, gl.createBuffer());

    let vertexPositionBuffer = vertexPositionBufferMap.get(shape);
    let vertices = verticesMap.get(shape);

    vertexPositionBuffer.itemSize = vertexSize;
    vertexPositionBuffer.numItems = vertices.length / vertexSize;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
}

function GenerateColors(num, shape) {
    let color = colorMap.get(shape);
    let color_0 = [color[0] * 2, color[1], color[2]];
    let color_1 = [color[0], color[1] * 2, color[2]];
    let color_2 = [color[0], color[1], color[2] * 2];

    let colors = [color_0, color_1, color_2];
    let result = [];
    for (let i = 0; i < num; i++) {
        result = result.concat(colors[i % 3])
    }

    return result;
}
// create single color buffer
function CreateColorBuffer(shape) {
    let colorBuffer = gl.createBuffer();
    let vertices = verticesMap.get(shape);
    let color = GenerateColors(vertices.length / 3, shape);

    colorBuffer.itemSize = 3;
    colorBuffer.numItems = vertices.length / 3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    // let color = colorMap.get(shape);
    // gl.vertexAttrib4f(gl.getAttribLocation(shaderProgram, "aVertexColor"), color[0], color[1], color[2], color[3]);
}

// draw single object
function DrawShape(shape) {
    switch (shape) {
        case 'p':
            gl.drawArrays(gl.POINTS, 0, vertexPositionBufferMap.get(shape).numItems);
            break;
        case 'h':
            gl.drawArrays(gl.LINES, 0, vertexPositionBufferMap.get(shape).numItems);
            break;
        case 'v':
            gl.drawArrays(gl.LINES, 0, vertexPositionBufferMap.get(shape).numItems);
            break;
        case 't':
            gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBufferMap.get(shape).numItems);
            break;
        case 'q':
            gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBufferMap.get(shape).numItems);
            break;       
        default:
            console.log("Error: shape", shape, "not allowed");
            break;               
    }
}

// init the scene
function initScene() {
    vp_minX = 0; vp_maxX = gl.canvasWidth; vp_width = vp_maxX - vp_minX + 1;
    vp_minY = 0; vp_maxY = gl.canvasHeight; vp_height = vp_maxY - vp_minY + 1;
    gl.viewport(vp_minX, vp_minY, vp_width, vp_height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

// draw all stuffs
function DrawAll() {
    initScene();

    for (let i = 0; i < shapes.length; i++) {
        CreateBuffers(shapes[i]);
        DrawShape(shapes[i]);
    }
}

// act when keys are pressed
function onKeyDown(event) {
    event.preventDefault();

    let inputKey = String.fromCharCode(event.keyCode).toLowerCase();

    if (inputKey == 'c') {
        ClearScene();
    }
    else if (shapes.includes(inputKey)) {
        AddVertices(inputKey);
        DrawAll();        
    }
}

// add random vertices
function AddVertices(shape) {
    const vertices = verticesMap.get(shape);

    let NDC_X = Math.random() * 2 - 1;
    let NDC_Y = Math.random() * 2 - 1;

    let offset = 0;

    switch (shape) {
        case 'p':
            vertices.push(NDC_X);
            vertices.push(NDC_Y);
            vertices.push(0.0);

            break;
        case 'h':
            offset = defaultLineSize * lineSizeScalar / 2;

            vertices.push(NDC_X - offset);
            vertices.push(NDC_Y);
            vertices.push(0.0);

            vertices.push(NDC_X + offset);
            vertices.push(NDC_Y);
            vertices.push(0.0);

            break;
        case 'v':
            offset = defaultLineSize * lineSizeScalar / 2;

            vertices.push(NDC_X);
            vertices.push(NDC_Y - offset);
            vertices.push(0.0);

            vertices.push(NDC_X);
            vertices.push(NDC_Y + offset);
            vertices.push(0.0);

            break;
        case 't': 
            offset = defaultTriangleSize * triangleSizeScalar / 2;

            vertices.push(NDC_X - offset);
            vertices.push(NDC_Y - offset);
            vertices.push(0.0);

            vertices.push(NDC_X + offset);
            vertices.push(NDC_Y - offset);
            vertices.push(0.0);
            
            vertices.push(NDC_X + offset);
            vertices.push(NDC_Y + offset);
            vertices.push(0.0);

            break;
        case 'q':
            offset = defaultSquareSize * squareSizeScalar / 2;

            vertices.push(NDC_X - offset);
            vertices.push(NDC_Y - offset);
            vertices.push(0.0);

            vertices.push(NDC_X + offset);
            vertices.push(NDC_Y - offset);
            vertices.push(0.0);
            
            vertices.push(NDC_X + offset);
            vertices.push(NDC_Y + offset);
            vertices.push(0.0);

            vertices.push(NDC_X - offset);
            vertices.push(NDC_Y - offset);
            vertices.push(0.0);

            vertices.push(NDC_X - offset);
            vertices.push(NDC_Y + offset);
            vertices.push(0.0);
            
            vertices.push(NDC_X + offset);
            vertices.push(NDC_Y + offset);
            vertices.push(0.0);

            break;
        default:
            break;
    }
}

// resize objects based on scalars
function ResizeShapes() {
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "pointSize"), defaultPointSize * pointSizeScalar);
}

// clear the scene
function ClearScene() {
    for (let i = 0; i < shapes.length; i++) {
        verticesMap.set(shapes[i], []);
    }
    initScene();
}