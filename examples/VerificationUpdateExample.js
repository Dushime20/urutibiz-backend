import React, { useState } from 'react';
import { toast } from 'react-toastify';

/**
 * Example React Component for User Verification Update
 * 
 * Features:
 * - Loading states for different operations
 * - Toast notifications
 * - File upload handling
 * - Progress tracking
 * - Auto-verification feedback
 */

const VerificationUpdateExample = ({ verificationId }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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

  const updateVerification = async () => {
    setLoading(true);
    setProgress(0);

    try {
      // Step 1: File upload (if files are provided)
      let finalData = { ...formData };
      
      if (formData.documentImage || formData.selfieImage) {
        setUploading(true);
        setProgress(10);
        
        const formDataToSend = new FormData();
        
        // Add text fields
        Object.keys(formData).forEach(key => {
          if (key !== 'documentImage' && key !== 'selfieImage') {
            formDataToSend.append(key, formData[key]);
          }
        });
        
        // Add files
        if (formData.documentImage) {
          formDataToSend.append('documentImage', formData.documentImage);
        }
        if (formData.selfieImage) {
          formDataToSend.append('selfieImage', formData.selfieImage);
        }

        setProgress(30);
        
        const uploadResponse = await fetch(`/api/v1/user-verification/${verificationId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formDataToSend
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
          body: JSON.stringify(formData)
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

        console.log('Verification updated:', verification);
      } else {
        throw new Error(result.message || 'Update failed');
      }

    } catch (error) {
      setLoading(false);
      setUploading(false);
      setProcessing(false);
      setProgress(0);

      const errorMessage = error.message || 'Verification update failed';

      toast.error(`❌ ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      console.error('Update failed:', error);
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateVerification();
  };

  return (
    <div className="verification-update-example">
      <h3>Update Verification</h3>
      
      {/* Progress Bar */}
      {(loading || uploading || processing) && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">
            {uploading && '📤 Uploading files...'}
            {processing && '🤖 Processing with AI (OCR + Image Comparison)...'}
            {loading && !uploading && !processing && '⏳ Updating verification...'}
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
            disabled={loading || uploading || processing}
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
            disabled={loading || uploading || processing}
            placeholder="Enter document number"
          />
        </div>

        <div className="form-group">
          <label>Address Line</label>
          <input
            type="text"
            value={formData.addressLine}
            onChange={(e) => setFormData(prev => ({ ...prev, addressLine: e.target.value }))}
            disabled={loading || uploading || processing}
            placeholder="Enter address"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              disabled={loading || uploading || processing}
              placeholder="Enter city"
            />
          </div>
          <div className="form-group">
            <label>District</label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
              disabled={loading || uploading || processing}
              placeholder="Enter district"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            disabled={loading || uploading || processing}
            placeholder="Enter country"
          />
        </div>

        <div className="form-group">
          <label>Document Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'documentImage')}
            disabled={loading || uploading || processing}
          />
          <small>Upload a clear image of your document</small>
        </div>

        <div className="form-group">
          <label>Selfie Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'selfieImage')}
            disabled={loading || uploading || processing}
          />
          <small>Upload a clear selfie for comparison</small>
        </div>

        <button 
          type="submit" 
          disabled={loading || uploading || processing}
          className={(loading || uploading || processing) ? 'loading' : ''}
        >
          {(loading || uploading || processing) ? 'Processing...' : 'Update Verification'}
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

      {/* Info Box */}
      <div className="info-box">
        <h4>ℹ️ How it works:</h4>
        <ul>
          <li>📄 <strong>OCR Processing:</strong> Extracts text from document images</li>
          <li>🤖 <strong>AI Comparison:</strong> Compares document and selfie for similarity</li>
          <li>✅ <strong>Auto-Verification:</strong> If images match (score > 0.8), status becomes "verified"</li>
          <li>⏳ <strong>Manual Review:</strong> If images don't match, status remains "pending"</li>
        </ul>
      </div>
    </div>
  );
};

export default VerificationUpdateExample; 