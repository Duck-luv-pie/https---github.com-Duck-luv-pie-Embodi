import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ThreeJSViewer = ({ objContent, width, height }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    console.log('ThreeJSViewer: useEffect triggered');
    console.log('ThreeJSViewer: width =', width, 'height =', height);
    console.log('ThreeJSViewer: objContent length =', objContent ? objContent.length : 'null');
    console.log('ThreeJSViewer: mountRef.current =', mountRef.current);

    if (!mountRef.current) {
      console.log('ThreeJSViewer: No mountRef, returning');
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    sceneRef.current = scene;
    console.log('ThreeJSViewer: Scene created');

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5); // Simple position
    cameraRef.current = camera;
    console.log('ThreeJSViewer: Camera created at position', camera.position);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x87CEEB);
    rendererRef.current = renderer;
    console.log('ThreeJSViewer: Renderer created with size', width, 'x', height);

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;
    console.log('ThreeJSViewer: Controls created');

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    console.log('ThreeJSViewer: Ambient light added');

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    console.log('ThreeJSViewer: Directional light added');

    // Add a simple colored cube that should definitely be visible
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Bright red
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, 0);
    scene.add(cube);
    console.log('ThreeJSViewer: Red cube added at position', cube.position);

    // Add to DOM first
    mountRef.current.appendChild(renderer.domElement);
    console.log('ThreeJSViewer: Renderer added to DOM');

    // Simple animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate the cube
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    console.log('ThreeJSViewer: Starting animation loop');
    animate();

    // Only try to load OBJ if we have content
    if (objContent) {
      console.log('ThreeJSViewer: Attempting to load OBJ content');
      console.log('ThreeJSViewer: OBJ content length:', objContent.length);
      console.log('ThreeJSViewer: OBJ content starts with:', objContent.substring(0, 200));
      
      // Check if it looks like a valid OBJ file
      if (!objContent.includes('v ') && !objContent.includes('f ')) {
        console.error('ThreeJSViewer: OBJ content does not contain vertices or faces');
        console.log('ThreeJSViewer: Keeping red cube as fallback');
        return;
      }
      
      try {
        const loader = new OBJLoader();
        const blob = new Blob([objContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        console.log('ThreeJSViewer: Created blob URL:', url);

        loader.load(
          url,
          (object) => {
            console.log('ThreeJSViewer: OBJ loaded successfully:', object);
            console.log('ThreeJSViewer: Object children count:', object.children.length);
            
            // Remove the cube
            scene.remove(cube);
            
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.sub(center);
            
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            console.log('ThreeJSViewer: Model size:', size, 'maxDim:', maxDim);
            
            // More aggressive scaling for small models
            let scale = 1.0;
            if (maxDim < 0.01) scale = 100.0;  // Very small models
            else if (maxDim < 0.1) scale = 50.0; // Small models
            else if (maxDim < 1.0) scale = 10.0; // Medium models
            else if (maxDim > 10.0) scale = 0.1; // Large models
            
            object.scale.setScalar(scale);
            console.log('ThreeJSViewer: Applied scale:', scale);

            // Add material with better visibility
            const material = new THREE.MeshPhongMaterial({ 
              color: 0x00ff00, // Bright green for visibility
              side: THREE.DoubleSide,
              shininess: 100,
              transparent: true,
              opacity: 0.9
            });
            
            object.traverse((child) => {
              if (child.isMesh) {
                child.material = material;
                console.log('ThreeJSViewer: Applied material to mesh:', child);
              }
            });

            scene.add(object);
            console.log('ThreeJSViewer: Model added to scene');
            
            // Adjust camera to better frame the model
            const boundingBox = new THREE.Box3().setFromObject(object);
            const modelSize = boundingBox.getSize(new THREE.Vector3());
            const maxSize = Math.max(modelSize.x, modelSize.y, modelSize.z);
            const distance = Math.max(maxSize * 2, 2); // Ensure minimum distance
            
            camera.position.set(distance, distance, distance);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();
            
            console.log('ThreeJSViewer: Camera repositioned to distance:', distance);
          },
          (xhr) => {
            console.log('ThreeJSViewer: Loading progress:', (xhr.loaded / xhr.total * 100) + '%');
          },
          (error) => {
            console.error('ThreeJSViewer: Error loading OBJ:', error);
            console.log('ThreeJSViewer: Keeping the red cube as fallback');
            
            // Show the OBJ content as text for debugging
            const textDiv = document.createElement('div');
            textDiv.style.position = 'absolute';
            textDiv.style.top = '10px';
            textDiv.style.left = '10px';
            textDiv.style.background = 'rgba(0,0,0,0.8)';
            textDiv.style.color = 'white';
            textDiv.style.padding = '10px';
            textDiv.style.fontSize = '12px';
            textDiv.style.maxWidth = '300px';
            textDiv.style.maxHeight = '200px';
            textDiv.style.overflow = 'auto';
            textDiv.style.zIndex = '1000';
            textDiv.innerHTML = `<strong>OBJ Content (first 500 chars):</strong><br>${objContent.substring(0, 500)}`;
            mountRef.current.appendChild(textDiv);
          }
        );

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (error) {
        console.error('ThreeJSViewer: Error creating blob:', error);
      }
    } else {
      console.log('ThreeJSViewer: No objContent provided, showing only red cube');
    }

    // Cleanup
    return () => {
      console.log('ThreeJSViewer: Cleaning up');
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (controls) {
        controls.dispose();
      }
    };
  }, [objContent, width, height]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width, 
        height, 
        border: '2px solid #333',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: '#87CEEB'
      }} 
    />
  );
};

export default ThreeJSViewer; 