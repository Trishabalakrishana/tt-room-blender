import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Player setup
const player = {
    height: 1.5,
    speed: 0.1,
    turnSpeed: 0.002,
    position: new THREE.Vector3(0, 1.5, 5),
    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3()
};

// Camera modes
let isFirstPerson = true;
const thirdPersonDistance = 5;
const thirdPersonHeight = 2;

// Controls
const controls = new PointerLockControls(camera, document.body);

// Click to enable controls
document.body.addEventListener('click', () => {
    controls.lock();
});

// Movement
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

document.addEventListener('keydown', (e) => {
    switch(e.code) {
        case 'KeyW': moveState.forward = true; break;
        case 'KeyS': moveState.backward = true; break;
        case 'KeyA': moveState.left = true; break;
        case 'KeyD': moveState.right = true; break;
        case 'KeyV': toggleView(); break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'KeyW': moveState.forward = false; break;
        case 'KeyS': moveState.backward = false; break;
        case 'KeyA': moveState.left = false; break;
        case 'KeyD': moveState.right = false; break;
    }
});

// Toggle between 1st and 3rd person
function toggleView() {
    isFirstPerson = !isFirstPerson;
    document.getElementById('viewMode').textContent = 
        `Current: ${isFirstPerson ? 'First Person' : 'Third Person'}`;
}

// Load GLB model
const loader = new GLTFLoader();
loader.load(
    'ttroom.glb', // Replace with your GLB file path
    (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(model);
        console.log('Model loaded successfully');
    },
    (progress) => {
        console.log('Loading...', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
        console.error('Error loading model:', error);
    }
);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update movement
    const direction = new THREE.Vector3();
    
    if (moveState.forward) direction.z -= 1;
    if (moveState.backward) direction.z += 1;
    if (moveState.left) direction.x -= 1;
    if (moveState.right) direction.x += 1;
    
    direction.normalize();
    
    if (controls.isLocked) {
        // Apply camera direction to movement
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        
        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
        
        player.velocity.set(0, 0, 0);
        player.velocity.addScaledVector(forward, -direction.z * player.speed);
        player.velocity.addScaledVector(right, direction.x * player.speed);
        
        player.position.add(player.velocity);
        
        // Update camera position based on view mode
        if (isFirstPerson) {
            controls.getObject().position.copy(player.position);
        } else {
            // Third person view
            controls.getObject().position.copy(player.position);
            const offset = new THREE.Vector3();
            camera.getWorldDirection(offset);
            offset.multiplyScalar(-thirdPersonDistance);
            offset.y = thirdPersonHeight;
            camera.position.copy(player.position).add(offset);
        }
    }

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();