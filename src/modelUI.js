// Model UI Management System - Jurassic Edition + Rotation IJKL + Save Rotation
import * as THREE from 'three'

let selectedModel = null
let selectedModelName = null
const keys = {}
const moveSpeed = 0.3
const rotSpeed = 0.05

export class ModelUI {
  constructor(scene, camera, modelRegistry, controls) {
    this.scene = scene
    this.camera = camera
    this.controls = controls
    this.modelRegistry = modelRegistry
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    this.init()
  }

  init() {
    this.createSelectionPanel()
    this.attachEventListeners()
  }

  // ============================================================
  // PANEL JURÁSICO
  // ============================================================
  createSelectionPanel() {

    const container = document.createElement('div')
    container.id = 'model-ui-container'
    container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 1000;
      font-family: 'Arial', sans-serif;
    `

    const toggleBtn = document.createElement('button')
    toggleBtn.id = 'model-ui-toggle'
    toggleBtn.textContent = '▼ Gestor de Modelos 3D'
    toggleBtn.style.cssText = `
      background: #4a6f46;
      color: #d3af6e;
      border: 2px solid #2e402a;
      padding: 10px 15px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      font-size: 13px;
      width: 260px;
      text-align: left;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    `
    container.appendChild(toggleBtn)

    const panel = document.createElement('div')
    panel.id = 'model-ui-panel'
    panel.style.cssText = `
      display: none;
      position: absolute;
      top: 45px;
      left: 0;
      background: rgba(34, 40, 28, 0.96);
      padding: 15px;
      border-radius: 6px;
      color: #d3c7a4;
      font-size: 13px;
      border: 2px solid #4a6f46;
      width: 280px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.6);
    `

    const selectionInfo = document.createElement('div')
    selectionInfo.id = 'selection-info'
    selectionInfo.style.cssText = `
      background: rgba(77, 56, 35, 0.25);
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 12px;
      border-left: 4px solid #4a6f46;
      font-size: 12px;
      color: #e4d9c3;
    `
    selectionInfo.innerHTML = `
      <p><strong>Estado:</strong> Ningún modelo seleccionado</p>
      <p style="margin:0; font-size:11px; color:#b8a98a;">Doble clic para seleccionar</p>
    `
    panel.appendChild(selectionInfo)

    const controlsSection = document.createElement('div')
    controlsSection.style.cssText = 'margin-bottom: 12px; color: #c9bb9d;'

    const controlsTitle = document.createElement('h3')
    controlsTitle.textContent = 'Controles'
    controlsTitle.style.cssText = 'margin: 0 0 6px 0; color: #9ccf6b; font-size: 12px;'
    controlsSection.appendChild(controlsTitle)

    const controlsList = document.createElement('ul')
    controlsList.style.cssText = `
      margin: 0; 
      padding-left: 20px; 
      font-size: 11px; 
      color: #c9bb9d;
    `
    controlsList.innerHTML = `
      <li>Doble clic para seleccionar</li>
      <li>WASD → mover</li>
      <li>Q/E → subir-bajar</li>
      <li>IJKL → rotar</li>
      <li>T → deseleccionar</li>
    `
    controlsSection.appendChild(controlsList)
    panel.appendChild(controlsSection)

    const modelListSection = document.createElement('div')
    modelListSection.style.cssText = `
      margin-bottom: 12px; 
      padding-bottom: 12px; 
      border-bottom: 1px solid #3a2f24;
    `

    const modelListTitle = document.createElement('h3')
    modelListTitle.textContent = 'Modelos'
    modelListTitle.style.cssText = `
      margin: 0 0 6px 0; 
      color: #9ccf6b; 
      font-size: 12px;
    `
    modelListSection.appendChild(modelListTitle)

    const modelList = document.createElement('div')
    modelList.id = 'model-list'
    modelList.style.cssText = 'max-height: 150px; overflow-y: auto; font-size: 11px;'
    modelListSection.appendChild(modelList)
    panel.appendChild(modelListSection)

    // Toggle panel
    let isOpen = false
    toggleBtn.onclick = () => {
      isOpen = !isOpen
      panel.style.display = isOpen ? 'block' : 'none'
      toggleBtn.textContent = isOpen ? '▲ Gestor de Modelos 3D' : '▼ Gestor de Modelos 3D'
    }

    container.appendChild(panel)
    document.body.appendChild(container)
    this.panel = panel
  }

  // ============================================================
  // SELECCIÓN + LISTA
  // ============================================================
  updateSelectionPanel() {
    const selectionInfo = document.getElementById('selection-info')

    if (selectedModelName) {
      selectionInfo.innerHTML = `
        <p><strong>Seleccionado:</strong> ${selectedModelName}</p>
        <p style="font-size:11px; color:#b8a98a;">Mover: WASD | Rotar: IJKL | T deseleccionar</p>
      `
      selectionInfo.style.borderLeftColor = '#9ccf6b'
      selectionInfo.style.background = 'rgba(74,111,70,0.25)'
    } else {
      selectionInfo.innerHTML = `
        <p><strong>Estado:</strong> Ningún modelo seleccionado</p>
      `
      selectionInfo.style.borderLeftColor = '#4a6f46'
      selectionInfo.style.background = 'rgba(77,56,35,0.25)'
    }

    this.updateModelList()
  }

  updateModelList() {
    const modelList = document.getElementById('model-list')
    modelList.innerHTML = ''

    Object.entries(this.modelRegistry).forEach(([name, model]) => {
      const active = selectedModelName === name

      const modelItem = document.createElement('div')
      modelItem.style.cssText = `
        padding: 8px;
        margin-bottom: 6px;
        background: ${active ? 'rgba(156,207,107,0.25)' : 'rgba(58,47,36,0.35)'};
        border-radius: 4px;
        border-left: 3px solid ${active ? '#9ccf6b' : '#5d4631'};
        cursor: pointer;
        font-size: 12px;
        color: #e4d9c3;
      `

      modelItem.textContent = `${name} (${model.position.x.toFixed(1)}, ${model.position.y.toFixed(1)}, ${model.position.z.toFixed(1)})`

      modelItem.onclick = () => this.selectModel(name)
      modelList.appendChild(modelItem)
    })
  }

  selectModel(modelName) {
    selectedModel = this.modelRegistry[modelName]
    selectedModelName = modelName
    this.updateSelectionPanel()
  }

  deselectModel() {
    selectedModel = null
    selectedModelName = null
    this.updateSelectionPanel()
  }

  // ============================================================
  // EVENTOS
  // ============================================================
  attachEventListeners() {

    // SELECCIÓN POR RAYCAST
    window.addEventListener('dblclick', (event) => {
      if (event.target.tagName === 'BUTTON' || event.target.tagName === 'INPUT') return

      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      this.raycaster.setFromCamera(this.mouse, this.camera)
      const models = Object.values(this.modelRegistry)
      const intersects = this.raycaster.intersectObjects(models, true)

      if (intersects.length > 0) {
        let clicked = intersects[0].object
        while (clicked.parent && clicked.parent !== this.scene) {
          clicked = clicked.parent
        }

        for (const [name, model] of Object.entries(this.modelRegistry)) {
          if (model === clicked || model.children.includes(clicked)) {
            this.selectModel(name)
            return
          }
        }
      }
    })

    // KEYDOWN
    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase()
      keys[key] = true

      if (key === 't') this.deselectModel()
    })

    // KEYUP → GUARDAR POSICIÓN + ROTACIÓN
    window.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase()
      keys[key] = false

      if (!selectedModel || !selectedModelName) return

      const validKeys = ['w','a','s','d','q','e','i','j','k','l']

      if (validKeys.includes(key)) {
        this.saveCoordinates(selectedModelName, selectedModel)
      }
    })
  }

  // ============================================================
  // LOCAL STORAGE (POS + ROTACIÓN)
  // ============================================================
  saveCoordinates(modelName, model) {
    const all = JSON.parse(localStorage.getItem('modelPositions') || '{}')

    all[modelName] = {
      position: {
        x: model.position.x,
        y: model.position.y,
        z: model.position.z
      },
      rotation: {
        x: model.rotation.x,
        y: model.rotation.y,
        z: model.rotation.z
      }
    }

    localStorage.setItem('modelPositions', JSON.stringify(all))
    console.log(`✓ Saved ${modelName}`, all[modelName])
  }

  loadCoordinates(modelName) {
    const all = JSON.parse(localStorage.getItem('modelPositions') || '{}')
    return all[modelName] || null
  }

  registerModel(model, name) {
    this.modelRegistry[name] = model
    const saved = this.loadCoordinates(name)

    if (saved) {
      if (saved.position) {
        model.position.set(saved.position.x, saved.position.y, saved.position.z)
      }
      if (saved.rotation) {
        model.rotation.set(saved.rotation.x, saved.rotation.y, saved.rotation.z)
      }
      console.log(`✓ Loaded ${name} from storage`, saved)
    }

    this.updateSelectionPanel()
  }

  // ============================================================
  // MOVIMIENTO + ROTACIÓN (IJKL)
  // ============================================================
  update() {
    if (!selectedModel) return

    // Movimiento
    if (keys['w']) selectedModel.position.z -= moveSpeed
    if (keys['s']) selectedModel.position.z += moveSpeed
    if (keys['a']) selectedModel.position.x -= moveSpeed
    if (keys['d']) selectedModel.position.x += moveSpeed
    if (keys['q']) selectedModel.position.y += moveSpeed
    if (keys['e']) selectedModel.position.y -= moveSpeed

    // Rotación IJKL
    if (keys['i']) selectedModel.rotation.x -= rotSpeed
    if (keys['k']) selectedModel.rotation.x += rotSpeed

    if (keys['j']) selectedModel.rotation.y += rotSpeed
    if (keys['l']) selectedModel.rotation.y -= rotSpeed
  }
}

export function initModelUI(scene, camera, modelRegistry, controls) {
  const ui = new ModelUI(scene, camera, modelRegistry, controls)
  ui.updateSelectionPanel()
  return ui
}
