import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherTestBank.css';
import { FaPlus, FaClock, FaChartBar, FaUsers } from 'react-icons/fa';

function TeacherTestBank() {
  const navigate = useNavigate();
  
  // 教师布置的小测数据
  const testSets = [
    {
      id: 1,
      title: '三角函数月测',
      type: '月测',
      deadline: '2024-04-10 23:59',
      totalStudents: 35,
      completedCount: 28,
      averageTime: 25,
      averageScore: 85,
      difficulty: 3,
      createdAt: '2024-04-01',
      scoreDistribution: {
        '90-100': 8,
        '80-89': 12,
        '60-79': 6,
        '<60': 2
      },
      questionStats: [
        { id: 1, title: '三角函数基本角的应用', correctRate: 85, avgTime: 2.5 },
        { id: 2, title: '三角恒等变换', correctRate: 55, avgTime: 4.2 },
        { id: 3, title: '诱导公式应用', correctRate: 62, avgTime: 3.8 }
      ]
    },
    {
      id: 2,
      title: '第一次模拟考试',
      type: '模拟考',
      deadline: '2024-04-15 23:59',
      totalStudents: 35,
      completedCount: 32,
      averageTime: 120,
      averageScore: 78,
      difficulty: 4,
      createdAt: '2024-04-05',
      scoreDistribution: {
        '90-100': 5,
        '80-89': 10,
        '60-79': 14,
        '<60': 3
      },
      questionStats: [
        { id: 1, title: '函数与导数综合题', correctRate: 72, avgTime: 8.5 },
        { id: 2, title: '立体几何计算题', correctRate: 68, avgTime: 10.2 },
        { id: 3, title: '解析几何证明题', correctRate: 45, avgTime: 12.5 },
        { id: 4, title: '数列求和问题', correctRate: 58, avgTime: 9.8 }
      ]
    },
    {
      id: 3,
      title: '第三周周测',
      type: '周测',
      deadline: '2024-04-08 23:59',
      totalStudents: 35,
      completedCount: 35,
      averageTime: 40,
      averageScore: 92,
      difficulty: 3,
      createdAt: '2024-04-03',
      scoreDistribution: {
        '90-100': 15,
        '80-89': 12,
        '60-79': 6,
        '<60': 2
      },
      questionStats: [
        { id: 1, title: '数列基础题', correctRate: 95, avgTime: 3.5 },
        { id: 2, title: '等差数列应用', correctRate: 88, avgTime: 4.2 },
        { id: 3, title: '等比数列求和', correctRate: 82, avgTime: 5.1 }
      ]
    }
  ];

  const [filters, setFilters] = useState({
    type: '全部',
    timeRange: '全部',
    searchText: ''
  });

  const handleCreateTest = () => {
    navigate('/teacher/create-test');
  };

  const handleTestClick = (testId) => {
    navigate(`/teacher/test-analysis/${testId}`);
  };

  return (
    <div className="teacher-test-bank">
      {/* 顶部操作栏 */}
      <div className="action-bar">
        <button className="create-test-btn" onClick={handleCreateTest}>
          <FaPlus /> 布置新小测
        </button>
        <div className="filters">
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
          >
            <option value="全部">全部类型</option>
            <option value="月测">月测</option>
            <option value="模拟考">模拟考</option>
            <option value="周测">周测</option>
            <option value="单元测">单元测</option>
          </select>
          <select
            value={filters.timeRange}
            onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
          >
            <option value="全部">全部时间</option>
            <option value="最近一周">最近一周</option>
            <option value="最近一月">最近一月</option>
            <option value="本学期">本学期</option>
          </select>
          <input
            type="text"
            placeholder="搜索小测..."
            value={filters.searchText}
            onChange={(e) => setFilters({...filters, searchText: e.target.value})}
          />
        </div>
      </div>

      {/* 小测列表 */}
      <div className="test-list">
        {testSets.map(test => (
          <div key={test.id} className="test-card" onClick={() => handleTestClick(test.id)}>
            <div className="test-header">
              <div className="test-info">
                <span className="test-type">{test.type}</span>
                <h3>{test.title}</h3>
                <span className="deadline">
                  <FaClock /> 截止：{test.deadline}
                </span>
              </div>
              <div className="completion-status">
                <div className="status-item">
                  <FaUsers />
                  <span>{test.completedCount}/{test.totalStudents} 已完成</span>
                </div>
                <div className="status-item">
                  <FaChartBar />
                  <span>平均分：{test.averageScore}</span>
                </div>
              </div>
            </div>

            <div className="test-stats">
              {/* 成绩分布简图 */}
              <div className="score-distribution">
                <div className="distribution-bar">
                  {Object.entries(test.scoreDistribution).map(([range, count]) => (
                    <div
                      key={range}
                      className={`distribution-segment ${range}`}
                      style={{
                        width: `${(count / test.completedCount) * 100}%`
                      }}
                      title={`${range}分: ${count}人`}
                    />
                  ))}
                </div>
              </div>

              {/* 题目完成情况 */}
              <div className="question-stats">
                {test.questionStats.map((question, index) => (
                  <div key={index} className="question-stat-item">
                    <span className="question-title">第{question.id}题</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-progress"
                        style={{ 
                          width: `${question.correctRate}%`,
                          backgroundColor: question.correctRate >= 80 ? '#52c41a' : 
                                         question.correctRate >= 60 ? '#1890ff' : '#ff4d4f'
                        }}
                      />
                    </div>
                    <span className="correct-rate">{question.correctRate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeacherTestBank; 