import React, { useState } from 'react';
import { Tabs } from 'antd';
import TestList from '../components/TestList';
import TestAnalysis from '../components/TestAnalysis';

const { TabPane } = Tabs;

const TeacherTestPage = () => {
  const [selectedTest, setSelectedTest] = useState(null);

  const handleTestSelect = (testId) => {
    setSelectedTest(testId);
  };

  return (
    <div className="teacher-test-page">
      <Tabs defaultActiveKey="list">
        <TabPane tab="测试列表" key="list">
          <TestList onTestSelect={handleTestSelect} />
        </TabPane>
        {selectedTest && (
          <TabPane tab="测试分析" key="analysis">
            <TestAnalysis testId={selectedTest} />
          </TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default TeacherTestPage; 