import {styled} from "@mui/material/styles";
import {Box} from "@mui/material";

export const SidebarContent = styled(Box)(({theme}) => ({
    flex: 1,
    overflow: 'auto',
    paddingTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: 0,
    borderLeft: `1px solid ${theme.palette.divider}`,
    '&::-webkit-scrollbar': {
        width: 8,
    },
    '&::-webkit-scrollbar-track': {
        background: theme.palette.grey[100],
    },
    '&::-webkit-scrollbar-thumb': {
        background: theme.palette.grey[400],
        borderRadius: 4,
        '&:hover': {
            background: theme.palette.grey[500],
        },
    },
}));