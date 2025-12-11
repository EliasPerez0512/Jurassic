// Model UI Management System - Jurassic Edition + Rotation IJKL + Save Rotation
import * as THREE from 'three'

let selectedModel = null
let selectedModelName = null
const keys = {}
const moveSpeed = 0.3
const rotSpeed = 0.05
const scaleSpeed = 0.05

export class ModelUI {
  constructor(scene, camera, modelRegistry, controls, defaultPositions = null) {
    this.scene = scene
    this.camera = camera
    this.controls = controls
    this.modelRegistry = modelRegistry
    this.defaultPositions = defaultPositions
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
      width: 300px;
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
      width: 320px;
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
      <li>R/F → aumentar/disminuir tamaño</li>
      <li>0 → resetear modelo seleccionado</li>
      <li>T → deseleccionar</li>
    `
    controlsSection.appendChild(controlsList)
    panel.appendChild(controlsSection)

    // Controles de escala
    const scaleSection = document.createElement('div')
    scaleSection.id = 'scale-section'
    scaleSection.style.cssText = `
      display: none;
      margin-bottom: 12px; 
      padding: 10px;
      background: rgba(77, 56, 35, 0.25);
      border-radius: 6px;
      border-left: 4px solid #9ccf6b;
    `

    const scaleTitle = document.createElement('h3')
    scaleTitle.textContent = 'Tamaño (Escala)'
    scaleTitle.style.cssText = 'margin: 0 0 8px 0; color: #9ccf6b; font-size: 12px;'
    scaleSection.appendChild(scaleTitle)

    const scaleInfo = document.createElement('div')
    scaleInfo.id = 'scale-info'
    scaleInfo.style.cssText = `
      font-size: 11px;
      color: #e4d9c3;
      margin-bottom: 8px;
    `
    scaleInfo.textContent = 'Escala: 1.00x'
    scaleSection.appendChild(scaleInfo)

    const scaleControls = document.createElement('div')
    scaleControls.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
    `

    const scaleSlider = document.createElement('input')
    scaleSlider.type = 'range'
    scaleSlider.id = 'scale-slider'
    scaleSlider.min = '0.01'
    scaleSlider.max = '5'
    scaleSlider.step = '0.01'
    scaleSlider.value = '1'
    scaleSlider.style.cssText = `
      flex: 1;
      height: 6px;
      background: #3a2f24;
      border-radius: 3px;
      outline: none;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
    `
    // Estilos personalizados para el slider en navegadores webkit (solo una vez)
    if (!document.getElementById('scale-slider-styles')) {
      const style = document.createElement('style')
      style.id = 'scale-slider-styles'
      style.textContent = `
        #scale-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #9ccf6b;
          border: 2px solid #4a6f46;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
        }
        #scale-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #9ccf6b;
          border: 2px solid #4a6f46;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
        }
        #scale-slider:hover::-webkit-slider-thumb {
          background: #b8e68a;
          transform: scale(1.1);
        }
        #scale-slider:hover::-moz-range-thumb {
          background: #b8e68a;
          transform: scale(1.1);
        }
      `
      document.head.appendChild(style)
    }
    scaleSlider.addEventListener('input', (e) => {
      if (selectedModel && selectedModelName) {
        const scale = parseFloat(e.target.value)
        selectedModel.scale.set(scale, scale, scale)
        scaleInfo.textContent = `Escala: ${scale.toFixed(2)}x`
        scaleValue.textContent = scale.toFixed(2)
        this.saveCoordinates(selectedModelName, selectedModel)
      }
    })
    scaleControls.appendChild(scaleSlider)

    const scaleValue = document.createElement('span')
    scaleValue.id = 'scale-value'
    scaleValue.textContent = '1.00'
    scaleValue.style.cssText = `
      min-width: 40px;
      text-align: center;
      font-size: 11px;
      color: #9ccf6b;
      font-weight: bold;
    `
    scaleControls.appendChild(scaleValue)

    const scaleResetBtn = document.createElement('button')
    scaleResetBtn.textContent = 'Reset'
    scaleResetBtn.style.cssText = `
      width: 100%;
      background: #4a6f46;
      color: #d3af6e;
      border: 1px solid #2e402a;
      padding: 6px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      font-weight: bold;
      margin-top: 8px;
    `
    scaleResetBtn.onclick = () => {
      if (selectedModel && selectedModelName) {
        selectedModel.scale.set(1, 1, 1)
        scaleSlider.value = 1
        scaleValue.textContent = '1.00'
        scaleInfo.textContent = 'Escala: 1.00x'
        this.saveCoordinates(selectedModelName, selectedModel)
      }
    }

    scaleSection.appendChild(scaleControls)
    scaleSection.appendChild(scaleResetBtn)
    panel.appendChild(scaleSection)
    this.scaleSection = scaleSection
    this.scaleSlider = scaleSlider
    this.scaleInfo = scaleInfo
    this.scaleValue = scaleValue

    // Botón de Reset para modelo seleccionado
    const resetModelSection = document.createElement('div')
    resetModelSection.id = 'reset-model-section'
    resetModelSection.style.cssText = `
      display: none;
      margin-bottom: 12px;
      padding: 10px;
      background: rgba(139, 69, 19, 0.2);
      border-radius: 6px;
      border-left: 4px solid #8b4513;
    `

    // Título Posición
    const positionTitle = document.createElement('h3')
    positionTitle.textContent = 'Posición'
    positionTitle.style.cssText = 'margin: 0 0 8px 0; color: #9ccf6b; font-size: 12px;'
    resetModelSection.appendChild(positionTitle)

    // Texto de posición (solo lectura, se actualiza automáticamente)
    const positionText = document.createElement('div')
    positionText.id = 'position-text'
    positionText.style.cssText = `
      font-size: 11px;
      color: #e4d9c3;
      margin-bottom: 10px;
      padding: 8px;
      background: rgba(58, 47, 36, 0.3);
      border-radius: 4px;
      font-family: monospace;
    `
    positionText.textContent = 'X: 0.0 | Y: 0.0 | Z: 0.0'
    resetModelSection.appendChild(positionText)
    this.positionText = positionText

    const resetModelBtn = document.createElement('button')
    resetModelBtn.textContent = 'Resetear Modelo'
    resetModelBtn.style.cssText = `
      width: 100%;
      background: #8b4513;
      color: #d3af6e;
      border: 2px solid #654321;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      font-weight: bold;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `
    resetModelBtn.onmouseenter = () => {
      resetModelBtn.style.background = '#a0522d'
      resetModelBtn.style.transform = 'translateY(-1px)'
      resetModelBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)'
    }
    resetModelBtn.onmouseleave = () => {
      resetModelBtn.style.background = '#8b4513'
      resetModelBtn.style.transform = 'translateY(0)'
      resetModelBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
    }
    resetModelBtn.onclick = () => {
      if (selectedModel && selectedModelName) {
        this.resetModelPosition(selectedModelName)
      }
    }
    resetModelSection.appendChild(resetModelBtn)
    panel.appendChild(resetModelSection)
    this.resetModelSection = resetModelSection

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

