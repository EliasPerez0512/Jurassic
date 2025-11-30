import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Create scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000)

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

// Add directional light for shadows
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(10, 10, 10)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 2048
directionalLight.shadow.mapSize.height = 2048
directionalLight.shadow.camera.left = -50
directionalLight.shadow.camera.right = 50
directionalLight.shadow.camera.top = 50
directionalLight.shadow.camera.bottom = -50
scene.add(directionalLight)

// Create camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(50, 50, 50)
camera.lookAt(0, 0, 0)

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowShadowMap
document.body.appendChild(renderer.domElement)

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.autoRotate = false
controls.autoRotateSpeed = 5

// Initialize GLTF loader
const gltfLoader = new GLTFLoader()

// Function to load a model
function loadModel(path) {
  gltfLoader.load(path, (gltf) => {
    const model = gltf.scene
    scene.add(model)
    console.log('Model loaded:', path)
  }, undefined, (error) => {
    console.error('Error loading model:', error)
  })
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

animate()

// Load the model
loadModel('models/escena.glb')

/*// Add a sphere
const geometry = new THREE.SphereGeometry(1, 32, 32)
const material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true })
const sphere = new THREE.Mesh(geometry, material)
scene.add(sphere)*/

// Export for use in other modules
export { scene, camera, renderer }
        