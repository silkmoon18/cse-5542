
let vertexSize = 3;
let colorSize = 3;

class Shape {

    constructor(name, mode, defaultColor) {
        this.name = name;
        this.mode = mode;
        this.defaultColor = defaultColor;


        this.vertexPositionBuffer = gl.createBuffer();
        this.vertexIndexBuffer = gl.createBuffer();
        this.vertexNormalBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();

        this.vertices = [];
        this.normals = [];
        this.indices = [];
        this.texCoords = [];

        this.mMatrixStack = new Stack([mat4.create()]);
        this.nMatrix = mat4.create();

        this.colorStack = new Stack([defaultColor]);

    }

    clear() {
        this.vertexPositionBuffer = gl.createBuffer();
        this.vertexIndexBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();

        this.mMatrixStack = new Stack([mat4.create()]);

        this.colorStack = new Stack([this.defaultColor]);
        this.initialize();
    }

    // push to matrix stack
    pushMatrix(matrix) {
        this.mMatrixStack.push(matrix);
        this.colorStack.push(this.defaultColor);
    }

    // pop matrix stack
    popMatrix() {
        this.mMatrixStack.pop();
        this.colorStack.pop();
    }

    // init the Shape object
    initialize() {
        mat4.identity(this.mMatrixStack.top);

        this._initVertexPositionBuffer();
        this._initVertexIndexBuffer();
        this._initVertexNormalBuffer();
        this._initTextureCoordBuffer();
        //this._initColorBuffer();
    }

    // init position buffer
    _initVertexPositionBuffer() {
        let vertexPositionBuffer = this.vertexPositionBuffer;
        let vertices = this.vertices;

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        vertexPositionBuffer.itemSize = 3;
        vertexPositionBuffer.numItems = vertices.length / vertexPositionBuffer.itemSize;

        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    }

    // init index buffer
    _initVertexIndexBuffer() {
        let vertexIndexBuffer = this.vertexIndexBuffer;
        let indices = this.indices;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        vertexIndexBuffer.itemSize = 1;
        vertexIndexBuffer.numItems = indices.length / vertexIndexBuffer.itemSize;
    }

    // init normal buffer
    _initVertexNormalBuffer() {
        let vertexNormalBuffer = this.vertexNormalBuffer;
        let normals = this.normals;

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        vertexNormalBuffer.itemSize = 3;
        vertexNormalBuffer.numItems = normals.length / vertexNormalBuffer.itemSize;

        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    }

    // init normal buffer
    _initTextureCoordBuffer() {
        let texCoordBuffer = this.texCoordBuffer;
        let texCoords = this.texCoords;

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        texCoordBuffer.itemSize = 2;
        texCoordBuffer.numItems = texCoords.length / texCoordBuffer.itemSize;

        gl.vertexAttribPointer(shaderProgram.vertexTexCoordsAttribute, texCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexTexCoordsAttribute);
    }

    // init color buffer
    _initColorBuffer() {
        let colorBuffer = this.colorBuffer;
        let vertices = this.vertices;
        let color = this.defaultColor;

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);

