/**
 * Disease System
 * Realistic disease spread, pathogen lifecycle, and immune responses
 */

export enum DiseaseType {
  BACTERIAL = 'bacterial',
  VIRAL = 'viral',
  FUNGAL = 'fungal',
  PARASITIC = 'parasitic',
  TOXIC = 'toxic',
  GENETIC = 'genetic',
  NUTRITIONAL = 'nutritional'
}

export enum TransmissionMode {
  DIRECT_CONTACT = 'direct_contact',    // Ant-to-ant contact
  AIRBORNE = 'airborne',               // Through air/breathing
  FOOD_BORNE = 'food_borne',           // Contaminated food sources
  VECTOR_BORNE = 'vector_borne',       // Through other organisms
  ENVIRONMENTAL = 'environmental',      // From contaminated environment
  VERTICAL = 'vertical',               // Parent to offspring
  WOUND = 'wound'                      // Through injuries
}

export enum DiseaseStage {
  INCUBATION = 'incubation',           // Infected but not symptomatic
  ACUTE = 'acute',                     // Active disease phase
  CHRONIC = 'chronic',                 // Long-term disease
  RECOVERY = 'recovery',               // Healing phase
  IMMUNE = 'immune',                   // Resistant to disease
  CARRIER = 'carrier'                  // Asymptomatic but infectious
}

export interface Pathogen {
  id: string;
  name: string;
  type: DiseaseType;
  transmissionModes: TransmissionMode[];
  
  // Pathogen characteristics
  infectivity: number;           // 0-1, how easily it spreads
  virulence: number;            // 0-1, severity of symptoms
  resistance: number;           // 0-1, resistance to treatment
  mutationRate: number;         // 0-1, genetic change rate
  
  // Environmental survival
  environmentalSurvival: number; // Days pathogen survives outside host
  temperatureTolerance: { min: number; max: number }; // °C
  humidityTolerance: { min: number; max: number };    // 0-1
  phTolerance: { min: number; max: number };          // pH range
  
  // Disease progression
  incubationPeriod: number;     // Days before symptoms
  acutePeriod: number;          // Days of active disease
  recoveryPeriod: number;       // Days to recover
  mortalityRate: number;        // 0-1, probability of death
  
  // Immunity and resistance
  immunityDuration: number;     // Days of immunity post-recovery
  crossImmunity: string[];      // Other pathogens this provides immunity to
  
  // Symptoms and effects
  symptoms: DiseaseSymptom[];
  
  // Treatment and prevention
  treatmentOptions: Treatment[];
  preventionMethods: Prevention[];
}

export interface DiseaseSymptom {
  name: string;
  severity: number;             // 0-1, how severe this symptom is
  onset: number;               // Days after infection when symptom appears
  duration: number;            // Days symptom lasts
  
  // Effects on ant capabilities
  mobilityReduction: number;    // 0-1, reduction in movement speed
  workEfficiencyReduction: number; // 0-1, reduction in task performance
  appetiteReduction: number;    // 0-1, reduction in food consumption
  socialBehaviorChange: number; // 0-1, change in social interactions
  lifespanReduction: number;    // Days reduced from natural lifespan
  
  // Behavioral changes
  increaseAggression: boolean;
  decreaseGrooming: boolean;
  alterForaging: boolean;
  changeNestBehavior: boolean;
}

export interface Treatment {
  name: string;
  type: 'antibiotic' | 'antiviral' | 'antifungal' | 'supportive' | 'behavioral';
  effectiveness: number;        // 0-1, how effective against this pathogen
  sideEffects: DiseaseSymptom[];
  duration: number;            // Days of treatment needed
  availability: number;        // 0-1, how available in colony
  cost: Map<string, number>;   // Resource cost for treatment
}

export interface Prevention {
  name: string;
  type: 'hygiene' | 'quarantine' | 'vaccination' | 'environmental' | 'behavioral';
  effectiveness: number;        // 0-1, reduction in transmission
  implementationCost: Map<string, number>; // Resource cost
  maintenanceCost: Map<string, number>;    // Ongoing resource cost per day
  duration: number;            // Days prevention remains effective
  socialImpact: number;        // 0-1, impact on colony social behavior
}

