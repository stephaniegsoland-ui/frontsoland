import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

globalThis.FileReader = class FileReader {
  result = null;
  onload = null;
  onloadend = null;
  onerror = null;

  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    }).catch((error) => this.onerror?.(error));
  }
};

const outputPath = resolve("public/models/avatar-reference.glb");
const scene = new THREE.Scene();

const material = (color, roughness = 0.72, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const skin = material("#d99568", 0.86);
const hair = material("#251b16", 0.68);
const navy = material("#243b5a", 0.72);
const shirt = material("#f2f4f5", 0.8);
const dark = material("#172235", 0.8);
const gold = material("#d4a72c", 0.42, 0.3);
const eye = material("#1f2937", 0.45);

function addMesh(geometry, meshMaterial, position, scale = [1, 1, 1], name) {
  const mesh = new THREE.Mesh(geometry, meshMaterial);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

const sphere = (position, scale, meshMaterial, name) => addMesh(new THREE.SphereGeometry(1, 32, 24), meshMaterial, position, scale, name);
const capsule = (position, scale, meshMaterial, name) => addMesh(new THREE.CapsuleGeometry(1, 1, 16, 24), meshMaterial, position, scale, name);
const box = (position, scale, meshMaterial, name) => addMesh(new THREE.BoxGeometry(1, 1, 1), meshMaterial, position, scale, name);

sphere([0, 3.12, 0], [0.78, 0.88, 0.72], skin, "Body_Head");
sphere([0, 3.62, -0.03], [0.82, 0.46, 0.76], hair, "Hair_Main");
sphere([-0.63, 3.13, -0.03], [0.18, 0.58, 0.2], hair, "Hair_Side_Left");
sphere([0.63, 3.13, -0.03], [0.18, 0.58, 0.2], hair, "Hair_Side_Right");

sphere([-0.28, 3.12, 0.7], [0.085, 0.1, 0.045], eye, "Eyes_Left");
sphere([0.28, 3.12, 0.7], [0.085, 0.1, 0.045], eye, "Eyes_Right");
sphere([0, 2.96, 0.71], [0.055, 0.08, 0.045], skin, "Nose");
sphere([0, 2.8, 0.72], [0.13, 0.045, 0.025], material("#9f1239", 0.5), "Mouth");

for (const x of [-0.28, 0.28]) {
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 10, 32), gold);
  frame.position.set(x, 3.12, 0.76);
  frame.name = x < 0 ? "Glasses_Left" : "Glasses_Right";
  scene.add(frame);
}
box([0, 3.12, 0.76], [0.18, 0.035, 0.03], gold, "Glasses_Bridge");

capsule([0, 2.28, 0], [0.92, 0.9, 0.5], navy, "Jacket");
box([0, 2.36, 0.48], [0.3, 0.86, 0.05], shirt, "Shirt");
box([0, 2.03, 0.54], [0.07, 0.55, 0.04], gold, "Tie");
box([-0.29, 2.38, 0.53], [0.24, 0.84, 0.035], shirt, "Jacket_Lapel_Left");
box([0.29, 2.38, 0.53], [0.24, 0.84, 0.035], shirt, "Jacket_Lapel_Right");

for (const [x, side] of [[-0.82, "Left"], [0.82, "Right"]]) {
  capsule([x, 2.28, 0], [0.2, 0.74, 0.2], navy, `Arm_${side}`);
  sphere([x, 1.48, 0], [0.22, 0.22, 0.22], skin, `Hand_${side}`);
}

for (const [x, side] of [[-0.32, "Left"], [0.32, "Right"]]) {
  capsule([x, 1.2, 0], [0.27, 0.78, 0.27], dark, `Leg_${side}`);
  capsule([x, 0.35, -0.08], [0.34, 0.28, 0.62], dark, `Shoe_${side}`);
}

scene.traverse((object) => {
  if (object.isMesh) object.userData.editablePart = object.name.split("_")[0];
});

await mkdir(dirname(outputPath), { recursive: true });
const exporter = new GLTFExporter();
await new Promise((resolveExport, rejectExport) => {
  exporter.parse(scene, async (result) => {
    try {
      await writeFile(outputPath, Buffer.from(result));
      resolveExport();
    } catch (error) {
      rejectExport(error);
    }
  }, rejectExport, { binary: true });
});
console.log(`Generated ${outputPath}`);