        colorBuffer.itemSize = 3;
        colorBuffer.numItems = vertices.length / colorBuffer.itemSize;

        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    }

    // draw object
    draw(mMatrix, isLight, texture, textureMode) {
        let nMatrix = this.nMatrix;

        mat4.identity(v2wMatrix);
        v2wMatrix = mat4.multiply(v2wMatrix, vMatrix);
        v2wMatrix = mat4.transpose(v2wMatrix);

        if (camera == 0)
            vMatrix = mat4.lookAt([10, 5, 10], [0, 0, 0], [0, 1, 0], vMatrix);
        else if (camera == 1)
            vMatrix = mat4.lookAt(cameraPosition, cameraCOI, [0, 1, 0], vMatrix);

        mat4.identity(nMatrix);
        nMatrix = mat4.multiply(nMatrix, vMatrix);
        nMatrix = mat4.multiply(nMatrix, mMatrix);
        nMatrix = mat4.inverse(nMatrix);
        nMatrix = mat4.transpose(nMatrix);

        // send data to shader
        gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, mMatrix);
        gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, vMatrix);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);
        gl.uniformMatrix4fv(shaderProgram.v2wMatrixUniform, false, v2wMatrix);

        gl.uniform4f(shaderProgram.light_posUniform, light_pos[0], light_pos[1], light_pos[2], light_pos[3]);
        gl.uniform4f(shaderProgram.ambient_coefUniform, mat_ambient[0], mat_ambient[1], mat_ambient[2], 1.0);
        gl.uniform4f(shaderProgram.diffuse_coefUniform, mat_diffuse[0], mat_diffuse[1], mat_diffuse[2], 1.0);
        gl.uniform4f(shaderProgram.specular_coefUniform, mat_specular[0], mat_specular[1], mat_specular[2], 1.0);
        gl.uniform1f(shaderProgram.shininess_coefUniform, mat_shine[0]);

        gl.uniform1i(shaderProgram.isLight, isLight);

        gl.uniform4f(shaderProgram.light_ambientUniform, light_ambient[0], light_ambient[1], light_ambient[2], 1.0);
        gl.uniform4f(shaderProgram.light_diffuseUniform, light_diffuse[0], light_diffuse[1], light_diffuse[2], 1.0);
        gl.uniform4f(shaderProgram.light_specularUniform, light_specular[0], light_specular[1], light_specular[2], 1.0);

        gl.uniform4f(shaderProgram.toonColor, toonColor[0], toonColor[1], toonColor[2], 1.0);

        gl.uniform1i(shaderProgram.enableMapKa, 0);
        gl.uniform1i(shaderProgram.enableMapKd, 0);
        gl.uniform1i(shaderProgram.enableMapKs, 0);

        // bind buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexTexCoordsAttribute, this.texCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);

        gl.uniform1i(shaderProgram.use_textureUniform, textureMode);

        gl.uniform3f(shaderProgram.cameraPosition, cameraPosition[0], cameraPosition[1], cameraPosition[2]);

        if (texture != null) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(shaderProgram.textureUniform, 0);
        }

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
        gl.uniform1i(shaderProgram.cube_map_textureUniform, 3);

        // draw
        gl.drawElements(drawMode, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
}


class Stack {
    constructor(dataList) {
        this.dataList = dataList;
        this.length = dataList.length;
        this.top = dataList[this.length - 1];
    }

    push(data) {
        this.dataList.push(data);
        this.length++;
        this.top = this.dataList[this.length - 1];
    }

    pop() {
        let popped;
        if (this.length > 0) {
            popped = this.dataList.pop();
            this.length--;
            this.top = this.dataList[this.length - 1];
        }
        return popped;
    }

    modifyTop(newTop) {
        this.dataList[this.length - 1] = newTop;
        this.top = this.dataList[this.length - 1];
    }
}

// build objects of different shapes
class ShapeBuilder {

    static buildPlane(length, width) {
        let vertices = [];
        let indices = [];
        let normals = [];
        let texCoords = [];

        vertices = [
            length / 2, width / 2, 0,
            -length / 2, width / 2, 0,
            -length / 2, -width / 2, 0,
            length / 2, -width / 2, 0,
        ];
        normals = [
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ];
        indices = [
            0, 1, 2,
            0, 2, 3,
        ];
        texCoords = [
            1, 0,
            0, 0,
            0, 1,
            1, 1,
        ];

        return [vertices, indices, normals, texCoords];
    }

    static buildTorus(r1, r2, resolution) {
        let vertices = [];
        let indices = [];
        let normals = [];
        let texCoords = [];

        let numOfIndices = resolution + 1;
        for (let i = 0; i <= resolution; i++) {
            let u = i / resolution;

            let index1 = i * numOfIndices;
            let index2 = index1 + numOfIndices;

            for (let j = 0; j <= resolution; j++) {
                let v = j / resolution;

                let uDegree = u * 2 * Math.PI;
                let vDegree = v * 2 * Math.PI;

                let sinU = Math.sin(uDegree);
                let cosU = Math.cos(uDegree);

                let sinV = Math.sin(vDegree);
                let cosV = Math.cos(vDegree);

                let x = (r1 + r2 * cosV) * cosU;
                let y = (r1 + r2 * cosV) * sinU;
                let z = r2 * sinV;

                vertices.push(x, y, z);
                normals.push(x, y, z);

                texCoords.push(v);
                texCoords.push(u);

                indices.push(index1);
                indices.push(index1 + 1);
                indices.push(index2);
                indices.push(index2);
                indices.push(index1 + 1);
                indices.push(index2 + 1);

                index1++;
                index2++;
            }
        }

        return [vertices, indices, normals, texCoords];
    }

