import * as THREE from "three"
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'

export class PostProcess {
  private composer: EffectComposer
  private bloomPass: UnrealBloomPass
  private bloomComposer: EffectComposer
  private finalPass: ShaderPass
  private renderScene: RenderPass
  private bokehPass: BokehPass
  private pixelPass: ShaderPass
  private camera: THREE.Camera
  private pixelSize: number = 4 // Controls pixel size (higher = more pixelated)

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ) {
    this.camera = camera;

    // Set up render targets with proper format
    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        colorSpace: THREE.SRGBColorSpace
      }
    )

    // Main composer setup
    this.composer = new EffectComposer(renderer)
    this.renderScene = new RenderPass(scene, camera)
    this.composer.addPass(this.renderScene)

    // Bloom setup in separate composer
    this.bloomComposer = new EffectComposer(renderer, renderTarget)
    this.bloomComposer.addPass(new RenderPass(scene, camera))

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5,  // strength
      0.4,  // radius
      0.85  // threshold
    )
    this.bloomPass.resolution = new THREE.Vector2(0.5, 0.5)
    this.bloomComposer.addPass(this.bloomPass)

    // Add bokeh (depth of field) pass with much more conservative settings
    this.bokehPass = new BokehPass(scene, camera, {
      focus: 150,       // Increased focus distance further
      aperture: 0.0005, // Significantly reduced aperture for minimal effect
      maxblur: 0.003,   // Greatly reduced max blur
    });
    this.composer.addPass(this.bokehPass);

    // Add pixel shader pass
    this.pixelPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: null },
          resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
          pixelSize: { value: this.pixelSize }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform vec2 resolution;
          uniform float pixelSize;
          varying vec2 vUv;
          
          void main() {
            vec2 dxy = pixelSize / resolution;
            vec2 coord = dxy * floor(vUv / dxy);
            vec4 color = texture2D(tDiffuse, coord);
            
            // Add slight color enhancement for "sexy" look
            color.rgb = color.rgb * 1.1;
            
            // Add subtle vignette effect
            vec2 position = vUv - 0.5;
            float vignette = smoothstep(0.8, 0.2, length(position));
            color.rgb = mix(color.rgb, color.rgb * vignette, 0.3);
            
            gl_FragColor = color;
          }
        `
      })
    );
    this.composer.addPass(this.pixelPass);

    // Add shader pass to blend bloom with original scene
    this.finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;
          varying vec2 vUv;
          void main() {
            vec4 base = texture2D(baseTexture, vUv);
            vec4 bloom = texture2D(bloomTexture, vUv);
            // More saturated bloom blending for pixel art
            gl_FragColor = vec4(base.rgb + bloom.rgb * 0.9, 1.0);
          }
        `,
        defines: {}
      }), "baseTexture"
    )
    this.finalPass.needsSwap = true;
    this.composer.addPass(this.finalPass);

    // Add gamma correction as the final pass
    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(gammaCorrectionPass);
  }

  render() {
    // First render the bloom effect
    this.bloomComposer.render();

    // Then render the final composite with DoF
    this.composer.render();
  }

  resize(width: number, height: number) {
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;

    this.bloomComposer.setSize(halfWidth, halfHeight);
    this.composer.setSize(width, height);

    // Update pixel pass resolution
    if (this.pixelPass && this.pixelPass.uniforms) {
      this.pixelPass.uniforms.resolution.value.set(width, height);
    }

    // Update bokeh pass resolution
    if (this.bokehPass) {
      this.bokehPass.renderTargetDepth.setSize(width, height);
    }
  }

  // Method to adjust bloom based on time of day
  updateBloomForTimeOfDay(timeOfDay: number) {
    // Normalize time to 0-1 range
    const t = (Math.sin(timeOfDay * Math.PI * 2 - Math.PI / 2) + 1) / 2

    // Sunrise/sunset
    const isTransition = (timeOfDay < 0.25 && timeOfDay > 0.1) ||
      (timeOfDay > 0.75 && timeOfDay < 0.9)

    if (isTransition) {
      // Golden hour - stronger bloom
      this.bloomPass.strength = 1.0
      this.bloomPass.radius = 0.5
      this.bloomPass.threshold = 0.7
    } else if (t > 0.5) {
      // Daytime - subtle bloom
      this.bloomPass.strength = 0.3
      this.bloomPass.radius = 0.3
      this.bloomPass.threshold = 0.9
    } else {
      // Night - moderate bloom for stars/moon
      this.bloomPass.strength = 0.6
      this.bloomPass.radius = 0.4
      this.bloomPass.threshold = 0.8
    }
  }

  // Getters and setters for bloom parameters
  setBloomStrength(strength: number) {
    this.bloomPass.strength = strength
  }

  setBloomRadius(radius: number) {
    this.bloomPass.radius = radius
  }

  setBloomThreshold(threshold: number) {
    this.bloomPass.threshold = threshold
  }

  // Update depth of field with more conservative values
  updateDepthOfField(focus: number, aperture: number, maxblur: number) {
    if (this.bokehPass) {
      this.bokehPass.uniforms["focus"].value = focus;
      this.bokehPass.uniforms["aperture"].value = aperture;
      this.bokehPass.uniforms["maxblur"].value = maxblur;
    }
  }

  // Method to adjust depth of field based on time of day with extremely subtle values
  updateDepthOfFieldForTimeOfDay(timeOfDay: number) {
    // Normalize time to 0-1 range
    const t = (Math.sin(timeOfDay * Math.PI * 2 - Math.PI / 2) + 1) / 2;

    if (t < 0.3 || t > 0.7) {
      // Night and dusk/dawn - very subtle blur
      this.updateDepthOfField(150, 0.0005, 0.003);
    } else {
      // Daytime - almost imperceptible blur
      this.updateDepthOfField(150, 0.0002, 0.001);
    }
  }

  // Add method to switch to orthographic rendering
  switchToOrthographic(orthographicCamera: THREE.OrthographicCamera) {
    this.camera = orthographicCamera;

    // Update render passes with the new camera
    this.renderScene.camera = orthographicCamera;

    // Update bloom composer's render pass
    if (this.bloomComposer.passes[0] instanceof RenderPass) {
      this.bloomComposer.passes[0].camera = orthographicCamera;
    }

    // Update bokeh pass
    if (this.bokehPass) {
      this.bokehPass.camera = orthographicCamera;
    }
  }

  // Add method to set pixel size
  setPixelSize(size: number) {
    this.pixelSize = size;
    if (this.pixelPass && this.pixelPass.uniforms) {
      this.pixelPass.uniforms.pixelSize.value = size;
    }
  }
}
