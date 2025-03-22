const API_BASE_URL = 'http://localhost:5000/api';

export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  console.log('🚀 发起请求:', `${API_BASE_URL}${endpoint}`);
  
  // 基础请求头
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // 添加认证头
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('✨ 使用token进行认证');
  }

  try {
    // 确保endpoint以/开头
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${normalizedEndpoint}`;
    
    console.log('📤 请求配置:', {
      url,
      method: options.method || 'GET',
      headers: headers
    });

    // 构建请求配置
    const config = {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors'
    };

    const response = await fetch(url, config);
    console.log('📥 响应状态:', response.status);

    // 处理401未授权的情况
    if (response.status === 401) {
      console.log('🔒 登录已过期或未登录，清除token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/?showLogin=true';
      throw new Error('请先登录');
    }

    // 处理其他错误状态
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ 请求失败:', errorData);
      throw new Error(errorData.error || errorData.msg || `请求失败 (${response.status})`);
    }

    return response;
  } catch (error) {
    console.error('❌ 请求异常:', error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('网络连接失败，请检查网络设置');
    }
    throw error;
  }
}

// API方法配置
export const api = {
  // 题目相关
  problems: {
    getList: () => fetchWithAuth('/problems'),
    getDetail: (id) => fetchWithAuth(`/problems/${id}`),
    submit: (id, answer) => fetchWithAuth(`/problems/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer })
    })
  },
  
  // 测试相关
  tests: {
    getList: () => fetchWithAuth('/tests'),
    create: (testData) => fetchWithAuth('/tests', {
      method: 'POST',
      body: JSON.stringify(testData)
    }),
    getDetail: (id) => fetchWithAuth(`/tests/${id}`),
    submit: (id, answers) => fetchWithAuth(`/tests/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(answers)
    })
  },
  
  // 用户相关
  user: {
    getProfile: () => fetchWithAuth('/profile/info'),
    updateProfile: (data) => fetchWithAuth('/profile/info', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    getActivity: () => fetchWithAuth('/profile/activity'),
    getKnowledgeStatus: () => fetchWithAuth('/profile/knowledge_status'),
    getDifficultyDistribution: () => fetchWithAuth('/profile/difficulty_distribution'),
    updateAvatar: (formData) => fetchWithAuth('/profile/avatar', {
      method: 'POST',
      body: formData,
      headers: {} // 让浏览器自动设置Content-Type为multipart/form-data
    })
  }
}; 