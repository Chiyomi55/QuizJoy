import axios from 'axios';

// 设置 axios 默认配置
axios.defaults.baseURL = 'http://localhost:5000';

// 获取测试统计数据
export const getTestStatistics = async (testId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/api/tests/${testId}/statistics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取测试统计数据失败:', error);
    throw error;
  }
};

// 刷新测试统计数据
export const refreshTestStatistics = async (testId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`/api/tests/${testId}/statistics/refresh`, null, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('刷新测试统计数据失败:', error);
    throw error;
  }
};

// 刷新所有测试统计数据
export const refreshAllTestStatistics = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post('/api/tests/statistics/refresh-all', null, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('刷新所有测试统计数据失败:', error);
    throw error;
  }
}; 