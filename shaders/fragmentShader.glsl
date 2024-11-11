precision mediump float;

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

// 3D Noise
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

    vec3 col = vec3(0.0);

    // Volumetric rendering in grayscale
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

    col = pow(vol, vec3(1.5));

    col = sqrt(col);

    // Compute the intensity of the grayscale image
    float intensity = dot(col, vec3(0.299, 0.587, 0.114)); // Luminance calculation

    // Map the intensity to the gradient colors
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
