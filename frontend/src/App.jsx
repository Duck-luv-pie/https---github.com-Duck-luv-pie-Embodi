import React, { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [selectedMode, setSelectedMode] = useState('text') // 'art' or 'text'
  const [selectedTool, setSelectedTool] = useState('select') // 'select', 'move', 'eraser', 'text', 'rectangle'
  const [textInput, setTextInput] = useState('')
  const [isMicOn, setIsMicOn] = useState(false) // microphone toggle state
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [textBoxes, setTextBoxes] = useState([])
  const [selectedTextBox, setSelectedTextBox] = useState(null)
  const [selectedTextBoxes, setSelectedTextBoxes] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 })
  const whiteboardRef = useRef(null)

  const textareaRefs = useRef({})

  // 1. Add state for resizing
  const [resizingBoxId, setResizingBoxId] = useState(null)
  const [resizeStart, setResizeStart] = useState(null)

  // 1. Add state for moving
  const [movingBoxId, setMovingBoxId] = useState(null)
  const [moveStart, setMoveStart] = useState(null)

  useEffect(() => {
    textBoxes.forEach(box => {
      if (box.isEditing && textareaRefs.current[box.id]) {
        textareaRefs.current[box.id].focus()
      }
    })
  }, [textBoxes])

  // 2. Resize handlers
  const handleResizeMouseDown = (e, textBoxId) => {
    e.stopPropagation()
    setResizingBoxId(textBoxId)
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      ...textBoxes.find(box => box.id === textBoxId)
    })
  }

  useEffect(() => {
    if (!resizingBoxId) return
    const handleMouseMove = (e) => {
      if (!resizeStart) return
      const dx = (e.clientX - resizeStart.mouseX) / scale
      const dy = (e.clientY - resizeStart.mouseY) / scale
      setTextBoxes(prev => prev.map(box => {
        if (box.id !== resizingBoxId) return box
        const minWidth = 100
        const minHeight = 60
        return {
          ...box,
          width: Math.max(minWidth, resizeStart.width + dx),
          height: Math.max(minHeight, resizeStart.height + dy)
        }
      }))
    }
    const handleMouseUp = () => {
      setResizingBoxId(null)
      setResizeStart(null)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingBoxId, resizeStart, scale])

  // 3. Move handlers
  const handleBoxMouseDown = (e, textBoxId) => {
    // Only left button, only with select tool, not on resize handle or textarea
    if (selectedTool !== 'select' || e.button !== 0) return
    // Prevent drag if clicking inside textarea or resize handle
    if (e.target.className === 'resize-handle' || e.target.tagName === 'TEXTAREA') return
    // Only allow drag if this box is selected
    if (!selectedTextBoxes.includes(textBoxId)) return
    e.stopPropagation()
    setMovingBoxId(textBoxId)
    setMoveStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      boxes: textBoxes.filter(box => selectedTextBoxes.includes(box.id)).map(box => ({ id: box.id, x: box.x, y: box.y }))
    })
  }

  useEffect(() => {
    if (!movingBoxId) return
    const handleMouseMove = (e) => {
      if (!moveStart) return
      const dx = (e.clientX - moveStart.mouseX) / scale
      const dy = (e.clientY - moveStart.mouseY) / scale
      setTextBoxes(prev => prev.map(box => {
        const moving = moveStart.boxes.find(b => b.id === box.id)
        if (!moving) return box
        return {
          ...box,
          x: moving.x + dx,
          y: moving.y + dy
        }
      }))
    }
    const handleMouseUp = () => {
      setMovingBoxId(null)
      setMoveStart(null)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [movingBoxId, moveStart, scale])

  const handleModeSelect = (mode) => {
    setSelectedMode(mode)
    if (mode === 'art') {
      setSelectedTool('select') // Auto-select 'select' when switching to art mode
    }
  }

  const handleToolSelect = (tool) => {
    setSelectedTool(tool)
  }

  const handleTextChange = (e) => {
    setTextInput(e.target.value)
  }

  const handleSendMessage = () => {
    if (textInput.trim()) {
      console.log('Sending message:', textInput)
      setTextInput('')
    }
  }

  const handleMicToggle = () => {
    setIsMicOn(!isMicOn)
  }

  const handleMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (selectedMode === 'art' && selectedTool === 'text') {
      const { x, y } = getWhiteboardCoords(e.clientX, e.clientY)
      setIsDrawing(true)
      setStartPos({ x, y })
    } else if (selectedMode === 'art' && selectedTool === 'select') {
      // Check if clicking on a text box
      const clickedTextBox = textBoxes.find(box => 
        x >= box.x && x <= box.x + box.width &&
        y >= box.y && y <= box.y + box.height
      )

      if (clickedTextBox) {
        if (e.shiftKey) {
          // Multi-select with shift
          setSelectedTextBoxes(prev => 
            prev.includes(clickedTextBox.id) 
              ? prev.filter(id => id !== clickedTextBox.id)
              : [...prev, clickedTextBox.id]
          )
        } else {
          // Single select and start dragging
          setSelectedTextBoxes([clickedTextBox.id])
          setIsDragging(true)
          setDragOffset({ 
            x: x - clickedTextBox.x, 
            y: y - clickedTextBox.y 
          })
        }
      } else {
        // Start selection box
        setIsDrawing(true)
        setStartPos({ x, y })
        setSelectedTextBoxes([])
      }
    }
  }

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (isDrawing && selectedMode === 'art' && selectedTool === 'text') {
      // Handle drawing preview if needed
    } else if (isDrawing && selectedMode === 'art' && selectedTool === 'select') {
      // Update selection box
      const width = Math.abs(x - startPos.x)
      const height = Math.abs(y - startPos.y)
      // setSelectionBox({
      //   x: Math.min(startPos.x, x),
      //   y: Math.min(startPos.y, y),
      //   width,
      //   height
      // })
    } else if (isDragging && selectedTextBoxes.length > 0) {
      // Move selected text boxes
      setTextBoxes(prev => prev.map(box => {
        if (selectedTextBoxes.includes(box.id)) {
          return {
            ...box,
            x: x - dragOffset.x,
            y: y - dragOffset.y
          }
        }
        return box
      }))
    }
  }

  const handleMouseUp = (e) => {
    if (isDrawing && selectedMode === 'art' && selectedTool === 'text') {
      const { x, y } = getWhiteboardCoords(e.clientX, e.clientY)
      
      const width = Math.abs(x - startPos.x)
      const height = Math.abs(y - startPos.y)
      
      // Minimum size constraints
      const minWidth = 100
      const minHeight = 60
      
      const finalWidth = Math.max(width, minWidth)
      const finalHeight = Math.max(height, minHeight)
      
      const newTextBox = {
        id: Date.now(),
        x: Math.min(startPos.x, x),
        y: Math.min(startPos.y, y),
        width: finalWidth,
        height: finalHeight,
        text: '',
        isEditing: true
      }
      
      setTextBoxes([...textBoxes, newTextBox])
      setSelectedTextBox(newTextBox.id)
      setIsDrawing(false)
    } else if (isDrawing && selectedMode === 'art' && selectedTool === 'select') {
      // Complete selection box and select text boxes within it
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const selectionEndX = Math.min(startPos.x, x)
      const selectionEndY = Math.min(startPos.y, y)
      const selectionWidth = Math.abs(x - startPos.x)
      const selectionHeight = Math.abs(y - startPos.y)
      
      // Find text boxes that intersect with the selection box
      const selectedIds = textBoxes
        .filter(box => {
          const boxRight = box.x + box.width
          const boxBottom = box.y + box.height
          const selectionRight = selectionEndX + selectionWidth
          const selectionBottom = selectionEndY + selectionHeight
          
          return !(box.x > selectionRight || 
                   boxRight < selectionEndX || 
                   box.y > selectionBottom || 
                   boxBottom < selectionEndY)
        })
        .map(box => box.id)
      
      setSelectedTextBoxes(selectedIds)
      setIsDrawing(false)
    } else if (isDragging) {
      setIsDragging(false)
    }
  }

  const handleTextBoxClick = (textBoxId) => {
    if (selectedTool === 'select') {
      setSelectedTextBoxes([textBoxId])
    } else if (selectedTool === 'eraser') {
      setTextBoxes(textBoxes.filter(box => box.id !== textBoxId))
      setSelectedTextBoxes(selectedTextBoxes.filter(id => id !== textBoxId))
    } else if (selectedTool === 'text') {
      // In text mode, clicking a text box allows editing
      setSelectedTextBox(textBoxId)
      setTextBoxes(textBoxes.map(box => 
        box.id === textBoxId ? { ...box, isEditing: true } : box
      ))
    }
  }

  const handleTextBoxEdit = (textBoxId) => {
    setTextBoxes(textBoxes.map(box =>
      box.id === textBoxId ? { ...box, isEditing: true } : box
    ))
  }

  const handleTextBoxChange = (textBoxId, newText) => {
    setTextBoxes(textBoxes.map(box => 
      box.id === textBoxId ? { ...box, text: newText } : box
    ))
  }

  const handleTextBoxBlur = (textBoxId) => {
    setTextBoxes(textBoxes.map(box => 
      box.id === textBoxId ? { ...box, isEditing: false } : box
    ))
    // Only clear selection if not in select mode
    if (selectedTool !== 'select') {
      setSelectedTextBox(null)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Delete' && selectedTextBoxes.length > 0 && selectedTool === 'select') {
      setTextBoxes(textBoxes.filter(box => !selectedTextBoxes.includes(box.id)))
      setSelectedTextBoxes([])
    }
  }

  const handleCanvasClick = (e) => {
    // If clicking on the canvas (not on a text box), deselect current text box
    if (e.target.className.includes('canvas-area')) {
      setSelectedTextBox(null)
      setTextBoxes(textBoxes.map(box => ({ ...box, isEditing: false })))
    }
  }

  const getFloatingButtonText = () => {
    if (selectedMode === 'text') {
      return 'Text Tool'
    }
    switch (selectedTool) {
      case 'select':
        return 'Select Tool'
      case 'move':
        return 'Move Tool'
      case 'eraser':
        return 'Eraser Tool'
      case 'text':
        return 'Text Tool'
      case 'rectangle':
        return 'Rectangle Tool'
      default:
        return 'Select Tool'
    }
  }

  // Wheel handler for panning and pinch-to-zoom
  const handleWheel = (e) => {
    // Pinch-to-zoom (trackpad, ctrlKey)
    if (e.ctrlKey) {
      e.preventDefault()
      let newScale = scale - e.deltaY * 0.002
      newScale = Math.max(0.1, Math.min(10, newScale))
      setScale(newScale)
      return
    }
    // Normal panning
    setOffset(prev => ({
      x: prev.x - e.deltaX,
      y: prev.y - e.deltaY
    }))
  }

  const getWhiteboardCoords = (clientX, clientY) => {
    const rect = whiteboardRef.current.getBoundingClientRect()
    // Get mouse position relative to center of whiteboard
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    // Adjust for pan and zoom
    const x = (clientX - centerX - offset.x) / scale
    const y = (clientY - centerY - offset.y) / scale
    return { x, y }
  }

  const handleEnhancePrompt = async () => {
    const selectedBox = textBoxes.find(box => selectedTextBoxes.includes(box.id));
    if (!selectedBox || !selectedBox.text.trim()) return;

    try {
      const response = await fetch('http://localhost:8000/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: selectedBox.text })
      });

      const data = await response.json();

      if (data.enhanced_prompt) {
        setTextBoxes(prev =>
          prev.map(box =>
            box.id === selectedBox.id ? { ...box, text: data.enhanced_prompt } : box
          )
        );
      }
    } catch (error) {
      console.error('Enhance prompt failed:', error);
    }
  };

  // Add handleGenerateImage function
  const handleGenerateImage = async () => {
    const selectedBox = textBoxes.find(box => selectedTextBoxes.includes(box.id));
    if (!selectedBox) {
      console.log("🚫 No text box selected");
      return;
    }
    if (!selectedBox.text.trim()) {
      console.log("🚫 Selected text box is empty");
      return;
    }

    console.log("📤 Sending request to generate-image with prompt:", selectedBox.text);
    try {
      const response = await fetch("http://localhost:8000/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: selectedBox.text })
      });

      const data = await response.json();

      if (data.image_base64) {
        setTextBoxes(prev =>
          prev.map(box =>
            box.id === selectedBox.id
              ? { ...box, image: `data:image/png;base64,${data.image_base64}`, text: '' }
              : box
          )
        );
      }
    } catch (err) {
      console.error("Image generation failed:", err);
    }
  };

  return (
    <div className="canvas-container">
      {/* Top Toolbar */}
      <div className="top-toolbar">
        <div className="toolbar-left">
          <button className="mode-button mode-grey">
            Menu
          </button>
          <button className="mode-button mode-grey">
            Undo
          </button>
          <button className="mode-button mode-grey">
            Redo
          </button>
          <button className="mode-button mode-grey">
            Save
          </button>
        </div>
        <div className="toolbar-right">
          <button className="mode-button mode-grey" onClick={handleEnhancePrompt}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Enhance Prompt
          </button>
          <button className="mode-button mode-3d" onClick={handleGenerateImage}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="3.27,6.96 12,12.01 20.73,6.96" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="22.08" x2="12" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Image
          </button>
          <button className="mode-button mode-3d">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="3.27,6.96 12,12.01 20.73,6.96" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="22.08" x2="12" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            3D
          </button>
          <button className="mode-button mode-vr">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h6a2 2 0 0 1 2 2v4m-8-6v6m0 0v6m0-6h6m-6 0H1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            VR
          </button>
        </div>
      </div>

      {/* Left Floating Button */}
      <button className="floating-button">
        {getFloatingButtonText()}
      </button>

      {/* Canvas Area */}
      <div 
        ref={whiteboardRef}
        className="whiteboard"
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
          background: 'white',
          touchAction: 'none',
        }}
        onWheel={handleWheel}
      >
        <div
          className="canvas-area"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            overflow: 'visible',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div
            className="whiteboard-content"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
          >
            {/* Central Logo Section */}
            <div className="logo-section">
              <img
                src="https://via.placeholder.com/80x80?text=Logo"
                alt="Logo Placeholder"
                style={{ width: 80, height: 80, borderRadius: 12, background: '#eee', objectFit: 'cover' }}
              />
              <h1 className="logo-title">Embodi</h1>
              <p className="logo-subtitle">Describe. Upload. Become.</p>
            </div>
            {/* Text Boxes */}
            {textBoxes.map((textBox) => (
              <div
                key={textBox.id}
                className={`text-box ${selectedTextBoxes.includes(textBox.id) ? 'selected' : ''}`}
                style={{
                  position: 'absolute',
                  left: textBox.x,
                  top: textBox.y,
                  width: textBox.width,
                  height: textBox.height,
                  border: selectedTextBoxes.includes(textBox.id) ? '2px solid #007AFF' : '1px solid #CCC',
                  backgroundColor: 'white',
                  cursor: selectedTool === 'select' ? 'move' : 'text'
                }}
                onClick={() => handleTextBoxClick(textBox.id)}
                onDoubleClick={selectedTool === 'select' ? () => handleTextBoxEdit(textBox.id) : undefined}
                onMouseDown={e => handleBoxMouseDown(e, textBox.id)}
              >
                {textBox.image ? (
                  <img 
                    src={textBox.image} 
                    alt="Generated" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : textBox.isEditing ? (
                  <textarea
                    ref={el => textareaRefs.current[textBox.id] = el}
                    value={textBox.text}
                    onChange={(e) => handleTextBoxChange(textBox.id, e.target.value)}
                    onBlur={() => handleTextBoxBlur(textBox.id)}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      padding: '4px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      color: 'black'
                    }}
                    autoFocus
                  />
                ) : (
                  <div style={{ 
                    padding: '4px', 
                    fontFamily: 'Inter, sans-serif', 
                    fontSize: '14px',
                    color: 'black'
                  }}>
                    {textBox.text || 'Click to edit'}
                  </div>
                )}
                <div
                  className="resize-handle"
                  onMouseDown={e => handleResizeMouseDown(e, textBox.id)}
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 16,
                    height: 16,
                    cursor: 'nwse-resize',
                    background: 'rgba(0,0,0,0.08)',
                    borderRadius: '0 0 4px 0',
                    zIndex: 2
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Bottom Tool Selection Panel */}
        <div className="tool-panel">
          <div className="tool-section">
            <button 
              className={`tool-button ${selectedMode === 'art' ? 'tool-selected' : ''}`}
              onClick={() => handleModeSelect('art')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={selectedMode === 'art' ? 'white' : 'black'}/>
              </svg>
              Art
            </button>
            <button 
              className={`tool-button ${selectedMode === 'text' ? 'tool-selected' : ''}`}
              onClick={() => handleModeSelect('text')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={selectedMode === 'text' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Text
            </button>
          </div>
          <div className="tool-divider"></div>
          {selectedMode === 'art' ? (
            <div className="tool-section">
              <button 
                className={`tool-button ${selectedTool === 'select' ? 'tool-selected' : ''}`}
                onClick={() => handleToolSelect('select')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke={selectedTool === 'select' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 13l6 6" stroke={selectedTool === 'select' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Select
              </button>
              <button 
                className={`tool-button ${selectedTool === 'move' ? 'tool-selected' : ''}`}
                onClick={() => handleToolSelect('move')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke={selectedTool === 'move' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Move
              </button>
              <button 
                className={`tool-button ${selectedTool === 'eraser' ? 'tool-selected' : ''}`}
                onClick={() => handleToolSelect('eraser')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke={selectedTool === 'eraser' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="15,3 21,3 21,9" stroke={selectedTool === 'eraser' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="10" y1="14" x2="21" y2="3" stroke={selectedTool === 'eraser' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Eraser
              </button>
              <button 
                className={`tool-button ${selectedTool === 'text' ? 'tool-selected' : ''}`}
                onClick={() => handleToolSelect('text')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={selectedTool === 'text' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" stroke={selectedTool === 'text' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="13" x2="8" y2="13" stroke={selectedTool === 'text' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="17" x2="8" y2="17" stroke={selectedTool === 'text' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="10,9 9,9 8,9" stroke={selectedTool === 'text' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Text
              </button>
              <button 
                className={`tool-button ${selectedTool === 'rectangle' ? 'tool-selected' : ''}`}
                onClick={() => handleToolSelect('rectangle')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke={selectedTool === 'rectangle' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Rectangle
              </button>
            </div>
          ) : (
            <div className="text-input-section">
              <input
                type="text"
                placeholder="Describe what you want to create..."
                value={textInput}
                onChange={handleTextChange}
                className="text-input"
              />
              <button 
                className={`voice-button ${isMicOn ? 'voice-button-active' : ''}`}
                onClick={handleMicToggle}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke={isMicOn ? '#FF4444' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={isMicOn ? '#FF4444' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="19" x2="12" y2="23" stroke={isMicOn ? '#FF4444' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="8" y1="23" x2="16" y2="23" stroke={isMicOn ? '#FF4444' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                className={`send-button ${textInput.trim() ? 'send-button-active' : ''}`}
                onClick={handleSendMessage}
                disabled={!textInput.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={textInput.trim() ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
        </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
