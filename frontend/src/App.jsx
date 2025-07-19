import { useState } from 'react'
import './App.css'

function App() {
  const [selectedMode, setSelectedMode] = useState('text') // 'art' or 'text'
  const [selectedTool, setSelectedTool] = useState('select') // 'select', 'move', 'eraser', 'text', 'rectangle'
  const [textInput, setTextInput] = useState('')

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

  return (
    <div className="canvas-container">
      {/* Top Toolbar */}
      <div className="top-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <line x1="3" y1="6" x2="21" y2="6" stroke="black" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="12" x2="21" y2="12" stroke="black" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="18" x2="21" y2="18" stroke="black" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="toolbar-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 14l-6-6 6-6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="toolbar-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 14l6-6-6-6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="toolbar-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="black" strokeWidth="2"/>
              <rect x="7" y="7" width="10" height="2" stroke="black" strokeWidth="2"/>
              <rect x="7" y="11" width="10" height="2" stroke="black" strokeWidth="2"/>
              <rect x="7" y="15" width="6" height="2" stroke="black" strokeWidth="2"/>
            </svg>
          </button>
        </div>
        <div className="toolbar-right">
          <button className="mode-button mode-3d">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h6a2 2 0 0 1 2 2v4m-8-6v6m0 0v6m0-6h6m-6 0H1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            3D
          </button>
          <button className="mode-button mode-vr">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="3.27,6.96 12,12.01 20.73,6.96" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="22.08" x2="12" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            VR
          </button>
        </div>
      </div>

      {/* Left Floating Button */}
      <button className="floating-button">
        {getFloatingButtonText()}
      </button>

      {/* Central Logo Section */}
      <div className="logo-section">
        <div className="palette-icon">
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
            {/* Palette base */}
            <ellipse cx="50" cy="50" rx="35" ry="25" fill="#8B4513" stroke="#654321" strokeWidth="2"/>
            {/* Paint dabs */}
            <circle cx="35" cy="40" r="6" fill="#FF6B6B"/>
            <circle cx="45" cy="35" r="6" fill="#4ECDC4"/>
            <circle cx="55" cy="40" r="6" fill="#FFE66D"/>
            <circle cx="65" cy="45" r="6" fill="#FF8E53"/>
            <circle cx="40" cy="50" r="6" fill="#A8E6CF"/>
            <circle cx="50" cy="55" r="6" fill="#FFFFFF"/>
            {/* Thumb hole */}
            <ellipse cx="50" cy="70" rx="8" ry="12" fill="#8B4513" stroke="#654321" strokeWidth="2"/>
          </svg>
        </div>
        <h1 className="logo-title">Embodi</h1>
        <p className="logo-subtitle">Describe. Upload. Become.</p>
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
              className={`send-button ${textInput.trim() ? 'send-button-active' : ''}`}
              onClick={handleSendMessage}
              disabled={!textInput.trim()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="voice-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