    static buildCube(size) {
        let vertices = [];
        let indices = [];
        let normals = [];
        let texCoords = [];

        vertices = [-0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5];
        normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0];
        indices = [0, 1, 2, 2, 1, 3, 4, 5, 6, 6, 5, 7, 8, 9, 10, 10, 9, 11, 12, 13, 14, 14, 13, 15, 16, 17, 18, 18, 17, 19, 20, 21, 22, 22, 21, 23];
        texCoords = [
        ];

        return [vertices, indices, normals, texCoords];
    }

    static buildTetrahedron(size) {
        let vertices = [];
        let indices = [];
        let normals = [];

        vertices = [
            size, size, 0,
            size, -size, 0,
            -size, size, 0,
            size, size, -2 * size
        ];
        normals = [
            size, size, 0,
            size, -size, 0,
            -size, size, 0,
            size, size, -2 * size
        ];
        indices = [
            0, 1, 2,
            0, 1, 3,
            0, 2, 3,
            1, 2, 3
        ]

        return [vertices, indices, normals];
    }

    static buildCylinder(radius, height, resolution) {
        let vertices = [];
        let indices = [];
        let normals = [];
        let rad = degToRad(360 / resolution);
        let prevX = 0;
        let prevZ = radius;

        for (let i = 0; i < resolution; i++) {
            let x = prevX * Math.cos(rad) - prevZ * Math.sin(rad);
            let y = height / 2;
            let z = prevZ * Math.cos(rad) + prevX * Math.sin(rad);

            vertices.push(x);
            vertices.push(y);
            vertices.push(z);

            vertices.push(x);
            vertices.push(-y);
            vertices.push(z);

            normals.push(x);
            normals.push(0);
            normals.push(z);

            normals.push(x);
            normals.push(0);
            normals.push(z);

            prevX = x;
            prevZ = z;

            let index = 2 * i;
            if (i == resolution - 1) {
                indices.push(index);
                indices.push(0);
                indices.push(index + 1);

                indices.push(1);
                indices.push(index + 1);
                indices.push(0);
            }
            else {
                indices.push(index);
                indices.push(index + 2);
                indices.push(index + 1);

                indices.push(index + 3);
                indices.push(index + 1);
                indices.push(index + 2);
            }
        }

        return [vertices, indices, normals];
    }

    static buildCone(radius, height, resolution) {
        let vertices = [];
        let indices = [];
        let normals = [];

        let rad = degToRad(360 / resolution);
        let prevX = 0;
        let prevZ = radius;

        vertices.push(0);
        vertices.push(height / 2);
        vertices.push(0);

        normals.push(0);
        normals.push(height / 2);
        normals.push(0);

        for (let i = 0; i < resolution; i++) {
            let x = prevX * Math.cos(rad) - prevZ * Math.sin(rad);
            let y = height / 2;
            let z = prevZ * Math.cos(rad) + prevX * Math.sin(rad);

            vertices.push(x);
            vertices.push(-y);
            vertices.push(z);

            let c = Math.sqrt(radius * radius + height * height);
            normals.push(x);
            normals.push(height * radius / c);
            normals.push(z);

            prevX = x;
            prevZ = z;

            let index = i;
            if (i == resolution - 1) {
                indices.push(0);
                indices.push(index + 1);
                indices.push(1);
            }
            else {
                indices.push(0);
                indices.push(index + 1);
                indices.push(index + 2);
            }
        }


        return [vertices, indices, normals];
    }

    static buildSphere(radius, resolution) {
        let vertices = [];
        let indices = [];
        let normals = [];

        let rad = degToRad(360 / resolution);
        let stackAngle = degToRad(90) - rad;
        let sectorAngle = degToRad(0);

        vertices.push(0);
        vertices.push(radius);
        vertices.push(0);

        normals.push(0);
        normals.push(radius);
        normals.push(0);

        let index = 0;
        for (let i = 1; i < resolution / 2; i++) {
            for (let j = 0; j < resolution; j++) {
                let x = radius * Math.cos(stackAngle) * Math.cos(sectorAngle);
                let y = radius * Math.sin(stackAngle);
                let z = radius * Math.cos(stackAngle) * Math.sin(sectorAngle);

                vertices.push(x);
                vertices.push(y);
                vertices.push(z);

                normals.push(x);
                normals.push(y);
                normals.push(z);

                sectorAngle += rad;

                index = (i - 1) * resolution + j;

                if (i == 1) {
                    indices.push(0);
                    indices.push(index + 1);
                    if (j == resolution - 1) indices.push(1);
                    else indices.push(index + 2);
                }
                else {
                    index++;

                    indices.push(index - resolution);
                    if (j == resolution - 1) indices.push(index - 2 * resolution + 1)
                    else indices.push(index + 1 - resolution);
                    indices.push(index);

                    if (j == resolution - 1) indices.push(index + 1 - resolution)
                    else indices.push(index + 1);
                    indices.push(index);
                    if (j == resolution - 1) indices.push(index - 2 * resolution + 1)
                    else indices.push(index + 1 - resolution);
                }
            }

            stackAngle -= rad;
        }

        vertices.push(0);
        vertices.push(-radius);
        vertices.push(0);

        normals.push(0);
        normals.push(-radius);
        normals.push(0);

        for (let i = index - resolution + 1; i < index + 1; i++) {
            indices.push(i);
            if (i == index) indices.push(index - resolution + 1);
            else indices.push(i + 1);
            indices.push(index + 1);
        }

        return [vertices, indices, normals];
    }
}

