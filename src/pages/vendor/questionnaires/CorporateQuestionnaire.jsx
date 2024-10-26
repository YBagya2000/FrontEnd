import { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Steps, 
  message, 
  Modal, 
  Space, 
  Tooltip 
} from 'antd';
import { 
  SaveOutlined, 
  SendOutlined, 
  ArrowLeftOutlined,
  InfoCircleOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;

const CorporateQuestionnaire = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [formChanged, setFormChanged] = useState(false);
  const navigate = useNavigate();

  // Fetch questionnaire data
  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        const response = await fetch('/api/v1/vendor/questionnaires/corporate/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch questionnaire');
        }

        const data = await response.json();
        console.log('Initial questionnaire data:', data);
        setQuestions(data.questions);

        // If there are saved responses, populate the form
        if (data.responses) {
          const formValues = {};
          data.responses.forEach(response => {
            formValues[`question_${response.question_id}`] = response.response_text;
          });
          form.setFieldsValue(formValues);
        }
      } catch (error) {
        console.error('Failed to load questionnaire:', error);
        message.error('Failed to load questionnaire');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [form]);

  const handleFormChange = () => {
    setFormChanged(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = form.getFieldsValue();
      
      const responses = questions.map(question => ({
        question_id: question.id,
        response_text: values[`question_${question.id}`]?.trim() || ''
      }));

      const response = await fetch('/api/v1/vendor/questionnaires/corporate/save/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ responses })
      });

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }

      setFormChanged(false);
      message.success('Progress saved successfully');
    } catch (error) {
      console.error('Failed to save progress:', error);
      message.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleReturnToDashboard = () => {
    if (formChanged) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'Would you like to save your changes before returning to the dashboard?',
        okText: 'Save & Return',
        cancelText: 'Return Without Saving',
        onOk: async () => {
          await handleSave();
          navigate('/vendor/dashboard');
        },
        onCancel: () => {
          navigate('/vendor/dashboard');
        }
      });
    } else {
      navigate('/vendor/dashboard');
    }
  };

  const handleSubmit = async () => {
    try {
      // Get all form values
      const values = await form.validateFields();
      console.log('Form values before submission:', values);

      // Map questions to responses, including debugging
      const responses = questions.map(question => {
        const fieldName = `question_${question.id}`;
        const response = values[fieldName];
        console.log(`Field ${fieldName}:`, response); // Debug log
        
        return {
          question_id: question.id,
          response_text: response?.trim() || ''
        };
      });

      console.log('Prepared responses:', responses);

      // Check for empty responses
      const emptyResponses = responses.filter(r => !r.response_text);
      if (emptyResponses.length > 0) {
        const emptyQuestions = emptyResponses
          .map(r => questions.find(q => q.id === r.question_id)?.question_text)
          .filter(Boolean);
        
        message.error(
          `Please answer all questions. Missing ${emptyResponses.length} answers: ${emptyQuestions.join(', ')}`
        );
        return;
      }

      // Confirm submission
      Modal.confirm({
        title: 'Submit Questionnaire',
        content: 'Are you sure you want to submit? You cannot modify your answers after submission.',
        onOk: async () => {
          setSubmitting(true);
          try {
            const response = await fetch('/api/v1/vendor/questionnaires/corporate/submit/', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ responses })
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to submit questionnaire');
            }

            message.success('Questionnaire submitted successfully');
            navigate('/vendor/dashboard');
          } catch (error) {
            console.error('Submission error:', error);
            message.error(error.message || 'Failed to submit questionnaire');
          } finally {
            setSubmitting(false);
          }
        }
      });
    } catch (error) {
      console.error('Form validation error:', error);
      // Let antd handle the validation error messages
    }
  };

  if (loading) {
    return <Card loading={true}>Loading questionnaire...</Card>;
  }

  // Group questions by section
  const sections = questions.reduce((acc, question) => {
    if (!acc[question.section]) {
      acc[question.section] = [];
    }
    acc[question.section].push(question);
    return acc;
  }, {});

  const sectionNames = Object.keys(sections);

  return (
    <div className="p-4">
      <Card 
        title="Corporate Questionnaire" 
        className="mb-4"
        extra={
          <Button 
            icon={<HomeOutlined />}
            onClick={handleReturnToDashboard}
          >
            Return to Dashboard
          </Button>
        }
      >
        <Steps
          current={currentSection}
          onChange={setCurrentSection}
          items={sectionNames.map(section => ({
            title: section,
            description: `${sections[section].length} questions`
          }))}
        />
      </Card>

      <Card>
        <Form
          form={form}
          layout="vertical"
          className="max-w-2xl mx-auto"
          onValuesChange={handleFormChange}
        >
          {sections[sectionNames[currentSection]]?.map(question => (
            <Form.Item
              key={question.id}
              name={`question_${question.id}`}
              label={
                <Space>
                  {question.question_text}
                  <Tooltip title="This field is required. Minimum 3 characters.">
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </Space>
              }
              rules={[
                { 
                  required: true, 
                  whitespace: true,
                  message: `Please answer: ${question.question_text}` 
                },
                { 
                  min: 3, 
                  message: 'Answer must be at least 3 characters long' 
                }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Enter your answer here..."
                showCount
                maxLength={1000}
              />
            </Form.Item>
          ))}

          <div className="flex justify-between mt-6">
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
                disabled={currentSection === 0}
              >
                Previous
              </Button>
              <Button
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                disabled={!formChanged}
              >
                Save Progress
              </Button>
            </Space>

            <Space>
              {currentSection === sectionNames.length - 1 ? (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSubmit}
                  loading={submitting}
                >
                  Submit Questionnaire
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => setCurrentSection(prev => prev + 1)}
                >
                  Next Section
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CorporateQuestionnaire;