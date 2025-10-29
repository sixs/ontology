import React, { useState } from 'react';
import './Sidebar.css';

interface SidebarProps {
  onFileManagerToggle: () => void;
  onAIToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onFileManagerToggle, onAIToggle }) => {
  const [isFileManagerExpanded, setIsFileManagerExpanded] = useState(false);

  const handleFileManagerClick = () => {
    onFileManagerToggle();
  };

  const handleAIClick = () => {
    onAIToggle();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-icons">
        <div 
          className={`sidebar-icon file-manager-icon ${isFileManagerExpanded ? 'active' : ''}`}
          onClick={handleFileManagerClick}
          title="本体标准版本管理"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div 
          className="sidebar-icon ai-icon"
          onClick={handleAIClick}
          title="AI助手"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
            <circle cx="10" cy="10" r="1" fill="currentColor"/>
            <circle cx="14" cy="10" r="1" fill="currentColor"/>
            <path d="M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <rect x="8" y="2" width="8" height="2" rx="1" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;