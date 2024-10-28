// src/components/RiskVisualization.jsx
import { Progress, Row, Col, Statistic, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import PropTypes from 'prop-types';
import CalculationStages from './CalculationStages';
import RiskBreakdown from './RiskBreakdown';

const RiskVisualization = ({ riskData, finalScore }) => {
    const { final_score, confidence_interval } = riskData;
	console.log(finalScore)

  // Prepare data for line chart
  const stageData = Object.entries(riskData.calculation_stages).map(([key, value]) => ({
    name: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    score: value.score,
    description: value.description
  }));

	// Desired order of the names
	const desiredOrder = [
		"Initial Scoring",
		"Fuzzy Processing",
		"Weight Application",
		"Contextual Adjustment",
		"Final Calculation"
	];

	stageData.sort((a, b) => {
		return desiredOrder.indexOf(a.name) - desiredOrder.indexOf(b.name);
	});

  // Overwrite the "Final Calculation" score with the finalScore prop
  stageData.forEach(stage => {
    if (stage.name === 'Final Calculation') {
      stage.score = finalScore;
    }
  });

	console.log(JSON.stringify(stageData))

  return (
    <div className="space-y-6">
      {/* Final Score Display */}
      <Row gutter={24} className="mb-6">
        <Col span={8}>
          <Statistic
            title={
              <span>
                Final Risk Score
                <Tooltip title="Final calculated risk score after all adjustments">
                  <InfoCircleOutlined className="ml-2" />
                </Tooltip>
              </span>
            }
            value={final_score}
            precision={2}
            suffix="/ 10"
          />
          <Progress
            percent={final_score * 10}
            status={final_score > 7 ? 'exception' : 'active'}
            strokeColor={
              final_score > 7 ? '#f5222d' :
              final_score > 5 ? '#faad14' : '#52c41a'
            }
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Confidence Interval (Lower)"
            value={confidence_interval.low}
            precision={2}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Confidence Interval (Upper)"
            value={confidence_interval.high}
            precision={2}
          />
        </Col>
      </Row>

      {/* Calculation Progress Chart */}
      <div className="mt-6">
        <h3>Risk Score Evolution</h3>
        <LineChart
          width={1000}
          height={300}
          data={stageData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 10]} />
          <RechartsTooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border rounded shadow">
                    <p className="font-bold">{data.name}</p>
                    <p>Score: {data.score.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{data.description}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#1890ff"
            strokeWidth={2}
            dot={{ fill: '#1890ff' }}
          />
        </LineChart>
      </div>
    </div>
  );
};

RiskVisualization.propTypes = {
    riskData: PropTypes.shape({
      final_score: PropTypes.number.isRequired,
      confidence_interval: PropTypes.shape({
        low: PropTypes.number.isRequired,
        high: PropTypes.number.isRequired
      }).isRequired,
      calculation_stages: PropTypes.object.isRequired
    }).isRequired,
    finalScore: PropTypes.number.isRequired
  };
  
  // CalculationStages.jsx
  CalculationStages.propTypes = {
    stages: PropTypes.objectOf(
      PropTypes.shape({
        score: PropTypes.number.isRequired,
        description: PropTypes.string.isRequired,
        details: PropTypes.object
      })
    ).isRequired
  };
  
  // RiskBreakdown.jsx
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
            weighted_score: PropTypes.number.isRequired
          })
        ).isRequired
      })
    ).isRequired
  };

export default RiskVisualization;
