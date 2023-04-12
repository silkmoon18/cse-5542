
// context
let gl;
let shaderProgram;

let nameToTexture = new Map();

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
let light_ambient = [0, 0, 0, 1];
let light_diffuse = [.8, .8, .8, 1];
let light_specular = [1, 1, 1, 1];
let light_pos = [0, 5, 0, 1];   // eye space position 

let mat_ambient = [1, 1, 1, 1];
let mat_diffuse = [1, 1, 1, 1];
let mat_specular = [.9, .9, .9, 1];
let mat_shine = [200];

let vMatrix = mat4.create(); // view matrix
let pMatrix = mat4.create();  // projection matrix
let v2wMatrix = mat4.create();

pMatrix = mat4.perspective(60, 1.0, 0.1, 100, pMatrix); 

let camera = 1;
let cameraDistance = 5;
let cameraPosition = [0, 0, cameraDistance];
let cameraCOI = [0, 0, 0];
let cameraRotation = [-90, 0, -90];
let cameraUp = [0, 1, 0];
vMatrix = mat4.lookAt(cameraPosition, cameraCOI, cameraUp, vMatrix);

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

    initOBJLoader(objSrc, mtlSrc);

    newTexture("wallpaper");
    newTexture("donut");
    newTexture("silksong");
    
    newTexture("top");
    newTexture("bottom");
    newTexture("left");
    newTexture("right");
    newTexture("front");
    newTexture("back");

    initCubeMap();

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
    shaderProgram.vertexTexCoordsAttribute = gl.getAttribLocation(shaderProgram, "aVertexTexCoords");

    shaderProgram.mMatrixUniform = gl.getUniformLocation(shaderProgram, "uMMatrix");
    shaderProgram.vMatrixUniform = gl.getUniformLocation(shaderProgram, "uVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.v2wMatrixUniform = gl.getUniformLocation(shaderProgram, "uV2WMatrix");
    
    shaderProgram.toonColor = gl.getUniformLocation(shaderProgram, "toonColor");
    shaderProgram.isLight = gl.getUniformLocation(shaderProgram, "isLight");
    
    shaderProgram.cameraPosition = gl.getUniformLocation(shaderProgram, "cameraPos");

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
    
    shaderProgram.textureUniform = gl.getUniformLocation(shaderProgram, "myTexture");
    shaderProgram.cube_map_textureUniform = gl.getUniformLocation(shaderProgram, "cubeMap");
    shaderProgram.use_textureUniform = gl.getUniformLocation(shaderProgram, "use_texture");

    shaderProgram.enableMapKa = gl.getUniformLocation(shaderProgram, "enableMapKa");
    shaderProgram.enableMapKd = gl.getUniformLocation(shaderProgram, "enableMapKd");
    shaderProgram.enableMapKs = gl.getUniformLocation(shaderProgram, "enableMapKs");
    shaderProgram.textureKa = gl.getUniformLocation(shaderProgram, "textureKa");
    shaderProgram.textureKd = gl.getUniformLocation(shaderProgram, "textureKd");
    shaderProgram.textureKs = gl.getUniformLocation(shaderProgram, "textureKs");
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
    let v, i, n, t;

    shapes.push(new Shape('Cube', gl.TRIANGLES, presetColors[0]));
    [v, i, n, t] = ShapeBuilder.buildCube(defaultCubeSize * cubeSizeScalar);
    shapes[0].vertices = v;
    shapes[0].indices = i;
    shapes[0].normals = n;
    shapes[0].texCoords = t;

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

    shapes.push(new Shape('Plane', gl.TRIANGLES, presetColors[0]));
    [v, i, n, t] = ShapeBuilder.buildPlane(1, 1);
    shapes[5].vertices = v;
    shapes[5].indices = i;
    shapes[5].normals = n;
    shapes[5].texCoords = t;

    shapes.push(new Shape('Torus', gl.TRIANGLES, presetColors[0]));
    [v, i, n, t] = ShapeBuilder.buildTorus(1, 0.3, 20);
    shapes[6].vertices = v;
    shapes[6].indices = i;
    shapes[6].normals = n;
    shapes[6].texCoords = t;
}

let identity = mat4.create();
mat4.identity(identity);

let wall_0 = mat4.create(identity);
let wall_1 = mat4.create(identity);

let table = mat4.create(identity);

let envRefObj = mat4.create(identity);
let torus = mat4.create(identity);
let objMatrix = mat4.create(identity);

let floor = mat4.create(identity);
let environment = mat4.create(identity);

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

