import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Radio, Input, Space, Progress, Typography, message, Modal } from 'antd';
import { ClockCircleOutlined, ExclamationCircleOutlined, FieldTimeOutlined } from '@ant-design/icons';
import MathSymbolKeyboard from './MathSymbolKeyboard';
import './TestPaper.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const morandiColors = {
    primary: '#F2A6A6',    // 主色调（粉色）
    secondary: '#F7D1D1',  // 浅粉色
    submit: '#A5C9C4'      // 提交按钮 - 莫兰迪绿
};

const TestPaper = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [problems, setProblems] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [timeSpent, setTimeSpent] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!testId) {
            message.error('测试ID无效');
    navigate('/');
            return;
        }
        console.log('当前测试ID:', testId);
        fetchTestDetails();
    }, [testId, navigate]);

    useEffect(() => {
        if (test?.estimated_time) {
            setTimeLeft(test.estimated_time * 60); // 转换为秒
        }
    }, [test]);

  useEffect(() => {
        if (timeLeft === null) return;

    const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
          clearInterval(timer);
                    handleTimeUp();
          return 0;
        }
                return prev - 1;
      });
    }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

    const fetchTestDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                message.error('未登录或登录已过期');
                navigate('/');
                return;
            } 

            console.log('正在获取测试详情，ID:', testId);
            const response = await fetch(`/api/tests/${testId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            console.log('获取测试详情响应状态:', response.status);
            console.log('响应头:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                if (response.status === 401) {
                    message.error('登录已过期，请重新登录');
    navigate('/');
                    return;
                }
                const errorText = await response.text();
                console.error('错误响应内容:', errorText);
                throw new Error(`请求失败 (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            console.log('获取到的测试详情:', data);
            
            if (!data || !data.test_info) {
                console.error('返回的数据格式不正确:', data);
                throw new Error('返回的数据格式不正确');
            }

            setTest(data.test_info);
            setProblems(data.problems);
        } catch (error) {
            console.error('获取测试详情错误:', error);
            message.error(error.message || '获取测试详情失败');
            setTest(null);
            setProblems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (value) => {
        setAnswers(prev => ({
            ...prev,
            [problems[currentIndex].id]: value
        }));
    };

    const handleTimeUp = () => {
        Modal.confirm({
            title: '时间到！',
            icon: <ExclamationCircleOutlined />,
            content: '测试时间已结束，系统将自动提交您的答案。',
            okText: '确定',
            cancelText: null,
            onOk: handleSubmit
        });
    };

    const handleSubmit = async () => {
        if (submitting) return;
        
        const unanswered = problems.filter(p => !answers[p.id]);
        if (unanswered.length > 0) {
            Modal.confirm({
                title: '确认提交',
                content: `还有 ${unanswered.length} 道题目未作答，确定要提交吗？`,
                onOk: submitAnswers
            });
        } else {
            submitAnswers();
        }
    };

    const submitAnswers = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('未登录或登录已过期');
            }

            const response = await fetch(`/api/tests/${testId}/submit`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    answers,
                    duration: timeSpent
                })
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    message.error('登录已过期，请重新登录');
                    navigate('/');
                    throw new Error('登录已过期');
                }
                throw new Error(`提交失败 (${response.status})`);
            }

            const result = await response.json();
            message.success('提交成功！');
            navigate(`/testresult/${testId}`);
        } catch (error) {
            console.error('Error submitting answers:', error);
            message.error('提交答案失败，请重试');
        } finally {
            setSubmitting(false);
        }
    };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

    const handleSymbolSelect = (symbol) => {
        const value = answers[problems[currentIndex].id] || '';
        const newValue = value + symbol;
        handleAnswer(newValue);
    };

    const renderAnswerInput = () => {
        if (currentProblem.type === 'choice' || currentProblem.type === '选择题') {
  return (
                <Radio.Group
                    onChange={(e) => handleAnswer(e.target.value)}
                    value={answers[currentProblem.id]}
                >
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {currentProblem.options.map((option, index) => (
                            <Radio key={index} value={option} style={{ width: '100%' }}>
                                {option}
                            </Radio>
                        ))}
                    </Space>
                </Radio.Group>
            );
        } else if (currentProblem.type === 'fill' || currentProblem.type === '填空题') {
            return (
                <Space.Compact style={{ width: '100%' }}>
                    <Input
                        value={answers[currentProblem.id] || ''}
                        onChange={(e) => handleAnswer(e.target.value)}
                        placeholder="请输入答案"
                    />
                    <MathSymbolKeyboard onSymbolSelect={handleSymbolSelect} />
                </Space.Compact>
            );
        } else {
            // 解答题使用文本框
            return (
                <TextArea
                    value={answers[currentProblem.id] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder="请输入答案"
                    rows={6}
                />
            );
        }
    };

    if (loading) {
        return <div>加载中...</div>;
    }

    if (!test || !problems.length) {
        return <div className="test-paper-container">
            <Card>
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                    <Title level={3}>无法加载测试</Title>
                    <Text type="secondary">测试可能不存在或您没有权限访问</Text>
                    <Button 
                        onClick={() => navigate('/test-bank')}
                        style={{
                            backgroundColor: morandiColors.primary,
                            borderColor: morandiColors.primary,
                            color: 'white'
                        }}
                    >
                        返回题库
                    </Button>
                </Space>
            </Card>
        </div>;
    }

    const currentProblem = problems[currentIndex];
    if (!currentProblem) {
        return <div className="test-paper-container">
            <Card>
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                    <Title level={3}>题目加载错误</Title>
                    <Text type="secondary">当前题目不存在</Text>
                    <Button 
                        onClick={() => navigate('/test-bank')}
                        style={{
                            backgroundColor: morandiColors.primary,
                            borderColor: morandiColors.primary,
                            color: 'white'
                        }}
                    >
                        返回题库
                    </Button>
                </Space>
            </Card>
        </div>;
    }

    return (
        <div className="test-paper-container">
            <Card>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div className="test-header">
                        <Title level={2}>{test.title}</Title>
                        <Space>
                            <FieldTimeOutlined /> 已用时间: {formatTime(timeSpent)}
                            {timeLeft !== null && (
                                <>
                                    <ClockCircleOutlined /> 剩余时间: {formatTime(timeLeft)}
                                </>
                            )}
                        </Space>
        </div>

                    <Progress
                        percent={((currentIndex + 1) / problems.length) * 100}
                        format={() => `${currentIndex + 1}/${problems.length}`}
                        strokeColor={morandiColors.primary}
                    />

                    <div className="problem-content">
                        <Title level={4}>
                            {currentIndex + 1}. {currentProblem.content}
                        </Title>
                        {renderAnswerInput()}
        </div>

                    <div className="navigation-buttons">
                        <Button
                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                        >
                            上一题
                        </Button>
                        <Button
                            onClick={() => setCurrentIndex(prev => Math.min(problems.length - 1, prev + 1))}
                            disabled={currentIndex === problems.length - 1}
                            style={{
                                backgroundColor: morandiColors.primary,
                                borderColor: morandiColors.primary,
                                color: 'white'
                            }}
                        >
                            下一题
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            loading={submitting}
                            style={{
                                backgroundColor: morandiColors.submit,
                                borderColor: morandiColors.submit,
                                color: 'white'
                            }}
                        >
                            提交
                        </Button>
          </div>
                </Space>
            </Card>
    </div>
  );
};

export default TestPaper; 