let fileName = "car";
const objSrc = fileName + ".obj";
const mtlSrc = fileName + ".mtl";

function initOBJLoader(objSrc, mtlSrc) {
    let request = new XMLHttpRequest();
    request.open("GET", objSrc);
    request.onreadystatechange =
        function () {
            if (request.readyState == 4) {
                console.log("state =" + request.readyState);
                mtlLoader(request.responseText, mtlSrc);
            }
        }
    request.send();
}

function mtlLoader(objText, mtlSrc) {
    let request = new XMLHttpRequest();
    request.open("GET", mtlSrc);
    request.onreadystatechange =
        function () {
            if (request.readyState == 4) {
                console.log("state =" + request.readyState);
                let obj = parseOBJ(objText);
                let mtl = parseMTL(request.responseText);
                initOBJBuffers(obj, mtl);
            }
        }
    request.send();
}

let objVertexPositionBuffers = [];
let objVertexNormalBuffers = [];
let objVertexTexCoordBuffers = [];
let mtlKa = [];
let mtlKd = [];
let mtlKs = [];
let mtlShininess = [];
let mtlMapKa = [];
let mtlMapKd = [];
let mtlMapKs = [];

function initOBJBuffers(objData, mtlData) {
    console.log(objData);
    console.log(mtlData);
    for (let geometry of objData.geometries) {
        let curVertexPositionBuffers = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, curVertexPositionBuffers);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.data.position), gl.STATIC_DRAW);
        curVertexPositionBuffers.itemSize = 3;
        curVertexPositionBuffers.numItems = geometry.data.position.length / 3;
        objVertexPositionBuffers.push(curVertexPositionBuffers);

        let curVertexNormalBuffers = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, curVertexNormalBuffers);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.data.normal), gl.STATIC_DRAW);
        curVertexNormalBuffers.itemSize = 3;
        curVertexNormalBuffers.numItems = geometry.data.normal.length / 3;
        objVertexNormalBuffers.push(curVertexNormalBuffers);

        let curVertexTexCoordBuffers = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, curVertexTexCoordBuffers);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.data.texcoord), gl.STATIC_DRAW);
        curVertexTexCoordBuffers.itemSize = 2;
        curVertexTexCoordBuffers.numItems = geometry.data.texcoord.length / 2;
        objVertexTexCoordBuffers.push(curVertexTexCoordBuffers);

        mtlKa.push(mtlData[geometry.material].ambient);
        mtlKd.push(mtlData[geometry.material].diffuse);
        mtlKs.push(mtlData[geometry.material].specular);
        mtlShininess.push(mtlData[geometry.material].shininess);

        if (mtlData[geometry.material].ambientMap != null) mtlMapKa.push(mtlData[geometry.material].ambientMap);
        else mtlMapKa.push(null);
        if (mtlData[geometry.material].diffuseMap != null) mtlMapKd.push(mtlData[geometry.material].diffuseMap);
        else mtlMapKd.push(null);
        if (mtlData[geometry.material].specularMap != null) mtlMapKs.push(mtlData[geometry.material].specularMap);
        else mtlMapKs.push(null);
    }
}