let nameToShape = new Map();

let lightPosMatrix = mat4.create(identity);

// set up vertices
function setVertices() {

    shapes[5].pushMatrix(wall_0);
    mat4.translate(wall_0, [-5, 4.6, 0]);
    mat4.rotate(wall_0, degToRad(90), [0, 1, 0]);
    mat4.scale(wall_0, [10, 10, 10]);
    nameToShape.set("wall_0", shapes[5]);
    
    shapes[5].pushMatrix(wall_1);
    mat4.translate(wall_1, [0, 2.1, -5]);
    mat4.scale(wall_1, [5, 5, 5]);
    nameToShape.set("wall_1", shapes[5]);

    shapes[5].pushMatrix(table);
    mat4.translate(table, [0, -0.379, 0]);
    mat4.scale(table, [12, 0.1, 12]);
    nameToShape.set("table", shapes[0]);

    mat4.translate(envRefObj, [0, 1, 0]);
    mat4.scale(envRefObj, [2, 2, 2]);

    shapes[6].pushMatrix(torus);
    mat4.translate(torus, [3, 0.9, -2]);
    nameToShape.set("torus", shapes[6]);

    mat4.translate(objMatrix, [2.61, 0.6, -2]);
    mat4.scale(objMatrix, [0.9, 0.9, 0.9]);

    shapes[5].pushMatrix(floor);
    nameToShape.set("floor", shapes[5]);

    shapes[0].pushMatrix(environment);
    mat4.translate(environment, [0, 0, 0]);
    mat4.scale(environment, [100, 100, 100]);
    nameToShape.set("environment", shapes[0]);

    //////////////////////////////////////////////////
    mat4.translate(head, [2.35, 1.75, -1]);
    mat4.scale(head, [1.5, 1.5, 1.5]);
    shapes[4].pushMatrix(head);
    nameToShape.set("head", shapes[4]);

    mat4.translate(leftEye, [0.25, 0, 1]);
    mat4.scale(leftEye, [0.6, 0.6, 0.6]);
    shapes[0].pushMatrix(leftEye);
    nameToShape.set("leftEye", shapes[0]);

    mat4.translate(rightEye, [-0.25, 0, 1]);
    mat4.scale(rightEye, [0.6, 0.6, 0.6]);
    shapes[0].pushMatrix(rightEye);
    nameToShape.set("rightEye", shapes[0]);

    mat4.translate(mouth, [0, -0.2, 1]);
    mat4.rotate(mouth, degToRad(225), [0, 0, 1]);
    mat4.scale(mouth, [0.6, 0.6, 0.6]);
    shapes[1].pushMatrix(mouth);
    nameToShape.set("mouth", shapes[1]);

    mat4.translate(leftArmHeadJoint, [1, 0, 0]);
    mat4.scale(leftArmHeadJoint, [0.2, 0.2, 0.2]);
    mat4.scale(leftArmHeadJoint, [0.6, 0.6, 0.6]);
    shapes[4].pushMatrix(leftArmHeadJoint);
    nameToShape.set("leftArmHeadJoint", shapes[4]);

    mat4.translate(leftArm, [3.5, -2.5, 0]);
    mat4.rotate(leftArm, degToRad(-135), [0, 0, 1]);
    mat4.scale(leftArm, [1.2, 1.2, 1.2]);
    shapes[3].pushMatrix(leftArm);
    nameToShape.set("leftArm", shapes[3]);

    mat4.translate(rightArmHeadJoint, [-1, 0, 0]);
    mat4.scale(rightArmHeadJoint, [0.2, 0.2, 0.2]);
    mat4.scale(rightArmHeadJoint, [0.6, 0.6, 0.6]);
    shapes[4].pushMatrix(rightArmHeadJoint);
    nameToShape.set("rightArmHeadJoint", shapes[4]);

    mat4.translate(rightArm, [-3.5, -2.5, 0]);
    mat4.rotate(rightArm, degToRad(135), [0, 0, 1]);
    mat4.scale(rightArm, [1.2, 1.2, 1.2]);
    shapes[3].pushMatrix(rightArm);
    nameToShape.set("rightArm", shapes[3]);

    mat4.translate(leftLegHeadJoint, [0.6, -0.8, 0]);
    mat4.scale(leftLegHeadJoint, [0.2, 0.2, 0.2]);
    mat4.scale(leftLegHeadJoint, [0.6, 0.6, 0.6]);
    shapes[4].pushMatrix(leftLegHeadJoint);
    nameToShape.set("leftLegHeadJoint", shapes[4]);

    mat4.translate(leftLeg, [0.6, -3.5, 0]);
    mat4.scale(leftLeg, [1.2, 1.2, 1.2]);
    shapes[2].pushMatrix(leftLeg);
    nameToShape.set("leftLeg", shapes[2]);

    mat4.translate(rightLegHeadJoint, [-0.6, -0.8, 0]);
    mat4.scale(rightLegHeadJoint, [0.2, 0.2, 0.2]);
    mat4.scale(rightLegHeadJoint, [0.6, 0.6, 0.6]);
    shapes[4].pushMatrix(rightLegHeadJoint);
    nameToShape.set("rightLegHeadJoint", shapes[4]);

    mat4.translate(rightLeg, [-0.6, -3.5, 0]);
    mat4.scale(rightLeg, [1.2, 1.2, 1.2]);
    shapes[2].pushMatrix(rightLeg);
    nameToShape.set("rightLeg", shapes[2]);
    //////////////////////////////////////////////////
    
    mat4.scale(head, [0.5, 0.5, 0.5]);
    mat4.translate(head, [-1, 0, 0]);
}

