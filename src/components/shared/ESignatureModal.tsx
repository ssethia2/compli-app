import React, { useState, useRef, useEffect } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';
import './ESignatureModal.css';

const client = generateClient<Schema>();

interface ESignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureSaved: (signatureUrl: string) => void;
}

const ESignatureModal: React.FC<ESignatureModalProps> = ({
  isOpen,
  onClose,
  onSignatureSaved
}) => {
  const { user } = useAuthenticator();
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (isOpen && mode === 'draw') {
      initializeCanvas();
    }
  }, [isOpen, mode]);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 400;
    canvas.height = 200;
    
    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });
  };

  const uploadSignature = async (file: File | Blob, fileName: string) => {
    const fileKey = `public/signatures/${user?.username}/${Date.now()}_${fileName}`;
    
    try {
      const result = await uploadData({
        key: fileKey,
        data: file,
        options: {
          contentType: file.type || 'image/png'
        }
      }).result;

      // Update user profile with signature URL
      const userProfileResult = await client.models.UserProfile.list({
        filter: { userId: { eq: user?.username || '' } }
      });

      if (userProfileResult.data.length > 0) {
        const profile = userProfileResult.data[0];
        await client.models.UserProfile.update({
          id: profile.id,
          eSignImageUrl: fileKey // Store the S3 key, we'll generate URLs when needed
        });
      }

      return fileKey;
    } catch (error) {
      console.error('Error uploading signature:', error);
      throw error;
    }
  };

  const saveDrawnSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setUploading(true);
    try {
      const blob = await canvasToBlob(canvas);
      const fileKey = await uploadSignature(blob, 'drawn_signature.png');
      onSignatureSaved(fileKey);
      onClose();
    } catch (error) {
      alert('Failed to save signature. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }
    
    setUploading(true);
    try {
      const fileKey = await uploadSignature(file, file.name);
      onSignatureSaved(fileKey);
      onClose();
    } catch (error) {
      alert('Failed to upload signature. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="esignature-modal-overlay" onClick={onClose}>
      <div className="esignature-modal" onClick={(e) => e.stopPropagation()}>
        <div className="esignature-modal-header">
          <h2>E-Signature</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="esignature-modal-content">
          <div className="mode-selector">
            <button
              className={mode === 'draw' ? 'active' : ''}
              onClick={() => setMode('draw')}
            >
              Draw Signature
            </button>
            <button
              className={mode === 'upload' ? 'active' : ''}
              onClick={() => setMode('upload')}
            >
              Upload Image
            </button>
          </div>
          
          {mode === 'draw' ? (
            <div className="draw-signature-section">
              <p>Draw your signature in the box below:</p>
              <div className="canvas-container">
                <canvas
                  ref={canvasRef}
                  className="signature-canvas"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              </div>
              <div className="canvas-controls">
                <button
                  type="button"
                  className="clear-button"
                  onClick={clearCanvas}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="save-button"
                  onClick={saveDrawnSignature}
                  disabled={uploading}
                >
                  {uploading ? 'Saving...' : 'Save Signature'}
                </button>
              </div>
            </div>
          ) : (
            <div className="upload-signature-section">
              <p>Upload an image of your signature:</p>
              <div className="file-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <p className="upload-hint">
                  Accepted: JPG, PNG, GIF • Max 2MB
                </p>
              </div>
              {uploading && (
                <div className="uploading-indicator">
                  <div className="upload-spinner"></div>
                  <p>Uploading signature...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ESignatureModal;