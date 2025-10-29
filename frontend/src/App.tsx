import React, { useState, useRef } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import Editor from './components/Editor';
import FileExplorer from './components/FileExplorer';
import { updateVersion, createVersion, deleteVersion, visualizeData, getVersion } from './services/api';
import { ToastContainer } from 'react-toastify';
import { showSuccess, showError } from './services/notification';
import 'react-toastify/dist/ReactToastify.css';
import CustomModal from './components/CustomModal';
import './App.css';

// 定义文件类型
interface FileType {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileType[];
}

// 定义本体版本类型
interface OntologyVersion {
  id?: number;
  name: string;
  description: string;
  ontology_data?: string;
  graph?: string;
  tree?: string;
  table?: string;
  created_at?: string;
  updated_at?: string;
}

function App() {
  const [selectedFile, setSelectedFile] = React.useState<FileType | null>(null);
  const [fileContent, setFileContent] = React.useState<string>('');
  const [isOntologyManagerVisible, setIsOntologyManagerVisible] = React.useState<boolean>(true);
  const [visualizationData, setVisualizationData] = React.useState<any>(null);
  const [isAIChatVisible, setIsAIChatVisible] = React.useState<boolean>(true);
  const [selectedVersion, setSelectedVersion] = React.useState<OntologyVersion | null>(null);
  // 数据格式状态已移除
  const [viewMode, setViewMode] = React.useState<'source' | 'visual' | 'compare'>('source'); // 添加视图模式状态
  const [visualMode, setVisualMode] = React.useState<'graph' | 'tree' | 'table'>('graph'); // 添加可视化模式状态
  // 控制删除确认弹窗的状态
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [versionToDelete, setVersionToDelete] = React.useState<string | null>(null);
  // 控制提示弹窗的状态
  const [isAlertModalOpen, setIsAlertModalOpen] = React.useState(false);
  const [alertModalMessage, setAlertModalMessage] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false); // 添加编辑模式状态
  const [versions, setVersions] = React.useState<OntologyVersion[]>([]); // 添加版本列表状态
  const [editorContent, setEditorContent] = React.useState<string>(''); // 添加编辑器内容状态
  const fileExplorerRef = useRef<{ refreshVersions: () => void }>(null); // 添加ref用于访问FileExplorer的方法


  const handleFileSelect = (file: FileType) => {
    setSelectedFile(file);
    // 在实际应用中，这里会从文件系统读取文件内容
    setFileContent(`Content of ${file.name}\nThis is a sample content for demonstration purposes.`);
  };

  const handleVersionSelect = async (version: OntologyVersion) => {
    // 如果版本包含可视化数据，直接使用
    if (version.graph && version.tree && version.table) {
      setSelectedVersion(version);
      // 使用统一的ontology_data字段设置编辑器内容
      setFileContent(version.ontology_data || '');
      // 设置可视化数据
      setVisualizationData({
        graph: version.graph,
        tree: version.tree,
        table: version.table
      });
      console.log(`选择了版本: ${version.name}`);
    } else {
      // 如果没有可视化数据，调用API获取完整版本信息
      try {
        const fullVersion = await getVersion(version.id!);
        setSelectedVersion(fullVersion);
        // 使用统一的ontology_data字段设置编辑器内容
        setFileContent(fullVersion.ontology_data || '');
        // 设置可视化数据
        setVisualizationData({
          graph: fullVersion.graph,
          tree: fullVersion.tree,
          table: fullVersion.table
        });
        console.log(`选择了版本: ${fullVersion.name}`);
      } catch (error) {
        console.error('获取版本详情失败:', error);
        showError('获取版本详情失败');
      }
    }
  };

  // 重置到初始状态
  const resetToInitialState = () => {
    setSelectedVersion({
      name: '',
      description: ''
    });
    setFileContent('');
    setVisualizationData(null); // 清空可视化数据
    // 新建版本时默认进入编辑状态
    setIsEditing(true);
  };

  // 创建新版本
  const handleCreateVersion = async (version: Omit<OntologyVersion, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // 准备创建数据
      const newVersionData = {
        name: version.name,
        description: version.description,
        ontology_data: version.ontology_data || ''
      };

      // 调用创建版本的API
      const createdVersion = await createVersion(newVersionData);
      
      // 更新本地状态
      setVersions(prev => [...prev, createdVersion]);
      setSelectedVersion(createdVersion);
      setIsEditing(false);
      
      // 显示成功消息
      showSuccess('版本创建成功');
    } catch (error) {
      console.error('创建版本失败:', error);
      // 错误提示已经在api.ts中处理，这里不再重复显示
    }
  };

  // 添加本体版本
  const handleAddOntology = () => {
    console.log('添加本体版本');
    resetToInitialState();
  };

  // 编辑版本
  const handleEditVersion = (version: OntologyVersion) => {
    console.log('编辑版本:', version);
    // 清空之前的可视化数据
    setVisualizationData(null);
    // 设置编辑模式
    setViewMode('source');
    setIsEditing(true);
    // 选中要编辑的版本
    handleVersionSelect(version);
  };

  // 保存版本
  const handleSaveVersion = async (version: OntologyVersion) => {
    try {
      // 检查是否为已存在的版本（有id）
      if (version.id) {
        // 准备要发送的数据，使用传入的版本名称和描述
        // 处理版本更新
        const versionToUpdate = {
          name: version.name,
          description: version.description,
          ontology_data: fileContent
        };
        
        // 调用API更新版本
        const updatedVersion = await updateVersion(version.id, versionToUpdate);
        
        // 更新本地状态
        setSelectedVersion(updatedVersion);
        // 清空可视化数据，确保重新加载
        setVisualizationData(null);
        
        // 刷新版本列表
        if (fileExplorerRef.current && typeof fileExplorerRef.current.refreshVersions === 'function') {
          fileExplorerRef.current.refreshVersions();
        }
      } else {
        // 处理新创建的版本
        const newVersionData = {
          ...version,
          ontology_data: fileContent
        };
        
        // 调用API创建新版本
        const newVersion = await createVersion(newVersionData);
        
        // 更新selectedVersion状态以反映新创建的版本
        setSelectedVersion(newVersion);
        // 清空可视化数据，确保重新加载
        setVisualizationData(null);
        
        // 刷新版本列表
        if (fileExplorerRef.current && typeof fileExplorerRef.current.refreshVersions === 'function') {
          fileExplorerRef.current.refreshVersions();
        }
      }
    } catch (error) {
      console.error('保存版本失败:', error);
      // 错误提示已经在api.ts中处理
      // 保持编辑状态，不改变isEditing状态
    }
  };

  // 删除版本
  const handleDeleteVersion = async (versionId: string) => {
    console.log('删除版本:', versionId);
    
    // 设置要删除的版本ID并打开确认弹窗
    setVersionToDelete(versionId);
    setIsDeleteModalOpen(true);
  };

  // 确认删除版本
  const confirmDeleteVersion = async () => {
    if (versionToDelete) {
      try {
        await deleteVersion(parseInt(versionToDelete));
        // 刷新版本列表
        if (fileExplorerRef.current && typeof fileExplorerRef.current.refreshVersions === 'function') {
          fileExplorerRef.current.refreshVersions();
        }
        // 清空可视化数据
        setVisualizationData(null);
        // 关闭弹窗
        setIsDeleteModalOpen(false);
        setVersionToDelete(null);
      } catch (error) {
        console.error('删除版本失败:', error);
        // 错误提示已经在api.ts中处理，这里不再重复显示
        // 关闭弹窗
        setIsDeleteModalOpen(false);
        setVersionToDelete(null);
      }
    }
  };

  // 取消删除版本
  const cancelDeleteVersion = () => {
    setIsDeleteModalOpen(false);
    setVersionToDelete(null);
  };

  // 下载版本
  const handleDownloadVersion = (version: OntologyVersion) => {
    console.log('下载版本:', version);
    // 这里应该实现下载版本的逻辑
  };

  const handleOntologyManagerToggle = () => {
    setIsOntologyManagerVisible(!isOntologyManagerVisible);
  };

  const handleAIToggle = () => {
    setIsAIChatVisible(!isAIChatVisible);
  };



  // 切换视图模式
  const toggleViewMode = (mode: 'source' | 'visual' | 'compare') => {
    setViewMode(mode);
  };

  // 切换可视化模式
  const toggleVisualMode = (mode: 'graph' | 'tree' | 'table') => {
    setVisualMode(mode);
  };

  // 切换数据格式（已废弃，保留函数以防其他组件依赖）
  const toggleDataFormat = () => {
    console.log('数据格式切换功能已废弃');
  };




  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型（支持OWL/RDF和JSON-LD格式）
    const isValidFileType = 
      (file.type === 'application/rdf+xml' || file.type === 'application/xml' || file.type === 'text/xml' || 
       file.name.endsWith('.owl') || file.name.endsWith('.xml') || file.name.endsWith('.rdf')) ||
      (file.type === 'application/json' || file.name.endsWith('.json') || file.name.endsWith('.jsonld'));

    if (!isValidFileType) {
      showError('请选择有效的本体文件 (OWL/RDF 或 JSON-LD格式)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setFileContent(content);
        
        // 如果是编辑状态且没有手动输入版本名称，则自动填充文件名作为版本名称
        if (isEditing && selectedVersion && !selectedVersion.name) {
          const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
          setSelectedVersion({
            ...selectedVersion,
            name: fileNameWithoutExtension
          });
        }
      }
    };
    reader.readAsText(file);
    
    // 清空input值以便可以重复上传同一文件
    event.target.value = '';
  };

  // 控制全屏模式下的面板显示
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenToggle = (fullscreen: boolean) => {
    setIsFullscreen(fullscreen);
  };

  // 本体数据校验功能
  const handleValidate = async () => {
    if (!fileContent && !editorContent) {
      // 使用自定义弹窗替代alert
      setAlertModalMessage('请先上传文件或在编辑器中输入内容');
      setIsAlertModalOpen(true);
      return;
    }

    try {
      // 优先使用编辑器内容，如果没有则使用文件内容
      const contentToValidate = editorContent || fileContent;
      // 将文件内容包装成后端期望的格式
      const requestData = {
        ontology_data: contentToValidate
      };
      const result = await visualizeData(requestData);
      console.log('校验结果:', result);
      // 更新可视化数据状态，包含graph、tree和table数据
      setVisualizationData(result);
      // alert('本体数据校验完成，请查看控制台输出');
    } catch (error) {
      console.error('校验失败:', error);
      // 错误提示已经在api.ts中处理，这里不再重复显示
    }
  };

  return (
    <div className="app">
      <Sidebar 
        onFileManagerToggle={handleOntologyManagerToggle}
        onAIToggle={handleAIToggle}
      />
      {!isFullscreen && isOntologyManagerVisible && (
        <div className="panel file-explorer">
          <FileExplorer 
              ref={fileExplorerRef}
              onVersionSelect={handleVersionSelect} 
              onAddOntology={handleAddOntology}
              onEditVersion={handleEditVersion}
              onDeleteVersion={handleDeleteVersion}
              onDownloadVersion={handleDownloadVersion}
              onResetToInitialState={resetToInitialState}
              selectedVersion={selectedVersion}
            />
        </div>
      )}
      <div className="panel editor">
        <Editor 
              content={fileContent}
              editorContent={editorContent}
              setEditorContent={setEditorContent}
              selectedVersion={selectedVersion || undefined}

              // dataFormat和onToggleDataFormat已移除
              viewMode={viewMode}
              onToggleViewMode={toggleViewMode}
              visualMode={visualMode}
              onToggleVisualMode={toggleVisualMode}
              onFileUpload={handleFileUpload}
              onSave={(version: any) => version && handleSaveVersion(version)}
              isEditing={isEditing}
              onEditToggle={setIsEditing}
              onCreateVersion={createVersion}
              onFullscreenToggle={handleFullscreenToggle}
              onValidate={handleValidate}
              graphData={visualizationData}
            />
      </div>
      <div className="panel">
        <ChatPanel isCollapsed={!isAIChatVisible} onToggle={handleAIToggle} />
      </div>
      <ToastContainer />
      <CustomModal
        isOpen={isDeleteModalOpen}
        type="confirm"
        title="确认删除"
        message="确定要删除这个版本吗？此操作不可撤销。"
        onConfirm={confirmDeleteVersion}
        onCancel={cancelDeleteVersion}
      />
      <CustomModal
        isOpen={isAlertModalOpen}
        type="alert"
        title="提示"
        message={alertModalMessage}
        onClose={() => setIsAlertModalOpen(false)}
      />
    </div>
  );
}

export default App;