export interface Infection {
  pathogenId: string;
  antId: string;
  infectionDate: number;       // Timestamp of infection
  stage: DiseaseStage;
  severity: number;            // 0-1, current severity
  transmissibility: number;    // 0-1, how infectious ant currently is
  
  // Tracking
  sourceAntId?: string;        // Who infected this ant
  transmissionMode: TransmissionMode;
  location: { x: number; y: number; z: number }; // Where infection occurred
  
  // Status
  symptomsOnset?: number;      // When symptoms started
  treatmentStarted?: number;   // When treatment began
  expectedRecovery?: number;   // Estimated recovery date
  
  // Immune response
  immuneResponse: ImmuneResponse;
}

export interface ImmuneResponse {
  strength: number;            // 0-1, immune system strength
  adaptation: number;          // 0-1, how well adapted to this pathogen
  antibodyLevel: number;       // 0-1, current antibody concentration
  memoryBCells: number;        // Long-term immunity strength
  
  // Immune system status
  compromised: boolean;        // Whether immune system is weakened
  autoimmune: boolean;         // Whether attacking own cells
  allergicReaction: boolean;   // Overreaction to pathogen
}

export interface DiseaseOutbreak {
  id: string;
  pathogenId: string;
  startDate: number;
  
  // Outbreak tracking
  primaryCase: string;         // First infected ant
  infectedAnts: Set<string>;   // All currently infected ants
  recoveredAnts: Set<string>;  // Ants that recovered
  deceasedAnts: Set<string>;   // Ants that died from disease
  
  // Epidemiological data
  basicReproductionNumber: number; // R₀ - average infections per case
  effectiveReproductionNumber: number; // Rt - current reproduction rate
  incidenceRate: number;       // New infections per day
  prevalenceRate: number;      // Total infected / total population
  mortalityRate: number;       // Deaths / total infected
  
  // Outbreak status
  peakDate?: number;           // When outbreak peaked
  endDate?: number;            // When outbreak ended
  controlMeasures: string[];   // Measures taken to control outbreak
  
  // Spatial tracking
  hotspots: Array<{
    location: { x: number; y: number; z: number };
    radius: number;
    infectionDensity: number;
  }>;
}

export interface ColonyHealthStatus {
  overallHealth: number;       // 0-1, average health of colony
  immuneSystemStrength: number; // 0-1, colony-wide immune capability
  diseaseResistance: number;   // 0-1, genetic resistance to diseases
  
  // Current disease burden
  activeDiseases: Map<string, number>; // pathogenId -> infected count
  chronicConditions: Map<string, number>; // long-term health issues
  
  // Health trends
  mortalityTrend: number[];    // Daily mortality rates
  morbidityTrend: number[];    // Daily new infection rates
  recoveryTrend: number[];     // Daily recovery rates
  
  // Risk factors
  populationDensity: number;   // Crowding factor
  nutritionalStatus: number;   // 0-1, nutritional health
  stressLevel: number;         // 0-1, environmental stress
  ageDistribution: Map<string, number>; // Age-related vulnerability
  
  // Prevention status
  hygieneLevel: number;        // 0-1, colony cleanliness
  quarantineCapacity: number;  // Number of ants that can be isolated
  medicalResources: Map<string, number>; // Available treatments
}

/**
 * Comprehensive disease simulation system
 */
export class DiseaseSystem {
  private pathogens: Map<string, Pathogen>;
  private infections: Map<string, Infection[]>; // antId -> infections
  private outbreaks: Map<string, DiseaseOutbreak>;
  private colonyHealth: ColonyHealthStatus;
  private preventionMeasures: Map<string, Prevention>;
  private treatments: Map<string, Treatment>;
  
  // Environmental factors
  private environmentalContamination: Map<string, number>; // location -> pathogen load
  private weatherEffects: Map<string, number>; // weather -> disease spread modifier
  
