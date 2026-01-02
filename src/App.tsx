// Test UI for DQM Widget Development
// Provides a login form to input API Key and Website ID, then renders a landing page with HTML editor modal
import React, {useState} from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    createTheme,
    CssBaseline,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fab,
    IconButton,
    InputAdornment,
    Paper,
    Tab,
    Tabs,
    TextField,
    ThemeProvider,
    Typography
} from '@mui/material';
import {Assessment, Close, Code as CodeIcon, Lock, Security, Speed, Storage, TrendingUp, Visibility, VisibilityOff, Web,} from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import {html} from '@codemirror/lang-html';
import {oneDark} from '@codemirror/theme-one-dark';
import DQMSidebar from './DQMSidebar';
import {formatBytes, getStorageSize, loadHtmlFromStorage, saveHtmlToStorage,} from './utils/storage';
import {useTranslation} from 'react-i18next';

// Create a clean, modern theme
const theme = createTheme({
    palette: {
        primary: {main: '#667eea'},
        secondary: {main: '#f093fb'},
        background: {default: '#ffffff'},
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        h1: {fontWeight: 700, letterSpacing: '-0.02em'},
        h2: {fontWeight: 700, letterSpacing: '-0.01em'},
        h3: {fontWeight: 600},
    },
});

// Default HTML template for the editor
const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Page</title>
</head>
<body>
  <h1>Welcome to DQM Test Page</h1>
  <p>This is a test page for DQM quality analysis.</p>

  <h2>Sample Content</h2>
  <p>Add your HTML here to test the DQM widget.</p>

  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>

  <img src="https://via.placeholder.com/300x200" alt="Placeholder image">

  <a href="https://example.com">Example Link</a>
