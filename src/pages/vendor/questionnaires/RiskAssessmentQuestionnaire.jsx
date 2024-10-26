import { useState, useEffect, useCallback } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Steps, 
  Radio, 
  message, 
  Modal, 
  Space, 
  Progress,
  Tooltip
} from 'antd';
import { useNavigate } from 'react-router-dom';
import FileUploadQuestion from './FileUploadQuestion';
import { ArrowLeftOutlined, HomeOutlined, InfoOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const RiskAssessmentQuestionnaire = () => {
  const [form] = Form.useForm();
  const [questionnaireId, setQuestionnaireId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mainFactors, setMainFactors] = useState([]);
  const [currentFactor, setCurrentFactor] = useState(0);
  const [currentSubFactor, setCurrentSubFactor] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [formChanged, setFormChanged] = useState(false);
  const navigate = useNavigate();

  const fetchQuestionnaire = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/vendor/questionnaires/risk-assessment/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questionnaire');
      }

      const data = await response.json();
      console.log('Fetched questionnaire data:', data);
      setQuestionnaireId(data.questionnaire_id);
      setMainFactors(data.main_factors);
      
      if (data.responses) {
        const formValues = {};
        data.responses.forEach(response => {
          const question = data.main_factors
            .flatMap(f => f.sub_factors)
            .flatMap(sf => sf.questions)
            .find(q => q.id === response.question_id);

          if (question) {
            if (question.type === 'YN') {
              formValues[`question_${response.question_id}`] = response.answer;
            } else if (question.type === 'MC') {
              formValues[`question_${response.question_id}`] = response.choice_id;
            } else if (question.type === 'SA') {
              formValues[`question_${response.question_id}`] = response.answer;
            }
          }
        });
        form.setFieldsValue(formValues);
      }

      if (data.documents) {
        const files = {};
        data.documents.forEach(doc => {
          files[doc.question] = {
            uid: doc.id,
            name: doc.file.split('/').pop(),
            status: 'done',
            url: doc.file
          };
        });
        setUploadedFiles(files);
      }
    } catch (error) {
      console.error('Error fetching questionnaire:', error);
      message.error('Failed to load questionnaire');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    fetchQuestionnaire();
  }, [fetchQuestionnaire]);

  const handleFormChange = () => {
    setFormChanged(true);
  };

  const validateSection = async (questions) => {
    try {
      const values = await form.validateFields(
        questions.map(q => `question_${q.id}`)
      );
      return { valid: true, values };
    } catch (error) {
      return { valid: false, error };
    }
  };

  const handleFactorChange = async (newFactor) => {
    const currentSubFactorQuestions = mainFactors[currentFactor]
      ?.sub_factors[currentSubFactor]?.questions || [];

    const validation = await validateSection(currentSubFactorQuestions);
    if (!validation.valid) {
      message.error('Please complete all questions in the current section before proceeding');
      return;
    }

    setCurrentFactor(newFactor);
    setCurrentSubFactor(0);
  };

  const handleSubFactorChange = async (newSubFactor) => {
    const currentSubFactorQuestions = mainFactors[currentFactor]
      ?.sub_factors[currentSubFactor]?.questions || [];

    const validation = await validateSection(currentSubFactorQuestions);
    if (!validation.valid) {
      message.error('Please complete all questions in the current section before proceeding');
      return;
    }

    setCurrentSubFactor(newSubFactor);
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const formValues = form.getFieldsValue(true);

      const responses = [];
      mainFactors.forEach(factor => {
        factor.sub_factors.forEach(subFactor => {
          subFactor.questions.forEach(question => {
            const value = formValues[`question_${question.id}`];
            const response = {
              question_id: question.id,
              type: question.type
            };

            if (question.type === 'YN') {
              response.answer = value;
            } else if (question.type === 'MC') {
              response.choice_id = value;
            } else if (question.type === 'SA') {
              response.answer = value?.trim() || '';
            }

            responses.push(response);
          });
        });
      });

      const response = await fetch('/api/v1/vendor/questionnaires/risk-assessment/save/', {
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

  const handleSubmit = async () => {
    try {
      const formValues = form.getFieldsValue(true);
      const allResponses = [];
      const missingQuestions = [];
      console.log("Track" , formValues)

      mainFactors.forEach(factor => {
          factor.sub_factors.forEach(subFactor => {
              subFactor.questions.forEach(question => {
                  const value = formValues[`question_${question.id}`];
                  
                  const response = {
                    question_id: question.id,
                    type: question.type
                  };

            if (question.type === 'FU') {
                const fileInfo = uploadedFiles[question.id];
                if (!fileInfo) {
                  missingQuestions.push(question.text);
                } else {
                  // Include file information in the response
                  response.file_upload = {
                    document_id: fileInfo.uid,
                    file_url: fileInfo.url
                  };
                }
              }else if (value == undefined || (typeof value === 'string' && !value.trim())) {
              missingQuestions.push(question.text);
            }


            if (question.type === 'YN') {
              response.answer = value;
            } else if (question.type === 'MC') {
              response.choice_id = value;
            } else if (question.type === 'SA') {
              response.answer = value?.trim() || '';
            }

            allResponses.push(response);
          });
        });
      });

      if (missingQuestions.length > 0) {
        message.error(
          `Please answer all questions. Missing answers for: ${missingQuestions.join(', ')}`
        );
        return;
      }

      Modal.confirm({
        title: 'Submit Questionnaire',
        content: 'Are you sure you want to submit? You cannot modify your answers after submission.',
        onOk: async () => {
          setSubmitting(true);
          try {
            console.log("Track response", allResponses);
            const response = await fetch('/api/v1/vendor/questionnaires/risk-assessment/submit/', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                responses: allResponses,
                submit: true
              })
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

  const renderQuestion = (question) => {
    switch (question.type) {
      case 'YN':
        return (
          <Radio.Group>
            <Radio value={true}>Yes</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        );
      case 'MC':
        return (
          <Radio.Group>
            {question.choices.map(choice => (
              <Radio key={choice.id} value={choice.id}>
                {choice.text}
              </Radio>
            ))}
          </Radio.Group>
        );
      case 'SA':
        return <TextArea rows={4} />;
        case 'FU':
            return (
                <FileUploadQuestion
                questionId={question.id}
                questionnaireId={questionnaireId}  // Pass the stored questionnaire ID
                value={uploadedFiles[question.id]}
                onChange={(fileInfo) => {
                    if (fileInfo) {
                    setUploadedFiles(prev => ({
                        ...prev,
                        [question.id]: fileInfo
                    }));
                    form.setFieldsValue({
                        [`question_${question.id}`]: fileInfo
                    });
                    } else {
                    setUploadedFiles(prev => {
                        const newFiles = { ...prev };
                        delete newFiles[question.id];
                        return newFiles;
                    });
                    form.setFieldsValue({
                        [`question_${question.id}`]: undefined
                    });
                    }
                }}
                />
            );
      default:
        return null;
    }
  };

  if (loading) {
    return <Card loading={true}>Loading questionnaire...</Card>;
  }

  const currentMainFactor = mainFactors[currentFactor];
  if (!currentMainFactor) return null;

  const currentSubFactors = currentMainFactor.sub_factors;
  const currentQuestions = currentSubFactors[currentSubFactor]?.questions || [];

  return (
    <div className="p-4">
      <Card 
        title="Risk Assessment Questionnaire" 
        className="mb-4"
        extra={
          <Button 
            icon={<HomeOutlined className="w-4 h-4" />}
            onClick={handleReturnToDashboard}
          >
            Return to Dashboard
          </Button>
        }
      >
        <Steps
          current={currentFactor}
          onChange={handleFactorChange}
          items={mainFactors.map(factor => ({
            title: factor.name,
            description: `Weight: ${factor.weight}%`
          }))}
        />
      </Card>

      <Card 
        title={currentMainFactor.name}
        extra={
          <Progress 
            percent={Math.round((currentSubFactor / currentSubFactors.length) * 100)} 
            size="small"
            className="w-32"
          />
        }
      >
        <Steps
          size="small"
          current={currentSubFactor}
          onChange={handleSubFactorChange}
          className="mb-6"
          items={currentSubFactors.map(sf => ({
            title: sf.name,
            description: `Weight: ${sf.weight}%`
          }))}
        />

        <Form
          form={form}
          layout="vertical"
          className="max-w-2xl mx-auto"
          onValuesChange={handleFormChange}
        >
          {/* Hidden fields for all questions */}
          <div style={{ display: 'none' }}>
            {mainFactors.flatMap(factor =>
              factor.sub_factors.flatMap(subFactor =>
                subFactor.questions.map(question => (
                  <Form.Item
                    key={`hidden-${question.id}`}
                    name={`question_${question.id}`}
                  >
                    {question.type === 'YN' && <Radio.Group />}
                    {question.type === 'MC' && <Radio.Group />}
                    {question.type === 'SA' && <TextArea />}
                  </Form.Item>
                ))
              )
            )}
          </div>

          {/* Visible fields for current section */}
          {currentQuestions.map(question => (
            <Form.Item
              key={question.id}
              name={`question_${question.id}`}
              label={
                <Space>
                  {question.text}
                  <span className="text-gray-400 text-sm">
                    (Weight: {question.weight}%)
                  </span>
                  <Tooltip title={
                    question.type === 'FU' 
                      ? "Please upload a file" 
                      : "This field is required"
                  }>
                    <InfoOutlined className="w-4 h-4 text-blue-500" />
                  </Tooltip>
                </Space>
              }
              rules={[
                { 
                  required: question.type !== 'FU', 
                  message: `Please answer: ${question.text}` 
                },
                ...(question.type === 'SA' ? [
                  { 
                    min: 3, 
                    message: 'Answer must be at least 3 characters long' 
                  },
                  {
                    whitespace: true,
                    message: 'Answer cannot be only whitespace'
                  }
                ] : [])
              ]}
              validateTrigger={['onBlur', 'onChange']}
            >
              {renderQuestion(question)}
            </Form.Item>
          ))}

          <div className="flex justify-between mt-6">
            <Space>
              <Button
                icon={<ArrowLeftOutlined className="w-4 h-4" />}
                onClick={() => {
                  if (currentSubFactor > 0) {
                    handleSubFactorChange(currentSubFactor - 1);
                  } else if (currentFactor > 0) {
                    handleFactorChange(currentFactor - 1);
                    setCurrentSubFactor(mainFactors[currentFactor - 1].sub_factors.length - 1);
                  }
                }}
                disabled={currentFactor === 0 && currentSubFactor === 0}
              >
                Previous
              </Button>
              <Button
                icon={<SaveOutlined className="w-4 h-4" />}
                onClick={handleSave}
                loading={saving}
                disabled={!formChanged}
              >
                Save Progress
              </Button>
            </Space>

            <Space>
              {currentFactor === mainFactors.length - 1 &&
               currentSubFactor === currentSubFactors.length - 1 ? (
                <Button
                  type="primary"
                  icon={<SendOutlined className="w-4 h-4" />}
                  onClick={handleSubmit}
                  loading={submitting}
                >
                  Submit Assessment
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => {
                    if (currentSubFactor < currentSubFactors.length - 1) {
                      handleSubFactorChange(currentSubFactor + 1);
                    } else {
                      handleFactorChange(currentFactor + 1);
                      setCurrentSubFactor(0);
                    }
                  }}
                >
                  Next
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RiskAssessmentQuestionnaire;