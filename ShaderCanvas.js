const vertexShader = `attribute vec2 position;
varying vec2 vUv;
void main() {
  float zoom = 1.0;
  vUv = 0.5 - position * 0.5;
  vUv = (vUv - 0.5) * zoom + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const flagmentShader = `precision mediump float;
varying vec2 vUv;
uniform sampler2D tex;
uniform vec2 resolution;
uniform float distratio;

void main() {
  vec2 uv = vUv;
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(uv, center);
  vec2 warp = uv + normalize(uv - center) * pow(dist, 2.0) * distratio;
  gl_FragColor = texture2D(tex, clamp(warp, 0.0, 1.0));
}
`;

export class ShaderCanvas extends HTMLElement {
  constructor(src) {
    super();
    const canvas = document.createElement("canvas");
    this.appendChild(canvas);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const gl = canvas.getContext("webgl");
    const createShader = (gl, type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, flagmentShader);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    //const texLocation = gl.getUniformLocation(program, "tex");
    const resolutionLocation = gl.getUniformLocation(program, "resolution");

    const distratioLocation = gl.getUniformLocation(program, "distratio");

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    const video = src;
    const render = () => {
      //canvas.width = window.innerWidth;
      //canvas.height = window.innerHeight;
      //canvas.width = src.videoWidth;
      //canvas.height = src.videoHeight;
      //canvas.style.width = src.clientWidth;
      //canvas.style.height = src.clientHeight;
      canvas.width = src.videoWidth;
      canvas.height = src.videoHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      }
      
      //this.distratio = 3.0 + Math.cos(performance.now() / 500) * 2;
      gl.uniform1f(distratioLocation, this.distratio);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    };
    this.distratio = 0.0;
    render();
  }
}

customElements.define("shader-canvas", ShaderCanvas);
