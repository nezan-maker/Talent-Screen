export type SkillLevel =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Expert";

export type LanguageProficiency =
  | "Basic"
  | "Conversational"
  | "Fluent"
  | "Native";

export interface TalentSkill {
  name: string;
  level: SkillLevel | string;
  yearsOfExperience: number;
}

export interface TalentLanguage {
  name: string;
  proficiency: LanguageProficiency | string;
}

export interface TalentExperience {
  company: string;
  role: string;
  start_date: string;
  end_date: string;
  description: string;
  technologies: string[];
  is_current: boolean;
}

export interface TalentEducation {
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: number | null;
  end_year: number | null;
}

export interface TalentCertification {
  name: string;
  issuer: string;
  issue_date: string;
}

export interface TalentProject {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  link: string;
  start_date: string;
  end_date: string;
}

export interface TalentAvailability {
  status: string;
  type: string;
  start_date: string | null;
}

export interface TalentSocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export type ApplicantState =
  | "Queued"
  | "In Review"
  | "Shortlisted"
  | "Rejected";

export interface NormalizedTalentProfile {
  id?: string;
  first_name: string;
  last_name: string;
  applicant_name: string;
  email: string;
  headline: string;
  bio: string;
  location: string;
  job_id?: string;
  job_title: string;
  skills: TalentSkill[];
  languages: TalentLanguage[];
  experience: TalentExperience[];
  education: TalentEducation[];
  certifications: TalentCertification[];
  projects: TalentProject[];
  availability: TalentAvailability;
  social_links: TalentSocialLinks;
  additional_info: string[];
  resume_text?: string;
  source: "seed" | "manual" | "upload" | "platform" | "external";
  applicant_state: ApplicantState;
  shortlisted: boolean;
}

export interface JobCriterion {
  criteria_string: string;
  description: string;
  priority: string;
}

export interface ScreeningDimensionScore {
  score: number;
  reasoning?: string;
}

export type ScreeningVerdict = "Shortlisted" | "Review" | "Rejected";

export interface ScreeningEvaluation {
  screening_id: string;
  screening_run_id: string;
  candidate_id: string;
  job_id: string;
  evaluated_at: Date;
  overall: {
    score: number;
    grade: string;
    verdict: ScreeningVerdict;
    summary: string;
  };
  dimension_scores: {
    skills_match: ScreeningDimensionScore & {
      matched: string[];
      missing: string[];
    };
    experience_relevance: ScreeningDimensionScore & {
      total_years: number;
      relevant_years: number;
      highlights: string[];
    };
    education_fit: ScreeningDimensionScore & {
      degree_level: string;
      field_relevance: string;
    };
    project_quality: ScreeningDimensionScore & {
      count: number;
      highlights: string[];
    };
    certifications_value: ScreeningDimensionScore & {
      count: number;
      relevant: string[];
    };
    language_fit: ScreeningDimensionScore & {
      required_met: boolean;
      languages: Array<{ name: string; proficiency: string }>;
    };
    availability_fit: ScreeningDimensionScore & {
      status: string;
      type_match: boolean;
      earliest_start: string | null;
    };
  };
  weights_used: {
    skills_match: number;
    experience_relevance: number;
    project_quality: number;
    education_fit: number;
    certifications_value: number;
    language_fit: number;
    availability_fit: number;
  };
  flags: {
    career_gap: boolean;
    overqualified: boolean;
    location_mismatch: boolean;
    incomplete_profile: boolean;
  };
  rank: number;
  percentile: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}
