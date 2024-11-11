import React, { useRef, useEffect, useState } from 'react';
import ControlPanel from './ControlPanel';

const KXOAnimasjon: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Gradient colors
  const [gradientColors, setGradientColors] = useState<[string, string, string, string, string, string, string]>([
    '#FEFAF6', '#FFBB8D', '#F99C87', '#C88AB2', '#6F70CC', '#453DE0', '#453DE0'
  ]);

  // Animation parameters
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [waveAmplitude, setWaveAmplitude] = useState(1.0);
  const [noiseScale, setNoiseScale] = useState(1.0);

  // Camera controls
  const [rotationAngle, setRotationAngle] = useState(1.2);
  const [fieldOfView, setFieldOfView] = useState(45.0);

  // Color mixing controls
  const [blendMode, setBlendMode] = useState(0);
  const [intensityMultiplier, setIntensityMultiplier] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [saturation, setSaturation] = useState(1.0);

  // Ray marching controls
  const [rayMarchSteps, setRayMarchSteps] = useState(32);
  const [stepSize, setStepSize] = useState(1.0);

  // Time control
  const [timeScale, setTimeScale] = useState(1.0);

  // Noise controls
  const [noiseFrequency, setNoiseFrequency] = useState(1.0);
  const [noiseAmplitude, setNoiseAmplitude] = useState(1.0);

  /*const [vertexShaderSource, setVertexShaderSource] = useState<string | null>(null);
  const [fragmentShaderSource, setFragmentShaderSource] = useState<string | null>(null);

  // Fetch shaders on component mount
  useEffect(() => {
    fetch('/shaders/vertexShader.glsl')
      .then((response) => response.text())
      .then(setVertexShaderSource)
      .catch((error) => console.error("Failed to load vertex shader", error));

    fetch('/shaders/fragmentShader.glsl')
      .then((response) => response.text())
      .then(setFragmentShaderSource)
      .catch((error) => console.error("Failed to load fragment shader", error));
  }, []);*/

  const vertexShaderSource = `
    attribute vec2 aPosition;

    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

const fragmentShaderSource = `precision mediump float;

uniform float iTime;
uniform vec2 iResolution;

uniform vec3 uGradientColors[7];

// Animation parameters
uniform float uAnimationSpeed;
uniform float uWaveAmplitude;
uniform float uNoiseScale;

// Camera uniforms
uniform float uRotationAngle;
uniform float uFieldOfView;

// Color mixing uniforms
uniform int uBlendMode;
uniform float uIntensityMultiplier;
uniform float uContrast;
uniform float uSaturation;
uniform vec3 uSkyColor;

// Ray marching uniforms
uniform int uRayMarchSteps;
uniform float uStepSize;

// Time control
uniform float uTimeScale;

// Noise controls
uniform float uNoiseFrequency;
uniform float uNoiseAmplitude;

const int MAX_LOOP_STEPS = 128;

// Helper Functions
float quintic(float x) {
  return x * x * x * (6.0 * x * x - 15.0 * x + 10.0);
}

const float fac = 43758.5453123;

float hash(float p) {
    return fract(fac * sin(p));
}

float noise(in vec3 p) {
    p *= uNoiseScale * uNoiseFrequency;
    vec3 i = floor(p);
    vec3 f = fract(p);
    
    float n000 = hash(dot((i + vec3(0.0)), vec3(1.0, 57.0, 113.0)));
    float n001 = hash(dot((i + vec3(1.0, 0.0, 0.0)), vec3(1.0, 57.0, 113.0)));
    float n010 = hash(dot((i + vec3(0.0, 1.0, 0.0)), vec3(1.0, 57.0, 113.0)));
    float n011 = hash(dot((i + vec3(1.0, 1.0, 0.0)), vec3(1.0, 57.0, 113.0)));
    float n100 = hash(dot((i + vec3(0.0, 0.0, 1.0)), vec3(1.0, 57.0, 113.0)));
    float n101 = hash(dot((i + vec3(1.0, 0.0, 1.0)), vec3(1.0, 57.0, 113.0)));
    float n110 = hash(dot((i + vec3(0.0, 1.0, 1.0)), vec3(1.0, 57.0, 113.0)));
    float n111 = hash(dot((i + vec3(1.0, 1.0, 1.0)), vec3(1.0, 57.0, 113.0)));

    vec3 fade_xyz = vec3(quintic(f.x), quintic(f.y), quintic(f.z));
    return mix(mix(mix(n000, n001, fade_xyz.x), mix(n010, n011, fade_xyz.x), fade_xyz.y),
               mix(mix(n100, n101, fade_xyz.x), mix(n110, n111, fade_xyz.x), fade_xyz.y), fade_xyz.z);
}

