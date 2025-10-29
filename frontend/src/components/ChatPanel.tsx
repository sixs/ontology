import React from 'react';
import './ChatPanel.css';

interface ChatPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isCollapsed, onToggle }) => {
  return (
    <div className={`chat-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-button" onClick={onToggle}>
        {isCollapsed ? '◀' : '▶'}
      </button>
      <div className="chat-iframe-container">
        <iframe 
          src={process.env.REACT_APP_AI_ASSISTANT_URL || "http://10.159.200.245:5918/chat/88OkcGe2dK8IVFki"} 
          className="chat-iframe"
          title="AI Assistant"
          frameBorder="0"
          allow="microphone"
        />
      </div>
    </div>
  );
};

export default ChatPanel;