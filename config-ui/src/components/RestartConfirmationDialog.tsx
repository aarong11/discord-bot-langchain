import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Typography,
  Box
} from '@mui/material';
import { RestartAlt, Warning } from '@mui/icons-material';

interface RestartConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const RestartConfirmationDialog: React.FC<RestartConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="restart-dialog-title"
      aria-describedby="restart-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle 
        id="restart-dialog-title"
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <Warning color="warning" />
        Configuration Saved Successfully
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="restart-dialog-description">
          Your configuration has been saved. Would you like to restart the bot to apply the changes immediately?
        </DialogContentText>
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> Restarting the bot will briefly disconnect it from Discord while the new configuration is applied.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onCancel} variant="outlined">
          No, Keep Running
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          startIcon={<RestartAlt />}
          color="warning"
        >
          Yes, Restart Bot
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RestartConfirmationDialog;