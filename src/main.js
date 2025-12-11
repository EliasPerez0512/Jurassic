//David Feng 20-70-7491
//Elias Perez 8-1015-1917
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { initModelUI } from './modelUI.js'
import { defaultModelPositions } from './modelPositions.js'

// Crear la escena
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87CEEB) // Sky blue
// agregar luz ambiente
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
scene.add(ambientLight)


// Agregar luz direccional para sombras
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

// Crear la camara
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(50, 50, 50)
camera.lookAt(0, 0, 0)

// Crear el renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowShadowMap
document.body.appendChild(renderer.domElement)

// Agregar controles de orbitacion
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.autoRotate = false
controls.autoRotateSpeed = 5

// ========== GESTION DE MODELOS ==========
const modelRegistry = {}
const animationMixers = []

// Inicializar el cargador de GLTF
const gltfLoader = new GLTFLoader()

// Funcion auxiliar para aplicar transformaciones a un modelo
function applyModelTransform(model, data) {
  if (!model || !data) return
  
  if (data.position) {
    model.position.set(data.position.x, data.position.y, data.position.z)
  }
  if (data.rotation) {
    model.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z)
  }
  if (data.scale) {
    model.scale.set(data.scale.x, data.scale.y, data.scale.z)
  }
}

// Funcion para cargar un solo modelo
function loadModel(path) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,
      (gltf) => {
        const model = gltf.scene
        
        scene.add(model)
        
        // Manejar animaciones si estan presentes
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model)
          
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip)
            action.play()
            console.log(`✓ Animación "${clip.name}" iniciada para: ${path}`)
          })
          
          animationMixers.push(mixer)
          console.log(`✓ Modelo con ${gltf.animations.length} animación(es) cargado: ${path}`)
        } else {
          console.log('Model loaded:', path)
        }
        
        resolve(model)
      },
      undefined,
      (error) => {
        console.error(`Error loading model ${path}:`, error)
        reject(error)
      }
    )
  })
}

// Funcion para cargar multiples modelos
async function loadModels(paths) {
  try {
    const models = await Promise.all(paths.map(path => loadModel(path)))
    console.log('All models loaded successfully!')
    return models
  } catch (error) {
    console.error('Error loading models:', error)
    throw error
  }
}

// Manejar el redimensionamiento de la ventana
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

let modelUI = null

// Bucle de animacion
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  
  const delta = clock.getDelta()
  
  // Actualizar todas las animaciones de los modelos
  animationMixers.forEach((mixer) => {
    mixer.update(delta)
  })
  
  // Actualizar el movimiento de los modelos
  if (modelUI) {
    modelUI.update()
  }
  
  controls.update()
  renderer.render(scene, camera)
}

animate()

// Cargar modelos
const modelPaths = [
  'models/escena.glb',
  'models/Triceratops.glb',
  'models/CampFire.glb',
  'models/Diplodocus.glb',
  'models/Parasaurolophus.glb',
  'models/Pterablocktyls.glb',
  'models/T-rex.glb',
  'models/Stegosaurus.glb'
]

loadModels(modelPaths).then((models) => {
  // Funcion auxiliar para extraer el nombre del modelo desde la ruta
  const getModelName = (path) => {
    const fileName = path.split('/').pop().replace('.glb', '')
    return fileName === 'escena' ? 'Escena' : fileName
  }

  // Inicializar la UI con las posiciones predeterminadas
  modelUI = initModelUI(scene, camera, modelRegistry, controls, defaultModelPositions)

  // Registrar cada modelo cargado con la UI usando los nombres de los archivos
  models.forEach((model, index) => {
    const modelName = getModelName(modelPaths[index])
    modelUI.registerModel(model, modelName)
  })

  // PRIMERO: Aplicar posiciones predeterminadas a todos los modelos
  Object.entries(defaultModelPositions).forEach(([name, data]) => {
    const model = modelRegistry[name]
    applyModelTransform(model, data)
  })

  // SEGUNDO: Sobrescribir con posiciones guardadas en localStorage (solo las posiciones editadas)
  const savedPositions = localStorage.getItem('modelPositions')
  if (savedPositions) {
    try {
      const savedModelPositions = JSON.parse(savedPositions)
      console.log('✓ Aplicando posiciones guardadas en localStorage')
      
      Object.entries(savedModelPositions).forEach(([name, data]) => {
        const model = modelRegistry[name]
        applyModelTransform(model, data)
      })
    } catch (error) {
      console.warn('Error al leer localStorage:', error)
    }
  } else {
    console.log('✓ Usando solo posiciones predeterminadas (no hay localStorage)')
  }

  // Actualizar el panel del gestor de modelos después de aplicar todas las posiciones
  if (modelUI) {
    modelUI.updateSelectionPanel();
    modelUI.updateModelList();
  }

}).catch((error) => {
  console.error('Failed to load models:', error)
})

// Exportar para usar en otros modulos
export { scene, camera, renderer, loadModel, loadModels, applyModelTransform }
        