const API_BASE_URL = 'http://localhost:5000';

export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  console.log('当前token:', token);
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('添加Authorization头:', headers['Authorization']);
  } else {
    console.log('没有找到token');
    throw new Error('未登录或登录已过期');
  }

  console.log('请求URL:', `${API_BASE_URL}${endpoint}`);
  console.log('完整请求头:', headers);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));

    if (response.status === 401) {
      console.log('未授权，清除token并重定向到登录页');
      localStorage.removeItem('token');
      window.location.href = '/';
      throw new Error('登录已过期，请重新登录');
    }

    return response;
  } catch (error) {
    console.error('请求失败:', error);
    if (error.message === '未登录或登录已过期') {
      window.location.href = '/';
    }
    throw error;
  }
} 