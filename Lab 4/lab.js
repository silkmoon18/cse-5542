
// context
let gl;
let shaderProgram;

// viewport info 
let vp_minX, vp_maxX, vp_minY, vp_maxY, vp_width, vp_height;

// point, horizontal line, vertical line, triangle, square
const shapes = [];

// scalars
const pointSizeScalar = 3;
const cubeSizeScalar = 1;
const TetrahedronSizeScalar = 1;
const squareSizeScalar = 1;
const customizedShapeScalar = 3;

// default sizes
const defaultPointSize = 1;
const defaultCubeSize = 0.2;
const defaultTetrahedronSize = 0.2;
const defaultSquareSize = 0.2;
const defaultCustomizedShapeSize = 0.2;

// colors 
const presetColors = [[1, 0.18, 0.2],
[1, 0.7, 0.18],
[0.5, 1, 0.18],
[0.18, 0.7, 1],
[0.83, 0.31, 0.14]];
let toonColor = presetColors[0];

let currentShapeIndex = 0;

// transformation params
const moveSpeed = 0.1;
const rotateSpeed = 5; // in degrees
const scaleFactor = 0.05;

let drawMode;
let illumMode = 0;
let shadingMode = 0;

// set up the parameters for lighting 
let light_ambient = [1, 1, 1, 1];
let light_diffuse = [.8, .8, .8, 1];
let light_specular = [1, 1, 1, 1];
let light_pos = [2, 2, 0, 1];   // eye space position 

let mat_ambient = [0, 0, 0, 1];
let mat_diffuse = [1, 1, 0, 1];
let mat_specular = [.9, .9, .9, 1];
let mat_shine = [50];

let vMatrix = mat4.create(); // view matrix
let pMatrix = mat4.create();  // projection matrix

pMatrix = mat4.perspective(60, 1.0, 0.1, 100, pMatrix);
vMatrix = mat4.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0], vMatrix);

// functions
// main
function webGLStart() {
    initialize();

    document.addEventListener('keydown', onKeyDown, false);
}

let shape;
// initialize everything
function initialize() {
    let canvas = document.getElementById("Canvas");

    initGL(canvas);
    initShaders();
    drawMode = gl.TRIANGLES;
    gl.enable(gl.DEPTH_TEST);
    setAttrLocations();

    initVertices();
    for (let i = 0; i < shapes.length; i++)
        shapes[i].initialize();
    setVertices();

    initScene();
    resizeShapes();
    drawAll();
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
    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");

    shaderProgram.mMatrixUniform = gl.getUniformLocation(shaderProgram, "uMMatrix");
    shaderProgram.vMatrixUniform = gl.getUniformLocation(shaderProgram, "uVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");

    shaderProgram.toonColor = gl.getUniformLocation(shaderProgram, "toonColor");
    shaderProgram.isLight = gl.getUniformLocation(shaderProgram, "isLight");

    shaderProgram.light_posUniform = gl.getUniformLocation(shaderProgram, "light_pos");
    shaderProgram.ambient_coefUniform = gl.getUniformLocation(shaderProgram, "ambient_coef");
    shaderProgram.diffuse_coefUniform = gl.getUniformLocation(shaderProgram, "diffuse_coef");
    shaderProgram.specular_coefUniform = gl.getUniformLocation(shaderProgram, "specular_coef");
    shaderProgram.shininess_coefUniform = gl.getUniformLocation(shaderProgram, "mat_shininess");

    shaderProgram.light_ambientUniform = gl.getUniformLocation(shaderProgram, "light_ambient");
    shaderProgram.light_diffuseUniform = gl.getUniformLocation(shaderProgram, "light_diffuse");
    shaderProgram.light_specularUniform = gl.getUniformLocation(shaderProgram, "light_specular");

    shaderProgram.illumMode = gl.getUniformLocation(shaderProgram, "illumMode");
    shaderProgram.shadingMode = gl.getUniformLocation(shaderProgram, "shadingMode");
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
    let v, i, n;

    shapes.push(new Shape('Cube', gl.TRIANGLES, presetColors[0]));
    [v, i, n] = ShapeBuilder.buildCube(defaultCubeSize * cubeSizeScalar);
    shapes[0].vertices = v;
    shapes[0].indices = i;
    shapes[0].normals = n;

    shapes.push(new Shape('Tetrahedron', gl.TRIANGLES, presetColors[1]));
    [v, i, n] = ShapeBuilder.buildTetrahedron(defaultTetrahedronSize * TetrahedronSizeScalar);
    shapes[1].vertices = v;
    shapes[1].indices = i;
    shapes[1].normals = n;

    shapes.push(new Shape('Cylinder', gl.TRIANGLES, presetColors[2]));
    [v, i, n] = ShapeBuilder.buildCylinder(0.5, 5, 50);
    shapes[2].vertices = v;
    shapes[2].indices = i;
    shapes[2].normals = n;

    shapes.push(new Shape('Cone', gl.TRIANGLES, presetColors[3]));
    [v, i, n] = ShapeBuilder.buildCone(0.5, 5, 50);
    shapes[3].vertices = v;
    shapes[3].indices = i;
    shapes[3].normals = n;

    shapes.push(new Shape('Sphere', gl.TRIANGLES, presetColors[4]));
    [v, i, n] = ShapeBuilder.buildSphere(1, 50);
    shapes[4].vertices = v;
    shapes[4].indices = i;
    shapes[4].normals = n;
}