  constructor() {
    this.pathogens = new Map();
    this.infections = new Map();
    this.outbreaks = new Map();
    this.preventionMeasures = new Map();
    this.treatments = new Map();
    this.environmentalContamination = new Map();
    this.weatherEffects = new Map();
    
    this.colonyHealth = this.initializeColonyHealth();
    this.initializePathogens();
    this.initializeTreatments();
    this.initializePreventionMeasures();
  }

  private initializeColonyHealth(): ColonyHealthStatus {
    return {
      overallHealth: 0.85,
      immuneSystemStrength: 0.75,
      diseaseResistance: 0.70,
      activeDiseases: new Map(),
      chronicConditions: new Map(),
      mortalityTrend: [],
      morbidityTrend: [],
      recoveryTrend: [],
      populationDensity: 0.5,
      nutritionalStatus: 0.80,
      stressLevel: 0.3,
      ageDistribution: new Map([
        ['young', 0.4],
        ['adult', 0.5],
        ['elderly', 0.1]
      ]),
      hygieneLevel: 0.75,
      quarantineCapacity: 50,
      medicalResources: new Map([
        ['basic_care', 100],
        ['antibiotics', 20],
        ['antivirals', 10]
      ])
    };
  }

  private initializePathogens(): void {
    // Common ant pathogens based on real research
    
    // Fungal pathogen - similar to Ophiocordyceps
    this.pathogens.set('zombie_fungus', {
      id: 'zombie_fungus',
      name: 'Zombie Ant Fungus',
      type: DiseaseType.FUNGAL,
      transmissionModes: [TransmissionMode.DIRECT_CONTACT, TransmissionMode.ENVIRONMENTAL],
      infectivity: 0.7,
      virulence: 0.9,
      resistance: 0.8,
      mutationRate: 0.1,
      environmentalSurvival: 30,
      temperatureTolerance: { min: 15, max: 35 },
      humidityTolerance: { min: 0.6, max: 1.0 },
      phTolerance: { min: 5.0, max: 7.5 },
      incubationPeriod: 3,
      acutePeriod: 7,
      recoveryPeriod: 0, // Usually fatal
      mortalityRate: 0.95,
      immunityDuration: 0,
      crossImmunity: [],
      symptoms: [
        {
          name: 'behavioral_manipulation',
          severity: 0.9,
          onset: 5,
          duration: 3,
          mobilityReduction: 0.8,
          workEfficiencyReduction: 0.9,
          appetiteReduction: 0.7,
          socialBehaviorChange: 0.9,
          lifespanReduction: 15,
          increaseAggression: false,
          decreaseGrooming: true,
          alterForaging: true,
          changeNestBehavior: true
        }
      ],
      treatmentOptions: [],
      preventionMethods: []
    });

    // Bacterial infection
    this.pathogens.set('septicemia', {
      id: 'septicemia',
      name: 'Bacterial Septicemia',
      type: DiseaseType.BACTERIAL,
      transmissionModes: [TransmissionMode.WOUND, TransmissionMode.FOOD_BORNE],
      infectivity: 0.4,
      virulence: 0.6,
      resistance: 0.3,
      mutationRate: 0.05,
      environmentalSurvival: 7,
      temperatureTolerance: { min: 10, max: 40 },
      humidityTolerance: { min: 0.3, max: 1.0 },
      phTolerance: { min: 6.0, max: 8.0 },
      incubationPeriod: 1,
      acutePeriod: 5,
      recoveryPeriod: 7,
      mortalityRate: 0.3,
      immunityDuration: 90,
      crossImmunity: ['related_bacteria'],
      symptoms: [
        {
          name: 'systemic_infection',
          severity: 0.6,
          onset: 1,
          duration: 5,
          mobilityReduction: 0.4,
          workEfficiencyReduction: 0.5,
          appetiteReduction: 0.6,
          socialBehaviorChange: 0.3,
          lifespanReduction: 5,
          increaseAggression: true,
          decreaseGrooming: true,
          alterForaging: false,
          changeNestBehavior: false
        }
      ],
      treatmentOptions: [],
      preventionMethods: []
    });

    // Viral infection
    this.pathogens.set('ant_virus', {
      id: 'ant_virus',
      name: 'Ant Colony Virus',
      type: DiseaseType.VIRAL,
      transmissionModes: [TransmissionMode.DIRECT_CONTACT, TransmissionMode.AIRBORNE],
      infectivity: 0.8,
      virulence: 0.4,
      resistance: 0.9,
      mutationRate: 0.15,
      environmentalSurvival: 3,
      temperatureTolerance: { min: 5, max: 45 },
      humidityTolerance: { min: 0.2, max: 1.0 },
      phTolerance: { min: 4.0, max: 9.0 },
      incubationPeriod: 2,
      acutePeriod: 4,
      recoveryPeriod: 5,
      mortalityRate: 0.1,
      immunityDuration: 180,
      crossImmunity: [],
      symptoms: [
        {
          name: 'respiratory_symptoms',
          severity: 0.4,
          onset: 2,
          duration: 4,
          mobilityReduction: 0.2,
          workEfficiencyReduction: 0.3,
          appetiteReduction: 0.4,
          socialBehaviorChange: 0.5,
          lifespanReduction: 2,
          increaseAggression: false,
          decreaseGrooming: false,
          alterForaging: true,
          changeNestBehavior: false
        }
      ],
      treatmentOptions: [],
      preventionMethods: []
    });

    // Parasitic infection
    this.pathogens.set('mites', {
      id: 'mites',
      name: 'Parasitic Mites',
      type: DiseaseType.PARASITIC,
      transmissionModes: [TransmissionMode.DIRECT_CONTACT, TransmissionMode.ENVIRONMENTAL],
      infectivity: 0.6,
      virulence: 0.5,
      resistance: 0.4,
      mutationRate: 0.02,
      environmentalSurvival: 14,
      temperatureTolerance: { min: 8, max: 38 },
      humidityTolerance: { min: 0.4, max: 0.9 },
      phTolerance: { min: 5.5, max: 7.5 },
      incubationPeriod: 1,
      acutePeriod: 21,
      recoveryPeriod: 14,
      mortalityRate: 0.05,
      immunityDuration: 30,
      crossImmunity: [],
      symptoms: [
        {
          name: 'skin_irritation',
          severity: 0.3,
          onset: 1,
          duration: 21,
          mobilityReduction: 0.1,
          workEfficiencyReduction: 0.2,
          appetiteReduction: 0.1,
          socialBehaviorChange: 0.4,
          lifespanReduction: 1,
          increaseAggression: true,
          decreaseGrooming: false,
          alterForaging: false,
          changeNestBehavior: false
        }
      ],
      treatmentOptions: [],
      preventionMethods: []
    });
  }

