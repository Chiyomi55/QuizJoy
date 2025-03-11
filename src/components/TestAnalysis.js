import React from 'react';
import { useParams } from 'react-router-dom';
import './TestAnalysis.css';
import { FaClock, FaUsers, FaExclamationTriangle } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function TestAnalysis() {
  const { testId } = useParams();

  // 模拟测试数据
  const testData = {
    id: testId,
    title: '三角函数月测',
    type: '月测',
    totalStudents: 35,
    completedCount: 28,
    averageTime: 25,
    averageScore: 85,
    scoreDistribution: {
      '90-100': 8,
      '80-89': 12,
      '60-79': 6,
      '<60': 2
    },
    questionStats: [
      {
        id: 1,
        title: '三角函数基本角的应用',
        correctRate: 85,
        avgTime: 2.5
      },
      {
        id: 2,
        title: '三角恒等变换',
        correctRate: 55,
        avgTime: 4.2
      },
      // 其他题目...
    ]
  };

  return (
    <div className="test-analysis">
      <div className="analysis-header">
        <h2>{testData.title}</h2>
        <div className="test-overview">
          <div className="overview-item">
            <FaUsers />
            <span>{testData.completedCount}/{testData.totalStudents} 已完成</span>
          </div>
          <div className="overview-item">
            <FaClock />
            <span>平均用时：{testData.averageTime}分钟</span>
          </div>
        </div>
      </div>

      <div className="analysis-content">
        {/* 成绩分布图表 */}
        <div className="analysis-card">
          <h3>成绩分布</h3>
          <BarChart
            width={600}
            height={300}
            data={Object.entries(testData.scoreDistribution).map(([range, count]) => ({
              range,
              count
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </div>

        {/* 题目分析列表 */}
        <div className="analysis-card questions-card">
          <h3>题目完成情况</h3>
          <div className="question-analysis-list">
            {testData.questionStats.map(question => (
              <div key={question.id} className="question-analysis-item">
                <div className="question-header">
                  <h4>第{question.id}题：{question.title}</h4>
                  <div className="question-stats">
                    <div className="correct-rate">
                      <div className="rate-bar">
                        <div 
                          className="rate-progress"
                          style={{ 
                            width: `${question.correctRate}%`,
                            backgroundColor: question.correctRate >= 80 ? '#52c41a' : 
                                           question.correctRate >= 60 ? '#1890ff' : '#ff4d4f'
                          }}
                        />
                      </div>
                      <span>{question.correctRate}% 正确</span>
                    </div>
                    <span className="avg-time">平均用时：{question.avgTime}分钟</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestAnalysis; 