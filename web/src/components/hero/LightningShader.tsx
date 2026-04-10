"use client";

import React, { useRef, useEffect, useState } from "react";

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_hue;
uniform float u_intensity;
uniform float u_speed;
uniform float u_size;

out vec4 fragColor;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 6; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 centered = (uv - 0.5) * u_size;
  centered.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;

  // Distort UV with FBM for lightning paths
  float distortion = fbm(centered * 3.0 + t * 0.3);
  float distortion2 = fbm(centered * 2.0 - t * 0.2 + 5.0);

  // Multiple lightning bolts from distorted center lines
  float bolt1 = abs(centered.y + distortion * 0.8 - 0.2);
  float bolt2 = abs(centered.x + distortion2 * 0.6 + 0.1);
  float bolt3 = abs(centered.y - centered.x * 0.5 + distortion * 0.5 - distortion2 * 0.3);

  // Sharp falloff for lightning appearance
  float lightning1 = pow(0.02 / (bolt1 + 0.02), 2.5);
  float lightning2 = pow(0.015 / (bolt2 + 0.015), 2.0);
  float lightning3 = pow(0.01 / (bolt3 + 0.01), 2.0);

  float lightning = (lightning1 + lightning2 * 0.6 + lightning3 * 0.4) * u_intensity;

  // Add subtle glow
  float glow = fbm(centered * 1.5 + t * 0.1) * 0.15 * u_intensity;

  // Color: main hue with slight cyan accent
  vec3 mainColor = hsv2rgb(vec3(u_hue, 0.6, 1.0));
  vec3 accentColor = hsv2rgb(vec3(0.5, 0.7, 1.0)); // Cyan accent

  vec3 lightColor = mix(mainColor, accentColor, distortion * 0.4);

  // Background
  vec3 bg = vec3(0.055, 0.055, 0.063);

  vec3 finalColor = bg + lightColor * lightning + lightColor * glow;
  finalColor = clamp(finalColor, 0.0, 1.0);

  fragColor = vec4(finalColor, 1.0);
}
`;

interface LightningShaderProps {
  className?: string;
}

export function LightningShader({ className = "" }: LightningShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Attempt to get WebGL context
    const gl =
      canvas.getContext("webgl2") ||
      (canvas.getContext("webgl") as WebGLRenderingContext | null);

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    glRef.current = gl;

    // Compile shader helper
    function compileShader(
      glCtx: WebGL2RenderingContext | WebGLRenderingContext,
      type: number,
      source: string
    ): WebGLShader | null {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error("Shader compile error:", glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    if (!vertShader || !fragShader) {
      // Fall back to gradient if shaders fail to compile (e.g. no WebGL2)
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglSupported(false);
      return;
    }

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      setWebglSupported(false);
      return;
    }

    programRef.current = program;
    gl.useProgram(program);

    // Full-screen quad geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const uTime = gl.getUniformLocation(program, "u_time");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uHue = gl.getUniformLocation(program, "u_hue");
    const uIntensity = gl.getUniformLocation(program, "u_intensity");
    const uSpeed = gl.getUniformLocation(program, "u_speed");
    const uSize = gl.getUniformLocation(program, "u_size");

    // Set static uniforms
    gl.uniform1f(uHue, 0.75);
    gl.uniform1f(uIntensity, 0.6);
    gl.uniform1f(uSpeed, 1.6);
    gl.uniform1f(uSize, 2.0);

    // Resize handling
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl!.viewport(0, 0, w, h);
        gl!.uniform2f(uResolution, w, h);
      }
    }

    resize();

    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas.parentElement || canvas);

    // Animation loop
    startTimeRef.current = performance.now();

    function render() {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      gl!.uniform1f(uTime, elapsed);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    // Cleanup
    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      if (gl && program) {
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        gl.deleteBuffer(positionBuffer);
        gl.deleteProgram(program);
        const ext = gl.getExtension("WEBGL_lose_context");
        if (ext) ext.loseContext();
      }
      glRef.current = null;
      programRef.current = null;
    };
  }, []);

  // Static gradient fallback when WebGL unavailable
  if (!webglSupported) {
    return (
      <div
        className={className}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse at center, rgba(186, 158, 255, 0.2) 0%, transparent 70%), #0e0e10",
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
