// client/src/components/data/ExportStatus.tsx
import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    LinearProgress,
    Tooltip,
} from '@material-ui/core';
import {
    CheckCircleOutline,
    ErrorOutline,
    CloudDownload as DownloadIcon,
    Cancel as CancelIcon,
    HourglassEmpty as ProcessingIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import theme from '../../theme.ts';

const useStyles = makeStyles(theme => ({
    paper: {
        padding: theme.spacing(3),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[3],
    },
    icon: {
        fontSize: 60,
        marginBottom: theme.spacing(2),
    },
    successIcon: {
        color: theme.palette.success.main,
    },
    errorIcon: {
        color: theme.palette.error.main,
    },
    processingIcon: {
        color: theme.palette.warning.main,
    },
    progress: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
    statusText: {
        marginBottom: theme.spacing(1),
        color: theme.palette.text.primary,
    },
    buttonGroup: {
        marginTop: theme.spacing(2),
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%',
    }
}));

interface ExportJob {
    id: string;
    status: 'processing' | 'completed' | 'failed' | 'cancelled';
    progress?: number;
    downloadUrl?: string;
    errorMessage?: string;
    format: string;
    startDate: string;
    endDate: string;
    requestedAt: string;
    completedAt?: string;
}

interface ExportStatusProps {
    exportJob: ExportJob;
    onDownload?: (job: ExportJob) => void;
    onCancel?: (jobId: string) => void;
}

const ExportStatus: React.FC<ExportStatusProps> = ({ exportJob, onDownload, onCancel }) => {
    const classes = useStyles();

    const renderIcon = () => {
        switch (exportJob.status) {
            case 'completed':
                return <CheckCircleOutline className={`${classes.icon} ${classes.successIcon}`} />;
            case 'failed':
                return <ErrorOutline className={`${classes.icon} ${classes.errorIcon}`} />;
            case 'processing':
                return <ProcessingIcon className={`${classes.icon} ${classes.processingIcon}`} />;
            case 'cancelled':
                return <CancelIcon className={`${classes.icon} ${classes.errorIcon}`} />;
            default:
                return null;
        }
    };

    return (
        <Paper className={classes.paper}>
            {renderIcon()}
            <Typography variant="h5" className={classes.statusText}>
                Export Status: {exportJob.status.toUpperCase().replace('_', ' ')}
            </Typography>

            {exportJob.status === 'processing' && (
                <Box width="100%" mt={2}>
                    <LinearProgress
                        className={classes.progress}
                        variant="determinate"
                        value={exportJob.progress || 0}
                    />
                    <Typography variant="body2" color="textSecondary" align="center">
                        {exportJob.progress !== undefined ? `${exportJob.progress.toFixed(0)}% complete` : 'Processing...'}
                    </Typography>
                </Box>
            )}

            {exportJob.status === 'failed' && exportJob.errorMessage && (
                <Typography variant="body2" color="error" align="center" style={{ marginTop: 8 }}>
                    Error: {exportJob.errorMessage}
                </Typography>
            )}

            <Box width="100%" className={classes.buttonGroup}>
                {onCancel && exportJob.status === 'processing' && (
                    <Button
                        variant="outlined"
                        color="secondary"
                        style={{ marginRight: theme.spacing(1) }}
                        onClick={() => onCancel(exportJob.id)}
                        startIcon={<CancelIcon />}
                    >
                        Cancel Export
                    </Button>
                )}

                {exportJob.downloadUrl && onDownload && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<DownloadIcon />}
                        onClick={() => onDownload(exportJob)}
                    >
                        Download Export
                    </Button>
                )}
            </Box>
        </Paper>
    );
};

export default ExportStatus;
