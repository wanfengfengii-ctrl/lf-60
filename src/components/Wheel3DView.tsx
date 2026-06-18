import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SimulationResult } from '../types';

interface Wheel3DViewProps {
  result: SimulationResult | null;
}

const Wheel3DView: React.FC<Wheel3DViewProps> = ({ result }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const wheelGroupRef = useRef<THREE.Group | null>(null);
  const spokeMeshesRef = useRef<THREE.Mesh[]>([]);
  const animationFrameRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.4);
    pointLight.position.set(-5, 3, 5);
    scene.add(pointLight);

    const gridHelper = new THREE.GridHelper(10, 20, 0xcccccc, 0xe0e0e0);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    const wheelGroup = new THREE.Group();
    scene.add(wheelGroup);
    wheelGroupRef.current = wheelGroup;

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !wheelGroupRef.current) return;
      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;
      wheelGroupRef.current.rotation.y += deltaX * 0.01;
      wheelGroupRef.current.rotation.x += deltaY * 0.01;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomSpeed = 0.001;
      const distance = cameraRef.current.position.length();
      const newDistance = distance + e.deltaY * zoomSpeed * distance;
      const clampedDistance = Math.max(2, Math.min(15, newDistance));
      cameraRef.current.position.normalize().multiplyScalar(clampedDistance);
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mouseleave', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      cancelAnimationFrame(animationFrameRef.current);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!wheelGroupRef.current || !sceneRef.current) return;

    const wheelGroup = wheelGroupRef.current;
    while (wheelGroup.children.length > 0) {
      const child = wheelGroup.children[0];
      wheelGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    }
    spokeMeshesRef.current = [];

    const groundObjects: THREE.Object3D[] = [];

    const existingGround = sceneRef.current.children.filter(
      (c) => c.userData.isGround || c.userData.isGroundLabel
    );
    for (const obj of existingGround) {
      sceneRef.current.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose();
        }
      }
    }

    if (!result) return;

    const { parameters, spokeData, maxForce } = result;
    const radius = parameters.wheelRadius;
    const spokeCount = parameters.spokeCount;

    const materialColor = new THREE.Color(result.material.color);
    const isMetallic = result.material.id === 'iron';

    const groundPlaneGeometry = new THREE.PlaneGeometry(10, 10);
    const groundColor = new THREE.Color(result.roadCondition.color);
    const groundPlaneMaterial = new THREE.MeshStandardMaterial({
      color: groundColor,
      metalness: 0.1,
      roughness: 0.9,
      transparent: true,
      opacity: 0.6,
    });
    const groundPlane = new THREE.Mesh(groundPlaneGeometry, groundPlaneMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -1.5;
    groundPlane.receiveShadow = true;
    groundPlane.userData.isGround = true;
    sceneRef.current.add(groundPlane);
    groundObjects.push(groundPlane);

    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 64;
    const ctx = labelCanvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 512, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(result.roadCondition.name, 256, 32);
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
    const labelSprite = new THREE.Sprite(labelMaterial);
    labelSprite.position.set(0, -1.25, 2.5);
    labelSprite.scale.set(2, 0.25, 1);
    labelSprite.userData.isGroundLabel = true;
    sceneRef.current.add(labelSprite);
    groundObjects.push(labelSprite);

    const hubRadius = radius * 0.12;
    const hubDepth = radius * 0.2;
    const hubGeometry = new THREE.CylinderGeometry(
      hubRadius,
      hubRadius,
      hubDepth,
      32
    );
    const hubMaterial = new THREE.MeshStandardMaterial({
      color: materialColor,
      metalness: isMetallic ? 0.6 : 0.2,
      roughness: isMetallic ? 0.4 : 0.7,
    });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.rotation.x = Math.PI / 2;
    hub.castShadow = true;
    hub.receiveShadow = true;
    wheelGroup.add(hub);

    const axleGeometry = new THREE.CylinderGeometry(
      hubRadius * 0.3,
      hubRadius * 0.3,
      hubDepth * 1.5,
      16
    );
    const axleMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.3,
    });
    const axle = new THREE.Mesh(axleGeometry, axleMaterial);
    axle.rotation.x = Math.PI / 2;
    axle.castShadow = true;
    wheelGroup.add(axle);

    const torusGeometry = new THREE.TorusGeometry(
      radius,
      radius * 0.06,
      16,
      64
    );
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: materialColor,
      metalness: isMetallic ? 0.5 : 0.15,
      roughness: isMetallic ? 0.4 : 0.8,
    });
    const rim = new THREE.Mesh(torusGeometry, rimMaterial);
    rim.rotation.y = Math.PI / 2;
    rim.castShadow = true;
    rim.receiveShadow = true;
    wheelGroup.add(rim);

    const spokeWidth3D = parameters.spokeWidth * radius * 25;
    const spokeHeight3D = parameters.spokeHeight * radius * 25;

    for (let i = 0; i < spokeCount; i++) {
      const angle = (2 * Math.PI * i) / spokeCount;
      const spokeInfo = spokeData[i];
      const forceRatio = Math.min(1, spokeInfo.totalForce / maxForce);
      const damage = spokeInfo.damageAccumulated;

      let spokeColor: THREE.Color;
      let emissiveColor = new THREE.Color(0x000000);
      let emissiveIntensity = 0;

      if (damage >= 1.0) {
        spokeColor = new THREE.Color(0xff1111);
        emissiveColor = new THREE.Color(0xff0000);
        emissiveIntensity = 0.8;
      } else if (damage > 0.5) {
        const t = (damage - 0.5) * 2;
        spokeColor = materialColor.clone().lerp(new THREE.Color(0xff2222), t * 0.7);
        emissiveColor = new THREE.Color(0xff0000);
        emissiveIntensity = t * 0.5;
      } else if (spokeInfo.exceedsThreshold) {
        spokeColor = new THREE.Color(0xff2222);
        emissiveColor = new THREE.Color(0x440000);
        emissiveIntensity = 0.3;
      } else if (forceRatio > 0.8) {
        spokeColor = materialColor.clone().lerp(new THREE.Color(0xff8800), 0.5);
      } else if (forceRatio > 0.5) {
        spokeColor = materialColor.clone().lerp(new THREE.Color(0xffcc00), 0.3);
      } else {
        spokeColor = materialColor.clone();
      }

      const spokeLength = radius - hubRadius;
      const spokeGeometry = new THREE.BoxGeometry(
        spokeLength,
        spokeWidth3D,
        spokeHeight3D
      );
      const spokeMaterial = new THREE.MeshStandardMaterial({
        color: spokeColor,
        metalness: isMetallic ? 0.4 : 0.15,
        roughness: isMetallic ? 0.5 : 0.75,
        emissive: emissiveColor,
        emissiveIntensity: emissiveIntensity,
      });
      const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);

      spoke.position.x = Math.cos(angle) * (spokeLength / 2 + hubRadius);
      spoke.position.z = Math.sin(angle) * (spokeLength / 2 + hubRadius);
      spoke.rotation.y = -angle;
      spoke.castShadow = true;
      spoke.receiveShadow = true;

      spoke.userData = { ...spokeInfo };

      wheelGroup.add(spoke);
      spokeMeshesRef.current.push(spoke);
    }

    const arrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, radius + 0.3, 0),
      parameters.axleLoad * 0.02 + 0.2,
      0x2288ff,
      0.1,
      0.05
    );
    wheelGroup.add(arrowHelper);

    return () => {
      for (const obj of groundObjects) {
        sceneRef.current?.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (obj.material instanceof THREE.Material) {
            obj.material.dispose();
          }
        }
      }
    };
  }, [result]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
};

export default Wheel3DView;
