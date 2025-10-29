import React, { useState, useEffect } from 'react';
import { createVersion, visualizeData } from '../services/api';
import GraphView from './GraphView';
import TreeViewer from './TreeViewer';
import TableView from './TableView';
import './Editor.css';

type Version = {
  id?: number;
  name: string;
  description: string;
  ontology_data?: string;
  created_at?: string;
  updated_at?: string;
};

type EditorProps = {
  content: string;
  editorContent?: string;
  setEditorContent?: (content: string) => void;
  selectedVersion?: Version;
  versionCreatedAt?: string;
  versionUpdatedAt?: string;
  viewMode?: 'source' | 'visual' | 'compare';
  onToggleViewMode?: (mode: 'source' | 'visual' | 'compare') => void;
  visualMode?: 'graph' | 'tree' | 'table';
  onToggleVisualMode?: (mode: 'graph' | 'tree' | 'table') => void;
  graphData?: any;
  onFileUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSave?: (version: Version) => void; // 修改onSave的类型定义
  isEditing?: boolean;
  onEditToggle?: (isEditing: boolean) => void;
  onCreateVersion?: (version: Version) => Promise<any>; // 添加创建版本的回调函数
  onFullscreenToggle?: (isFullscreen: boolean) => void; // 添加全屏切换回调函数
  onValidate?: () => void; // 添加本体数据校验回调函数
};

