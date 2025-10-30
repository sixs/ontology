import { showSuccess, showError } from './notification';

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

interface OntologyVersion {
  id?: number;
  name: string;
  description: string;
  data_type?: 'owl/rdf' | 'json-ld';
  data?: string;
  owl_rdf_data?: string;
  json_ld_data?: string;
  created_at?: string;
  updated_at?: string;
}

// 获取版本列表
export const getVersions = async (page: number = 1, search: string = ''): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/versions?page=${page}&search=${encodeURIComponent(search)}`);
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.error || '获取版本列表失败';
      showError(errorMessage);
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error: any) {
      // 检查是否是网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        showError('网络错误，请稍后重试');
      } else if (error.message) {
        showError(`获取版本列表失败: ${error.message}`);
      } else {
        showError('获取版本列表失败，请稍后重试');
      }
      throw error;
    }
};

// 获取版本详情
export const getVersion = async (id: number): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/versions/${id}`);
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.error || '获取版本详情失败';
      showError(errorMessage);
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error: any) {
      // 检查是否是网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        showError('网络错误，请稍后重试');
      } else if (error.message) {
        showError(`获取版本失败: ${error.message}`);
      } else {
        showError('获取版本失败，请稍后重试');
      }
      throw error;
    }
};

// 创建新版本
export const createVersion = async (version: OntologyVersion): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(version),
    });
    const data = await response.json();
    
    if (!response.ok) {
      let errorMessage = data.error || '创建版本失败';
      
      // 如果有详细错误信息，将其添加到错误消息中
      if (data.details && Array.isArray(data.details)) {
        errorMessage += ': ' + data.details.join('; ');
      }
      
      throw new Error(errorMessage);
    }
    
    showSuccess('版本创建成功');
    return data;
  } catch (error: any) {
      // 检查是否是网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        showError('网络错误，请稍后重试');
      } else if (error.message) {
        showError(`更新版本失败: ${error.message}`);
      } else {
        showError('更新版本失败，请稍后重试');
      }
      throw error;
    }
};

// 更新版本
export const updateVersion = async (id: number, version: OntologyVersion): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/versions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(version),
    });
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.error || '更新版本失败';
      showError(errorMessage);
      throw new Error(errorMessage);
    }
    
    showSuccess('版本更新成功');
    return data;
  } catch (error: any) {
      // 检查是否是网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        showError('网络错误，请稍后重试');
      } else if (error.message) {
        showError(`删除版本失败: ${error.message}`);
      } else {
        showError('删除版本失败，请稍后重试');
      }
      throw error;
    }
};

// 删除版本
export const deleteVersion = async (id: number): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/versions/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.error || '删除版本失败';
      showError(errorMessage);
      throw new Error(errorMessage);
    }
    
    showSuccess('版本删除成功');
    return data;
  } catch (error: any) {
      // 检查是否是网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        showError('网络错误，请稍后重试');
      } else if (error.message) {
        showError(`下载版本失败: ${error.message}`);
      } else {
        showError('下载版本失败，请稍后重试');
      }
      throw error;
    }
};

// 可视化数据
export const visualizeData = async (data: any): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/visualize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (!response.ok) {
      const errorMessage = result.error || '可视化数据失败';
      showError(errorMessage);
      throw new Error(errorMessage);
    }
    
    showSuccess('数据可视化成功');
    return result;
  } catch (error: any) {
    // 检查是否是网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      showError('网络错误，请稍后重试');
      throw error;
    } else {
      // 其他错误已经在上层处理过，这里不再重复显示
      throw error;
    }
  }
};

// 下载版本
export const downloadVersion = async (id: number): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/download/${id}`);
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.error || '下载版本失败';
      showError(errorMessage);
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error: any) {
    // 检查是否是网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      showError('网络错误，请稍后重试');
    } else if (error.message) {
      showError(error.message);
    } else {
      showError('操作失败，请稍后重试');
    }
    throw error;
  }
};