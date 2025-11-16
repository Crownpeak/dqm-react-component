// Updated styled components for modern card-based design
import {styled} from "@mui/material/styles";
import {Drawer} from "@mui/material";

export const StyledDrawer = styled(Drawer)(() => ({
    '& .MuiModal-backdrop': {
        display: 'block'
    },
    '& .MuiDrawer-paper': {
        width: '730px',
        height: '100vh',
        borderRadius: '0',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        background: '#f8f9fa',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
    },
}));