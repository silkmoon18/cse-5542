
const vertexSize = 3;
const colorSize = 3;

class Shape {

    constructor(name, mode, numOfVertices, defaultColor) {
        this.name = name;
        this.mode = mode;
        this.numOfVertices = numOfVertices;
        this.defaultColor = defaultColor;


        this.vertexPositionBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();

        this.vertices = [];

        this.matrixStack = new Stack([mat4.create()]);
        
        this.colorStack = new Stack([defaultColor]);
    }

    clear() {
        this.vertexPositionBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();

        this.matrixStack = new Stack([mat4.create()]);

        this.colorStack = new Stack([this.defaultColor]);
        this.initialize();
    }

    // push to matrix stack
    pushMatrix(matrix) {
        this.matrixStack.push(matrix);
        this.colorStack.push(this.defaultColor);
    }

    // pop matrix stack
    popMatrix() {
        this.matrixStack.pop();
        this.colorStack.pop();
    }

    // init the Shape object
    initialize() {
        mat4.identity(this.matrixStack.top);
        this._initVertexPositionBuffer();
        this._initColorBuffer();
    }

    // init position buffer
    _initVertexPositionBuffer() {
        let vertexPositionBuffer = this.vertexPositionBuffer;
        let vertices = this.vertices;
    
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
        vertexPositionBuffer.itemSize = vertexSize;
        vertexPositionBuffer.numItems = vertices.length / vertexSize;

        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    }

    // init color buffer
    _initColorBuffer() {
        let colorBuffer = this.colorBuffer;
        let vertices = this.vertices;
        let color = this.defaultColor;
        
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
    
        colorBuffer.itemSize = colorSize;
        colorBuffer.numItems = vertices.length / colorSize;

        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    }

    // draw all shapes in the Shape object
    draw() {
        for (let i = 1; i < this.matrixStack.length; i++) {
            let matrix = this.matrixStack.dataList[i];
            let color = this.colorStack.dataList[i];

            gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, matrix);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
            
            gl.drawArrays(this.mode, 0, this.vertexPositionBuffer.numItems);
        }
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
        if (this.length > 0) {
            this.dataList.pop();
            this.length--;
            this.top = this.dataList[this.length - 1];
        }
    }

    modifyTop(newTop) {
        this.dataList[this.length - 1] = newTop;
        this.top = this.dataList[this.length - 1];
    }
}