// draw all stuffs
function drawAll() {

    gl.uniform1i(shaderProgram.illumMode, illumMode);
    gl.uniform1i(shaderProgram.shadingMode, shadingMode);

    gl.viewport(vp_minX, vp_minY, vp_width, vp_height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let mStack = new Stack([]);
    let m = mat4.create();
    mat4.identity(m);

    mat4.identity(lightPosMatrix);
    mat4.translate(lightPosMatrix, light_pos);
    mat4.scale(lightPosMatrix, [0.1, 0.1, 0.1]);
    shapes[4].draw(lightPosMatrix, true);

    m = mat4.multiply(m, head);
    
    nameToShape.get("wall_0").draw(wall_0, false, nameToTexture.get("wallpaper"), 1);
    nameToShape.get("wall_1").draw(wall_1, false, nameToTexture.get("silksong"), 1);

    nameToShape.get("table").draw(table, false, null, 0);

    nameToShape.get("torus").draw(torus, false, nameToTexture.get("donut"), 1);
    nameToShape.get("environment").draw(environment, false, null, 2);

    //////////////////////////////////////////////////
    m = mat4.multiply(m, head);
    nameToShape.get("head").draw(m, false, null, 0);

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, leftEye);
    nameToShape.get("leftEye").draw(m, false, null, 0);
    m = mStack.pop();

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, rightEye);
    nameToShape.get("rightEye").draw(m, false, null, 0);
    m = mStack.pop();

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, mouth);
    nameToShape.get("mouth").draw(m, false, null, 0);
    m = mStack.pop();

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, leftArmHeadJoint);
    nameToShape.get("leftArmHeadJoint").draw(m, false, null, 0);
    m = mat4.multiply(m, leftArm);
    nameToShape.get("leftArm").draw(m, false, null, 0);
    m = mStack.pop();

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, rightArmHeadJoint);
    nameToShape.get("rightArmHeadJoint").draw(m, false, null, 0);
    m = mat4.multiply(m, rightArm);
    nameToShape.get("rightArm").draw(m, false, null, 0);
    m = mStack.pop();

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, leftLegHeadJoint);
    nameToShape.get("leftLegHeadJoint").draw(m, false, null, 0);
    m = mat4.multiply(m, leftLeg);
    nameToShape.get("leftLeg").draw(m, false, null, 0);
    m = mStack.pop();

    mStack.push(mat4.create(m));
    m = mat4.multiply(m, rightLegHeadJoint);
    nameToShape.get("rightLegHeadJoint").draw(m, false, null, 0);
    m = mat4.multiply(m, rightLeg);
    nameToShape.get("rightLeg").draw(m, false, null, 0);
    m = mStack.pop();
    //////////////////////////////////////////////////
    
    drawOBJ(objMatrix, 1);
    
    drawOBJ(envRefObj, 3);
}


