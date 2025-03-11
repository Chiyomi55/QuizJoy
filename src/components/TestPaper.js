import React, { useState, useEffect } from 'react';
import './TestPaper.css';
import { FaChevronLeft, FaChevronRight, FaClock, FaTimes, FaCheck, FaPaperPlane } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

function TestPaper({ setCurrentPage }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 题目数据 - 增加到15道题
  const questions = [
    {
      id: 1,
      type: '选择题',
      title: '三角函数基本角的应用',
      content: '已知正弦函数y=sin x的图像上有一点P(α, 0.5)，其中0°≤α≤90°，则α等于？',
      options: ['30°', '45°', '60°', '90°'],
      answer: '30°',
      userAnswer: null
    },
    {
      id: 2,
      type: '填空题',
      title: '诱导公式计算',
      content: '若sin x = 0.5，x ∈ [0°, 90°]，则sin(180° - x) = _______',
      answer: '0.5',
      userAnswer: null
    },
    {
      id: 3,
      type: '解答题',
      title: '三角恒等变换',
      content: '证明：sin²x + cos²x = 1',
      answer: '解答步骤...',
      userAnswer: null
    },
    {
      id: 4,
      type: '选择题',
      title: '三角函数图像特征',
      content: '正弦函数y=sin x的图像在区间[0°, 360°]上有几个零点？',
      options: ['1个', '2个', '3个', '4个'],
      answer: '2个',
      userAnswer: null
    },
    {
      id: 5,
      type: '填空题',
      title: '特殊角计算',
      content: 'cos 60° = _______',
      answer: '0.5',
      userAnswer: null
    },
    {
      id: 6,
      type: '选择题',
      title: '三角函数周期性',
      content: '函数y=sin(2x)的最小正周期是？',
      options: ['π', 'π/2', '2π', '4π'],
      answer: 'π',
      userAnswer: null
    },
    {
      id: 7,
      type: '填空题',
      title: '三角函数值计算',
      content: 'tan 45° = _______',
      answer: '1',
      userAnswer: null
    },
    {
      id: 8,
      type: '选择题',
      title: '三角函数单调性',
      content: '在区间[0°, 90°]内，下列哪个函数单调递增？',
      options: ['sin x', 'cos x', 'tan x', 'cot x'],
      answer: 'sin x',
      userAnswer: null
    },
    {
      id: 9,
      type: '填空题',
      title: '三角函数转化',
      content: 'sin²x + cos²x = _______',
      answer: '1',
      userAnswer: null
    },
    {
      id: 10,
      type: '选择题',
      title: '三角函数图像特征',
      content: '函数y=sin x的图像在一个周期内有几个极值点？',
      options: ['1个', '2个', '3个', '4个'],
      answer: '2个',
      userAnswer: null
    },
    {
      id: 11,
      type: '解答题',
      title: '三角函数方程',
      content: '解方程：2sin x - 1 = 0, x ∈ [0, 2π]',
      answer: '解答步骤...',
      userAnswer: null
    },
    {
      id: 12,
      type: '选择题',
      title: '三角函数应用',
      content: '一个等边三角形的边长为2，则其高为？',
      options: ['√3', '2√3', '1', '2'],
      answer: '√3',
      userAnswer: null
    },
    {
      id: 13,
      type: '填空题',
      title: '三角函数基本关系',
      content: '当0° ≤ α ≤ 90°时，sin α = 0.6，则cos α = _______',
      answer: '0.8',
      userAnswer: null
    },
    {
      id: 14,
      type: '选择题',
      title: '三角函数值域',
      content: '函数y=2sin x + 1的值域是？',
      options: ['[-1, 1]', '[0, 2]', '[-1, 3]', '[-2, 0]'],
      answer: '[-1, 3]',
      userAnswer: null
    },
    {
      id: 15,
      type: '解答题',
      title: '三角函数综合应用',
      content: '求函数y=2sin x + cos x的最大值和最小值。',
      answer: '解答步骤...',
      userAnswer: null
    }
  ];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(new Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30分钟倒计时

  // 添加退出确认对话框状态
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // 添加提交确认对话框状态
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // 添加路由切换拦截
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // 处理退出测试
  const handleExit = () => {
    setShowExitConfirm(true);
  };

  // 确认退出
  const confirmExit = () => {
    navigate('/');
    setCurrentPage('test');
  };

  // 取消退出
  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  // 添加倒计时效果
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          handleSubmit(); // 时间到自动提交
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 处理提交
  const handleSubmit = () => {
    alert('试卷已提交！');
    navigate('/');
    setCurrentPage('test');
  };

  // 处理答案变更
  const handleAnswerChange = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  // 处理提交点击
  const handleSubmitClick = () => {
    setShowSubmitConfirm(true);
  };

  // 渲染题目内容
  const renderQuestionContent = (question) => {
    switch (question.type) {
      case '选择题':
        return (
          <div className="options-container">
            {question.options.map((option, index) => (
              <label key={index} className="option-item">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={answers[currentQuestion] === option}
                  onChange={() => handleAnswerChange(option)}
                />
                <span className="option-text">{option}</span>
              </label>
            ))}
          </div>
        );
      case '填空题':
        return (
          <div className="fill-blank-container">
            <input
              type="text"
              value={answers[currentQuestion] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="请输入答案"
            />
          </div>
        );
      case '解答题':
        return (
          <div className="solution-container">
            <textarea
              value={answers[currentQuestion] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="请输入解答过程"
              rows={6}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // 格式化时间
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="test-paper">
      {/* 左侧题号导航 */}
      <div className="question-nav">
        <div className="timer">
          <FaClock /> {formatTime(timeLeft)}
        </div>
        <div className="question-numbers">
          {questions.map((q, index) => (
            <button
              key={q.id}
              className={`question-number ${index === currentQuestion ? 'active' : ''} ${
                answers[index] ? 'answered' : ''
              }`}
              onClick={() => setCurrentQuestion(index)}
            >
              {q.id}
            </button>
          ))}
        </div>
        {/* 添加提交试卷按钮 */}
        <button className="submit-paper-btn" onClick={handleSubmitClick}>
          <FaCheck /> 提交试卷
        </button>
        <button className="exit-test-btn" onClick={handleExit}>
          <FaTimes /> 退出测试
        </button>
      </div>

      {/* 添加提交确认对话框 */}
      {showSubmitConfirm && (
        <div className="exit-confirm-overlay">
          <div className="exit-confirm-dialog">
            <h3>确认提交试卷？</h3>
            <p>提交后答案不可更改！</p>
            <div className="dialog-buttons">
              <button className="cancel-btn" onClick={() => setShowSubmitConfirm(false)}>取消</button>
              <button className="confirm-btn submit" onClick={handleSubmit}>确认提交</button>
            </div>
          </div>
        </div>
      )}

      {/* 退出确认对话框 */}
      {showExitConfirm && (
        <div className="exit-confirm-overlay">
          <div className="exit-confirm-dialog">
            <h3>确认退出测试？</h3>
            <p>退出后本次测试的做题记录将不会保存！</p>
            <div className="dialog-buttons">
              <button className="cancel-btn" onClick={cancelExit}>取消</button>
              <button className="confirm-btn" onClick={confirmExit}>确认退出</button>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="question-content">
        <div className="question-header">
          <div className="question-info">
            <span className="question-type">{questions[currentQuestion].type}</span>
            <h2 className="question-title">{questions[currentQuestion].title}</h2>
          </div>
          <div className="question-progress">
            {currentQuestion + 1} / {questions.length}
          </div>
        </div>

        <div className="question-body">
          <p className="question-text">{questions[currentQuestion].content}</p>
          {renderQuestionContent(questions[currentQuestion])}
        </div>

        <div className="question-footer">
          {/* 左侧按钮 - 只有不是第一题时显示 */}
          <div className="left-buttons">
            {currentQuestion > 0 && (
              <button
                className="nav-btn prev"
                onClick={() => setCurrentQuestion(curr => curr - 1)}
              >
                <FaChevronLeft /> 上一题
              </button>
            )}
          </div>
          
          {/* 右侧按钮 - 最后一题显示提交，其他显示下一题 */}
          <div className="right-buttons">
            {currentQuestion === questions.length - 1 ? (
              <button
                className="nav-btn submit"
                onClick={handleSubmitClick}
              >
                提交试卷 <FaPaperPlane />
              </button>
            ) : (
              <button
                className="nav-btn next"
                onClick={() => setCurrentQuestion(curr => curr + 1)}
              >
                下一题 <FaChevronRight />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestPaper; 