const Editor: React.FC<EditorProps> = ({ content, editorContent, setEditorContent, selectedVersion, versionCreatedAt, versionUpdatedAt, viewMode, onToggleViewMode, visualMode, onToggleVisualMode, onFileUpload, onSave, isEditing, onEditToggle, onCreateVersion, onFullscreenToggle, onValidate, graphData }) => {
  const [internalEditorContent, setInternalEditorContent] = React.useState<string>(content);
  const effectiveEditorContent = editorContent !== undefined ? editorContent : internalEditorContent;
  const setEffectiveEditorContent = setEditorContent || setInternalEditorContent;
  const [lineCount, setLineCount] = React.useState<number>(1);
  const [currentLine, setCurrentLine] = React.useState<number>(1);
  const [currentColumn, setCurrentColumn] = React.useState<number>(1);
  
  // 添加状态来管理版本名称和描述的编辑
  const [localIsEditing, setLocalIsEditing] = React.useState<boolean>(isEditing || false);
  const [editedVersionName, setEditedVersionName] = React.useState<string>('');
  const [editedVersionDescription, setEditedVersionDescription] = React.useState<string>('');
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);
  
  // 监听isEditing属性的变化，同步到本地状态
  // 同时处理selectedVersion为null的情况，确保在没有版本时也能正确设置编辑状态
  React.useEffect(() => {
    if (selectedVersion && Object.keys(selectedVersion).length === 0) {
      // 当selectedVersion为空对象时，设置为编辑状态
      setLocalIsEditing(true);
    } else {
      setLocalIsEditing(isEditing || false);
    }
  }, [isEditing, selectedVersion]);
  
  // 更新本地状态时通知父组件
  const setIsEditing = (editing: boolean) => {
    setLocalIsEditing(editing);
    if (onEditToggle) {
      onEditToggle(editing);
    }
  };
  
  React.useEffect(() => {
    if (setEditorContent) {
      setEditorContent(content);
    }
    // 计算行数
    const lines = content.split('\n');
    setLineCount(lines.length);
    
    // 重置光标位置信息
    const currentLineNumber = 1;
    const currentColumnNumber = 1;
    
    setCurrentLine(currentLineNumber);
    setCurrentColumn(currentColumnNumber);
    
    // 初始化编辑状态
    if (selectedVersion) {
      setEditedVersionName(selectedVersion.name);
      setEditedVersionDescription(selectedVersion.description);
    }
  }, [content, selectedVersion]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEffectiveEditorContent(e.target.value);
    // 更新行列信息
    const text = e.target.value;
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLineNumber = lines.length;
    const currentColumnNumber = lines[lines.length - 1].length + 1;
    
    setCurrentLine(currentLineNumber);
    setCurrentColumn(currentColumnNumber);
    
    // 更新总行数
    const totalLines = text.split('\n').length;
    setLineCount(totalLines);
  };
  
  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // 更新行列信息
    const text = e.target.value;
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLineNumber = lines.length;
    const currentColumnNumber = lines[lines.length - 1].length + 1;
    
    setCurrentLine(currentLineNumber);
    setCurrentColumn(currentColumnNumber);
  };
  
  const handleSave = async () => {
    if (selectedVersion) {
      // 创建更新后的版本对象
      const updatedVersion = {
        ...selectedVersion,
        name: editedVersionName,
        description: editedVersionDescription,
        // 使用统一的ontology_data字段
        ontology_data: editorContent
      };
      
      // 调用父组件传递的onSave回调函数
      try {
        if (typeof onSave === 'function') {
          await onSave(updatedVersion);
        } else {
          console.error('onSave function is not defined');
        }
        // 退出编辑模式
        setIsEditing(false);
      } catch (error) {
        // 保存失败时保持编辑状态，不退出编辑模式
        console.error('保存版本失败:', error);
        // 错误提示已经在api.ts中处理，这里不需要再处理
      }
    } else {
      // 调用新建接口
      // 创建新版本对象
      const newVersion = {
        name: editedVersionName || '新版本',
        description: editedVersionDescription || '',
        ontology_data: editorContent
      } as Version;
      
      // 调用创建版本的API
      if (typeof onCreateVersion === 'function') {
        try {
          await onCreateVersion(newVersion);
          // 成功提示已经在api.ts中处理
          // 可以在这里添加一些成功创建后的处理逻辑
          // 退出编辑模式
          setIsEditing(false);
        } catch (error) {
          // 保存失败时保持编辑状态，不退出编辑模式
          console.error('保存版本失败:', error);
          // 错误提示已经在api.ts中处理，这里不需要再处理
        }
      } else {
        // 如果没有传递onCreateVersion，则使用导入的createVersion函数
        try {
          await createVersion(newVersion);
          // 成功提示已经在api.ts中处理
          // 可以在这里添加一些成功创建后的处理逻辑
          // 退出编辑模式
          setIsEditing(false);
        } catch (error) {
          // 保存失败时保持编辑状态，不退出编辑模式
          console.error('保存版本失败:', error);
          // 错误提示已经在api.ts中处理，这里不需要再处理
        }
      }
    }
  };
  
  const handleCancel = () => {
    // 恢复到原始版本信息
    if (selectedVersion && selectedVersion.id) {
      // 如果是已有版本，查询这个版本的详细信息进行展示
      setEditedVersionName(selectedVersion.name);
      setEditedVersionDescription(selectedVersion.description);
      // 恢复编辑器内容到原始版本数据
      // 使用统一的ontology_data字段
      if (setEditorContent) {
        setEditorContent(selectedVersion.ontology_data || '');
      }
      // 设置为展示状态
      setIsEditing(false);
    } else {
      // 如果不是已有版本，恢复到默认版本信息
      setEditedVersionName('');
      setEditedVersionDescription('');
      // 恢复编辑器内容到默认值
      if (setEditorContent) {
        setEditorContent('');
      }
      // 保持编辑状态
      setIsEditing(true);
    }
  };

  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    if (onFullscreenToggle) {
      onFullscreenToggle(newFullscreenState);
    }
  };
  
  return (
    <div className={`editor-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {isFullscreen ? null : (
        <div className="editor-header">
          <div className="header-controls">
            {localIsEditing ? (
              <>
                <button className="cancel-button" onClick={handleCancel}>
                  取消
                </button>
                <button className="save-button" onClick={handleSave}>
                  保存
                </button>
              </>
            ) : (
              <button className="edit-button" onClick={() => {
                setIsEditing(true);
                if (selectedVersion) {
                  setEditedVersionName(selectedVersion.name);
                  setEditedVersionDescription(selectedVersion.description);
                }
              }}>
                编辑
              </button>
            )}
          </div>
          <div className="version-info">
            {selectedVersion ? (
              <>
                {isEditing ? (
                  <>
                    <input 
                  type="text" 
                  className="version-name-input"
                  value={editedVersionName || ''}
                  onChange={(e) => setEditedVersionName(e.target.value)}
                  placeholder="请输入版本名称"
                />
                <textarea 
                  className="version-description-input"
                  value={editedVersionDescription || ''}
                  onChange={(e) => setEditedVersionDescription(e.target.value)}
                  placeholder="请输入版本描述信息"
                />
                  </>
                ) : (
                  <>
                    <div className="version-name">
                      {selectedVersion.name}
                    </div>
                    <div className="version-description">
                      描述：{selectedVersion.description}
                    </div>
                  </>
                )}
                {!localIsEditing && selectedVersion.created_at && selectedVersion.updated_at && (
                  <div className="version-date">
                    <span>创建时间: {new Date(selectedVersion.created_at).toLocaleString()}</span>
                    <span style={{ marginLeft: '12px' }}>更新时间: {new Date(selectedVersion.updated_at).toLocaleString()}</span>
                  </div>
                )}
              </>
            ) : (
              // 显示默认版本信息
              <>
                {localIsEditing ? (
                  <>
                    <input 
                      type="text" 
                      className="version-name-input"
                      value={editedVersionName}
                      onChange={(e) => setEditedVersionName(e.target.value)}
                      placeholder="请输入版本名称"
                    />
                    <textarea 
                      className="version-description-input"
                      value={editedVersionDescription}
                      onChange={(e) => setEditedVersionDescription(e.target.value)}
                      placeholder="请输入版本描述信息"
                    />
                  </>
                ) : (
                  <>
                    <div className="version-name">
                      {editedVersionName || '新版本'}
                    </div>
                    <div className="version-description">
                      描述：{editedVersionDescription || '暂无描述'}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <div className="editor-tabs">
        <input 
          type="file" 
          id="file-upload" 
          style={{ display: 'none' }} 
          onChange={onFileUpload}
          accept=".owl,.rdf,.xml,.json,.jsonld,application/rdf+xml,application/xml,text/xml,application/json"
        />
        <label 
          htmlFor="file-upload" 
          className={`file-upload-btn ${!localIsEditing ? 'disabled' : ''}`}
          onClick={(e) => {
            if (!localIsEditing) {
              e.preventDefault();
              return;
            }
          }}
        >
          上传文件
        </label>

        <button 
          className="validate-btn"
          onClick={onValidate}
          disabled={!localIsEditing}
        >
          校验
        </button>

        {/* 数据格式切换按钮已移除 */}

        <button className="editor-tab" onClick={toggleFullscreen}>
          {isFullscreen ? '取消全屏' : '全屏'}
        </button>
        <div className="view-mode-buttons">
          <button 
            className={`view-mode-btn ${viewMode === 'source' ? 'active' : ''}`}
            onClick={() => onToggleViewMode && onToggleViewMode('source')}
          >
            源码
          </button>
          <button 
            className={`view-mode-btn ${viewMode === 'visual' ? 'active' : ''}`}
            onClick={() => onToggleViewMode && onToggleViewMode('visual')}
          >
            可视化
          </button>
          <button 
            className={`view-mode-btn ${viewMode === 'compare' ? 'active' : ''}`}
            onClick={() => onToggleViewMode && onToggleViewMode('compare')}
          >
            对比
          </button>
        </div>
      </div>
      <div className="editor-content">
        {viewMode === 'source' && (
          <textarea 
            className="editor-textarea"
            value={effectiveEditorContent}
            onChange={handleChange}
            onFocus={handleFocus}
            spellCheck="false"
            readOnly={!localIsEditing}
          />
        )}
        {viewMode === 'visual' && (
          <div className="visual-view">
            <div className="visual-mode-buttons">
              <button 
                className={`visual-mode-btn ${visualMode === 'graph' ? 'active' : ''}`}
                onClick={() => onToggleVisualMode && onToggleVisualMode('graph')}
              >
                图谱结构
              </button>
              <button 
                className={`visual-mode-btn ${visualMode === 'tree' ? 'active' : ''}`}
                onClick={() => onToggleVisualMode && onToggleVisualMode('tree')}
              >
                树状结构
              </button>
              <button 
                className={`visual-mode-btn ${visualMode === 'table' ? 'active' : ''}`}
                onClick={() => onToggleVisualMode && onToggleVisualMode('table')}
              >
                表结构
              </button>
            </div>
            <div className="visual-content">
              {visualMode === 'graph' && graphData && (
                <GraphView data={graphData.graph} />
              )}
              {visualMode === 'graph' && !graphData && (
                <p>请点击"校验"按钮生成图谱</p>
              )}
              {visualMode === 'tree' && graphData?.tree && (
                <TreeViewer data={graphData.tree} />
              )}
              {visualMode === 'tree' && !graphData?.tree && (
                <p>请点击"校验"按钮生成树状结构</p>
              )}
              {visualMode === 'table' && graphData?.table && (
                <TableView data={graphData.table} />
              )}
              {visualMode === 'table' && !graphData?.table && (
                <p>请点击"校验"按钮生成表结构</p>
              )}
            </div>
          </div>
        )}
        {viewMode === 'compare' && (
          <div className="compare-view">
            <div className="compare-panel">
              <textarea 
                className="editor-textarea"
                value={editorContent}
                onChange={handleChange}
                onFocus={handleFocus}
                spellCheck="false"
                readOnly={!localIsEditing}
              />
            </div>
            <div className="compare-panel">
              <div className="visual-view">
                <div className="visual-mode-buttons">
                  <button 
                    className={`visual-mode-btn ${visualMode === 'graph' ? 'active' : ''}`}
                    onClick={() => onToggleVisualMode && onToggleVisualMode('graph')}
                  >
                    图谱结构
                  </button>
                  <button 
                    className={`visual-mode-btn ${visualMode === 'tree' ? 'active' : ''}`}
                    onClick={() => onToggleVisualMode && onToggleVisualMode('tree')}
                  >
                    树状结构
                  </button>
                  <button 
                    className={`visual-mode-btn ${visualMode === 'table' ? 'active' : ''}`}
                    onClick={() => onToggleVisualMode && onToggleVisualMode('table')}
                  >
                    表结构
                  </button>
                </div>
                <div className="visual-content">
                  {visualMode === 'graph' && graphData && (
                    <GraphView data={graphData.graph} />
                  )}
                  {visualMode === 'graph' && !graphData && (
                    <p>请点击"校验"按钮生成图谱</p>
                  )}
                  {visualMode === 'tree' && graphData?.tree && (
                    <TreeViewer data={graphData.tree} />
                  )}
                  {visualMode === 'tree' && !graphData?.tree && (
                    <p>请点击"校验"按钮生成树状结构</p>
                  )}
                  {visualMode === 'table' && graphData?.table && (
                    <TableView data={graphData.table} />
                  )}
                  {visualMode === 'table' && !graphData?.table && (
                    <p>请点击"校验"按钮生成表结构</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="editor-status-bar">
        <div>Line {currentLine}, Column {currentColumn}</div>
        <div>{lineCount} Lines</div>
      </div>
    </div>
  );
};

export default Editor;