// 2D Noise
float noise(in vec2 p) {
    p *= uNoiseScale * uNoiseFrequency;
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    float n00 = hash(dot((i + vec2(0.0)), vec2(1.0, 57.0)));
    float n01 = hash(dot((i + vec2(1.0, 0.0)), vec2(1.0, 57.0)));
    float n10 = hash(dot((i + vec2(0.0, 1.0)), vec2(1.0, 57.0)));
    float n11 = hash(dot((i + vec2(1.0, 1.0)), vec2(1.0, 57.0)));

    vec2 fade_xy = vec2(quintic(f.x), quintic(f.y));
    return mix(mix(n00, n01, fade_xy.x), mix(n10, n11, fade_xy.x), fade_xy.y);
}

// Ocean Function
float ocean(vec2 p) {
    float f = 0.0;
    float speed = uAnimationSpeed;
    float time = iTime * uTimeScale;

    vec2 v01 = vec2(1.0, 0.0) * time * speed;
    vec2 v02 = vec2(0.0, 1.0) * time * speed;
    vec2 v03 = vec2(1.0, 1.0) * time * speed;

    f += 0.50000 * noise(p * 1.0 + v01);
    f += 0.25000 * noise(p * 2.1 + v02);
    f += 0.12500 * noise(p * 3.9 + v03);

    f = (3.0 - 2.0 * f) * f * f;
    return f;
}

float map(in vec3 p) {
    float o = ocean(p.xz * 0.08 * uNoiseScale) * 3.0 * uWaveAmplitude;
    return p.y + 0.5 + o;
}

// Shadow Calculation
float calcShadow(in vec3 ro, in vec3 rd, float tmax) {
    float r = 1.0;
    float t = 0.0;
    for(int i = 0; i < 16; i++) {
        float h = map(ro + t * rd);
        r = min(r, tmax * h / t);
        if (r < 0.01) break;
        if (t > tmax) break;
        t += h;
    }
    return clamp(r, 0.0, 1.0);
}

// Aurora Gradient Color Interpolation
vec3 gradient(float t) {
    if (t < 1.0 / 6.0) {
        return mix(uGradientColors[0], uGradientColors[1], t * 6.0);
    } else if (t < 2.0 / 6.0) {
        return mix(uGradientColors[1], uGradientColors[2], (t - 1.0 / 6.0) * 6.0);
    } else if (t < 3.0 / 6.0) {
        return mix(uGradientColors[2], uGradientColors[3], (t - 2.0 / 6.0) * 6.0);
    } else if (t < 4.0 / 6.0) {
        return mix(uGradientColors[3], uGradientColors[4], (t - 3.0 / 6.0) * 6.0);
    } else if (t < 5.0 / 6.0) {
        return mix(uGradientColors[4], uGradientColors[5], (t - 4.0 / 6.0) * 6.0);
    } else {
        return mix(uGradientColors[5], uGradientColors[6], (t - 5.0 / 6.0) * 6.0);
    }
}

