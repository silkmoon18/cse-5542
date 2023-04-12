
const vertexSize = 3;
const colorSize = 3;

class Shape {

    constructor(name, mode, defaultColor) {
        this.name = name;
        this.mode = mode;
        this.defaultColor = defaultColor;


        this.vertexPositionBuffer = gl.createBuffer();
        this.vertexIndexBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();

        this.vertices = [];
        this.indices = [];

        this.vMatrix = mat4.create();
        this.mMatrixStack = new Stack([mat4.create()]);
        this.mvMatrix = mat4.create();
        this.pMatrix = mat4.create();

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
        this._initColorBuffer();
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

    setMatrices(p, v) {
        this.pMatrix = mat4.create(p);
        this.vMatrix = mat4.create(v);
    }

    // draw all shapes in the Shape object
    draw() {
        for (let i = 1; i < this.mMatrixStack.length; i++) {
            let mMatrix = this.mMatrixStack.dataList[i];
            let color = generateColor(this.colorStack.dataList[i], this.vertexPositionBuffer.numItems, true);

            mat4.multiply(this.vMatrix, mMatrix, this.mvMatrix);  // mvMatrix = vMatrix * mMatrix and is the modelview Matrix 

            gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, this.mvMatrix);
            gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, this.pMatrix);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);

            gl.drawElements(this.mode, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }
    }

    draw(mMatrix, mode) {
        let color = generateColor(this.defaultColor, this.vertexPositionBuffer.numItems, true);

        mat4.multiply(this.vMatrix, mMatrix, this.mvMatrix);  // mvMatrix = vMatrix * mMatrix and is the modelview Matrix 
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, this.mvMatrix);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, this.pMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        
        gl.drawElements(mode, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
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

class ShapeBuilder {
    static buildCube(size) {
        let vertices = [];
        let indices = [];

        vertices = [
            size, size, -size,
            -size, size, -size,
            -size, -size, -size,
            size, -size, -size,
            size, size, size,
            -size, size, size,
            -size, -size, size,
            size, -size, size
        ];
        indices = [
            0, 1, 2,
            0, 2, 3,
            0, 3, 7,
            0, 7, 4,
            6, 2, 3,
            6, 3, 7,
            5, 1, 2,
            5, 2, 6,
            5, 1, 0,
            5, 0, 4,
            5, 6, 7,
            5, 7, 4
        ];

        return [vertices, indices];
    }

    static buildTetrahedron(size) {
        let vertices = [];
        let indices = [];

        vertices = [
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

        return [vertices, indices];
    }

    static buildCylinder(radius, height, resolution) {
        let vertices = [];
        let indices = [];

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

        return [vertices, indices];
    }

    static buildCone(radius, height, resolution) {
        let vertices = [];
        let indices = [];

        let rad = degToRad(360 / resolution);
        let prevX = 0;
        let prevZ = radius;

        vertices.push(0);
        vertices.push(height / 2);
        vertices.push(0);

        for (let i = 0; i < resolution; i++) {
            let x = prevX * Math.cos(rad) - prevZ * Math.sin(rad);
            let y = height / 2;
            let z = prevZ * Math.cos(rad) + prevX * Math.sin(rad);

            vertices.push(x);
            vertices.push(-y);
            vertices.push(z);

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

        return [vertices, indices];
    }

    static buildSphere(radius, resolution) {
        let vertices = [];
        let indices = [];

        let rad = degToRad(360 / resolution);
        let stackAngle = degToRad(90) - rad;
        let sectorAngle = degToRad(0);

        vertices.push(0);
        vertices.push(radius);
        vertices.push(0);

        let index = 0;
        for (let i = 1; i < resolution / 2; i++) {
            for (let j = 0; j < resolution; j++) {
                let x = radius * Math.cos(stackAngle) * Math.cos(sectorAngle);
                let y = radius * Math.sin(stackAngle);
                let z = radius * Math.cos(stackAngle) * Math.sin(sectorAngle);

                vertices.push(x);
                vertices.push(y);
                vertices.push(z);

                sectorAngle += rad;

                if (vertices.length > 2) {
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
            }
            stackAngle -= rad;
        }
        
        vertices.push(0);
        vertices.push(-radius);
        vertices.push(0);

        for (let i = index - resolution + 1; i < index + 1; i++) {
            indices.push(i);
            if (i == index) indices.push(index - resolution + 1);
            else indices.push(i + 1);
            indices.push(index + 1);
        }

        return [vertices, indices];
    }
}

