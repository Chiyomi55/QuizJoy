import React, { useState, useEffect } from 'react';
import './ProblemBank.css';
import { FaSearch, FaStar, FaRegStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';

function ProblemBank() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        const response = await fetchWithAuth('/problems');
        if (!response.ok) {
          throw new Error('获取题目失败');
        }
        const data = await response.json();
        console.log('Fetched problems:', data);
        setProblems(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch problems:', err);
        setError(err.message || '获取题目失败');
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // 从题目数据中提取所有唯一的题型和知识点
  const allTypes = ['全部', ...new Set(problems.map(q => q.type))];
  const allTopics = ['全部', ...new Set(problems.flatMap(q => q.topics))];

  // 根据筛选条件过滤题目
  const filteredProblems = problems.filter(question => {
    const typeMatch = filters.type === '全部' || question.type === filters.type;
    const difficultyMatch = filters.difficulty === '全部' || question.difficulty === Number(filters.difficulty);
    const topicMatch = filters.topic === '全部' || question.topics.includes(filters.topic);
    const searchMatch = !filters.searchText || 
      question.title.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      question.topics.some(topic => topic.toLowerCase().includes(filters.searchText.toLowerCase()));

    return typeMatch && difficultyMatch && topicMatch && searchMatch;
  });

  const handleProblemClick = (problemId) => {
    navigate(`/problem/${problemId}`);
  };

  // 渲染星级
  const renderStars = (count) => {
    return (
      <div className="stars">
        {[...Array(5)].map((_, index) => (
          index < count ? <FaStar key={index} /> : <FaRegStar key={index} />
        ))}
      </div>
    );
  };

  if (loading) return <div className="loading">正在加载题目...</div>;
  if (error) return <div className="error">加载失败: {error}</div>;
  if (!problems.length) return <div className="empty">暂无题目</div>;

  return (
    <div className="problem-bank">
      {/* 知识点标签部分保持不变 */}
      <div className="topics-container">
        {allTopics.map(topic => (
          <div
            key={topic}
            className={`topic-tag ${filters.topic === topic ? 'selected' : ''}`}
            onClick={() => setFilters({...filters, topic})}
          >
            <span>{topic}</span>
            <span className="topic-count">
              {topic === '全部' 
                ? problems.length 
                : problems.filter(p => p.topics.includes(topic)).length}
            </span>
          </div>
        ))}
      </div>

      {/* 筛选栏部分保持不变 */}
      <div className="filter-bar">
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
          className="difficulty-select"
        >
          <option value="全部">全部难度</option>
          <option value="1">★☆☆☆☆ 入门</option>
          <option value="2">★★☆☆☆ 基础</option>
          <option value="3">★★★☆☆ 进阶</option>
          <option value="4">★★★★☆ 挑战</option>
          <option value="5">★★★★★ 难题</option>
        </select>

        <select
          value={filters.topic}
          onChange={(e) => setFilters({...filters, topic: e.target.value})}
          className="topic-select"
        >
          <option value="全部">全部知识点</option>
          {allTopics.map(topic => (
            <option key={topic} value={topic}>{topic}</option>
          ))}
        </select>

        <div className="search-box">
          <input
            type="text"
            placeholder="输入搜索题目..."
            value={filters.searchText}
            onChange={(e) => setFilters({...filters, searchText: e.target.value})}
          />
          <button className="search-button">
            <FaSearch />
          </button>
        </div>
      </div>

      {/* 题目列表 */}
      <div className="problems-table-container">
        <table className="problems-table">
          <thead>
            <tr>
              <th>题号</th>
              <th>题目</th>
              <th>难度</th>
              <th>题目类型</th>
              <th>标签</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.map(problem => (
              <tr key={problem.id} onClick={() => handleProblemClick(problem.id)}>
                <td>{problem.id}</td>
                <td>{problem.title}</td>
                <td>{renderStars(problem.difficulty)}</td>
                <td>{problem.type}</td>
                <td>
                  {problem.topics.map(tag => (
                    <span key={tag} className="problem-tag">{tag}</span>
                  ))}
                </td>
                <td>
                  <span className={`status-badge ${problem.status || '暂无'}`}>
                    {problem.status || '暂无'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProblemBank; 