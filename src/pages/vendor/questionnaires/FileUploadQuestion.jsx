/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Upload, Button, Progress, message } from 'antd';
import { DeleteOutlined, FileOutlined, UploadOutlined } from '@ant-design/icons';

const FileUploadQuestion = ({ questionId, questionnaireId, value, onChange }) => {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
  
    const customRequest = async ({ file, onSuccess, onError }) => {

    if (!questionnaireId) {
        message.error('Questionnaire not initialized properly');
        onError(new Error('Questionnaire ID missing'));
            return;
        }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('question_id', questionId);
      formData.append('questionnaire_id', questionnaireId);
  
      try {
        setUploading(true);
        
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        });
  
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            const fileInfo = {
              uid: response.document_id,
              name: file.name,
              status: 'done',
              url: response.file_url
            };
            onChange(fileInfo);
            onSuccess(response, file);
            message.success(`${file.name} uploaded successfully`);
          } else {
            const errorData = JSON.parse(xhr.responseText);
            throw new Error(errorData.error || 'Upload failed');
          }
          setUploading(false);
          setUploadProgress(0);
        });
  
        xhr.addEventListener('error', () => {
          onError(new Error('Upload failed'));
          setUploading(false);
          setUploadProgress(0);
          message.error(`${file.name} upload failed`);
        });
  
        xhr.open('POST', '/api/v1/vendor/questionnaires/risk-assessment/upload/');
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
        xhr.send(formData);
  
      } catch (error) {
        console.error('Upload error:', error);
        onError(error);
        setUploading(false);
        setUploadProgress(0);
        message.error(error.message || `${file.name} upload failed`);
      }
    };
  
    const handleRemove = () => {
      onChange(null);
      return true;
    };
  
    return (
      <div className="w-full">
        <Upload
          customRequest={customRequest}
          onRemove={handleRemove}
          fileList={value ? [value] : []}
          maxCount={1}
        >
          {!value && (
            <Button 
              icon={<UploadOutlined className="w-4 h-4" />} 
              loading={uploading}
              disabled={uploading}
            >
              Upload File
            </Button>
          )}
        </Upload>
        
        {uploading && (
          <Progress 
            percent={uploadProgress} 
            size="small" 
            status="active"
            className="mt-2" 
          />
        )}
  
        {value && !uploading && (
          <div className="flex items-center mt-2 p-2 bg-gray-50 rounded">
            <FileOutlined className="w-4 h-4 mr-2" />
            <span className="flex-grow truncate">{value.name}</span>
            <Button
              type="text"
              icon={<DeleteOutlined className="w-4 h-4" />}
              onClick={() => handleRemove()}
              className="ml-2"
              size="small"
            />
          </div>
        )}
      </div>
    );
  };
  
  export default FileUploadQuestion;