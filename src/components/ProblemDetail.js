import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProblemDetail.css';
import { FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';
import { fetchWithAuth } from '../utils/api';

function ProblemDetail() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        
        // 如果有 token 就带上，没有也可以请求
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`http://localhost:5000/api/problems/${problemId}`, {
          headers: headers
        });

        if (!response.ok) {
          throw new Error('Failed to load problem');
        }

        const data = await response.json();
        setProblem(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch problem:', err);
        setError('Failed to load problem');
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // 添加知识点掌握情况数据
  const knowledgePoints = [
    { name: '解析几何', mastery: 85 },
    { name: '抛物线', mastery: 72 },
    { name: '焦点', mastery: 68 }
  ];

  // 添加推荐习题数据
  const recommendedProblems = [
    { id: 11, title: '圆的标准方程应用' },
    { id: 19, title: '椭圆的标准方程' },
    { id: 5, title: '函数的极值问题' }
  ];

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/', { state: { showLogin: true } });
      return;
    }

    try {
      console.log('Submitting answer:', {
        problemId,
        answer: userAnswer,
        token: token.substring(0, 10) + '...' // 只打印token前10位
      });

      const response = await fetch(`http://localhost:5000/api/problems/${problemId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answer: userAnswer })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Submit error response:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(errorData.error || errorData.msg || '提交失败');
      }
      
      const data = await response.json();
      console.log('Submit success response:', data);
      
      setProblem(prev => ({
        ...prev,
        correctAnswer: data.correct_answer,
        explanation: data.explanation
      }));
      setShowResult(true);
    } catch (err) {
      console.error('Submit error details:', err);
      alert('提交答案失败，请稍后重试');
    }
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setUserAnswer('');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!problem) return <div className="error">Problem not found</div>;

  return (
    <div className="problem-detail">
      <div className="problem-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <FaArrowLeft /> 返回题库
        </button>
        <span className="problem-type">{problem.type}</span>
      </div>

      <div className="problem-content-wrapper">
        <div className="problem-content">
          <h2>{problem.title}</h2>
          <div className="problem-text">{problem.content}</div>

          {!showResult ? (
            <div className="answer-section">
              <div className="options-container">
                {problem.type === '选择题' && problem.options && Array.isArray(problem.options) && (
                  problem.options.map((option, index) => (
                    <label key={index} className="option-item">
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={userAnswer === option}
                        onChange={(e) => setUserAnswer(e.target.value)}
                      />
                      <span className="option-text">{option}</span>
                    </label>
                  ))
                )}
                {problem.type === '填空题' && (
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="请输入答案"
                    className="fill-blank-input"
                  />
                )}
                {problem.type === '解答题' && (
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="请输入解答过程"
                    className="solution-textarea"
                    rows={6}
                  />
                )}
              </div>
              <button 
                className="submit-btn"
                onClick={handleSubmit}
                disabled={!userAnswer}
              >
                提交答案
              </button>
            </div>
          ) : (
            <div className="result-section">
              <div className={`result ${userAnswer === problem.correctAnswer ? 'correct' : 'incorrect'}`}>
                {userAnswer === problem.correctAnswer ? (
                  <><FaCheck /> 回答正确！</>
                ) : (
                  <><FaTimes /> 回答错误，正确答案是：{problem.correctAnswer}</>
                )}
              </div>
              <div className="explanation">
                <h3>解析</h3>
                <p>{problem.explanation}</p>
              </div>
              <button className="try-again-btn" onClick={handleTryAgain}>
                再做一次
              </button>
            </div>
          )}
        </div>

        {/* 右侧知识点信息栏 */}
        <div className="knowledge-sidebar">
          <div className="knowledge-points">
            <h3>相关知识点</h3>
            {knowledgePoints.map((point, index) => (
              <div key={index} className="knowledge-item">
                <div className="knowledge-header">
                  <span className="knowledge-tag">{point.name}</span>
                  <span className="mastery-score">{point.mastery}分</span>
                </div>
                <div className="mastery-bar">
                  <div 
                    className="mastery-progress" 
                    style={{ width: `${point.mastery}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* 推荐习题部分，仅在显示结果时显示 */}
          {showResult && (
            <div className="recommended-problems">
              <h3>推荐习题</h3>
              <p className="recommend-tip">
                {userAnswer === problem.correctAnswer 
                  ? '巩固练习，建议尝试以下题目：' 
                  : '针对性练习，建议先做以下题目：'}
              </p>
              <div className="problem-list">
                {recommendedProblems.map(prob => (
                  <div 
                    key={prob.id} 
                    className="recommended-item"
                    onClick={() => navigate(`/problem/${prob.id}`)}
                  >
                    <span className="problem-id">#{prob.id}</span>
                    <span className="problem-title">{prob.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProblemDetail; 