// src/components/CalculationStages.jsx
import { Steps, Collapse, Typography } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

const { Panel } = Collapse;
const { Text } = Typography;

const CalculationStages = ({ stages }) => {
  return (
    <div className="space-y-6">
      <Steps
        direction="vertical"
        current={Object.keys(stages).length - 1}
        items={Object.entries(stages).map(([key, value]) => ({
          title: key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          description: (
            <Collapse
              ghost
              expandIcon={({ isActive }) => (
                <CaretRightOutlined rotate={isActive ? 90 : 0} />
              )}
            >
              <Panel
                header={
                  <Text>
                    Score: {value.score.toFixed(2)}
                  </Text>
                }
                key="1"
              >
                <div className="pl-4">
                  <p>{value.description}</p>
                  {value.details && (
                    <ul className="list-disc pl-4">
                      {Object.entries(value.details).map(([detailKey, detailValue]) => (
                        <li key={detailKey}>
                          {detailKey}: {
                            typeof detailValue === 'number' 
                              ? detailValue.toFixed(2) 
                              : detailValue
                          }
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Panel>
            </Collapse>
          ),
        }))}
      />
    </div>
  );
};

CalculationStages.propTypes = {
    stages: PropTypes.objectOf(
      PropTypes.shape({
        score: PropTypes.number.isRequired,
        description: PropTypes.string.isRequired,
        details: PropTypes.objectOf(PropTypes.any),
      })
    ).isRequired,
  };

export default CalculationStages;