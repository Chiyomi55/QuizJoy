import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Space, message, Tag, Divider } from 'antd';
import { LeftOutlined, RightOutlined, CheckOutlined, CloseOutlined, HomeOutlined } from '@ant-design/icons';
import './TestResult.css';

const { Title, Text } = Typography;

// 莫兰迪色系
const morandiColors = {
    primary: '#F2A6A6',    // 主色调（粉色）
    secondary: '#F7D1D1',  // 浅粉色
    green: '#A5C9C4',      // 莫兰迪绿
    red: '#E6A6A6',        // 莫兰迪红
    background: '#FDF6F6', // 背景色
    text: '#5C5757',       // 文字色
    correct: '#A5C9C4',    // 正确色
    wrong: '#E6A6A6',      // 错误色
    border: '#E8CFCF'      // 边框色
};

const TestResult = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [testResult, setTestResult] = useState(null);
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);

    useEffect(() => {
        fetchTestResult();
    }, [testId]);

    const fetchTestResult = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                message.error('未登录或登录已过期');
                navigate('/');
                return;
            }

            const response = await fetch(`/api/tests/${testId}/result`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    message.error('登录已过期，请重新登录');
                    navigate('/');
                    return;
                }
                const errorText = await response.text();
                console.error('错误响应内容:', errorText);
                throw new Error(`获取测试结果失败 (${response.status}): ${errorText}`);
            }
            const data = await response.json();
            setTestResult(data);
        } catch (error) {
            console.error('获取测试结果错误:', error);
            message.error(error.message || '获取测试结果失败');
        }
    };

    if (!testResult) return <div>加载中...</div>;

    const currentProblem = testResult.problems[currentProblemIndex];
    const isCorrect = currentProblem.user_answer === currentProblem.correct_answer;

    const handlePrevious = () => {
        setCurrentProblemIndex(prev => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentProblemIndex(prev => Math.min(testResult.problems.length - 1, prev + 1));
    };

    return (
        <div className="test-result-container">
            <Card className="score-card">
                <div className="score-info">
                    <div className="score-circle" style={{ borderColor: morandiColors.primary }}>
                        <span className="score-number" style={{ color: morandiColors.primary }}>
                            {testResult.submission_info.score}
                        </span>
                        <span className="score-label">分数</span>
                    </div>
                    <Divider type="vertical" style={{ height: '50px', margin: '0 24px' }} />
                    <Space size="large">
                        <div className="stat-item">
                            <Text strong>总题数</Text>
                            <Text>{testResult.submission_info.total_count}</Text>
                        </div>
                        <Divider type="vertical" style={{ height: '40px' }} />
                        <div className="stat-item">
                            <Text strong>正确题数</Text>
                            <Text>{testResult.submission_info.correct_count}</Text>
                        </div>
                        <Divider type="vertical" style={{ height: '40px' }} />
                        <div className="stat-item">
                            <Text strong>用时</Text>
                            <Text>{Math.floor(testResult.submission_info.duration / 60)} 分钟</Text>
                        </div>
                    </Space>
                </div>
            </Card>

            <Card className="problem-detail-card">
                <div className="problem-header">
                    <Title level={4}>第 {currentProblemIndex + 1} 题</Title>
                    <Tag className={`status-tag ${isCorrect ? 'correct' : 'wrong'}`}>
                        {isCorrect ? <CheckOutlined /> : <CloseOutlined />}
                        {isCorrect ? ' 正确' : ' 错误'}
                    </Tag>
                </div>

                <div className="problem-content">
                    {currentProblem.content}
                </div>

                <div className="answers-container">
                    <div className="answer-box">
                        <Space>
                            <Text strong>你的答案：</Text>
                            <Text>{currentProblem.user_answer || '未作答'}</Text>
                        </Space>
                    </div>
                    <div className="answer-box">
                        <Space>
                            <Text strong>正确答案：</Text>
                            <Text>{currentProblem.correct_answer}</Text>
                        </Space>
                    </div>
                </div>

                <div className="explanation-section">
                    <Title level={5}>解析</Title>
                    <Text>{currentProblem.explanation}</Text>
                </div>

                <div className="navigation-buttons">
                    <Button 
                        onClick={handlePrevious}
                        disabled={currentProblemIndex === 0}
                        icon={<LeftOutlined />}
                        style={{ 
                            backgroundColor: morandiColors.primary,
                            borderColor: morandiColors.primary,
                            color: 'white'
                        }}
                    >
                        上一题
                    </Button>
                    <Button 
                        onClick={handleNext}
                        disabled={currentProblemIndex === testResult.problems.length - 1}
                        icon={<RightOutlined />}
                        style={{ 
                            backgroundColor: morandiColors.primary,
                            borderColor: morandiColors.primary,
                            color: 'white'
                        }}
                    >
                        下一题
                    </Button>
                </div>

                <div className="problem-navigation">
                    {testResult.problems.map((problem, index) => (
                        <Button
                            key={index}
                            className={`nav-button ${
                                problem.user_answer === problem.correct_answer ? 'correct' : 'wrong'
                            } ${index === currentProblemIndex ? 'current' : ''}`}
                            onClick={() => setCurrentProblemIndex(index)}
                        >
                            {index + 1}
                        </Button>
                    ))}
                </div>
            </Card>

            <div className="action-buttons">
                <Button 
                    icon={<HomeOutlined />}
                    onClick={() => {
                        navigate('/');
                        localStorage.setItem('currentPage', 'test');
                        window.location.reload();
                    }}
                    style={{ 
                        backgroundColor: morandiColors.primary,
                        borderColor: morandiColors.primary,
                        color: 'white'
                    }}
                >
                    返回题库
                </Button>
            </div>
        </div>
    );
};

export default TestResult; 