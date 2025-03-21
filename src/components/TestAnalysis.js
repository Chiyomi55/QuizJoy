import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Column, Pie } from '@ant-design/plots';
import './TestAnalysis.css';
import { FaClock, FaUsers, FaExclamationTriangle } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { fetchWithAuth } from '../utils/api';

function TestAnalysis() {
  const { testId } = useParams();
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTestAnalysis = async () => {
      try {
        const response = await fetchWithAuth(`/teacher/tests/${testId}/stats`);
        const data = await response.json();
        setTestData(data);
        setLoading(false);
      } catch (err) {
        console.error('获取测试分析数据失败:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTestAnalysis();
  }, [testId]);

  if (loading) return <div className="loading">正在加载分析数据...</div>;
  if (error) return <div className="error">加载失败: {error}</div>;
  if (!testData) return null;

  // 分数分布图配置
  const scoreDistConfig = {
    data: testData.score_distribution,
    xField: 'range',
    yField: 'count',
    label: {
      position: 'top',
      style: {
        fill: '#000000',
        opacity: 0.8,
      },
    },
    meta: {
      range: { alias: '分数区间' },
      count: { alias: '人数' }
    },
    color: '#1890ff'
  };

  // 知识点掌握情况饼图配置
  const topicMasteryConfig = {
    data: testData.topic_mastery,
    angleField: 'value',
    colorField: 'topic',
    radius: 0.8,
    label: {
      content: (data) => `${data.topic}: ${data.value}%`,
      autoRotate: true,
      style: {
        fontSize: 12,
        fill: '#333'
      }
    },
    legend: {
      position: 'right',
      itemHeight: 16
    },
    tooltip: {
      formatter: (data) => {
        return { name: data.topic, value: `${data.value}%` };
      }
    }
  };

  return (
    <div className="test-analysis">
      <div className="analysis-header">
        <h2>{testData.title}</h2>
        <div className="test-meta">
          <span>截止日期：{new Date(testData.deadline).toLocaleString()}</span>
          <span>难度：{'★'.repeat(testData.difficulty)}</span>
          <span>预计用时：{testData.estimated_time}分钟</span>
        </div>
      </div>

      <div className="analysis-overview">
        <div className="stat-card">
          <h3>参与情况</h3>
          <div className="stat-value">{testData.completed_count}/{testData.total_students}</div>
          <div className="stat-label">完成率 {Math.round(testData.completion_rate)}%</div>
        </div>
        <div className="stat-card">
          <h3>平均分</h3>
          <div className="stat-value">{testData.average_score.toFixed(1)}</div>
          <div className="stat-label">满分 100</div>
        </div>
        <div className="stat-card">
          <h3>平均用时</h3>
          <div className="stat-value">{Math.round(testData.average_time)}分钟</div>
          <div className="stat-label">预计 {testData.estimated_time}分钟</div>
        </div>
      </div>

      <div className="analysis-charts">
        <div className="chart-section">
          <h3>分数分布</h3>
          <div className="chart-container">
            <Column {...scoreDistConfig} />
          </div>
        </div>

        <div className="chart-section">
          <h3>知识点掌握情况</h3>
          <div className="chart-container">
            <Pie {...topicMasteryConfig} />
          </div>
        </div>
      </div>

      <div className="question-analysis">
        <h3>题目分析</h3>
        <div className="question-list">
          {testData.question_stats.map((question, index) => (
            <div key={index} className="question-item">
              <div className="question-header">
                <h4>第{index + 1}题：{question.title}</h4>
                <div className="question-meta">
                  <span>知识点：{question.topics.join('、')}</span>
                  <span>难度：{'★'.repeat(question.difficulty)}</span>
                </div>
              </div>
              
              <div className="question-stats">
                <div className="stat-row">
                  <div className="stat-label">正确率</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-progress"
                      style={{ 
                        width: `${question.correct_rate}%`,
                        backgroundColor: question.correct_rate >= 80 ? '#52c41a' : 
                                       question.correct_rate >= 60 ? '#1890ff' : '#ff4d4f'
                      }}
                    />
                    <span className="stat-value">{question.correct_rate}%</span>
                  </div>
                </div>

                <div className="stat-row">
                  <div className="stat-label">平均用时</div>
                  <div className="stat-value">{question.average_time.toFixed(1)}分钟</div>
                </div>

                <div className="common-mistakes">
                  <h5>常见错误</h5>
                  <ul>
                    {question.common_mistakes.map((mistake, i) => (
                      <li key={i}>
                        <span className="mistake-count">{mistake.count}人</span>
                        {mistake.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TestAnalysis; 