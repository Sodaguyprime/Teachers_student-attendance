import React, { useState } from 'react';
import { QrCode } from 'lucide-react';
import { api } from '../services/api';
import { generateToken } from '../utils/helpers';

const QRCodeSection = ({ serverIP, port }) => {
  const [qrActive, setQrActive] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const startQRCode = () => {
    if (!serverIP) {
      alert('Server IP not available yet');
      return;
    }

    setQrActive(true);
    
    const generateQR = () => {
      const token = generateToken();
      api.setToken(token).catch(err => console.error('Error setting token:', err));
      const url = `http://${serverIP}:${port}/student-login.html?token=${token}`;
      setQrCodeUrl(url);
    };

    generateQR();
    const interval = setInterval(generateQR, 20000);
    
    return () => clearInterval(interval);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <QrCode className="w-6 h-6" />
        Attendance QR Code
      </h2>
      
      <button
        onClick={startQRCode}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 mb-4"
      >
        {qrActive ? 'QR Code Active' : 'Start QR Code'}
      </button>

      {qrActive && (
        <div className="border-2 border-gray-200 rounded-lg p-6 text-center">
          <div className="bg-white p-4 inline-block rounded-lg shadow-md">
            <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded">
              <div className="text-center">
                <QrCode className="w-32 h-32 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 font-semibold">QR Code Active</p>
                <p className="text-xs text-gray-500 mt-2 break-all px-2">{qrCodeUrl}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-4 font-medium">
            Students can scan this code to register attendance
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Code rotates every 20 seconds for security
          </p>
          {serverIP && (
            <p className="text-xs text-gray-600 mt-2">
              Server: {serverIP}:{port}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default QRCodeSection;