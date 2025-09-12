import React from 'react';
import {
    Modal, Box, Typography, Paper
} from '@mui/material';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

const DryRunModal = ({ open, onClose, dryRunResult }) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">Dry Run Result</Typography>
                {dryRunResult && (
                    <>
                        <Typography sx={{ mt: 2 }}>{dryRunResult.message}</Typography>
                        <Paper variant="outlined" sx={{ p: 2, mt: 1, maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            <pre>{JSON.stringify(dryRunResult.payload, null, 2)}</pre>
                        </Paper>
                    </>
                )}
            </Box>
        </Modal>
    );
};

export default DryRunModal;