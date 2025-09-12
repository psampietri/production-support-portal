import React from 'react';
import '../../styles/kpi/KpiCard.css'; // Corrected path

const KpiCard = ({ value, label }) => {
  return (
    <div className="kpi-card">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
};

export default KpiCard;