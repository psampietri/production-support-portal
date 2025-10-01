import React from 'react';
import {
    Modal, Box, Typography, TextField, Grid, Button, DialogActions, List, ListItem, ListItemText, CircularProgress
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';

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

const TicketModal = ({
    open, onClose, task, isManualEntry, setIsManualEntry,
    manualTicketInfo, setManualTicketInfo, manualTicketCreatedDate,
    setManualTicketCreatedDate, manualTicketClosedDate,
    setManualTicketClosedDate, onSave, onRemove,
    liveTicketDetails, ticketDetailsLoading
}) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">Ticket Information</Typography>
                {isManualEntry ? (
                    <Box component="form" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
                        <TextField
                            fullWidth
                            label="Ticket Key"
                            margin="normal"
                            value={manualTicketInfo.key}
                            onChange={(e) => setManualTicketInfo(prev => ({ ...prev, key: e.target.value }))}
                        />
                        {task?.task_type !== 'automated_access_request' && (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={6}>
                                    <DateTimePicker
                                        label="Ticket Created Date"
                                        value={manualTicketCreatedDate}
                                        onChange={setManualTicketCreatedDate}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <DateTimePicker
                                        label="Ticket Closed Date"
                                        value={manualTicketClosedDate}
                                        onChange={setManualTicketClosedDate}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </Grid>
                            </Grid>
                        )}
                        <DialogActions>
                            <Button onClick={onClose}>Cancel</Button>
                            <Button onClick={onRemove} color="error">Remove</Button>
                            <Button type="submit" variant="contained">Save</Button>
                        </DialogActions>
                    </Box>
                ) : (
                    <Box>
                        {ticketDetailsLoading ? <CircularProgress /> : (
                            liveTicketDetails ? (
                                <List>
                                    <ListItem><ListItemText primary="Ticket Key" secondary={liveTicketDetails.issueKey} /></ListItem>
                                    <ListItem><ListItemText primary="Status" secondary={liveTicketDetails?.currentStatus?.status || 'N/A'} /></ListItem>
                                    <ListItem><ListItemText primary="Created" secondary={liveTicketDetails?.createdDate?.iso8601 ? new Date(liveTicketDetails.createdDate.iso8601).toLocaleString() : 'N/A'} /></ListItem>
                                    <ListItem><ListItemText primary="Resolved" secondary={liveTicketDetails?.currentStatus?.statusCategory === 'DONE' && liveTicketDetails?.currentStatus?.statusDate?.iso8601 ? new Date(liveTicketDetails.currentStatus.statusDate.iso8601).toLocaleString() : 'Not resolved'} /></ListItem>
                                </List>
                            ) : <Typography>No ticket information found.</Typography>
                        )}
                        <Button onClick={() => setIsManualEntry(true)} sx={{ mt: 2 }}>Switch to Manual Entry</Button>
                    </Box>
                )}
            </Box>
        </Modal>
    );
};

export default TicketModal;