function drawOBJ(mMatrix, textureMode) {

    let nMatrix = mat4.create();
    mat4.identity(nMatrix);
    nMatrix = mat4.multiply(nMatrix, vMatrix);
    nMatrix = mat4.multiply(nMatrix, mMatrix);
    nMatrix = mat4.inverse(nMatrix);
    nMatrix = mat4.transpose(nMatrix);

    //gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    for (let i = 0; i < objVertexPositionBuffers.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffers[i]);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, objVertexPositionBuffers[i].itemSize, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffers[i]);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, objVertexNormalBuffers[i].itemSize, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(shaderProgram.vertexTexCoordsAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, objVertexTexCoordBuffers[i]);
        gl.vertexAttribPointer(shaderProgram.vertexTexCoordsAttribute, objVertexTexCoordBuffers[i].itemSize, gl.FLOAT, false, 0, 0);

        //gl.disableVertexAttribArray(shaderProgram.vertexColorAttribute);

        // send data to shader
        gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, mMatrix);
        gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, vMatrix);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);

        gl.uniform4f(shaderProgram.ambient_coefUniform, mtlKa[i][0], mtlKa[i][1], mtlKa[i][2], 1.0);
        gl.uniform4f(shaderProgram.diffuse_coefUniform, mtlKd[i][0], mtlKd[i][1], mtlKd[i][2], 1.0);
        gl.uniform4f(shaderProgram.specular_coefUniform, mtlKs[i][0], mtlKs[i][1], mtlKs[i][2], 1.0);

        gl.uniform4f(shaderProgram.light_posUniform, light_pos[0], light_pos[1], light_pos[2], light_pos[3]);
        gl.uniform1f(shaderProgram.shininess_coefUniform, mat_shine[0]);

        gl.uniform1i(shaderProgram.isLight, false);

        gl.uniform4f(shaderProgram.light_ambientUniform, light_ambient[0], light_ambient[1], light_ambient[2], 1.0);
        gl.uniform4f(shaderProgram.light_diffuseUniform, light_diffuse[0], light_diffuse[1], light_diffuse[2], 1.0);
        gl.uniform4f(shaderProgram.light_specularUniform, light_specular[0], light_specular[1], light_specular[2], 1.0);

        gl.uniform4f(shaderProgram.toonColor, toonColor[0], toonColor[1], toonColor[2], 1.0);
        gl.uniform1i(shaderProgram.use_textureUniform, textureMode);

        if (mtlMapKa[i] != null) {
            gl.uniform1i(shaderProgram.enableMapKa, 1);
            gl.activeTexture(gl.TEXTURE0);                 // set texture unit 0 to use 
            gl.bindTexture(gl.TEXTURE_2D, mtlMapKa[i]);    // bind the texture object to the texture unit 
            gl.uniform1i(shaderProgram.textureKd, 0);      // pass the texture unit to the shader
        }
        else gl.uniform1i(shaderProgram.enableMapKa, 0);

        if (mtlMapKd[i] != null) {
            gl.uniform1i(shaderProgram.enableMapKd, 1);
            gl.activeTexture(gl.TEXTURE1);                 // set texture unit 0 to use 
            gl.bindTexture(gl.TEXTURE_2D, mtlMapKd[i]);    // bind the texture object to the texture unit 
            gl.uniform1i(shaderProgram.textureKd, 1);      // pass the texture unit to the shader
        }
        else gl.uniform1i(shaderProgram.enableMapKd, 0);

        if (mtlMapKs[i] != null) {
            gl.uniform1i(shaderProgram.enableMapKs, 1);
            gl.activeTexture(gl.TEXTURE2);                 // set texture unit 1 to use 
            gl.bindTexture(gl.TEXTURE_2D, mtlMapKs[i]);    // bind the texture object to the texture unit 
            gl.uniform1i(shaderProgram.textureKs, 2);      // pass the texture unit to the shader
        }
        else gl.uniform1i(shaderProgram.enableMapKs, 0);
        // gl.uniform1i(shaderProgram.enableMapKs, 0);

        gl.drawArrays(gl.TRIANGLES, 0, objVertexPositionBuffers[i].numItems);
    }
}

let cubemapTexture;

function initCubeMap() {
    cubemapTexture = gl.createTexture();
    cubemapTexture.image = new Image();
    cubemapTexture.image.onload = function () { handleCubemapTextureLoaded(cubemapTexture); }
    cubemapTexture.image.src = "Textures/silksong.jpg";
}
function handleCubemapTextureLoaded(texture) {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);	//Stretch image to X position
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);	//Stretch image to Y position
    //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);	//Stretch image to Z position

    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        nameToTexture.get("right").image);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        nameToTexture.get("left").image);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        nameToTexture.get("top").image);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        nameToTexture.get("bottom").image);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        nameToTexture.get("front").image);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        nameToTexture.get("back").image);

    gl.bindTexture(gl.TEXTURE_2D, null);
}
