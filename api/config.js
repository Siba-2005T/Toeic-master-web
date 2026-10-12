// Vercel Serverless Function: Lấy cấu hình từ Environment Variables
export default function handler(req, res) {
  const mediaBaseUrl = process.env.MEDIA_BASE_URL || '';
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  
  res.status(200).json({
    mediaBaseUrl: mediaBaseUrl
  });
}
