import React, { useState, useRef, useEffect } from 'react';
import './ProfilePage.css';
import { BsCamera } from 'react-icons/bs';
import ReactCalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Card, Avatar, List, Statistic, Row, Col, Spin, message } from 'antd';
import { UserOutlined, TrophyOutlined, BookOutlined } from '@ant-design/icons';
import { Radar, Pie } from '@ant-design/plots';

function ProfilePage({ user, onLogin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    nickname: '',
    school: '',
    class: '',
    achievements: [],
    subject: '',
    title: ''
  });
  const [activityData, setActivityData] = useState([]);
  const [knowledgeStatus, setKnowledgeStatus] = useState([]);
  const [difficultyDistribution, setDifficultyDistribution] = useState([]);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 并行获取所有数据
        const [userInfoResponse, activityResponse, knowledgeResponse, difficultyResponse] = await Promise.all([
          fetchWithAuth('/api/profile/info'),
          fetchWithAuth('/api/profile/activity'),
          fetchWithAuth('/api/profile/knowledge_status'),
          fetchWithAuth('/api/profile/difficulty_distribution')
        ]);

        // 处理用户信息
        if (userInfoResponse.ok) {
          const userData = await userInfoResponse.json();
          const updatedUserInfo = {
            nickname: userData.nickname || user.nickname || '',
            school: userData.school || '',
            class: userData.grade || '',
            subject: userData.subject || '',
            title: userData.title || '',
            achievements: userData.achievements || []
          };
          setUserInfo(updatedUserInfo);
        }

        // 处理活动数据
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setActivityData(activityData);
        }

        // 处理知识点状态
        if (knowledgeResponse.ok) {
          const knowledgeData = await knowledgeResponse.json();
          setKnowledgeStatus(knowledgeData);
        }

        // 处理难度分布
        if (difficultyResponse.ok) {
          const difficultyData = await difficultyResponse.json();
          setDifficultyDistribution(difficultyData);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('数据加载失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // 如果用户未登录，显示登录提示
  if (!user) {
    return (
      <div className="login-prompt">
        <h2>请先登录或注册一个账号！</h2>
        <button className="login-btn" onClick={() => onLogin()}>
          去登录
        </button>
      </div>
    );
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h2>出错了</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>刷新页面</button>
      </div>
    );
  }

  // 模拟成绩数据
  const scoreData = {
    labels: ['1月', '2月', '3月', '4月'],
    datasets: [{
      label: '测试成绩',
      data: [85, 88, 92, 95],
      borderColor: '#B8A6D9',
      tension: 0.4
    }]
  };

  // 知识点掌握度数据
  const knowledgeData = {
    labels: ['三角函数', '数列', '概率统计', '立体几何', '解析几何'],
    datasets: [{
      label: '掌握度',
      data: [85, 70, 90, 75, 80],
      backgroundColor: '#E1BEE7',  // 只保留柱子的颜色
      borderColor: '#CE93D8',
      borderWidth: 1,
      barPercentage: 0.5,  // 调整柱子宽度
      categoryPercentage: 0.8  // 调整类别间距
    }]
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem('userAvatar', reader.result);
        setUserInfo(prev => ({...prev}));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      console.log('Saving user info:', userInfo);
      
      const response = await fetchWithAuth('/api/profile/info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: userInfo.nickname,
          school: userInfo.school,
          class: userInfo.class,  // 确保发送 class 字段
          achievements: userInfo.achievements
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新失败');
      }

      const updatedUser = await response.json();
      console.log('Server response:', updatedUser);
      
      // 更新状态时使用后端返回的数据
      setUserInfo({
        ...userInfo,
        nickname: updatedUser.nickname || '',
        school: updatedUser.school || '',
        class: updatedUser.grade || '',  // 使用后端返回的 grade 字段
        achievements: updatedUser.achievements || []
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('更新失败，请重试');
    }
  };

  const getColor = (count) => {
    if (!count) return '#ebedf0';  // 无数据时的颜色
    if (count <= 2) return '#F8BBD0';  // 浅粉色
    if (count <= 4) return '#F48FB1';  // 中浅粉色
    if (count <= 6) return '#CE93D8';  // 浅紫色
    if (count <= 8) return '#BA68C8';  // 中紫色
    return '#8E24AA';  // 深紫色
  };

  const radarConfig = {
    data: knowledgeStatus.map(item => ({
      item: item.topic,
      score: item.mastery,
      user: '当前水平'
    })),
    xField: 'item',
    yField: 'score',
    seriesField: 'user',
    meta: {
      score: {
        alias: '掌握度',
        min: 0,
        max: 100,
      },
    },
    xAxis: {
      line: null,
      tickLine: null,
      grid: {
        line: {
          style: {
            lineDash: null,
          },
        },
      },
    },
    yAxis: {
      label: false,
      grid: {
        alternateColor: 'rgba(0, 0, 0, 0.04)',
      },
    },
    // 开启辅助点
    point: {
      size: 2,
    },
    area: {
      style: {
        fill: '#F2A6A6',
        fillOpacity: 0.3,
      },
    },
  };

  const pieConfig = {
    data: difficultyDistribution,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    color: ['#E8D4D4', '#F2A6A6', '#A5C9C4', '#D4E2D4', '#ECE3D4'],
    label: {
      type: 'spider',
      content: '{name}\n{percentage}',
      style: {
        fontSize: 12,
        textAlign: 'center',
      },
    },
    legend: {
      position: 'bottom',
      itemHeight: 8,
      itemWidth: 8,
      marker: {
        symbol: 'square',
      },
    },
    tooltip: {
      formatter: (datum) => {
        return { name: datum.type, value: `${datum.value}题 (${datum.rate}%)` };
      }
    },
  };

  return (
    <div className="profile-container">
      <h1 className="profile-title">个人学习档案</h1>
      <Row gutter={24}>
        <Col span={6}>
          <Card className="profile-card">
            <div className="profile-header">
              <Avatar size={100} icon={<UserOutlined />} />
              <h2>{userInfo.nickname || user.nickname || '未设置昵称'}</h2>
              <p>{userInfo.school || '未设置学校'} {userInfo.class || '未设置班级'}</p>
            </div>
            
            <div className="profile-stats">
              <Statistic title="总做题数" value={activityData.reduce((sum, item) => sum + item.count, 0)} />
              <Statistic title="连续做题" value={userInfo.streak_days || 0} suffix="天" />
            </div>

            <div className="achievements-section">
              <h3><TrophyOutlined /> 成就</h3>
              <List
                dataSource={userInfo.achievements || []}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={item}
                    />
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>
        
        <Col span={18}>
          <Card className="activity-card" style={{ marginBottom: '16px' }}>
            <h3>学习热力图</h3>
            <div className="activity-heatmap">
              <ReactCalendarHeatmap
                values={activityData}
                startDate={new Date(new Date().setDate(new Date().getDate() - 180))}
                endDate={new Date()}
                classForValue={value => {
                  if (!value) return 'color-empty';
                  return `color-scale-${Math.min(Math.floor(value.count / 2), 4)}`;
                }}
                titleForValue={value => {
                  if (!value) return '没有提交';
                  return `${value.date}: ${value.count} 次提交`;
                }}
                tooltipDataAttrs={value => {
                  if (!value) return { 'data-tip': '没有提交' };
                  return {
                    'data-tip': `${value.date}: ${value.count} 次提交`
                  };
                }}
                showWeekdayLabels={false}
                monthLabels={['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']}
              />
              <div className="activity-legend">
                <span>活跃度：</span>
                <span className="legend-item">低</span>
                <span className="legend-box scale-1"></span>
                <span className="legend-box scale-2"></span>
                <span className="legend-box scale-3"></span>
                <span className="legend-box scale-4"></span>
                <span className="legend-item">高</span>
              </div>
            </div>
          </Card>

          <Row gutter={16}>
            <Col span={12}>
              <Card className="knowledge-card" bodyStyle={{ height: '300px' }}>
                <h3>知识点掌握度</h3>
                <div style={{ height: '250px' }}>
                  <Radar {...radarConfig} />
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card className="score-card" bodyStyle={{ height: '300px' }}>
                <h3>难度分布</h3>
                <div style={{ height: '250px' }}>
                  <Pie {...pieConfig} />
                </div>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
}

export default ProfilePage; 