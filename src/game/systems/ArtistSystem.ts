import { Band, ArtistAgreement, ContentUsageLevel } from '@game/types';

export interface RealArtistData {
  id: string;
  name: string;
  email?: string;
  contactedDate?: number;
  agreementSigned?: boolean;
  agreement?: ArtistAgreement;
  bandData: Partial<Band>;
  promotionalMaterials?: {
    photos: string[];
    bio: string;
    pressKit?: string;
    musicSamples?: { url: string; title: string }[];
  };
}

export class ArtistPartnershipSystem {
  private artistDatabase: Map<string, RealArtistData> = new Map();

  // Add a real artist to the system
  registerArtist(artistData: RealArtistData): void {
    this.artistDatabase.set(artistData.id, artistData);
  }

  // Convert real artist data to game band
  createBandFromArtist(artistId: string): Band | null {
    const artistData = this.artistDatabase.get(artistId);
    if (!artistData || !artistData.agreement) return null;

    const band: Band = {
      id: `band-${artistId}`,
      name: artistData.bandData.name || artistData.name,
      isRealArtist: true,
      artistId: artistId,
      genre: artistData.bandData.genre!,
      subgenres: artistData.bandData.subgenres || [],
      popularity: artistData.bandData.popularity || 30,
      authenticity: artistData.bandData.authenticity || 85,
      energy: artistData.bandData.energy || 70,
      technicalSkill: artistData.bandData.technicalSkill || 65,
      traits: artistData.bandData.traits || [],
      technicalRequirements: artistData.bandData.technicalRequirements || [],
      bio: artistData.promotionalMaterials?.bio,
      imageUrl: artistData.promotionalMaterials?.photos?.[0],
      hometown: artistData.bandData.hometown,
      formedYear: artistData.bandData.formedYear,
      socialMedia: artistData.bandData.socialMedia,
      musicSamples: artistData.promotionalMaterials?.musicSamples?.map((sample, index) => ({
        id: `sample-${index}`,
        url: sample.url,
        title: sample.title,
        duration: 30, // Preview duration
        isPreview: true,
      })),
    };

    return band;
  }

  // Check content usage permissions
  canUseContent(artistId: string, contentType: 'basic' | 'photos' | 'music' | 'events'): boolean {
    const artist = this.artistDatabase.get(artistId);
    if (!artist?.agreement) return false;

    const { contentUsage } = artist.agreement;
    
    switch (contentType) {
      case 'basic':
        return true; // Basic always allowed if agreement exists
      case 'photos':
        return contentUsage >= ContentUsageLevel.STANDARD;
      case 'music':
        return contentUsage >= ContentUsageLevel.STANDARD;
      case 'events':
        return contentUsage >= ContentUsageLevel.PREMIUM;
      default:
        return false;
    }
  }

  // Get attribution text for an artist
  getAttribution(artistId: string): string {
    const artist = this.artistDatabase.get(artistId);
    if (!artist?.agreement) return '';
    
    return artist.agreement.attribution;
  }

  // Calculate revenue share for an artist
  calculateRevenueShare(artistId: string, totalRevenue: number): number {
    const artist = this.artistDatabase.get(artistId);
    if (!artist?.agreement) return 0;
    
    return totalRevenue * (artist.agreement.revenueShare / 100);
  }

  // Get all partnered artists
  getAllPartneredArtists(): RealArtistData[] {
    return Array.from(this.artistDatabase.values())
      .filter(artist => artist.agreementSigned);
  }

  // Search for artists by genre
  findArtistsByGenre(genre: string): RealArtistData[] {
    return Array.from(this.artistDatabase.values())
      .filter(artist => 
        artist.agreementSigned && 
        artist.bandData.genre === genre
      );
  }
}

// Singleton instance
export const artistSystem = new ArtistPartnershipSystem();