// Sidebar Skeleton Component - matches exact layout of completed analysis view
import React from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Card,
    List,
    ListItem,
    Skeleton,
    Typography
} from "@mui/material";
import {ExpandMore as ExpandMoreIcon} from "@mui/icons-material";
import {QualityOverviewCard, CategoryCard, FailedCheckpointsCard} from "../cards";

export const SidebarSkeleton: React.FC<{
    expanded: boolean;
}> = ({expanded}) => {
    return (
        <Box pb={2}>
            {/* Quality Overview Card Skeleton */}
            <QualityOverviewCard>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Skeleton variant="text" width={180} height={30}/>
                    </Box>
                </Box>

                <Box display="flex" alignItems="center" justifyContent="flex-start">
                    {/* Circular Progress Skeleton */}
                    <Box position="relative" display="inline-flex" mr={4}>
                        <Skeleton variant="circular" width={140} height={140}/>
                    </Box>

                    {/* Stats Grid Skeleton */}
                    <Box display="flex" flexDirection="column" gap={2} flex={0}>
                        <Box display="flex" alignItems="center" flexDirection="column" justifyContent="center">
                            <Skeleton variant="text" width={80} height={28}/>
                            <Skeleton variant="text" width={60} height={14}/>
                        </Box>
                        <Skeleton variant="rectangular" width="100%" height={2}/>
                        <Box display="flex" alignItems="center" flexDirection="column" justifyContent="center">
                            <Skeleton variant="text" width={80} height={28}/>
                            <Skeleton variant="text" width={60} height={14}/>
                        </Box>
                    </Box>

                    {/* Button for show error page in new tab */}
                    <Skeleton variant="rectangular" width={220} height={50} sx={{ml: 5}}/>
                </Box>
            </QualityOverviewCard>

            {/* Quality Breakdown Accordion Skeleton */}
            <Accordion defaultExpanded expanded={expanded} sx={{
                borderRadius: 2,
                mb: 2,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                '&:before': {display: 'none'},
            }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                                  sx={{px: 3}}>
                    <Box display="flex" alignItems="center" gap={1} height={72}>
                        <Skeleton variant="text" width={160} height={28}/>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{px: 3, pb: 3}}>
                    <CategoryCard>
                        <Box display="flex" flexWrap="wrap" gap={3} justifyContent="space-around">
                            {/* Category Progress Skeletons - 4 categories */}
                            {[1, 2, 3, 4, 5, 6].map((index) => (
                                <Box
                                    key={index}
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    gap={2}
                                    width="180px"
                                >
                                    {/* Circular Progress Skeleton */}
                                    <Box position="relative" display="inline-flex">
                                        <Skeleton variant="circular" width={100} height={100}/>
                                    </Box>
                                    {/* Category Label Skeleton */}
                                    <Box textAlign="center" width="100%">
                                        <Skeleton variant="text" width={120} height={20} sx={{mx: 'auto', mb: 0.5}}/>
                                        <Skeleton variant="text" width={100} height={16} sx={{mx: 'auto'}}/>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </CategoryCard>
                </AccordionDetails>
            </Accordion>

            {/* Failed Checkpoints Section Skeleton */}
            <Typography variant="h4" fontWeight={600} gutterBottom sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                pt: 4
            }}>
                <Skeleton variant="text" width={280} height={36}/>
            </Typography>

            {/* Category Filter Chips Skeleton - Sticky section */}
            <Box sx={{
                position: 'sticky',
                top: -31,
                zIndex: 10,
                py: 2,
                borderRadius: 0
            }}>
                <Card sx={{
                    padding: 2,
                    pb: 1,
                    px: '20px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Skeleton variant="text" width={240} height={20}/>
                        <Skeleton variant="text" width={80} height={28}/>
                    </Box>
                    <Box display="flex" gap={1} flexWrap="nowrap" sx={{overflowY: 'scroll', pb: 2.5, pt: 1}}>
                        {/* Filter Chip Skeletons */}
                        {[1, 2, 3, 4].map((index) => (
                            <Skeleton
                                key={index}
                                variant="rounded"
                                width={140}
                                height={32}
                                sx={{borderRadius: 4, flexShrink: 0}}
                            />
                        ))}
                    </Box>
                </Card>
            </Box>

            {/* Failed Checkpoints List Skeleton */}
            <Box sx={{minHeight: 'calc(100vh - 320px)'}}>
                <FailedCheckpointsCard>
                    <List sx={{p: 0}}>
                        {/* Failed Checkpoint Items Skeleton - 3 items */}
                        {[1, 2, 3].map((index) => (
                            <ListItem
                                key={index}
                                sx={{
                                    px: 0,
                                    py: 1.5,
                                    alignItems: 'flex-start',
                                    borderBottom: index < 3 ? '1px solid' : 'none',
                                    borderColor: 'divider',
                                }}
                            >
                                <Box mt={0.5} width="100%">
                                    {/* Checkpoint Title Skeleton */}
                                    <Skeleton variant="text" width="70%" height={32} sx={{mb: 2.5}}/>

                                    {/* Category and Topics Chips Skeleton */}
                                    <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                                        <Skeleton variant="rounded" width={120} height={32} sx={{borderRadius: 4}}/>
                                        <Skeleton variant="rounded" width={100} height={32} sx={{borderRadius: 4}}/>
                                        <Skeleton variant="rounded" width={80} height={32} sx={{borderRadius: 4}}/>
                                    </Box>

                                    {/* Description Skeleton */}
                                    <Box mb={2}>
                                        <Skeleton variant="text" width="100%" height={20}/>
                                        <Skeleton variant="text" width="95%" height={20}/>
                                        <Skeleton variant="text" width="60%" height={20}/>
                                    </Box>

                                    {/* Action Buttons Skeleton */}
                                    <Box display="flex" gap={1}>
                                        <Skeleton variant="rounded" width={140} height={32} sx={{borderRadius: 2}}/>
                                        <Skeleton variant="rounded" width={120} height={32} sx={{borderRadius: 2}}/>
                                    </Box>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </FailedCheckpointsCard>
            </Box>
        </Box>
    );
};