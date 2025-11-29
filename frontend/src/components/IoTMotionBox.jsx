import React, { useState, useEffect } from 'react';

const IoTMotionBox = ({ deviceId = "motion-sensor-001", initialStatus = "inactive" }) => {
  const [motionStatus, setMotionStatus] = useState(initialStatus);
  const [lastDetection, setLastDetection] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  // Simulate motion detection updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly toggle motion status for demonstration
      if (Math.random() > 0.7) {
        const newStatus = motionStatus === "active" ? "inactive" : "active";
        setMotionStatus(newStatus);
        
        if (newStatus === "active") {
          setLastDetection(new Date().toLocaleTimeString());
          console.log(`Motion detected by ${deviceId} at ${new Date().toLocaleTimeString()}`);
        }
      }

      // Random connection status changes
      if (Math.random() > 0.9) {
        setIsConnected(prev => !prev);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [motionStatus, deviceId]);

  const statusColors = {
    active: '#dc3545',    // Red for active motion
    inactive: '#28a745',  // Green for inactive
    error: '#ffc107'      // Yellow for error
  };

  const connectionStatus = isConnected ? 'Connected' : 'Disconnected';
  const connectionColor = isConnected ? '#28a745' : '#dc3545';

  return (
    <div style={{
      padding: '15px',
      border: `2px solid ${statusColors[motionStatus]}`,
      borderRadius: '8px',
      margin: '10px',
      backgroundColor: '#f8f9fa',
      minWidth: '250px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h4 style={{ margin: 0, color: '#333' }}>Motion Sensor</h4>
        <span style={{
          padding: '4px 8px',
          backgroundColor: statusColors[motionStatus],
          color: 'white',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {motionStatus.toUpperCase()}
        </span>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Device ID:</strong> {deviceId}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> 
        <span style={{ color: connectionColor, marginLeft: '5px' }}>
          {connectionStatus}
        </span>
      </div>

      {lastDetection && (
        <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
          <strong>Last Detection:</strong> {lastDetection}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '15px'
      }}>
        <button style={{
          padding: '6px 12px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer'
        }}>
          Refresh
        </button>
        
        <button style={{
          padding: '6px 12px',
          backgroundColor: isConnected ? '#dc3545' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer'
        }}>
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* Visual indicator */}
      <div style={{
        height: '4px',
        backgroundColor: statusColors[motionStatus],
        borderRadius: '2px',
        marginTop: '10px',
        transition: 'all 0.3s ease'
      }} />
    </div>
  );
};

export default IoTMotionBox;