  private initializeTreatments(): void {
    this.treatments.set('basic_care', {
      name: 'Basic Supportive Care',
      type: 'supportive',
      effectiveness: 0.3,
      sideEffects: [],
      duration: 7,
      availability: 1.0,
      cost: new Map([['energy', 5], ['time', 10]])
    });

    this.treatments.set('antifungal', {
      name: 'Antifungal Treatment',
      type: 'antifungal',
      effectiveness: 0.7,
      sideEffects: [],
      duration: 14,
      availability: 0.3,
      cost: new Map([['special_resources', 10], ['energy', 15]])
    });

    this.treatments.set('antibiotic', {
      name: 'Antibiotic Treatment',
      type: 'antibiotic',
      effectiveness: 0.8,
      sideEffects: [],
      duration: 5,
      availability: 0.4,
      cost: new Map([['medical_supplies', 5], ['energy', 10]])
    });
  }

  private initializePreventionMeasures(): void {
    this.preventionMeasures.set('hygiene', {
      name: 'Colony Hygiene Protocol',
      type: 'hygiene',
      effectiveness: 0.4,
      implementationCost: new Map([['energy', 20], ['time', 30]]),
      maintenanceCost: new Map([['energy', 5]]),
      duration: 30,
      socialImpact: 0.1
    });

    this.preventionMeasures.set('quarantine', {
      name: 'Infected Ant Quarantine',
      type: 'quarantine',
      effectiveness: 0.8,
      implementationCost: new Map([['space', 10], ['energy', 15]]),
      maintenanceCost: new Map([['energy', 3], ['food', 2]]),
      duration: 21,
      socialImpact: 0.4
    });

    this.preventionMeasures.set('waste_management', {
      name: 'Waste Management System',
      type: 'environmental',
      effectiveness: 0.5,
      implementationCost: new Map([['energy', 30], ['materials', 20]]),
      maintenanceCost: new Map([['energy', 8]]),
      duration: 60,
      socialImpact: 0.0
    });
  }

