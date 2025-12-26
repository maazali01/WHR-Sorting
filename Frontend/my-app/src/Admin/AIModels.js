import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Skeleton from '../Loader/loader';
import { FiCheckCircle, FiAlertCircle, FiBookOpen, FiCpu } from 'react-icons/fi';
import './AIModels.css';
import API_URL from '../config/api';

const API = `${API_URL}/admin/ai-models`;

const AIModels = () => {
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [objectName, setObjectName] = useState('');
  const [datasetFile, setDatasetFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);
  const [untrainedProducts, setUntrainedProducts] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [showGuidelines, setShowGuidelines] = useState(false);

  const token = Cookies.get('token');
  const authHeaders = useMemo(() => ({ 
    headers: { Authorization: `Bearer ${token}` } 
  }), [token]);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/list`, authHeaders);
      setModels(res.data.models || []);
      setActiveModel(res.data.active);
    } catch (err) {
      console.error('Failed to fetch models', err);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchTrainingStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/training-status`, authHeaders);
      setTrainingStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch training status', err);
    }
  }, [authHeaders]);

  const fetchUntrainedProducts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/untrained-products`, authHeaders);
      setUntrainedProducts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch untrained products', err);
    }
  }, [authHeaders]);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/metrics`, authHeaders);
      setMetrics(res.data || {});
    } catch (err) {
      console.error('Failed to fetch metrics', err);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchModels();
    fetchTrainingStatus();
    fetchUntrainedProducts();
    fetchMetrics();
    const interval = setInterval(() => {
      fetchTrainingStatus();
      fetchMetrics();
    }, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [fetchModels, fetchTrainingStatus, fetchUntrainedProducts, fetchMetrics]);

  const handleUploadDataset = async (e) => {
    e.preventDefault();
    if (!objectName.trim() || !datasetFile) {
      alert('Object name and dataset file required');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('dataset', datasetFile);
      formData.append('objectName', objectName.trim());
      await axios.post(`${API}/upload-dataset`, formData, {
        ...authHeaders,
        headers: { ...authHeaders.headers, 'Content-Type': 'multipart/form-data' }
      });
      alert('Dataset uploaded successfully');
      setDatasetFile(null);
    } catch (err) {
      console.error('Upload failed', err);
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleTrain = async () => {
    if (!objectName.trim()) {
      alert('Object name required');
      return;
    }
    setTraining(true);
    try {
      await axios.post(`${API}/train`, { objectName: objectName.trim() }, authHeaders);
      alert('Training started');
      fetchTrainingStatus();
    } catch (err) {
      console.error('Training failed', err);
      alert(err.response?.data?.message || 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  const handleSetActive = async (name) => {
    try {
      await axios.post(`${API}/set-active`, { name }, authHeaders);
      setActiveModel(name);
      alert(`Active model set to ${name}`);
    } catch (err) {
      console.error('Set active failed', err);
      alert('Failed to set active model');
    }
  };

  if (loading) {
    return <div style={{ padding: 16 }}><Skeleton type="table" count={4} /></div>;
  }

  return (
    <div className="ai-models-page">
      {/* Header */}
      <header className="ai-header">
        <div className="header-content">
          <div className="header-icon">
            <FiCpu />
          </div>
          <div className="header-text">
            <h1>AI Model Management</h1>
            <p>Train, manage, and deploy AI models for object recognition</p>
          </div>
          <button 
            className="btn-guidelines"
            onClick={() => setShowGuidelines(!showGuidelines)}
          >
            <FiBookOpen />
            {showGuidelines ? 'Hide Guidelines' : 'Show Guidelines'}
          </button>
        </div>
      </header>

      {/* Instructions Section */}
      {showGuidelines && (
        <div className="instructions-panel" key="guidelines">
          <div className="instructions-header">
            <FiAlertCircle className="instructions-icon" />
            <h2>Dataset Preparation Guidelines</h2>
          </div>
          <div className="instructions-content">
            <div className="instruction-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Create Your Dataset</h4>
                <p>Prepare a dataset with <strong>100 images total</strong>:</p>
                <ul>
                  <li><strong>40-50 images</strong> of the Webots simulation object</li>
                  <li><strong>50-60 images</strong> of real-life images of the same object</li>
                </ul>
              </div>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Organize Your Files</h4>
                <p>Create a folder named <strong>exactly as your product/object name</strong> and place all 100 images inside this folder.</p>
                <p className="example-text">Example: If your product is "Bottle", create a folder named "Bottle" containing all images.</p>
              </div>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Create ZIP File</h4>
                <p>Compress the folder into a <strong>.zip file</strong> and upload it using the form below.</p>
              </div>
            </div>
            
            <div className="instruction-highlight">
              <div className="highlight-item">
                <FiCheckCircle className="highlight-icon success" />
                <div>
                  <strong>Data Augmentation</strong>
                  <p>Your 100 images will be automatically augmented to generate approximately <strong>1,200 images</strong> before training begins. This improves model accuracy and robustness.</p>
                </div>
              </div>
              
              <div className="highlight-item">
                <FiCheckCircle className="highlight-icon info" />
                <div>
                  <strong>Incremental Training</strong>
                  <p>Previously trained products will <strong>NOT be retrained</strong>. The model trains only on newly added products to preserve existing accuracy and prevent weight loss for already trained objects.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show inputs only when NOT training */}
      {!trainingStatus?.running && (
        <div className="ai-grid">
          {/* Select Product Card */}
          <div className="ai-card">
            <div className="card-icon select">
              <FiCheckCircle />
            </div>
            <h3>Select Product</h3>
            <select 
              className="product-select"
              value={objectName} 
              onChange={(e) => setObjectName(e.target.value)}
            >
              <option value="">-- Choose a product --</option>
              {untrainedProducts.map(p => (
                <option key={p._id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Upload Dataset Card */}
          <div className="ai-card">
            <div className="card-icon upload">
              <FiAlertCircle />
            </div>
            <h3>Upload Dataset</h3>
            <form onSubmit={handleUploadDataset} className="card-form">
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setDatasetFile(e.target.files[0])}
                className="file-input"
                id="dataset-upload"
              />
              <label htmlFor="dataset-upload" className="file-label">
                {datasetFile ? datasetFile.name : 'Choose ZIP file...'}
              </label>
              <button 
                type="submit" 
                disabled={uploading || !objectName || !datasetFile} 
                className="btn-action upload-btn"
              >
                {uploading ? 'Uploading...' : 'Upload Dataset'}
              </button>
            </form>
          </div>

          {/* Start Training Card */}
          <div className="ai-card">
            <div className="card-icon train">
              <FiCheckCircle />
            </div>
            <h3>Start Training</h3>
            <div className="card-form">
              <div className="training-info">
                <p className="info-text">
                  <FiAlertCircle style={{ marginRight: 6 }} />
                  Training uses automatic early stopping to prevent overfitting. 
                  The model will stop when validation loss stops improving.
                </p>
              </div>
              <button 
                onClick={handleTrain} 
                disabled={training || trainingStatus?.running || !objectName} 
                className="btn-action train-btn"
              >
                {training ? 'Starting...' : 'Start Training'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Section - Show when training */}
      {trainingStatus?.running && (
        <div className="processing-section">
          <div className="processing-header">
            <div className="processing-icon">
              <div className="spinner-large"></div>
            </div>
            <h2>Training in Progress</h2>
            <p className="processing-subtitle">Model: <strong>{trainingStatus.objectName}</strong></p>
          </div>
          
          {metrics[trainingStatus.objectName] && (
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-label">Epoch</span>
                <span className="metric-value">
                  {metrics[trainingStatus.objectName].currentEpoch || 0} / {metrics[trainingStatus.objectName].totalEpochs || 0}
                </span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Loss</span>
                <span className="metric-value">{metrics[trainingStatus.objectName].loss?.toFixed(4) || 'N/A'}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Accuracy</span>
                <span className="metric-value">{((metrics[trainingStatus.objectName].accuracy || 0) * 100).toFixed(2)}%</span>
              </div>
            </div>
          )}
          
          <div className="log-container">
            <h4>Training Logs</h4>
            <div className="log-box">
              {(trainingStatus.log || []).slice(-10).map((line, i) => <div key={i}>{line}</div>)}
            </div>
          </div>
        </div>
      )}

      {/* Trained Models */}
      <div className="models-section">
        <h3>Trained Models</h3>
        {models.length === 0 ? (
          <p className="empty-state">No models trained yet</p>
        ) : (
          <div className="models-grid">
            {models.map((m) => (
              <div key={m} className="model-card">
                <div className="model-header">
                  <span className="model-name">{m}</span>
                  {metrics[m.replace(/\.(pt|onnx)$/, '')]?.status === 'completed' ? (
                    <span className="badge success"><FiCheckCircle /> Trained</span>
                  ) : metrics[m.replace(/\.(pt|onnx)$/, '')]?.status === 'failed' ? (
                    <span className="badge error"><FiAlertCircle /> Failed</span>
                  ) : (
                    <span className="badge">Unknown</span>
                  )}
                </div>
                <div className="model-info">
                  {metrics[m.replace(/\.(pt|onnx)$/, '')]?.accuracy 
                    ? `Accuracy: ${(metrics[m.replace(/\.(pt|onnx)$/, '')].accuracy * 100).toFixed(1)}%`
                    : 'N/A'}
                </div>
                <div className="model-actions">
                  {m === activeModel ? (
                    <span className="badge active">Active</span>
                  ) : (
                    <button className="btn-small" onClick={() => handleSetActive(m)}>Set Active</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIModels;
