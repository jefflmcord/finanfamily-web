import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617',
          borderRadius: '110px',
          border: '16px solid #10b981',
          color: '#10b981',
          fontSize: 240,
          fontWeight: 900,
          fontFamily: 'sans-serif',
        }}
      >
        FF
      </div>
    ),
    { ...size }
  );
}