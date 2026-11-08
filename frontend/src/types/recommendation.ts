export interface Recommendation {
  id: string;
  profileNumber: string;
  gender: number;
  birthYear: string;
  age: number;
  height: number;
  cityId: number;
  cityName: string;
  educationLabel: string;
  occupation: string;
  traits: string[];
  advantages: string[];
  introduction: string;
  photoUrl: string | null;
}
export interface DailyRecommendations {
  date: string;
  targetGender: number;
  total: number;
  items: Recommendation[];
  registration: { hasProfile: boolean; profileStatus: number; hasChanges: boolean };
  matchCount: number;
}
export interface RecommendationDetail extends Recommendation {
  relationshipLabel: string;
  incomeLabel: string | null;
  maritalStatusLabel: string | null;
  hometownCityName: string | null;
  workCityName: string | null;
  carStatusLabel: string | null;
  photoUrls: string[];
  preference: {
    birthYearMin: number | null;
    birthYearMax: number | null;
    heightMin: number | null;
    heightMax: number | null;
    educationLabel: string | null;
    cityName: string | null;
    tags: string[];
  };
}
