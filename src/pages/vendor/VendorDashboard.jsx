import { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Steps, Button, Progress, Alert, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FileTextOutlined, FormOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import UserSider from '../../components/UserSider';

const { Content } = Layout;

const VendorDashboard = () => {
  const [assessmentStatus, setAssessmentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching dashboard data...');
        const token = localStorage.getItem('token');
        console.log('Using token:', token);

        const response = await fetch('/api/v1/vendor/dashboard/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch dashboard data');
        }

        const data = await response.json();
        console.log('Dashboard data:', data);
        setAssessmentStatus(data.assessment_status);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getCurrentStep = () => {
    if (!assessmentStatus) return 0;
    if (assessmentStatus.corporate.status === 'Not Started') return 0;
    if (assessmentStatus.corporate.status === 'Submitted' && 
        assessmentStatus.contextual.status === 'Not Started') return 1;
    if (assessmentStatus.contextual.status === 'Submitted' && 
        assessmentStatus.risk_assessment.status === 'Not Started') return 2;
    if (assessmentStatus.risk_assessment.status === 'Completed') return 3;
    return 2;
  };

  const getStepStatus = (step) => {
    if (!assessmentStatus) return 'waiting';
    
    switch (step) {
      case 0:
        return assessmentStatus.corporate.status === 'Submitted' ? 'finish' : 'process';
      case 1:
        return assessmentStatus.contextual.status === 'Submitted' ? 'finish' : 
               assessmentStatus.corporate.status === 'Submitted' ? 'process' : 'wait';
      case 2:
        return assessmentStatus.risk_assessment.status === 'Completed' ? 'finish' :
               assessmentStatus.contextual.status === 'Submitted' ? 'process' : 'wait';
      default:
        return 'wait';
    }
  };

  const handleStartQuestionnaire = (type) => {
    if (!assessmentStatus) return;

    switch(type) {
      case 'corporate':
        if (assessmentStatus.corporate.status !== 'Submitted') {
          navigate('/vendor/questionnaires/corporate');
        }
        break;
      
      case 'contextual':
        if (assessmentStatus.corporate.status === 'Submitted' && 
            assessmentStatus.contextual.status !== 'Submitted') {
          navigate('/vendor/questionnaires/contextual');
        }
        break;
      
      case 'risk-assessment':
        if (assessmentStatus.contextual.status === 'Submitted' && 
            assessmentStatus.risk_assessment.status !== 'Completed') {
          navigate('/vendor/questionnaires/risk-assessment');
        }
        break;
      
      default:
        break;
    }
  };

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <UserSider />
        <Layout>
          <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
            />
          </Content>
        </Layout>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <UserSider />
        <Layout>
          <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" tip="Loading dashboard..." />
            </div>
          </Content>
        </Layout>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <UserSider />
      <Layout>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <div className="p-4">
            <Card title="Risk Assessment Progress" className="mb-4">
              <Steps
                current={getCurrentStep()}
                items={[
                  {
                    title: 'Corporate',
                    status: getStepStatus(0),
                    icon: <FileTextOutlined />
                  },
                  {
                    title: 'Contextual',
                    status: getStepStatus(1),
                    icon: <FormOutlined />
                  },
                  {
                    title: 'Risk Assessment',
                    status: getStepStatus(2),
                    icon: <SafetyCertificateOutlined />
                  }
                ]}
              />
            </Card>

            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card title="Corporate Questionnaire">
                  <Progress
                    percent={assessmentStatus?.corporate.progress || 0}
                    status={assessmentStatus?.corporate.status === 'Submitted' ? 'success' : 'active'}
                  />
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Button
                      type="primary"
                      disabled={assessmentStatus?.corporate.status === 'Submitted'}
                      onClick={() => handleStartQuestionnaire('corporate')}
                    >
                      {assessmentStatus?.corporate.status === 'Not Started' ? 'Start' : 
                       assessmentStatus?.corporate.status === 'In Progress' ? 'Continue' : 'Completed'}
                    </Button>
                  </div>
                </Card>
              </Col>

              <Col span={8}>
                <Card title="Contextual Questionnaire">
                  <Progress
                    percent={assessmentStatus?.contextual.progress || 0}
                    status={assessmentStatus?.contextual.status === 'Submitted' ? 'success' : 'active'}
                  />
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Button
                      type="primary"
                      disabled={assessmentStatus?.corporate.status !== 'Submitted' || 
                               assessmentStatus?.contextual.status === 'Submitted'}
                      onClick={() => handleStartQuestionnaire('contextual')}
                    >
                      {assessmentStatus?.contextual.status === 'Not Started' ? 'Start' : 
                       assessmentStatus?.contextual.status === 'In Progress' ? 'Continue' : 'Completed'}
                    </Button>
                  </div>
                </Card>
              </Col>

              <Col span={8}>
                <Card title="Risk Assessment">
                  <Progress
                    percent={assessmentStatus?.risk_assessment.progress || 0}
                    status={assessmentStatus?.risk_assessment.status === 'Completed' ? 'success' : 'active'}
                  />
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Button
                      type="primary"
                      disabled={assessmentStatus?.contextual.status !== 'Submitted' ||
                               assessmentStatus?.risk_assessment.status === 'Completed'}
                      onClick={() => handleStartQuestionnaire('risk-assessment')}
                    >
                      {assessmentStatus?.risk_assessment.status === 'Not Started' ? 'Start' : 
                       assessmentStatus?.risk_assessment.status === 'In Progress' ? 'Continue' : 'Completed'}
                    </Button>
                  </div>
                </Card>
              </Col>
            </Row>

            {assessmentStatus?.risk_assessment.status === 'Completed' && 
             assessmentStatus.risk_score && (
              <Card title="Risk Assessment Results" className="mt-4">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card title="Overall Risk Score">
                      <Progress
                        type="dashboard"
                        percent={assessmentStatus.risk_score.final_score * 10}
                        format={(percent) => `${(percent / 10).toFixed(2)}/10`}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="Confidence Interval">
                      <p>Lower Bound: {assessmentStatus.risk_score.confidence_interval.lower.toFixed(2)}</p>
                      <p>Upper Bound: {assessmentStatus.risk_score.confidence_interval.high.toFixed(2)}</p>
                    </Card>
                  </Col>
                </Row>
              </Card>
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default VendorDashboard;