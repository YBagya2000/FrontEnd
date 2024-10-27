// src/pages/vendor/RiskAnalysis.jsx
import { useState, useEffect } from 'react';
import { Layout, Card, Spin, Alert } from 'antd';
import UserSider from '../../components/UserSider';
import RiskVisualization from '../../components/RiskVisualization';
import RiskBreakdown from '../../components/RiskBreakdown';
import CalculationStages from '../../components/CalculationStages';

const { Content } = Layout;

const RiskAnalysis = () => {
    // State Definitions
    const [riskData, setRiskData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const fetchRiskAnalysis = async () => {
        try {
          const response = await fetch('/api/v1/vendor/risk-analysis/', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
  
          if (!response.ok) {
            throw new Error('Failed to fetch risk analysis');
          }
  
          const data = await response.json();
          console.log('Risk analysis data:', data);
          if (data) {
            setRiskData({
              final_score: Number(data.final_score),
              confidence_interval: {
                low: Number(data.confidence_interval?.low || 0),
                high: Number(data.confidence_interval?.high || 0)
              },
              calculation_stages: data.calculation_stages || {},
              factor_scores: data.factor_scores || {}
            });
          }
        } catch (err) {
          console.error('Error fetching risk analysis:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchRiskAnalysis();
    }, []);
  
    // Add null checks before rendering components
    return (
        <Layout>
          <UserSider />
          <Content style={{ padding: '24px' }}>
            <div className="space-y-6">
              <Card title="Risk Analysis Overview">
                {loading ? (
                  <Spin />
                ) : error ? (
                  <Alert type="error" message={error} />
                ) : (
                  <RiskVisualization riskData={riskData} />
                )}
              </Card>
      
              <Card title="Risk Calculation Process">
                {loading ? (
                  <Spin />
                ) : error ? (
                  <Alert type="error" message={error} />
                ) : !riskData?.calculation_stages ? (
                  <Alert type="info" message="No calculation stages data available" />
                ) : (
                  <CalculationStages stages={riskData.calculation_stages} />
                )}
              </Card>
      
              <Card title="Detailed Risk Breakdown">
                {loading ? (
                  <Spin />
                ) : error ? (
                  <Alert type="error" message={error} />
                ) : !riskData?.factor_scores ? (
                  <Alert type="info" message="No factor scores data available" />
                ) : (
                  <RiskBreakdown factorScores={riskData.factor_scores} />
                )}
              </Card>
            </div>
          </Content>
        </Layout>
      );
  };

export default RiskAnalysis;
