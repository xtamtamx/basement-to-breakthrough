import { lazy } from 'react';

// Lazy load heavy game components
export const MapView = lazy(() => import('./MapView').then(module => ({ default: module.MapView })));
export const ShowResultsView = lazy(() => import('./ShowResultsView').then(module => ({ default: module.ShowResultsView })));
export const AnimatedShowResults = lazy(() => import('./AnimatedShowResults').then(module => ({ default: module.AnimatedShowResults })));
export const ParticleBackground = lazy(() => import('../effects/ParticleBackground').then(module => ({ default: module.ParticleBackground })));
export const VenueDetailsPanel = lazy(() => import('./VenueDetailsPanel').then(module => ({ default: module.VenueDetailsPanel })));
export const BandRoster = lazy(() => import('./BandRoster').then(module => ({ default: module.BandRoster })));
export const ShowHistory = lazy(() => import('./ShowHistory').then(module => ({ default: module.ShowHistory })));
export const ChainReactionVisualizer = lazy(() => import('./ChainReactionVisualizer'));
export const VenueUpgradeUI = lazy(() => import('./VenueUpgradeUI'));
export const MetaProgressionOverlay = lazy(() => import('./MetaProgressionOverlay'));
export const AchievementToast = lazy(() => import('./AchievementToast'));
export const SynergyDiscoveryModal = lazy(() => import('./SynergyDiscoveryModal'));