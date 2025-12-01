import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { initModelUI } from './modelUI.js'

// Create scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87CEEB) // Sky blue
// add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
scene.add(ambientLight)


// Add directional light for shadows
const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
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

// ========== MODEL MANAGEMENT ==========
const modelRegistry = {}

// Initialize GLTF loader
const gltfLoader = new GLTFLoader()

// Function to load a single model
function loadModel(path) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(path, (gltf) => {
      const model = gltf.scene
      scene.add(model)
      console.log('Model loaded:', path)
      resolve(model)
    }, undefined, (error) => {
      console.error('Error loading model:', error)
      reject(error)
    })
  })
}

// Function to load multiple models
async function loadModels(paths) {
  try {
    const models = await Promise.all(paths.map(path => loadModel(path)))
    console.log('All models loaded successfully!')
    return models
  } catch (error) {
    console.error('Error loading models:', error)
  }
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// ========== MODEL MANAGEMENT ==========
let modelUI = null

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  
  // Update model movement
  if (modelUI) {
    modelUI.update()
  }
  
  controls.update()
  renderer.render(scene, camera)
}

animate()

// Initialize UI
modelUI = initModelUI(scene, camera, modelRegistry, controls)

// Load models
loadModels([
  'models/escena.glb',
  'models/Triceratops.glb',
]).then((models) => {
  // Register each loaded model with UI
  models.forEach((model, index) => {
    const modelName = index === 0 ? 'Escena' : 'Triceratops'
    modelUI.registerModel(model, modelName)
  })
}).catch((error) => {
  console.error('Failed to load models:', error)
})

// Export for use in other modules
export { scene, camera, renderer, loadModel, loadModels }
        