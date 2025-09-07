import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import FileUpload from '../shared/FileUpload';
import DocumentList from '../shared/DocumentList';
import './AdminDashboard.css';

const client = generateClient<Schema>();

interface AdminDashboardProps {
  adminUser: any;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState('templates');
  const [assetTemplates, setAssetTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Template upload state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    templateName: '',
    templateType: 'FORM_TEMPLATE' as const,
    description: '',
    version: '1.0'
  });

  const refreshAssets = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const fetchAssetTemplates = async () => {
    setLoading(true);
    try {
      const result = await client.models.AssetTemplate.list({
        filter: { isActive: { eq: true } }
      });
      
      // Sort by creation date (newest first)
      const sortedTemplates = result.data.sort((a, b) => 
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      );
      
      setAssetTemplates(sortedTemplates);
    } catch (error) {
      console.error('Error fetching asset templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetTemplates();
  }, [refreshTrigger]);

  const handleTemplateUpload = async (document: any) => {
    try {
      // Create asset template record
      const templateData = {
        templateName: newTemplate.templateName,
        templateType: newTemplate.templateType,
        fileKey: document.fileKey,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        description: newTemplate.description,
        version: newTemplate.version,
        metadata: JSON.stringify({
          uploadedBy: adminUser.displayName,
          category: newTemplate.templateType,
          tags: []
        }),
        createdBy: adminUser.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };

      await client.models.AssetTemplate.create(templateData);
      
      // Reset form and refresh
      setNewTemplate({
        templateName: '',
        templateType: 'FORM_TEMPLATE',
        description: '',
        version: '1.0'
      });
      setShowUploadForm(false);
      refreshAssets();
      
      alert('Template uploaded successfully!');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template record. Please try again.');
    }
  };

  const deleteTemplate = async (template: any) => {
    if (!window.confirm(`Are you sure you want to delete "${template.templateName}"?`)) {
      return;
    }

    try {
      await client.models.AssetTemplate.update({
        id: template.id,
        isActive: false,
        updatedAt: new Date().toISOString()
      });
      
      refreshAssets();
      alert('Template deleted successfully!');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template. Please try again.');
    }
  };

  const formatTemplateType = (type: string): string => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTemplateIcon = (type: string): string => {
    switch (type) {
      case 'FORM_TEMPLATE': return '📋';
      case 'DOCUMENT_TEMPLATE': return '📄';
      case 'COMPLIANCE_TEMPLATE': return '⚖️';
      case 'EMAIL_TEMPLATE': return '📧';
      default: return '📁';
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <h1>🔐 Admin Portal</h1>
            <p>Asset Management System</p>
          </div>
          <div className="admin-user-info">
            <span>Welcome, {adminUser.displayName}</span>
            <button className="admin-logout-button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="admin-dashboard-tabs">
        <button 
          className={activeTab === 'templates' ? 'active' : ''} 
          onClick={() => setActiveTab('templates')}
        >
          📄 Asset Templates ({assetTemplates.length})
        </button>
        <button 
          className={activeTab === 'system' ? 'active' : ''} 
          onClick={() => setActiveTab('system')}
        >
          ⚙️ System Info
        </button>
      </nav>

      <div className="admin-dashboard-content">
        {activeTab === 'templates' && (
          <div>
            <div className="admin-content-header">
              <h2>Asset Template Management</h2>
              <button 
                className="admin-add-button"
                onClick={() => setShowUploadForm(!showUploadForm)}
              >
                {showUploadForm ? 'Cancel' : '+ Add Template'}
              </button>
            </div>

            {showUploadForm && (
              <div className="admin-upload-section">
                <h3>Upload New Template</h3>
                <div className="template-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Template Name *</label>
                      <input
                        type="text"
                        value={newTemplate.templateName}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          templateName: e.target.value
                        })}
                        placeholder="Enter template name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Template Type *</label>
                      <select
                        value={newTemplate.templateType}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          templateType: e.target.value as any
                        })}
                        required
                      >
                        <option value="FORM_TEMPLATE">Form Template</option>
                        <option value="DOCUMENT_TEMPLATE">Document Template</option>
                        <option value="COMPLIANCE_TEMPLATE">Compliance Template</option>
                        <option value="EMAIL_TEMPLATE">Email Template</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={newTemplate.description}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          description: e.target.value
                        })}
                        placeholder="Describe the template's purpose and usage"
                        rows={3}
                      />
                    </div>
                    <div className="form-group">
                      <label>Version</label>
                      <input
                        type="text"
                        value={newTemplate.version}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          version: e.target.value
                        })}
                        placeholder="1.0"
                      />
                    </div>
                  </div>
                  
                  <div className="file-upload-section">
                    <FileUpload
                      documentType="OTHER"
                      onUploadComplete={handleTemplateUpload}
                      maxFileSize={25 * 1024 * 1024} // 25MB for templates
                      acceptedFileTypes={['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.html', '.json', '.xml']}
                      isMultiple={false}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="admin-templates-list">
              {loading ? (
                <div className="admin-loading">Loading templates...</div>
              ) : assetTemplates.length === 0 ? (
                <div className="admin-no-data">
                  <p>No asset templates found.</p>
                  <p>Upload your first template to get started.</p>
                </div>
              ) : (
                <div className="admin-templates-grid">
                  {assetTemplates.map(template => (
                    <div key={template.id} className="admin-template-card">
                      <div className="template-header">
                        <div className="template-icon">
                          {getTemplateIcon(template.templateType)}
                        </div>
                        <div className="template-info">
                          <h4>{template.templateName}</h4>
                          <span className="template-type">
                            {formatTemplateType(template.templateType)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="template-details">
                        <p className="template-description">
                          {template.description || 'No description provided'}
                        </p>
                        <div className="template-meta">
                          <span>Version: {template.version}</span>
                          <span>Size: {(template.fileSize / 1024).toFixed(1)} KB</span>
                        </div>
                        <div className="template-dates">
                          <span>Created: {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                      </div>
                      
                      <div className="template-actions">
                        <button 
                          className="template-download-button"
                          onClick={() => {
                            // Use DocumentList component's download functionality
                            const downloadEvent = new CustomEvent('downloadTemplate', {
                              detail: { fileKey: template.fileKey, fileName: template.fileName }
                            });
                            window.dispatchEvent(downloadEvent);
                          }}
                        >
                          📥 Download
                        </button>
                        <button 
                          className="template-delete-button"
                          onClick={() => deleteTemplate(template)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div>
            <h2>System Information</h2>
            <div className="system-info-grid">
              <div className="system-info-card">
                <h3>🔒 Security</h3>
                <ul>
                  <li>Admin access is logged and monitored</li>
                  <li>No access to user personal data</li>
                  <li>Asset management permissions only</li>
                  <li>All uploads are scanned for security</li>
                </ul>
              </div>
              
              <div className="system-info-card">
                <h3>📁 Storage</h3>
                <ul>
                  <li>Templates stored in AWS S3</li>
                  <li>Maximum file size: 25MB</li>
                  <li>Supported formats: PDF, DOC, XLSX, HTML, JSON, XML</li>
                  <li>Version control supported</li>
                </ul>
              </div>
              
              <div className="system-info-card">
                <h3>🔧 Functions</h3>
                <ul>
                  <li>Upload form templates</li>
                  <li>Manage document templates</li>
                  <li>Configure email templates</li>
                  <li>Version management</li>
                </ul>
              </div>

              <div className="system-info-card">
                <h3>⚠️ Important Notes</h3>
                <ul>
                  <li>Templates are available to all users</li>
                  <li>Deleted templates are archived, not permanently removed</li>
                  <li>Changes take effect immediately</li>
                  <li>Contact IT for advanced configuration</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;