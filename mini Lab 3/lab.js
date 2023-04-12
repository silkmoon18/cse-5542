
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
const moveSpeed = 0.01;
const rotateSpeed = 5; // in degrees
const scaleFactor = 0.05;

let drawMode;

// functions

// main
function webGLStart() {
    initialize();

    document.addEventListener('keydown', onKeyDown, false);
}

// initialize everything
function initialize() {
    let canvas = document.getElementById("Canvas");

    initGL(canvas);
    initShaders();
    setAttrLocations();


    shapes.push(new Shape('point', gl.POINTS, 1, generateColor(presetColors[0], 1, true)));
    shapes.push(new Shape('line', gl.LINES, 2, generateColor(presetColors[1], 2, true)));
    shapes.push(new Shape('rectangle', gl.TRIANGLES, 6, generateColor(presetColors[3], 6, true)));
    shapes.push(new Shape('triangle', gl.TRIANGLES, 3, generateColor(presetColors[2], 3, true)));
    shapes.push(new Shape('custom', gl.TRIANGLES, 27, generateColor(presetColors[4], 27, true)));
    shapes.push(new Shape('axis', gl.LINES, 2, generateColor(presetColors[4], 2, true)));

    
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
    shapes[3].vertices = [-offset, -offset, 0, 
                          offset, -offset, 0,
                          offset, offset, 0];    
    
    offset = defaultSquareSize * squareSizeScalar / 2;
    shapes[2].vertices = [-offset / 2, -offset, 0, 
                          offset / 2, -offset, 0,
                          offset / 2, offset, 0,
                          -offset / 2, -offset, 0, 
                          -offset / 2, offset, 0,
                          offset / 2, offset, 0];                   
    
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

function setTopColor(color, shape) {
    shape.colorStack.modifyTop(generateColor(color, shape.vertices.length / vertexSize, false));
}

let identityMatrix = mat4.create();
mat4.identity(identityMatrix);

let headMatrix = mat4.create(identityMatrix);
let headToNeckJointMatrix = mat4.create(identityMatrix);

let leftEyeMatrix = mat4.create(identityMatrix);
let rightEyeMatrix = mat4.create(identityMatrix);

let neckMatrix = mat4.create(identityMatrix);
let neckToBodyJointMatrix = mat4.create(identityMatrix);

let bodyMatrix = mat4.create(identityMatrix);

let leftArmToBodyJointMatrix = mat4.create(identityMatrix);
let leftArmMatrix = mat4.create(identityMatrix);
let leftForearmToArmJointMatrix = mat4.create(identityMatrix);
let leftForearmMatrix = mat4.create(identityMatrix);
let leftHandToForearmJointMatrix = mat4.create(identityMatrix);
let leftHandMatrix = mat4.create(identityMatrix);

let rightArmToBodyJointMatrix = mat4.create(identityMatrix);
let rightArmMatrix = mat4.create(identityMatrix);
let rightForearmToArmJointMatrix = mat4.create(identityMatrix);
let rightForearmMatrix = mat4.create(identityMatrix);
let rightHandToForearmJointMatrix = mat4.create(identityMatrix);
let rightHandMatrix = mat4.create(identityMatrix);

let leftThighToBodyJointMatrix = mat4.create(identityMatrix);
let leftThighMatrix = mat4.create(identityMatrix);
let leftLegToThighJointMatrix = mat4.create(identityMatrix);
let leftLegMatrix = mat4.create(identityMatrix);
let leftFeetToLegJointMatrix = mat4.create(identityMatrix);
let leftFeetMatrix = mat4.create(identityMatrix);

let rightThighToBodyJointMatrix = mat4.create(identityMatrix);
let rightThighMatrix = mat4.create(identityMatrix);
let rightLegToThighJointMatrix = mat4.create(identityMatrix);
let rightLegMatrix = mat4.create(identityMatrix);
let rightFeetToLegJointMatrix = mat4.create(identityMatrix);
let rightFeetMatrix = mat4.create(identityMatrix);

let partToShape = new Map();

function setVertices() {

    // neck
    mat4.scale(neckMatrix, [0.7, 0.7, 0.5]);
    mat4.translate(neckMatrix, [0, -0.3, 0]);
    shapes[2].pushMatrix(neckMatrix);
    partToShape.set("neck", shapes[2]);

    // head
    mat4.translate(headToNeckJointMatrix, [0, -0.1, 0]);
    shapes[0].pushMatrix(headToNeckJointMatrix);
    partToShape.set("headToNeckJoint", shapes[0]);

    mat4.translate(headMatrix, [0, 0, 0]);
    mat4.scale(headMatrix, [1.3, 1.3, 1.3]);
    mat4.rotate(headMatrix, degToRad(90), [0, 0, 1]);
    shapes[2].pushMatrix(headMatrix);
    setTopColor([1, 0, 0], shapes[2]);
    partToShape.set("head", shapes[2]);

    // eyes
    mat4.translate(leftEyeMatrix, [0.02, 0.04, 0]);
    mat4.scale(leftEyeMatrix, [0.3, 0.3, 0.3]);
    mat4.rotate(leftEyeMatrix, degToRad(90), [0, 0, 1]);
    shapes[3].pushMatrix(leftEyeMatrix);
    partToShape.set("leftEye", shapes[3]);
    setTopColor([1, 0, 0], shapes[3]);
    
    mat4.translate(rightEyeMatrix, [0.02, -0.04, 0]);
    mat4.scale(rightEyeMatrix, [0.3, 0.3, 0.3]);
    shapes[3].pushMatrix(rightEyeMatrix);
    partToShape.set("rightEye", shapes[3]);
    setTopColor([1, 0, 0], shapes[3]);

    // body
    mat4.rotate(bodyMatrix, degToRad(180), [0, 0, 1]);
    mat4.translate(bodyMatrix, [0, -0.25, 0]);
    mat4.scale(bodyMatrix, [0.7, 0.7, 1]);
    shapes[4].pushMatrix(bodyMatrix);
    partToShape.set("body", shapes[4]);
    
    // left arm
    mat4.translate(leftArmToBodyJointMatrix, [-0.22, 0.025, 0]);
    shapes[0].pushMatrix(leftArmToBodyJointMatrix);
    partToShape.set("leftArmToBodyJoint", shapes[0]);

    mat4.scale(leftArmMatrix, [0.8, 0.8, 0.8]);
    mat4.translate(leftArmMatrix, [-0.05, 0.05, 0]);
    mat4.rotate(leftArmMatrix, degToRad(35), [0, 0, 1]);
    shapes[2].pushMatrix(leftArmMatrix);
    partToShape.set("leftArm", shapes[2]);

    mat4.translate(leftForearmToArmJointMatrix, [0, 0.1, 0]);
    shapes[0].pushMatrix(leftForearmToArmJointMatrix);
    partToShape.set("leftForearmToArmJoint", shapes[0]);

    mat4.translate(leftForearmMatrix, [0.05, 0.1, 1]);
    mat4.scale(leftForearmMatrix, [1.2, 1.2, 1.2]);
    mat4.rotate(leftForearmMatrix, degToRad(-35), [0, 0, 1]);
    shapes[2].pushMatrix(leftForearmMatrix);
    partToShape.set("leftForearm", shapes[2]);

    mat4.translate(leftHandToForearmJointMatrix, [0, 0.1, 0]);
    shapes[0].pushMatrix(leftHandToForearmJointMatrix);
    partToShape.set("leftHandToForearmJoint", shapes[0]);

    mat4.translate(leftHandMatrix, [0, 0.02, 0]);
    mat4.scale(leftHandMatrix, [0.4, 0.4, 0.4]);
    mat4.rotate(leftHandMatrix, degToRad(180), [0, 0, 1]);
    shapes[3].pushMatrix(leftHandMatrix);
    partToShape.set("leftHand", shapes[3]);

    // right arm
    mat4.translate(rightArmToBodyJointMatrix, [0.22, 0.025, 0]);
    shapes[0].pushMatrix(rightArmToBodyJointMatrix);
    partToShape.set("rightArmToBodyJoint", shapes[0]);

    mat4.scale(rightArmMatrix, [0.8, 0.8, 0.8]);
    mat4.translate(rightArmMatrix, [0.05, 0.05, 0]);
    mat4.rotate(rightArmMatrix, degToRad(-35), [0, 0, 1]);
    shapes[2].pushMatrix(rightArmMatrix);
    partToShape.set("rightArm", shapes[2]);

    mat4.translate(rightForearmToArmJointMatrix, [0, 0.1, 0]);
    shapes[0].pushMatrix(rightForearmToArmJointMatrix);
    partToShape.set("rightForearmToArmJoint", shapes[0]);

    mat4.translate(rightForearmMatrix, [-0.05, 0.1, 1]);
    mat4.scale(rightForearmMatrix, [1.2, 1.2, 1.2]);
    mat4.rotate(rightForearmMatrix, degToRad(35), [0, 0, 1]);
    shapes[2].pushMatrix(rightForearmMatrix);
    partToShape.set("rightForearm", shapes[2]);

    mat4.translate(rightHandToForearmJointMatrix, [0, 0.1, 0]);
    shapes[0].pushMatrix(rightHandToForearmJointMatrix);
    partToShape.set("rightHandToForearmJoint", shapes[0]);

    mat4.translate(rightHandMatrix, [0, 0.02, 0]);
    mat4.scale(rightHandMatrix, [0.4, 0.4, 0.4]);
    mat4.rotate(rightHandMatrix, degToRad(90), [0, 0, 1]);
    shapes[3].pushMatrix(rightHandMatrix);
    partToShape.set("rightHand", shapes[3]);

    // left leg
    mat4.translate(leftThighToBodyJointMatrix, [-0.1, 0.2, 0]);
    shapes[0].pushMatrix(leftThighToBodyJointMatrix);
    partToShape.set("leftThighToBodyJoint", shapes[0]);

    mat4.translate(leftThighMatrix, [-0.02, 0.1, 0]);
    mat4.rotate(leftThighMatrix, degToRad(15), [0, 0, 1]);
    mat4.scale(leftThighMatrix, [0.8, 0.8, 0.8]);
    shapes[2].pushMatrix(leftThighMatrix);
    partToShape.set("leftThigh", shapes[2]);

    mat4.translate(leftLegToThighJointMatrix, [0, 0.2, 0]);
    shapes[0].pushMatrix(leftLegToThighJointMatrix);
    partToShape.set("leftLegToThighJoint", shapes[0]);

    mat4.translate(leftLegMatrix, [0, 0.02, 0]);
    mat4.scale(leftLegMatrix, [1.4, 1.4, 1.4]);
    mat4.rotate(leftLegMatrix, degToRad(-15), [0, 0, 1]);
    shapes[2].pushMatrix(leftLegMatrix);
    partToShape.set("leftLeg", shapes[2]);

    mat4.translate(leftFeetToLegJointMatrix, [0, 0.1, 0]);
    shapes[0].pushMatrix(leftFeetToLegJointMatrix);
    partToShape.set("leftFeetToLegJoint", shapes[0]);

    mat4.translate(leftFeetMatrix, [0, 0.05, 0]);
    mat4.rotate(leftFeetMatrix, degToRad(-45), [0, 0, 1]);
    mat4.scale(leftFeetMatrix, [0.5, 0.5, 1]);
    shapes[3].pushMatrix(leftFeetMatrix);
    partToShape.set("leftFeet", shapes[3]);

    // right leg
    mat4.translate(rightThighToBodyJointMatrix, [0.1, 0.2, 0]);
    shapes[0].pushMatrix(rightThighToBodyJointMatrix);
    partToShape.set("rightThighToBodyJoint", shapes[0]);

    mat4.translate(rightThighMatrix, [0.02, 0.1, 0]);
    mat4.rotate(rightThighMatrix, degToRad(-15), [0, 0, 1]);
    mat4.scale(rightThighMatrix, [0.8, 0.8, 0.8]);
    shapes[2].pushMatrix(rightThighMatrix);
    partToShape.set("rightThigh", shapes[2]);

    mat4.translate(rightLegToThighJointMatrix, [0, 0.2, 0]);
    shapes[0].pushMatrix(rightLegToThighJointMatrix);
    partToShape.set("rightLegToThighJoint", shapes[0]);

    mat4.translate(rightLegMatrix, [0, 0.02, 0]);
    mat4.scale(rightLegMatrix, [1.4, 1.4, 1.4]);
    mat4.rotate(rightLegMatrix, degToRad(15), [0, 0, 1]);
    shapes[2].pushMatrix(rightLegMatrix);
    partToShape.set("rightLeg", shapes[2]);

    mat4.translate(rightFeetToLegJointMatrix, [0, 0.1, 0]);
    shapes[0].pushMatrix(rightFeetToLegJointMatrix);
    partToShape.set("rightFeetToLegJoint", shapes[0]);

    mat4.translate(rightFeetMatrix, [0, 0.05, 0]);
    mat4.rotate(rightFeetMatrix, degToRad(-45), [0, 0, 1]);
    mat4.scale(rightFeetMatrix, [0.5, 0.5, 1]);
    shapes[3].pushMatrix(rightFeetMatrix);
    partToShape.set("rightFeet", shapes[3]);
}

// draw all stuffs
function drawAll() {
    
    gl.viewport(vp_minX, vp_minY, vp_width, vp_height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let matrixStack = new Stack([]);
    let m = mat4.create();
    mat4.identity(m);

    m = mat4.multiply(m, bodyMatrix);
    shapes[4].draw(1, m, drawMode);

    // neck and head
    matrixStack.push(mat4.create(m));
    
    m = mat4.multiply(m, neckMatrix);
    partToShape.get("neck").draw(1, m, drawMode);

    m = mat4.multiply(m, headToNeckJointMatrix);
    partToShape.get("headToNeckJoint").draw(1, m, drawMode);

    m = mat4.multiply(m, headMatrix);
    partToShape.get("head").draw(1, m, drawMode);
    
    matrixStack.push(mat4.create(m));

    m = mat4.multiply(m, leftEyeMatrix);
    partToShape.get("leftEye").draw(1, m, drawMode);
    
    m = matrixStack.pop();
    
    m = mat4.multiply(m, rightEyeMatrix);
    partToShape.get("rightEye").draw(1, m, drawMode);

    m = matrixStack.pop();

    // left arm
    matrixStack.push(mat4.create(m));

    m = mat4.multiply(m, leftArmToBodyJointMatrix);
    partToShape.get("leftArmToBodyJoint").draw(1, m, drawMode);

    m = mat4.multiply(m, leftArmMatrix);
    partToShape.get("leftArm").draw(1, m, drawMode);

    m = mat4.multiply(m, leftForearmToArmJointMatrix);
    partToShape.get("leftForearmToArmJoint").draw(1, m, drawMode);

    m = mat4.multiply(m, leftForearmMatrix);
    partToShape.get("leftForearm").draw(1, m, drawMode);

    m = mat4.multiply(m, leftHandToForearmJointMatrix);
    partToShape.get("leftHandToForearmJoint").draw(1, m, drawMode);

    m = mat4.multiply(m, leftHandMatrix);
    partToShape.get("leftHand").draw(1, m, drawMode);

    m = matrixStack.pop();

    // right arm
    matrixStack.push(mat4.create(m));

    m = mat4.multiply(m, rightArmToBodyJointMatrix);
    partToShape.get("rightArmToBodyJoint").draw(1, m, drawMode);

    m = mat4.multiply(m, rightArmMatrix);
    partToShape.get("rightArm").draw(1, m, drawMode);

    m = mat4.multiply(m, rightForearmToArmJointMatrix);
    partToShape.get("rightForearmToArmJoint").draw(1, m, drawMode);

    m = mat4.multiply(m, rightForearmMatrix);
    partToShape.get("rightForearm").draw(1, m, drawMode);

    m = mat4.multiply(m, rightHandToForearmJointMatrix);
    partToShape.get("rightHandToForearmJoint").draw(1, m, drawMode);

    m = mat4.multiply(m, rightHandMatrix);
    partToShape.get("rightHand").draw(1, m, drawMode);

    m = matrixStack.pop();

    // left leg
    matrixStack.push(mat4.create(m));

    m = mat4.multiply(m, leftThighToBodyJointMatrix);
    partToShape.get("leftThighToBodyJoint").draw(1, m, drawMode);

    m = mat4.multiply(m, leftThighMatrix);
    partToShape.get("leftThigh").draw(1, m, drawMode);

    m = mat4.multiply(m, leftLegToThighJointMatrix);
    partToShape.get("leftLegToThighJoint").draw(1, m, drawMode);

    m = mat4.multiply(m, leftLegMatrix);
    partToShape.get("leftLeg").draw(1, m, drawMode);

    m = mat4.multiply(m, leftFeetToLegJointMatrix);
    partToShape.get("leftFeetToLegJoint").draw(1, m, drawMode);

    m = mat4.multiply(m, leftFeetMatrix);
    partToShape.get("leftFeet").draw(1, m, drawMode);

    m = matrixStack.pop();

    // right leg
    matrixStack.push(mat4.create(m));

    m = mat4.multiply(m, rightThighToBodyJointMatrix);
    partToShape.get("rightThighToBodyJoint").draw(1, m, drawMode);

    m = mat4.multiply(m, rightThighMatrix);
    partToShape.get("rightThigh").draw(1, m, drawMode);

    m = mat4.multiply(m, rightLegToThighJointMatrix);
    partToShape.get("rightLegToThighJoint").draw(1, m, drawMode);

    m = mat4.multiply(m, rightLegMatrix);
    partToShape.get("rightLeg").draw(1, m, drawMode);

    m = mat4.multiply(m, rightFeetToLegJointMatrix);
    partToShape.get("rightFeetToLegJoint").draw(1, m, drawMode);

    m = mat4.multiply(m, rightFeetMatrix);
    partToShape.get("rightFeet").draw(1, m, drawMode);

    m = matrixStack.pop();
}

let angleDiff = 0;
let maxAngle = 25;
let rSpeed = rotateSpeed;

// act when keys are pressed
function onKeyDown(event) {
    event.preventDefault();

    let inputKey = event.key;
    
    switch (inputKey) {
        case 'r':
            mat4.rotate(leftArmToBodyJointMatrix, degToRad(rotateSpeed), [0, 0, 1]); 
            break;
        case 'R':
            mat4.rotate(rightArmToBodyJointMatrix, degToRad(rotateSpeed), [0, 0, 1]); 
            break;
            
        case 't':
            mat4.rotate(leftForearmToArmJointMatrix, degToRad(rotateSpeed), [0, 0, 1]); 
            break;
        case 'T':
            mat4.rotate(rightForearmToArmJointMatrix, degToRad(rotateSpeed), [0, 0, 1]); 
            break;
            
        case 'y':
            mat4.rotate(leftHandToForearmJointMatrix, degToRad(rotateSpeed), [0, 0, 1]); 
            break;
        case 'Y':
            mat4.rotate(rightHandToForearmJointMatrix, degToRad(rotateSpeed), [0, 0, 1]); 
            break;
            
        case 'u':
            mat4.rotate(headToNeckJointMatrix, degToRad(rotateSpeed), [0, 0, 1]); 
            break;

        case 'f':
            mat4.rotate(leftThighToBodyJointMatrix, degToRad(rotateSpeed), [0, 0, 1]); 
            break;
        case 'F':
            mat4.rotate(rightThighToBodyJointMatrix, degToRad(rotateSpeed), [0, 0, 1]); 
            break;
        
        case 'g':
            mat4.rotate(leftLegToThighJointMatrix, degToRad(rotateSpeed), [0, 0, 1]); 
            break;
        case 'G':
            mat4.rotate(rightLegToThighJointMatrix, degToRad(rotateSpeed), [0, 0, 1]); 
            break;

        case 'h':
            mat4.rotate(leftFeetToLegJointMatrix, degToRad(rotateSpeed), [0, 0, 1]); 
            break;
        case 'H':
            mat4.rotate(rightFeetToLegJointMatrix, degToRad(rotateSpeed), [0, 0, 1]); 
            break;

        case 'w':
            mat4.translate(bodyMatrix, [0, -moveSpeed, 0]);
            break;

        case 'a':
            mat4.translate(bodyMatrix, [moveSpeed, 0, 0]);
            break;
        
        case 's':
            mat4.translate(bodyMatrix, [0, moveSpeed, 0]);
            break;

        case 'd':
            mat4.translate(bodyMatrix, [-moveSpeed, 0, 0]);
            break;
    }

    if (inputKey == 'w' || inputKey == 'a' || inputKey == 's' || inputKey == 'd') {
        if (angleDiff >= maxAngle && rSpeed > 0) {
            rSpeed = -rotateSpeed;
        }
        else if (angleDiff <= -maxAngle && rSpeed < 0) {
            rSpeed = rotateSpeed;
        }
        angleDiff += rSpeed;
        
        mat4.rotate(leftArmToBodyJointMatrix, degToRad(rSpeed), [0, 0, 1]);
        mat4.rotate(rightArmToBodyJointMatrix, degToRad(-rSpeed), [0, 0, 1]);

        mat4.rotate(leftThighToBodyJointMatrix, degToRad(-rSpeed), [0, 0, 1]);
        mat4.rotate(leftLegToThighJointMatrix, degToRad(rSpeed), [0, 0, 1]);

        mat4.rotate(rightThighToBodyJointMatrix, degToRad(rSpeed), [0, 0, 1]);
        mat4.rotate(rightLegToThighJointMatrix, degToRad(-rSpeed), [0, 0, 1]);

    }
    
    drawAll();
}

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
