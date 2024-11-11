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

  const [vertexShaderSource, setVertexShaderSource] = useState<string | null>(null);
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
  }, []);

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