    // Botón de Reset All Positions
    const resetSection = document.createElement('div')
    resetSection.style.cssText = `
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #3a2f24;
    `

    const resetAllBtn = document.createElement('button')
    resetAllBtn.textContent = 'Resetear Todos los modelos'
    resetAllBtn.style.cssText = `
      width: 100%;
      background: #8b4513;
      color: #d3af6e;
      border: 2px solid #654321;
      padding: 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `
    resetAllBtn.onmouseenter = () => {
      resetAllBtn.style.background = '#a0522d'
      resetAllBtn.style.transform = 'translateY(-1px)'
      resetAllBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)'
    }
    resetAllBtn.onmouseleave = () => {
      resetAllBtn.style.background = '#8b4513'
      resetAllBtn.style.transform = 'translateY(0)'
      resetAllBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
    }
    resetAllBtn.onclick = () => {
      if (confirm('¿Estás seguro de que quieres resetear todas las posiciones, rotaciones y escalas de todos los modelos?')) {
        this.resetAllPositions()
      }
    }
    resetSection.appendChild(resetAllBtn)
    panel.appendChild(resetSection)

    // Sección de Exportar Posiciones
    const exportSection = document.createElement('div')
    exportSection.style.cssText = `
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #3a2f24;
    `

    const exportTitle = document.createElement('h3')
    exportTitle.textContent = 'Exportar Posiciones'
    exportTitle.style.cssText = 'margin: 0 0 8px 0; color: #9ccf6b; font-size: 12px;'
    exportSection.appendChild(exportTitle)

    const exportBtn = document.createElement('button')
    exportBtn.textContent = '📋 Exportar Código'
    exportBtn.style.cssText = `
      width: 100%;
      background: #4a6f46;
      color: #d3af6e;
      border: 1px solid #2e402a;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 10px;
    `
    exportBtn.onclick = () => this.exportPositions()
    exportSection.appendChild(exportBtn)

    // Área de código exportado
    const codeArea = document.createElement('textarea')
    codeArea.id = 'exported-code-area'
    codeArea.style.cssText = `
      width: 100%;
      min-height: 120px;
      background: #2a1f18;
      color: #9ccf6b;
      border: 1px solid #4a6f46;
      padding: 8px;
      border-radius: 4px;
      font-size: 10px;
      font-family: 'Courier New', monospace;
      resize: vertical;
      display: none;
      margin-bottom: 8px;
    `
    codeArea.readOnly = true
    exportSection.appendChild(codeArea)
    this.codeArea = codeArea

    // Botón para copiar código
    const copyCodeBtn = document.createElement('button')
    copyCodeBtn.textContent = '📄 Copiar Código'
    copyCodeBtn.style.cssText = `
      width: 100%;
      background: #5d4631;
      color: #d3af6e;
      border: 1px solid #4a6f46;
      padding: 6px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 10px;
      font-weight: bold;
      display: none;
      margin-bottom: 8px;
    `
    copyCodeBtn.onclick = () => {
      codeArea.select()
      document.execCommand('copy')
      copyCodeBtn.textContent = '✓ Copiado!'
      setTimeout(() => {
        copyCodeBtn.textContent = '📄 Copiar Código'
      }, 2000)
    }
    exportSection.appendChild(copyCodeBtn)
    this.copyCodeBtn = copyCodeBtn

    panel.appendChild(exportSection)

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

    if (selectedModelName && selectedModel) {
      const scale = selectedModel.scale.x.toFixed(2)
      selectionInfo.innerHTML = `
        <p><strong>Seleccionado:</strong> ${selectedModelName}</p>
        <p style="font-size:11px; color:#b8a98a; margin: 4px 0;">
          Pos: (${selectedModel.position.x.toFixed(1)}, ${selectedModel.position.y.toFixed(1)}, ${selectedModel.position.z.toFixed(1)})
        </p>
        <p style="font-size:11px; color:#b8a98a; margin: 4px 0;">
          Escala: ${scale}x | Mover: WASD | Rotar: IJKL | Tamaño: R/F | T deseleccionar
        </p>
      `
      selectionInfo.style.borderLeftColor = '#9ccf6b'
      selectionInfo.style.background = 'rgba(74,111,70,0.25)'
      
      // Mostrar controles de escala
      this.scaleSection.style.display = 'block'
      this.scaleSlider.value = selectedModel.scale.x
      this.scaleValue.textContent = scale
      this.scaleInfo.textContent = `Escala: ${scale}x`
      
      // Mostrar botón de reset del modelo y actualizar texto de posición
      if (this.resetModelSection) {
        this.resetModelSection.style.display = 'block'
        if (this.positionText) {
          this.positionText.textContent = `X: ${selectedModel.position.x.toFixed(1)} | Y: ${selectedModel.position.y.toFixed(1)} | Z: ${selectedModel.position.z.toFixed(1)}`
        }
      }
    } else {
      selectionInfo.innerHTML = `
        <p><strong>Estado:</strong> Ningún modelo seleccionado</p>
        <p style="margin:0; font-size:11px; color:#b8a98a;">Doble clic para seleccionar</p>
      `
      selectionInfo.style.borderLeftColor = '#4a6f46'
      selectionInfo.style.background = 'rgba(77,56,35,0.25)'
      
      // Ocultar controles de escala
      this.scaleSection.style.display = 'none'
      
      // Ocultar botón de reset del modelo
      if (this.resetModelSection) {
        this.resetModelSection.style.display = 'none'
      }
    }

    this.updateModelList()
  }

  updateModelList() {
    const modelList = document.getElementById('model-list')
    modelList.innerHTML = ''

    Object.entries(this.modelRegistry).forEach(([name, model]) => {
      const active = selectedModelName === name
      const scale = model.scale.x.toFixed(2)

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

      modelItem.innerHTML = `
        <div style="font-weight: ${active ? 'bold' : 'normal'}; margin-bottom: 2px;">${name}</div>
        <div style="font-size: 10px; color: #b8a98a;">
          Pos: (${model.position.x.toFixed(1)}, ${model.position.y.toFixed(1)}, ${model.position.z.toFixed(1)}) | Escala: ${scale}x
        </div>
      `

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

  // Helper function to check if an object is a descendant of a model
  isDescendantOf(parent, child) {
    let current = child
    while (current.parent) {
      if (current.parent === parent) return true
      current = current.parent
    }
    return false
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
        
        // Traverse up the hierarchy to find the root model
        while (clicked.parent && clicked.parent !== this.scene) {
          clicked = clicked.parent
        }

        // Find which registered model contains this object
        for (const [name, model] of Object.entries(this.modelRegistry)) {
          if (model === clicked || this.isDescendantOf(model, clicked)) {
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
      if (key === '0' && selectedModel && selectedModelName) {
        this.resetModelPosition(selectedModelName)
      }
    })

    // KEYUP → GUARDAR POSICIÓN + ROTACIÓN
    window.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase()
      keys[key] = false

      if (!selectedModel || !selectedModelName) return

      const validKeys = ['w','a','s','d','q','e','i','j','k','l','r','f']

      if (validKeys.includes(key)) {
        this.saveCoordinates(selectedModelName, selectedModel)
      }
    })
  }

  // ============================================================
  // RESET POSITIONS
  // ============================================================
  resetModelPosition(modelName) {
    const model = this.modelRegistry[modelName]
    if (!model) return

    // Resetear el modelo a valores por defecto
    model.position.set(0, 0, 0)
    model.rotation.set(0, 0, 0)
    model.scale.set(1, 1, 1)

    // Eliminar del localStorage
    const all = JSON.parse(localStorage.getItem('modelPositions') || '{}')
    delete all[modelName]
    localStorage.setItem('modelPositions', JSON.stringify(all))
    console.log(`✓ Reset ${modelName} position, rotation and scale`)

    // Actualizar UI
    this.updateSelectionPanel()
    this.updateModelList()
  }

  resetAllPositions() {
    // Limpiar localStorage
    localStorage.removeItem('modelPositions')
    
    // Helper function to apply transform
    const applyTransform = (model, data) => {
      if (data.position) model.position.set(data.position.x, data.position.y, data.position.z)
      if (data.rotation) model.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z)
      if (data.scale) model.scale.set(data.scale.x, data.scale.y, data.scale.z)
    }
    
    // Si hay posiciones predeterminadas, usarlas; si no, resetear a valores por defecto
    if (this.defaultPositions && Object.keys(this.defaultPositions).length > 0) {
      Object.entries(this.defaultPositions).forEach(([name, data]) => {
        const model = this.modelRegistry[name]
        if (model) applyTransform(model, data)
      })
      console.log('✓ All positions reset to default positions')
    } else {
      // Resetear todos los modelos a valores por defecto (0,0,0 y escala 1)
      Object.values(this.modelRegistry).forEach((model) => {
        model.position.set(0, 0, 0)
        model.rotation.set(0, 0, 0)
        model.scale.set(1, 1, 1)
      })
      console.log('✓ All positions, rotations and scales reset to default')
    }

    // Si hay un modelo seleccionado, actualizar su UI
    if (selectedModel && selectedModelName) {
      this.updateSelectionPanel()
    }

    // Actualizar la lista de modelos
    this.updateModelList()

    // Deseleccionar modelo actual
    this.deselectModel()
  }

  // ============================================================
  // EXPORTAR POSICIONES
  // ============================================================
  exportPositions() {
    // Obtener todas las posiciones actuales de los modelos del registro
    const allPositions = {}
    
    Object.entries(this.modelRegistry).forEach(([name, model]) => {
      allPositions[name] = {
        position: {
          x: model.position.x,
          y: model.position.y,
          z: model.position.z
        },
        rotation: {
          x: model.rotation.x,
          y: model.rotation.y,
          z: model.rotation.z
        },
        scale: {
          x: model.scale.x,
          y: model.scale.y,
          z: model.scale.z
        }
      }
    })
    
    if (Object.keys(allPositions).length === 0) {
      alert('No hay modelos registrados para exportar')
      return
    }

    // Generar código JavaScript para copiar (formato para modelPositions.js)
    let code = '// Posiciones predeterminadas de los modelos\n'
    code += '// Este archivo contiene las posiciones, rotaciones y escalas iniciales de todos los modelos\n\n'
    code += 'export const defaultModelPositions = ' + JSON.stringify(allPositions, null, 2) + ';\n'


    // Mostrar en el área de código
    this.codeArea.value = code
    this.codeArea.style.display = 'block'
    this.copyCodeBtn.style.display = 'block'

    // Copiar código al portapapeles automáticamente
    this.codeArea.select()
    document.execCommand('copy')
    
    // Feedback visual
    const originalText = this.copyCodeBtn.textContent
    this.copyCodeBtn.textContent = '✓ Copiado al portapapeles!'
    setTimeout(() => {
      this.copyCodeBtn.textContent = originalText
    }, 2000)

    console.log('=== CÓDIGO EXPORTADO ===')
    console.log('Código copiado al portapapeles')
    console.log(code)
  }

  // ============================================================
  // LOCAL STORAGE (POS + ROTACIÓN + ESCALA)
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
      },
      scale: {
        x: model.scale.x,
        y: model.scale.y,
        z: model.scale.z
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
    
    // No aplicar posiciones aquí, se hará en main.js después de registrar todos
    // Solo establecer escala por defecto si no hay datos guardados
    const saved = this.loadCoordinates(name)
    if (!saved) {
      // Si no hay datos guardados, establecer escala por defecto
      model.scale.set(1, 1, 1)
    }

    this.updateSelectionPanel()
  }

  // ============================================================
  // MOVIMIENTO + ROTACIÓN (IJKL) + ESCALA (R/F)
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

    // Actualizar texto de posición en tiempo real
    if (this.positionText) {
      this.positionText.textContent = `X: ${selectedModel.position.x.toFixed(1)} | Y: ${selectedModel.position.y.toFixed(1)} | Z: ${selectedModel.position.z.toFixed(1)}`
    }

    // Rotación IJKL
    if (keys['i']) selectedModel.rotation.x -= rotSpeed
    if (keys['k']) selectedModel.rotation.x += rotSpeed
    if (keys['j']) selectedModel.rotation.y += rotSpeed
    if (keys['l']) selectedModel.rotation.y -= rotSpeed

    // Escala R/F
    if (keys['r']) {
      const newScale = Math.min(5, selectedModel.scale.x + scaleSpeed)
      selectedModel.scale.set(newScale, newScale, newScale)
      if (this.scaleSlider) {
        this.scaleSlider.value = newScale
        this.scaleValue.textContent = newScale.toFixed(2)
        this.scaleInfo.textContent = `Escala: ${newScale.toFixed(2)}x`
      }
    }
    if (keys['f']) {
      const newScale = Math.max(0.01, selectedModel.scale.x - scaleSpeed)
      selectedModel.scale.set(newScale, newScale, newScale)
      if (this.scaleSlider) {
        this.scaleSlider.value = newScale
        this.scaleValue.textContent = newScale.toFixed(2)
        this.scaleInfo.textContent = `Escala: ${newScale.toFixed(2)}x`
      }
    }
  }
}

export function initModelUI(scene, camera, modelRegistry, controls, defaultPositions = null) {
  const ui = new ModelUI(scene, camera, modelRegistry, controls, defaultPositions)
  ui.updateSelectionPanel()
  return ui
}
