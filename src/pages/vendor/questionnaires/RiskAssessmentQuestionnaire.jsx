import { useState, useEffect, useCallback } from 'react';
import { 
  Form, Card, Steps, Button, Radio, Input, 
  Upload, message, Modal, Space, Progress 
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;

const RiskAssessmentQuestionnaire = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mainFactors, setMainFactors] = useState([]);
  const [currentFactor, setCurrentFactor] = useState(0);
  const [currentSubFactor, setCurrentSubFactor] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState({});
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
      setMainFactors(data.main_factors);
      
      // If there are saved responses, populate the form
      if (data.responses) {
        const formValues = {};
        data.responses.forEach(response => {
          const fieldName = `question_${response.question.id}`;
          if (response.question.type === 'YN') {
            formValues[fieldName] = response.yes_no_response;
          } else if (response.question.type === 'MC') {
            formValues[fieldName] = response.selected_choice;
          } else if (response.question.type === 'SA') {
            formValues[fieldName] = response.response_text;
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

  const handleUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('question_id', file.questionId);

    try {
      const response = await fetch('/api/v1/vendor/questionnaires/risk-assessment/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      setUploadedFiles(prev => ({
        ...prev,
        [file.questionId]: {
          uid: result.document_id,
          name: file.name,
          status: 'done',
          url: result.file_url
        }
      }));
      onSuccess(result, file);
    } catch (error) {
      console.error('Upload error:', error);
      onError(error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      const responses = Object.entries(values).map(([key, value]) => {
        const questionId = parseInt(key.split('_')[1]);
        const question = mainFactors
          .flatMap(f => f.sub_factors)
          .flatMap(sf => sf.questions)
          .find(q => q.id === questionId);

        return {
          question_id: questionId,
          answer: {
            type: question.type,
            value: value
          }
        };
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
        throw new Error('Failed to save responses');
      }

      message.success('Progress saved successfully');
    } catch (error) {
      console.error('Error saving progress:', error);
      message.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    Modal.confirm({
      title: 'Submit Risk Assessment',
      content: 'Are you sure you want to submit? You cannot modify your answers after submission.',
      onOk: async () => {
        try {
          setSubmitting(true);
          const values = await form.validateFields();
          
          const responses = Object.entries(values).map(([key, value]) => {
            const questionId = parseInt(key.split('_')[1]);
            const question = mainFactors
              .flatMap(f => f.sub_factors)
              .flatMap(sf => sf.questions)
              .find(q => q.id === questionId);

            return {
              question_id: questionId,
              answer: {
                type: question.type,
                value: value
              }
            };
          });

          const response = await fetch('/api/v1/vendor/questionnaires/risk-assessment/submit/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              responses,
              submit: true
            })
          });

          if (!response.ok) {
            throw new Error('Failed to submit questionnaire');
          }

          message.success('Risk assessment submitted successfully');
          navigate('/vendor/dashboard');
        } catch (error) {
          console.error('Error submitting questionnaire:', error);
          message.error('Failed to submit questionnaire');
        } finally {
          setSubmitting(false);
        }
      }
    });
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
          <Upload
            customRequest={handleUpload}
            fileList={uploadedFiles[question.id] ? [uploadedFiles[question.id]] : []}
            beforeUpload={file => {
              file.questionId = question.id;
              return true;
            }}
          >
            <Button icon={<UploadOutlined />}>Upload File</Button>
          </Upload>
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
      <Card title="Risk Assessment Questionnaire" className="mb-4">
        <Steps
          current={currentFactor}
          onChange={setCurrentFactor}
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
          />
        }
      >
        <Steps
          size="small"
          current={currentSubFactor}
          onChange={setCurrentSubFactor}
          style={{ marginBottom: 24 }}
          items={currentSubFactors.map(sf => ({
            title: sf.name,
            description: `Weight: ${sf.weight}%`
          }))}
        />

        <Form
          form={form}
          layout="vertical"
          className="max-w-2xl mx-auto"
        >
          {currentQuestions.map(question => (
            <Form.Item
              key={question.id}
              name={`question_${question.id}`}
              label={
                <Space>
                  {question.text}
                  <small className="text-gray-400">
                    (Weight: {question.weight}%)
                  </small>
                </Space>
              }
              rules={[{ required: true, message: 'This question is required' }]}
            >
              {renderQuestion(question)}
            </Form.Item>
          ))}

          <div className="flex justify-between mt-6">
            <Space>
              <Button
                onClick={() => {
                  if (currentSubFactor > 0) {
                    setCurrentSubFactor(currentSubFactor - 1);
                  } else if (currentFactor > 0) {
                    setCurrentFactor(currentFactor - 1);
                    setCurrentSubFactor(mainFactors[currentFactor - 1].sub_factors.length - 1);
                  }
                }}
                disabled={currentFactor === 0 && currentSubFactor === 0}
              >
                Previous
              </Button>
              <Button
                onClick={handleSave}
                loading={saving}
              >
                Save Progress
              </Button>
            </Space>

            <Space>
              {currentFactor === mainFactors.length - 1 &&
               currentSubFactor === currentSubFactors.length - 1 ? (
                <Button
                  type="primary"
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
                      setCurrentSubFactor(currentSubFactor + 1);
                    } else {
                      setCurrentFactor(currentFactor + 1);
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