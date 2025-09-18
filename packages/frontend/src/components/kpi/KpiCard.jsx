import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const KpiCard = ({ value, label }) => {
  return (
    <Card sx={{ textAlign: 'center', height: '100%' }}>
      <CardContent>
        <Typography 
          variant="h4" 
          component="div" 
          color="primary" 
          sx={{ fontWeight: 'bold' }}
        >
          {value}
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mt: 1 }}
        >
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default KpiCard;