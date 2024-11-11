import React from 'react';

interface ControlPanelProps {
  // Gradient colors
  gradientColors: [string, string, string, string, string, string, string];
  setGradientColors: (colors: [string, string, string, string, string, string, string]) => void;

  // Animation parameters
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  waveAmplitude: number;
  setWaveAmplitude: (amplitude: number) => void;
  noiseScale: number;
  setNoiseScale: (scale: number) => void;

  // Camera controls
  rotationAngle: number;
  setRotationAngle: (angle: number) => void;
  fieldOfView: number;
  setFieldOfView: (fov: number) => void;

  // Color mixing controls
  blendMode: number;
  setBlendMode: (mode: number) => void;
  intensityMultiplier: number;
  setIntensityMultiplier: (value: number) => void;
  contrast: number;
  setContrast: (value: number) => void;
  saturation: number;
  setSaturation: (value: number) => void;

  // Ray marching controls
  rayMarchSteps: number;
  setRayMarchSteps: (steps: number) => void;
  stepSize: number;
  setStepSize: (size: number) => void;

  // Time control
  timeScale: number;
  setTimeScale: (scale: number) => void;

  // Noise controls
  noiseFrequency: number;
  setNoiseFrequency: (frequency: number) => void;
  noiseAmplitude: number;
  setNoiseAmplitude: (amplitude: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  gradientColors,
  setGradientColors,
  animationSpeed,
  setAnimationSpeed,
  waveAmplitude,
  setWaveAmplitude,
  noiseScale,
  setNoiseScale,
  rotationAngle,
  setRotationAngle,
  fieldOfView,
  setFieldOfView,
  blendMode,
  setBlendMode,
  intensityMultiplier,
  setIntensityMultiplier,
  contrast,
  setContrast,
  saturation,
  setSaturation,
  rayMarchSteps,
  setRayMarchSteps,
  stepSize,
  setStepSize,
  timeScale,
  setTimeScale,
  noiseFrequency,
  setNoiseFrequency,
  noiseAmplitude,
  setNoiseAmplitude,
}) => {
  const handleColorChange = (index: number, color: string) => {
    const newColors = [...gradientColors];
    newColors[index] = color;
    setGradientColors(newColors as [string, string, string, string, string, string, string]);
  };

  return (
    <div style={styles.panelContainer}>
      <h2 style={styles.panelTitle}>Control Panel</h2>

      {/* Gradient Colors */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Gradient Colors</h3>
        {gradientColors.map((color, index) => (
          <div key={index} style={styles.colorPickerContainer}>
            <label style={styles.label}>Color {index + 1}:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => handleColorChange(index, e.target.value)}
              style={styles.colorPicker}
            />
          </div>
        ))}
      </div>

      {/* Animation Parameters */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Animation Parameters</h3>
        <Slider label="Animation Speed" value={animationSpeed} min={0.1} max={5} step={0.1} onChange={setAnimationSpeed} />
        <Slider label="Wave Amplitude" value={waveAmplitude} min={0.1} max={5} step={0.1} onChange={setWaveAmplitude} />
        <Slider label="Noise Scale" value={noiseScale} min={0.1} max={5} step={0.1} onChange={setNoiseScale} />
      </div>

      {/* Camera Controls */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Camera Controls</h3>
        <Slider label="Camera Rotation Angle" value={rotationAngle} min={0} max={6.28} step={0.01} onChange={setRotationAngle} isAngle />
        <Slider label="Field of View" value={fieldOfView} min={30} max={90} step={1} onChange={setFieldOfView} />
      </div>

      {/* Color Mixing Controls */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Color Mixing Controls</h3>
        <div style={styles.selectContainer}>
          <label style={styles.label}>Blend Mode:</label>
          <select value={blendMode} onChange={(e) => setBlendMode(parseInt(e.target.value))} style={styles.select}>
            <option value={0}>Normal</option>
            <option value={1}>Additive</option>
            <option value={2}>Multiply</option>
            <option value={3}>Screen</option>
          </select>
        </div>
        <Slider label="Intensity Multiplier" value={intensityMultiplier} min={0} max={5} step={0.1} onChange={setIntensityMultiplier} />
        <Slider label="Contrast" value={contrast} min={0} max={5} step={0.1} onChange={setContrast} />
        <Slider label="Saturation" value={saturation} min={0} max={2} step={0.1} onChange={setSaturation} />
      </div>

      {/* Ray Marching Controls */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Ray Marching Controls</h3>
        <Slider label="Steps" value={rayMarchSteps} min={8} max={128} step={1} onChange={setRayMarchSteps} />
        <Slider label="Step Size" value={stepSize} min={0.1} max={10} step={0.1} onChange={setStepSize} />
      </div>

      {/* Time Control */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Time Control</h3>
        <Slider label="Time Scale" value={timeScale} min={0.1} max={5} step={0.1} onChange={setTimeScale} />
      </div>

      {/* Noise Controls */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Noise Controls</h3>
        <Slider label="Frequency" value={noiseFrequency} min={0.1} max={10} step={0.1} onChange={setNoiseFrequency} />
        <Slider label="Amplitude" value={noiseAmplitude} min={0.1} max={5} step={0.1} onChange={setNoiseAmplitude} />
      </div>
    </div>
  );
};

// Reusable slider component with label
const Slider = ({ label, value, min, max, step, onChange, isAngle = false }: any) => (
  <div style={styles.sliderContainer}>
    <label style={styles.label}>{label}:</label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={styles.slider}
    />
    <span style={styles.value}>{isAngle ? `${(value * 180 / Math.PI).toFixed(1)}°` : value.toFixed(1)}</span>
  </div>
);

// Styling for the control panel and its elements
const styles = {
  panelContainer: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    width: '280px',
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    color: '#fff',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.4)',
    overflowY: 'auto' as const,
    maxHeight: '90vh',
    fontFamily: 'Arial, sans-serif',
  },
  panelTitle: {
    fontSize: '1.3rem',
    marginBottom: '10px',
    color: '#f0f0f0',
  },
  section: {
    marginBottom: '15px',
  },
  sectionTitle: {
    fontSize: '1rem',
    color: '#9e9e9e',
    marginBottom: '5px',
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  label: {
    fontSize: '0.9rem',
    color: '#d0d0d0',
    flex: '1',
  },
  slider: {
    flex: '2',
    marginRight: '8px',
  },
  value: {
    fontSize: '0.9rem',
    color: '#d0d0d0',
  },
  colorPickerContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  colorPicker: {
    marginLeft: '8px',
  },
  selectContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  select: {
    marginLeft: '8px',
    padding: '2px',
    backgroundColor: '#555',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default ControlPanel;
