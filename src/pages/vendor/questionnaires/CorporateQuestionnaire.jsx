import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Card, Steps, message, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';

const CorporateQuestionnaire = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentSection, setCurrentSection] = useState(0);
  const navigate = useNavigate();

 

  const fetchQuestionnaire = useCallback(async () => {
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
      setQuestions(data.questions);
      
      // If there are saved responses, populate the form
      if (data.responses) {
        const formValues = {};
        data.responses.forEach(response => {
          formValues[`question_${response.question_id}`] = response.response_text;
        });
        form.setFieldsValue(formValues);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load questionnaire:', err);
      message.error('Failed to load questionnaire');
      
    }finally{
        setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    fetchQuestionnaire();
  }, [fetchQuestionnaire]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      const responses = Object.entries(values).map(([key, value]) => ({
        question_id: parseInt(key.split('_')[1]),
        response_text: value
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
        throw new Error('Failed to save responses');
      }

      message.success('Progress saved successfully');
    } catch (err) {
        console.error('Failed to Save Progress:', err);
      message.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    Modal.confirm({
      title: 'Submit Questionnaire',
      content: 'Are you sure you want to submit? You cannot modify your answers after submission.',
      onOk: async () => {
        try {
          setSubmitting(true);
          const values = await form.validateFields();
          
          const responses = Object.entries(values).map(([key, value]) => ({
            question_id: parseInt(key.split('_')[1]),
            response_text: value
          }));

          const response = await fetch('/api/v1/vendor/questionnaires/corporate/submit/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ responses })
          });

          if (!response.ok) {
            throw new Error('Failed to submit questionnaire');
          }

          message.success('Questionnaire submitted successfully');
          navigate('/vendor/dashboard');
        } catch (err) {
          console.error('Failed to Submit Questionnaire:', err);
          message.error('Failed to submit questionnaire');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  if (loading) {
    return <div>Loading...</div>;
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
      <Card title="Corporate Questionnaire" className="mb-4">
        <Steps
          current={currentSection}
          onChange={setCurrentSection}
          items={sectionNames.map(section => ({ title: section }))}
        />
      </Card>

      <Card>
        <Form
          form={form}
          layout="vertical"
          className="max-w-2xl mx-auto"
        >
          {sections[sectionNames[currentSection]]?.map(question => (
            <Form.Item
              key={question.id}
              name={`question_${question.id}`}
              label={question.question_text}
              rules={[{ required: true, message: 'This field is required' }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
          ))}

          <div className="flex justify-between mt-6">
            <Button
              onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
              disabled={currentSection === 0}
            >
              Previous
            </Button>
            <div>
              <Button 
                onClick={handleSave} 
                loading={saving}
                className="mr-2"
              >
                Save Progress
              </Button>
              {currentSection === sectionNames.length - 1 && (
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={submitting}
                >
                  Submit Questionnaire
                </Button>
              )}
              {currentSection < sectionNames.length - 1 && (
                <Button
                  type="primary"
                  onClick={() => setCurrentSection(prev => prev + 1)}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CorporateQuestionnaire;