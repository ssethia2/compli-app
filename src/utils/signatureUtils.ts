import { getUrl } from 'aws-amplify/storage';

export interface SignatureData {
  imageUrl: string;
  imageData: string; // Base64 encoded image data
  width: number;
  height: number;
  format: 'png' | 'jpg' | 'svg';
}

/**
 * Get signature data for PDF integration
 * @param signatureKey - S3 key of the signature
 * @returns Promise<SignatureData> - Signature data ready for PDF insertion
 */
export const getSignatureForPDF = async (signatureKey: string): Promise<SignatureData | null> => {
  if (!signatureKey) {
    return null;
  }

  try {
    // Get signed URL from S3
    const urlResult = await getUrl({
      key: signatureKey,
      options: {
        expiresIn: 3600 // 1 hour
      }
    });

    const signatureUrl = urlResult.url.toString();
    
    // Fetch the image and convert to base64
    const response = await fetch(signatureUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Create an image to get dimensions
        const img = new Image();
        img.onload = () => {
          const base64Data = (reader.result as string).split(',')[1]; // Remove data:image/png;base64, prefix
          
          resolve({
            imageUrl: signatureUrl,
            imageData: base64Data,
            width: img.width,
            height: img.height,
            format: getImageFormat(blob.type)
          });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching signature for PDF:', error);
    return null;
  }
};

/**
 * Get image format from MIME type
 */
const getImageFormat = (mimeType: string): 'png' | 'jpg' | 'svg' => {
  if (mimeType.includes('svg')) return 'svg';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  return 'png'; // default to PNG
};

/**
 * Create an SVG version of signature for scalable PDF insertion
 * @param signatureKey - S3 key of the signature
 * @param width - Desired width
 * @param height - Desired height
 * @returns Promise<string> - SVG string ready for PDF
 */
export const createSignatureSVG = async (
  signatureKey: string,
  width: number = 200,
  height: number = 80
): Promise<string | null> => {
  const signatureData = await getSignatureForPDF(signatureKey);
  
  if (!signatureData) {
    return null;
  }

  // Create SVG with embedded image
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" 
         xmlns:xlink="http://www.w3.org/1999/xlink"
         width="${width}" 
         height="${height}" 
         viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="white"/>
      <image xlink:href="data:image/${signatureData.format};base64,${signatureData.imageData}" 
             width="${width}" 
             height="${height}" 
             preserveAspectRatio="xMidYMid meet"/>
      <!-- Optional signature metadata for verification -->
      <metadata>
        <signature-info>
          <timestamp>${new Date().toISOString()}</timestamp>
          <format>digital-signature</format>
        </signature-info>
      </metadata>
    </svg>
  `.trim();

  return svgContent;
};

/**
 * Prepare signature for jsPDF integration
 * @param signatureKey - S3 key of the signature  
 * @param options - PDF options
 * @returns Promise<object> - Data ready for jsPDF.addImage()
 */
export const prepareSignatureForJsPDF = async (
  signatureKey: string,
  options: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  }
) => {
  const signatureData = await getSignatureForPDF(signatureKey);
  
  if (!signatureData) {
    return null;
  }

  return {
    imageData: `data:image/${signatureData.format};base64,${signatureData.imageData}`,
    format: signatureData.format.toUpperCase(),
    x: options.x,
    y: options.y,
    width: options.width || 50, // Default width in PDF units
    height: options.height || 25, // Default height in PDF units
    originalWidth: signatureData.width,
    originalHeight: signatureData.height
  };
};

/**
 * Validate signature exists and is accessible
 * @param signatureKey - S3 key of the signature
 * @returns Promise<boolean> - Whether signature is valid and accessible
 */
export const validateSignature = async (signatureKey: string): Promise<boolean> => {
  if (!signatureKey) return false;
  
  try {
    const result = await getUrl({
      key: signatureKey,
      options: { expiresIn: 300 } // 5 minutes, just for validation
    });
    
    // Try to fetch the image
    const response = await fetch(result.url.toString());
    return response.ok;
  } catch (error) {
    console.error('Signature validation failed:', error);
    return false;
  }
};