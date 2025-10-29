import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import './FileExplorer.css';
import * as api from '../services/api';
import CustomModal from './CustomModal';
import JSZip from 'jszip';

interface OntologyVersion {
  id?: number;
  name: string;
  description: string;
  owl_rdf_data?: string;
  json_ld_data?: string;
  created_at?: string;
  updated_at?: string;
}

interface FileExplorerProps {
  onVersionSelect: (version: OntologyVersion) => void;
  onAddOntology: () => void;
  onEditVersion: (version: OntologyVersion) => void;
  onDeleteVersion: (versionId: string) => void;
  onDownloadVersion: (version: OntologyVersion) => void;
  onResetToInitialState: () => void;
  selectedVersion: OntologyVersion | null;
}

const FileExplorer = forwardRef(({ 
  onVersionSelect,
  onAddOntology,
  onEditVersion,
  onDeleteVersion,
  onDownloadVersion,
  onResetToInitialState,
  selectedVersion
}: FileExplorerProps, ref) => {
  const [versions, setVersions] = useState<OntologyVersion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalVersions, setTotalVersions] = useState<number>(0);
  // 控制删除确认弹窗的状态
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<number | null>(null);

  // 获取版本列表
  useEffect(() => {
    const fetchVersions = async (page: number = 1) => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        
        const data = await api.getVersions(page, searchTerm);
        setTotalVersions(data.pagination.total); // 设置总数
        
        if (page === 1) {
          setVersions(data.versions);
          // 如果版本列表不为空，则通知父组件展示第一个版本
          if (data.versions.length > 0) {
            onVersionSelect(data.versions[0]);
          } else {
            // 如果版本列表为空，则通知父组件展示默认页面
            onResetToInitialState();
          }
        } else {
          setVersions(prev => [...prev, ...data.versions]);
        }
        
        setCurrentPage(page);
        setHasMore(data.pagination.total > page * data.pagination.page_size);
      } catch (error) {
        // 错误提示已经在api.ts中处理
      } finally {
        if (page === 1) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    };

    fetchVersions(1);
  }, [searchTerm]);

  // 根据搜索词过滤版本
  const filteredVersions = useMemo(() => {
    if (!searchTerm) return versions;
    return versions.filter(version => 
      version.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      version.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [versions, searchTerm]);

  // 处理滚动事件，实现无限滚动
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const threshold = 100; // 距离底部100px时开始加载
    
    if (scrollHeight - scrollTop - clientHeight < threshold && !loadingMore && hasMore) {
      loadMore();
    }
  };

  // 加载更多数据
  const loadMore = () => {
    const nextPage = currentPage + 1;
    // 这里需要调用API获取下一页数据
    // 由于useEffect中的fetchVersions函数无法直接调用，我们需要重新实现
    fetchVersions(nextPage);
  };

  // 重新声明fetchVersions以便在loadMore中调用
  const fetchVersions = async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const data = await api.getVersions(page, searchTerm);
      setTotalVersions(data.pagination.total); // 设置总数
      
      if (page === 1) {
        setVersions(data.versions);
        // 如果版本列表不为空，则通知父组件展示第一个版本
        if (data.versions.length > 0) {
          onVersionSelect(data.versions[0]);
        } else {
          // 如果版本列表为空，则通知父组件展示默认页面
          onResetToInitialState();
        }
      } else {
        setVersions(prev => [...prev, ...data.versions]);
      }
      
      setCurrentPage(page);
      setHasMore(data.pagination.total > page * data.pagination.page_size);
    } catch (error) {
      console.error('获取版本列表失败:', error);
    } finally {
      if (page === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const handleAddOntology = () => {
    // 通知父组件重置到初始状态
    onResetToInitialState();
  };

  const handleEditVersion = (versionId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    // 找到对应的版本对象
    const version = versions.find(v => v.id === versionId);
    if (version) {
      onEditVersion(version);
    }
  };

  const handleDeleteVersion = async (versionId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // 设置要删除的版本ID并打开确认弹窗
    setVersionToDelete(versionId);
    setIsDeleteModalOpen(true);
  };

  // 确认删除版本
  const confirmDeleteVersion = async () => {
    if (versionToDelete !== null) {
      try {
        await api.deleteVersion(versionToDelete);
        // 刷新版本列表
        handleRefreshVersions();
        console.log(`删除版本 ${versionToDelete}`);
        // 关闭弹窗并重置状态
        setIsDeleteModalOpen(false);
        setVersionToDelete(null);
      } catch (error) {
        console.error('删除版本失败:', error);
        // 关闭弹窗并重置状态
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

  const handleDownloadVersion = async (version: OntologyVersion, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!version.id) {
      console.error('版本ID不存在');
      return;
    }
    
    try {
      // 调用API获取两种格式的数据
      const response = await api.downloadVersion(version.id);
      
      // 创建ZIP文件
      const zip = new JSZip();
      
      // 添加OWL文件
      zip.file(`${response.name}.owl`, response.owl_data);
      
      // 添加JSON-LD文件
      zip.file(`${response.name}.jsonld`, response.jsonld_data);
      
      // 生成ZIP文件并下载
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${response.name}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载版本失败:', error);
    }
  };

  const handleRefreshVersions = () => {
    // 重置分页参数并重新获取版本列表
    setCurrentPage(1);
    setVersions([]);
    fetchVersions(1);
  };

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    refreshVersions: handleRefreshVersions
  }));

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <span>本体标准版本管理</span>
        <div className="header-buttons">
          <button className="add-ontology-btn" onClick={handleAddOntology} title="新增本体标准版本">+</button>
          <button className="refresh-btn" onClick={handleRefreshVersions} title="刷新版本列表">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 6.5H12.5C12.5 4.01 10.48 2 8 2C5.52 2 3.5 4.01 3.5 6.5H2C2 3.19 4.69 0.5 8 0.5C11.31 0.5 14 3.19 14 6.5ZM8 15.5C4.69 15.5 2 12.81 2 9.5H3.5C3.5 11.99 5.52 14 8 14C10.48 14 12.5 11.99 12.5 9.5H14C14 12.81 11.31 15.5 8 15.5Z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="explorer-search">
        <input
          type="text"
          placeholder="搜索版本名称或描述..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="version-list" onScroll={handleScroll}>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          filteredVersions.map((version) => (
            <div 
              key={version.id} 
              className={`version-item ${selectedVersion && selectedVersion.id === version.id ? 'selected' : ''}`}
              onClick={() => version.id !== undefined && onVersionSelect(version)}
            >
              <div className="version-name">{version.name}</div>
              <div className="version-description">{version.description}</div>
              <div className="version-date">{version.created_at && new Date(version.created_at).toLocaleString()}</div>
              <div className="version-actions">
                <button className="action-btn edit-btn" onClick={(e) => handleEditVersion(version.id!, e)} title="编辑">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-9 9a.5.5 0 0 1-.354.146H3.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .146-.354l9-9zM11.5 1.5l2 2L12 5l-2-2 1.5-1.5z"/>
                    <path d="M4 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zM4 8.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zM4 11.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                  </svg>
                </button>
                <button className="action-btn delete-btn" onClick={(e) => handleDeleteVersion(version.id!, e)} title="删除">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 5h4a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5v-9zm-2-1a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9z"/>
                    <path d="M3 4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1H3V4z"/>
                  </svg>
                </button>
                <button className="action-btn download-btn" onClick={(e) => handleDownloadVersion(version, e)} title="下载">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M.5 8.5a.5.5 0 0 1 .5.5v1.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9a.5.5 0 0 1 1 0v1.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V9a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 10.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 9.293V2.5a.5.5 0 0 0-1 0v6.793L5.354 7.146a.5.5 0 1 0-.708.708l3 3z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
        {loadingMore && (
          <div className="loading-more">加载更多...</div>
        )}
      </div>
      <div className="version-count">共 {totalVersions} 个版本</div>
      {/* 删除确认弹窗 */}
      <CustomModal
        isOpen={isDeleteModalOpen}
        type="confirm"
        title="确认删除"
        message="确定要删除这个版本吗？此操作不可撤销。"
        onConfirm={confirmDeleteVersion}
        onCancel={cancelDeleteVersion}
      />
    </div>
  );
});

export default FileExplorer;