// Blend Modes Function
vec3 blendColors(vec3 baseColor, vec3 auroraColor, int blendMode) {
    if (blendMode == 0) {
        // Normal
        return auroraColor;
    } else if (blendMode == 1) {
        // Additive
        return baseColor + auroraColor;
    } else if (blendMode == 2) {
        // Multiply
        return baseColor * auroraColor;
    } else if (blendMode == 3) {
        // Screen
        return 1.0 - (1.0 - baseColor) * (1.0 - auroraColor);
    } else {
        // Default to normal
        return auroraColor;
    }
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

    // Camera setup
    vec3 ro = vec3(0.0, 0.0, 0.0);
    vec3 ta = vec3(0.0, 0.0, 1000.0);
    float an = uRotationAngle;
    vec3 up = normalize(vec3(cos(an), 1.0, sin(an)));
    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(ww, up));
    vec3 vv = normalize(cross(uu, ww));

    // Field of view adjustment
    float fov = radians(uFieldOfView);
    float aspectRatio = iResolution.x / iResolution.y;
    vec2 viewport = vec2(tan(fov * 0.5) * aspectRatio, tan(fov * 0.5));

    // Adjust ray direction based on field of view
    vec3 rd = normalize(p.x * viewport.x * uu + p.y * viewport.y * vv + ww);

    // Ray marching parameters
    int maxSteps = uRayMarchSteps;
    float dh = uStepSize;
    float tmax = 300.0;

    vec3 col = vec3(0.0); // Start with a black background

    // Volumetric aurora rendering in grayscale
    vec3 vol = vec3(0.0);
    float den = 0.0;
    float h = noise(fragCoord + p);
    rd.y = -rd.y;
    rd.xz = rd.xz * mat2(0.8, -0.6, 0.6, 0.8);

    for (int i = 0; i < MAX_LOOP_STEPS; i++) {
        if (i >= uRayMarchSteps) break;
        vec3 pos = ro + h * rd;
        vec3 dir = normalize(vec3(-0.2, 0.15, -0.8) - pos);
        float shadow = calcShadow(pos, dir, length(dir));
        vec3 l = vec3(1.0) * shadow;

        float d = noise(pos + 2.0 * vec3(iTime * uTimeScale, -iTime * uTimeScale, -iTime * uTimeScale));
        d *= exp(-0.85 * pos.y);
        d *= uNoiseAmplitude;
        den += d * 0.001;
        vol += l * den;

        if (den > 1.0) break;
        h += dh;
    }

    // Apply tone mapping to prevent overexposure
    col = pow(vol, vec3(1.5));

    // Apply gamma correction
    col = sqrt(col);

    // Compute the intensity of the grayscale aurora
    float intensity = dot(col, vec3(0.299, 0.587, 0.114)); // Luminance calculation

    // Map the intensity to the aurora gradient colors
    vec3 finalColor = gradient(intensity);

    // Adjust intensity
    vec3 adjustedColor = finalColor * uIntensityMultiplier;

    // Adjust contrast
    adjustedColor = ((adjustedColor - 0.5) * max(uContrast, 0.0)) + 0.5;

    // Adjust saturation
    float luminance = dot(adjustedColor, vec3(0.299, 0.587, 0.114));
    vec3 gray = vec3(luminance);
    adjustedColor = mix(gray, adjustedColor, uSaturation);

    // Blend with background color
    vec3 blendedColor = blendColors(uSkyColor, adjustedColor, uBlendMode);
    blendedColor = clamp(blendedColor, 0.0, 1.0);

    gl_FragColor = vec4(blendedColor, 1.0);
}
`;

  // Initialize and render WebGL
  useEffect(() => {
    if (!vertexShaderSource || !fragmentShaderSource) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Resize canvas and setup viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth - 250; // account for control panel width
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Compile shaders
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile failed with: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    // Link program
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program failed to link: ' + gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Set up geometry (full-screen quad)
    const positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const iTimeLocation = gl.getUniformLocation(program, 'iTime');
    const uGradientColorsLocation = gl.getUniformLocation(program, 'uGradientColors');
    const uAnimationSpeedLocation = gl.getUniformLocation(program, 'uAnimationSpeed');
    const uWaveAmplitudeLocation = gl.getUniformLocation(program, 'uWaveAmplitude');
    const uNoiseScaleLocation = gl.getUniformLocation(program, 'uNoiseScale');

    // Camera uniforms
    const uRotationAngleLocation = gl.getUniformLocation(program, 'uRotationAngle');
    const uFieldOfViewLocation = gl.getUniformLocation(program, 'uFieldOfView');

    // Color mixing uniforms
    const uBlendModeLocation = gl.getUniformLocation(program, 'uBlendMode');
    const uIntensityMultiplierLocation = gl.getUniformLocation(program, 'uIntensityMultiplier');
    const uContrastLocation = gl.getUniformLocation(program, 'uContrast');
    const uSaturationLocation = gl.getUniformLocation(program, 'uSaturation');
    const uSkyColorLocation = gl.getUniformLocation(program, 'uSkyColor');

    // Ray marching uniforms
    const uRayMarchStepsLocation = gl.getUniformLocation(program, 'uRayMarchSteps');
    const uStepSizeLocation = gl.getUniformLocation(program, 'uStepSize');

    // Time control uniform
    const uTimeScaleLocation = gl.getUniformLocation(program, 'uTimeScale');

    // Noise controls uniforms
    const uNoiseFrequencyLocation = gl.getUniformLocation(program, 'uNoiseFrequency');
    const uNoiseAmplitudeLocation = gl.getUniformLocation(program, 'uNoiseAmplitude');

    // Convert hex color to RGB array
    const parseColor = (hexColor: string) => {
      const bigint = parseInt(hexColor.slice(1), 16);
      return [
        ((bigint >> 16) & 255) / 255,
        ((bigint >> 8) & 255) / 255,
        (bigint & 255) / 255,
      ];
    };

    // Animation loop
    let animationFrameId: number;
    const startTime = performance.now();

    const render = () => {
      const currentTime = (performance.now() - startTime) / 1000;

      // Set uniforms
      gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(iTimeLocation, currentTime);

      // Set adjustable uniforms
      // Gradient Colors
      const gradientColorValues = gradientColors.flatMap(parseColor);
      gl.uniform3fv(uGradientColorsLocation, gradientColorValues);

      // Animation parameters
      gl.uniform1f(uAnimationSpeedLocation, animationSpeed);
      gl.uniform1f(uWaveAmplitudeLocation, waveAmplitude);
      gl.uniform1f(uNoiseScaleLocation, noiseScale);

      // Camera uniforms
      gl.uniform1f(uRotationAngleLocation, rotationAngle);
      gl.uniform1f(uFieldOfViewLocation, fieldOfView);

      // Color mixing uniforms
      gl.uniform1i(uBlendModeLocation, blendMode);
      gl.uniform1f(uIntensityMultiplierLocation, intensityMultiplier);
      gl.uniform1f(uContrastLocation, contrast);
      gl.uniform1f(uSaturationLocation, saturation);
      // Set sky color (black in this case)
      gl.uniform3f(uSkyColorLocation, 0.0, 0.0, 0.0);

      // Ray marching uniforms
      gl.uniform1i(uRayMarchStepsLocation, rayMarchSteps);
      gl.uniform1f(uStepSizeLocation, stepSize);

      // Time control
      gl.uniform1f(uTimeScaleLocation, timeScale);

      // Noise controls
      gl.uniform1f(uNoiseFrequencyLocation, noiseFrequency);
      gl.uniform1f(uNoiseAmplitudeLocation, noiseAmplitude);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Request next frame
      animationFrameId = requestAnimationFrame(render);
    };

    // Start rendering
    animationFrameId = requestAnimationFrame(render);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [
    vertexShaderSource,
    fragmentShaderSource,
    gradientColors,
    animationSpeed,
    waveAmplitude,
    noiseScale,
    rotationAngle,
    fieldOfView,
    blendMode,
    intensityMultiplier,
    contrast,
    saturation,
    rayMarchSteps,
    stepSize,
    timeScale,
    noiseFrequency,
    noiseAmplitude,
  ]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      <ControlPanel
        gradientColors={gradientColors}
        setGradientColors={setGradientColors}
        animationSpeed={animationSpeed}
        setAnimationSpeed={setAnimationSpeed}
        waveAmplitude={waveAmplitude}
        setWaveAmplitude={setWaveAmplitude}
        noiseScale={noiseScale}
        setNoiseScale={setNoiseScale}
        rotationAngle={rotationAngle}
        setRotationAngle={setRotationAngle}
        fieldOfView={fieldOfView}
        setFieldOfView={setFieldOfView}
        blendMode={blendMode}
        setBlendMode={setBlendMode}
        intensityMultiplier={intensityMultiplier}
        setIntensityMultiplier={setIntensityMultiplier}
        contrast={contrast}
        setContrast={setContrast}
        saturation={saturation}
        setSaturation={setSaturation}
        rayMarchSteps={rayMarchSteps}
        setRayMarchSteps={setRayMarchSteps}
        stepSize={stepSize}
        setStepSize={setStepSize}
        timeScale={timeScale}
        setTimeScale={setTimeScale}
        noiseFrequency={noiseFrequency}
        setNoiseFrequency={setNoiseFrequency}
        noiseAmplitude={noiseAmplitude}
        setNoiseAmplitude={setNoiseAmplitude}
      />
    </div>
  );  
};

export default KXOAnimasjon;