let identity = mat4.create();
mat4.identity(identity);

let head = mat4.create(identity);
let leftEye = mat4.create(identity);
let rightEye = mat4.create(identity);
let mouth = mat4.create(identity);

let leftArmHeadJoint = mat4.create(identity);
let leftArm = mat4.create(identity);
let rightArmHeadJoint = mat4.create(identity);
let rightArm = mat4.create(identity);

let leftLegHeadJoint = mat4.create(identity);
let leftLeg = mat4.create(identity);
let rightLegHeadJoint = mat4.create(identity);
let rightLeg = mat4.create(identity);

let partToShape = new Map();

let lightPosMatrix = mat4.create(identity);

// set up vertices
function setVertices() {
    console.log(head);
    mat4.translate(head, [1, 0, 0]);
    console.log(head);
    mat4.rotate(head, degToRad(30), [0, 0, 1]);
    console.log(head);
    mat4.scale(head, [1.5, 1.5, 1.5]);
    shapes[4].pushMatrix(head);
    partToShape.set("head", shapes[4]);

    mat4.translate(leftEye, [0.25, 0, 1]);
    mat4.scale(leftEye, [0.6, 0.6, 0.6]);
    shapes[0].pushMatrix(leftEye);
    partToShape.set("leftEye", shapes[0]);

    mat4.translate(rightEye, [-0.25, 0, 1]);
    mat4.scale(rightEye, [0.6, 0.6, 0.6]);
    shapes[0].pushMatrix(rightEye);
    partToShape.set("rightEye", shapes[0]);

    mat4.translate(mouth, [0, -0.2, 1]);
    mat4.rotate(mouth, degToRad(225), [0, 0, 1]);
    mat4.scale(mouth, [0.6, 0.6, 0.6]);
    shapes[1].pushMatrix(mouth);
    partToShape.set("mouth", shapes[1]);

    mat4.translate(leftArmHeadJoint, [1, 0, 0]);
    mat4.scale(leftArmHeadJoint, [0.2, 0.2, 0.2]);
    mat4.scale(leftArmHeadJoint, [0.6, 0.6, 0.6]);
    shapes[4].pushMatrix(leftArmHeadJoint);
    partToShape.set("leftArmHeadJoint", shapes[4]);

    mat4.translate(leftArm, [3.5, -2.5, 0]);
    mat4.rotate(leftArm, degToRad(-135), [0, 0, 1]);
    mat4.scale(leftArm, [1.2, 1.2, 1.2]);
    shapes[3].pushMatrix(leftArm);
    partToShape.set("leftArm", shapes[3]);

    mat4.translate(rightArmHeadJoint, [-1, 0, 0]);
    mat4.scale(rightArmHeadJoint, [0.2, 0.2, 0.2]);
    mat4.scale(rightArmHeadJoint, [0.6, 0.6, 0.6]);
    shapes[4].pushMatrix(rightArmHeadJoint);
    partToShape.set("rightArmHeadJoint", shapes[4]);

    mat4.translate(rightArm, [-3.5, -2.5, 0]);
    mat4.rotate(rightArm, degToRad(135), [0, 0, 1]);
    mat4.scale(rightArm, [1.2, 1.2, 1.2]);
    shapes[3].pushMatrix(rightArm);
    partToShape.set("rightArm", shapes[3]);

    mat4.translate(leftLegHeadJoint, [0.6, -0.8, 0]);
    mat4.scale(leftLegHeadJoint, [0.2, 0.2, 0.2]);
    mat4.scale(leftLegHeadJoint, [0.6, 0.6, 0.6]);
    shapes[4].pushMatrix(leftLegHeadJoint);
    partToShape.set("leftLegHeadJoint", shapes[4]);

    mat4.translate(leftLeg, [0.6, -3.5, 0]);
    mat4.scale(leftLeg, [1.2, 1.2, 1.2]);
    shapes[2].pushMatrix(leftLeg);
    partToShape.set("leftLeg", shapes[2]);

    mat4.translate(rightLegHeadJoint, [-0.6, -0.8, 0]);
    mat4.scale(rightLegHeadJoint, [0.2, 0.2, 0.2]);
    mat4.scale(rightLegHeadJoint, [0.6, 0.6, 0.6]);
    shapes[4].pushMatrix(rightLegHeadJoint);
    partToShape.set("rightLegHeadJoint", shapes[4]);

    mat4.translate(rightLeg, [-0.6, -3.5, 0]);
    mat4.scale(rightLeg, [1.2, 1.2, 1.2]);
    shapes[2].pushMatrix(rightLeg);
    partToShape.set("rightLeg", shapes[2]);

    mat4.translate(lightPosMatrix, light_pos);
    mat4.scale(lightPosMatrix, [0.2, 0.2, 0.2]);
    shapes[4].pushMatrix(lightPosMatrix);

    mat4.scale(head, [0.5, 0.5, 0.5]);
    mat4.translate(head, [-1, 0, 0])
}

