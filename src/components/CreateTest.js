import React, { useState, useEffect } from 'react';
import './CreateTest.css';
import { FaSearch, FaArrowUp, FaArrowDown, FaStar, FaRegStar, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';

function CreateTest() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [testInfo, setTestInfo] = useState({
    title: '',
    type: '月测',
    deadline: '',
    difficulty: 3
  });

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [filters, setFilters] = useState({
    type: '全部',
    difficulty: '全部',
    topic: '全部',
    searchText: ''
  });

  // 从后端获取题目数据
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/problems', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch problems');
        }
        
        const data = await response.json();
        setProblems(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch problems:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // 从题目数据中提取所有唯一的题型和知识点
  const allTypes = ['全部', ...new Set(problems.map(q => q.type))];
  const allTopics = ['全部', ...new Set(problems.flatMap(q => q.topics))];

  // 根据筛选条件过滤题目
  const filteredQuestions = problems.filter(question => {
    const typeMatch = filters.type === '全部' || question.type === filters.type;
    const difficultyMatch = filters.difficulty === '全部' || question.difficulty === Number(filters.difficulty);
    const topicMatch = filters.topic === '全部' || question.topics.includes(filters.topic);
    const searchMatch = !filters.searchText || 
      question.title.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      question.topics.some(topic => topic.toLowerCase().includes(filters.searchText.toLowerCase()));

    return typeMatch && difficultyMatch && topicMatch && searchMatch;
  });

  // 检查题目是否已被选择
  const isQuestionSelected = (questionId) => {
    return selectedQuestions.some(q => q.id === questionId);
  };

  const handleQuestionSelect = (question) => {
    setSelectedQuestions(prev => [...prev, { 
      ...question, 
      order: prev.length + 1 
    }]);
  };

  const handleQuestionMove = (index, direction) => {
    const newQuestions = [...selectedQuestions];
    if (direction === 'up' && index > 0) {
      [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
    } else if (direction === 'down' && index < newQuestions.length - 1) {
      [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    }
    setSelectedQuestions(newQuestions);
  };

  const handleQuestionRemove = (index) => {
    setSelectedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: testInfo.title,
          type: testInfo.type,
          deadline: testInfo.deadline,
          difficulty: testInfo.difficulty,
          questions: selectedQuestions.map(q => ({
            problemId: q.id,
            order: q.order
          }))
        })
      });

      if (response.ok) {
        alert('小测创建成功！');
        navigate('/teacher/tests');
      }
    } catch (error) {
      console.error('Failed to create test:', error);
      alert('创建小测失败，请稍后重试');
    }
  };

  // 添加题目点击事件处理函数
  const handleQuestionClick = (questionId) => {
    navigate(`/problem/${questionId}`);
  };

  if (loading) return <div className="loading">正在加载题目...</div>;
  if (error) return <div className="error">加载失败: {error}</div>;

  return (
    <div className="create-test">
      <div className="test-setup">
        <h2>布置新小测</h2>
        <div className="setup-form">
          <div className="form-group full-width">
            <label>小测名称</label>
            <input
              type="text"
              value={testInfo.title}
              onChange={(e) => setTestInfo({...testInfo, title: e.target.value})}
              placeholder="请输入小测名称"
            />
          </div>
          <div className="form-row">
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
            <div className="form-group">
              <label>截止日期</label>
              <input
                type="datetime-local"
                value={testInfo.deadline}
                onChange={(e) => setTestInfo({...testInfo, deadline: e.target.value})}
              />
            </div>
          </div>
          <div className="form-group difficulty-group">
            <label>难度设置</label>
            <div className="difficulty-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setTestInfo({...testInfo, difficulty: star})}
                >
                  {star <= testInfo.difficulty ? <FaStar /> : <FaRegStar />}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="question-selection">
        <div className="question-bank">
          <h3>题库</h3>
          <div className="filter-section">
            <div className="filter-row">
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
              >
                {allTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={filters.difficulty}
                onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
              >
                <option value="全部">全部难度</option>
                <option value="1">★ 入门</option>
                <option value="2">★★ 基础</option>
                <option value="3">★★★ 进阶</option>
                <option value="4">★★★★ 挑战</option>
                <option value="5">★★★★★ 难题</option>
              </select>

              <select
                value={filters.topic}
                onChange={(e) => setFilters({...filters, topic: e.target.value})}
              >
                {allTopics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            <div className="search-bar">
              <input
                type="text"
                placeholder="搜索题目..."
                value={filters.searchText}
                onChange={(e) => setFilters({...filters, searchText: e.target.value})}
              />
              <FaSearch />
            </div>
          </div>

          <div className="question-list">
            {filteredQuestions.map(question => (
              <div key={question.id} className="question-item">
                <div 
                  className="question-info"
                  onClick={() => handleQuestionClick(question.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <h4>{question.title}</h4>
                  <div className="question-meta">
                    <span className="question-type">{question.type}</span>
                    <span className="difficulty-stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>
                          {i < question.difficulty ? <FaStar /> : <FaRegStar />}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="question-tags">
                    {question.topics.map(topic => (
                      <span key={topic} className="topic-tag">{topic}</span>
                    ))}
                  </div>
                </div>
                <button
                  className={`add-btn ${isQuestionSelected(question.id) ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation(); // 防止触发题目点击事件
                    handleQuestionSelect(question);
                  }}
                  disabled={isQuestionSelected(question.id)}
                >
                  {isQuestionSelected(question.id) ? '已添加' : '添加'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="selected-questions">
          <h3>已选题目 ({selectedQuestions.length})</h3>
          <div className="selected-list">
            {selectedQuestions.map((question, index) => (
              <div key={index} className="selected-item">
                <span className="question-order">{index + 1}</span>
                <div className="question-info">
                  <h4>{question.title}</h4>
                </div>
                <div className="question-actions">
                  <button onClick={() => handleQuestionMove(index, 'up')}>
                    <FaArrowUp />
                  </button>
                  <button onClick={() => handleQuestionMove(index, 'down')}>
                    <FaArrowDown />
                  </button>
                  <button onClick={() => handleQuestionRemove(index)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="submit-section">
        <button 
          className="submit-btn" 
          onClick={handleSubmit}
          disabled={selectedQuestions.length === 0 || !testInfo.title || !testInfo.deadline}
        >
          确认布置
        </button>
      </div>
    </div>
  );
}

export default CreateTest; 