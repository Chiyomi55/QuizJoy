import React, { useState, useEffect } from 'react';
import './CreateTest.css';
import { FaSearch, FaArrowUp, FaArrowDown, FaStar, FaRegStar, FaTrash, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

/**
 * CreateTest 组件 - 用于教师创建新的测试
 * 包含两个主要部分：
 * 1. 测试基本信息设置（标题、描述、类型等）
 * 2. 题目选择区域（从题库中选择题目并排序）
 */
function CreateTest() {
  const navigate = useNavigate();
  
  // 状态管理
  const [problems, setProblems] = useState([]); // 题库中的所有题目
  const [loading, setLoading] = useState(true); // 加载状态
  const [error, setError] = useState(null); // 错误信息
  
  // 测试基本信息
  const [testInfo, setTestInfo] = useState({
    title: '', // 测试标题
    type: '月测', // 测试类型
    deadline: '', // 截止日期
    difficulty: 3, // 难度等级（1-5）
    description: '', // 测试描述
    estimatedTime: 60, // 预计完成时间（分钟）
    topics: [] // 相关知识点
  });

  // 已选择的题目列表
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  
  // 题目筛选条件
  const [filters, setFilters] = useState({
    type: '全部',
    difficulty: '全部',
    searchText: ''
  });

  // 在组件加载时获取题目数据
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await api.problems.getList();
        if (response.status === 401) {
          console.log('未登录或登录已过期');
          window.location.href = '/?showLogin=true';
          return;
        }
        const data = await response.json();
        setProblems(data);
        setLoading(false);
      } catch (err) {
        console.error('获取题目失败:', err);
        setError(err.message);
        setLoading(false);
        // 如果是认证错误，跳转到首页并显示登录框
        if (err.message.includes('登录已过期') || err.message.includes('未找到用户信息')) {
          window.location.href = '/?showLogin=true';
        }
      }
    };

    // 检查是否已登录
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/?showLogin=true';
      return;
    }

    fetchProblems();
  }, []);

  // 从题目数据中提取所有唯一的题型和知识点
  const allTypes = ['全部', ...new Set(problems.map(q => q.type))];
  const allTopics = [...new Set(problems.flatMap(q => q.topics))];

  // 处理知识点选择
  const handleTopicSelect = (topic) => {
    if (!testInfo.topics.includes(topic)) {
      setTestInfo({
        ...testInfo,
        topics: [...testInfo.topics, topic]
      });
    }
  };

  // 移除知识点
  const handleTopicRemove = (topicToRemove) => {
    setTestInfo({
      ...testInfo,
      topics: testInfo.topics.filter(topic => topic !== topicToRemove)
    });
  };

  // 根据筛选条件过滤题目
  const filteredQuestions = problems.filter(question => {
    const typeMatch = filters.type === '全部' || question.type === filters.type;
    const difficultyMatch = filters.difficulty === '全部' || question.difficulty === Number(filters.difficulty);
    const searchMatch = !filters.searchText || 
      question.title.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      question.topics.some(topic => topic.toLowerCase().includes(filters.searchText.toLowerCase()));

    return typeMatch && difficultyMatch && searchMatch;
  });

  // 检查题目是否已被选择
  const isQuestionSelected = (questionId) => {
    return selectedQuestions.some(q => q.id === questionId);
  };

  // 添加题目到已选列表
  const handleQuestionSelect = (question) => {
    setSelectedQuestions(prev => [...prev, { 
      ...question, 
      order: prev.length + 1 
    }]);
  };

  // 移动已选题目的位置（上移/下移）
  const handleQuestionMove = (index, direction) => {
    const newQuestions = [...selectedQuestions];
    if (direction === 'up' && index > 0) {
      [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
    } else if (direction === 'down' && index < newQuestions.length - 1) {
      [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    }
    setSelectedQuestions(newQuestions);
  };

  // 从已选列表中移除题目
  const handleQuestionRemove = (index) => {
    setSelectedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  // 提交测试信息到后端
  const handleSubmit = async () => {
    // 表单验证
    if (!testInfo.title.trim()) {
      alert('请输入测试标题');
      return;
    }
    if (!testInfo.deadline) {
      alert('请设置截止日期');
      return;
    }
    if (selectedQuestions.length === 0) {
      alert('请至少选择一道题目');
      return;
    }
    if (!testInfo.estimatedTime || testInfo.estimatedTime < 1) {
      alert('请设置有效的预计时间');
      return;
    }
    if (!testInfo.difficulty || testInfo.difficulty < 1 || testInfo.difficulty > 5) {
      alert('请设置难度等级');
      return;
    }

    try {
      // 准备要提交的数据
      const testData = {
        title: testInfo.title,
        type: testInfo.type || '月测',  // 设置默认值
        description: testInfo.description || '',
        difficulty: testInfo.difficulty,
        deadline: testInfo.deadline,
        estimated_time: testInfo.estimatedTime,
        topics: testInfo.topics,
        total_questions: selectedQuestions.length,
        problem_ids: selectedQuestions.map(q => q.id).join(','),
        questions: selectedQuestions.map((q, index) => ({
          problemId: q.id,
          order: index + 1
        }))
      };

      console.log('提交的测试数据:', testData);

      const response = await api.tests.create(testData);
      console.log('服务器响应:', response);

      if (response.ok) {
        const result = await response.json();
        console.log('创建成功，返回数据:', result);
        alert('小测创建成功！');
        // 修改导航路径到正确的教师测试页面
        navigate('/');
        window.location.reload(); // 刷新页面以显示最新数据
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建小测失败，请稍后重试');
      }
    } catch (error) {
      console.error('创建小测失败:', error);
      alert(error.message || '创建小测失败，请稍后重试');
    }
  };

  // 查看题目详情
  const handleQuestionClick = (questionId) => {
    navigate(`/problem/${questionId}`);
  };

  if (loading) return <div className="loading">正在加载题目...</div>;
  if (error) return <div className="error">加载失败: {error}</div>;

  return (
    <div className="create-test">
      {/* 测试基本信息设置区域 */}
      <div className="test-setup">
        <h2>布置新小测</h2>
        <div className="setup-form">
          {/* 基本信息输入区 */}
          <div className="form-row">
            <div className="form-group flex-2">
              <label>小测名称</label>
              <input
                type="text"
                value={testInfo.title}
                onChange={(e) => setTestInfo({...testInfo, title: e.target.value})}
                placeholder="请输入小测名称"
              />
            </div>
            <div className="form-group">
              <label>类型</label>
              <select
                value={testInfo.type}
                onChange={(e) => setTestInfo({...testInfo, type: e.target.value})}
              >
                <option value="月测">月测</option>
                <option value="模拟考">模拟考</option>
                <option value="周测">周测</option>
                <option value="单元测">单元测</option>
              </select>
            </div>
          </div>

          {/* 描述输入区 */}
          <div className="form-group">
            <label>测试描述</label>
            <textarea
              value={testInfo.description}
              onChange={(e) => setTestInfo({...testInfo, description: e.target.value})}
              placeholder="请输入测试描述"
              rows={3}
            />
          </div>

          {/* 时间和难度设置区 */}
          <div className="form-row">
            <div className="form-group">
              <label>截止日期</label>
              <input
                type="datetime-local"
                value={testInfo.deadline}
                onChange={(e) => setTestInfo({...testInfo, deadline: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>预计时间（分钟）</label>
              <input
                type="number"
                min="1"
                value={testInfo.estimatedTime}
                onChange={(e) => setTestInfo({...testInfo, estimatedTime: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-group">
              <label>难度设置</label>
              <div className="difficulty-stars-container">
                <div className="difficulty-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setTestInfo({...testInfo, difficulty: star})}
                      className="star-icon"
                    >
                      {star <= testInfo.difficulty ? <FaStar /> : <FaRegStar />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 知识点选择区 */}
          <div className="form-group">
            <label>相关知识点</label>
            <div className="topics-selection">
              <div className="topics-input">
                <select
                  onChange={(e) => handleTopicSelect(e.target.value)}
                  value=""
                  className="topic-select"
                >
                  <option value="" disabled>选择知识点</option>
                  {allTopics
                    .filter(topic => !testInfo.topics.includes(topic))
                    .map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))
                  }
                </select>
              </div>
              <div className="selected-topics">
                {testInfo.topics.map(topic => (
                  <span key={topic} className="topic-tag">
                    {topic}
                    <button
                      onClick={() => handleTopicRemove(topic)}
                      className="remove-topic"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 题目选择区域 */}
      <div className="question-selection">
        {/* 题库区域 */}
        <div className="question-bank">
          <div className="section-header">
            <h3>题库</h3>
            <div className="filter-tools">
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="filter-select"
              >
                {allTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={filters.difficulty}
                onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                className="filter-select"
              >
                <option value="全部">全部难度</option>
                <option value="1">★ 入门</option>
                <option value="2">★★ 基础</option>
                <option value="3">★★★ 进阶</option>
                <option value="4">★★★★ 挑战</option>
                <option value="5">★★★★★ 难题</option>
              </select>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="搜索题目..."
                  value={filters.searchText}
                  onChange={(e) => setFilters({...filters, searchText: e.target.value})}
                />
                <FaSearch className="search-icon" />
              </div>
            </div>
          </div>

          {/* 题目列表 */}
          <div className="questions-list">
            {filteredQuestions.map(question => (
              <div 
                key={question.id} 
                className={`question-item ${isQuestionSelected(question.id) ? 'selected' : ''}`}
              >
                <div className="question-info" onClick={() => handleQuestionClick(question.id)}>
                  <h4>{question.title}</h4>
                  <div className="question-meta">
                    <span className="question-type">{question.type}</span>
                    <span className="question-difficulty">
                      {[...Array(question.difficulty)].map((_, i) => (
                        <FaStar key={i} className="star-icon" />
                      ))}
                    </span>
                  </div>
                  <div className="question-topics">
                    {question.topics.map(topic => (
                      <span key={topic} className="topic-tag">{topic}</span>
                    ))}
                  </div>
                </div>
                {!isQuestionSelected(question.id) && (
                  <button 
                    className="add-button"
                    onClick={() => handleQuestionSelect(question)}
                  >
                    添加
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 已选题目区域 */}
        <div className="selected-questions">
          <div className="section-header">
            <h3>已选题目 ({selectedQuestions.length})</h3>
          </div>
          <div className="selected-list">
            {selectedQuestions.map((question, index) => (
              <div key={question.id} className="selected-item">
                <div className="question-order">{index + 1}</div>
                <div className="question-info">
                  <h4>{question.title}</h4>
                  <div className="question-meta">
                    <span className="question-type">{question.type}</span>
                    <span className="question-difficulty">
                      {[...Array(question.difficulty)].map((_, i) => (
                        <FaStar key={i} className="star-icon" />
                      ))}
                    </span>
                  </div>
                </div>
                <div className="question-actions">
                  <button 
                    onClick={() => handleQuestionMove(index, 'up')}
                    disabled={index === 0}
                  >
                    <FaArrowUp />
                  </button>
                  <button 
                    onClick={() => handleQuestionMove(index, 'down')}
                    disabled={index === selectedQuestions.length - 1}
                  >
                    <FaArrowDown />
                  </button>
                  <button 
                    onClick={() => handleQuestionRemove(index)}
                    className="remove-button"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="submit-section">
        <button 
          className="submit-button"
          onClick={handleSubmit}
          disabled={selectedQuestions.length === 0 || !testInfo.title || !testInfo.deadline}
        >
          创建小测
        </button>
      </div>
    </div>
  );
}

export default CreateTest; 