  // Main simulation methods

  public simulateDay(
    populationData: any,
    environmentalFactors: Map<string, number>,
    colonyStress: number
  ): void {
    // Update environmental contamination
    this.updateEnvironmentalContamination(environmentalFactors);

    // Process existing infections
    this.progressInfections();

    // Simulate new infections
    this.simulateTransmission(populationData, environmentalFactors);

    // Update immune responses
    this.updateImmuneResponses();

    // Process treatments
    this.processTreatments();

    // Update colony health metrics
    this.updateColonyHealth(populationData, colonyStress);

    // Check for outbreak conditions
    this.detectOutbreaks();

    // Apply prevention measures
    this.applyPreventionMeasures();
  }

  private updateEnvironmentalContamination(environmentalFactors: Map<string, number>): void {
    const temperature = environmentalFactors.get('temperature') || 20;
    const humidity = environmentalFactors.get('humidity') || 0.5;
    const rainfall = environmentalFactors.get('rainfall') || 0;

    // Rain reduces environmental contamination
    const rainReduction = rainfall * 0.3;

    for (const [location, contamination] of this.environmentalContamination) {
      let newContamination = contamination;

      // Natural decay based on temperature and humidity
      const decayRate = this.calculateEnvironmentalDecay(temperature, humidity);
      newContamination *= (1 - decayRate);

      // Rain washout
      newContamination *= (1 - rainReduction);

      this.environmentalContamination.set(location, Math.max(0, newContamination));
    }
  }

  private calculateEnvironmentalDecay(temperature: number, humidity: number): number {
    // Higher temperature and lower humidity increase pathogen decay
    const tempFactor = Math.max(0, (temperature - 15) / 30); // Normalized 15-45°C
    const humidityFactor = Math.max(0, (0.8 - humidity) / 0.8); // Inverse humidity effect
    
    return Math.min(0.1, (tempFactor + humidityFactor) * 0.05);
  }

  private progressInfections(): void {
    const currentTime = Date.now();

    for (const [antId, antInfections] of this.infections) {
      for (let i = antInfections.length - 1; i >= 0; i--) {
        const infection = antInfections[i];
        const pathogen = this.pathogens.get(infection.pathogenId);
        
        if (!pathogen) continue;

        const daysSinceInfection = (currentTime - infection.infectionDate) / (1000 * 60 * 60 * 24);

        // Update infection stage
        this.updateInfectionStage(infection, pathogen, daysSinceInfection);

        // Update transmissibility
        this.updateTransmissibility(infection, pathogen, daysSinceInfection);

        // Check for recovery or death
        if (this.checkInfectionOutcome(infection, pathogen, daysSinceInfection)) {
          antInfections.splice(i, 1); // Remove resolved infection
        }
      }

      // Remove ants with no infections
      if (antInfections.length === 0) {
        this.infections.delete(antId);
      }
    }
  }

  private updateInfectionStage(infection: Infection, pathogen: Pathogen, daysSinceInfection: number): void {
    if (daysSinceInfection < pathogen.incubationPeriod) {
      infection.stage = DiseaseStage.INCUBATION;
    } else if (daysSinceInfection < pathogen.incubationPeriod + pathogen.acutePeriod) {
      infection.stage = DiseaseStage.ACUTE;
      if (!infection.symptomsOnset) {
        infection.symptomsOnset = Date.now();
      }
    } else if (daysSinceInfection < pathogen.incubationPeriod + pathogen.acutePeriod + pathogen.recoveryPeriod) {
      infection.stage = DiseaseStage.RECOVERY;
    } else {
      infection.stage = DiseaseStage.IMMUNE;
    }
  }

