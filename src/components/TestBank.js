import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Space, Typography, message, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ClockCircleOutlined, StarOutlined, CheckCircleOutlined, RightOutlined } from '@ant-design/icons';
import './TestBank.css';

const { Title, Text } = Typography;

// 粉色系莫兰迪色
const morandiColors = {
    primary: '#F2A6A6',    // 主色调（粉色）
    secondary: '#F7D1D1',  // 浅粉色
    accent: '#E6D5D5',     // 灰粉色
    background: '#FDF6F6', // 背景色（浅粉白）
    text: '#5C5757',       // 文字色
    completed: '#E8CFCF',  // 已完成色
    button: '#F2A6A6',     // 按钮色
    buttonHover: '#F7B8B8', // 按钮悬浮色
    tag: {
        easy: '#FFD700',    // 简单 - 黄色
        medium: '#FFD700',  // 中等 - 黄色
        hard: '#FFD700'     // 困难 - 黄色
    },
    submit: '#A5C9C4'      // 提交按钮 - 莫兰迪绿
};

const TestBank = () => {
    const [tests, setTests] = useState([]);
    const [completedTests, setCompletedTests] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTests();
        fetchCompletedTests();
    }, []);

    const fetchTests = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                message.error('请先登录');
                navigate('/');
                return;
            }

            const response = await fetch('http://localhost:5000/api/tests/', {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('获取测试列表失败');
            }

            const data = await response.json();
            setTests(data);
        } catch (error) {
            console.error('Error:', error);
            message.error(error.message);
        }
    };

    const fetchCompletedTests = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/tests/completed/', {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('获取已完成测试列表失败');
            }

            const data = await response.json();
            setCompletedTests(data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleTestClick = (testId) => {
        // 如果测试已完成，跳转到结果页面
        if (completedTests.includes(testId)) {
            navigate(`/testresult/${testId}`);
        } else {
            navigate(`/test/${testId}`);
        }
    };

    const getDifficultyStars = (difficulty) => {
    return (
            <div className="difficulty-stars">
        {[...Array(5)].map((_, index) => (
                    <StarOutlined key={index} style={{ 
                        color: index < difficulty ? '#FFB800' : '#E8E8E8',
                    }} />
        ))}
      </div>
    );
  };

  return (
        <div className="test-bank-container" style={{ background: morandiColors.background }}>
            <Title level={2} style={{ color: morandiColors.text, marginBottom: '24px', textAlign: 'center' }}>
                小测列表
            </Title>
            <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
                dataSource={tests}
                renderItem={test => (
                    <List.Item>
                        <Card
                            className={completedTests.includes(test.id) ? 'completed-test' : 'test-card'}
                            style={{
                                background: completedTests.includes(test.id) ? morandiColors.completed : '#fff',
                                borderColor: 'transparent',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                height: '100%',  // 确保所有卡片高度一致
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div className="test-card-content">
            <div className="test-card-header">
                                    <Title level={4} style={{ 
                                        color: morandiColors.text, 
                                        margin: 0,
                                        fontSize: '18px',
                                        fontWeight: '500'
                                    }}>
                                        {test.title}
                                        {completedTests.includes(test.id) && (
                                            <CheckCircleOutlined style={{ 
                                                marginLeft: '8px', 
                                                color: morandiColors.primary,
                                                fontSize: '16px'
                                            }} />
                                        )}
                                    </Title>
            </div>
            
                                <Text style={{ 
                                    color: morandiColors.text, 
                                    margin: '16px 0', 
                                    display: 'block',
                                    fontSize: '14px',
                                    opacity: 0.85
                                }}>
                                    {test.description}
                                </Text>

                                <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 'auto' }}>
                                    <div className="test-info-tags">
                                        {getDifficultyStars(test.difficulty)}
                                        <Tag color={morandiColors.secondary} style={{ 
                                            color: morandiColors.text,
                                            padding: '4px 12px',
                                            borderRadius: '6px'
                                        }}>
                                            <ClockCircleOutlined /> {test.estimated_time} 分钟
                                        </Tag>
            </div>

            <div className="test-topics">
              {test.topics.map(topic => (
                                            <Tag 
                                                key={topic} 
                                                color={morandiColors.accent}
                                                style={{ 
                                                    color: morandiColors.text, 
                                                    margin: '4px',
                                                    padding: '4px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                {topic}
                                            </Tag>
              ))}
            </div>
                                </Space>

                                <Button
                                    type="primary"
                                    onClick={() => handleTestClick(test.id)}
                                    className="start-test-button"
                                    style={{
                                        marginTop: '20px',
                                        width: '100%',
                                        background: morandiColors.button,
                                        borderColor: 'transparent',
                                        height: '40px',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontWeight: '500'
                                    }}
                                >
                                    {completedTests.includes(test.id) ? '查看结果' : '开始测试'} 
                                    <RightOutlined />
                                </Button>
              </div>
                        </Card>
                    </List.Item>
                )}
            />
    </div>
  );
};

export default TestBank; 