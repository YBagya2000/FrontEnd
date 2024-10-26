import { useState, useEffect, useCallback } from 'react';
import { Form, Card, Steps, Button, Radio, message, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';

const ContextualQuestionnaire = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentSection, setCurrentSection] = useState(0);
  const navigate = useNavigate();

  // Use useCallback for functions used in useEffect
  const fetchQuestionnaire = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/vendor/questionnaires/contextual/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questionnaire');
      }

      const data = await response.json();
      setQuestionnaire(data);
      setQuestions(data.questions);
      return data;
    } catch (error) {
      console.error('Error fetching questionnaire:', error);
      message.error('Failed to load questionnaire');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since it doesn't use any external values

  useEffect(() => {
    if (questionnaire?.responses) {
      const formValues = {};
      questionnaire.responses.forEach(response => {
        formValues[`question_${response.question_id}`] = response.selected_choice;
      });
      form.setFieldsValue(formValues);
    }
  }, [questionnaire, form]);

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

  // Initial data fetch
  useEffect(() => {
    fetchQuestionnaire();
  }, [fetchQuestionnaire]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      const responses = Object.entries(values).map(([key, value]) => ({
        question_id: parseInt(key.split('_')[1]),
        choice_id: value
      }));

      const response = await fetch('/api/v1/vendor/questionnaires/contextual/save/', {
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
            choice_id: value
          }));

          const response = await fetch('/api/v1/vendor/questionnaires/contextual/submit/', {
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
        } catch (error) {
          console.error('Error submitting questionnaire:', error);
          message.error('Failed to submit questionnaire');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  // Group questions by section (Factor categories)
  const sections = questions.reduce((acc, question) => {
    const section = question.weight >= 20 ? 'Critical Factors' : 
                   question.weight >= 10 ? 'Important Factors' : 'Standard Factors';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(question);
    return acc;
  }, {});

  const sectionNames = Object.keys(sections);

  if (loading) {
    return (
      <Card loading={true} className="m-4">
        Loading questionnaire...
      </Card>
    );
  }

  return (
    <div className="p-4">
      <Card title="Contextual Questionnaire" className="mb-4">
        <Steps
          current={currentSection}
          onChange={handleSectionChange}
          items={sectionNames.map(section => ({ title: section }))}
        />
      </Card>

      <Card>
        <Form
          form={form}
          layout="vertical"
          className="max-w-2xl mx-auto"
        >

            {/* Hidden fields for all questions */}
          <div style={{ display: 'none' }}>
            {questions.map(question => (
              <Form.Item
                key={`hidden-${question.id}`}
                name={`question_${question.id}`}
              >
              </Form.Item>
            ))}
          </div>

          {sections[sectionNames[currentSection]]?.map(question => (
            <Form.Item
              key={question.id}
              name={`question_${question.id}`}
              label={
                <div>
                  {question.text}
                  <span className="text-gray-400 ml-2">
                    (Weight: {question.weight}%)
                  </span>
                </div>
              }
              rules={[{ required: true, message: 'Please select an option' }]}
            >
              <Radio.Group>
                {question.choices.map(choice => (
                  <Radio.Button 
                    key={choice.id} 
                    value={choice.id}
                  >
                    {choice.text}
                    <span className="text-gray-400 ml-2">
                      ({choice.modifier > 0 ? '+' : ''}{choice.modifier}%)
                    </span>
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>
          ))}

          <div className="flex justify-between mt-6">
            <Button
              onClick={() => handleSectionChange(Math.max(0, currentSection - 1))}
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
                  onClick={() => handleSectionChange(currentSection + 1)}
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

export default ContextualQuestionnaire;