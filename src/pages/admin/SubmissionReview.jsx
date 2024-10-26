import { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Steps, 
  Form, 
  Input, 
  Button, 
  Space, 
  message, 
  Typography,
  Spin,
  Alert,
  Modal,
  Divider
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  FileOutlined,
  HomeOutlined
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const SubmissionReview = () => {
  const [form] = Form.useForm();
  const { submissionId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [currentSection, setCurrentSection] = useState('corporate');
  const [error, setError] = useState(null);

  // Fetch submission data
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/v1/ra-team/submissions/${submissionId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch submission');
        }

        const data = await response.json();
        setSubmission(data);
        
        // Set initial form values for any existing scores
        if (data.risk_assessment?.responses) {
          const formValues = {};
          data.risk_assessment.responses.forEach(response => {
            if (response.requires_scoring) {
              formValues[`score_${response.question_id}`] = response.score;
              formValues[`comment_${response.question_id}`] = response.ra_comment;
            }
          });
          form.setFieldsValue(formValues);
        }
      } catch (error) {
        console.error('Error fetching submission:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId, form]);

  const handleSaveScores = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      // Format scores for submission
      const scores = [];
      Object.entries(values).forEach(([key, value]) => {
        if (key.startsWith('score_')) {
          const questionId = key.split('_')[1];
          scores.push({
            question_id: parseInt(questionId),
            score: value,
            comment: values[`comment_${questionId}`] || ''
          });
        }
      });

      const response = await fetch(`/api/v1/ra-team/submissions/${submissionId}/score/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scores })
      });

      if (!response.ok) {
        throw new Error('Failed to save scores');
      }

      message.success('Scores saved successfully');
    } catch (error) {
      console.error('Error saving scores:', error);
      message.error('Failed to save scores');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteReview = async () => {
    try {
      setCompleting(true);
      
      const response = await fetch(`/api/v1/ra-team/submissions/${submissionId}/complete/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to complete review');
      }

      const result = await response.json();
      message.success('Review completed successfully');
      
      // Show final risk score
      if (result.risk_calculation) {
        Modal.success({
          title: 'Risk Assessment Complete',
          content: (
            <div>
              <p>Final Risk Score: {result.risk_calculation.final_score.toFixed(2)}</p>
              <p>Confidence Interval: [{result.risk_calculation.confidence_interval.low.toFixed(2)}, 
                                     {result.risk_calculation.confidence_interval.high.toFixed(2)}]</p>
            </div>
          ),
          onOk: () => navigate('/admin/dashboard')
        });
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Error completing review:', error);
      message.error('Failed to complete review');
    } finally {
      setCompleting(false);
    }
  };

  const renderCorporateSection = () => (
    <Card title="Corporate Questionnaire Review">
      {submission?.corporate_questionnaire?.responses?.map((response, index) => (
        <div key={index} className="mb-4">
          <Space direction="vertical" className="w-full">
            <Text strong>{response.question.text}</Text>
            <Text type="secondary">Section: {response.question.section}</Text>
            <div className="bg-gray-50 p-2 rounded">
              <Text>{response.response_text}</Text>
            </div>
          </Space>
          <Divider />
        </div>
      ))}
    </Card>
  );
  
  const renderContextualSection = () => (
    <Card title="Contextual Questionnaire Review">
      {submission?.contextual_questionnaire?.responses?.map((response, index) => (
        <div key={index} className="mb-4">
          <Space direction="vertical" className="w-full">
            <Text strong>{response.question.text}</Text>
            <Text type="secondary">Weight: {response.question.weight}%</Text>
            <div className="bg-gray-50 p-2 rounded">
              <Text>Selected: {response.selected_choice.text}</Text>
              <Text className="ml-2 text-gray-500">
                (Modifier: {response.selected_choice.modifier > 0 ? '+' : ''}
                {response.selected_choice.modifier}%)
              </Text>
            </div>
          </Space>
          <Divider />
        </div>
      ))}
      {submission?.contextual_questionnaire?.calculated_modifier && (
        <Alert
          message="Calculated Risk Modifier"
          description={`${submission.contextual_questionnaire.calculated_modifier > 0 ? '+' : ''}
            ${(submission.contextual_questionnaire.calculated_modifier * 100).toFixed(2)}%`}
          type="info"
          showIcon
        />
      )}
    </Card>
  );

  const renderRiskAssessmentSection = () => (
    <div>
      {submission?.risk_assessment?.main_factors?.map((factor, factorIndex) => (
        <Card 
          key={factorIndex}
          title={
            <Space>
              {factor.name}
              <Text type="secondary">Weight: {factor.weight}%</Text>
            </Space>
          }
          className="mb-4"
        >
          {factor.sub_factors.map((subFactor, subFactorIndex) => (
            <div key={subFactorIndex} className="mb-4">
              <Title level={4}>
                {subFactor.name}
                <Text type="secondary" className="ml-2">
                  Weight: {subFactor.weight}%
                </Text>
              </Title>
              
              {subFactor.questions.map((question, questionIndex) => {
                const response = submission.risk_assessment.responses.find(
                  r => r.question_id === question.id
                );
                
                return (
                  <div key={questionIndex} className="mb-6 border-b pb-4">
                    <Space direction="vertical" className="w-full">
                      <Text strong>{question.text}</Text>
                      <Text type="secondary">
                        Type: {question.type} | Weight: {question.weight}%
                      </Text>
                      
                      {/* Show response based on question type */}
                      {question.type === 'YN' && (
                        <Text className="bg-gray-50 p-2 rounded">
                          {response?.yes_no_response ? 'Yes' : 'No'}
                        </Text>
                      )}
                      
                      {question.type === 'MC' && (
                        <Text className="bg-gray-50 p-2 rounded">
                          {question.choices.find(c => c.id === response?.selected_choice)?.text}
                        </Text>
                      )}
                      
                      {question.type === 'SA' && (
                        <div>
                          <div className="bg-gray-50 p-2 rounded mb-2">
                            {response?.response_text}
                          </div>
                          <Form.Item
                            name={`score_${question.id}`}
                            label="Score (0-10)"
                            rules={[
                              { required: true, message: 'Score is required' },
                              { type: 'number', min: 0, max: 10 }
                            ]}
                          >
                            <Input type="number" min={0} max={10} step={0.1} />
                          </Form.Item>
                          <Form.Item
                            name={`comment_${question.id}`}
                            label="Comment"
                          >
                            <TextArea rows={2} />
                          </Form.Item>
                        </div>
                      )}
                      
                      {question.type === 'FU' && (
                        <div>
                          <Space direction="vertical" className="w-full">
                            <a 
                              href={response?.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <FileOutlined className="mr-2" />
                              View Document
                            </a>
                            <Form.Item
                              name={`score_${question.id}`}
                              label="Score (0-10)"
                              rules={[
                                { required: true, message: 'Score is required' },
                                { type: 'number', min: 0, max: 10 }
                              ]}
                            >
                              <Input type="number" min={0} max={10} step={0.1} />
                            </Form.Item>
                            <Form.Item
                              name={`comment_${question.id}`}
                              label="Comment"
                            >
                              <TextArea rows={2} />
                            </Form.Item>
                          </Space>
                        </div>
                      )}
                    </Space>
                  </div>
                );
              })}
            </div>
          ))}
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Loading submission..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <Layout className="min-h-screen">
      <Content className="p-6">
        <Card
          title={
            <Space>
              <Title level={3} className="mb-0">
                Submission Review
              </Title>
              <Text type="secondary">
                ({submission?.vendor_info?.company_name})
              </Text>
            </Space>
          }
          extra={
            <Space>
              <Button 
                icon={<HomeOutlined />}
                onClick={() => navigate('/admin/dashboard')}
              >
                Return to Dashboard
              </Button>
            </Space>
          }
          className="mb-4"
        >
          <Steps
            current={['corporate', 'contextual', 'risk-assessment'].indexOf(currentSection)}
            onChange={(current) => setCurrentSection(
              ['corporate', 'contextual', 'risk-assessment'][current]
            )}
            items={[
              { title: 'Corporate', description: 'Company Information' },
              { title: 'Contextual', description: 'Service Context' },
              { title: 'Risk Assessment', description: 'Technical Review' }
            ]}
          />
        </Card>

        <Form
          form={form}
          layout="vertical"
        >
          {currentSection === 'corporate' && renderCorporateSection()}
          {currentSection === 'contextual' && renderContextualSection()}
          {currentSection === 'risk-assessment' && renderRiskAssessmentSection()}

          <div className="flex justify-between mt-6">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/admin/dashboard')}
            >
              Back to Dashboard
            </Button>
            
            <Space>
              <Button
                type="primary"
                ghost
                icon={<SaveOutlined />}
                onClick={handleSaveScores}
                loading={saving}
              >
                Save Scores
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleCompleteReview}
                loading={completing}
              >
                Complete Review
              </Button>
            </Space>
          </div>
        </Form>
      </Content>
    </Layout>
  );
};

export default SubmissionReview;