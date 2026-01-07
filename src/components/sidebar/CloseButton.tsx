import {styled} from "@mui/material/styles";
import {IconButton} from "@mui/material";

interface HeaderButtonProps {
    index?: number;
}

export const HeaderButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'index'
})<HeaderButtonProps>(({theme, index = 0}) => ({
    color: theme.palette.text.secondary,
    position: 'absolute',
    right: 12 + (index * 50),
    top: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.16)',
    },
}));