import {Box, Typography} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";

export const CircularProgressWithLabel = ({value, size = 120}: { value: number; size?: number }) => {
    const getColor = (score: number) => {
        if (score >= 90) return '#28a745';
        if (score >= 70) return '#ffc107';
        return '#dc3545';
    };

    return (
        <Box flexDirection="column" display="flex" alignItems="center" justifyContent="center">
            <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                <CircularProgress
                    variant="determinate"
                    value={value}
                    size={size}
                    thickness={4}
                    sx={{
                        color: getColor(value),
                        '& .MuiCircularProgress-circle': {
                            strokeLinecap: 'round',
                        },
                    }}
                />
                <Box
                    position="absolute"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexDirection="column"
                >
                    <Typography variant="h3" component="div" fontWeight="bold" color={getColor(value)}
                                sx={{
                                    fontSize: '1.5rem',
                                }}>
                        {Math.round(value)}%
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};