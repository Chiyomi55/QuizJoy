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
  // 状态管理
  const [isEditing, setIsEditing] = useState(false);  // 控制个人信息是否处于编辑状态
  const [userInfo, setUserInfo] = useState({
    nickname: '',
    school: '',
    class: '',
    achievements: [],
    subject: '',
    title: '',
    streak_days: 0,
    avatar_url: 'https://file.302.ai/gpt/imgs/20250121/7f0cde4d3b0541598dab4244058bb566.jpeg'  // 添加默认头像
  });
  const [activityData, setActivityData] = useState([]);  // 活动数据，用于热力图显示
  const [knowledgeStatus, setKnowledgeStatus] = useState([]);  // 知识点掌握状态
  const [difficultyDistribution, setDifficultyDistribution] = useState([]);  // 难度分布数据
  const fileInputRef = useRef(null);  // 文件上传的引用
  const [loading, setLoading] = useState(true);  // 加载状态
  const [error, setError] = useState(null);  // 错误状态

  // 在组件加载时获取数据
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 并行获取所有数据以提高加载速度
        const [userInfoResponse, activityResponse, knowledgeResponse, difficultyResponse] = await Promise.all([
          fetchWithAuth('/api/profile/info'),
          fetchWithAuth('/api/profile/activity'),
          fetchWithAuth('/api/profile/knowledge_status'),
          fetchWithAuth('/api/profile/difficulty_distribution')
        ]);

        // 处理用户信息响应
        if (userInfoResponse.ok) {
          const userData = await userInfoResponse.json();
          setUserInfo({
            nickname: userData.nickname || user.nickname || '',
            school: userData.school || '',
            class: userData.grade || '',
            subject: userData.subject || '',
            title: userData.title || '',
            achievements: userData.achievements || [],
            streak_days: userData.streak_days || 0,
            avatar_url: userData.avatar_url || 'https://file.302.ai/gpt/imgs/20250121/7f0cde4d3b0541598dab4244058bb566.jpeg'  // 如果后端没有返回头像，使用默认头像
          });
        }

        // 处理活动数据响应
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setActivityData(activityData.map(item => ({
            date: item.date,
            count: item.count
          })));
        }

        // 处理知识点状态响应
        if (knowledgeResponse.ok) {
          const knowledgeData = await knowledgeResponse.json();
          setKnowledgeStatus(knowledgeData);
        }

        // 处理难度分布响应
        if (difficultyResponse.ok) {
          const difficultyData = await difficultyResponse.json();
          console.log('Difficulty distribution data:', difficultyData);  // 添加日志
          // 确保数据格式正确，如果为空则提供默认值
          const formattedData = difficultyData.length > 0 ? difficultyData : [
            { type: '简单', value: 0 },
            { type: '中等', value: 0 },
            { type: '困难', value: 0 }
          ];
          setDifficultyDistribution(formattedData);
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
        achievements: updatedUser.achievements || [],
        streak_days: updatedUser.streak_days || 0,
        avatar_url: updatedUser.avatar_url || 'https://file.302.ai/gpt/imgs/20250121/7f0cde4d3b0541598dab4244058bb566.jpeg'  // 如果后端没有返回头像，使用默认头像
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
    },
    yAxis: {
      label: false,
      grid: {
        alternateColor: 'rgba(0, 0, 0, 0.04)',
      },
    },
    area: {
      style: {
        fillOpacity: 0.3,
      },
    },
    color: '#F2A6A6',
    legend: false,
  };

  // 难度分布图表的配置
  const pieConfig = {
    data: difficultyDistribution,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    color: ['#F2A6A6', '#CE93D8', '#A5C9C4', '#ECE3D4'],
    appendPadding: 10,
    label: {
      style: {
        fontSize: 12,
        fill: '#666',
      },
      formatter: (datum) => {
        if (!datum?.percent) return '';
        return `${datum.type}\n${(datum.percent * 100).toFixed(0)}%`;
      },
    },
    legend: {
      position: 'bottom',
      itemHeight: 8,
      itemWidth: 8,
    },
    tooltip: {
      formatter: (datum) => {
        if (!datum?.type) return '';
        return `${datum.type}: ${datum.value}题`;
      }
    },
    statistic: {
      title: {
        style: {
          color: '#666',
          fontSize: '14px',
        },
        content: '总做题数'
      },
      content: {
        style: {
          color: '#F2A6A6',
          fontSize: '24px',
          fontWeight: 'bold',
        },
        formatter: (_, data) => {
          if (!data || !Array.isArray(data)) return 0;
          return data.reduce((sum, item) => sum + (item?.value || 0), 0);
        }
      },
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
  };

  return (
    <div className="profile-container">
      <h1 className="profile-title">个人学习档案</h1>
      <Row gutter={24}>
        {/* 左侧个人信息栏 - 使用6个栅格单位（总宽度的1/4） */}
        <Col span={6}>
          <Card className="profile-card">
            <div className="profile-content">
              {/* 头像部分 */}
              <div className="avatar-section">
                <Avatar 
                  size={100}  // 控制头像大小
                  icon={<UserOutlined />} 
                  src={userInfo.avatar_url}
                  className="profile-avatar"
                />
              </div>

              {/* 个人信息部分 */}
              <div className="info-section">
                {isEditing ? (
                  // 编辑表单
                  <div className="edit-form">
                    <div className="form-item">
                      <input
                        type="text"
                        value={userInfo.nickname}
                        onChange={(e) => setUserInfo({...userInfo, nickname: e.target.value})}
                        placeholder="昵称"
                        className="edit-input"
                      />
                    </div>
                    <div className="form-item">
                      <input
                        type="text"
                        value={userInfo.school}
                        onChange={(e) => setUserInfo({...userInfo, school: e.target.value})}
                        placeholder="学校"
                        className="edit-input"
                      />
                    </div>
                    <div className="form-item">
                      <input
                        type="text"
                        value={userInfo.class}
                        onChange={(e) => setUserInfo({...userInfo, class: e.target.value})}
                        placeholder="班级"
                        className="edit-input"
                      />
                    </div>
                    <div className="edit-buttons">
                      <button onClick={handleSave} className="save-btn">保存</button>
                      <button onClick={() => setIsEditing(false)} className="cancel-btn">取消</button>
                    </div>
                  </div>
                ) : (
                  // 信息展示
                  <div className="info-display">
                    <div className="info-item">
                      <label>昵称</label>
                      <span>{userInfo.nickname || user.nickname || '未设置昵称'}</span>
                    </div>
                    <div className="info-item">
                      <label>学校</label>
                      <span>{userInfo.school || '未设置学校'}</span>
                    </div>
                    <div className="info-item">
                      <label>班级</label>
                      <span>{userInfo.class || '未设置班级'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 编辑按钮 - 放在个人信息之后，统计信息之前 */}
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="edit-profile-btn">
                  编辑个人资料
                </button>
              )}

              {/* 统计信息部分 */}
              <div className="profile-stats">
                <Statistic title="总做题数" value={activityData.reduce((sum, item) => sum + item.count, 0)} />
                <Statistic title="连续做题" value={userInfo.streak_days || 0} suffix="天" />
              </div>

              {/* 成就部分 - 使用固定高度和滚动条控制长度 */}
              <div className="achievements-section" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <h3><TrophyOutlined /> 成就</h3>
                <List
                  size="small"
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
            </div>
          </Card>
        </Col>
        
        {/* 右侧内容区 - 使用18个栅格单位（总宽度的3/4） */}
        <Col span={18}>
          <Card className="activity-card" style={{ marginBottom: '16px' }}>
            <h3>学习热力图</h3>
            <div className="activity-heatmap">
              {console.log('Rendering heatmap with data:', activityData)}
              <ReactCalendarHeatmap
                values={activityData}
                startDate={new Date(new Date().setDate(new Date().getDate() - 180))}
                endDate={new Date()}
                classForValue={value => {
                  if (value) {
                    console.log('Activity data for date:', value.date, value.count);
                  }
                  if (!value) return 'color-empty';
                  if (value.count <= 2) return 'color-scale-1';
                  if (value.count <= 4) return 'color-scale-2';
                  if (value.count <= 6) return 'color-scale-3';
                  return 'color-scale-4';
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
              <Card className="knowledge-card" styles={{ body: { height: '300px' } }}>
                <h3>知识点掌握度</h3>
                <div style={{ height: '250px' }}>
                  <Radar {...radarConfig} />
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card className="score-card" styles={{ body: { height: '300px' } }}>
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