// act when keys are pressed
function onKeyDown(event) {
    event.preventDefault();

    let inputKey = event.key;

    switch (inputKey) {
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
        case 'w':
            cameraPosition[2] -= moveSpeed;
            cameraCOI[2] -= moveSpeed;
            break;
        case 's':
            cameraPosition[2] += moveSpeed;
            cameraCOI[2] += moveSpeed;
            break;
        case 'a':
            cameraPosition[0] -= moveSpeed;
            cameraCOI[0] -= moveSpeed;
            break;
        case 'd':
            cameraPosition[0] += moveSpeed;
            cameraCOI[0] += moveSpeed;
            break;
        case 'q':
            cameraPosition[1] += moveSpeed;
            cameraCOI[1] += moveSpeed;
            break;
        case 'e':
            cameraPosition[1] -= moveSpeed;
            cameraCOI[1] -= moveSpeed;
            break;
        case 'z':
            cameraRotation[0] += rotateSpeed;
            cameraCOI[0] = cameraPosition[0] + cameraDistance * Math.cos(degToRad(cameraRotation[0]));
            cameraCOI[2] = cameraPosition[2] + cameraDistance * Math.sin(degToRad(cameraRotation[0]));
            break;
        case 'x':
            cameraRotation[0] -= rotateSpeed;
            cameraCOI[0] = cameraPosition[0] + cameraDistance * Math.cos(degToRad(cameraRotation[0]));
            cameraCOI[2] = cameraPosition[2] + cameraDistance * Math.sin(degToRad(cameraRotation[0]));
            break;
        case 'c':
            cameraRotation[2] += rotateSpeed;
            cameraCOI[1] = cameraPosition[1] + cameraDistance * Math.cos(degToRad(cameraRotation[2]));
            cameraCOI[2] = cameraPosition[2] + cameraDistance * Math.sin(degToRad(cameraRotation[2]));
            cameraUp[0] = -Math.sin(degToRad(cameraRotation[0] + 90));
            cameraUp[1] = Math.cos(degToRad(cameraRotation[2] + 90));
            cameraUp[2] = Math.sin(degToRad(cameraRotation[2] + 90));
            break;
        case 'v':
            cameraRotation[2] -= rotateSpeed;
            cameraCOI[1] = cameraPosition[1] + cameraDistance * Math.cos(degToRad(cameraRotation[2]));
            cameraCOI[2] = cameraPosition[2] + cameraDistance * Math.sin(degToRad(cameraRotation[2]));
            cameraUp[0] = -Math.sin(degToRad(cameraRotation[0] + 90));
            cameraUp[1] = Math.cos(degToRad(cameraRotation[2] + 90));
            cameraUp[2] = Math.sin(degToRad(cameraRotation[2] + 90));
            break;
        case 'F1':
            mat4.rotate(leftArmHeadJoint, degToRad(rotateSpeed), [0, 0, 1]);
            break;
        case 'F2':
            mat4.rotate(rightArmHeadJoint, degToRad(-rotateSpeed), [0, 0, 1]);
            break;
        case 'F3':
            mat4.rotate(leftLegHeadJoint, degToRad(rotateSpeed), [0, 0, 1]);
            break;
        case 'F4':
            mat4.rotate(rightLegHeadJoint, degToRad(-rotateSpeed), [0, 0, 1]);
            break;
        case '3':
            mat4.rotate(head, degToRad(rotateSpeed), [1, 0, 0]);
            break;
        case '4':
            mat4.rotate(head, degToRad(-rotateSpeed), [0, 1, 0]);
            break;
        case '5':
            mat4.rotate(head, degToRad(-rotateSpeed), [0, 0, 1]);
            break;
        case 'p':
            mat4.scale(head, [1 + scaleFactor, 1 + scaleFactor, 1 + scaleFactor]);
            break;
        case 'P':
            mat4.scale(head, [1 - scaleFactor, 1 - scaleFactor, 1 - scaleFactor]);
            break;
        case 'ArrowRight':
            light_pos[0] += moveSpeed;
            break;
        case 'ArrowLeft':
            light_pos[0] -= moveSpeed;
            break;
        case 'ArrowUp':
            light_pos[1] += moveSpeed;
            break;
        case 'ArrowDown':
            light_pos[1] -= moveSpeed;
            break;
        case '1':
            light_pos[2] += moveSpeed;
            break;
        case '2':
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
        light_ambient = [0, 0, 0];
        toonColor = [1, 1, 1];
    }
    else { 
        light_ambient = presetColors[index];
        toonColor = presetColors[index];
    }
    drawAll();
}

function illumination(mode) {
    illumMode = mode;
    drawAll();
}

function changeCamera(index) {
    camera = index;
    drawAll();
}

function initTexture(img) {
    let texture = gl.createTexture();
    texture.image = new Image();
    texture.image.onload = function () { handle(texture); }
    texture.image.src = img;
    return texture;
}

function handle(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function newTexture(img) {
    nameToTexture.set(img, initTexture("Textures/" + img + ".jpg"));
}