// draw all stuffs
function drawAll() {

    gl.uniform1i(shaderProgram.illumMode, illumMode);
    gl.uniform1i(shaderProgram.shadingMode, shadingMode);

    gl.viewport(vp_minX, vp_minY, vp_width, vp_height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (let i = 0; i < shapes.length; i++) {
        shapes[i].setMatrices(pMatrix, vMatrix);
    }

    let mStack = new Stack([]);
    let m = mat4.create();
    mat4.identity(m);

    mat4.identity(lightPosMatrix);
    mat4.translate(lightPosMatrix, light_pos);
    mat4.scale(lightPosMatrix, [0.2, 0.2, 0.2]);
    shapes[4].draw(lightPosMatrix, drawMode, true);


    m = mat4.multiply(m, head);
    partToShape.get("head").draw(m, drawMode, false);

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, leftEye);
    partToShape.get("leftEye").draw(m, drawMode, false);
    m = mStack.pop();

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, rightEye);
    partToShape.get("rightEye").draw(m, drawMode, false);
    m = mStack.pop();

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, mouth);
    partToShape.get("mouth").draw(m, drawMode, false);
    m = mStack.pop();

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, leftArmHeadJoint);
    partToShape.get("leftArmHeadJoint").draw(m, drawMode, false);
    m = mat4.multiply(m, leftArm);
    partToShape.get("leftArm").draw(m, drawMode, false);
    m = mStack.pop();

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, rightArmHeadJoint);
    partToShape.get("rightArmHeadJoint").draw(m, drawMode, false);
    m = mat4.multiply(m, rightArm);
    partToShape.get("rightArm").draw(m, drawMode, false);
    m = mStack.pop();

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, leftLegHeadJoint);
    partToShape.get("leftLegHeadJoint").draw(m, drawMode, false);
    m = mat4.multiply(m, leftLeg);
    partToShape.get("leftLeg").draw(m, drawMode, false);
    m = mStack.pop();

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, rightLegHeadJoint);
    partToShape.get("rightLegHeadJoint").draw(m, drawMode, false);
    m = mat4.multiply(m, rightLeg);
    partToShape.get("rightLeg").draw(m, drawMode, false);
    m = mStack.pop();
}