  private updateTransmissibility(infection: Infection, pathogen: Pathogen, daysSinceInfection: number): void {
    switch (infection.stage) {
      case DiseaseStage.INCUBATION:
        infection.transmissibility = pathogen.infectivity * 0.3; // Low but present
        break;
      case DiseaseStage.ACUTE:
        infection.transmissibility = pathogen.infectivity; // Peak transmissibility
        break;
      case DiseaseStage.RECOVERY:
        infection.transmissibility = pathogen.infectivity * 0.1; // Declining
        break;
      default:
        infection.transmissibility = 0;
    }

    // Adjust based on immune response
    const immuneReduction = infection.immuneResponse.strength * 0.5;
    infection.transmissibility *= (1 - immuneReduction);
  }

  private checkInfectionOutcome(infection: Infection, pathogen: Pathogen, daysSinceInfection: number): boolean {
    const totalDuration = pathogen.incubationPeriod + pathogen.acutePeriod + pathogen.recoveryPeriod;
    
    if (daysSinceInfection >= totalDuration) {
      // Check for death
      const mortalityChance = pathogen.mortalityRate * (1 - infection.immuneResponse.strength);
      if (Math.random() < mortalityChance) {
        this.handleAntDeath(infection.antId, infection.pathogenId);
      } else {
        this.handleAntRecovery(infection.antId, infection.pathogenId, pathogen.immunityDuration);
      }
      return true; // Infection resolved
    }
    
    return false; // Infection continues
  }

  private simulateTransmission(populationData: any, environmentalFactors: Map<string, number>): void {
    // Get all infectious ants
    const infectiousAnts = this.getInfectiousAnts();
    
    if (infectiousAnts.length === 0) return;

    // Simulate transmission events
    for (const infectiousAnt of infectiousAnts) {
      this.simulateAntTransmission(infectiousAnt, populationData, environmentalFactors);
    }
  }

  private getInfectiousAnts(): Array<{antId: string, infections: Infection[]}> {
    const infectious = [];
    
    for (const [antId, infections] of this.infections) {
      const activeInfections = infections.filter(inf => inf.transmissibility > 0);
      if (activeInfections.length > 0) {
        infectious.push({ antId, infections: activeInfections });
      }
    }
    
    return infectious;
  }

  private simulateAntTransmission(
    infectiousAnt: {antId: string, infections: Infection[]},
    populationData: any,
    environmentalFactors: Map<string, number>
  ): void {
    // Get potential contacts (simplified - in real implementation would use spatial data)
    const potentialContacts = this.getPotentialContacts(infectiousAnt.antId, populationData);

    for (const infection of infectiousAnt.infections) {
      const pathogen = this.pathogens.get(infection.pathogenId);
      if (!pathogen) continue;

      // Environmental transmission
      this.simulateEnvironmentalTransmission(infection, pathogen, environmentalFactors);

      // Direct transmission
      for (const contactAntId of potentialContacts) {
        this.attemptTransmission(infection, contactAntId, TransmissionMode.DIRECT_CONTACT, pathogen);
      }
    }
  }

  private getPotentialContacts(antId: string, populationData: any): string[] {
    // Simplified - return random sample of population
    // In real implementation, would use spatial proximity
    const totalPopulation = populationData.totalPopulation || 100;
    const maxContacts = Math.min(10, Math.floor(totalPopulation * 0.1));
    
    const contacts = [];
    for (let i = 0; i < maxContacts; i++) {
      contacts.push(`ant_${Math.floor(Math.random() * totalPopulation)}`);
    }
    
    return contacts.filter(id => id !== antId);
  }

