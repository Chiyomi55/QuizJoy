import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Statistic, Table, Button, message, Empty } from 'antd';
import { getTestStatistics, refreshTestStatistics } from '../services/testService';
import { ReloadOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { Column, Radar } from '@ant-design/plots';
import './TestAnalysis.css';

// 静态测试数据
const STATIC_TEST_DATA = {
  "12": {
    title: "第一周周测",
    total_students: 30,
    completed_count: 28,
    average_score: 85.5,
    average_time: 9.6,
    score_distribution: {
      "90-100": 8,
      "80-89": 12,
      "60-79": 6,
      "0-59": 2
    },
    question_stats: [
      { 
        question_id: 113, 
        title: "函数的单调性",
        correct_rate: 0.92, 
        average_time: 2.1,
        topics: ["函数", "单调性"]
      },
      { 
        question_id: 114, 
        title: "导数的几何意义",
        correct_rate: 0.85, 
        average_time: 1.8,
        topics: ["导数", "几何意义"]
      },
      { 
        question_id: 115, 
        title: "函数的极限",
        correct_rate: 0.78, 
        average_time: 2.3,
        topics: ["函数", "极限"]
      },
      { 
        question_id: 116, 
        title: "导数的运算",
        correct_rate: 0.88, 
        average_time: 1.5,
        topics: ["导数", "运算"]
      },
      { 
        question_id: 117, 
        title: "函数的连续性",
        correct_rate: 0.82, 
        average_time: 1.9,
        topics: ["函数", "连续性"]
      }
    ],
    completion_rate: 93.3,
    pass_rate: 92.8,
    topics: ["函数", "导数", "极限"],
    topic_mastery: [
      { topic: "函数", mastery: 92 },
      { topic: "导数", mastery: 85 },
      { topic: "极限", mastery: 88 }
    ]
  },
  "13": {
    title: "三月月考",
    total_students: 30,
    completed_count: 30,
    average_score: 78.2,
    average_time: 19.9,
    score_distribution: {
      "90-100": 5,
      "80-89": 10,
      "60-79": 12,
      "0-59": 3
    },
    question_stats: [
      { 
        question_id: 118, 
        title: "微分方程求解",
        correct_rate: 0.88, 
        average_time: 2.2,
        topics: ["微分", "方程"]
      },
      { 
        question_id: 119, 
        title: "定积分计算",
        correct_rate: 0.82, 
        average_time: 1.9,
        topics: ["积分", "计算"]
      },
      { 
        question_id: 120, 
        title: "三角函数性质",
        correct_rate: 0.75, 
        average_time: 2.1,
        topics: ["三角函数", "性质"]
      },
      { 
        question_id: 121, 
        title: "微分应用",
        correct_rate: 0.70, 
        average_time: 2.4,
        topics: ["微分", "应用"]
      },
      { 
        question_id: 122, 
        title: "积分应用",
        correct_rate: 0.85, 
        average_time: 1.7,
        topics: ["积分", "应用"]
      },
      { 
        question_id: 123, 
        title: "三角恒等式",
        correct_rate: 0.78, 
        average_time: 1.8,
        topics: ["三角函数", "恒等式"]
      },
      { 
        question_id: 124, 
        title: "微分不等式",
        correct_rate: 0.72, 
        average_time: 2.3,
        topics: ["微分", "不等式"]
      },
      { 
        question_id: 125, 
        title: "定积分性质",
        correct_rate: 0.68, 
        average_time: 2.0,
        topics: ["积分", "性质"]
      },
      { 
        question_id: 126, 
        title: "三角方程",
        correct_rate: 0.80, 
        average_time: 1.6,
        topics: ["三角函数", "方程"]
      },
      { 
        question_id: 127, 
        title: "积分方程",
        correct_rate: 0.76, 
        average_time: 1.9,
        topics: ["积分", "方程"]
      }
    ],
    completion_rate: 100,
    pass_rate: 90,
    topics: ["微分", "积分", "三角函数"],
    topic_mastery: [
      { topic: "微分", mastery: 85 },
      { topic: "积分", mastery: 78 },
      { topic: "三角函数", mastery: 82 }
    ]
  },
  "14": {
    title: "2024春季期末考试",
    total_students: 30,
    completed_count: 29,
    average_score: 72.5,
    average_time: 35.5,
    score_distribution: {
      "90-100": 3,
      "80-89": 8,
      "60-79": 15,
      "0-59": 3
    },
    question_stats: [
      {
        question_id: 128,
        title: "概率分布函数的性质",
        correct_rate: 0.75,
        average_time: 2.3,
        topics: ["概率论", "分布函数"]
      },
      {
        question_id: 129,
        title: "矩阵的特征值计算",
        correct_rate: 0.68,
        average_time: 2.5,
        topics: ["线性代数", "特征值"]
      },
      {
        question_id: 130,
        title: "空间向量的夹角",
        correct_rate: 0.82,
        average_time: 1.8,
        topics: ["立体几何", "向量"]
      },
      {
        question_id: 131,
        title: "圆锥曲线的标准方程",
        correct_rate: 0.71,
        average_time: 2.4,
        topics: ["解析几何", "圆锥曲线"]
      },
      {
        question_id: 132,
        title: "随机变量的数字特征",
        correct_rate: 0.69,
        average_time: 2.6,
        topics: ["概率论", "数字特征"]
      },
      {
        question_id: 133,
        title: "矩阵的相似对角化",
        correct_rate: 0.65,
        average_time: 2.8,
        topics: ["线性代数", "相似矩阵"]
      },
      {
        question_id: 134,
        title: "空间曲面的切平面",
        correct_rate: 0.73,
        average_time: 2.2,
        topics: ["立体几何", "曲面"]
      },
      {
        question_id: 135,
        title: "二次曲线的焦点",
        correct_rate: 0.77,
        average_time: 1.9,
        topics: ["解析几何", "二次曲线"]
      },
      {
        question_id: 136,
        title: "条件概率与全概率公式",
        correct_rate: 0.70,
        average_time: 2.4,
        topics: ["概率论", "条件概率"]
      },
      {
        question_id: 137,
        title: "正交矩阵的性质",
        correct_rate: 0.72,
        average_time: 2.1,
        topics: ["线性代数", "正交矩阵"]
      },
      {
        question_id: 138,
        title: "空间曲线的切线",
        correct_rate: 0.76,
        average_time: 2.0,
        topics: ["立体几何", "曲线"]
      },
      {
        question_id: 139,
        title: "椭圆的参数方程",
        correct_rate: 0.74,
        average_time: 2.3,
        topics: ["解析几何", "参数方程"]
      },
      {
        question_id: 140,
        title: "大数定律的应用",
        correct_rate: 0.67,
        average_time: 2.7,
        topics: ["概率论", "大数定律"]
      },
      {
        question_id: 141,
        title: "向量空间的基变换",
        correct_rate: 0.69,
        average_time: 2.5,
        topics: ["线性代数", "基变换"]
      },
      {
        question_id: 142,
        title: "旋转体的体积",
        correct_rate: 0.78,
        average_time: 2.1,
        topics: ["立体几何", "旋转体"]
      }
    ],
    completion_rate: 96.7,
    pass_rate: 89.7,
    topics: ["概率论", "线性代数", "立体几何", "解析几何"],
    topic_mastery: [
      { topic: "概率论", mastery: 75 },
      { topic: "线性代数", mastery: 72 },
      { topic: "立体几何", mastery: 70 },
      { topic: "解析几何", mastery: 73 }
    ]
  }
};

const TestAnalysis = () => {
  const { testId } = useParams();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // 直接从静态数据中获取
    const testData = STATIC_TEST_DATA[testId];
    if (testData) {
      setStats(testData);
    } else {
      message.info('该测试暂无完成数据');
    }
  }, [testId]);

  if (!stats) {
    return (
      <div className="test-analysis empty-state">
        <Empty
          description="暂无完成数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  // 表格列定义
  const columns = [
    {
      title: '题号',
      dataIndex: 'question_id',
      key: 'question_id',
      width: '10%',
      render: (_, record, index) => `第${index + 1}题`
    },
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      width: '25%',
      render: title => title || '未命名题目'
    },
    {
      title: '知识点',
      dataIndex: 'topics',
      key: 'topics',
      width: '25%',
      render: topics => (topics || []).join('、') || '暂无知识点'
    },
    {
      title: '正确率',
      dataIndex: 'correct_rate',
      key: 'correct_rate',
      width: '25%',
      render: value => <Progress percent={Math.round(value * 100)} showInfo={false} />
    },
    {
      title: '平均用时',
      dataIndex: 'average_time',
      key: 'average_time',
      width: '15%',
      render: value => `${value.toFixed(1)}分钟`
    }
  ];

  // 分数分布数据处理
  const distributionData = Object.entries(stats.score_distribution).map(([range, count]) => ({
    range,
    count,
    percentage: ((count / stats.completed_count) * 100).toFixed(1)
  }));

  // 修改分数分布柱状图的颜色配置
  const distributionColors = {
    '90-100': '#E6D5E1', // 莫兰迪粉色
    '80-89': '#D5E1E6',  // 莫兰迪蓝色
    '60-79': '#D5E6D9',  // 莫兰迪绿色
    '0-59': '#E1D5E6'    // 莫兰迪紫色
  };

  // 知识点掌握度雷达图配置
  const radarConfig = {
    data: stats.topic_mastery.map(item => ({
      topic: item.topic,
      mastery: item.mastery
    })),
    xField: 'topic',
    yField: 'mastery',
    meta: {
      mastery: {
        min: 0,
        max: 100
      }
    },
    xAxis: {
      line: null,
      tickLine: null
    },
    yAxis: {
      label: false,
      grid: {
        alternateColor: 'rgba(0, 0, 0, 0.04)'
      }
    },
    point: {
      size: 2
    },
    area: {
      style: {
        fill: '#E6D5E1',
        fillOpacity: 0.5
      }
    },
    color: '#C5A2BA'
  };

  return (
    <div className="test-analysis">
      <h2>{stats.title} - 完成情况分析</h2>
      
      {/* 基本统计信息 */}
      <div className="statistics-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.completion_rate}%</div>
          <div className="stat-label">完成率</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.average_score}</div>
          <div className="stat-label">平均分</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pass_rate}%</div>
          <div className="stat-label">及格率</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.average_time}</div>
          <div className="stat-label">平均用时(分钟)</div>
        </div>
      </div>

      {/* 分数分布和知识点掌握度并排显示 */}
      <Row gutter={16} className="analysis-row">
        <Col span={12}>
          <Card title="分数分布" className="chart-card">
            <Column
              data={distributionData}
              xField="range"
              yField="count"
              label={{
                position: 'top',
                content: (item) => `${item.percentage}%`,
                style: {
                  fill: '#666',
                  fontSize: 12,
                },
              }}
              color={{
                field: 'range',
                callback: (value) => distributionColors[value]
              }}
              columnStyle={{
                radius: [4, 4, 0, 0]
              }}
              xAxis={{
                label: {
                  autoRotate: false,
                },
              }}
              yAxis={{
                label: {
                  formatter: (v) => `${v}人`,
                },
              }}
              height={300}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="知识点掌握情况" className="chart-card">
            <Radar {...radarConfig} height={300} />
            <div className="radar-legend">
              {stats.topic_mastery.map(topic => (
                <div key={topic.topic} className="legend-item">
                  <span className="legend-label">{topic.topic}</span>
                  <span className="legend-value">{topic.mastery}%</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 题目完成情况 */}
      <Card title="题目完成情况" className="chart-card">
        <Table
          columns={columns}
          dataSource={stats.question_stats}
          rowKey="question_id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default TestAnalysis; 