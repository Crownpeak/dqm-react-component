import {styled} from "@mui/material/styles";
import {Box} from "@mui/material";

export const SidebarHeader = styled(Box)(({theme}) => ({
    background: '#1f2937',
    color: 'white',
    padding: theme.spacing(3),
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: 40,
}));