  private simulateEnvironmentalTransmission(
    infection: Infection,
    pathogen: Pathogen,
    environmentalFactors: Map<string, number>
  ): void {
    if (!pathogen.transmissionModes.includes(TransmissionMode.ENVIRONMENTAL)) return;

    // Add contamination to environment
    const contamination = infection.transmissibility * pathogen.environmentalSurvival;
    const locationKey = `${infection.location.x},${infection.location.y}`;
    
    const currentContamination = this.environmentalContamination.get(locationKey) || 0;
    this.environmentalContamination.set(locationKey, currentContamination + contamination);
  }

  private attemptTransmission(
    infection: Infection,
    targetAntId: string,
    transmissionMode: TransmissionMode,
    pathogen: Pathogen
  ): void {
    // Check if target ant is already infected with this pathogen
    if (this.isAntInfected(targetAntId, pathogen.id)) return;

    // Check if target ant is immune
    if (this.isAntImmune(targetAntId, pathogen.id)) return;

    // Calculate transmission probability
    const transmissionProbability = this.calculateTransmissionProbability(
      infection,
      targetAntId,
      transmissionMode,
      pathogen
    );

    // Attempt transmission
    if (Math.random() < transmissionProbability) {
      this.infectAnt(targetAntId, pathogen.id, infection.antId, transmissionMode, infection.location);
    }
  }

  private calculateTransmissionProbability(
    infection: Infection,
    targetAntId: string,
    transmissionMode: TransmissionMode,
    pathogen: Pathogen
  ): number {
    let baseProbability = infection.transmissibility;

    // Adjust for transmission mode
    const modeModifier = this.getTransmissionModeModifier(transmissionMode, pathogen);
    baseProbability *= modeModifier;

    // Adjust for target ant's immune system
    const targetImmuneStrength = this.getAntImmuneStrength(targetAntId);
    baseProbability *= (1 - targetImmuneStrength * 0.5);

    // Adjust for prevention measures
    const preventionReduction = this.getPreventionReduction(transmissionMode);
    baseProbability *= (1 - preventionReduction);

    // Adjust for colony hygiene
    baseProbability *= (1 - this.colonyHealth.hygieneLevel * 0.3);

    return Math.max(0, Math.min(1, baseProbability));
  }

  private getTransmissionModeModifier(mode: TransmissionMode, pathogen: Pathogen): number {
    if (!pathogen.transmissionModes.includes(mode)) return 0;

    switch (mode) {
      case TransmissionMode.DIRECT_CONTACT: return 1.0;
      case TransmissionMode.AIRBORNE: return 0.7;
      case TransmissionMode.FOOD_BORNE: return 0.8;
      case TransmissionMode.ENVIRONMENTAL: return 0.4;
      case TransmissionMode.WOUND: return 1.2;
      case TransmissionMode.VECTOR_BORNE: return 0.6;
      default: return 0.5;
    }
  }

  private getAntImmuneStrength(antId: string): number {
    // Simplified - in real implementation would track individual ant immune systems
    return this.colonyHealth.immuneSystemStrength + (Math.random() - 0.5) * 0.3;
  }

  private getPreventionReduction(transmissionMode: TransmissionMode): number {
    let reduction = 0;

    // Check active prevention measures
    for (const [measureId, measure] of this.preventionMeasures) {
      if (this.isMeasureActive(measureId)) {
        if (measure.type === 'hygiene' && 
            [TransmissionMode.DIRECT_CONTACT, TransmissionMode.FOOD_BORNE].includes(transmissionMode)) {
          reduction += measure.effectiveness * 0.5;
        }
        if (measure.type === 'quarantine' && transmissionMode === TransmissionMode.DIRECT_CONTACT) {
          reduction += measure.effectiveness * 0.8;
        }
        if (measure.type === 'environmental' && transmissionMode === TransmissionMode.ENVIRONMENTAL) {
          reduction += measure.effectiveness;
        }
      }
    }

    return Math.min(0.9, reduction); // Cap at 90% reduction
  }

  private isMeasureActive(measureId: string): boolean {
    // Simplified - would track active measures and their duration
    return this.colonyHealth.hygieneLevel > 0.5; // Placeholder logic
  }

  // Infection management methods

