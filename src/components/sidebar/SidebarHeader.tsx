import {styled} from "@mui/material/styles";
import {Box} from "@mui/material";

export const SidebarHeader = styled(Box)(({theme}) => ({
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    color: theme.palette.common.black,
    borderBottom: `1px solid ${theme.palette.divider}`,
}));
