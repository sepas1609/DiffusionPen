import * as THREE from 'three';

export class WebGLScene {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private pageMesh: THREE.Mesh | null = null;
  private shaderMat: THREE.ShaderMaterial | null = null;
  private coffeeRingTexture: THREE.Texture | null = null;

  constructor(private targetCanvas: HTMLCanvasElement) {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: targetCanvas,
        antialias: true,
        alpha: false,
      });
      this.renderer.setSize(targetCanvas.width, targetCanvas.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
      this.camera.position.z = 1;

      this.setupPageMesh();
      this.createProceduralTextures();
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to 2D context:', e);
    }
  }

  private setupPageMesh() {
    if (!this.scene) return;

    const geo = new THREE.PlaneGeometry(2, 2, 48, 48);
    const pos = geo.attributes.position;

    // Displace vertices to simulate authentic notebook binding curvature
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      // Deep curvature near the left spine/binding: z = -0.04 * (x + 0.5)^2
      const binding = -0.045 * Math.pow(x + 0.5, 2);
      // Gentle page curl wave along Y: z += 0.008 * sin(y * 2.5)
      const curl = 0.008 * Math.sin(y * 2.5);

      pos.setZ(i, binding + curl);
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();

    this.shaderMat = new THREE.ShaderMaterial({
      uniforms: {
        pageTexture: { value: null },
        lightingDir: { value: new THREE.Vector3(0.5, 0.7, 0.8).normalize() },
        ambientColor: { value: new THREE.Color(0xfff6e8) },
        ambientIntensity: { value: 0.65 },
        shadowColor: { value: new THREE.Color(0x1a1410) },
        shadowIntensity: { value: 0.40 },
        coffeeRingTex: { value: null },
        showCoffeeRing: { value: 0.0 },
        grainStrength: { value: 0.035 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D pageTexture;
        uniform sampler2D coffeeRingTex;
        uniform vec3 lightingDir;
        uniform vec3 ambientColor;
        uniform float ambientIntensity;
        uniform vec3 shadowColor;
        uniform float shadowIntensity;
        uniform float grainStrength;
        uniform float showCoffeeRing;
        varying vec2 vUv;
        varying vec3 vNormal;

        // Hash noise generator for subtle camera grain
        float rand(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
        }

        void main() {
          vec4 page = texture2D(pageTexture, vUv);

          // Lambertian lighting from virtual desk lamp
          float diff = max(dot(vNormal, lightingDir), 0.0);
          vec3 lit = page.rgb * (ambientColor * ambientIntensity + vec3(diff) * 0.45);

          // Spine shadow gradient (darker towards spine at left)
          float shadowFactor = 1.0 - smoothstep(0.0, 0.32, vUv.x) * shadowIntensity;
          lit = mix(lit * shadowColor, lit, shadowFactor);

          // Optional coffee ring stain overlay
          if (showCoffeeRing > 0.5) {
            vec4 ring = texture2D(coffeeRingTex, vUv);
            lit = mix(lit, lit * vec3(0.70, 0.55, 0.40), ring.a * 0.45);
          }

          // Camera grain
          float grain = rand(vUv * 800.0);
          lit += grain * grainStrength;

          gl_FragColor = vec4(lit, page.a);
        }
      `,
    });

    this.pageMesh = new THREE.Mesh(geo, this.shaderMat);
    this.scene.add(this.pageMesh);
  }

  private createProceduralTextures() {
    // Generate coffee ring texture on an offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 256, 256);
      ctx.beginPath();
      ctx.arc(190, 80, 45, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(120, 75, 40, 0.6)';
      ctx.stroke();

      // Subtle outer splatter
      ctx.beginPath();
      ctx.arc(190, 80, 48, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(120, 75, 40, 0.25)';
      ctx.stroke();

      this.coffeeRingTexture = new THREE.CanvasTexture(canvas);
      if (this.shaderMat) {
        this.shaderMat.uniforms.coffeeRingTex.value = this.coffeeRingTexture;
      }
    }
  }

  setCoffeeRing(enabled: boolean) {
    if (this.shaderMat) {
      this.shaderMat.uniforms.showCoffeeRing.value = enabled ? 1.0 : 0.0;
    }
  }

  setLightingIntensity(val: number) {
    if (this.shaderMat) {
      this.shaderMat.uniforms.ambientIntensity.value = val;
    }
  }

  /** Render composite from 2D canvas into 3D warped scene */
  render(sourceCanvas2D: HTMLCanvasElement) {
    if (!this.renderer || !this.scene || !this.camera || !this.shaderMat) {
      // Fallback: direct 2D canvas copy
      const ctx = this.targetCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, this.targetCanvas.width, this.targetCanvas.height);
        ctx.drawImage(sourceCanvas2D, 0, 0, this.targetCanvas.width, this.targetCanvas.height);
      }
      return;
    }

    const tex = new THREE.CanvasTexture(sourceCanvas2D);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.shaderMat.uniforms.pageTexture.value = tex;

    this.renderer.setSize(this.targetCanvas.width, this.targetCanvas.height, false);
    this.renderer.render(this.scene, this.camera);
    tex.dispose();
  }

  dispose() {
    this.renderer?.dispose();
    this.pageMesh?.geometry.dispose();
  }
}
