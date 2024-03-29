import {useState, useRef, useMemo} from "react";
import {createRoot} from "react-dom/client";
import {Canvas, extend, useFrame} from "@react-three/fiber";
import {Edges, OrbitControls, Line} from "@react-three/drei";
import * as THREE from "three";
import {gsap} from "gsap";
// import geodesicPolyhedron from "./geodesicPolyhedron";
// extend({ geodesicPolyhedron });
import "./App.css";
import {
  IcosahedronGeometry,
  MeshBasicMaterial,
  Mesh,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
  ShaderMaterial,
} from "three";
import {AxesHelper} from "three";

const App = () => {
  const meshRef = useRef();
  const edgesRef = useRef();
  const boxRef = useRef();

  const circleRef = useRef();

  const [coordinates, setCoordinates] = useState([
    // [-1.09, 1.4, 0.53],
    // [-1.07, 1.07, 1.07],
    // [-1.43, 0.53, 1.09],
  ]);

  const [vectorView, setVectorView] = useState({
    start: [0, 0, 0],
    vector: [1, 1, 0],
  });

  const [incIdx, setIncIdx] = useState(0);

  const meshRef2 = useRef();
  const edgesRef2 = useRef();

  const clock = new THREE.Clock();

  const [time, setTime] = useState(0);

  const [testVal, setTestVal] = useState([0.0, 0.0, 0.0, 0.0, 0.0]);

  const GeodesicPolyhedron = ({
    radius,
    detail,
    color,
    rotationSpeed,
    wireframe,
    meshRef,
    edgesRef,
    materialIdx,
  }) => {
    useFrame(() => {
      // Rotate the polyhedron for animation
      // meshRef.current.rotation.x += rotationSpeed;
      // meshRef.current.rotation.y += rotationSpeed;
      // edgesRef.current.rotation.x += rotationSpeed;
      // edgesRef.current.rotation.y += rotationSpeed;
      const time = clock.getElapsedTime();
      meshRef.current.material[1].uniforms.uTime.value = time;
      // meshRef.current.material[2].uniforms.uTime.value = time;
      // edgesRef.current.material.uniforms.uTime.value = time;
      // meshRef.current.material[3].uniforms.uTime.value = time;
      // meshRef.current.material[4].uniforms.uTime.value = time;
      // meshRef.current.material[5].uniforms.uTime.value = time;
      // meshRef.current.material[6].uniforms.uTime.value = time;
      // meshRef.current.material[7].uniforms.uTime.value = time;
      calculateTiming(time, meshRef, materialIdx);
    });

    const icosahedronGeometry = new IcosahedronGeometry(radius, detail);

    const position = icosahedronGeometry.getAttribute("position");
    const materials = [];
    for (let i = 0; i < position.count; i++) {
      if (i % 3 == 0) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);

        const plainMaterial = new MeshBasicMaterial({
          color: "yellow",
          side: THREE.DoubleSide,
          wireframe: true,
        });

        const animateMaterial = new ShaderMaterial({
          vertexShader: `
          uniform float uTime;
          uniform float idx;
          uniform vec3 avg;

          varying vec3 vPosition;
          varying vec3 vNormal;

          vec3 getRotatePos(vec3 pos, vec3 axis, float angle) {
            mat3 cMatrix = mat3(
              vec3(0, -axis.z, axis.y),
              vec3(axis.z, 0, -axis.x),
              vec3(-axis.y, axis.x, 0)
            );
            mat3 identityMatrix = mat3(
              vec3(1, 0, 0),
              vec3(0, 1, 0),
              vec3(0, 0, 1)
            );
  
            mat3 rotatePos = mat3(1.0) + (sin(angle) * cMatrix) + ((1.0 - cos(angle)) * (cMatrix * cMatrix));
            vec3 newPos = rotatePos * pos;
            return newPos;
          }

          
          void main () {
            vPosition = position;
            vNormal = normal;
            float shrinkFactor = sin(uTime / 2.0) + 1.025;
            float testFactor = cos(uTime) + 1.025;
        // Rotate ***
            vec3 axis = vec3(1.0, 1.0, 1.0);
            vec3 rotatePos = getRotatePos(position, axis, uTime);
            vec3 newPos = vec3(mix(avg.x, rotatePos.x, min(1.0, shrinkFactor)), mix(avg.y, rotatePos.y, min(1.0, shrinkFactor)), mix(avg.z, rotatePos.z, min(1.0, shrinkFactor)));
    // *********************************************
        // This scales the face to the avg position
            vec3 scaledPosition = vec3(mix(position.x, avg.x, min(1.0, shrinkFactor)), mix(position.y, avg.y, min(1.0, shrinkFactor)), mix(position.z, avg.z, min(1.0, shrinkFactor)));
        // This multipication scales the face outside of the original position
            scaledPosition = scaledPosition * max(1.0, testFactor);
            // vec4 mvPosition = modelViewMatrix * vec4(vPosition, 1.0);
            vec4 mvPosition = modelViewMatrix * vec4(scaledPosition + newPos, 1.0);
            // if(avg.x > 1.0) {
            //   mvPosition = modelViewMatrix * vec4(scaledPosition + newPos, 1.0);
            // }
            gl_Position = projectionMatrix * mvPosition;
          }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            uniform float uTime;
            uniform vec3 avg;
            void main() {
              float r = abs(vNormal.x);
              float g = abs(vNormal.y);
              float b = abs(vNormal.z);
              gl_FragColor = vec4(r, g, b, 1.0);
              // gl_FragColor = vec4(0.5, 0.5, 0.0, 0.8);

            }
          `,
          side: THREE.DoubleSide,
          uniforms: {
            uTime: {value: 1.0},
            avg: {value: {x: 0, y: 0, z: 0}},
          },
          wireframe: true,
        });

        const newMaterial3 = new ShaderMaterial({
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
              vNormal = normal;
              vPosition = position;
              float scale = 1.5;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position * scale, 1.0);
            }
          `,
          fragmentShader: `
          // Red
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float uTime;

            void main() {
              gl_FragColor = vec4(1.0, 0.0, 0.0, smoothstep(0.0, 1.0, sin((uTime + vPosition.y) / 0.25)));
            }
          `,
          side: THREE.DoubleSide,
          uniforms: {
            uTime: {value: 1.0},
            avg: {value: {x: 0.0, y: 0.0, z: 0.0}},
          },
          transparent: true,
          depthWrite: false,
          // wireframe: true,
        });

        icosahedronGeometry.addGroup(i, 3, materialIdx);
        if (materialIdx != 1) {
          materials.push(animateMaterial);
        }

        const shrinkMaterial = new ShaderMaterial({
          vertexShader: `
            varying vec3 vNormal;
            uniform float uTime;
            uniform float idx;
            uniform vec3 avg;
            varying vec3 vPosition;
            varying vec2 vUv;
            void main () {
              vUv = uv;
              vPosition = position;
              vNormal = normal;
              float shrinkFactor = 0.25 * sin(uTime) + 1.025;
              // float shrinkFactor = 0.75 * cos(3.0 * uTime) + 0.75;
              
              // vec3 scaledPosition = (position);
              // vec3 scaledPosition = vec3(mix(position.x, avg.x, max(0.0005, shrinkFactor)), mix(position.y, avg.y, max(0.0005, shrinkFactor)), mix(position.z, avg.z, max(.0005, shrinkFactor)));
              vec3 scaledPosition = vec3(mix(position.x, avg.x, min(1.0, shrinkFactor)), mix(position.y, avg.y, min(1.0, shrinkFactor)), mix(position.z, avg.z, min(1.0, shrinkFactor)));


              // scaledPosition += avg;
              // scaledPosition += avg / sin(uTime);
              vec4 mvPosition = modelViewMatrix * vec4(scaledPosition, 1.0);
              gl_Position = projectionMatrix * mvPosition;

              // vec3 scaledPos = vec3(position.x * shrinkFactor, position.y, position.z * shrinkFactor);
              // vec4 mvPosition = modelViewMatrix * vec4(scaledPos, 1.0);
              // gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
          // Shrink
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            uniform float uTime;
            uniform float test;
    
            void main () {
              float r = abs(vNormal.x);
              float g = abs(vNormal.y);
              float b = abs(vNormal.z);
              // gl_FragColor = vec4(r, g, b, smoothstep(0.0, 1.0, 0.15 * sin((uTime + vPosition.y) / 0.75) + 1.15));
              gl_FragColor = vec4(0.0, g, 0.0, test);
            }
          `,
          side: THREE.DoubleSide,
          uniforms: {
            uTime: {value: 1.0},
            test: {value: 0.0},
            avg: {value: {x: 0.0, y: 0.0, z: 0.0}},
          },
          wireframe: wireframe,
          transparent: true,
          depthWrite: false,
        });

        const rotandshrinktestMaterial = new ShaderMaterial({
          vertexShader: `
            varying vec3 vNormal;
            uniform float uTime;
            // uniform float idx;
            uniform vec3 avg;
            varying vec3 vPosition;
    
            vec3 getRotatePos(vec3 pos, vec3 axis, float angle) {
              mat3 cMatrix = mat3(
                vec3(0, -axis.z, axis.y),
                vec3(axis.z, 0, -axis.x),
                vec3(-axis.y, axis.x, 0)
              );
              mat3 identityMatrix = mat3(
                vec3(1, 0, 0),
                vec3(0, 1, 0),
                vec3(0, 0, 1)
              );
    
              mat3 rotatePos = mat3(1.0) + (sin(angle) * cMatrix) + ((1.0 - cos(angle)) * (cMatrix * cMatrix));
              vec3 newPos = rotatePos * pos;
              return newPos;
            }
    
            void main () {
              vPosition = position;
              vNormal = normal;
              vec3 axis = vec3(0.0, 1.0, 0.0);
              vec3 test = vec3(1.0, 1.0, 0.0);
              float degree = (uTime / 1000.0) * 360.0;
              vec3 rotatePos = getRotatePos(position, axis, degree);
              float shrinkFactor = 0.25 * sin(uTime) + 1.025;
              vec3 scaledPos = vec3(mix(position.x, avg.x, min(1.0, shrinkFactor)), mix(position.y, avg.y, min(1.0, shrinkFactor)), mix(position.z, avg.z, min(1.0, shrinkFactor)));
              vec3 newPos = vec3(mix(scaledPos.x, rotatePos.x, min(1.0, shrinkFactor)), mix(scaledPos.y, rotatePos.y, min(1.0, shrinkFactor)), mix(scaledPos.z, rotatePos.z, min(1.0, shrinkFactor)));
              vec4 mvPosition = modelViewMatrix * vec4(vPosition, 1.0);
              // vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
              if(vPosition.y > 0.0) {
                mvPosition = modelViewMatrix * vec4(scaledPos, 1.0);
              }
              gl_Position = projectionMatrix * mvPosition;
          }
          `,
          fragmentShader: `
          void main () {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
          }
          `,
          uniforms: {
            uTime: {value: 1.0},
            avg: {value: {x: 0.0, y: 0.0, z: 0.0}},
          },
          side: THREE.DoubleSide,
          wireframe: true,
        });

        if (materialIdx == 1) {
          materials.push(shrinkMaterial);
          // materials.push(rotandshrinktestMaterial);
        }

        icosahedronGeometry.needsUpdate = true;
      }
    }

    const edgesGeometry = new EdgesGeometry(icosahedronGeometry);
    const edgesMaterial = new LineBasicMaterial({color: 0x000000});
    const newEdgesMaterial = new ShaderMaterial({
      vertexShader: `
      varying vec3 vNormal;
      uniform float uTime;
      uniform float idx;
      uniform vec3 avg;
      varying vec3 vPosition;
      void main () {
        vPosition = position;
        vNormal = normal;
        float shrinkFactor = 0.25 * sin(uTime) + 1.025;
        
        vec3 scaledPosition = (position + avg / 10.0) * shrinkFactor;
        // scaledPosition += avg;
        vec4 mvPosition = modelViewMatrix * vec4(scaledPosition, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
      fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;

      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
      `,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: {value: 1.0},
        avg: {value: {x: 0.0, y: 0.0, z: 0.0}},
        test: {value: 1.0},
      },
      transparent: true,
      depthWrite: false,
    });
    const edgesMesh = new LineSegments(edgesGeometry, newEdgesMaterial);

    // edgesMesh.material = materials;
    const edgesPos = edgesGeometry.getAttribute("position").count;
    for (let k = 0; k < edgesPos; k++) {
      if (k % 3 == 0) {
        edgesGeometry.addGroup(k, 3, materialIdx);
      }
    }
    const edgesMaterials = [];
    for (let j = 0; j < edgesGeometry.groups.length; j++) {
      edgesMaterials.push(newEdgesMaterial);
    }
    edgesMesh.material = edgesMaterials;
    edgesGeometry.needsUpdate = true;

    const icosahedronGeometryMesh = new Mesh(icosahedronGeometry, materials);

    return (
      <group>
        <primitive object={icosahedronGeometryMesh} ref={meshRef} />
        {/* <primitive object={edgesMesh} ref={edgesRef} /> */}
      </group>
    );
  };

  const removeFaces = () => {
    const geometry = meshRef.current.geometry;
    const position = geometry.getAttribute("position");
    const color = geometry.getAttribute("color");
    // for (let i = 0; i < color.count; i++) {
    //   let opacity = 1;
    //   let colors = [1, 1, 1, 1];
    //   geometry.setAttribute(
    //     "color",
    //     new BufferAttribute(new Float32Array(colors), 4)
    //   );
    //   const icosahedronMaterial = meshRef.current.material;
    //   icosahedronMaterial.needsUpdate = true;
    // }

    // const edges = edgesRef.current;
    // edges.material.transparent = true;
    // edges.material.opacity = 0;
    // edges.material.needsUpdate = true;

    let i = 0;
    const removeFaceWithDelay = () => {
      console.log("delay");
      if (i < color.count / 4) {
        console.log(i);
        let opacity = 0;
        let colors = [1, 1, 1, opacity];
        const colorAttribute = geometry.getAttribute("color");
        const xColor = colorAttribute.getX(i);
        const yColor = colorAttribute.getY(i);
        const zColor = colorAttribute.getZ(i);
        colorAttribute.setXYZW(i, xColor, yColor, zColor, opacity);
        colorAttribute.needsUpdate = true;
        i++;

        setTimeout(removeFaceWithDelay, 5);
      } else {
        const edges = edgesRef.current;
        edges.material.transparent = true;
        edges.material.opacity = 0;
        edges.material.needsUpdate = true;
      }
    };
    removeFaceWithDelay();
  };

  const group = () => {
    const geometry = meshRef.current;
    const position = geometry.geometry.getAttribute("position");
    const materials = [];
    for (let i = 0; i < position.count; i++) {
      if (i % 3 === 0) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);
        // console.log(i, x, y, z);
        const newMaterial = new MeshBasicMaterial({
          wireframe: false,
          color: "yellow",
          side: THREE.DoubleSide,
        });

        // const newMaterial2 = new MeshBasicMaterial({
        //   wireframe: false,
        //   color: "red",
        //   side: THREE.DoubleSide,
        // });
        const newMaterial2 = new ShaderMaterial({
          vertexShader: `
            varying vec3 vNormal;
            uniform float uTime;
            varying vec3 vPosition;
            void main () {
              vPosition = position;
              vec3 newPos = position;
              newPos.xyz += sin(uTime);
              vNormal = normal;
              float scaleFactor = uTime;
              vec4 scaledPos = modelViewMatrix * vec4(newPos, 1.0);
              // vec4 scaledPos = modelViewMatrix * vec4(position * scaleFactor, 1.0);
              // scaledPos.xyz *= scaleFactor;
              // gl_Position = projectionMatrix * scaledPos;
            }
          `,
          fragmentShader: `
          // Red
          varying vec3 vNormal;

          void main () {
            float r = abs(vNormal.x);
            float g = abs(vNormal.y);
            float b = abs(vNormal.z);
            gl_FragColor = vec4(r, g, b, 1.0);
          }
        `,
          side: THREE.DoubleSide,
          uniforms: {
            uTime: {value: 1.2},
          },
        });

        if (i == 0) {
          geometry.geometry.addGroup(i, 3, 1);
        } else {
          geometry.geometry.addGroup(i, 3, 0);
        }
        materials.push(newMaterial);
        materials.push(newMaterial2);
        geometry.material = materials;
        geometry.needsUpdate = true;
      }
    }
  };

  const getTime = () => {
    const time = clock.getElapsedTime();
    return time;
  };

  const shrinkFaces = (amount) => {
    const geometry = meshRef.current.geometry;
    const position = geometry.getAttribute("position");
    console.log(position);
    for (let i = 0; i < position.count; i += 9) {
      const centerX = (position[i] + position[i + 3] + position[i + 6]) / 3;
      const centerY = (position[i + 1] + position[i + 4] + position[i + 7]) / 3;
      const centerZ = (position[i + 2] + position[i + 5] + position[i + 8]) / 3;

      for (let j = 0; j < 9; j += 3) {
        position[i + j] = centerX + (position[i + j] - centerX) * amount;
        position[i + j + 1] =
          centerY + (position[i + j + 1] - centerY) * amount;
        position[i + j + 2] =
          centerZ + (position[i + j + 2] - centerZ) * amount;
      }
    }
    position.needsUpdate = true;
  };

  const test = async () => {
    console.log(meshRef.current);
    console.log(meshRef.current.geometry);
    const pos = meshRef.current.geometry.getAttribute("position");
    const maxPos = Math.max(...pos.array);
    console.log(maxPos);
    console.log(testVal);
    const shape = await getGroupVertexCoords(
      meshRef.current.geometry.groups[4]
    );
    console.log(shape);
    const avg = await getAvgCoords(meshRef.current.geometry.groups[4]);
    console.log(avg);
    const weight = 0.75 * Math.cos(2.0 * clock.getElapsedTime()) + 0.25;
    mixFunc(shape[0][0], avg.x, weight);

    console.log(meshRef2.current);
  };

  const changePosition = () => {
    const geometry = meshRef.current.geometry;
    const position = geometry.getAttribute("position");
    for (let i = 0; i < 3; i++) {
      const xPos = position.getX(i);
      const yPos = position.getY(i);
      const zPos = position.getZ(i);
      console.log("X: ", xPos);
      console.log("Y: ", yPos);
      console.log("Z: ", zPos);
      position.setX(i, xPos * 1.25);
      position.setY(i, yPos * 1.25);
      position.setZ(i, zPos * 1.25);
      position.needsUpdate = true;

      // *** Animation Test ***
      // const oldTriangle = new THREE.Vector3(xPos, yPos, zPos);
      // const newTriangle = new THREE.Vector3(
      //   xPos * 1.25,
      //   yPos * 1.25,
      //   zPos * 1.25
      // );
      // const KeyFrame = new THREE.VectorKeyframeTrack(
      //   ".array",
      //   [0, 1],
      //   [oldTriangle, newTriangle]
      // );
      // // position.setXYZ(i, xPos * 1.25, yPos * 1.25, zPos * 1.25);
      // const clip = new THREE.AnimationClip("Move1", 1, [KeyFrame]);
      // const mixer = new THREE.AnimationMixer(position);
      // const action = mixer.clipAction(clip);
      // action.play();
      // const updateAmount = 0.01;
      // mixer.update(updateAmount);
      // position.needsUpdate = true;
      // console.log("update");
      // console.log("X After: ", xPos);
      // console.log("Y After: ", yPos);
      // console.log("Z After: ", zPos);
    }
  };

  const animationTest = () => {
    const mesh = meshRef.current;
    const geometry = mesh.geometry;
    const position = geometry.getAttribute("position");
    const groups = geometry.groups;
    for (let i = 0; i < groups.length; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      // console.log(geometry.groups);
      const currGroup = geometry.groups[i];
      // if (i == 0) {
      //   console.log(currGroup);
      //   const xPos = position.getX(currGroup.start);
      //   const yPos = position.getY(currGroup.start);
      //   const zPos = position.getZ(currGroup.start);
      //   console.log(xPos, yPos, zPos);
      // }
      // mesh.material.push(numberMaterial);
      if (currGroup != undefined && z > 0) {
        // currGroup.materialIndex = 0;
        console.log(currGroup);
        const currGroupStart = currGroup.start;
        let triangle = [];
        let tempAvg = {xAvg: 0, yAvg: 0, zAvg: 0};
        let avgArr = [];
        for (let j = 0; j < 3; j++) {
          const xPos = position.getX(currGroupStart + j);
          const yPos = position.getY(currGroupStart + j);
          const zPos = position.getZ(currGroupStart + j);
          tempAvg.xAvg += xPos;
          tempAvg.yAvg += yPos;
          tempAvg.zAvg += zPos;
          triangle.push(new THREE.Vector3(xPos, yPos, zPos));
          if (j == 2) {
            const coordAvg = {
              x: tempAvg.xAvg / 3,
              y: tempAvg.yAvg / 3,
              z: tempAvg.zAvg / 3,
            };
            avgArr.push(coordAvg);
          }
        }
        console.log(triangle);
        // const zAvg = (triangle[0].z + triangle[1].z + triangle[2].z) / 3;
        // console.log(zAvg);
        console.log(avgArr);
      }
    }
  };

  const highlightFace = async (startIndexes) => {
    const mesh = meshRef.current;
    const geometry = mesh.geometry;
    const groups = geometry.groups;
    let coordsStorage = [];
    for (let i = 0; i < startIndexes.length; i++) {
      console.log(startIndexes[i]);
      const groupIndex = startIndexes[i] / 3;
      const currGroup = groups[groupIndex];
      console.log(currGroup);
      if (currGroup != undefined) {
        currGroup.materialIndex = 0;
        geometry.needsUpdate = true;
      }
      const averages = await getAvgCoords(currGroup);
      console.log("Average coords:", averages);
      coordsStorage.push([averages.x, averages.y, averages.z]);
    }
    // setCoordinates(coordsStorage);
  };

  const getGroupVertexCoords = async (group, meshRef) => {
    const mesh = meshRef.current;
    const geometry = mesh.geometry;
    const position = geometry.getAttribute("position");
    const shape = [];
    for (let i = group.start; i < group.start + group.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      shape.push([x, y, z]);
    }
    return shape;
  };

  const getAvgCoords = async (group, meshRef) => {
    const shape = await getGroupVertexCoords(group, meshRef);
    let averages = {x: 0, y: 0, z: 0};
    for (let i = 0; i < shape.length; i++) {
      const x = shape[i][0];
      averages.x += x;
      const y = shape[i][1];
      averages.y += y;
      const z = shape[i][2];
      averages.z += z;
    }
    averages.x /= shape.length;
    averages.y /= shape.length;
    averages.z /= shape.length;
    return averages;
  };

  const mixFunc = (x, y, weight) => {
    const max = Math.max(0.005, weight);
    console.log(max);
    const val = x * (1 - weight) + y * weight;
    console.log(val);
  };

  const Circle = ({coords, circleRef}) => {
    const x = coords[0];
    const y = coords[1];
    const z = coords[2];

    const circleGeometry = new THREE.SphereGeometry(0.1, 32, 16);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: "red",
      side: THREE.DoubleSide,
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.position.set(x, y, z);
    return (
      <group>
        <primitive object={circle} circleRef={circleRef} />
      </group>
    );
  };

  const LineComp = ({vector, start}) => {
    return <Line points={[start, vector]} color="black" lineWidth={2} />;
  };

  const Cube = (boxRef) => {
    boxRef = boxRef.boxRef;
    console.log(boxRef);

    useFrame(() => {
      const time = clock.getElapsedTime();
      boxRef.current.material.uniforms.uTime.value = time;
      // calculateTiming(time, boxRef, 0);
    });

    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    // const boxMaterial = new THREE.MeshBasicMaterial({
    //   color: "green",
    //   side: THREE.DoubleSide,
    //   wireframe: true,
    // });
    const boxMaterial = new ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        uniform float uTime;
        // uniform float idx;
        uniform vec3 avg;
        varying vec3 vPosition;

        vec3 getRotatePos(vec3 pos, vec3 axis, float angle) {
          mat3 cMatrix = mat3(
            vec3(0, -axis.z, axis.y),
            vec3(axis.z, 0, -axis.x),
            vec3(-axis.y, axis.x, 0)
          );
          mat3 identityMatrix = mat3(
            vec3(1, 0, 0),
            vec3(0, 1, 0),
            vec3(0, 0, 1)
          );

          mat3 rotatePos = mat3(1.0) + (sin(angle) * cMatrix) + ((1.0 - cos(angle)) * (cMatrix * cMatrix));
          vec3 newPos = rotatePos * pos;
          return newPos;
        }

        void main () {
          vPosition = position;
          vNormal = normal;
          vec3 axis = vec3(1.0, 0.0, 0.0);
          vec3 rotatePos = getRotatePos(position, axis, uTime);
          float shrinkFactor = 0.25 * sin(uTime) + 1.025;
          float testFactor = 0.75 * cos((uTime / 3.0) - 1.5) + 0.75;
          vec3 scaledPos = vec3(mix(position.x, avg.x, min(1.0, shrinkFactor)), mix(position.y, avg.y, min(1.0, shrinkFactor)), mix(position.z, avg.z, min(1.0, shrinkFactor)));
          vec3 newPos = vec3(mix(avg.x, rotatePos.x, min(1.0, shrinkFactor)), mix(avg.y, rotatePos.y, min(1.0, shrinkFactor)), mix(avg.z, rotatePos.z, min(1.0, shrinkFactor)));
          vec4 mvPosition = modelViewMatrix * vec4(vPosition, 1.0);
          // vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
          if(vPosition.y > 0.0) {
            scaledPos = scaledPos * max(1.0, testFactor);
            mvPosition = modelViewMatrix * vec4(scaledPos, 1.0);
          }
          gl_Position = projectionMatrix * mvPosition;
      }
      `,
      fragmentShader: `
      void main () {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
      `,
      uniforms: {
        uTime: {value: 1.0},
        avg: {value: {x: 0.0, y: 0.0, z: 0.0}},
      },
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    return (
      <group>
        <primitive object={box} ref={boxRef} />
      </group>
    );
  };

  const calculateTiming = async (time, meshRef, materialIdx) => {
    const groups = meshRef.current.geometry.groups;
    for (let i = 0; i < groups.length; i++) {
      const mid = await getAvgCoords(groups[i], meshRef);
      meshRef.current.material[i].uniforms.uTime.value = time + mid.y / 3.0;
      // if (materialIdx == 1) {
      //   meshRef.current.material[i].uniforms.uTime.value = time + mid.y / 3.0;
      // } else {
      //   meshRef.current.material[i].uniforms.uTime.value = time;
      // }

      if (mid.y > 1.5) {
        meshRef.current.material[i].uniforms.avg.value = mid;
        groups[i].materialIndex = i;
        groups[i].needsUpdate = true;
      } else if (mid.y < 1.5 && mid.y > 1.0) {
        meshRef.current.material[i].uniforms.avg.value = mid;
        groups[i].materialIndex = i;
        groups[i].needsUpdate = true;
      } else if (mid.y < 1.0 && mid.y >= 0.0) {
        meshRef.current.material[i].uniforms.avg.value = mid;
        groups[i].materialIndex = i;
        groups[i].needsUpdate = true;
      } else if (mid.y <= 0.0 && mid.y > -1.0) {
        meshRef.current.material[i].uniforms.avg.value = mid;
        groups[i].materialIndex = i;
        groups[i].needsUpdate = true;
      } else if (mid.y < -1.0 && mid.y > -1.5) {
        meshRef.current.material[i].uniforms.avg.value = mid;
        groups[i].materialIndex = i;
        groups[i].needsUpdate = true;
      } else if (mid.y < -1.5) {
        meshRef.current.material[i].uniforms.avg.value = mid;
        groups[i].materialIndex = i;
        groups[i].needsUpdate = true;
      }
    }
  };

  const testFunc = async () => {
    const mesh = meshRef.current;
    const geometry = mesh.geometry;
    const position = geometry.getAttribute("position");
    const groups = geometry.groups;
    const tempGrouping = [];
    const tempCoords = [];
    for (let i = 0; i < groups.length; i++) {
      const groupCoords = await getGroupVertexCoords(groups[i]);
      const mid = await getAvgCoords(groups[i]);
      if (mid.z > 1.5 || mid.z < -1.5 || mid.x > 1.5 || mid.x < -1.5) {
        tempCoords.push([mid.x, mid.y, mid.z]);
        tempGrouping.push({index: i, coords: mid});
        const tempVal = testVal;
        tempVal[0] = 1.0;
        setTestVal(tempVal);
      }
    }
    console.log(tempGrouping);
    setCoordinates(tempCoords);
  };

  const calculateVector = async () => {
    const shape = await getGroupVertexCoords(
      meshRef.current.geometry.groups[3]
    );
    const pos1 = shape[0];
    const pos2 = shape[1];
    const avg = await getAvgCoords(meshRef.current.geometry.groups[3]);
    const start = [avg.x, avg.y, avg.z];

    const vec1 = [pos1[0] - avg.x, pos1[1] - avg.y, pos1[2] - avg.z];
    const vec2 = [pos2[0] - avg.x, pos2[1] - avg.y, pos2[2] - avg.z];
    const vector = [
      vec1[1] * vec2[2] - vec1[2] * vec2[1],
      vec1[2] * vec2[0] - vec1[0] * vec2[2],
      vec1[0] * vec2[1] - vec1[1] * vec2[0],
    ];
    setVectorView({start: start, vector: vector});
  };

  return (
    <>
      <div className="text">
        {/* <h1>TEST TEXT</h1> */}
        {/* <button onClick={() => test()}>Test</button>
        <button onClick={() => removeFaces()}>Remove</button>
        <button onClick={() => group()}>Group</button>
        <button onClick={() => changePosition()}>change</button>
        <button onClick={() => animationTest()}>Animate</button>
        <button onClick={() => highlightFace([0, 3, 6])}>Inc</button>
        <button onClick={() => testFunc()}>Temp Func</button>
        <button onClick={() => calculateVector()}>calculateVector</button> */}
      </div>
      <div id="canvas-container" className="canvas-container">
        <Canvas>
          <OrbitControls />
          <axesHelper args={[5]} />
          {/* <GeodesicPolyhedron
            radius={2}
            detail={1}
            color={0x00ff00}
            rotationSpeed={0.005}
            wireframe={false}
            meshRef={meshRef}
            edgesRef={edgesRef}
            materialIdx={1}
          /> */}
          <GeodesicPolyhedron
            radius={2}
            detail={1}
            color={0x00ff00}
            rotationSpeed={0.005}
            wireframe={true}
            meshRef={meshRef2}
            edgesRef={edgesRef2}
            materialIdx={2}
          />
          {/* <GeodesicPolyhedron
            radius={2}
            detail={1}
            color={0x00ff00}
            rotationSpeed={0.005}
            wireframe={false}
            meshRef={meshRef2}
            edgesRef={edgesRef}
            materialIdx={-1}
          /> */}
          {/* <Cube boxRef={boxRef} /> */}
          {coordinates.map((coord, idx) => (
            <Circle coords={coord} key={idx} circleRef={circleRef} />
          ))}
          <LineComp start={vectorView.start} vector={vectorView.vector} />
          <ambientLight intensity={0.1} />
          <directionalLight color="red" position={[0, 0, 5]} />
          {/* <mesh className="mesh">
            <boxGeometry args={[5, 5, 5]} />
            <meshStandardMaterial />
          </mesh> */}
        </Canvas>
      </div>
    </>
  );
};

export default App;
