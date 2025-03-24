import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Card, Tag, Space, Button, message } from 'antd';
import './TeacherTestBank.css';
import { FaPlus, FaSearch, FaChartLine } from 'react-icons/fa';
import { api } from '../utils/api';

/**
 * TeacherTestBank 组件 - 教师端的小测管理页面
 * 功能：
 * 1. 展示教师创建的所有小测
 * 2. 提供筛选和搜索功能
 * 3. 支持创建新小测
 * 4. 点击小测卡片查看详细分析
 */
function TeacherTestBank() {
  const navigate = useNavigate();
  // 状态管理
  const [tests, setTests] = useState([]); // 存储所有小测数据
  const [loading, setLoading] = useState(true); // 加载状态
  const [error, setError] = useState(null); // 错误信息
  
  // 筛选条件状态
  const [filters, setFilters] = useState({
    type: '全部',
    searchText: ''
  });

  // 在组件加载时获取小测数据
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await api.tests.getList();
        const data = await response.json();
        console.log('获取到的测试数据:', data);
        setTests(data);
        setLoading(false);
      } catch (err) {
        console.error('获取测试列表失败:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  // 处理创建新小测
  const handleCreateTest = () => {
    navigate('/teacher/create-test');
  };

  // 处理点击小测卡片
  const handleTestClick = (testId) => {
    navigate(`/teacher/test-analysis/${testId}`);
  };

  // 根据筛选条件过滤小测
  const filteredTests = tests.filter(test => {
    const typeMatch = filters.type === '全部' || test.type === filters.type;
    const searchMatch = !filters.searchText || 
      test.title.toLowerCase().includes(filters.searchText.toLowerCase());
    return typeMatch && searchMatch;
  });

  // 加载状态显示
  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="error">加载失败: {error}</div>;

  return (
    <div className="teacher-test-bank">
      {/* 顶部操作区域 */}
      <div className="action-bar">
        <div className="left-section">
          <button className="create-test-btn" onClick={handleCreateTest}>
            <FaPlus /> 布置新小测
          </button>
        </div>
        
        <div className="right-section">
          {/* 筛选器 */}
          <div className="filters">
            <select
              className="filter-select"
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
            >
              <option value="全部">全部类型</option>
              <option value="月测">月测</option>
              <option value="模拟考">模拟考</option>
              <option value="周测">周测</option>
              <option value="单元测">单元测</option>
            </select>
            
            {/* 搜索框 */}
            <div className="search-box">
              <input
                type="text"
                placeholder="搜索小测..."
                value={filters.searchText}
                onChange={(e) => setFilters({...filters, searchText: e.target.value})}
              />
              <FaSearch className="search-icon" />
            </div>
          </div>
        </div>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
        dataSource={filteredTests}
        locale={{ emptyText: (
          <div className="no-tests">
            <p>暂无小测数据</p>
            <button onClick={handleCreateTest}>创建第一个小测</button>
          </div>
        )}}
        renderItem={test => (
          <List.Item>
            <Card
              className="test-card"
              onClick={() => handleTestClick(test.id)}
              bodyStyle={{ padding: '20px', height: '100%' }}
            >
              <div className="test-content">
                <div className="test-header">
                  <span className="test-type">{test.type}</span>
                  <span className="test-date">{new Date(test.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="test-main-info">
                  <h3 className="test-title">{test.title}</h3>
                  <div className="test-info">
                    <div className="test-stat">
                      <span>{test.total_questions}题</span>
                    </div>
                    <div className="test-stat">
                      <span className="difficulty">{'★'.repeat(test.difficulty)}</span>
                    </div>
                    <div className="test-stat">
                      <span>{test.estimated_time}分钟</span>
                    </div>
                  </div>
                </div>

                <div className="test-topics">
                  {test.topics.map(topic => (
                    <Tag 
                      key={topic} 
                      className="topic-tag"
                    >
                      {topic}
                    </Tag>
                  ))}
                </div>

                <div className="test-status">
                  {test.deadline && (
                    <div className="deadline-info">
                      <span>截止日期: </span>
                      {new Date(test.deadline).toLocaleDateString()}
                    </div>
                  )}

                  <Button
                    type="primary"
                    icon={<FaChartLine />}
                    className="view-analysis"
                  >
                    查看分析
                  </Button>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}

export default TeacherTestBank; 