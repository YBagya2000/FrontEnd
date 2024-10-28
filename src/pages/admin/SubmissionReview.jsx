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
  Divider,
  Tooltip
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  FileOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  AreaChartOutlined
} from '@ant-design/icons';
import PropTypes from 'prop-types';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

// Document display component
const DocumentDisplay = ({ fileUrl, fileName }) => {
  if (!fileUrl) return <Text type="secondary">No document uploaded</Text>;

  // Add base URL if needed
  const fullUrl = fileUrl.startsWith('http') 
    ? fileUrl 
    : `${window.location.origin}${fileUrl}`;

  return (
    <div className="p-2 border rounded mt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileOutlined className="mr-2" />
          <Text>{fileName || fileUrl.split('/').pop()}</Text>
        </div>
        <Space>
          <Button 
            type="primary" 
            size="small" 
            onClick={() => window.open(fullUrl, '_blank')}
          >
            View Document
          </Button>
        </Space>
      </div>
    </div>
  );
};

const SubmissionReview = () => {
  const [form] = Form.useForm();
  const { submissionId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [currentSection, setCurrentSection] = useState('corporate');
  const [error, setError] = useState(null);

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

        // Set initial form values for existing scores
        const formValues = {};
        data.risk_assessment.main_factors.forEach(factor => {
          factor.sub_factors.forEach(subFactor => {
            subFactor.questions.forEach(question => {
              if (question.answer?.requires_scoring) {
                if (question.answer?.score !== null) {
                  formValues[`score_${question.id}`] = question.answer.score;
                }
                if (question.answer?.ra_comment) {
                  formValues[`comment_${question.id}`] = question.answer.ra_comment;
                }
              }
            });
          });
        });
        form.setFieldsValue(formValues);
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
            score: parseFloat(value),
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
      setSubmitting(true);
      const values = await form.validateFields();
      
      // Transform and validate scores
      const scores = Object.entries(values)
        .filter(([key]) => key.startsWith('score_'))
        .map(([key, value]) => {
          const questionId = key.split('_')[1];
          return {
            question_id: parseInt(questionId),
            score: parseFloat(value),
            comment: values[`comment_${questionId}`] || ''
          };
        });

      // Submit scores first
      const scoreResponse = await fetch(`/api/v1/ra-team/submissions/${submissionId}/score/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scores })
      });

      if (!scoreResponse.ok) {
        const errorData = await scoreResponse.json();
        throw new Error(errorData.error || 'Failed to save scores');
      }

      // Complete the review
      const completeResponse = await fetch(`/api/v1/ra-team/submissions/${submissionId}/complete/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Failed to complete review');
      }

      const result = await completeResponse.json();
      message.success('Review completed successfully');

      if (result.risk_calculation) {
        Modal.success({
          title: 'Risk Assessment Complete',
          content: (
            <div>
              <p>Manual Scores Submitted for Calculation</p>
            </div>
          ),
          onOk: () => navigate('/admin/dashboard')
        });
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Error completing review:', error);
      message.error(error.message || 'Failed to complete review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCorporateSection = () => (
    <Card title="Corporate Questionnaire Review">
      {submission?.corporate_questionnaire?.responses?.map((response, index) => (
        <div key={index} className="mb-4">
          <Space direction="vertical" className="w-full">
            <Text strong>{response.question.text}</Text>
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
            <div className="bg-gray-50 p-2 rounded">
              <Text>Selected: {response.selected_choice.text}</Text>
              <Text type="secondary" className="ml-2">
                (Modifier: {response.selected_choice.modifier > 0 ? '+' : ''}
                {response.selected_choice.modifier}%)
              </Text>
            </div>
          </Space>
          <Divider />
        </div>
      ))}
    </Card>
  );

  const renderQuestionResponse = (question) => {
    const answer = question.answer;

    switch (question.type) {
      case 'YN':
        return (
          <Text className="bg-gray-50 p-2 rounded block">
            {answer?.value ? 'Yes' : 'No'}
          </Text>
        );
      
      case 'MC': {
        const selectedChoice = question.choices?.find(c => c.id === answer?.value);
        return (
          <Text className="bg-gray-50 p-2 rounded block">
            {selectedChoice ? selectedChoice.text : 'No selection'}
          </Text>
        );
      }
      
      case 'SA':
        return (
          <>
            <Text className="bg-gray-50 p-2 rounded block mb-4">
              {answer?.value || 'No response provided'}
            </Text>
            <Form.Item
              name={`score_${question.id}`}
              label="Score (0-10)"
              rules={[
                { required: true, message: 'Score is required' },
                {
                  type: 'number',
                  transform: (value) => parseFloat(value),
                  min: 0,
                  max: 10,
                  message: 'Score must be between 0 and 10'
                }
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
          </>
        );
      
      case 'FU':
        return (
          <>
            <DocumentDisplay fileUrl={answer?.file_url} />
            {answer?.requires_scoring && (
              <>
                <Form.Item
                  name={`score_${question.id}`}
                  label="Score (0-10)"
                  rules={[
                    { required: true, message: 'Score is required' },
                    {
                      type: 'number',
                      transform: (value) => parseFloat(value),
                      min: 0,
                      max: 10,
                      message: 'Score must be between 0 and 10'
                    }
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
              </>
            )}
          </>
        );
      
      default:
        return <Text type="secondary">Unknown question type</Text>;
    }
  };

  const renderRiskAssessmentSection = () => (
    <div>
      {submission?.risk_assessment?.main_factors?.map((factor, factorIndex) => (
        <Card 
          key={factorIndex}
          title={
            <Space>
              {factor.name}
              <Text type="secondary" className="text-sm">
                (Weight: {factor.weight}%)
              </Text>
            </Space>
          }
          className="mb-4"
        >
          {factor.sub_factors.map((subFactor, subFactorIndex) => (
            <div key={subFactorIndex} className="mb-4">
              <Title level={4}>
                {subFactor.name}
                <Text type="secondary" className="text-sm ml-2">
                  (Weight: {subFactor.weight}%)
                </Text>
              </Title>
              
              {subFactor.questions.map((question, questionIndex) => (
                <div 
                  key={questionIndex} 
                  className="mb-6 p-4 border rounded-lg bg-white shadow-sm"
                >
                  <Space direction="vertical" className="w-full">
                    <Space align="center">
                      <Text strong>{question.text}</Text>
                      <Tooltip title={`Question Type: ${question.type}, Weight: ${question.weight}%`}>
                        <InfoCircleOutlined className="text-blue-500" />
                      </Tooltip>
                    </Space>
                    {renderQuestionResponse(question)}
                  </Space>
                </div>
              ))}
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
                loading={submitting}
              >
                Complete Review
              </Button>
              <Button
                type="primary"
                onClick={() => navigate(`/admin/risk-analysis/${submissionId}`)}
                icon={<AreaChartOutlined />}
              >
                View Risk Analysis
              </Button>
            </Space>
            </div>
        </Form>
      </Content>
    </Layout>
  );
};

// PropTypes for the DocumentDisplay component
DocumentDisplay.propTypes = {
  fileUrl: PropTypes.string,
  fileName: PropTypes.string
};

export default SubmissionReview;