  public infectAnt(
    antId: string,
    pathogenId: string,
    sourceAntId: string,
    transmissionMode: TransmissionMode,
    location: { x: number; y: number; z: number }
  ): void {
    const pathogen = this.pathogens.get(pathogenId);
    if (!pathogen) return;

    const infection: Infection = {
      pathogenId,
      antId,
      infectionDate: Date.now(),
      stage: DiseaseStage.INCUBATION,
      severity: pathogen.virulence,
      transmissibility: 0,
      sourceAntId,
      transmissionMode,
      location,
      immuneResponse: {
        strength: this.getAntImmuneStrength(antId),
        adaptation: 0.1,
        antibodyLevel: 0,
        memoryBCells: 0,
        compromised: false,
        autoimmune: false,
        allergicReaction: false
      }
    };

    // Add to infections map
    if (!this.infections.has(antId)) {
      this.infections.set(antId, []);
    }
    this.infections.get(antId)!.push(infection);

    // Update outbreak tracking
    this.updateOutbreakTracking(pathogenId, antId, sourceAntId);
  }

  private updateOutbreakTracking(pathogenId: string, newAntId: string, sourceAntId?: string): void {
    let outbreak = this.outbreaks.get(pathogenId);
    
    if (!outbreak) {
      // Create new outbreak
      outbreak = {
        id: `outbreak_${pathogenId}_${Date.now()}`,
        pathogenId,
        startDate: Date.now(),
        primaryCase: sourceAntId || newAntId,
        infectedAnts: new Set([newAntId]),
        recoveredAnts: new Set(),
        deceasedAnts: new Set(),
        basicReproductionNumber: 0,
        effectiveReproductionNumber: 0,
        incidenceRate: 1,
        prevalenceRate: 0,
        mortalityRate: 0,
        controlMeasures: [],
        hotspots: []
      };
      this.outbreaks.set(pathogenId, outbreak);
    } else {
      outbreak.infectedAnts.add(newAntId);
    }
  }

  // Query methods

  public isAntInfected(antId: string, pathogenId?: string): boolean {
    const infections = this.infections.get(antId);
    if (!infections) return false;

    if (pathogenId) {
      return infections.some(inf => inf.pathogenId === pathogenId);
    }
    return infections.length > 0;
  }

  public isAntImmune(antId: string, pathogenId: string): boolean {
    // Simplified immunity check - would track individual immunity records
    return Math.random() < this.colonyHealth.diseaseResistance * 0.3;
  }

  public getAntInfections(antId: string): Infection[] {
    return this.infections.get(antId) || [];
  }

  public getColonyHealthStatus(): ColonyHealthStatus {
    return { ...this.colonyHealth };
  }

  public getActiveOutbreaks(): DiseaseOutbreak[] {
    return Array.from(this.outbreaks.values()).filter(outbreak => !outbreak.endDate);
  }

  public getPathogen(pathogenId: string): Pathogen | undefined {
    return this.pathogens.get(pathogenId);
  }

  public getAllPathogens(): Pathogen[] {
    return Array.from(this.pathogens.values());
  }

  // Additional methods would include:
  // - updateImmuneResponses()
  // - processTreatments()
  // - updateColonyHealth()
  // - detectOutbreaks()
  // - applyPreventionMeasures()
  // - handleAntDeath()
  // - handleAntRecovery()
  // - And many more specialized methods...

  private updateImmuneResponses(): void {
    // Implementation for immune system updates
  }

  private processTreatments(): void {
    // Implementation for treatment processing
  }

  private updateColonyHealth(populationData: any, colonyStress: number): void {
    // Implementation for colony health updates
  }

  private detectOutbreaks(): void {
    // Implementation for outbreak detection
  }

  private applyPreventionMeasures(): void {
    // Implementation for prevention measures
  }

  private handleAntDeath(antId: string, pathogenId: string): void {
    // Implementation for ant death handling
  }

  private handleAntRecovery(antId: string, pathogenId: string, immunityDuration: number): void {
    // Implementation for ant recovery handling
  }
}