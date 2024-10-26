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
        console.log('Fetched questionnaire data:', data);

        if (Array.isArray(data.questions)) {
          setQuestions(data.questions);
          
          if (data.responses && Array.isArray(data.responses)) {
            const formValues = {};
            data.responses.forEach(response => {
              formValues[`question_${response.question_id}`] = response.response_text;
            });
            console.log('Setting initial form values:', formValues);
            form.setFieldsValue(formValues);
          }
        } else {
          throw new Error('Invalid questions data received');
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

  const validateSection = async (sectionQuestions) => {
    try {
      const values = await form.validateFields(
        sectionQuestions.map(q => `question_${q.id}`)
      );
      return { valid: true, values };
    } catch (error) {
      return { valid: false, error };
    }
  };

  const handleSectionChange = async (newSection) => {
    // Group questions by section
    const sections = questions.reduce((acc, question) => {
      if (!acc[question.section]) {
        acc[question.section] = [];
      }
      acc[question.section].push(question);
      return acc;
    }, {});

    const sectionNames = Object.keys(sections);
    const currentSectionQuestions = sections[sectionNames[currentSection]];

    // Validate current section before allowing change
    const validation = await validateSection(currentSectionQuestions);
    if (!validation.valid) {
      message.error('Please complete all questions in the current section before proceeding');
      return;
    }

    setCurrentSection(newSection);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const formValues = form.getFieldsValue(true); // Get all values including hidden fields
      console.log('Saving form values:', formValues);

      const responses = questions.map(question => ({
        question_id: question.id,
        response_text: formValues[`question_${question.id}`]?.trim() || ''
      }));

      console.log('Saving responses:', responses);

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
      const formValues = form.getFieldsValue(true);
      console.log('All form values:', formValues);

      // Create responses array with explicit checks
      const allResponses = questions.map(question => {
        const fieldName = `question_${question.id}`;
        const value = formValues[fieldName];
        
        console.log(`Processing ${fieldName}:`, {
          questionId: question.id,
          questionText: question.question_text,
          value: value
        });

        return {
          question_id: question.id,
          response_text: value?.trim() || ''
        };
      });

      // Check for missing responses
      const missingQuestions = questions.filter(question => {
        const response = formValues[`question_${question.id}`];
        return !response || !response.trim();
      });

      if (missingQuestions.length > 0) {
        const missingTexts = missingQuestions.map(q => q.question_text).join(', ');
        message.error(`Please answer all questions. Missing: ${missingTexts}`);
        return;
      }

      // Confirm submission
      Modal.confirm({
        title: 'Submit Questionnaire',
        content: 'Are you sure you want to submit? You cannot modify your answers after submission.',
        onOk: async () => {
          setSubmitting(true);
          try {
            console.log('Submitting responses:', { responses: allResponses });

            const response = await fetch('/api/v1/vendor/questionnaires/corporate/submit/', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ responses: allResponses })
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
      console.error('Form error:', error);
      message.error('Please ensure all questions are answered correctly');
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
          onChange={handleSectionChange}
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
          {/* Hidden fields for all questions */}
          <div style={{ display: 'none' }}>
            {questions.map(question => (
              <Form.Item
                key={`hidden-${question.id}`}
                name={`question_${question.id}`}
              >
                <TextArea />
              </Form.Item>
            ))}
          </div>

          {/* Visible fields for current section */}
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
                  message: `Please answer: ${question.question_text}` 
                },
                { 
                  min: 3, 
                  message: 'Answer must be at least 3 characters long' 
                },
                {
                  whitespace: true,
                  message: 'Answer cannot be only whitespace'
                }
              ]}
              validateTrigger={['onBlur', 'onChange']}
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
                onClick={() => handleSectionChange(Math.max(0, currentSection - 1))}
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
                  onClick={() => handleSectionChange(currentSection + 1)}
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