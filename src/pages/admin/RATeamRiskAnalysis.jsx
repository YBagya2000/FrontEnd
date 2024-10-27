// src/pages/admin/RATeamRiskAnalysis.jsx
import { useState, useEffect } from 'react';
import { Layout, Card, Spin, Alert, Button } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import AdminSider from '../../components/AdminSider';
import RiskVisualization from '../../components/RiskVisualization';
import RiskBreakdown from '../../components/RiskBreakdown';
import CalculationStages from '../../components/CalculationStages';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Content } = Layout;

const RATeamRiskAnalysis = () => {
  const { submissionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRiskAnalysis = async () => {
      try {
        const response = await fetch(`/api/v1/ra-team/risk-analysis/${submissionId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch risk analysis');
        }

        const data = await response.json();
        setRiskData(data);
      } catch (err) {
        console.error('Error fetching risk analysis:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) {
      fetchRiskAnalysis();
    }
  }, [submissionId]);

  if (loading) {
    return (
      <Layout>
        <AdminSider />
        <Content style={{ padding: '24px' }}>
          <div className="flex justify-center items-center h-full">
            <Spin size="large" tip="Loading risk analysis..." />
          </div>
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <AdminSider />
        <Content style={{ padding: '24px' }}>
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
          />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout>
      <AdminSider />
      <Content style={{ padding: '24px' }}>
        <div className="space-y-6">
          <Card 
            title={`Risk Analysis - ${riskData.vendor_info.company_name}`}
            extra={
              <Button 
                onClick={() => navigate('/admin/dashboard')}
                icon={<ArrowLeftOutlined />}
              >
                Back to Dashboard
              </Button>
            }
          >
            <RiskVisualization riskData={riskData} />
          </Card>

          <Card title="Risk Calculation Process">
            <CalculationStages stages={riskData.calculation_stages} />
          </Card>

          <Card title="Detailed Risk Breakdown">
            <RiskBreakdown factorScores={riskData.factor_scores} />
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default RATeamRiskAnalysis;