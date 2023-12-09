import {useState, useRef, useMemo} from "react";
import {createRoot} from "react-dom/client";
import {Canvas, extend, useFrame} from "@react-three/fiber";
import {Edges, OrbitControls} from "@react-three/drei";
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

  const circleRef = useRef();

  const [coordinates, setCoordinates] = useState([
    // [-1.09, 1.4, 0.53],
    // [-1.07, 1.07, 1.07],
    // [-1.43, 0.53, 1.09],
  ]);

  const [incIdx, setIncIdx] = useState(0);

  const meshRef2 = useRef();
  const edgesRef2 = useRef();

  const clock = new THREE.Clock();

  const [time, setTime] = useState(0);

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
      // meshRef.current.material[1].uniforms.uTime.value = time;
      meshRef.current.material[2].uniforms.uTime.value = time;
      // edgesRef.current.material.uniforms.uTime.value = time;
    });

    const icosahedronGeometry = new IcosahedronGeometry(radius, detail);

    const edgesGeometry = new EdgesGeometry(icosahedronGeometry);
    const edgesMaterial = new LineBasicMaterial({color: 0x000000});
    const newEdgesMaterial = new ShaderMaterial({
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
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;

      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, smoothstep(0.0, 1.0, sin((uTime + vPosition.y) / 0.25)));
      }
      `,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: {value: 1.0},
      },
      transparent: true,
      depthWrite: false,
    });
    const edgesMesh = new LineSegments(edgesGeometry, newEdgesMaterial);

    const position = icosahedronGeometry.getAttribute("position");
    const materials = [];
    for (let i = 0; i < position.count; i++) {
      if (i % 3 == 0) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);
        const newMaterial = new MeshBasicMaterial({
          // wireframe: true,
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
              // newPos.xyz += sin(uTime);
              vNormal = normal;
              float scaleFactor = 0.15 * sin(uTime) + 1.15;
              // vec4 scaledPos = modelViewMatrix * vec4(newPos, 1.0);
              vec4 scaledPos = modelViewMatrix * vec4(position * scaleFactor, 1.0);
              // scaledPos.xyz *= scaleFactor;
              gl_Position = projectionMatrix * scaledPos;
            }
          `,
          fragmentShader: `
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
            uTime: {value: 1.0},
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
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float uTime;

            void main() {
              gl_FragColor = vec4(1.0, 0.0, 0.0, smoothstep(0.0, 1.0, sin((uTime + vPosition.y) / 0.25)));
              // if(vPosition.y > 1.5) {
              //   gl_FragColor = vec4(1.0, 0.0, 0.0, smoothstep(0.0, 1.0, sin((uTime + vPosition.y) / 0.25)));
              //   // gl_FragColor = vec4(1.0, 0.0, 0.0, sin((uTime + 2.0) / 0.25));
              // } else if (vPosition.y > 1.0 && vPosition.y < 1.5) {
              //   gl_FragColor = vec4(0.0, 1.0, 0.0, smoothstep(0.0, 1.0, sin((uTime + 1.90) / 0.25)));
              //   // gl_FragColor = vec4(0.0, 1.0, 0.0, sin((uTime + 1.75) / 0.25));
              // } else if (vPosition.y > 0.5 && vPosition.y < 1.0) {
              //   gl_FragColor = vec4(0.0, 0.0, 1.0, smoothstep(0.0, 1.0, sin((uTime + 1.8) / 0.25)));
              //   // gl_FragColor = vec4(0.0, 0.0, 1.0, sin((uTime + 1.5) / 0.25));
              // } else if (vPosition.y > 0.0 && vPosition.y < 0.5) {
              //   gl_FragColor = vec4(1.0, 1.0, 0.0, smoothstep(0.0, 1.0, sin((uTime + 1.7) / 0.25)));
              //   // gl_FragColor = vec4(1.0, 1.0, 0.0, sin((uTime + 1.25) / 0.25));
              // } else if (vPosition.y > -0.5 && vPosition.y < 0.0){
              //   gl_FragColor = vec4(0.0, 0.0, 1.0, smoothstep(0.0, 1.0, sin((uTime + 1.6) / 0.25)));
              //   // gl_FragColor = vec4(0.0, 0.0, 1.0, sin((uTime + 1.0) / 0.25));
              // } else if (vPosition.y > -1.0 && vPosition.y < -0.5) {
              //   gl_FragColor = vec4(0.0, 1.0, 0.0, smoothstep(0.0, 1.0, sin((uTime + 1.5) / 0.25)));
              //   // gl_FragColor = vec4(0.0, 1.0, 0.0, sin((uTime + 0.75) / 0.25));
              // } else if (vPosition.y > -1.5 && vPosition.y < -1.0) {
              //   gl_FragColor = vec4(1.0, 0.0, 0.0, smoothstep(0.0, 1.0, sin((uTime + 1.4) / 0.25 )));
              //   // gl_FragColor = vec4(1.0, 0.0, 0.0, sin((uTime + 0.5) / 0.25 ));
              // } else {
              //   gl_FragColor = vec4(0.5, 0.5, 0.5, smoothstep(0.0, 1.0, sin((uTime + 1.3) / 0.25)));
              //   // gl_FragColor = vec4(0.5, 0.5, 0.5, sin((uTime + 0.25) / 0.25));
              // }
            }
          `,
          side: THREE.DoubleSide,
          uniforms: {
            uTime: {value: 1.0},
          },
          transparent: true,
          depthWrite: false,
          // wireframe: true,
        });

        // if (z > 0.5 && z < 1.5) {
        //   icosahedronGeometry.addGroup(i, 3, 1);
        // }
        // if (i == 0) {
        //   icosahedronGeometry.addGroup(i, 3, 1);
        //   edgesGeometry.addGroup(i, 3, 1);
        // } else {
        //   icosahedronGeometry.addGroup(i, 3, 0);
        //   edgesGeometry.addGroup(i, 3, 0);
        // }

        icosahedronGeometry.addGroup(i, 3, materialIdx);
        materials.push(newMaterial);
        materials.push(newMaterial2);
        materials.push(newMaterial3);
        // materials.push(numberMaterial);
        // icosahedronGeometry.material = materials;
        icosahedronGeometry.needsUpdate = true;
        edgesGeometry.material = materials;
        edgesGeometry.needsUpdate = true;
      }
    }

    const posAttribute = icosahedronGeometry.getAttribute("position");

    const colors = [];
    const colorNew = new THREE.Color();

    for (let i = 0; i < posAttribute.count; i++) {
      colorNew.set(0xffffff * Math.random());
      const opacity = Math.random() * 0.7 + 0.7;

      // Define same color for each vertex of a triangle
      colors.push(colorNew.r, colorNew.g, colorNew.b, opacity);
      colors.push(colorNew.r, colorNew.g, colorNew.b, opacity);
      colors.push(colorNew.r, colorNew.g, colorNew.b, opacity);
      colors.push(colorNew.r, colorNew.g, colorNew.b, opacity);
    }

    // icosahedronGeometry.setAttribute(
    //   "color",
    //   new BufferAttribute(new Float32Array(colors), 4)
    // );

    const icosahedronGeometryMesh = new Mesh(
      icosahedronGeometry,
      // icosahedronGeometryMaterial
      materials
    );

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

  const test = () => {
    console.log(meshRef.current);
    console.log(meshRef.current.geometry);
    console.log(edgesRef.current);
    const pos = meshRef.current.geometry.getAttribute("position");
    const maxPos = Math.max(...pos.array);
    console.log(maxPos);
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

  const getGroupVertexCoords = async (group) => {
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

  const getAvgCoords = async (group) => {
    const shape = await getGroupVertexCoords(group);
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

  const testFunc = async () => {
    const mesh = meshRef.current;
    const geometry = mesh.geometry;
    const position = geometry.getAttribute("position");
    const groups = geometry.groups;
    for (let i = 0; i < groups.length; i++) {
      const mid = await getAvgCoords(groups[i]);
      if (mid.y > 1.5) {
        groups[i].materialIndex = 0;
        geometry.needsUpdate = true;
      } else if (mid.y > 1 && mid.y < 1.5) {
        groups[i].materialIndex = 0;
        geometry.needsUpdate = true;
      } else if (mid.y > 0.5 && mid.y < 1) {
        groups[i].materialIndex = 1;
        geometry.needsUpdate = true;
      } else if (mid.y > 0 && mid.y < 0.5) {
        groups[i].materialIndex = 1;
        geometry.needsUpdate = true;
      }
    }
  };

  return (
    <>
      <div className="text">
        {/* <h1>TEST TEXT</h1> */}
        <button onClick={() => test()}>Test</button>
        <button onClick={() => removeFaces()}>Remove</button>
        <button onClick={() => group()}>Group</button>
        <button onClick={() => changePosition()}>change</button>
        <button onClick={() => animationTest()}>Animate</button>
        <button onClick={() => highlightFace([0, 3, 6])}>Inc</button>
        <button onClick={() => testFunc()}>Temp Func</button>
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
            wireframe={false}
            meshRef={meshRef}
            edgesRef={edgesRef}
            materialIdx={2}
          />
          {coordinates.map((coord, idx) => (
            <Circle coords={coord} key={idx} circleRef={circleRef} />
          ))}
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
