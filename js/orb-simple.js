class SimpleOrb {
  constructor(container, options = {}) {
    this.container = container;
    this.hue = options.hue || 0;
    this.hoverIntensity = options.hoverIntensity || 0.5;
    this.rotateOnHover = options.rotateOnHover !== undefined ? options.rotateOnHover : true;
    this.forceHoverState = options.forceHoverState || false;
    
    this.targetHover = 0;
    this.currentHover = 0;
    this.currentRot = 0;
    this.rotationSpeed = 0.3;
    this.time = 0;
    this.rafId = null;
    
    // 悬停状态参数
    this.isHovering = false; // 是否正在悬停
    
    this.init();
  }

  init() {
    // 创建 canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'auto';
    this.container.appendChild(this.canvas);

    // 获取 WebGL 上下文
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    
    if (!this.gl) {
      this.showFallback();
      return;
    }

    this.setupShaders();
    this.setupGeometry();
    this.setupUniforms();
    this.setupEventListeners();
    this.resize();
    this.animate();
  }

  setupShaders() {
    const gl = this.gl;

    const vertexShaderSource = `
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

      const fragmentShaderSource = `
      precision highp float;
      
      uniform float iTime;
      uniform vec2 iResolution;
      uniform float hue;
      uniform float hover;
      uniform float rot;
      uniform float hoverIntensity;
      varying vec2 vUv;

      vec3 rgb2yiq(vec3 c) {
        float y = dot(c, vec3(0.299, 0.587, 0.114));
        float i = dot(c, vec3(0.596, -0.274, -0.322));
        float q = dot(c, vec3(0.211, -0.523, 0.312));
        return vec3(y, i, q);
      }
      
      vec3 yiq2rgb(vec3 c) {
        float r = c.x + 0.956 * c.y + 0.621 * c.z;
        float g = c.x - 0.272 * c.y - 0.647 * c.z;
        float b = c.x - 1.106 * c.y + 1.703 * c.z;
        return vec3(r, g, b);
      }
      
      vec3 adjustHue(vec3 color, float hueDeg) {
        float hueRad = hueDeg * 3.14159265 / 180.0;
        vec3 yiq = rgb2yiq(color);
        float cosA = cos(hueRad);
        float sinA = sin(hueRad);
        float i = yiq.y * cosA - yiq.z * sinA;
        float q = yiq.y * sinA + yiq.z * cosA;
        yiq.y = i;
        yiq.z = q;
        return yiq2rgb(yiq);
      }

      vec3 hash33(vec3 p3) {
        p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
        p3 += dot(p3, p3.yxz + 19.19);
        return -1.0 + 2.0 * fract(vec3(
          p3.x + p3.y,
          p3.x + p3.z,
          p3.y + p3.z
        ) * p3.zyx);
      }

      float snoise3(vec3 p) {
        const float K1 = 0.333333333;
        const float K2 = 0.166666667;
        vec3 i = floor(p + (p.x + p.y + p.z) * K1);
        vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
        vec3 e = step(vec3(0.0), d0 - d0.yzx);
        vec3 i1 = e * (1.0 - e.zxy);
        vec3 i2 = 1.0 - e.zxy * (1.0 - e);
        vec3 d1 = d0 - (i1 - K2);
        vec3 d2 = d0 - (i2 - K1);
        vec3 d3 = d0 - 0.5;
        vec4 h = max(0.6 - vec4(
          dot(d0, d0),
          dot(d1, d1),
          dot(d2, d2),
          dot(d3, d3)
        ), 0.0);
        vec4 n = h * h * h * h * vec4(
          dot(d0, hash33(i)),
          dot(d1, hash33(i + i1)),
          dot(d2, hash33(i + i2)),
          dot(d3, hash33(i + 1.0))
        );
        return dot(vec4(31.316), n);
      }

      vec4 extractAlpha(vec3 colorIn) {
        float a = max(max(colorIn.r, colorIn.g), colorIn.b);
        return vec4(colorIn.rgb / (a + 1e-5), a);
      }

      const vec3 baseColor1 = vec3(0.611765, 0.262745, 0.996078);
      const vec3 baseColor2 = vec3(0.298039, 0.760784, 0.913725);
      const vec3 baseColor3 = vec3(0.062745, 0.078431, 0.600000);
      const float innerRadius = 0.6;
      const float noiseScale = 0.65;

      float light1(float intensity, float attenuation, float dist) {
        return intensity / (1.0 + dist * attenuation);
      }
      float light2(float intensity, float attenuation, float dist) {
        return intensity / (1.0 + dist * dist * attenuation);
      }

      vec4 draw(vec2 uv) {
        vec3 color1 = adjustHue(baseColor1, hue);
        vec3 color2 = adjustHue(baseColor2, hue);
        vec3 color3 = adjustHue(baseColor3, hue);
        
        float ang = atan(uv.y, uv.x);
        float len = length(uv);
        float invLen = len > 0.0 ? 1.0 / len : 0.0;
        
        float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
        float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
        float d0 = distance(uv, (r0 * invLen) * uv);
        float v0 = light1(1.0, 10.0, d0);
        v0 *= smoothstep(r0 * 1.05, r0, len);
        float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;
        
        float a = iTime * -1.0;
        vec2 pos = vec2(cos(a), sin(a)) * r0;
        float d = distance(uv, pos);
        float v1 = light2(1.5, 5.0, d);
        v1 *= light1(1.0, 50.0, d0);
        
        float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
        float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);
        
        vec3 col = mix(color1, color2, cl);
        col = mix(color3, col, v0);
        col = (col + v1) * v2 * v3;
        col = clamp(col, 0.0, 1.0);
        
        return extractAlpha(col);
      }

      vec4 mainImage(vec2 fragCoord) {
        vec2 center = iResolution.xy * 0.5;
        float size = min(iResolution.x, iResolution.y);
        vec2 uv = (fragCoord - center) / size * 2.0;
        
        float angle = rot;
        float s = sin(angle);
        float c = cos(angle);
        uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
        
        uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
        uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);
        
        return draw(uv);
      }

      void main() {
        vec2 fragCoord = vUv * iResolution.xy;
        vec4 col = mainImage(fragCoord);
        gl_FragColor = vec4(col.rgb * col.a, col.a);
      }
    `;

    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      this.showFallback();
      return;
    }

    gl.useProgram(this.program);
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  setupGeometry() {
    const gl = this.gl;

    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const uvs = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ]);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    this.uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

    this.positionLocation = gl.getAttribLocation(this.program, 'position');
    this.uvLocation = gl.getAttribLocation(this.program, 'uv');
  }

  setupUniforms() {
    const gl = this.gl;

    this.uniforms = {
      iTime: gl.getUniformLocation(this.program, 'iTime'),
      iResolution: gl.getUniformLocation(this.program, 'iResolution'),
      hue: gl.getUniformLocation(this.program, 'hue'),
      hover: gl.getUniformLocation(this.program, 'hover'),
      rot: gl.getUniformLocation(this.program, 'rot'),
      hoverIntensity: gl.getUniformLocation(this.program, 'hoverIntensity'),
    };
  }

  setupEventListeners() {
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.resize = this.resize.bind(this);

    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    window.addEventListener('resize', this.resize);
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    const size = Math.min(width, height);
    const centerX = width / 2;
    const centerY = height / 2;
    
    const uvX = ((x - centerX) / size) * 2.0;
    const uvY = ((y - centerY) / size) * 2.0;
    
    if (Math.sqrt(uvX * uvX + uvY * uvY) < 0.8) {
      this.isHovering = true;
      this.targetHover = 1;
    } else {
      this.isHovering = false;
      this.targetHover = this.forceHoverState ? 1 : 0;
    }
  }

  handleMouseLeave() {
    this.isHovering = false;
    this.targetHover = this.forceHoverState ? 1 : 0;
  }

  resize() {
    const gl = this.gl;
    const dpr = window.devicePixelRatio || 1;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.uniforms.iResolution) {
      gl.uniform2f(this.uniforms.iResolution, this.canvas.width, this.canvas.height);
    }
  }

  animate() {
    this.rafId = requestAnimationFrame(() => this.animate());
    
    const gl = this.gl;
    const deltaTime = 0.016;
    
    this.time += deltaTime;
    
    const effectiveHover = this.forceHoverState ? 1 : this.targetHover;
    
    this.currentHover += (effectiveHover - this.currentHover) * 0.1;
    
    if (this.rotateOnHover && effectiveHover > 0.5) {
      this.currentRot += this.rotationSpeed * deltaTime;
    }
    
    if (this.uniforms.iTime) gl.uniform1f(this.uniforms.iTime, this.time);
    if (this.uniforms.hue) gl.uniform1f(this.uniforms.hue, this.hue);
    if (this.uniforms.hover) gl.uniform1f(this.uniforms.hover, this.currentHover);
    if (this.uniforms.rot) gl.uniform1f(this.uniforms.rot, this.currentRot);
    if (this.uniforms.hoverIntensity) gl.uniform1f(this.uniforms.hoverIntensity, this.hoverIntensity);
    
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.enableVertexAttribArray(this.uvLocation);
    gl.vertexAttribPointer(this.uvLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  showFallback() {
    this.container.innerHTML = `
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        width: 300px;
        height: 300px;
        margin: -150px 0 0 -150px;
        background: radial-gradient(circle, 
          rgba(156,67,254,0.8) 0%, 
          rgba(76,194,233,0.6) 50%, 
          rgba(16,20,153,0.4) 100%);
        border-radius: 50%;
        animation: pulse 3s ease-in-out infinite;
        pointer-events: auto;
      "></div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
      </style>
    `;
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
      window.removeEventListener('resize', this.resize);
      
      if (this.container.contains(this.canvas)) {
        this.container.removeChild(this.canvas);
      }
    }
  }
}

window.SimpleOrb = SimpleOrb;
