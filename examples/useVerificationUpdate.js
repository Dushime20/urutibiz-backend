import { useState } from 'react';
import { toast } from 'react-toastify';

/**
 * React Hook for User Verification Update with Loading States and Toast Messages
 * 
 * Features:
 * - Loading states for different operations
 * - Toast notifications for success/error
 * - File upload handling
 * - OCR and AI processing feedback
 * - Auto-verification status handling
 */

export const useVerificationUpdate = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateVerification = async (verificationId, data, options = {}) => {
    const {
      showToast = true,
      onProgress,
      onSuccess,
      onError
    } = options;

    setLoading(true);
    setProgress(0);

    try {
      // Step 1: File upload (if files are provided)
      let finalData = { ...data };
      
      if (data.documentImage || data.selfieImage) {
        setUploading(true);
        setProgress(10);
        
        const formData = new FormData();
        
        // Add text fields
        Object.keys(data).forEach(key => {
          if (key !== 'documentImage' && key !== 'selfieImage') {
            formData.append(key, data[key]);
          }
        });
        
        // Add files
        if (data.documentImage) {
          formData.append('documentImage', data.documentImage);
        }
        if (data.selfieImage) {
          formData.append('selfieImage', data.selfieImage);
        }

        setProgress(30);
        
        const uploadResponse = await fetch(`/api/v1/user-verification/${verificationId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error('File upload failed');
        }

        setProgress(50);
        setUploading(false);
      } else {
        // Step 2: JSON update (no file upload)
        setProgress(20);
        
        const jsonResponse = await fetch(`/api/v1/user-verification/${verificationId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (!jsonResponse.ok) {
          throw new Error('Update failed');
        }

        setProgress(50);
      }

      // Step 3: AI Processing
      setProcessing(true);
      setProgress(60);

      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      setProgress(80);

      // Get final result
      const finalResponse = await fetch(`/api/v1/user-verification/${verificationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await finalResponse.json();

      setProgress(100);
      setProcessing(false);
      setLoading(false);

      // Handle success
      if (result.success) {
        const verification = result.data.verification;
        
        if (showToast) {
          if (verification.verificationStatus === 'verified') {
            toast.success('🎉 Verification completed and auto-verified!', {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          } else {
            toast.success('✅ Verification updated successfully', {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(verification);
        }

        return verification;
      } else {
        throw new Error(result.message || 'Update failed');
      }

    } catch (error) {
      setLoading(false);
      setUploading(false);
      setProcessing(false);
      setProgress(0);

      const errorMessage = error.message || 'Verification update failed';

      if (showToast) {
        toast.error(`❌ ${errorMessage}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }

      // Call error callback
      if (onError) {
        onError(error);
      }

      throw error;
    }
  };

  return {
    updateVerification,
    loading,
    uploading,
    processing,
    progress,
    isUpdating: loading || uploading || processing
  };
};

/**
 * React Component Example with Loading States and Toast Messages
 */

import React, { useState } from 'react';
import { useVerificationUpdate } from './useVerificationUpdate';

export const VerificationUpdateForm = ({ verificationId, onSuccess }) => {
  const [formData, setFormData] = useState({
    verificationType: 'national_id',
    documentNumber: '',
    addressLine: '',
    city: '',
    district: '',
    country: '',
    documentImage: null,
    selfieImage: null
  });

  const {
    updateVerification,
    loading,
    uploading,
    processing,
    progress,
    isUpdating
  } = useVerificationUpdate();

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateVerification(verificationId, formData, {
        onSuccess: (verification) => {
          console.log('Verification updated:', verification);
          if (onSuccess) onSuccess(verification);
        },
        onError: (error) => {
          console.error('Update failed:', error);
        }
      });
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  return (
    <div className="verification-update-form">
      <h3>Update Verification</h3>
      
      {/* Progress Bar */}
      {isUpdating && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">
            {uploading && 'Uploading files...'}
            {processing && 'Processing with AI...'}
            {loading && !uploading && !processing && 'Updating verification...'}
            {progress}%
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Verification Type</label>
          <select
            value={formData.verificationType}
            onChange={(e) => setFormData(prev => ({ ...prev, verificationType: e.target.value }))}
            disabled={isUpdating}
          >
            <option value="national_id">National ID</option>
            <option value="passport">Passport</option>
            <option value="driving_license">Driving License</option>
            <option value="address">Address</option>
            <option value="selfie">Selfie</option>
          </select>
        </div>

        <div className="form-group">
          <label>Document Number</label>
          <input
            type="text"
            value={formData.documentNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
            disabled={isUpdating}
          />
        </div>

        <div className="form-group">
          <label>Address Line</label>
          <input
            type="text"
            value={formData.addressLine}
            onChange={(e) => setFormData(prev => ({ ...prev, addressLine: e.target.value }))}
            disabled={isUpdating}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              disabled={isUpdating}
            />
          </div>
          <div className="form-group">
            <label>District</label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
              disabled={isUpdating}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            disabled={isUpdating}
          />
        </div>

        <div className="form-group">
          <label>Document Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'documentImage')}
            disabled={isUpdating}
          />
        </div>

        <div className="form-group">
          <label>Selfie Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'selfieImage')}
            disabled={isUpdating}
          />
        </div>

        <button 
          type="submit" 
          disabled={isUpdating}
          className={isUpdating ? 'loading' : ''}
        >
          {isUpdating ? 'Processing...' : 'Update Verification'}
        </button>
      </form>

      {/* Status Messages */}
      {uploading && (
        <div className="status-message uploading">
          📤 Uploading files to server...
        </div>
      )}
      
      {processing && (
        <div className="status-message processing">
          🤖 Processing with AI (OCR + Image Comparison)...
        </div>
      )}
      
      {loading && !uploading && !processing && (
        <div className="status-message loading">
          ⏳ Updating verification data...
        </div>
      )}
    </div>
  );
};

/**
 * CSS Styles for the form
 */

const styles = `
.verification-update-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.progress-container {
  margin: 20px 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:disabled,
.form-group select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button.loading {
  background-color: #ff9800;
}

.status-message {
  padding: 12px;
  margin: 10px 0;
  border-radius: 4px;
  font-weight: 500;
}

.status-message.uploading {
  background-color: #e0f7f7;
  color: #00aaa9;
  border: 1px solid #b3efef;
}

.status-message.processing {
  background-color: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffe0b2;
}

.status-message.loading {
  background-color: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
}
`;

export default useVerificationUpdate; 