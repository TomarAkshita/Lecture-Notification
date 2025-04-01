import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [lectures, setLectures] = useState([]);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch lectures from backend
  useEffect(() => {
    axios.get('http://localhost:5000/api/lectures')
      .then(response => {
        setLectures(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching lectures:', error);
        setError('Failed to fetch lectures');
        setLoading(false);
      });
  }, []);

  // Send WhatsApp Notification
  const sendNotification = () => {
    if (!phone || !message) {
      alert('Please enter both phone number and message');
      return;
    }

    axios.post('http://localhost:5000/api/send-notification', { phone, message })
      .then(response => alert('✅ Notification sent!'))
      .catch(error => {
        console.error('Error sending notification:', error);
        alert('❌ Failed to send notification');
      });
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>📚 Lecture Schedule</h1>

      {loading ? <p>Loading lectures...</p> : error ? <p style={{ color: 'red' }}>{error}</p> :
        lectures.length > 0 ? (
          <ul style={{ padding: 0, listStyleType: 'none' }}>
            {lectures.map((lecture) => (
              <li key={lecture.id} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                <strong>{lecture.title}</strong> - {new Date(lecture.date).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : <p>No lectures available</p>
      }

      <h2>📩 Send Notification</h2>
      <input
        type="text"
        placeholder="📞 Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ width: '100%', padding: '8px', margin: '5px 0' }}
      />
      <input
        type="text"
        placeholder="✉️ Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ width: '100%', padding: '8px', margin: '5px 0' }}
      />
      <button onClick={sendNotification} style={{ padding: '10px', width: '100%', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}>
        🚀 Send
      </button>
    </div>
  );
}

export default App;