export const petalVertexShader = /* glsl */ `
  uniform float uTime;
  attribute float aRandom;

  void main() {
    vec3 pos = position;
    float wave = sin(uTime * 1.5 + aRandom * 6.28) * 0.08;
    pos.x += wave;
    pos.z += cos(uTime * 1.2 + aRandom * 6.28) * 0.05;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;