// act when keys are pressed
function onKeyDown(event) {
    event.preventDefault();

    let inputKey = event.key;

    switch (inputKey) {
        case 'w':
            illumMode = 0;
            break;
        case 'a':
            illumMode = 1;
            break;
        case 's':
            illumMode = 3;
            break;
        case 'd':
            illumMode = 2;
            break;
        case 't':
            mat4.translate(head, [0, moveSpeed / 1.5, 0]);
            break;
        case 'f':
            mat4.translate(head, [-moveSpeed / 1.5, 0, 0]);
            break;
        case 'g':
            mat4.translate(head, [0, -moveSpeed / 1.5, 0]);
            break;
        case 'h':
            mat4.translate(head, [moveSpeed / 1.5, 0, 0]);
            break;
        case 'r':
            mat4.translate(head, [0, 0, moveSpeed / 1.5]);
            break;
        case 'y':
            mat4.translate(head, [0, 0, -moveSpeed / 1.5]);
            break;
        case 'i':
            mat4.translate(vMatrix, [0, -moveSpeed, 0]);
            break;
        case 'k':
            mat4.translate(vMatrix, [0, moveSpeed, 0]);
            break;
        case 'j':
            mat4.translate(vMatrix, [moveSpeed, 0, 0]);
            break;
        case 'l':
            mat4.translate(vMatrix, [-moveSpeed, 0, 0]);
            break;
        case 'u':
            mat4.translate(vMatrix, [0, 0, moveSpeed]);
            break;
        case 'o':
            mat4.translate(vMatrix, [0, 0, -moveSpeed]);
            break;
        case 'n':
            mat4.rotate(vMatrix, degToRad(rotateSpeed), [1, 0, 0]);
            break;
        case 'm':
            mat4.rotate(vMatrix, degToRad(-rotateSpeed), [1, 0, 0]);
            break;
        case 'z':
            mat4.rotate(leftArmHeadJoint, degToRad(rotateSpeed), [0, 0, 1]);
            break;
        case 'x':
            mat4.rotate(rightArmHeadJoint, degToRad(-rotateSpeed), [0, 0, 1]);
            break;
        case 'c':
            mat4.rotate(leftLegHeadJoint, degToRad(rotateSpeed), [0, 0, 1]);
            break;
        case 'v':
            mat4.rotate(rightLegHeadJoint, degToRad(-rotateSpeed), [0, 0, 1]);
            break;
        case 'q':
            mat4.rotate(head, degToRad(rotateSpeed), [0, 1, 1]);
            break;
        case 'e':
            mat4.rotate(head, degToRad(-rotateSpeed), [0, 1, 1]);
            break;
        case 'p':
            mat4.scale(head, [1 + scaleFactor, 1 + scaleFactor, 1 + scaleFactor]);
            break;
        case 'P':
            mat4.scale(head, [1 - scaleFactor, 1 - scaleFactor, 1 - scaleFactor]);
            break;
        case '1':
            light_pos[0] += moveSpeed;
            break;
        case '2':
            light_pos[0] -= moveSpeed;
            break;
        case '3':
            light_pos[1] += moveSpeed;
            break;
        case '4':
            light_pos[1] -= moveSpeed;
            break;
        case '5':
            light_pos[2] += moveSpeed;
            break;
        case '6':
            light_pos[2] -= moveSpeed;
            break;
    }

    drawAll();
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

// change draw mode
function geometry(mode) {
    switch (mode) {
        case 0:
            drawMode = gl.POINTS;
            break;
        case 1:
            drawMode = gl.LINE_LOOP;
            break;
        case 2:
            drawMode = gl.TRIANGLES;
            break;
    }
    drawAll();
}

// change shading mode
function shading(mode) {
    shadingMode = mode;
    drawAll();
}

// change lighting color
function coloring(index) {
    if (index == -1) {
        mat_ambient = [0, 0, 0];
        toonColor = [1, 1, 1];
    }
    else {
        mat_ambient = presetColors[index];
        toonColor = presetColors[index];
    }
    drawAll();
}