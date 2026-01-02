import { styled } from '@mui/material/styles';
import { Card } from '@mui/material';

export const AISummaryCard = styled(Card)(({ theme }) => ({
  borderRadius: 10,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  background: 'white',
}));