</body>
</html>`;

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({children, value, index}) => {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && <Box>{children}</Box>}
        </div>
    );
};

// HTML Editor Modal Component
const HtmlEditorModal: React.FC<{
    open: boolean;
    onClose: () => void;
    onAnalyze: (html: string) => void;
}> = ({open, onClose, onAnalyze}) => {
    const {t} = useTranslation(['demo']);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [htmlCode, setHtmlCode] = useState<string>('');
    const [storageSize, setStorageSize] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Load HTML from IndexedDB on mount
    React.useEffect(() => {
        const loadStoredData = async () => {
            setIsLoading(true);
            try {
                const storedHtmlCode = await loadHtmlFromStorage('dqm_editor_html');

                if (storedHtmlCode) {
                    setHtmlCode(storedHtmlCode);
                    const size = await getStorageSize('dqm_editor_html');
                    setStorageSize(size);
                } else {
                    setHtmlCode(DEFAULT_HTML);
                    await saveHtmlToStorage('dqm_editor_html', DEFAULT_HTML);
                    const size = await getStorageSize('dqm_editor_html');
                    setStorageSize(size);
                }
            } catch (error) {
                console.error('Failed to load stored data:', error);
                setHtmlCode(DEFAULT_HTML);
            } finally {
                setIsLoading(false);
            }
        };

        if (open) {
            loadStoredData();
        }
    }, [open]);

    // Save HTML to IndexedDB whenever it changes (debounced)
    React.useEffect(() => {
        if (!htmlCode || htmlCode === '' || isLoading) return;

        const timeoutId = setTimeout(async () => {
            try {
                await saveHtmlToStorage('dqm_editor_html', htmlCode);
                const size = await getStorageSize('dqm_editor_html');
                setStorageSize(size);
            } catch (error) {
                console.error('Failed to save HTML to IndexedDB:', error);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [htmlCode, isLoading]);

    const handleResetToDefault = async () => {
        setHtmlCode(DEFAULT_HTML);
        try {
            await saveHtmlToStorage('dqm_editor_html', DEFAULT_HTML);
            const size = await getStorageSize('dqm_editor_html');
            setStorageSize(size);
        } catch (error) {
            console.error('Failed to reset HTML in IndexedDB:', error);
        }
    };

    const handleAnalyze = () => {
        onAnalyze(htmlCode);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <CodeIcon/>
                        <Typography variant="h6">{t('demo:editor_title')}</Typography>
                    </Box>
                    <IconButton onClick={onClose} edge="end">
                        <Close/>
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Alert severity="info" sx={{mb: 2}} icon={<CodeIcon/>}>
                    <Box sx={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                {t('demo:debug_mode')}
                            </Typography>
                            <Typography variant="body2">
                                {t('demo:debug_desc')}
                            </Typography>
                        </Box>
                        <Chip
                            icon={<Storage/>}
                            label={formatBytes(storageSize)}
                            color="primary"
                            size="small"
                            sx={{ml: 2, flexShrink: 0}}
                        />
                    </Box>
                </Alert>

                <Paper elevation={1}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
                        variant="fullWidth"
                        sx={{borderBottom: 1, borderColor: 'divider'}}
                    >
                        <Tab icon={<CodeIcon/>} label={t('demo:tab_editor')} iconPosition="start"/>
                        <Tab label={t('demo:tab_preview')} iconPosition="start"/>
                    </Tabs>

                    <TabPanel value={activeTab} index={0}>
                        <Box sx={{p: 2}}>
                            {isLoading ? (
                                <Box
                                    sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400}}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('demo:loading_html')}
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <CodeMirror
                                        value={htmlCode}
                                        height="500px"
                                        extensions={[html()]}
                                        theme={oneDark}
                                        onChange={(value) => setHtmlCode(value)}
                                        style={{fontFamily: '"Fira Code", "Courier New", monospace'}}
                                    />
                                    <Box sx={{mt: 2, display: 'flex', gap: 2, alignItems: 'center'}}>
                                        <Button variant="outlined" onClick={handleResetToDefault} size="small">
                                            {t('demo:reset_default')}
                                        </Button>
                                        <Button variant="contained" onClick={() => setActiveTab(1)} size="small">
                                            {t('demo:preview_html')}
                                        </Button>
                                        <Chip
                                            icon={<Storage/>}
                                            label={formatBytes(storageSize)}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ml: 'auto'}}>
                                            {t('demo:auto_saved')}
                                        </Typography>
                                    </Box>
                                </>
                            )}
                        </Box>
                    </TabPanel>

                    <TabPanel value={activeTab} index={1}>
                        <Box sx={{p: 2, minHeight: 400}}>
                            <Paper
                                elevation={0}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                }}
                            >
                                <iframe
                                    title="HTML Preview"
                                    srcDoc={htmlCode}
                                    style={{
                                        width: '100%',
                                        height: '500px',
                                        border: 'none',
                                    }}
                                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                />
                            </Paper>
                        </Box>
                    </TabPanel>
                </Paper>
            </DialogContent>
            <DialogActions sx={{p: 2}}>
                <Button onClick={onClose} variant="outlined">
                    {t('demo:close')}
                </Button>
                <Button onClick={handleAnalyze} variant="contained" startIcon={<Assessment/>}>
                    {t('demo:analyze_custom_html')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Landing Page Component with intentional DQM errors
const LandingPage: React.FC<{ onOpenDQM: () => void; onOpenEditor: () => void }> = ({
                                                                                        onOpenDQM,
                                                                                        onOpenEditor,
                                                                                    }) => {
    const {t} = useTranslation(['demo']);
    return (
        <Box sx={{bgcolor: 'white', minHeight: '100vh'}}>
            {/* Hero Section */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    pt: {xs: 10, md: 15},
                    pb: {xs: 10, md: 15},
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Container maxWidth="lg">
                    <Box sx={{textAlign: 'center', color: 'white', position: 'relative', zIndex: 1}}>
                        <Typography variant="h1" sx={{fontSize: {xs: '2.5rem', md: '4rem'}, mb: 3}}>
                            {t('demo:hero_title')}
                        </Typography>
                        {/* DQM Error: Low contrast text */}
                        <Typography
                            variant="h5"
                            sx={{
                                mb: 5,
                                maxWidth: 700,
                                mx: 'auto',
                                color: '#d3d3d3',
                                fontSize: {xs: '1.1rem', md: '1.5rem'}
                            }}
                        >
                            {t('demo:hero_subtitle')}
                        </Typography>
                        {/* DQM Error: Empty href */}
                        <Button
                            component="a"
                            href="#"
                            variant="contained"
                            size="large"
                            sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                px: 6,
                                py: 2,
                                fontSize: '1.2rem',
                                borderRadius: 10,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                '&:hover': {bgcolor: 'grey.100', transform: 'translateY(-2px)'},
                            }}
                        >
                            {t('demo:hero_cta')}
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* Features Section */}
            <Box sx={{py: {xs: 8, md: 12}, bgcolor: '#f7fafc'}}>
                <Container maxWidth="lg">
                    <Typography variant="h2" sx={{textAlign: 'center', mb: 8, fontSize: {xs: '2rem', md: '3rem'}}}>
                        {t('demo:features_title')}
                    </Typography>
                    <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: 'repeat(3, 1fr)'}, gap: 4}}>
                        <Card
                            sx={{
                                height: '100%',
                                p: 4,
                                transition: 'transform 0.3s',
                                '&:hover': {transform: 'translateY(-8px)'},
                            }}
                        >
                            {/* DQM Error: Missing alt attribute */}
                            <Box
                                component="img"
                                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop"
                                sx={{width: '100%', height: 200, objectFit: 'cover', borderRadius: 2, mb: 3}}
                            />
                            <Typography variant="h5" sx={{mb: 2}}>
                                {t('demo:feature1_title')}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {t('demo:feature1_body')}
                            </Typography>
                        </Card>
                        <Card
                            sx={{
                                height: '100%',
                                p: 4,
                                transition: 'transform 0.3s',
                                '&:hover': {transform: 'translateY(-8px)'},
                            }}
                        >
                            {/* DQM Error: Empty alt attribute */}
                            <Box
                                component="img"
                                src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop"
                                alt=""
                                sx={{width: '100%', height: 200, objectFit: 'cover', borderRadius: 2, mb: 3}}
                            />
                            <Typography variant="h5" sx={{mb: 2}}>
                                {t('demo:feature2_title')}
                            </Typography>
                            {/* DQM Error: Extremely small font size */}
                            <Typography variant="body1" color="text.secondary" sx={{fontSize: '8px'}}>
                                {t('demo:feature2_body')}
                            </Typography>
                        </Card>
                        <Card
                            sx={{
                                height: '100%',
                                p: 4,
                                transition: 'transform 0.3s',
                                '&:hover': {transform: 'translateY(-8px)'},
                            }}
                        >
                            {/* DQM Error: Missing alt attribute */}
                            <Box
                                component="img"
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop"
                                sx={{width: '100%', height: 200, objectFit: 'cover', borderRadius: 2, mb: 3}}
                            />
                            <Typography variant="h5" sx={{mb: 2}}>
                                {t('demo:feature3_title')}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {t('demo:feature3_body')}
                            </Typography>
                        </Card>
                    </Box>
                </Container>
            </Box>

            {/* Stats Section */}
            <Box
                sx={{
                    py: {xs: 8, md: 12},
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                }}
            >
                <Container maxWidth="lg">
                    {/* DQM Error: Skipped heading level (h2 -> h5) */}
                    <Typography variant="h5" component="h5"
                                sx={{textAlign: 'center', mb: 8, fontSize: {xs: '2rem', md: '3rem'}}}>
                        {t('demo:stats_title')}
                    </Typography>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)'},
                        gap: 4
                    }}>
                        <Box sx={{textAlign: 'center'}}>
                            <Typography variant="h2" sx={{fontSize: {xs: '3rem', md: '4rem'}, mb: 1}}>
                                50K+
                            </Typography>
                            <Typography variant="h6">{t('demo:stat_active_customers')}</Typography>
                        </Box>
                        <Box sx={{textAlign: 'center'}}>
                            <Typography variant="h2" sx={{fontSize: {xs: '3rem', md: '4rem'}, mb: 1}}>
                                99.99%
                            </Typography>
                            <Typography variant="h6">{t('demo:stat_uptime')}</Typography>
                        </Box>
                        <Box sx={{textAlign: 'center'}}>
                            <Typography variant="h2" sx={{fontSize: {xs: '3rem', md: '4rem'}, mb: 1}}>
                                150+
                            </Typography>
                            <Typography variant="h6">{t('demo:stat_countries')}</Typography>
                        </Box>
                        <Box sx={{textAlign: 'center'}}>
                            <Typography variant="h2" sx={{fontSize: {xs: '3rem', md: '4rem'}, mb: 1}}>
                                24/7
                            </Typography>
                            <Typography variant="h6">{t('demo:stat_support')}</Typography>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* Testimonials Section */}
            <Box sx={{py: {xs: 8, md: 12}, bgcolor: 'white'}}>
                <Container maxWidth="lg">
                    <Typography variant="h2" sx={{textAlign: 'center', mb: 8, fontSize: {xs: '2rem', md: '3rem'}}}>
                        {t('demo:testimonials_title')}
                    </Typography>
                    <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: 'repeat(3, 1fr)'}, gap: 4}}>
                        <Paper sx={{p: 4, height: '100%', borderLeft: '4px solid', borderColor: 'primary.main'}}>
                            {/* DQM Error: Missing alt attribute */}
                            <Avatar
                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop"
                                sx={{width: 80, height: 80, mb: 3}}
                            />
                            <Typography variant="body1" sx={{fontStyle: 'italic', mb: 3, lineHeight: 1.8}}>
                                {t('demo:testimonial1_quote')}
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={600}>
                                {t('demo:testimonial1_name')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('demo:testimonial1_title')}
                            </Typography>
                        </Paper>
                        <Paper sx={{p: 4, height: '100%', borderLeft: '4px solid', borderColor: 'primary.main'}}>
                            {/* DQM Error: Empty alt attribute */}
                            <Avatar
                                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop"
                                alt=""
                                sx={{width: 80, height: 80, mb: 3}}
                            />
                            <Typography variant="body1" sx={{fontStyle: 'italic', mb: 3, lineHeight: 1.8}}>
                                {t('demo:testimonial2_quote')}
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={600}>
                                {t('demo:testimonial2_name')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('demo:testimonial2_title')}
                            </Typography>
                        </Paper>
                        <Paper sx={{p: 4, height: '100%', borderLeft: '4px solid', borderColor: 'primary.main'}}>
                            {/* DQM Error: Missing alt attribute */}
                            <Avatar
                                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop"
                                sx={{width: 80, height: 80, mb: 3}}
                            />
                            <Typography variant="body1" sx={{fontStyle: 'italic', mb: 3, lineHeight: 1.8}}>
                                {t('demo:testimonial3_quote')}
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={600}>
                                {t('demo:testimonial3_name')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('demo:testimonial3_title')}
                            </Typography>
                        </Paper>
                    </Box>
                </Container>
            </Box>

            {/* Pricing Section */}
            <Box sx={{py: {xs: 8, md: 12}, bgcolor: '#f7fafc'}}>
                <Container maxWidth="lg">
                    <Typography variant="h2" sx={{textAlign: 'center', mb: 2, fontSize: {xs: '2rem', md: '3rem'}}}>
                        {t('demo:pricing_title')}
                    </Typography>
                    <Typography variant="h6" sx={{textAlign: 'center', mb: 8, color: 'text.secondary'}}>
                        {t('demo:pricing_subtitle')}
                    </Typography>
                    <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: 'repeat(3, 1fr)'}, gap: 4}}>
                        <Card sx={{p: 4, height: '100%', textAlign: 'center'}}>
                            <Typography variant="h5" sx={{mb: 2}}>
                                {t('demo:plan_starter')}
                            </Typography>
                            <Typography variant="h3" sx={{mb: 3}}>
                                $29<Typography component="span" variant="h6" color="text.secondary">/mo</Typography>
                            </Typography>
                            <Box sx={{mb: 4, textAlign: 'left'}}>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_starter_feat1')}</Typography>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_starter_feat2')}</Typography>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_starter_feat3')}</Typography>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_starter_feat4')}</Typography>
                            </Box>
                            <Button variant="outlined" fullWidth size="large">
                                {t('demo:plan_cta_outline')}
                            </Button>
                        </Card>
                        <Card
                            sx={{
                                p: 4,
                                height: '100%',
                                textAlign: 'center',
                                border: '3px solid',
                                borderColor: 'primary.main',
                                position: 'relative',
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -15,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    px: 3,
                                    py: 0.5,
                                    borderRadius: 10,
                                }}
                            >
                                {t('demo:plan_badge_popular')}
                            </Box>
                            <Typography variant="h5" sx={{mb: 2, mt: 2}}>
                                {t('demo:plan_pro')}
                            </Typography>
                            <Typography variant="h3" sx={{mb: 3}}>
                                $99<Typography component="span" variant="h6" color="text.secondary">/mo</Typography>
                            </Typography>
                            <Box sx={{mb: 4, textAlign: 'left'}}>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_pro_feat1')}</Typography>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_pro_feat2')}</Typography>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_pro_feat3')}</Typography>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_pro_feat4')}</Typography>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_pro_feat5')}</Typography>
                            </Box>
                            <Button variant="contained" fullWidth size="large">
                                {t('demo:plan_cta_primary')}
                            </Button>
                        </Card>
                        <Card sx={{p: 4, height: '100%', textAlign: 'center'}}>
                            <Typography variant="h5" sx={{mb: 2}}>
                                {t('demo:plan_enterprise')}
                            </Typography>
                            <Typography variant="h3" sx={{mb: 3}}>
                                {t('demo:plan_enterprise_price')}
                            </Typography>
                            <Box sx={{mb: 4, textAlign: 'left'}}>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_ent_feat1')}</Typography>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_ent_feat2')}</Typography>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_ent_feat3')}</Typography>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_ent_feat4')}</Typography>
                                <Typography variant="body1" sx={{mb: 1}}>✓ {t('demo:plan_ent_feat5')}</Typography>
                            </Box>
                            <Button variant="outlined" fullWidth size="large">
                                {t('demo:plan_cta_contact')}
                            </Button>
                        </Card>
                    </Box>
                </Container>
            </Box>

            {/* CTA Section */}
            <Box
                sx={{
                    py: {xs: 8, md: 12},
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    textAlign: 'center',
                }}
            >
                <Container maxWidth="md">
                    <Typography variant="h2" sx={{mb: 3, fontSize: {xs: '2rem', md: '3rem'}}}>
                        {t('demo:cta_title')}
                    </Typography>
                    <Typography variant="h6" sx={{mb: 5, opacity: 0.9}}>
                        {t('demo:cta_subtitle')}
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        sx={{
                            bgcolor: 'white',
                            color: 'primary.main',
                            px: 6,
                            py: 2,
                            fontSize: '1.2rem',
                            borderRadius: 10,
                            '&:hover': {bgcolor: 'grey.100'},
                        }}
                    >
                        {t('demo:cta_button')}
                    </Button>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{bgcolor: '#1a202c', color: '#cbd5e0', py: 8}}>
                <Container maxWidth="lg">
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)'},
                        gap: 4
                    }}>
                        <Box>
                            <Typography variant="h6" sx={{color: 'white', mb: 2}}>
                                {t('demo:footer_brand')}
                            </Typography>
                            <Typography variant="body2" sx={{mb: 3}}>
                                {t('demo:footer_tagline')}
                            </Typography>
                            <Box sx={{display: 'flex', gap: 2}}>
                                {/* DQM Error: Links without aria-labels */}
                                <IconButton component="a" href="#" sx={{
                                    bgcolor: '#2d3748',
                                    color: 'white',
                                    '&:hover': {bgcolor: 'primary.main'}
                                }} aria-label={t('demo:footer_icon_speed')}>
                                    <Speed/>
                                </IconButton>
                                <IconButton component="a" href="#" sx={{
                                    bgcolor: '#2d3748',
                                    color: 'white',
                                    '&:hover': {bgcolor: 'primary.main'}
                                }} aria-label={t('demo:footer_icon_security')}>
                                    <Security/>
                                </IconButton>
                                <IconButton component="a" href="#" sx={{
                                    bgcolor: '#2d3748',
                                    color: 'white',
                                    '&:hover': {bgcolor: 'primary.main'}
                                }} aria-label={t('demo:footer_icon_growth')}>
                                    <TrendingUp/>
                                </IconButton>
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{color: 'white', mb: 2}}>
                                {t('demo:footer_col_product')}
                            </Typography>
                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                                <Typography component="a" href="#" variant="body2" sx={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    '&:hover': {color: 'primary.main'}
                                }}>
                                    {t('demo:footer_link_features')}
                                </Typography>
                                <Typography component="a" href="#" variant="body2" sx={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    '&:hover': {color: 'primary.main'}
                                }}>
                                    {t('demo:footer_link_pricing')}
                                </Typography>
                                <Typography component="a" href="#" variant="body2" sx={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    '&:hover': {color: 'primary.main'}
                                }}>
                                    {t('demo:footer_link_docs')}
                                </Typography>
                                <Typography component="a" href="#" variant="body2" sx={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    '&:hover': {color: 'primary.main'}
                                }}>
                                    {t('demo:footer_link_api')}
                                </Typography>
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{color: 'white', mb: 2}}>
                                {t('demo:footer_col_company')}
                            </Typography>
                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                                <Typography component="a" href="#" variant="body2" sx={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    '&:hover': {color: 'primary.main'}
                                }}>
                                    {t('demo:footer_link_about')}
                                </Typography>
                                <Typography component="a" href="#" variant="body2" sx={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    '&:hover': {color: 'primary.main'}
                                }}>
                                    {t('demo:footer_link_careers')}
                                </Typography>
                                <Typography component="a" href="#" variant="body2" sx={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    '&:hover': {color: 'primary.main'}
                                }}>
                                    {t('demo:footer_link_blog')}
                                </Typography>
                                <Typography component="a" href="#" variant="body2" sx={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    '&:hover': {color: 'primary.main'}
                                }}>
                                    {t('demo:footer_link_presskit')}
                                </Typography>
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{color: 'white', mb: 2}}>
                                {t('demo:footer_col_support')}
                            </Typography>
                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                                <Typography component="a" href="#" variant="body2" sx={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    '&:hover': {color: 'primary.main'}
                                }}>
                                    {t('demo:footer_link_help')}
                                </Typography>
                                <Typography component="a" href="#" variant="body2" sx={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    '&:hover': {color: 'primary.main'}
                                }}>
                                    {t('demo:footer_link_contact')}
                                </Typography>
                                <Typography component="a" href="#" variant="body2" sx={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    '&:hover': {color: 'primary.main'}
                                }}>
                                    {t('demo:footer_link_status')}
                                </Typography>
                                {/* DQM Error: Empty link */}
                                <Typography component="a" href="#" variant="body2"
                                            sx={{color: 'inherit', textDecoration: 'none'}}>
                                    {t('demo:footer_link_cookies')}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{borderTop: '1px solid #2d3748', mt: 6, pt: 4, textAlign: 'center'}}>
                        <Typography variant="body2" color="text.secondary">
                            {t('demo:footer_copyright')}{' '}
                            <Typography component="a" href="#" sx={{color: 'inherit', textDecoration: 'none'}}>
                                {t('demo:footer_link_privacy')}
                            </Typography>{' '}
                            |{' '}
                            <Typography component="a" href="#" sx={{color: 'inherit', textDecoration: 'none'}}>
                                {t('demo:footer_link_terms')}
                            </Typography>
                        </Typography>
                    </Box>
                </Container>
            </Box>

            {/* Floating Action Buttons */}
            <Box sx={{
                position: 'fixed',
                bottom: 24,
                left: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                zIndex: 1000
            }}>
                <Fab color="secondary" onClick={onOpenEditor} size="medium">
                    <CodeIcon/>
                </Fab>
                <Fab color="primary" onClick={onOpenDQM}>
                    <Assessment/>
                </Fab>
            </Box>
        </Box>
    );
};

// Main App with Login
const TestApp: React.FC = () => {
    const [apiKey, setApiKey] = useState<string>('');
    const [websiteId, setWebsiteId] = useState<string>('');
    const [showApiKey, setShowApiKey] = useState<boolean>(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const [editorOpen, setEditorOpen] = useState<boolean>(false);
    const [customHtml, setCustomHtml] = useState<string | undefined>(undefined);

    // Check localStorage on mount for existing credentials
    React.useEffect(() => {
        const storedApiKey = localStorage.getItem('dqm_apiKey');
        const storedWebsiteId = localStorage.getItem('dqm_websiteID');

        if (storedApiKey && storedWebsiteId) {
            setApiKey(storedApiKey);
            setWebsiteId(storedWebsiteId);
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogin = () => {
        if (!apiKey.trim() || !websiteId.trim()) {
            return;
        }

        localStorage.setItem('dqm_apiKey', apiKey.trim());
        localStorage.setItem('dqm_websiteID', websiteId.trim());
        setIsLoggedIn(true);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    const handleAnalyzeCustomHtml = (html: string) => {
        setCustomHtml(html);
        setSidebarOpen(true);
    };

    if (!isLoggedIn) {
        return (
            <Container maxWidth="sm" sx={{mt: 10}}>
                <Card elevation={3}>
                    <CardContent sx={{p: 5}}>
                        <Box sx={{textAlign: 'center', mb: 4}}>
                            <Lock sx={{fontSize: 60, color: 'primary.main', mb: 2}}/>
                            <Typography variant="h4" gutterBottom>
                                DQM Widget Test
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Enter your DQM credentials to view the landing page
                            </Typography>
                        </Box>

                        <TextField
                            fullWidth
                            label="Website ID"
                            value={websiteId}
                            onChange={(e) => setWebsiteId(e.target.value)}
                            onKeyDown={handleKeyPress}
                            margin="normal"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Web/>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            label="DQM API Key"
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            onKeyDown={handleKeyPress}
                            margin="normal"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock/>
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowApiKey(!showApiKey)} edge="end">
                                                {showApiKey ? <VisibilityOff/> : <Visibility/>}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <Button fullWidth variant="contained" size="large" onClick={handleLogin} sx={{mt: 3, py: 1.5}}>
                            View Landing Page
                        </Button>
                    </CardContent>
                </Card>
            </Container>
        );
    }

    return (
        <>
            <LandingPage
                onOpenDQM={() => {
                    setCustomHtml(undefined);
                    setSidebarOpen(true);
                }}
                onOpenEditor={() => setEditorOpen(true)}
            />
            <HtmlEditorModal
                open={editorOpen}
                onClose={() => setEditorOpen(false)}
                onAnalyze={handleAnalyzeCustomHtml}
            />
            <DQMSidebar
                open={sidebarOpen}
                onOpen={() => setSidebarOpen(true)}
                onClose={() => setSidebarOpen(false)}
                debugHtml={customHtml}
                config={{
                    // --  Direct API Key and Website ID (not recommended for production)
                    // websiteId: 'your-website-id',
                    // apiKey: 'your-api-key',

                    // -- Auth Backend for API Key management
                    authBackendUrl: window.location.origin,
                    useLocalStorage: true,

                    // -- Oauth2:  backend not yet implemented ...
                    // oauth2Config: {
                    //     authUrl: 'https://dqm.crownpeak.com/oauth2/authorize',
                    //     clientId: 'crownpeak-dqm-react-component',
                    //     scope: 'dqm_api',
                    //     redirectUri: 'http://localhost:3000/',
                    //     tokenUrl: 'https://dqm.crownpeak.com/oauth2/token',
                    // }
                }}
            />
        </>
    );
};

// Bootstrap the test app
const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

export default () => <ThemeProvider theme={theme}>
    <CssBaseline/>
    <TestApp/>
</ThemeProvider>

