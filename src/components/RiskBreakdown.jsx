// eslint-disable-next-line no-unused-vars
import React from 'react';
import PropTypes from 'prop-types';
import { Table, Progress, Tooltip, Space } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const RiskBreakdown = ({ factorScores }) => {
  // Helper function to create nested table data
  const createNestedData = () => {
    const data = [];
    Object.entries(factorScores).forEach(([factorName, factor]) => {
      // Main factor row
      data.push({
        key: factorName,
        name: factorName,
        score: factor.score.toFixed(2),
        weight: `${(factor.weight * 100).toFixed(1)}%`,
        weightedScore: factor.weighted_score.toFixed(2),
        children: Object.entries(factor.sub_factors).map(([subName, sub]) => ({
          key: `${factorName}-${subName}`,
          name: subName,
          score: sub.score.toFixed(2),
          weight: `${(sub.weight * 100).toFixed(1)}%`,
          weightedScore: sub.weighted_score.toFixed(2),
        }))
      });
    });
    return data;
  };

  const columns = [
    {
      title: 'Risk Factor',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
    },
    {
      title: (
        <Space>
          Raw Score
          <Tooltip title="Score before weight application">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'score',
      key: 'score',
      width: '20%',
      render: (score) => (
        <Space>
          {score}
          <Progress
            percent={parseFloat(score) * 10}
            steps={10}
            size="small"
            strokeColor="#1890ff"
          />
        </Space>
      )
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      width: '20%',
    },
    {
      title: (
        <Space>
          Contribution
          <Tooltip title="Score after weight application">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'weightedScore',
      key: 'weightedScore',
      width: '30%',
      render: (score) => (
        <Space>
          {score}
          <Progress
            percent={parseFloat(score) * 10}
            steps={10}
            size="small"
            strokeColor="#52c41a"
          />
        </Space>
      )
    },
  ];

  RiskBreakdown.propTypes = {
    factorScores: PropTypes.objectOf(
      PropTypes.shape({
        score: PropTypes.number.isRequired,
        weight: PropTypes.number.isRequired,
        weighted_score: PropTypes.number.isRequired,
        sub_factors: PropTypes.objectOf(
          PropTypes.shape({
            score: PropTypes.number.isRequired,
            weight: PropTypes.number.isRequired,
            weighted_score: PropTypes.number.isRequired,
          })
        ).isRequired,
      })
    ).isRequired,
  };

  return (
    <Table
      columns={columns}
      dataSource={createNestedData()}
      pagination={false}
    />
  );
};

export default RiskBreakdown;