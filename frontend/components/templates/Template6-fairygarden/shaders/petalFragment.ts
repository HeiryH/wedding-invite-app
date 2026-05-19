export const petalFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    // Soft oval shape from UV distance
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.45) discard;
    float alpha = smoothstep(0.45, 0.2, dist) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
